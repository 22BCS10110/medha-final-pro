from rest_framework import serializers
from .models import Receipt


class ReceiptSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    hospital_id = serializers.CharField(source='hospital.hospital_id', read_only=True)

    class Meta:
        model = Receipt
        fields = '__all__'
        read_only_fields = ['id', 'receipt_number', 'created_at', 'hospital_name', 'hospital_id']

    def get_doctor_name(self, obj):
        return obj.doctor.full_name if obj.doctor else ''
