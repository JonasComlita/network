"""
URL configuration for blockchain_project project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from blockchain_django.views import (
    BlockViewSet, TransactionViewSet, RegisterView, CustomTokenObtainPairView, 
    ExternalBlockDataView, UserProfileView, TransactionAnalyticsView, PriceDataView, 
    NotificationViewSet, AdvancedAnalyticsView, MarketDataView, UserDashboardView, 
    HistoricalDataView, NewsDataView, UserAnalyticsView, HistoricalTransactionDataView, 
    SentimentDataView, ChainView
)
# Import wallet views
from blockchain_django.wallet_views import (
    WalletInfoView, CreateWalletView, SendTransactionView, 
    TransactionHistoryView, UpdateBalanceView, WalletListView, 
    WalletDetailView, WalletTransactionHistoryView, WalletBackupView
)

from blockchain_django.auth_views import (
    VerifyEmailView, PasswordResetRequestView, PasswordResetConfirmView,
    LoginWithTwoFactorView, TokenRefreshWithTwoFactorView
)

from blockchain_django.profile_views import (
    UserProfileView, UserPreferencesView, ChangePasswordView, TwoFactorSetupView, 
    TwoFactorVerifySetupView, TwoFactorDisableView, TwoFactorBackupCodesView
)

# Import notification views
from blockchain_django.notification_views import (
    NotificationListView, NotificationDetailView, MarkAllNotificationsReadView
)

# Security views
from blockchain_django.security_views import (
    LoginHistoryView, SecurityOverviewView, TwoFactorStatusView
)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Health check endpoint
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok"})

router = DefaultRouter()
router.register(r'blocks', BlockViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshWithTwoFactorView.as_view(), name='token_refresh'),
    path('api/token/2fa/', LoginWithTwoFactorView.as_view(), name='token_2fa'),
    
    # Email verification and password reset
    path('api/verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('api/password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('api/password-reset/confirm/<str:token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # API router for viewsets
    path('api/', include(router.urls)),
    
    # External data endpoints
    path('api/external/block/', ExternalBlockDataView.as_view(), name='external_block_data'),

    # User profile endpoints
    path('api/user/profile/', UserProfileView.as_view(), name='user_profile'),
    path('api/user/preferences/', UserPreferencesView.as_view(), name='user_preferences'),
    path('api/user/change-password/', ChangePasswordView.as_view(), name='change_password'),

    # 2FA endpoints
    path('api/user/2fa/setup/', TwoFactorSetupView.as_view(), name='2fa_setup'),
    path('api/user/2fa/verify-setup/', TwoFactorVerifySetupView.as_view(), name='2fa_verify_setup'),
    path('api/user/2fa/disable/', TwoFactorDisableView.as_view(), name='2fa_disable'),
    path('api/user/2fa/backup-codes/', TwoFactorBackupCodesView.as_view(), name='2fa_backup_codes'),
    path('api/user/2fa/status/', TwoFactorStatusView.as_view(), name='2fa_status'),

    # Security endpoints
    path('api/user/security/login-history/', LoginHistoryView.as_view(), name='login_history'),
    path('api/user/security/overview/', SecurityOverviewView.as_view(), name='security_overview'),

    # Notification endpoints
    path('api/notifications/', NotificationListView.as_view(), name='notification_list'),
    path('api/notifications/<int:pk>/', NotificationDetailView.as_view(), name='notification_detail'),
    path('api/notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark_all_notifications_read'),

    # Analytics endpoints
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

    # Legacy wallet API endpoints
    path('api/wallet/info/', WalletInfoView.as_view(), name='wallet_info'),
    path('api/wallet/create/', CreateWalletView.as_view(), name='wallet_create'),
    path('api/wallet/send/', SendTransactionView.as_view(), name='wallet_send'),
    path('api/wallet/history/', TransactionHistoryView.as_view(), name='wallet_history'),
    path('api/wallet/balance/', UpdateBalanceView.as_view(), name='wallet_balance'),
    
    # Multi-wallet API endpoints
    path('api/wallets/', WalletListView.as_view(), name='wallet_list'),
    path('api/wallets/<str:wallet_address>/', WalletDetailView.as_view(), name='wallet_detail'),
    path('api/wallets/<str:wallet_address>/transactions/', WalletTransactionHistoryView.as_view(), name='wallet_transactions'),
    path('api/wallets/<str:wallet_address>/send/', SendTransactionView.as_view(), name='send_transaction'),
    path('api/wallets/<str:wallet_address>/backup/', WalletBackupView.as_view(), name='wallet_backup'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)