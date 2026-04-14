from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view),
    path('google/', views.google_login_view),
    path('firebase-login/', views.firebase_login_view),
    path('profile/complete/', views.complete_profile_view),
    path('logout/', views.logout_view),
    path('refresh/', views.token_refresh_view),
    path('me/', views.me_view),
]
