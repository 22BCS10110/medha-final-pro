from rest_framework import serializers
from .models import HealthRecord, Prescription, Vital
from patients.serializers import PatientRelatedField


class HealthRecordSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_id = serializers.CharField(source='hospital.hospital_id', read_only=True)
    patient = PatientRelatedField()

    class Meta:
        model = HealthRecord
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'hospital_name', 'hospital_id')
        extra_kwargs = {
            'hospital': {'required': False, 'allow_null': True},
            'doctor': {'required': False, 'allow_null': True},
        }


class PrescriptionSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_id = serializers.CharField(source='hospital.hospital_id', read_only=True)
    patient = PatientRelatedField()

    class Meta:
        model = Prescription
        fields = '__all__'
        # hospital is assigned server-side in the viewset (from the doctor or
        # the logged-in user), so the client isn't required to send it. doctor
        # is optional for the same reason — a logged-in doctor implies it.
        read_only_fields = ('id', 'date', 'created_at', 'hospital_name', 'hospital_id')
        extra_kwargs = {
            'hospital': {'required': False, 'allow_null': True},
            'doctor': {'required': False, 'allow_null': True},
        }


class VitalSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True, allow_null=True)
    hospital_id = serializers.CharField(source='hospital.hospital_id', read_only=True, allow_null=True)

    class Meta:
        model = Vital
        fields = '__all__'
        read_only_fields = ('id', 'recorded_at', 'hospital_name', 'hospital_id')
