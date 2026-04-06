from django.db import models
from django.conf import settings
import uuid


class Doctor(models.Model):
    """Doctor belongs to ONE hospital only."""
    STATUS_CHOICES = [
        ('on_duty', 'On Duty'),
        ('break', 'Break'),
        ('off_duty', 'Off Duty'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='doctor_profile')
    doctor_id = models.CharField(max_length=20, unique=True)
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.CASCADE, related_name='doctors')
    full_name = models.CharField(max_length=200)
    department = models.CharField(max_length=100)
    specialisation = models.CharField(max_length=200, blank=True)
    registration_no = models.CharField(max_length=50, blank=True)
    experience_years = models.IntegerField(default=0)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='on_duty')
    hospital_name = models.CharField(max_length=200, default='', blank=True)  # backward compat
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.doctor_id})"

    @property
    def active_patient_count(self):
        return self.assigned_patients.filter(status='active').count()


class Appointment(models.Model):
    """Appointment is tied to one hospital via the doctor's hospital."""
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('critical', 'Critical'),
    ]
    TYPE_CHOICES = [
        ('new', 'New Patient'),
        ('follow_up', 'Follow-up'),
        ('emergency', 'Emergency'),
        ('routine', 'Routine'),
        ('post_op', 'Post-op'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='appointments')
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    time = models.TimeField()
    appointment_type = models.CharField(max_length=15, choices=TYPE_CHOICES, default='new')
    complaint = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='upcoming')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return f"{self.doctor.full_name} → {self.patient.full_name} @ {self.date} {self.time}"

    def save(self, *args, **kwargs):
        # Auto-assign hospital from doctor if not set
        if not self.hospital_id:
            self.hospital = self.doctor.hospital
        super().save(*args, **kwargs)