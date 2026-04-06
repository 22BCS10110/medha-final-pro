from django.contrib import admin
from .models import Hospital


@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ['hospital_id', 'name', 'status', 'phone', 'created_at']
    list_filter = ['status']
    search_fields = ['name', 'hospital_id', 'phone']
    readonly_fields = ['id', 'hospital_id', 'created_at', 'updated_at']