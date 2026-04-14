"""
One-Time Consent System
Triggered after first NFC scan. Stored in DB. Not asked repeatedly.
Patient can revoke consent at any time.
"""
import uuid
from django.db import models


class PatientConsent(models.Model):
    """
    Tracks one-time consent per patient.
    Created when patient first taps NFC card at any hospital.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('granted', 'Granted'),
        ('revoked', 'Revoked'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.OneToOneField(
        'patients.Patient', on_delete=models.CASCADE,
        related_name='consent',
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    # What was consented
    consent_text = models.TextField(
        default=(
            "I consent to share my health records with authorized healthcare "
            "providers via the Medha Health platform for the purpose of care management."
        )
    )
    # Consent metadata
    granted_at = models.DateTimeField(null=True, blank=True)
    granted_via = models.CharField(max_length=20, blank=True, help_text='nfc, web, mobile')
    granted_at_hospital = models.ForeignKey(
        'hospitals.Hospital', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='consents_granted',
    )
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoke_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Patient Consent'

    def __str__(self):
        return f"Consent {self.patient.full_name}: {self.status}"

    @property
    def is_active(self):
        return self.status == 'granted'
