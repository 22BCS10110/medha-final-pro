from rest_framework import serializers
from .models import Doctor, Appointment


class DoctorSerializer(serializers.ModelSerializer):
    active_patient_count = serializers.ReadOnlyField()
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_id = serializers.CharField(source='hospital.hospital_id', read_only=True)

    class Meta:
        model = Doctor
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'hospital_name', 'hospital_id')


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_id_code = serializers.CharField(source='patient.patient_id', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_id = serializers.CharField(source='hospital.hospital_id', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('id', 'hospital_name', 'hospital_id')
