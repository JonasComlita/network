"""
URL configuration for blockchain_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from blockchain.views import BlockViewSet, TransactionViewSet, RegisterView, CustomTokenObtainPairView, ExternalBlockDataView, UserProfileView, TransactionAnalyticsView, PriceDataView, NotificationViewSet, AdvancedAnalyticsView, MarketDataView, UserDashboardView, HistoricalDataView, NewsDataView, UserAnalyticsView, HistoricalTransactionDataView, SentimentDataView

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
]
