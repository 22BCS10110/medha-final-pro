from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Hospital
from .serializers import HospitalSerializer, HospitalBriefSerializer


class HospitalViewSet(viewsets.ModelViewSet):
    """
    Hospital CRUD operations.
    - Super Admin: Full access to all hospitals
    - Hospital Admin: Can only see their own hospital
    - Others: Read-only brief access
    """
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]  # Only super admin can create/edit hospitals

    def get_serializer_class(self):
        if self.action in ['list_brief']:
            return HospitalBriefSerializer
        return HospitalSerializer

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'], url_path='brief')
    def list_brief(self, request):
        """Return minimal hospital info for dropdowns"""
        hospitals = Hospital.objects.filter(status='active')
        serializer = self.get_serializer(hospitals, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-hospital')
    def my_hospital(self, request):
        """Return the hospital associated with the current user"""
        hospital = getattr(request.user, 'hospital', None)
        if hospital:
            serializer = HospitalBriefSerializer(hospital)
            return Response(serializer.data)
        return Response({'error': 'No hospital associated'}, status=404)