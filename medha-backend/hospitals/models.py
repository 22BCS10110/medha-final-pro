import uuid
from django.db import models


class Hospital(models.Model):
    """
    Represents a hospital in the multi-tenant system.
    Each hospital has its own admin, doctors, appointments, and records.
    Patients are GLOBAL and can access any hospital's data via their patient ID.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('inactive', 'Inactive'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital_id = models.CharField(max_length=20, unique=True, editable=False)
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    gstin = models.CharField(max_length=20, blank=True, default='')
    abdm_hip_id = models.CharField(max_length=50, blank=True, default='')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.hospital_id})"

    def save(self, *args, **kwargs):
        # Auto-generate hospital_id if not set
        if not self.hospital_id:
            prefix = 'HOSP'
            last_hospital = Hospital.objects.order_by('-id').first()
            next_num = 1
            if last_hospital and last_hospital.hospital_id:
                parts = last_hospital.hospital_id.split('-')
                if parts[-1].isdigit():
                    next_num = int(parts[-1]) + 1
            self.hospital_id = f"{prefix}-{next_num:04d}"
        super().save(*args, **kwargs)