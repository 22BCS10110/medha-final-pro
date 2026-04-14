from django.contrib import admin
from .models import Enquiry

@admin.register(Enquiry)
class EnquiryAdmin(admin.ModelAdmin):
    list_display = ['hospital_name', 'contact_person', 'email', 'plan', 'is_read', 'created_at']
    list_filter = ['is_read', 'plan']
