from rest_framework import serializers
from .models import PatientConsent


class PatientConsentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_id = serializers.CharField(source='patient.patient_id', read_only=True)

    class Meta:
        model = PatientConsent
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'granted_at', 'revoked_at')
