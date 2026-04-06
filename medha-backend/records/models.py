from django.db import models
import uuid


class HealthRecord(models.Model):
    """Health record tied to a hospital visit (via the doctor's hospital)."""
    TYPE_CHOICES = [
        ('follow_up', 'Follow-up'),
        ('diagnostic', 'Diagnostic'),
        ('routine', 'Routine'),
        ('emergency', 'Emergency'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='health_records')
    doctor = models.ForeignKey('doctors.Doctor', on_delete=models.SET_NULL, null=True, related_name='health_records')
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.CASCADE, related_name='health_records')
    date = models.DateField()
    diagnosis = models.TextField()
    record_type = models.CharField(max_length=15, choices=TYPE_CHOICES, default='routine')
    notes = models.TextField(blank=True)
    ai_summary = models.TextField(blank=True)
    ai_confidence = models.FloatField(null=True, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.patient.full_name} — {self.diagnosis[:50]} ({self.date})"

    def save(self, *args, **kwargs):
        if not self.hospital_id and self.doctor:
            self.hospital = self.doctor.hospital
        super().save(*args, **kwargs)


class Prescription(models.Model):
    """Prescription tied to a hospital visit."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey('doctors.Doctor', on_delete=models.SET_NULL, null=True, related_name='prescriptions')
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.CASCADE, related_name='prescriptions')
    medicine = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    duration = models.CharField(max_length=50)
    date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    ddi_alerts = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.medicine} for {self.patient.full_name}"

    def save(self, *args, **kwargs):
        if not self.hospital_id and self.doctor:
            self.hospital = self.doctor.hospital
        super().save(*args, **kwargs)


class Vital(models.Model):
    """Vitals - tied to a hospital visit for context."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='vitals')
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.CASCADE, null=True, blank=True, related_name='vitals')
    blood_pressure = models.CharField(max_length=20, blank=True)
    heart_rate = models.IntegerField(null=True, blank=True)
    spo2 = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"Vitals for {self.patient.full_name} @ {self.recorded_at}"