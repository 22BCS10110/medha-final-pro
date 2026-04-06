"""
API v2 URL Routing - Supabase Auth + RBAC + Hospital Isolation
"""
from django.urls import path
from . import views

app_name = 'api_v2'

urlpatterns = [
    # Patient endpoints
    path('patient/profile/', views.patient_profile, name='patient_profile'),
    path('patient/appointments/', views.patient_appointments, name='patient_appointments'),
    path('patient/book-appointment/', views.book_appointment, name='book_appointment'),
    
    # Doctor endpoints
    path('doctor/patients/', views.doctor_patients, name='doctor_patients'),
    path('doctor/appointments/', views.doctor_appointments, name='doctor_appointments'),
    
    # Hospital Admin endpoints
    path('admin/hospital/', views.admin_hospital_data, name='admin_hospital'),
    path('admin/staff/', views.admin_staff, name='admin_staff'),
    path('admin/patient-lookup/', views.admin_patient_lookup, name='admin_patient_lookup'),
    
    # Super Admin endpoints
    path('super-admin/hospitals/', views.super_admin_hospitals, name='super_admin_hospitals'),
]