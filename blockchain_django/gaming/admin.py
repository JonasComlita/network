from django.contrib import admin
from .models import (
    GameCategory, Game, NFT, GameToken, UserGameWallet, 
    GameTransaction, GamePlay, Achievement, UserAchievement,
    Leaderboard, LeaderboardEntry
)

@admin.register(GameCategory)
class GameCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name', 'description')


class GameTokenInline(admin.TabularInline):
    model = GameToken
    extra = 1


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'players', 'rating', 'play_to_earn', 'created_at')
    list_filter = ('category', 'play_to_earn', 'nft_enabled')
    search_fields = ('title', 'description')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [GameTokenInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'long_description', 'category', 'image')
        }),
        ('Game Files', {
            'fields': ('file_name', 'dependencies')
        }),
        ('Game Statistics', {
            'fields': ('players', 'rating', 'play_to_earn')
        }),
        ('Blockchain Properties', {
            'fields': ('blockchain_name', 'token_name', 'nft_enabled')
        }),
    )


@admin.register(NFT)
class NFTAdmin(admin.ModelAdmin):
    list_display = ('name', 'game', 'owner', 'rarity', 'acquired_at')
    list_filter = ('rarity', 'game', 'acquired_at')
    search_fields = ('name', 'description', 'owner__username', 'game__title')
    readonly_fields = ('id', 'acquired_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'description', 'game', 'owner', 'image')
        }),
        ('NFT Properties', {
            'fields': ('rarity', 'type', 'attributes', 'last_price', 'acquired_at')
        }),
        ('Blockchain Data', {
            'fields': ('token_id', 'contract_address', 'blockchain')
        }),
    )


@admin.register(GameToken)
class GameTokenAdmin(admin.ModelAdmin):
    list_display = ('name', 'symbol', 'game', 'current_price')
    list_filter = ('game',)
    search_fields = ('name', 'symbol', 'game__title')


@admin.register(UserGameWallet)
class UserGameWalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'created_at')
    list_filter = ('game',)
    search_fields = ('user__username', 'game__title')
    readonly_fields = ('token_balances',)


@admin.register(GameTransaction)
class GameTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'type', 'token', 'amount', 'timestamp', 'blockchain_verified')
    list_filter = ('type', 'game', 'blockchain_verified', 'timestamp')
    search_fields = ('user__username', 'game__title', 'description')
    readonly_fields = ('id', 'timestamp', 'tx_hash', 'blockchain_verified')


@admin.register(GamePlay)
class GamePlayAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'start_time', 'duration', 'score', 'earned_tokens')
    list_filter = ('game', 'start_time')
    search_fields = ('user__username', 'game__title')
    readonly_fields = ('session_id', 'start_time', 'verified')


class UserAchievementInline(admin.TabularInline):
    model = UserAchievement
    extra = 0
    readonly_fields = ('unlocked_at', 'blockchain_verified', 'tx_hash')


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('name', 'game', 'points', 'reward_amount', 'reward_token')
    list_filter = ('game',)
    search_fields = ('name', 'description', 'game__title')
    inlines = [UserAchievementInline]


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('user', 'achievement', 'unlocked_at', 'blockchain_verified')
    list_filter = ('blockchain_verified', 'unlocked_at')
    search_fields = ('user__username', 'achievement__name')
    readonly_fields = ('unlocked_at', 'tx_hash', 'blockchain_verified')


class LeaderboardEntryInline(admin.TabularInline):
    model = LeaderboardEntry
    extra = 0


@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ('game', 'period', 'updated_at')
    list_filter = ('game', 'period')
    inlines = [LeaderboardEntryInline]


@admin.register(LeaderboardEntry)
class LeaderboardEntryAdmin(admin.ModelAdmin):
    list_display = ('leaderboard', 'user', 'rank', 'score', 'earnings')
    list_filter = ('leaderboard__game', 'leaderboard__period')
    search_fields = ('user__username',)