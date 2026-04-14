from django.db import models


class Enquiry(models.Model):
    hospital_name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=15, blank=True)
    hospital_type = models.CharField(max_length=50, blank=True)
    beds = models.CharField(max_length=20, blank=True)
    plan = models.CharField(max_length=50, blank=True)
    message = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'enquiries'

    def __str__(self):
        return f"{self.hospital_name} — {self.contact_person}"
