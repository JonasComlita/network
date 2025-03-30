from rest_framework import viewsets, generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Sum, Count, F, ExpressionWrapper, fields
import datetime
import random
import logging

from .models import (
    GameCategory, Game, NFT, GameToken, UserGameWallet, 
    GameTransaction, GamePlay, Achievement, UserAchievement,
    Leaderboard, LeaderboardEntry
)
from .serializers import (
    GameCategorySerializer, GameListSerializer, GameDetailSerializer, 
    NFTSerializer, GameTokenSerializer, UserGameWalletSerializer,
    GameTransactionSerializer, GamePlaySerializer, AchievementSerializer,
    UserAchievementSerializer, LeaderboardSerializer, LeaderboardEntrySerializer
)
from blockchain_django.blockchain_service import get_blockchain

logger = logging.getLogger(__name__)


class GameCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for game categories"""
    queryset = GameCategory.objects.all()
    serializer_class = GameCategorySerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    permission_classes = [IsAuthenticatedOrReadOnly]


class GameViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for games"""
    queryset = Game.objects.all()
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'play_to_earn', 'nft_enabled']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'players', 'rating', 'created_at']
    ordering = ['-players']
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GameDetailSerializer
        return GameListSerializer


class NFTInventoryView(generics.ListAPIView):
    """API endpoint to list NFTs owned by the user"""
    serializer_class = NFTSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['game', 'rarity', 'type']
    search_fields = ['name', 'description']
    ordering_fields = ['acquired_at', 'last_price']
    ordering = ['-acquired_at']

    def get_queryset(self):
        return NFT.objects.filter(owner=self.request.user)


class GameWalletView(APIView):
    """API endpoint for user's game wallet"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's game wallet details"""
        try:
            # Get or create main game wallet
            wallet, created = UserGameWallet.objects.get_or_create(
                user=request.user,
                game=None,  # Main gaming wallet has no specific game
                defaults={
                    'main_wallet_address': request.user.wallet_address,
                    'token_balances': {'NET': 0.0}  # Initialize with 0 NET tokens
                }
            )
            
            # Get recent transactions
            transactions = GameTransaction.objects.filter(user=request.user).order_by('-timestamp')[:7]
            
            # Calculate total earnings
            total_earned = GameTransaction.objects.filter(
                user=request.user,
                type='earning'
            ).aggregate(total=Sum('amount')).get('total', 0)
            
            if total_earned is None:
                total_earned = 0
            
            # Calculate recent earnings
            week_ago = timezone.now() - datetime.timedelta(days=7)
            recent_earned = GameTransaction.objects.filter(
                user=request.user,
                type='earning',
                timestamp__gte=week_ago
            ).aggregate(total=Sum('amount')).get('total', 0)
            
            if recent_earned is None:
                recent_earned = 0
            
            # Get game-specific wallets
            game_wallets = UserGameWallet.objects.filter(
                user=request.user, 
                game__isnull=False
            )
            
            # Format response data
            response_data = {
                'wallet': UserGameWalletSerializer(wallet).data,
                'transactions': GameTransactionSerializer(transactions, many=True).data,
                'stats': {
                    'total_earned': float(total_earned),
                    'recent_earned': float(recent_earned),
                    'game_wallets_count': game_wallets.count()
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error fetching game wallet: {str(e)}")
            return Response(
                {'error': 'Failed to fetch wallet data'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GamePlayStartView(APIView):
    """API endpoint to start a game session"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Start a new game play session"""
        try:
            game_slug = request.data.get('game_slug')
            
            if not game_slug:
                return Response(
                    {'error': 'Game slug is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get game or return 404
            game = get_object_or_404(Game, slug=game_slug)
            
            # Create new game play session
            game_play = GamePlay.objects.create(
                user=request.user,
                game=game,
                session_id=uuid.uuid4(),
                token_type=game.token_name
            )
            
            # Update game metrics
            game.players += 1
            game.save(update_fields=['players'])
            
            # Return session data
            return Response({
                'session_id': str(game_play.session_id),
                'game': GameDetailSerializer(game).data,
                'start_time': game_play.start_time.isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error starting game play: {str(e)}")
            return Response(
                {'error': 'Failed to start game session'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GamePlayEndView(APIView):
    """API endpoint to end a game session and record earnings"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """End a game play session and record results"""
        try:
            # Get session ID from request
            session_id = request.data.get('session_id')
            
            if not session_id:
                return Response(
                    {'error': 'Session ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get game play session or return 404
            game_play = get_object_or_404(
                GamePlay,
                session_id=session_id,
                user=request.user,
                end_time__isnull=True  # Ensure session is still active
            )
            
            # Update game play with end data
            game_play.end_time = timezone.now()
            game_play.duration = game_play.end_time - game_play.start_time
            game_play.score = request.data.get('score', 0)
            game_play.completed_objectives = request.data.get('completed_objectives', 0)
            game_play.achievements_unlocked = request.data.get('achievements', [])
            
            # Calculate earnings based on gameplay
            earned_tokens = 0
            
            # Base earnings from play time (1 token per minute, up to 15)
            minutes_played = game_play.duration.total_seconds() / 60
            time_tokens = min(minutes_played, 15)
            
            # Tokens from score (depends on game specific rules)
            score_tokens = game_play.score / 100  # 1 token per 100 points
            
            # Tokens from objectives
            objective_tokens = game_play.completed_objectives * 5  # 5 tokens per objective
            
            # Sum up earnings
            earned_tokens = time_tokens + score_tokens + objective_tokens
            
            # Cap earnings at reasonable amount to prevent abuse
            earned_tokens = min(earned_tokens, 100)
            
            game_play.earned_tokens = earned_tokens
            game_play.save()
            
            # Record transaction if tokens were earned
            if earned_tokens > 0:
                # Create transaction record
                transaction = GameTransaction.objects.create(
                    user=request.user,
                    game=game_play.game,
                    type='earning',
                    token=game_play.token_type,
                    amount=earned_tokens,
                    description=f"Earned from gameplay in {game_play.game.title}"
                )
                
                # Update wallet balance
                wallet, created = UserGameWallet.objects.get_or_create(
                    user=request.user,
                    game=None,  # Main gaming wallet
                    defaults={
                        'main_wallet_address': request.user.wallet_address,
                        'token_balances': {'NET': 0.0}
                    }
                )
                
                # Update token balance
                token_balances = wallet.token_balances
                token_balances[game_play.token_type] = token_balances.get(game_play.token_type, 0) + earned_tokens
                wallet.token_balances = token_balances
                wallet.save()
                
                # Verify transaction on blockchain
                self.verify_transaction_on_blockchain(transaction, game_play)
            
            # Return session results
            return Response({
                'session_id': str(game_play.session_id),
                'game': game_play.game.title,
                'duration': minutes_played,
                'score': game_play.score,
                'earned_tokens': float(earned_tokens),
                'token_type': game_play.token_type
            })
            
        except Exception as e:
            logger.error(f"Error ending game play: {str(e)}")
            return Response(
                {'error': 'Failed to end game session'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def verify_transaction_on_blockchain(self, transaction, game_play):
        """Record transaction on blockchain (async)"""
        try:
            # Get blockchain instance
            blockchain = get_blockchain()
            
            # Create data to be stored on blockchain
            transaction_data = {
                'type': 'game_reward',
                'transaction_id': str(transaction.id),
                'user_id': transaction.user.id,
                'game_id': game_play.game.id,
                'amount': float(transaction.amount),
                'token': transaction.token,
                'timestamp': timezone.now().isoformat()
            }
            
            # In production, this should be a Celery task
            import threading
            def record_on_blockchain():
                try:
                    # Call blockchain service to record the transaction
                    from blockchain_django.fix_asyncio import run_async
                    tx_hash = run_async(blockchain.store_data(transaction_data))
                    
                    if tx_hash:
                        transaction.blockchain_verified = True
                        transaction.tx_hash = tx_hash
                        transaction.save(update_fields=['blockchain_verified', 'tx_hash'])
                        
                        # Also mark game play as verified
                        game_play.verified = True
                        game_play.save(update_fields=['verified'])
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error verifying game transaction on blockchain: {str(e)}")
            
            # Run in background thread to avoid blocking response
            t = threading.Thread(target=record_on_blockchain)
            t.daemon = True
            t.start()
        
        except Exception as e:
            logger.error(f"Error starting blockchain verification for transaction: {str(e)}")


class LeaderboardView(generics.RetrieveAPIView):
    """API endpoint to retrieve game leaderboard"""
    serializer_class = LeaderboardSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_object(self):
        game_slug = self.kwargs.get('game_slug')
        period = self.request.query_params.get('period', 'weekly')
        
        # Get game or return 404
        game = get_object_or_404(Game, slug=game_slug)
        
        # Get or create leaderboard
        leaderboard, created = Leaderboard.objects.get_or_create(
            game=game,
            period=period
        )
        
        # If leaderboard was just created or is older than a day, refresh it
        if created or (timezone.now() - leaderboard.updated_at).days >= 1:
            self.update_leaderboard(leaderboard)
        
        return leaderboard
    
    def update_leaderboard(self, leaderboard):
        """Update leaderboard with latest data"""
        try:
            # Determine time period for filtering
            now = timezone.now()
            start_date = None
            
            if leaderboard.period == 'daily':
                start_date = now - datetime.timedelta(days=1)
            elif leaderboard.period == 'weekly':
                start_date = now - datetime.timedelta(days=7)
            elif leaderboard.period == 'monthly':
                start_date = now - datetime.timedelta(days=30)
            
            # Query for determining top players
            query = GamePlay.objects.filter(game=leaderboard.game)
            
            if start_date:
                query = query.filter(start_time__gte=start_date)
            
            # Aggregate data by user
            leaderboard_data = query.values(
                'user'
            ).annotate(
                total_score=Sum('score'),
                total_earnings=Sum('earned_tokens')
            ).order_by('-total_score')[:10]  # Top 10 players
            
            # Clear existing entries
            LeaderboardEntry.objects.filter(leaderboard=leaderboard).delete()
            
            # Create new entries
            rank = 1
            for entry in leaderboard_data:
                user = entry['user']
                
                # Get user's wallet address if available
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    user_obj = User.objects.get(id=user)
                    wallet_address = user_obj.wallet_address
                except User.DoesNotExist:
                    wallet_address = None
                
                LeaderboardEntry.objects.create(
                    leaderboard=leaderboard,
                    user_id=user,
                    rank=rank,
                    score=entry['total_score'],
                    earnings=entry['total_earnings'] or 0,
                    wallet_address=wallet_address
                )
                rank += 1
            
            # Update leaderboard timestamp
            leaderboard.updated_at = timezone.now()
            leaderboard.save()
            
        except Exception as e:
            logger.error(f"Error updating leaderboard: {str(e)}")


class GameLauncherView(APIView):
    """API endpoint to generate info needed to launch a game"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, game_slug):
        """Generate a launch token for a specific game"""
        try:
            # Get game or return 404
            game = get_object_or_404(Game, slug=game_slug)
            
            # Verify game is playable
            if not game.file_name:
                return Response(
                    {'error': 'This game is not yet available to play'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate a game play token that includes authentication info
            import time
            import jwt
            from django.conf import settings
            
            # Create game play token with basic authentication info
            play_token = jwt.encode(
                {
                    'user_id': request.user.id,
                    'username': request.user.username,
                    'wallet': request.user.wallet_address,
                    'game_id': game.id,
                    'timestamp': int(time.time()),
                    # Set expiration to 1 hour
                    'exp': int(time.time()) + 3600
                },
                settings.SECRET_KEY,
                algorithm='HS256'
            )
            
            # Return game launch info
            return Response({
                'game': GameDetailSerializer(game).data,
                'auth_token': play_token,
                # Build game URL
                'game_url': f"/games/{game.id}.html",
                'dependencies': game.dependencies
            })
            
        except Exception as e:
            logger.error(f"Error generating game launch info: {str(e)}")
            return Response(
                {'error': 'Failed to generate game launch information'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class NFTDetailView(generics.RetrieveAPIView):
    """API endpoint to retrieve NFT details"""
    serializer_class = NFTSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return NFT.objects.filter(owner=self.request.user)


class GameTransactionListView(generics.ListAPIView):
    """API endpoint to list user's game transactions"""
    serializer_class = GameTransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['game', 'type', 'token']
    ordering_fields = ['timestamp', 'amount']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        return GameTransaction.objects.filter(user=self.request.user)


class GamingDashboardView(APIView):
    """API endpoint that provides an overview of user's gaming activity"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get gaming dashboard data"""
        try:
            # Get games played count
            games_played = GamePlay.objects.filter(
                user=request.user
            ).values('game').distinct().count()
            
            # Get total play time
            play_time_query = GamePlay.objects.filter(
                user=request.user,
                end_time__isnull=False
            ).aggregate(
                total_duration=Sum(
                    ExpressionWrapper(
                        F('end_time') - F('start_time'),
                        output_field=fields.DurationField()
                    )
                )
            )
            total_play_time = play_time_query['total_duration'] or datetime.timedelta()
            
            # Format as hours and minutes
            total_hours = total_play_time.total_seconds() // 3600
            total_minutes = (total_play_time.total_seconds() % 3600) // 60
            
            # Get total earnings
            total_earnings = GameTransaction.objects.filter(
                user=request.user,
                type='earning'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Get recent earnings (last 7 days)
            week_ago = timezone.now() - datetime.timedelta(days=7)
            recent_earnings = GameTransaction.objects.filter(
                user=request.user,
                type='earning',
                timestamp__gte=week_ago
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Get NFT count
            nft_count = NFT.objects.filter(owner=request.user).count()
            
            # Get recent games played
            recent_games = GamePlay.objects.filter(
                user=request.user
            ).order_by('-start_time')[:5]
            
            recent_game_data = []
            for play in recent_games:
                recent_game_data.append({
                    'game_id': play.game.id,
                    'game_title': play.game.title,
                    'start_time': play.start_time.isoformat(),
                    'score': play.score,
                    'earned_tokens': float(play.earned_tokens) if play.earned_tokens else 0,
                    'token_type': play.token_type
                })
            
            # Return dashboard data
            return Response({
                'games_played': games_played,
                'play_time': {
                    'hours': int(total_hours),
                    'minutes': int(total_minutes),
                    'formatted': f"{int(total_hours)}h {int(total_minutes)}m"
                },
                'earnings': {
                    'total': float(total_earnings),
                    'recent': float(recent_earnings)
                },
                'nft_count': nft_count,
                'recent_games': recent_game_data
            })
            
        except Exception as e:
            logger.error(f"Error generating gaming dashboard: {str(e)}")
            return Response(
                {'error': 'Failed to generate gaming dashboard'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GamingSearchView(generics.ListAPIView):
    """API endpoint for searching games"""
    serializer_class = GameListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'category__name']
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        
        if not query:
            return Game.objects.none()
        
        return Game.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query)
        )