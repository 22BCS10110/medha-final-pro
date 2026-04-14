from django.contrib import admin
from .models import Patient, PatientHospitalVisit, PatientCard


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['patient_id', 'full_name', 'gender', 'phone', 'status', 'assigned_doctor', 'created_at']
    list_filter = ['status', 'gender', 'blood_group']
    search_fields = ['full_name', 'patient_id', 'phone', 'abha_id']
    readonly_fields = ['id', 'patient_id', 'created_at', 'updated_at']


@admin.register(PatientHospitalVisit)
class PatientHospitalVisitAdmin(admin.ModelAdmin):
    list_display = ['patient', 'hospital', 'visit_date', 'is_active']
    list_filter = ['is_active', 'hospital']
    search_fields = ['patient__full_name', 'hospital__name']
    readonly_fields = ['visit_date']


@admin.register(PatientCard)
class PatientCardAdmin(admin.ModelAdmin):
    list_display = ['card_number', 'patient', 'card_type', 'status', 'issued_at', 'last_scanned_at']
    list_filter = ['card_type', 'status']
    search_fields = ['card_number', 'patient__full_name', 'patient__patient_id']
    readonly_fields = ['id', 'card_number', 'issued_at']