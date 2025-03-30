# blockchain_project/routing.py
from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# Import consumers from blockchain_django app
from blockchain_django import consumers as blockchain_consumers

# Import WebSocket URL patterns from each app
from blockchain_django.routing import websocket_urlpatterns as blockchain_websocket_urlpatterns
from forum.routing import websocket_urlpatterns as forum_websocket_urlpatterns
from gaming.routing import websocket_urlpatterns as gaming_websocket_urlpatterns

# Define all websocket patterns
websocket_urlpatterns = [
    # Block-related WebSockets
    re_path(r'ws/blocks/$', blockchain_consumers.BlockConsumer.as_asgi()),
    
    # Transaction-related WebSockets
    re_path(r'ws/transactions/$', blockchain_consumers.TransactionConsumer.as_asgi()),
    re_path(r'ws/transaction/$', blockchain_consumers.TransactionConsumer.as_asgi()),
    re_path(r'ws/transaction_list/$', blockchain_consumers.TransactionConsumer.as_asgi()),
    
    # Wallet-related WebSockets
    re_path(r'ws/wallet/$', blockchain_consumers.WalletConsumer.as_asgi()),
    re_path(r'ws/wallets/$', blockchain_consumers.WalletConsumer.as_asgi()),  # Added for multiple wallets support
    
    # User profile WebSockets
    re_path(r'ws/user_profile/$', blockchain_consumers.UserProfileConsumer.as_asgi()),
    
    # Authentication WebSockets
    re_path(r'ws/auth_status/$', blockchain_consumers.AuthStatusConsumer.as_asgi()),  # Added for auth status updates
    
    # Analytics WebSockets
    re_path(r'ws/analytics/$', blockchain_consumers.AdvancedAnalyticsConsumer.as_asgi()),
    re_path(r'ws/advanced_analytics/$', blockchain_consumers.AdvancedAnalyticsConsumer.as_asgi()),
    re_path(r'ws/transaction_analytics/$', blockchain_consumers.TransactionAnalyticsConsumer.as_asgi()),
    re_path(r'ws/blockchain_chart/$', blockchain_consumers.BlockchainChartConsumer.as_asgi()),
    re_path(r'ws/historical_data/$', blockchain_consumers.HistoricalDataConsumer.as_asgi()),
    re_path(r'ws/historical_transactions/$', blockchain_consumers.HistoricalTransactionDataConsumer.as_asgi()),
    re_path(r'ws/market_data/$', blockchain_consumers.MarketDataConsumer.as_asgi()),
    re_path(r'ws/user_analytics/$', blockchain_consumers.UserAnalyticsConsumer.as_asgi()),
    
    # User-related WebSockets
    re_path(r'ws/user_dashboard/$', blockchain_consumers.UserDashboardConsumer.as_asgi()),
    re_path(r'ws/user_preferences/$', blockchain_consumers.UserPreferencesConsumer.as_asgi()),
    
    # 2FA WebSockets
    re_path(r'ws/2fa_status/$', blockchain_consumers.TwoFactorStatusConsumer.as_asgi()),  # Added for 2FA status updates
    
    # Data WebSockets
    re_path(r'ws/price/$', blockchain_consumers.PriceChangeConsumer.as_asgi()),
    re_path(r'ws/price_data/$', blockchain_consumers.PriceChangeConsumer.as_asgi()),
    re_path(r'ws/price_changes/$', blockchain_consumers.PriceChangeConsumer.as_asgi()),
    re_path(r'ws/news_data/$', blockchain_consumers.NewsDataConsumer.as_asgi()),
    re_path(r'ws/sentiment/$', blockchain_consumers.SentimentDataConsumer.as_asgi()),
    re_path(r'ws/sentiment_data/$', blockchain_consumers.SentimentDataConsumer.as_asgi()),
    
    # Notification WebSockets
    re_path(r'ws/notifications/$', blockchain_consumers.NotificationConsumer.as_asgi()),
    
    # Multi-wallet WebSockets
    re_path(r'ws/user_wallet/(?P<wallet_address>[^/]+)/$', blockchain_consumers.UserWalletConsumer.as_asgi()),  # Added for specific wallet updates
    
    # Utility WebSockets
    re_path(r'ws/health-check/$', blockchain_consumers.HealthCheckConsumer.as_asgi()),
    re_path(r'ws/test/$', blockchain_consumers.TestConsumer.as_asgi()),

    # Now add the forum and gaming patterns directly
    # These patterns are also imported from their respective modules above
]

# Extend the websocket_urlpatterns with the patterns from forum and gaming apps
websocket_urlpatterns.extend(forum_websocket_urlpatterns)
websocket_urlpatterns.extend(gaming_websocket_urlpatterns)

# Define application for ASGI configuration
application = ProtocolTypeRouter({
    # WebSocket handling with authentication
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})