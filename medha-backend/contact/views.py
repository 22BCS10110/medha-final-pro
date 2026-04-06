from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Enquiry
from .serializers import EnquirySerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def submit_enquiry(request):
    serializer = EnquirySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {'message': 'Enquiry submitted successfully. Our team will contact you within 24 hours.'},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def list_enquiries(request):
    enquiries = Enquiry.objects.all()
    serializer = EnquirySerializer(enquiries, many=True)
    return Response(serializer.data)
