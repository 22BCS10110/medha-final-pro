import os
from django.http import FileResponse, Http404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import PatientUpload
from .serializers import PatientUploadSerializer


class PatientUploadViewSet(viewsets.ModelViewSet):
    serializer_class = PatientUploadSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = PatientUpload.objects.select_related('patient', 'doctor', 'hospital')
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient__id=patient_id)

        user = self.request.user
        role = getattr(user, 'role', None)

        if role == 'super_admin':
            return qs
        # Hospital-scoped roles
        doctor = getattr(user, 'doctor_profile', None)
        if doctor:
            return qs.filter(hospital=doctor.hospital)
        hospital = getattr(user, 'hospital', None)
        if hospital:
            return qs.filter(hospital=hospital)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        file_obj = self.request.FILES.get('file')
        doctor = getattr(user, 'doctor_profile', None)
        hospital = doctor.hospital if doctor else None
        serializer.save(
            doctor=doctor,
            hospital=hospital,
            file_name=file_obj.name if file_obj else 'upload',
        )

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        upload = self.get_object()
        if not upload.file or not upload.file.name:
            raise Http404("File not found")
        try:
            file_handle = upload.file.open('rb')
        except FileNotFoundError:
            raise Http404("File not found on disk")

        ext = os.path.splitext(upload.file_name)[1].lower()
        content_type_map = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
        }
        content_type = content_type_map.get(ext, 'application/octet-stream')

        response = FileResponse(file_handle, content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{upload.file_name}"'
        response['Access-Control-Allow-Origin'] = '*'
        return response
