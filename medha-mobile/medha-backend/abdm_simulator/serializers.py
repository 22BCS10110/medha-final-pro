"""
ABDM Simulator — Serializers
==============================
DRF serializers for all ABDM simulation models.
"""
from rest_framework import serializers
from .models import ABHARecord, ConsentRequest, ConsentArtifact, HIUDataRequest, ABDMAuditLog


class ABHARecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True, default='')
    patient_id_code = serializers.CharField(source='patient.patient_id', read_only=True, default='')

    class Meta:
        model = ABHARecord
        fields = [
            'id', 'abha_number', 'abha_address', 'full_name',
            'date_of_birth', 'gender', 'phone', 'linked_via',
            'status', 'verified', 'patient', 'patient_name',
            'patient_id_code', 'registered_at_hospital',
            'created_at', 'verified_at'
        ]
        read_only_fields = ['id', 'abha_number', 'abha_address', 'created_at', 'verified_at']


class ABHACreateSerializer(serializers.Serializer):
    """Serializer for ABHA registration (simulated Aadhaar/Mobile OTP flow)."""
    full_name = serializers.CharField(max_length=200)
    date_of_birth = serializers.DateField(required=False)
    gender = serializers.ChoiceField(choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], required=False)
    phone = serializers.CharField(max_length=15, required=False)
    linked_via = serializers.ChoiceField(
        choices=['aadhaar', 'mobile', 'nfc', 'manual'],
        default='mobile'
    )
    # Optional: link to existing patient
    patient_id = serializers.UUIDField(required=False)


class ABHALinkSerializer(serializers.Serializer):
    """Serializer for linking an existing ABHA to a Medha patient."""
    abha_number = serializers.CharField(max_length=20)
    patient_id = serializers.UUIDField()


class ABHAVerifySerializer(serializers.Serializer):
    """Serializer for verifying an ABHA ID (mock success)."""
    abha_number = serializers.CharField(max_length=20)


class ConsentRequestSerializer(serializers.ModelSerializer):
    requester_doctor_name = serializers.CharField(
        source='requester_doctor.full_name', read_only=True
    )
    requester_hospital_name = serializers.CharField(
        source='requester_hospital.name', read_only=True
    )
    patient_name = serializers.CharField(
        source='patient.full_name', read_only=True
    )
    has_artifact = serializers.SerializerMethodField()

    class Meta:
        model = ConsentRequest
        fields = [
            'id', 'consent_request_id', 'requester_doctor', 'requester_doctor_name',
            'requester_hospital', 'requester_hospital_name',
            'patient', 'patient_name', 'patient_abha_id',
            'purpose', 'hi_types', 'date_range_from', 'date_range_to',
            'status', 'status_message',
            'granted_at', 'denied_at', 'expires_at', 'revoked_at',
            'created_at', 'has_artifact'
        ]
        read_only_fields = [
            'id', 'consent_request_id', 'status',
            'granted_at', 'denied_at', 'revoked_at', 'created_at'
        ]

    def get_has_artifact(self, obj):
        return hasattr(obj, 'artifact') and obj.artifact is not None


class ConsentCreateSerializer(serializers.Serializer):
    """Serializer for creating a new consent request (doctor action)."""
    patient_abha_id = serializers.CharField(max_length=20)
    purpose = serializers.ChoiceField(
        choices=['CAREMGT', 'BTG', 'PUBHLTH', 'HPAYMT', 'DSRCH'],
        default='CAREMGT'
    )
    hi_types = serializers.ListField(
        child=serializers.CharField(),
        default=['Prescription', 'DiagnosticReport']
    )
    date_range_from = serializers.DateField()
    date_range_to = serializers.DateField()


class ConsentActionSerializer(serializers.Serializer):
    """Serializer for approving/denying/revoking consent (patient action)."""
    action = serializers.ChoiceField(choices=['approve', 'deny', 'revoke'])
    reason = serializers.CharField(required=False, default='')


class ConsentArtifactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsentArtifact
        fields = [
            'id', 'artifact_id', 'consent_request', 'artifact_json',
            'signature', 'granted_at', 'valid_until'
        ]


class HIUDataRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = HIUDataRequest
        fields = [
            'id', 'request_id', 'consent_artifact', 'requesting_doctor',
            'patient_abha_id', 'data_types', 'status',
            'fhir_bundle', 'error_message', 'created_at', 'completed_at'
        ]


class HIUFetchSerializer(serializers.Serializer):
    """Serializer for initiating a data fetch (after consent is granted)."""
    consent_request_id = serializers.CharField(max_length=100)


class ABDMAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ABDMAuditLog
        fields = '__all__'


class ABDMStatusSerializer(serializers.Serializer):
    """Overview of ABDM simulation status."""
    total_abha_records = serializers.IntegerField()
    total_consent_requests = serializers.IntegerField()
    pending_consents = serializers.IntegerField()
    granted_consents = serializers.IntegerField()
    denied_consents = serializers.IntegerField()
    total_data_fetches = serializers.IntegerField()
    audit_log_entries = serializers.IntegerField()
    simulation_mode = serializers.BooleanField(default=True)
    abdm_gateway_status = serializers.CharField(default='SIMULATED')
