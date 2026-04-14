from rest_framework import serializers
from .models import Hospital


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'
        read_only_fields = ('id', 'hospital_id', 'created_at', 'updated_at')


class HospitalBriefSerializer(serializers.ModelSerializer):
    """Minimal hospital info for dropdowns"""
    class Meta:
        model = Hospital
        fields = ('id', 'hospital_id', 'name', 'status')
        read_only_fields = ('id', 'hospital_id', 'status')