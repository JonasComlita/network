from django.shortcuts import render
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Block, BlockchainTransaction, CustomUser, Notification, HistoricalData
from .serializers import BlockSerializer, TransactionSerializer, UserSerializer, NotificationSerializer, HistoricalDataSerializer
from rest_framework import permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from .services import fetch_external_block_data, fetch_price_data, fetch_market_data, fetch_news_data, fetch_sentiment_data
from django.db.models import Sum
from django_filters import rest_framework as filters
from django.utils import timezone
from datetime import timedelta
from django.db import connection
from blockchain.blockchain import Blockchain
from blockchain.transaction import Transaction
from blockchain_django.wallet_manager import wallet_manager
import logging
import asyncio
import threading
from blockchain_django.blockchain_service import get_blockchain
import concurrent.futures
logger = logging.getLogger(__name__)


blockchain_instance = Blockchain()

def run_async_in_thread(async_func, *args, **kwargs):
    """Run an async function in a new thread with its own event loop"""
    result_container = {}
    
    def thread_target():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result_container['result'] = loop.run_until_complete(async_func(*args, **kwargs))
        except Exception as e:
            result_container['error'] = e
        finally:
            loop.close()
    
    thread = threading.Thread(target=thread_target)
    thread.start()
    thread.join(timeout=30)  # Wait up to 30 seconds
    
    if 'error' in result_container:
        raise result_container['error']
    return result_container.get('result')

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
        model = BlockchainTransaction  # Use the renamed model
        fields = ['sender', 'recipient', 'min_amount', 'max_amount', 'start_date', 'end_date']

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = BlockchainTransaction.objects.all()
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
    
class BlockchainInfoView(APIView):
    def get(self, request):
        """Return general blockchain information"""
        return Response({
            "chain_length": len(blockchain_instance.chain),
            "difficulty": blockchain_instance.difficulty,
            "current_reward": blockchain_instance.current_reward,
            "mempool_size": blockchain_instance.mempool.size()
        })

class BlockListView(APIView):
    def get(self, request):
        """Return recent blocks"""
        recent_blocks = [block.to_dict() for block in blockchain_instance.chain[-10:]]
        return Response(recent_blocks)

class TransactionView(APIView):
    def post(self, request):
        """Create and broadcast a new transaction"""
        # Extract transaction data from request
        sender = request.data.get('sender')
        recipient = request.data.get('recipient')
        amount = float(request.data.get('amount'))
        private_key = request.data.get('private_key')
        
        # Create transaction
        tx = Transaction(sender, recipient, amount)
        # Sign transaction
        tx.sign(private_key)
        # Add to mempool
        success = blockchain_instance.add_transaction_to_mempool(tx)
        
        return Response({"success": success, "tx_id": tx.tx_id})

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        """
        Enhanced user registration with integrated wallet creation.
        
        This method:
        1. Validates the user data
        2. Creates the user account
        3. Attempts to create a blockchain wallet
        4. Associates the wallet with the user if successful
        5. Provides appropriate error handling and feedback
        """
        logger.info(f"Registration request received")
        
        # Step 1: Validate input data
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        # Step 2: Validate wallet passphrase
        wallet_passphrase = request.data.get('wallet_passphrase')
        if not wallet_passphrase:
            logger.error("Missing wallet passphrase")
            return Response(
                {"error": "Wallet passphrase is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if len(wallet_passphrase) < 8:
            logger.error("Wallet passphrase too short")
            return Response(
                {"error": "Wallet passphrase must be at least 8 characters long"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Step 3: Create user account
        user = serializer.save()
        user.is_admin = request.data.get('is_admin', False)
        user.is_miner = request.data.get('is_miner', False)
        user.wallet_created_at = timezone.now()  # Set creation time even before wallet is created
        user.save()
        
        # Step 4: Create user wallet
        try:
            # Get blockchain instance
            blockchain = get_blockchain()
            if not blockchain or not getattr(blockchain, 'initialized', False):
                logger.warning("Blockchain not initialized, setting wallet as pending")
                user.wallet_address = f"temp_{user.id}"  # Temporary wallet address
                user.is_wallet_active = False
                user.save()
                
                # Return success but indicate wallet is pending
                response_data = serializer.data
                response_data['wallet_status'] = 'pending'
                response_data['message'] = 'User created successfully, but blockchain service is unavailable. Wallet will be created when the service is available.'
                return Response(response_data, status=status.HTTP_201_CREATED)

            # Create wallet with improved error handling
            wallet_address = self.create_user_wallet(user, blockchain, wallet_passphrase)
            
            if wallet_address:
                # Wallet created successfully
                user.wallet_address = wallet_address
                user.is_wallet_active = True
                user.save()
                
                logger.info(f"User {user.username} registered with wallet {wallet_address}")
                response_data = serializer.data
                response_data['wallet_status'] = 'active'
                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                # Wallet creation failed but user account is still created
                user.wallet_address = f"temp_{user.id}"  # Temporary wallet address
                user.is_wallet_active = False
                user.save()
                
                response_data = serializer.data
                response_data['wallet_status'] = 'pending'
                response_data['message'] = 'User created successfully, but wallet creation failed. Please try creating a wallet later from your profile.'
                return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Wallet creation error: {str(e)}")
            
            # Instead of deleting the user, mark wallet as failed
            user.wallet_address = f"temp_{user.id}"  # Temporary wallet address
            user.is_wallet_active = False
            user.save()
            
            response_data = serializer.data
            response_data['wallet_status'] = 'error'
            response_data['message'] = f'Account created successfully, but there was an error creating your wallet: {str(e)}'
            return Response(response_data, status=status.HTTP_201_CREATED)

    def create_user_wallet(self, user, blockchain, wallet_passphrase):
        """
        Create a blockchain wallet for the user with improved error handling.
        
        Returns wallet address if successful, None otherwise.
        """
        try:
            # Import our helper
            from fix_asyncio import run_async
            
            # Create wallet with run_async
            logger.info(f"Creating wallet for user {user.id} with fixed method")
            wallet_address = run_async(
                blockchain.create_wallet(
                    user_id=str(user.id), 
                    wallet_passphrase=wallet_passphrase
                )
            )
            
            if not wallet_address:
                logger.error(f"Wallet creation returned None for user {user.id}")
                return None
                
            return wallet_address
        except Exception as e:
            logger.error(f"Error creating wallet for user {user.id}: {str(e)}")
            return None
        
# blockchain_django/views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import status
from rest_framework.response import Response

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # Call the parent class's post method to handle authentication and token generation
        response = super().post(request, *args, **kwargs)

        # Check if authentication was successful (status 200)
        if response.status_code == status.HTTP_200_OK:
            # At this point, request.user should be the authenticated user
            user = self.request.user
            if user.is_authenticated and hasattr(user, 'wallet_address'):
                response.data['wallet_address'] = user.wallet_address
            else:
                # Handle case where user is somehow still not authenticated or has no wallet
                response.data['wallet_address'] = None
        return response

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

class ChainView(APIView):
    def get(self, request):
        try:
            blockchain = get_blockchain()
            chain = [block.to_dict() for block in blockchain.chain[-10:]]  # Last 10 blocks
            return Response(chain)
        except Exception as e:
            return Response({"message": str(e)}, status=503)  # Service Unavailable