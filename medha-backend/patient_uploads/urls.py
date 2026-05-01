from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientUploadViewSet

router = DefaultRouter()
router.register(r'patient-uploads', PatientUploadViewSet, basename='patient-uploads')

urlpatterns = [
    path('', include(router.urls)),
]
