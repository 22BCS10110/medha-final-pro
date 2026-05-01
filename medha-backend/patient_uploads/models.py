import uuid
from django.db import models


class PatientUpload(models.Model):
    TYPE_CHOICES = [
        ('prescription', 'Prescription PDF'),
        ('lab_report', 'Lab Report'),
        ('diagnostic', 'Diagnostic Report'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='uploads'
    )
    doctor = models.ForeignKey(
        'doctors.Doctor', on_delete=models.SET_NULL, null=True, blank=True, related_name='uploads'
    )
    hospital = models.ForeignKey(
        'hospitals.Hospital', on_delete=models.SET_NULL, null=True, blank=True, related_name='uploads'
    )
    file = models.FileField(upload_to='patient_uploads/%Y/%m/')
    file_name = models.CharField(max_length=255)
    upload_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='prescription')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file_name} — {self.patient} ({self.upload_type})"
