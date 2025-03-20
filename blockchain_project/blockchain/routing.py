from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/blocks/$', consumers.BlockConsumer.as_asgi()),
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/analytics/$', consumers.AdvancedAnalyticsConsumer.as_asgi()),
    re_path(r'ws/transaction_analytics/$', consumers.TransactionAnalyticsConsumer.as_asgi()),
    re_path(r'ws/user_profile/$', consumers.UserProfileConsumer.as_asgi()),
    re_path(r'ws/user_preferences/$', consumers.UserPreferencesConsumer.as_asgi()),
    re_path(r'ws/price/$', consumers.PriceChangeConsumer.as_asgi()),  # Changed to match frontend
    re_path(r'ws/price_data/$', consumers.PriceChangeConsumer.as_asgi()),  # Keep old path for compatibility
    re_path(r'ws/transaction_list/$', consumers.TransactionConsumer.as_asgi()),
    re_path(r'ws/market_data/$', consumers.MarketDataConsumer.as_asgi()),
    re_path(r'ws/user_dashboard/$', consumers.UserDashboardConsumer.as_asgi()),
    re_path(r'ws/historical_data/$', consumers.HistoricalDataConsumer.as_asgi()),
    re_path(r'ws/health-check/$', consumers.HealthCheckConsumer.as_asgi()),  # Added health check endpoint
    re_path(r'ws/blockchain_chart/$', consumers.BlockchainChartConsumer.as_asgi()),
    re_path(r'ws/transaction/$', consumers.TransactionConsumer.as_asgi()),
    re_path(r'ws/news_data/$', consumers.NewsDataConsumer.as_asgi()),
]