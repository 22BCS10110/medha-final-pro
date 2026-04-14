"""
Doctor-Patient Real-Time Chat — Models
Uses Django Channels (WebSocket) for real-time, REST API for history.
"""
import uuid
from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    """
    A chat room between a doctor and a patient.
    One room per doctor-patient pair per hospital.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(
        'doctors.Doctor', on_delete=models.CASCADE,
        related_name='chat_rooms',
    )
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE,
        related_name='chat_rooms',
    )
    hospital = models.ForeignKey(
        'hospitals.Hospital', on_delete=models.CASCADE,
        related_name='chat_rooms',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        unique_together = ('doctor', 'patient', 'hospital')

    def __str__(self):
        return f"Chat: {self.doctor.full_name} <-> {self.patient.full_name}"

    @property
    def room_name(self):
        return f"chat_{self.id.hex}"


class Message(models.Model):
    """Individual chat message within a room."""
    SENDER_TYPES = [
        ('doctor', 'Doctor'),
        ('patient', 'Patient'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='chat_messages',
    )
    sender_type = models.CharField(max_length=10, choices=SENDER_TYPES)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender_type}: {self.content[:50]}"
