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
    
    # NFC Card Management (auth required)
    path('nfc/write/<str:patient_id>/', write_nfc_card, name='nfc-write'),
    path('nfc/read/<str:card_number>/', read_nfc_card, name='nfc-read'),
    path('nfc/cards/<str:patient_id>/', list_patient_cards, name='nfc-cards'),
    
    # Patient cards
    path('patient-cards/scan/<str:card_number>/', views.PatientCardViewSet.as_view({'get': 'scan_card'}), name='scan-card'),
    
    # Router URLs
    path('', include(router.urls)),
]
