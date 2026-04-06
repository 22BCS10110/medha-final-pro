from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .appointment_api import book_appointment, list_appointments, update_appointment_status, get_available_slots

router = DefaultRouter()
router.register(r'doctors', views.DoctorViewSet, basename='doctor')
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')

urlpatterns = [
    # Appointment Booking API
    path('appointments/book/', book_appointment, name='book-appointment'),
    path('appointments/list/', list_appointments, name='list-appointments'),
    path('appointments/<uuid:appointment_id>/status/', update_appointment_status, name='update-appointment-status'),
    path('appointments/slots/<str:doctor_id>/', get_available_slots, name='available-slots'),
    
    # Router URLs
    path('', include(router.urls)),
]
