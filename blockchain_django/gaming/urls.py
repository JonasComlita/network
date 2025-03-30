from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for viewsets
router = DefaultRouter()
router.register(r'categories', views.GameCategoryViewSet)
router.register(r'games', views.GameViewSet)

# URL patterns for gaming app
urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # NFT endpoints
    path('nfts/', views.NFTInventoryView.as_view(), name='nft_inventory'),
    path('nfts/<uuid:id>/', views.NFTDetailView.as_view(), name='nft_detail'),
    
    # Game wallet endpoints
    path('wallet/', views.GameWalletView.as_view(), name='game_wallet'),
    path('transactions/', views.GameTransactionListView.as_view(), name='game_transactions'),
    
    # Game play endpoints
    path('play/start/', views.GamePlayStartView.as_view(), name='game_play_start'),
    path('play/end/', views.GamePlayEndView.as_view(), name='game_play_end'),
    
    # Leaderboard endpoint
    path('leaderboard/<slug:game_slug>/', views.LeaderboardView.as_view(), name='game_leaderboard'),
    
    # Game launcher endpoint
    path('launch/<slug:game_slug>/', views.GameLauncherView.as_view(), name='game_launcher'),
    
    # Dashboard endpoint
    path('dashboard/', views.GamingDashboardView.as_view(), name='gaming_dashboard'),
    
    # Search endpoint
    path('search/', views.GamingSearchView.as_view(), name='gaming_search'),
]