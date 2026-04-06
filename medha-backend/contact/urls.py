from django.urls import path
from . import views

urlpatterns = [
    path('enquiry/', views.submit_enquiry),
    path('enquiries/', views.list_enquiries),
]
