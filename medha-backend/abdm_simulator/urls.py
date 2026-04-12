"""
ABDM Simulator — URL Configuration
====================================
All endpoints under /api/abdm/
"""
from django.urls import path
from . import views

app_name = 'abdm_simulator'

urlpatterns = [
    # ── Status ────────────────────────────────────────
    path('status/', views.abdm_status, name='abdm-status'),

    # ── ABHA Endpoints ────────────────────────────────
    path('abha/create/', views.abha_create, name='abha-create'),
    path('abha/link/', views.abha_link, name='abha-link'),
    path('abha/verify/<str:abha_number>/', views.abha_verify, name='abha-verify'),
    path('abha/list/', views.abha_list, name='abha-list'),

    # ── Consent Endpoints ─────────────────────────────
    path('consent/create/', views.consent_create, name='consent-create'),
    path('consent/list/', views.consent_list, name='consent-list'),
    path('consent/<str:consent_id>/', views.consent_detail, name='consent-detail'),
    path('consent/<str:consent_id>/action/', views.consent_action, name='consent-action'),

    # ── HIU Data Fetch ────────────────────────────────
    path('hiu/fetch/', views.hiu_fetch_data, name='hiu-fetch'),

    # ── Audit Log ─────────────────────────────────────
    path('audit/', views.audit_log_list, name='audit-log'),
]
