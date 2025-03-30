from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    GameCategory, Game, NFT, GameToken, UserGameWallet, 
    GameTransaction, GamePlay, Achievement, UserAchievement,
    Leaderboard, LeaderboardEntry
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'wallet_address']


class GameCategorySerializer(serializers.ModelSerializer):
    games_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GameCategory
        fields = ['id', 'name', 'slug', 'description', 'games_count']
    
    def get_games_count(self, obj):
        return obj.games.count()


class GameListSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    
    class Meta:
        model = Game
        fields = [
            'id', 'title', 'slug', 'description', 'category', 'category_name',
            'image', 'players', 'rating', 'play_to_earn', 'blockchain_name',
            'token_name', 'nft_enabled', 'file_name'
        ]


class GameDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    tokens = serializers.SerializerMethodField()
    
    class Meta:
        model = Game
        fields = [
            'id', 'title', 'slug', 'description', 'long_description',
            'category', 'category_name', 'image', 'players', 'rating',
            'play_to_earn', 'blockchain_name', 'token_name', 'nft_enabled',
            'file_name', 'dependencies', 'tokens', 'created_at'
        ]
    
    def get_tokens(self, obj):
        return GameTokenSerializer(obj.tokens.all(), many=True).data


class NFTSerializer(serializers.ModelSerializer):
    game_title = serializers.ReadOnlyField(source='game.title')
    owner_username = serializers.ReadOnlyField(source='owner.username')
    
    class Meta:
        model = NFT
        fields = [
            'id', 'name', 'game', 'game_title', 'owner', 'owner_username',
            'description', 'image', 'rarity', 'type', 'token_id',
            'contract_address', 'blockchain', 'attributes',
            'last_price', 'acquired_at'
        ]
        read_only_fields = [
            'id', 'token_id', 'contract_address', 'blockchain',
            'acquired_at'
        ]


class GameTokenSerializer(serializers.ModelSerializer):
    game_title = serializers.ReadOnlyField(source='game.title')
    
    class Meta:
        model = GameToken
        fields = [
            'id', 'name', 'symbol', 'game', 'game_title', 'contract_address',
            'decimals', 'total_supply', 'circulating_supply', 'current_price'
        ]
        read_only_fields = ['id', 'contract_address']


class UserGameWalletSerializer(serializers.ModelSerializer):
    game_title = serializers.ReadOnlyField(source='game.title')
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = UserGameWallet
        fields = [
            'id', 'user', 'username', 'game', 'game_title',
            'token_balances', 'main_wallet_address', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'token_balances', 'created_at']


class GameTransactionSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    game_title = serializers.SerializerMethodField()
    
    class Meta:
        model = GameTransaction
        fields = [
            'id', 'user', 'username', 'game', 'game_title', 'type',
            'token', 'amount', 'token2', 'amount2', 'description',
            'timestamp', 'tx_hash', 'blockchain_verified'
        ]
        read_only_fields = ['id', 'user', 'tx_hash', 'blockchain_verified']
    
    def get_game_title(self, obj):
        return obj.game.title if obj.game else "Multiple Games"


class GamePlaySerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    game_title = serializers.ReadOnlyField(source='game.title')
    
    class Meta:
        model = GamePlay
        fields = [
            'id', 'user', 'username', 'game', 'game_title', 'start_time',
            'end_time', 'duration', 'score', 'earned_tokens', 'token_type',
            'completed_objectives', 'achievements_unlocked', 'session_id',
            'verified'
        ]
        read_only_fields = ['id', 'user', 'start_time', 'session_id', 'verified']


class AchievementSerializer(serializers.ModelSerializer):
    game_title = serializers.ReadOnlyField(source='game.title')
    
    class Meta:
        model = Achievement
        fields = [
            'id', 'game', 'game_title', 'name', 'description', 'icon',
            'points', 'reward_amount', 'reward_token'
        ]
        read_only_fields = ['id']


class UserAchievementSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    achievement_name = serializers.ReadOnlyField(source='achievement.name')
    game_title = serializers.ReadOnlyField(source='achievement.game.title')
    
    class Meta:
        model = UserAchievement
        fields = [
            'id', 'user', 'username', 'achievement', 'achievement_name',
            'game_title', 'unlocked_at', 'tx_hash', 'blockchain_verified'
        ]
        read_only_fields = ['id', 'user', 'unlocked_at', 'tx_hash', 'blockchain_verified']


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = LeaderboardEntry
        fields = [
            'id', 'user', 'username', 'rank', 'score', 'earnings',
            'wallet_address'
        ]
        read_only_fields = ['id', 'rank']


class LeaderboardSerializer(serializers.ModelSerializer):
    game_title = serializers.ReadOnlyField(source='game.title')
    entries = LeaderboardEntrySerializer(many=True, read_only=True)
    
    class Meta:
        model = Leaderboard
        fields = [
            'id', 'game', 'game_title', 'period', 'updated_at', 'entries'
        ]
        read_only_fields = ['id', 'updated_at']