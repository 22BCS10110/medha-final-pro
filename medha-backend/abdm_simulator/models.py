"""
ABDM Simulator — Models
========================
Simulates ABDM (Ayushman Bharat Digital Mission) entities for demo/pilot.

Models:
  - ABHARecord    → ABHA ID registration & linking
  - ConsentRequest → Consent flow between doctor and patient
  - ConsentArtifact → Approved consent document (mock NDHM artifact)
  - HIUDataRequest → Health Information User data fetch simulation
  - AuditLog       → Immutable compliance audit trail

IMPORTANT: This module is designed to be 1:1 replaceable with real ABDM APIs.
           All model fields mirror ABDM specification schemas.
"""
import uuid
import random
import string
from django.db import models
from django.utils import timezone


# ─────────────────────────────────────────────────────────────────────
# ABHA RECORD
# ─────────────────────────────────────────────────────────────────────
class ABHARecord(models.Model):
    """
    Simulated ABHA (Ayushman Bharat Health Account) registration.
    In production, this maps to the ABHA Registry at abha.abdm.gov.in.
    """
    LINK_METHOD_CHOICES = [
        ('aadhaar', 'Aadhaar OTP'),
        ('mobile', 'Mobile OTP'),
        ('nfc', 'NFC Card Tap'),
        ('manual', 'Manual Entry'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.OneToOneField(
        'patients.Patient', on_delete=models.CASCADE,
        related_name='abha_record', null=True, blank=True
    )
    abha_number = models.CharField(
        max_length=20, unique=True,
        help_text='14-digit ABHA number (XX-XXXX-XXXX-XXXX)'
    )
    abha_address = models.CharField(
        max_length=50, unique=True, blank=True,
        help_text='ABHA address (user@abdm)'
    )
    full_name = models.CharField(max_length=200)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    linked_via = models.CharField(max_length=20, choices=LINK_METHOD_CHOICES, default='mobile')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    verified = models.BooleanField(default=False)
    # Hospital that registered this ABHA
    registered_at_hospital = models.ForeignKey(
        'hospitals.Hospital', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='abha_registrations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'ABHA Record'
        verbose_name_plural = 'ABHA Records'

    def __str__(self):
        return f"ABHA {self.abha_number} — {self.full_name}"

    @staticmethod
    def generate_abha_number():
        """Generate a realistic 14-digit ABHA number: XX-XXXX-XXXX-XXXX"""
        digits = ''.join([str(random.randint(0, 9)) for _ in range(14)])
        return f"{digits[:2]}-{digits[2:6]}-{digits[6:10]}-{digits[10:14]}"

    @staticmethod
    def generate_abha_address(name):
        """Generate ABHA address like firstname.lastname@abdm"""
        parts = name.lower().strip().split()
        if len(parts) >= 2:
            base = f"{parts[0]}.{parts[-1]}"
        else:
            base = parts[0] if parts else 'user'
        suffix = ''.join(random.choices(string.digits, k=4))
        return f"{base}{suffix}@abdm"


# ─────────────────────────────────────────────────────────────────────
# CONSENT REQUEST
# ─────────────────────────────────────────────────────────────────────
class ConsentRequest(models.Model):
    """
    Simulates ABDM Consent Manager consent request.
    In production, this maps to POST /consent-requests/init on NDHM gateway.
    """
    PURPOSE_CHOICES = [
        ('CAREMGT', 'Care Management'),
        ('BTG', 'Break the Glass (Emergency)'),
        ('PUBHLTH', 'Public Health'),
        ('HPAYMT', 'Healthcare Payment'),
        ('DSRCH', 'Disease Specific Research'),
    ]
    HI_TYPE_CHOICES = [
        ('Prescription', 'Prescription'),
        ('DiagnosticReport', 'Diagnostic Report'),
        ('DischargeSummary', 'Discharge Summary'),
        ('OPConsultation', 'OP Consultation'),
        ('ImmunizationRecord', 'Immunization Record'),
        ('HealthDocumentRecord', 'Health Document'),
        ('WellnessRecord', 'Wellness Record'),
    ]
    STATUS_CHOICES = [
        ('REQUESTED', 'Requested'),
        ('GRANTED', 'Granted'),
        ('DENIED', 'Denied'),
        ('EXPIRED', 'Expired'),
        ('REVOKED', 'Revoked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    consent_request_id = models.CharField(
        max_length=100, unique=True, editable=False,
        help_text='Unique consent request ID (simulates ABDM consent ID)'
    )
    # Who is requesting
    requester_doctor = models.ForeignKey(
        'doctors.Doctor', on_delete=models.CASCADE,
        related_name='consent_requests'
    )
    requester_hospital = models.ForeignKey(
        'hospitals.Hospital', on_delete=models.CASCADE,
        related_name='consent_requests'
    )
    # Whose data
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE,
        related_name='consent_requests'
    )
    patient_abha_id = models.CharField(max_length=20)

    # What data
    purpose = models.CharField(max_length=10, choices=PURPOSE_CHOICES, default='CAREMGT')
    hi_types = models.JSONField(
        default=list,
        help_text='List of health information types requested'
    )
    date_range_from = models.DateField()
    date_range_to = models.DateField()

    # Status tracking
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='REQUESTED')
    status_message = models.TextField(blank=True)
    granted_at = models.DateTimeField(null=True, blank=True)
    denied_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Consent Request'

    def __str__(self):
        return f"Consent {self.consent_request_id} — {self.status}"

    def save(self, *args, **kwargs):
        if not self.consent_request_id:
            self.consent_request_id = f"CR-{uuid.uuid4().hex[:12].upper()}"
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=30)
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────────
# CONSENT ARTIFACT
# ─────────────────────────────────────────────────────────────────────
class ConsentArtifact(models.Model):
    """
    Simulates ABDM Consent Artifact — the signed document proving consent.
    In production, this is a digitally signed JSON from ABDM Consent Manager.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    consent_request = models.OneToOneField(
        ConsentRequest, on_delete=models.CASCADE,
        related_name='artifact'
    )
    artifact_id = models.CharField(max_length=100, unique=True, editable=False)
    # The full artifact payload (simulated ABDM format)
    artifact_json = models.JSONField(
        help_text='Full mock consent artifact in ABDM JSON format'
    )
    signature = models.TextField(
        blank=True,
        help_text='Simulated digital signature (base64)'
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField()

    class Meta:
        verbose_name = 'Consent Artifact'

    def __str__(self):
        return f"Artifact {self.artifact_id}"

    def save(self, *args, **kwargs):
        if not self.artifact_id:
            self.artifact_id = f"CA-{uuid.uuid4().hex[:16].upper()}"
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────────
# HIU DATA REQUEST
# ─────────────────────────────────────────────────────────────────────
class HIUDataRequest(models.Model):
    """
    Simulates a Health Information User (HIU) data fetch request.
    In production, this calls NDHM Health Information Exchange.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('FETCHING', 'Fetching'),
        ('COMPLETE', 'Complete'),
        ('FAILED', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request_id = models.CharField(max_length=100, unique=True, editable=False)
    consent_artifact = models.ForeignKey(
        ConsentArtifact, on_delete=models.CASCADE,
        related_name='data_requests'
    )
    requesting_doctor = models.ForeignKey(
        'doctors.Doctor', on_delete=models.CASCADE,
        related_name='hiu_requests'
    )
    patient_abha_id = models.CharField(max_length=20)
    data_types = models.JSONField(default=list)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    # Fetched FHIR data (mock)
    fhir_bundle = models.JSONField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'HIU Data Request'

    def __str__(self):
        return f"HIU {self.request_id} — {self.status}"

    def save(self, *args, **kwargs):
        if not self.request_id:
            self.request_id = f"HIU-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)


# ─────────────────────────────────────────────────────────────────────
# AUDIT LOG
# ─────────────────────────────────────────────────────────────────────
class ABDMAuditLog(models.Model):
    """
    Immutable audit log for all ABDM-related operations.
    This table is APPEND-ONLY — no updates or deletes permitted.
    """
    ACTION_CHOICES = [
        ('ABHA_CREATED', 'ABHA Created'),
        ('ABHA_LINKED', 'ABHA Linked'),
        ('ABHA_VERIFIED', 'ABHA Verified'),
        ('CONSENT_REQUESTED', 'Consent Requested'),
        ('CONSENT_GRANTED', 'Consent Granted'),
        ('CONSENT_DENIED', 'Consent Denied'),
        ('CONSENT_REVOKED', 'Consent Revoked'),
        ('DATA_REQUESTED', 'Data Requested'),
        ('DATA_FETCHED', 'Data Fetched'),
        ('DATA_ACCESSED', 'Data Accessed'),
        ('PATIENT_DISCOVERED', 'Patient Discovered'),
    ]

    id = models.BigAutoField(primary_key=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    actor_user_id = models.IntegerField(null=True, blank=True)
    actor_role = models.CharField(max_length=20, blank=True)
    patient_abha_id = models.CharField(max_length=20, blank=True, db_index=True)
    consent_request_id = models.CharField(max_length=100, blank=True)
    hospital_id = models.UUIDField(null=True, blank=True)
    resource_type = models.CharField(max_length=50, blank=True)
    resource_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.JSONField(default=dict)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'ABDM Audit Log'

    def __str__(self):
        return f"[{self.timestamp}] {self.action} — ABHA:{self.patient_abha_id}"
