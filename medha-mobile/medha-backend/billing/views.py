from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum
from .models import Receipt
from .serializers import ReceiptSerializer


class ReceiptViewSet(viewsets.ModelViewSet):
    """Receipts with hospital isolation."""
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Receipt.objects.none()

        # Super Admin sees all receipts
        if user.role == 'super_admin':
            return Receipt.objects.all()

        # Hospital Admin and Doctor see only their hospital's receipts
        if hasattr(user, 'hospital') and user.hospital:
            return Receipt.objects.filter(hospital=user.hospital)

        return Receipt.objects.none()

    def perform_create(self, serializer):
        import time
        # Auto-assign hospital from user
        hospital = serializer.validated_data.get('hospital')
        if not hospital and hasattr(self.request.user, 'hospital') and self.request.user.hospital:
            hospital = self.request.user.hospital

        last = Receipt.objects.order_by('-id').first()
        next_num = (last.id + 1) if last else 1
        receipt_number = f"RCP-{int(time.time())}-{next_num:04d}"
        serializer.save(receipt_number=receipt_number, hospital=hospital)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def billing_summary(request):
    user = request.user

    # Start with user's hospital receipts
    if user.role == 'super_admin':
        receipts = Receipt.objects.all()
    elif hasattr(user, 'hospital') and user.hospital:
        receipts = Receipt.objects.filter(hospital=user.hospital)
    else:
        return Response({
            'total_billed': 0,
            'collected': 0,
            'outstanding': 0,
            'pending_count': 0,
            'insurance_claims': 0,
        })

    total_billed = receipts.aggregate(total=Sum('total_amount'))['total'] or 0
    collected = receipts.filter(status='paid').aggregate(total=Sum('total_amount'))['total'] or 0
    outstanding = receipts.filter(status='pending').aggregate(total=Sum('total_amount'))['total'] or 0
    pending_count = receipts.filter(status='pending').count()

    return Response({
        'total_billed': float(total_billed),
        'collected': float(collected),
        'outstanding': float(outstanding),
        'pending_count': pending_count,
        'insurance_claims': 0,
    })
