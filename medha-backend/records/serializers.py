from rest_framework import serializers
from .models import HealthRecord, Prescription, Vital


class HealthRecordSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_id = serializers.CharField(source='hospital.hospital_id', read_only=True)

    class Meta:
        model = HealthRecord
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'hospital_name', 'hospital_id')


class PrescriptionSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_id = serializers.CharField(source='hospital.hospital_id', read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ('id', 'date', 'created_at', 'hospital_name', 'hospital_id')


class VitalSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True, allow_null=True)
    hospital_id = serializers.CharField(source='hospital.hospital_id', read_only=True, allow_null=True)

    class Meta:
        model = Vital
        fields = '__all__'
        read_only_fields = ('id', 'recorded_at', 'hospital_name', 'hospital_id')
