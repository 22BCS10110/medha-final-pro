from django.contrib import admin
from .models import HealthRecord, Prescription, Vital

@admin.register(HealthRecord)
class HealthRecordAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'date', 'diagnosis', 'record_type']
    list_filter = ['record_type', 'date']

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'medicine', 'dosage', 'duration', 'status']
    list_filter = ['status']

@admin.register(Vital)
class VitalAdmin(admin.ModelAdmin):
    list_display = ['patient', 'blood_pressure', 'heart_rate', 'spo2', 'recorded_at']
