# blockchain_django/notification_views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone

from blockchain_django.models import Notification
from blockchain_django.serializers import NotificationSerializer

class NotificationPagination(PageNumberPagination):
    """Custom pagination for notifications"""
    page_size = 10
    page_size_query_param = 'per_page'
    max_page_size = 50

class NotificationListView(APIView):
    """
    API view for listing user notifications
    with support for filtering and pagination
    """
    permission_classes = [IsAuthenticated]
    pagination_class = NotificationPagination
    
    def get(self, request):
        """Get notifications for the current user"""
        user = request.user
        
        # Get filter parameters
        notification_type = request.query_params.get('type')
        is_read = request.query_params.get('is_read')
        
        # Build query
        queryset = Notification.objects.filter(user=user).order_by('-created_at')
        
        # Apply filters
        if notification_type:
            if notification_type == 'unread':
                queryset = queryset.filter(is_read=False)
            elif notification_type != 'all':
                queryset = queryset.filter(notification_type=notification_type)
        
        if is_read is not None:
            is_read_bool = is_read.lower() == 'true'
            queryset = queryset.filter(is_read=is_read_bool)
        
        # Apply pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = NotificationSerializer(page, many=True)
        
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        """Create a new notification for the current user"""
        user = request.user
        
        # Get notification data
        message = request.data.get('message')
        notification_type = request.data.get('type', 'info')
        
        if not message:
            return Response({
                'error': 'Message is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create notification
        notification = Notification.objects.create(
            user=user,
            message=message,
            notification_type=notification_type,
            created_at=timezone.now()
        )
        
        # Serialize notification
        serializer = NotificationSerializer(notification)
        
        # Send WebSocket notification
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_user_{user.id}",
            {
                "type": "send_notification",
                "notification": serializer.data
            }
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class NotificationDetailView(APIView):
    """
    API view for managing a specific notification
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        """Get a specific notification"""
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            serializer = NotificationSerializer(notification)
            return Response(serializer.data)
        except Notification.DoesNotExist:
            return Response({
                'error': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def patch(self, request, pk):
        """Update a notification (mark as read/unread)"""
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            
            # Get update data
            is_read = request.data.get('is_read')
            
            if is_read is not None:
                notification.is_read = is_read
                notification.save(update_fields=['is_read'])
                
                # Send WebSocket update
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f"notifications_user_{request.user.id}",
                    {
                        "type": "send_notification_update",
                        "notification_id": notification.id,
                        "is_read": notification.is_read
                    }
                )
            
            serializer = NotificationSerializer(notification)
            return Response(serializer.data)
        except Notification.DoesNotExist:
            return Response({
                'error': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, pk):
        """Delete a notification"""
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.delete()
            
            # Send WebSocket update
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"notifications_user_{request.user.id}",
                {
                    "type": "send_notification_delete",
                    "notification_id": pk
                }
            )
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response({
                'error': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)

class MarkAllNotificationsReadView(APIView):
    """
    API view for marking all notifications as read
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Mark all notifications as read"""
        user = request.user
        
        with transaction.atomic():
            # Get filter parameters
            notification_type = request.data.get('type')
            
            # Build query
            queryset = Notification.objects.filter(user=user, is_read=False)
            
            # Apply filters
            if notification_type and notification_type != 'all':
                queryset = queryset.filter(notification_type=notification_type)
            
            # Mark all as read
            count = queryset.update(is_read=True)
        
        # Send WebSocket update
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_user_{user.id}",
            {
                "type": "send_all_read",
                "notification_type": notification_type
            }
        )
        
        return Response({
            'count': count,
            'message': f'{count} notifications marked as read'
        })