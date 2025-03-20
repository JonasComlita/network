from django.shortcuts import render
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Block, Transaction, CustomUser, Notification, HistoricalData
from .serializers import BlockSerializer, TransactionSerializer, UserSerializer, NotificationSerializer, HistoricalDataSerializer
from django.contrib.auth.models import User
from rest_framework import permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from .services import fetch_external_block_data, fetch_price_data, fetch_market_data, fetch_news_data, fetch_sentiment_data
from django.db.models import Sum
from django_filters import rest_framework as filters
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from django.db import connection

# Create your views here.

class BlockViewSet(viewsets.ModelViewSet):
    queryset = Block.objects.all()
    serializer_class = BlockSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['index', 'timestamp']
    permission_classes = [IsAuthenticated]  # Changed from IsAdminUser
    authentication_classes = [JWTAuthentication, SessionAuthentication]

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
        user.is_admin = self.request.data.get('is_admin', False)
        user.is_miner = self.request.data.get('is_miner', False)
        user.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  # Return validation errors

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
    permission_classes = [IsAuthenticated]  # Added explicit permission
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    
    def get(self, request):
        # Debug authentication
        print(f"Auth header: {request.META.get('HTTP_AUTHORIZATION', 'None')}")
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"User: {request.user}")
        
        total_transactions = Transaction.objects.count()
        total_amount = Transaction.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        average_amount = total_amount / total_transactions if total_transactions > 0 else 0

        return Response({
            'total_transactions': total_transactions,
            'total_amount': total_amount,
            'average_amount': average_amount,
        })

class PriceDataView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]  # Added explicit permission
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    
    def get(self, request):
        # Debug authentication
        print(f"Auth header: {request.META.get('HTTP_AUTHORIZATION', 'None')}")
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"User: {request.user}")
        
        data = fetch_price_data()
        if data:
            return Response(data, status=status.HTTP_200_OK)
        return Response({"error": "Failed to fetch data"}, status=status.HTTP_400_BAD_REQUEST)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Debug authentication
        print(f"Auth header: {self.request.META.get('HTTP_AUTHORIZATION', 'None')}")
        print(f"User authenticated: {self.request.user.is_authenticated}")
        print(f"User: {self.request.user}")
        
        # For testing, return some dummy notifications instead of failing
        # This avoids the CustomUser vs User model issue temporarily
        return Notification.objects.none()  # Return empty queryset as a placeholder

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
    
class HistoricalDataView(generics.ListAPIView):
    serializer_class = HistoricalDataSerializer

    def get_queryset(self):
        queryset = HistoricalData.objects.all()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if start_date and end_date:
            queryset = queryset.filter(timestamp__range=[start_date, end_date])
        if min_price and max_price:
            queryset = queryset.filter(price__range=[min_price, max_price])

        return queryset

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
    permission_classes = [IsAuthenticated]  # Added explicit permission
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    
    def get(self, request):
        # Debug authentication
        print(f"Auth header: {request.META.get('HTTP_AUTHORIZATION', 'None')}")
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"User: {request.user}")
        
        data = fetch_sentiment_data()
        if data:
            return Response(data, status=status.HTTP_200_OK)
        return Response({"error": "Failed to fetch data"}, status=status.HTTP_400_BAD_REQUEST)

def fetch_blockchain_data(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM blocks;")
        blocks = cursor.fetchall()
    return render(request, 'blocks.html', {'blocks': blocks})
