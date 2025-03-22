"""
URL configuration for blockchain_project project.
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from blockchain_django.views import (
    BlockViewSet, TransactionViewSet, RegisterView, CustomTokenObtainPairView, 
    ExternalBlockDataView, UserProfileView, TransactionAnalyticsView, PriceDataView, 
    NotificationViewSet, AdvancedAnalyticsView, MarketDataView, UserDashboardView, 
    HistoricalDataView, NewsDataView, UserAnalyticsView, HistoricalTransactionDataView, 
    SentimentDataView
)
# Import wallet views
from blockchain_django.wallet_views import (
    WalletInfoView, CreateWalletView, SendTransactionView, 
    TransactionHistoryView, UpdateBalanceView
)
from blockchain_django.views import RegisterView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from blockchain_django.views import ChainView

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok"})

router = DefaultRouter()
router.register(r'blocks', BlockViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/', include(router.urls)),
    path('api/external/block/', ExternalBlockDataView.as_view(), name='external_block_data'),
    path('api/profile/', UserProfileView.as_view(), name='user_profile'),
    path('api/analytics/', TransactionAnalyticsView.as_view(), name='transaction_analytics'),
    path('api/price/', PriceDataView.as_view(), name='price_data'),
    path('api/advanced-analytics/', AdvancedAnalyticsView.as_view(), name='advanced_analytics'),
    path('api/market-data/', MarketDataView.as_view(), name='market_data'),
    path('api/dashboard/', UserDashboardView.as_view(), name='user_dashboard'),
    path('api/historical-data/', HistoricalDataView.as_view(), name='historical_data'),
    path('api/news/', NewsDataView.as_view(), name='news_data'),
    path('api/user-analytics/', UserAnalyticsView.as_view(), name='user_analytics'),
    path('api/historical-transactions/', HistoricalTransactionDataView.as_view(), name='historical_transactions'),
    path('api/sentiment/', SentimentDataView.as_view(), name='sentiment_data'),
    path('api/health-check/', health_check, name='health_check'),
    path('api/chain/', ChainView.as_view(), name='chain'),

    # Wallet API endpoints
    path('api/wallet/info/', WalletInfoView.as_view(), name='wallet_info'),
    path('api/wallet/create/', CreateWalletView.as_view(), name='wallet_create'),
    path('api/wallet/send/', SendTransactionView.as_view(), name='wallet_send'),
    path('api/wallet/history/', TransactionHistoryView.as_view(), name='wallet_history'),
    path('api/wallet/balance/', UpdateBalanceView.as_view(), name='wallet_balance'),
]