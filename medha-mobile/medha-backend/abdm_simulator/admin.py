"""
ABDM Simulator — Django Admin Registration
"""
from django.contrib import admin
from .models import ABHARecord, ConsentRequest, ConsentArtifact, HIUDataRequest, ABDMAuditLog


@admin.register(ABHARecord)
class ABHARecordAdmin(admin.ModelAdmin):
    list_display = ['abha_number', 'full_name', 'status', 'verified', 'linked_via', 'created_at']
    list_filter = ['status', 'verified', 'linked_via']
    search_fields = ['abha_number', 'full_name', 'abha_address']
    readonly_fields = ['id', 'abha_number', 'abha_address', 'verified_at', 'created_at']


@admin.register(ConsentRequest)
class ConsentRequestAdmin(admin.ModelAdmin):
    list_display = ['consent_request_id', 'patient_abha_id', 'purpose', 'status', 'created_at']
    list_filter = ['status', 'purpose']
    search_fields = ['consent_request_id', 'patient_abha_id']
    readonly_fields = ['id', 'consent_request_id', 'created_at', 'granted_at', 'denied_at', 'revoked_at']


@admin.register(ConsentArtifact)
class ConsentArtifactAdmin(admin.ModelAdmin):
    list_display = ['artifact_id', 'consent_request', 'granted_at', 'valid_until']
    readonly_fields = ['id', 'artifact_id', 'granted_at']


@admin.register(HIUDataRequest)
class HIUDataRequestAdmin(admin.ModelAdmin):
    list_display = ['request_id', 'patient_abha_id', 'status', 'created_at']
    list_filter = ['status']
    readonly_fields = ['id', 'request_id', 'created_at', 'completed_at']


@admin.register(ABDMAuditLog)
class ABDMAuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'action', 'patient_abha_id', 'actor_role']
    list_filter = ['action', 'actor_role']
    search_fields = ['patient_abha_id', 'consent_request_id']
    readonly_fields = [f.name for f in ABDMAuditLog._meta.get_fields()]

    def has_change_permission(self, request, obj=None):
        return False  # Immutable

    def has_delete_permission(self, request, obj=None):
        return False  # Immutable
