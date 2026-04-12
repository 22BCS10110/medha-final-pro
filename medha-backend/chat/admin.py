from django.contrib import admin
from .models import ChatRoom, Message


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'patient', 'hospital', 'is_active', 'created_at')
    list_filter = ('is_active', 'hospital')
    search_fields = ('doctor__full_name', 'patient__full_name')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('room', 'sender_type', 'content_preview', 'is_read', 'created_at')
    list_filter = ('sender_type', 'is_read')

    def content_preview(self, obj):
        return obj.content[:60]
    content_preview.short_description = 'Content'
