from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .nfc_api import write_nfc_card, read_nfc_card, list_patient_cards

router = DefaultRouter()
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'patient-visits', views.PatientHospitalVisitViewSet, basename='patient-visit')

urlpatterns = [
    # NFC Scan (no auth required)
    path('nfc-scan/', views.nfc_scan, name='nfc-scan'),

    # NFC UID lookup (hardware NFC card UID → patient data)
    path('patients/by-nfc/<str:uid>/', views.patient_by_nfc_uid, name='patient-by-nfc-uid'),

    # NFC card assignment (link hardware NFC UID to patient)
    path('patients/assign-nfc/', views.assign_nfc_card, name='assign-nfc-card'),

    # NFC status for a patient
    path('patients/<str:patient_id>/nfc-status/', views.patient_nfc_status, name='patient-nfc-status'),

    # NFC Card Management (auth required)
    path('nfc/write/<str:patient_id>/', write_nfc_card, name='nfc-write'),
    path('nfc/read/<str:card_number>/', read_nfc_card, name='nfc-read'),
    path('nfc/cards/<str:patient_id>/', list_patient_cards, name='nfc-cards'),

    # Patient cards
    path('patient-cards/scan/<str:card_number>/', views.PatientCardViewSet.as_view({'get': 'scan_card'}), name='scan-card'),

    # Router URLs
    path('', include(router.urls)),
]
