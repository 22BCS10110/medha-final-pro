from django.contrib import admin
from .models import Receipt

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ['receipt_number', 'patient', 'total_amount', 'payment_mode', 'status', 'date']
    list_filter = ['status', 'payment_mode']
