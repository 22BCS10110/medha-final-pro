from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),       # Controls all hospitals
        ('hospital_admin', 'Hospital Admin'),  # Controls one hospital
        ('doctor', 'Doctor'),                  # One hospital's doctors
        ('patient', 'Patient'),                # Global access
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    phone = models.CharField(max_length=15, blank=True)
    # FK to Hospital - null for super_admin and patients (patients are global)
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    # Keep hospital_name for backward compatibility during migration
    hospital_name = models.CharField(max_length=200, blank=True)
    user_id_code = models.CharField(max_length=20, blank=True, unique=True, null=True)

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def hospital_id(self):
        """Return the hospital ID if user belongs to a hospital"""
        return self.hospital.id if self.hospital else None

    @property
    def hospital_name_display(self):
        """Return hospital name for display (backward compatibility)"""
        if self.hospital:
            return self.hospital.name
        return self.hospital_name or 'Unassigned'