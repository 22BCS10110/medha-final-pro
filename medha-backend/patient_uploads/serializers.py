from rest_framework import serializers
from .models import PatientUpload


class PatientUploadSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = PatientUpload
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'uploaded_by_name',
            'hospital', 'file', 'file_name', 'upload_type', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'file_name', 'doctor', 'hospital']

    def get_uploaded_by_name(self, obj):
        if obj.doctor:
            return obj.doctor.full_name or str(obj.doctor)
        return None

    def get_patient_name(self, obj):
        if obj.patient:
            return obj.patient.full_name
        return None
