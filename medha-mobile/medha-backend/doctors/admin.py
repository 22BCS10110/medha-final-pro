from django.contrib import admin
from .models import Doctor, Appointment


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ['doctor_id', 'full_name', 'department', 'specialisation', 'hospital', 'status']
    list_filter = ['department', 'status', 'hospital']
    search_fields = ['full_name', 'doctor_id']


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'patient', 'hospital', 'date', 'time', 'appointment_type', 'status']
    list_filter = ['status', 'appointment_type', 'date', 'hospital']