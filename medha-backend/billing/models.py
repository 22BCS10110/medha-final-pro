from django.db import models
import uuid


class Receipt(models.Model):
    """Receipt tied to a hospital for financial isolation."""
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
    ]
    PAYMENT_MODES = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('card', 'Card'),
        ('insurance', 'Insurance'),
        ('razorpay', 'Razorpay'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt_number = models.CharField(max_length=30, unique=True)
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, related_name='receipts')
    doctor = models.ForeignKey('doctors.Doctor', on_delete=models.SET_NULL, null=True, related_name='receipts')
    hospital = models.ForeignKey('hospitals.Hospital', on_delete=models.CASCADE, related_name='receipts')
    gstin = models.CharField(max_length=20, blank=True, default='')
    date = models.DateField(auto_now_add=True)
    items = models.JSONField(default=list)  # [{name, amount}]
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_mode = models.CharField(max_length=15, choices=PAYMENT_MODES, default='upi')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.receipt_number} — ₹{self.total_amount} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.hospital_id and self.doctor:
            self.hospital = self.doctor.hospital
        super().save(*args, **kwargs)