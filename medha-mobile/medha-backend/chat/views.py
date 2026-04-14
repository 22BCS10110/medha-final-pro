"""
Chat REST API — room management and message history.
Real-time messaging is handled via WebSocket (see consumers.py).
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from patients.models import Patient
from doctors.models import Doctor


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_rooms(request):
    """List chat rooms for the current user."""
    user = request.user
    if user.role == 'doctor':
        doctor = getattr(user, 'doctor_profile', None)
        if not doctor:
            return Response({'error': 'No doctor profile'}, status=404)
        rooms = ChatRoom.objects.filter(doctor=doctor, is_active=True)
    elif user.role == 'patient':
        patient = getattr(user, 'patient_profile', None)
        if not patient:
            return Response({'error': 'No patient profile'}, status=404)
        rooms = ChatRoom.objects.filter(patient=patient, is_active=True)
    elif user.role in ['super_admin', 'hospital_admin']:
        if hasattr(user, 'hospital') and user.hospital:
            rooms = ChatRoom.objects.filter(hospital=user.hospital, is_active=True)
        else:
            rooms = ChatRoom.objects.filter(is_active=True)
    else:
        rooms = ChatRoom.objects.none()

    serializer = ChatRoomSerializer(rooms, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_room(request):
    """
    Create or get a chat room between a doctor and patient.
    POST /api/chat/rooms/create/
    Body: {"doctor_id": "DOC-1001", "patient_id": "MHD-4500"}
    """
    doctor_id = request.data.get('doctor_id')
    patient_id = request.data.get('patient_id')

    if not doctor_id or not patient_id:
        return Response({'error': 'doctor_id and patient_id required'}, status=400)

    try:
        doctor = Doctor.objects.get(doctor_id=doctor_id)
        patient = Patient.objects.get(patient_id=patient_id)
    except (Doctor.DoesNotExist, Patient.DoesNotExist) as e:
        return Response({'error': str(e)}, status=404)

    room, created = ChatRoom.objects.get_or_create(
        doctor=doctor,
        patient=patient,
        hospital=doctor.hospital,
        defaults={'is_active': True},
    )

    serializer = ChatRoomSerializer(room, context={'request': request})
    return Response(serializer.data, status=201 if created else 200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def room_messages(request, room_id):
    """
    Get message history for a chat room.
    GET /api/chat/rooms/<room_id>/messages/?limit=50&before=<msg_id>
    """
    try:
        room = ChatRoom.objects.get(id=room_id)
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Room not found'}, status=404)

    limit = int(request.query_params.get('limit', 50))
    messages = room.messages.order_by('-created_at')[:limit]

    # Mark messages as read
    room.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    serializer = MessageSerializer(reversed(list(messages)), many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, room_id):
    """
    Send a message via REST (fallback if WebSocket is unavailable).
    POST /api/chat/rooms/<room_id>/send/
    Body: {"content": "Hello doctor"}
    """
    try:
        room = ChatRoom.objects.get(id=room_id)
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Room not found'}, status=404)

    content = request.data.get('content', '').strip()
    if not content:
        return Response({'error': 'Message content required'}, status=400)

    user = request.user
    sender_type = 'doctor' if user.role == 'doctor' else 'patient'

    message = Message.objects.create(
        room=room,
        sender=user,
        sender_type=sender_type,
        content=content,
    )

    # Update room timestamp
    room.updated_at = timezone.now()
    room.save(update_fields=['updated_at'])

    serializer = MessageSerializer(message)
    return Response(serializer.data, status=201)
