"""
WebSocket consumer for real-time doctor-patient chat.
Connect: ws://<host>/ws/chat/<room_id>/
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )

    async def receive(self, text_data):
        """Receive message from WebSocket client."""
        data = json.loads(text_data)
        content = data.get('content', '').strip()
        user_id = data.get('user_id')
        sender_type = data.get('sender_type', 'doctor')

        if not content:
            return

        # Save message to database
        message = await self.save_message(user_id, sender_type, content)

        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': str(message['id']),
                    'content': content,
                    'sender_type': sender_type,
                    'sender_name': message['sender_name'],
                    'created_at': message['created_at'],
                },
            }
        )

    async def chat_message(self, event):
        """Send message to WebSocket client."""
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def save_message(self, user_id, sender_type, content):
        from .models import ChatRoom, Message
        from accounts.models import User

        room = ChatRoom.objects.get(id=self.room_id)
        user = User.objects.get(id=user_id)

        message = Message.objects.create(
            room=room,
            sender=user,
            sender_type=sender_type,
            content=content,
        )
        room.updated_at = timezone.now()
        room.save(update_fields=['updated_at'])

        return {
            'id': message.id,
            'sender_name': user.get_full_name() or user.username,
            'created_at': message.created_at.isoformat(),
        }
