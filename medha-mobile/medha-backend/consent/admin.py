from django.contrib import admin
from .models import PatientConsent

@admin.register(PatientConsent)
class PatientConsentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'status', 'granted_via', 'granted_at', 'revoked_at')
    list_filter = ('status', 'granted_via')
    search_fields = ('patient__full_name', 'patient__patient_id')
    readonly_fields = ('id', 'created_at', 'updated_at')
