from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from uuid import UUID, uuid4


class PatientQuerySet(models.QuerySet):
    def get_by_id_or_code(self, lookup):
        """
        Resolve a patient by UUID primary key OR by the human-readable
        patient_id (PAT-XXXX). If the lookup parses as a UUID, only the PK
        path is attempted — there's no point querying patient_id with a UUID.
        """
        lookup_str = str(lookup)
        try:
            uuid_obj = UUID(lookup_str)
        except ValueError:
            uuid_obj = None

        if uuid_obj is not None:
            try:
                return self.get(id=uuid_obj)
            except self.model.DoesNotExist:
                raise self.model.DoesNotExist(f"No patient found for '{lookup_str}'")

        # Non-UUID string — treat as the human-readable code.
        try:
            return self.get(patient_id=lookup_str)
        except self.model.DoesNotExist:
            raise self.model.DoesNotExist(f"No patient found for '{lookup_str}'")

class PatientManager(models.Manager):
    def get_queryset(self):
        return PatientQuerySet(self.model, using=self._db)

    def get_by_id_or_code(self, lookup):
        return self.get_queryset().get_by_id_or_code(lookup)


class Patient(models.Model):

    """
    GLOBAL Patient model — accessible across all hospitals.
    Patients are NOT tied to a single hospital.
    Hospital visits are tracked via PatientHospitalVisit records.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('discharged', 'Discharged'),
        ('critical', 'Critical'),
    ]
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    BLOOD_GROUPS = [
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
        ('O+', 'O+'), ('O-', 'O-'), ('AB+', 'AB+'), ('AB-', 'AB-'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='patient_profile')
    patient_id = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True, blank=True, null=True)
    password_hash = models.CharField(max_length=255, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default='M')
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    emergency_contact = models.CharField(max_length=15, blank=True)
    supabase_uid = models.CharField(max_length=36, unique=True, null=True, blank=True, help_text='Supabase auth.users UUID')
    abha_id = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    existing_diseases = models.TextField(blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    reason_for_visit = models.TextField(blank=True)
    assigned_doctor = models.ForeignKey('doctors.Doctor', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_patients')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PatientManager()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.patient_id})"


class PatientHospitalVisit(models.Model):
    """
    Tracks which hospitals a patient has visited.
    Created when a patient registers at or visits a hospital.
    """
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='hospital_visits')
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.CASCADE, related_name='patient_visits')
    visit_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False)  # True if currently admitted

    class Meta:
        ordering = ['-visit_date']
        unique_together = ('patient', 'hospital', 'is_active')

    def __str__(self):
        return f"{self.patient.full_name} -> {self.hospital.name} ({self.visit_date.strftime('%Y-%m-%d')})"


class PatientCard(models.Model):
    """
    Patient Card / QR code for global patient identification.
    Each patient can have multiple cards (physical, digital, etc.)
    Cards encode the patient_id which can be scanned at ANY hospital.
    """
    CARD_TYPES = [
        ('qr', 'QR Code'),
        ('nfc', 'NFC'),
        ('barcode', 'Barcode'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('lost', 'Lost'),
        ('expired', 'Expired'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='cards')
    card_number = models.CharField(max_length=30, unique=True, editable=False)
    nfc_uid = models.CharField(
        max_length=50, unique=True, null=True, blank=True,
        help_text='Hardware NFC card UID (hex string from reader)'
    )
    card_type = models.CharField(max_length=10, choices=CARD_TYPES, default='qr')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    issued_at = models.DateTimeField(auto_now_add=True)
    last_scanned_at = models.DateTimeField(null=True, blank=True)
    last_scanned_hospital = models.ForeignKey(
        'hospitals.Hospital', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='card_scans'
    )

    class Meta:
        ordering = ['-issued_at']

    def __str__(self):
        return f"Card {self.card_number} for {self.patient.full_name}"

    def save(self, *args, **kwargs):
        if not self.card_number:
            from .utils import generate_card_number
            self.card_number = generate_card_number()
        super().save(*args, **kwargs)