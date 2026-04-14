"""
Medha Backend URL Configuration
Updated for multi-hospital architecture.
"""
from django.contrib import admin
from django.urls import path, include
from .dashboard_views import (
    admin_dashboard, doctor_dashboard, patient_dashboard,
    reports_view, hospital_settings,
)
from patients.views import PatientCardViewSet, nfc_scan

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/hospitals/', include('hospitals.urls')),
    path('api/', include('doctors.urls')),
    path('api/', include('records.urls')),
    # NFC scan BEFORE patients router to avoid conflicts
    path('api/patients/nfc-scan/', nfc_scan, name='nfc-scan'),
    path('api/', include('patients.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/contact/', include('contact.urls')),
    path('api/dashboard/admin/', admin_dashboard),
    path('api/dashboard/doctor/', doctor_dashboard),
    path('api/dashboard/patient/', patient_dashboard),
    path('api/reports/', reports_view),
    path('api/hospital/settings/', hospital_settings),
    path('api/patients/scan-card/<str:card_number>/', PatientCardViewSet.as_view({'get': 'scan_card'}), name='scan-card'),
    
    # ── Consent System ──
    path('api/consent/', include('consent.urls')),

    # ── Chat System ──
    path('api/chat/', include('chat.urls')),

    # ── ABDM Simulator (Demo/Pilot) ──
    path('api/abdm/', include('abdm_simulator.urls')),
]
