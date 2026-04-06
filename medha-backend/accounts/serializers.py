from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    hospital_display = serializers.CharField(source='hospital_name_display', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'role',
                  'phone', 'hospital', 'hospital_name', 'user_id_code',
                  'hospital_display']
        read_only_fields = ['id', 'hospital_display']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    role = serializers.CharField(required=False)


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users - allows super admin to assign hospitals"""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role',
                  'phone', 'hospital', 'user_id_code', 'password')
        read_only_fields = ('id', 'user_id_code')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user