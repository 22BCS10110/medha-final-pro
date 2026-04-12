from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.list_rooms, name='chat-rooms'),
    path('rooms/create/', views.create_room, name='chat-room-create'),
    path('rooms/<uuid:room_id>/messages/', views.room_messages, name='chat-messages'),
    path('rooms/<uuid:room_id>/send/', views.send_message, name='chat-send'),
]
