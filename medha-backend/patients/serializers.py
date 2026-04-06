from rest_framework import serializers
from .models import Patient, PatientHospitalVisit, PatientCard


class PatientSerializer(serializers.ModelSerializer):
    assigned_doctor_name = serializers.SerializerMethodField()
    hospital_visits = serializers.SerializerMethodField()
    has_active_card = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        exclude = ('user',)
        read_only_fields = ('id', 'patient_id', 'created_at', 'updated_at')

    def get_assigned_doctor_name(self, obj):
        if obj.assigned_doctor:
            return obj.assigned_doctor.full_name
        return 'Unassigned'

    def get_hospital_visits(self, obj):
        visits = obj.hospital_visits.select_related('hospital').all()[:10]
        return [
            {
                'hospital_id': v.hospital.hospital_id,
                'hospital_name': v.hospital.name,
                'visit_date': v.visit_date,
                'is_active': v.is_active,
            }
            for v in visits
        ]

    def get_has_active_card(self, obj):
        return obj.cards.filter(status='active').exists()


class PatientHospitalVisitSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_id = serializers.CharField(source='hospital.hospital_id', read_only=True)

    class Meta:
        model = PatientHospitalVisit
        fields = '__all__'
        read_only_fields = ('id', 'visit_date')


class PatientCardSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    patient_id = serializers.CharField(source='patient.patient_id', read_only=True)

    class Meta:
        model = PatientCard
        fields = '__all__'
        read_only_fields = ('id', 'card_number', 'issued_at', 'last_scanned_at', 'last_scanned_hospital')
