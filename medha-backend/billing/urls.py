from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'receipts', views.ReceiptViewSet, basename='receipt')

urlpatterns = [
    path('', include(router.urls)),
    path('summary/', views.billing_summary),
]
