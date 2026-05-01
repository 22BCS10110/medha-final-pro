from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'first_name', 'last_name', 'role', 'hospital_name', 'user_id_code']
    list_filter = ['role']
    fieldsets = UserAdmin.fieldsets + (
        ('Medha', {'fields': ('role', 'phone', 'hospital_name', 'user_id_code')}),
    )
