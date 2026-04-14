from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'records', views.HealthRecordViewSet, basename='healthrecord')
router.register(r'prescriptions', views.PrescriptionViewSet, basename='prescription')
router.register(r'vitals', views.VitalViewSet, basename='vital')

urlpatterns = [
    path('', include(router.urls)),
]
