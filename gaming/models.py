from django.db import models
from django.conf import settings
from django.utils.text import slugify
import uuid


class GameCategory(models.Model):
    """Game categories (e.g., arcade, rpg, platformer)"""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Game Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Game(models.Model):
    """Game information"""
    id = models.CharField(primary_key=True, max_length=50, default=uuid.uuid4)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=200)
    description = models.TextField()
    long_description = models.TextField(blank=True)
    category = models.ForeignKey(GameCategory, on_delete=models.CASCADE, related_name='games')
    image = models.ImageField(upload_to='game_images/', blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    dependencies = models.JSONField(blank=True, null=True)
    
    # Game statistics
    players = models.PositiveIntegerField(default=0)
    rating = models.FloatField(default=0.0)
    play_to_earn = models.BooleanField(default=True)
    
    # Blockchain properties
    blockchain_name = models.CharField(max_length=100, default='NetWork')
    token_name = models.CharField(max_length=50, default='NET')
    nft_enabled = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-players']
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class NFT(models.Model):
    """NFT asset from a game"""
    RARITY_CHOICES = [
        ('common', 'Common'),
        ('uncommon', 'Uncommon'),
        ('rare', 'Rare'),
        ('epic', 'Epic'),
        ('legendary', 'Legendary'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='nfts')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='nfts')
    
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='nft_images/', blank=True, null=True)
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common')
    type = models.CharField(max_length=100, blank=True)
    
    # Blockchain data
    token_id = models.CharField(max_length=100, blank=True)
    contract_address = models.CharField(max_length=100, blank=True)
    blockchain = models.CharField(max_length=100, default='NetWork')
    
    # Metadata
    attributes = models.JSONField(blank=True, null=True)
    last_price = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    acquired_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "NFT"
        verbose_name_plural = "NFTs"
        ordering = ['-acquired_at']
    
    def __str__(self):
        return f"{self.name} ({self.game.title})"


class GameToken(models.Model):
    """Game-specific tokens"""
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=10)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='tokens')
    contract_address = models.CharField(max_length=100, blank=True)
    decimals = models.PositiveSmallIntegerField(default=18)
    
    # Token economics
    total_supply = models.DecimalField(max_digits=30, decimal_places=0, default=0)
    circulating_supply = models.DecimalField(max_digits=30, decimal_places=0, default=0)
    current_price = models.DecimalField(max_digits=20, decimal_places=8, default=0)    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('game', 'symbol')
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.symbol})"


class UserGameWallet(models.Model):
    """Wallet containing game-specific tokens and assets"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_wallets')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='user_wallets', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Balance of game-specific tokens
    token_balances = models.JSONField(default=dict)
    
    # Reference to main blockchain wallet
    main_wallet_address = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        unique_together = ('user', 'game')
    
    def __str__(self):
        game_name = self.game.title if self.game else "Main Gaming"
        return f"{self.user.username}'s {game_name} Wallet"
    
    def get_balance(self, token_symbol):
        """Get balance of specific token"""
        return self.token_balances.get(token_symbol, 0)
    
    def update_balance(self, token_symbol, amount):
        """Update balance of specific token"""
        current_balance = self.get_balance(token_symbol)
        self.token_balances[token_symbol] = current_balance + amount
        self.save(update_fields=['token_balances'])


class GameTransaction(models.Model):
    """Transactions within games"""
    TRANSACTION_TYPES = [
        ('earning', 'Earning'),
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('swap', 'Swap'),
        ('transfer', 'Transfer'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_transactions')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    
    # Primary token in transaction
    token = models.CharField(max_length=10)
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    
    # Optional second token for swaps
    token2 = models.CharField(max_length=10, blank=True, null=True)
    amount2 = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    
    # Transaction metadata
    description = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Blockchain verification data
    tx_hash = models.CharField(max_length=100, blank=True, null=True)
    blockchain_verified = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.type} in {self.game.title if self.game else 'Multiple Games'} - {self.amount} {self.token}"


class GamePlay(models.Model):
    """Record of a user's gaming sessions"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_plays')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='plays')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)
    
    # Session metadata
    score = models.PositiveIntegerField(default=0)
    earned_tokens = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    token_type = models.CharField(max_length=10, default='NET')
    
    # Gameplay stats
    completed_objectives = models.PositiveIntegerField(default=0)
    achievements_unlocked = models.JSONField(blank=True, null=True)
    
    # Verification
    session_id = models.UUIDField(default=uuid.uuid4, editable=False)
    verified = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.game.title} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"


class Achievement(models.Model):
    """Game-specific achievements"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='achievements')
    name = models.CharField(max_length=100)
    description = models.TextField()
    
    # Achievement properties
    icon = models.ImageField(upload_to='achievement_icons/', blank=True, null=True)
    points = models.PositiveIntegerField(default=10)
    
    # Token rewards
    reward_amount = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    reward_token = models.CharField(max_length=10, default='NET')
    
    class Meta:
        ordering = ['game', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.game.title})"


class UserAchievement(models.Model):
    """Record of achievements earned by users"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='earned_by')
    unlocked_at = models.DateTimeField(auto_now_add=True)
    
    # Blockchain verification
    tx_hash = models.CharField(max_length=100, blank=True, null=True)
    blockchain_verified = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('user', 'achievement')
        ordering = ['-unlocked_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.achievement.name}"


class Leaderboard(models.Model):
    """Game leaderboards"""
    PERIOD_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('all_time', 'All Time'),
    ]
    
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='leaderboards')
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES, default='weekly')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('game', 'period')
    
    def __str__(self):
        return f"{self.game.title} - {self.get_period_display()} Leaderboard"


class LeaderboardEntry(models.Model):
    """Individual entry on a leaderboard"""
    leaderboard = models.ForeignKey(Leaderboard, on_delete=models.CASCADE, related_name='entries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leaderboard_entries')
    rank = models.PositiveIntegerField()
    score = models.PositiveIntegerField(default=0)
    earnings = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    
    # Extra data to display on leaderboard
    wallet_address = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        unique_together = ('leaderboard', 'user')
        ordering = ['rank']
    
    def __str__(self):
        return f"{self.leaderboard} - Rank {self.rank}: {self.user.username}"