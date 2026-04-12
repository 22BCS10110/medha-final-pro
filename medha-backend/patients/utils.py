import logging
import threading
import time
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def generate_card_number():
    """Generate a unique card number for patient cards."""
    timestamp = str(int(time.time()))
    return f"CARD-{timestamp}-{uuid.uuid4().hex[:6].upper()}"


def generate_patient_id():
    """Generate a unique patient ID."""
    from .models import Patient

    last_patient = Patient.objects.order_by('-id').first()
    next_num = 4500
    if last_patient and last_patient.patient_id:
        parts = last_patient.patient_id.split('-')
        if len(parts) == 2 and parts[0] == 'MHD' and parts[1].isdigit():
            next_num = int(parts[1]) + 1

    patient_id = f"MHD-{next_num}"
    while Patient.objects.filter(patient_id=patient_id).exists():
        next_num += 1
        patient_id = f"MHD-{next_num}"

    return patient_id


def generate_doctor_id():
    """Generate a unique doctor ID."""
    from doctors.models import Doctor

    last_doctor = Doctor.objects.order_by('-id').first()
    next_num = 1000
    if last_doctor and last_doctor.doctor_id:
        parts = last_doctor.doctor_id.split('-')
        if len(parts) == 2 and parts[0] == 'DOC' and parts[1].isdigit():
            next_num = int(parts[1]) + 1

    doctor_id = f"DOC-{next_num}"
    from django.db.models import Q
    while Doctor.objects.filter(doctor_id=doctor_id).exists():
        next_num += 1
        doctor_id = f"DOC-{next_num}"

    return doctor_id


_SUPABASE_MAX_RETRIES = 2
_SUPABASE_TIMEOUT = 8       # seconds per attempt
_SUPABASE_BACKOFF_BASE = 1  # seconds; doubles each retry


def _push_patient_to_supabase(patient):
    """
    Internal: POST a Django Patient record to Supabase via REST API.
    Called from a background thread — failures are logged, never raised.
    Retries up to _SUPABASE_MAX_RETRIES times with exponential back-off.
    """
    import requests
    from django.conf import settings
    from django.utils import timezone as dj_timezone

    url = getattr(settings, 'SUPABASE_URL', '').strip()
    key = getattr(settings, 'SUPABASE_SERVICE_KEY', '').strip()

    if not url or not key:
        logger.debug(
            'Supabase sync skipped for patient %s: '
            'SUPABASE_URL or SUPABASE_SERVICE_KEY not configured.',
            patient.patient_id,
        )
        return

    endpoint = f'{url.rstrip("/")}/rest/v1/patients'
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates',
    }

    # Build payload — always use explicit None instead of falsy defaults so
    # Supabase can distinguish "not provided" from an empty string.
    created_at = patient.created_at
    if created_at is not None and dj_timezone.is_naive(created_at):
        created_at = dj_timezone.make_aware(created_at)

    payload = {
        'patient_id': patient.patient_id,
        'full_name': patient.full_name,
        'email': patient.email or None,
        'phone': patient.phone or None,
        'date_of_birth': str(patient.date_of_birth) if patient.date_of_birth else None,
        'gender': patient.gender or None,        # preserve None — don't default to 'M'
        'blood_group': patient.blood_group or None,
        'allergies': patient.allergies or None,
        'abha_id': patient.abha_id or None,
        'status': patient.status or 'active',
        'created_at': created_at.isoformat() if created_at else None,
    }

    logger.debug(
        'Supabase sync starting for patient %s (endpoint: %s)',
        patient.patient_id, endpoint,
    )

    last_exc = None
    for attempt in range(1, _SUPABASE_MAX_RETRIES + 2):  # attempts: 1, 2, 3
        try:
            response = requests.post(
                endpoint, json=payload, headers=headers,
                timeout=_SUPABASE_TIMEOUT,
            )
            if response.status_code in (200, 201):
                logger.info(
                    'Supabase sync OK: patient %s synced on attempt %d.',
                    patient.patient_id, attempt,
                )
                return
            # 4xx errors (bad payload/auth) are not worth retrying
            if 400 <= response.status_code < 500:
                logger.error(
                    'Supabase sync permanent failure for patient %s: '
                    'HTTP %d — %s',
                    patient.patient_id, response.status_code, response.text[:300],
                )
                return
            # 5xx — log and retry
            logger.warning(
                'Supabase sync attempt %d/%d failed for patient %s: '
                'HTTP %d — %s',
                attempt, _SUPABASE_MAX_RETRIES + 1,
                patient.patient_id, response.status_code, response.text[:200],
            )
        except requests.Timeout:
            logger.warning(
                'Supabase sync attempt %d/%d timed out for patient %s '
                '(timeout=%ds).',
                attempt, _SUPABASE_MAX_RETRIES + 1,
                patient.patient_id, _SUPABASE_TIMEOUT,
            )
            last_exc = 'Timeout'
        except requests.ConnectionError as exc:
            logger.warning(
                'Supabase sync attempt %d/%d connection error for patient %s: %s',
                attempt, _SUPABASE_MAX_RETRIES + 1, patient.patient_id, exc,
            )
            last_exc = exc
        except Exception as exc:  # noqa: BLE001
            logger.error(
                'Supabase sync unexpected error for patient %s: %s',
                patient.patient_id, exc, exc_info=True,
            )
            return  # non-network errors won't recover on retry

        if attempt <= _SUPABASE_MAX_RETRIES:
            backoff = _SUPABASE_BACKOFF_BASE * (2 ** (attempt - 1))
            logger.debug(
                'Supabase sync: retrying patient %s in %ds…',
                patient.patient_id, backoff,
            )
            time.sleep(backoff)

    logger.error(
        'Supabase sync gave up for patient %s after %d attempts. Last error: %s',
        patient.patient_id, _SUPABASE_MAX_RETRIES + 1, last_exc,
    )


def sync_patient_to_supabase(patient):
    """
    Fire-and-forget Supabase sync.
    Runs in a daemon thread so it never blocks the Django response.

    Production note: replace this thread with a Celery task for reliability —
    daemon threads are silently killed on worker restart and have no retry
    visibility.  Example:
        sync_patient_to_supabase_task.delay(patient.pk)
    """
    logger.info(
        'Supabase sync enqueued for patient %s (background thread).',
        patient.patient_id,
    )
    t = threading.Thread(
        target=_push_patient_to_supabase,
        args=(patient,),
        daemon=True,
        name=f'supabase-sync-{patient.patient_id}',
    )
    t.start()