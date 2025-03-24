from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone
import logging
from django.conf import settings

logger = logging.getLogger(__name__)
    
class BlockchainNode(models.Model):
    node_id = models.CharField(max_length=100, unique=True)
    host = models.CharField(max_length=100)
    port = models.IntegerField()
    is_active = models.BooleanField(default=True)
    last_seen = models.DateTimeField(auto_now=True)
    is_validator = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.node_id} ({self.host}:{self.port})"

class WalletBackup(models.Model):
    address = models.CharField(max_length=100, unique=True)
    encrypted_backup = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Backup for {self.address}"

class BlockchainTransaction(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    block = models.ForeignKey('Block', on_delete=models.CASCADE)
    recipient = models.CharField(max_length=255)
    sender = models.CharField(max_length=255)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Transaction from {self.sender} to {self.recipient} of {self.amount}"

class Block(models.Model):
    index = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)
    previous_hash = models.CharField(max_length=64)
    hash = models.CharField(max_length=64)

    def __str__(self):
        return f"Block {self.index}"

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(blank=True)
    is_admin = models.BooleanField(default=False)
    is_miner = models.BooleanField(default=False)
    notify_price_changes = models.BooleanField(default=True)
    notify_transaction_updates = models.BooleanField(default=True)

    wallet_address = models.CharField(max_length=50, blank=True, null=True)
    wallet_balance = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    is_wallet_active = models.BooleanField(default=False)
    wallet_created_at = models.DateTimeField(auto_now_add=True, null=True)
    last_transaction_at = models.DateTimeField(null=True, blank=True)

    groups = models.ManyToManyField(
        Group,
        related_name='customuser_set',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='customuser_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return self.username
    
    def get_wallet_display(self):
        """Return a shortened wallet address suitable for display"""
        if self.wallet_address:
            return f"{self.wallet_address[:6]}...{self.wallet_address[-4:]}"
        return "No wallet"
        
    async def update_wallet_balance(self):
        """Update wallet balance from blockchain"""
        from blockchain_service import get_blockchain
        
        if self.wallet_address:
            try:
                blockchain = get_blockchain()
                if hasattr(blockchain, 'initialized') and not blockchain.initialized:
                    await blockchain.initialize()
                balance = await blockchain.get_balance(self.wallet_address)
                self.wallet_balance = balance
                self.save(update_fields=['wallet_balance'])
                return balance
            except Exception as e:
                logger.error(f"Failed to update wallet balance for {self.username}: {e}")
        return self.wallet_balance
    
    # Add these fields to the CustomUser model in blockchain_django/models.py

# CustomUser class additions:
    two_factor_enabled = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    wallet_backup_verified = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    last_password_change = models.DateTimeField(blank=True, null=True)
    
    # Field for storing multiple wallet addresses
    @property
    def wallets(self):
        """Get all wallets associated with this user"""
        return UserWallet.objects.filter(user=self)


# New model for multiple wallet support
class UserWallet(models.Model):
    """Model for managing multiple user wallets"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='user_wallets')
    wallet_address = models.CharField(max_length=50, unique=True)
    wallet_name = models.CharField(max_length=50, default="Primary Wallet")
    is_primary = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    balance = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    last_transaction_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('user', 'wallet_name')
        ordering = ['-is_primary', '-created_at']
        
    def __str__(self):
        return f"{self.wallet_name} ({self.wallet_address[:6]}...{self.wallet_address[-4:]})"
        
    def get_display_address(self):
        """Return a shortened wallet address suitable for display"""
        if self.wallet_address:
            return f"{self.wallet_address[:6]}...{self.wallet_address[-4:]}"
        return "Invalid wallet"
        
    def save(self, *args, **kwargs):
        """Override save to ensure only one primary wallet per user"""
        # If this wallet is being set as primary
        if self.is_primary:
            # Set all other wallets for this user as non-primary
            UserWallet.objects.filter(user=self.user, is_primary=True).update(is_primary=False)
        
        # If this is the first wallet for the user, make it primary
        if not UserWallet.objects.filter(user=self.user).exists():
            self.is_primary = True
            
        super().save(*args, **kwargs)

class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message}"

class PriceChangeNotification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    price_change = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.price_change}"

class HistoricalData(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    price = models.FloatField()
    volume = models.FloatField()

    def __str__(self):
        return f"Data at {self.timestamp}: Price {self.price}, Volume {self.volume}"
    
class HistoricalTransactionData(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    amount = models.FloatField()

    def __str__(self):
        return f"Data at {self.timestamp}: Amount {self.amount}"
    
class NewsData(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=255)
    content = models.TextField()

    def __str__(self):
        return f"Data at {self.timestamp}: Title {self.title}"
    
class UserAnalytics(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_transactions = models.IntegerField()
    total_amount = models.FloatField()

class VerificationToken(models.Model):
    """Stores tokens for email verification and password resets"""
    TOKEN_TYPES = (
        ('email_verification', 'Email Verification'),
        ('password_reset', 'Password Reset'),
        ('2fa_setup', 'Two-Factor Authentication Setup'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='verification_tokens')
    token = models.CharField(max_length=255, unique=True)
    token_type = models.CharField(max_length=50, choices=TOKEN_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        indexes = [
            models.Index(fields=['token', 'token_type']),
            models.Index(fields=['user', 'token_type'])
        ]
        
    def __str__(self):
        return f"{self.token_type} token for {self.user.username}"
        
    def is_valid(self):
        """Check if token is valid (not used and not expired)"""
        return not self.used and self.expires_at > timezone.now()
