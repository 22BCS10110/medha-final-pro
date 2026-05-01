from django.contrib import admin
from .models import PatientUpload


@admin.register(PatientUpload)
class PatientUploadAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'upload_type', 'patient', 'doctor', 'hospital', 'created_at']
    list_filter = ['upload_type', 'hospital', 'created_at']
    search_fields = ['file_name', 'patient__full_name', 'notes']
    readonly_fields = ['id', 'created_at']
