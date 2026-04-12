from django.urls import path
from . import views

urlpatterns = [
    path('<str:patient_id>/check/', views.check_consent, name='consent-check'),
    path('<str:patient_id>/grant/', views.grant_consent, name='consent-grant'),
    path('<str:patient_id>/revoke/', views.revoke_consent, name='consent-revoke'),
]
