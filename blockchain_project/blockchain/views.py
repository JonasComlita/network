from django.shortcuts import render
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Block, Transaction, CustomUser, Notification
from .serializers import BlockSerializer, TransactionSerializer, UserSerializer, NotificationSerializer
from django.contrib.auth.models import User
from rest_framework import permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.permissions import IsAdminUser
from .services import fetch_external_block_data, fetch_price_data, fetch_market_data, fetch_news_data, fetch_sentiment_data
from django.db.models import Sum
from django_filters import rest_framework as filters
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

# Create your views here.

class BlockViewSet(viewsets.ModelViewSet):
    queryset = Block.objects.all()
    serializer_class = BlockSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['index', 'timestamp']  # Add more fields as needed
    permission_classes = [IsAdminUser]  # Only admin users can access this view

class TransactionFilter(filters.FilterSet):
    min_amount = filters.NumberFilter(field_name='amount', lookup_expr='gte')
    max_amount = filters.NumberFilter(field_name='amount', lookup_expr='lte')
    start_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    end_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Transaction
        fields = ['sender', 'recipient', 'min_amount', 'max_amount', 'start_date', 'end_date']

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = TransactionFilter
    pagination_class = None  # Use default pagination from settings

    def get_queryset(self):
        queryset = super().get_queryset()
        sort_by = self.request.query_params.get('sort_by', 'id')  # Default sort by ID
        order = self.request.query_params.get('order', 'asc')  # Default order is ascending
        if order == 'desc':
            queryset = queryset.order_by(f'-{sort_by}')
        else:
            queryset = queryset.order_by(sort_by)
        return queryset

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        # Set default roles or allow setting roles from the request
        user.is_admin = self.request.data.get('is_admin', False)
        user.is_miner = self.request.data.get('is_miner', False)
        user.save()

class CustomTokenObtainPairView(TokenObtainPairView):
    # You can customize the token response here if needed
    pass

def create_block(data):
    # Your logic to create a block
    # After creating a block, send a notification
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "blocks",
        {
            "type": "send_block_update",
            "message": "New block created!",
            # Include block data if needed
        }
    )

def create_transaction(data):
    # Your logic to create a transaction
    # After creating a transaction, send a notification
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "transactions",
        {
            "type": "send_transaction_update",
            "message": "New transaction created!",
            # Include transaction data if needed
        }
    )

class ExternalBlockDataView(generics.GenericAPIView):
    def get(self, request):
        data = fetch_external_block_data()
        if data:
            return Response(data, status=status.HTTP_200_OK)
        return Response({"error": "Failed to fetch data"}, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user  # Return the current user

class TransactionAnalyticsView(generics.GenericAPIView):
    def get(self, request):
        total_transactions = Transaction.objects.count()
        total_amount = Transaction.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        average_amount = total_amount / total_transactions if total_transactions > 0 else 0

        return Response({
            'total_transactions': total_transactions,
            'total_amount': total_amount,
            'average_amount': average_amount,
        })

class PriceDataView(generics.GenericAPIView):
    def get(self, request):
        data = fetch_price_data()
        if data:
            return Response(data, status=status.HTTP_200_OK)
        return Response({"error": "Failed to fetch data"}, status=status.HTTP_400_BAD_REQUEST)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)  # Only return notifications for the logged-in user

class AdvancedAnalyticsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        total_transactions = Transaction.objects.count()
        total_amount = Transaction.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        average_amount = total_amount / total_transactions if total_transactions > 0 else 0

        user_transactions = Transaction.objects.filter(sender=user.username)  # Assuming sender is the username
        user_total_amount = user_transactions.aggregate(Sum('amount'))['amount__sum'] or 0
        user_average_amount = user_total_amount / user_transactions.count() if user_transactions.count() > 0 else 0

        return Response({
            'total_transactions': total_transactions,
            'total_amount': total_amount,
            'average_amount': average_amount,
            'user_total_amount': user_total_amount,
            'user_average_amount': user_average_amount,
        })

class MarketDataView(generics.GenericAPIView):
    def get(self, request):
        data = fetch_market_data()
        if data:
            return Response(data, status=status.HTTP_200_OK)
        return Response({"error": "Failed to fetch data"}, status=status.HTTP_400_BAD_REQUEST)

class UserDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        transactions = Transaction.objects.filter(sender=user.username)  # Assuming sender is the username
        total_transactions = transactions.count()
        total_amount = transactions.aggregate(Sum('amount'))['amount__sum'] or 0

        return Response({
            'total_transactions': total_transactions,
            'total_amount': total_amount,
            'transactions': TransactionSerializer(transactions, many=True).data,
        })

class HistoricalTransactionDataView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)  # Last 30 days

        transactions = Transaction.objects.filter(created_at__range=(start_date, end_date))
        daily_data = transactions.values('created_at__date').annotate(total_amount=Sum('amount')).order_by('created_at__date')

        return Response(daily_data)

class NewsDataView(generics.GenericAPIView):
    def get(self, request):
        data = fetch_news_data()
        if data:
            return Response(data, status=status.HTTP_200_OK)
        return Response({"error": "Failed to fetch data"}, status=status.HTTP_400_BAD_REQUEST)

class UserAnalyticsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        transactions = Transaction.objects.filter(sender=user.username)  # Assuming sender is the username
        total_transactions = transactions.count()
        total_amount = transactions.aggregate(Sum('amount'))['amount__sum'] or 0
        average_amount = total_amount / total_transactions if total_transactions > 0 else 0

        return Response({
            'total_transactions': total_transactions,
            'total_amount': total_amount,
            'average_amount': average_amount,
        })

class SentimentDataView(generics.GenericAPIView):
    def get(self, request):
        data = fetch_sentiment_data()
        if data:
            return Response(data, status=status.HTTP_200_OK)
        return Response({"error": "Failed to fetch data"}, status=status.HTTP_400_BAD_REQUEST)
