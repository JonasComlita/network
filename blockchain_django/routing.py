# blockchain_django/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Block-related WebSockets
    re_path(r'ws/blocks/$', consumers.BlockConsumer.as_asgi()),
    
    # Transaction-related WebSockets
    re_path(r'ws/transactions/$', consumers.TransactionConsumer.as_asgi()),
    re_path(r'ws/transaction/$', consumers.TransactionConsumer.as_asgi()),
    re_path(r'ws/transaction_list/$', consumers.TransactionConsumer.as_asgi()),
    
    # Wallet-related WebSockets
    re_path(r'ws/wallet/$', consumers.WalletConsumer.as_asgi()),
    
    # Analytics WebSockets
    re_path(r'ws/analytics/$', consumers.AdvancedAnalyticsConsumer.as_asgi()),
    re_path(r'ws/advanced_analytics/$', consumers.AdvancedAnalyticsConsumer.as_asgi()),
    re_path(r'ws/transaction_analytics/$', consumers.TransactionAnalyticsConsumer.as_asgi()),
    re_path(r'ws/blockchain_chart/$', consumers.BlockchainChartConsumer.as_asgi()),
    re_path(r'ws/historical_data/$', consumers.HistoricalDataConsumer.as_asgi()),
    re_path(r'ws/historical_transactions/$', consumers.HistoricalTransactionDataConsumer.as_asgi()),
    re_path(r'ws/market_data/$', consumers.MarketDataConsumer.as_asgi()),
    re_path(r'ws/user_analytics/$', consumers.UserAnalyticsConsumer.as_asgi()),
    
    # User-related WebSockets
    re_path(r'ws/user_dashboard/$', consumers.UserDashboardConsumer.as_asgi()),
    re_path(r'ws/user_profile/$', consumers.UserProfileConsumer.as_asgi()),
    re_path(r'ws/user_preferences/$', consumers.UserPreferencesConsumer.as_asgi()),
    
    # Data WebSockets
    re_path(r'ws/price/$', consumers.PriceChangeConsumer.as_asgi()),
    re_path(r'ws/price_data/$', consumers.PriceChangeConsumer.as_asgi()),
    re_path(r'ws/price_changes/$', consumers.PriceChangeConsumer.as_asgi()),
    re_path(r'ws/news_data/$', consumers.NewsDataConsumer.as_asgi()),
    re_path(r'ws/sentiment/$', consumers.SentimentDataConsumer.as_asgi()),
    re_path(r'ws/sentiment_data/$', consumers.SentimentDataConsumer.as_asgi()),
    
    # Notification WebSockets
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    
    # Utility WebSockets
    re_path(r'ws/health-check/$', consumers.HealthCheckConsumer.as_asgi()),
    re_path(r'ws/test/$', consumers.TestConsumer.as_asgi()),
]