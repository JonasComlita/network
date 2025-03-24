from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone
import logging
from django.conf import settings
import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

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
    memo = models.TextField(blank=True, null=True)  # Added memo field
    fee = models.DecimalField(max_digits=10, decimal_places=8, default=0)  # Added fee field
    tx_id = models.CharField(max_length=64, unique=True, null=True)  # Added transaction ID field
    confirmed = models.BooleanField(default=False)  # Added confirmed field

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

    # Added fields for auth and verification
    two_factor_enabled = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    wallet_backup_verified = models.BooleanField(default=False)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    last_password_change = models.DateTimeField(blank=True, null=True)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    twofa_secret = models.CharField(max_length=100, blank=True, null=True)  # Store 2FA secret

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
    
    def send_notification(self, message, notification_type="info"):
        """Send a notification to this user via WebSocket"""
        try:
            notification = Notification.objects.create(
                user=self,
                message=message,
                notification_type=notification_type
            )
            
            # Send WebSocket notification
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"notifications_user_{self.id}",
                {
                    "type": "send_notification",
                    "notification": {
                        "id": notification.id,
                        "message": notification.message,
                        "type": notification.notification_type,
                        "timestamp": notification.created_at.isoformat(),
                        "is_read": False
                    }
                }
            )
            
            return True
        except Exception as e:
            logger.error(f"Error sending notification to {self.username}: {e}")
            return False
    
    def lock_account(self, duration_hours=24):
        """Lock account for security purposes after multiple failed login attempts"""
        self.account_locked_until = timezone.now() + timezone.timedelta(hours=duration_hours)
        self.save(update_fields=['account_locked_until'])
        
        # Send notification
        self.send_notification(
            f"Your account has been locked for {duration_hours} hours due to multiple failed login attempts.",
            notification_type="security"
        )
    
    def is_account_locked(self):
        """Check if account is currently locked"""
        if self.account_locked_until and self.account_locked_until > timezone.now():
            return True
        return False
    
    def reset_login_attempts(self):
        """Reset failed login attempts counter"""
        if self.failed_login_attempts > 0:
            self.failed_login_attempts = 0
            self.save(update_fields=['failed_login_attempts'])
    
    def increment_login_attempts(self):
        """Increment failed login attempts counter and lock account if needed"""
        self.failed_login_attempts += 1
        self.save(update_fields=['failed_login_attempts'])
        
        # Lock account after 5 failed attempts
        if self.failed_login_attempts >= 5:
            self.lock_account()
            
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
        
        # If this is the primary wallet, update the user's wallet address
        if self.is_primary:
            self.user.wallet_address = self.wallet_address
            self.user.is_wallet_active = self.is_active
            self.user.wallet_balance = self.balance
            self.user.save(update_fields=['wallet_address', 'is_wallet_active', 'wallet_balance'])

# Define signals to handle wallet updates
@receiver(post_save, sender=UserWallet)
def send_wallet_update(sender, instance, created, **kwargs):
    """Send wallet update via WebSocket when a wallet is created or updated"""
    try:
        # Get channel layer
        channel_layer = get_channel_layer()
        
        # Send update to wallet-specific group
        async_to_sync(channel_layer.group_send)(
            f"wallet_{instance.wallet_address}",
            {
                "type": "wallet_update",
                "wallet_address": instance.wallet_address,
                "wallet_name": instance.wallet_name,
                "balance": str(instance.balance),
                "is_primary": instance.is_primary,
                "is_active": instance.is_active,
                "timestamp": timezone.now().isoformat()
            }
        )
        
        # Send update to user's wallets group
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.user.id}_wallets",
            {
                "type": "wallet_list_update",
                "action": "updated" if not created else "created",
                "wallet_address": instance.wallet_address
            }
        )
    except Exception as e:
        logger.error(f"Error sending wallet update: {e}")

class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    notification_type = models.CharField(
        max_length=20, 
        default="info",
        choices=[
            ("info", "Information"),
            ("success", "Success"),
            ("warning", "Warning"),
            ("error", "Error"),
            ("security", "Security Alert"),
            ("transaction", "Transaction"),
            ("price", "Price Alert")
        ]
    )

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        self.is_read = True
        self.save(update_fields=['is_read'])
        
        # Send WebSocket update
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"notifications_user_{self.user.id}",
                {
                    "type": "send_notification_update",
                    "notification_id": self.id,
                    "is_read": True
                }
            )
        except Exception as e:
            logger.error(f"Error sending notification read update: {e}")

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
    
    def mark_as_used(self):
        """Mark token as used"""
        self.used = True
        self.save(update_fields=['used'])
    
    @classmethod
    def create_token(cls, user, token_type, expiry_hours=24):
        """Create a new verification token for a user"""
        # Generate a UUID token
        token = str(uuid.uuid4())
        
        # Set expiry time
        expires_at = timezone.now() + timezone.timedelta(hours=expiry_hours)
        
        # Create token object
        verification_token = cls.objects.create(
            user=user,
            token=token,
            token_type=token_type,
            expires_at=expires_at
        )
        
        return verification_token

# Define signals to broadcast auth status updates
@receiver(post_save, sender=CustomUser)
def send_auth_status_update(sender, instance, **kwargs):
    """Send auth status update via WebSocket when user data changes"""
    try:
        # Only transmit specific fields that affect auth status
        fields_updated = kwargs.get('update_fields', None)
        
        # Skip if no fields were updated or if non-relevant fields were updated
        if not fields_updated:
            return
        
        relevant_fields = {
            'email_verified', 'two_factor_enabled', 'account_locked_until', 
            'failed_login_attempts', 'email', 'password'
        }
        
        if not any(field in relevant_fields for field in fields_updated):
            return
        
        # Get channel layer
        channel_layer = get_channel_layer()
        
        # Send update to user's auth group
        async_to_sync(channel_layer.group_send)(
            f"auth_user_{instance.id}",
            {
                "type": "auth_status_update",
                "status": "authenticated",
                "user_id": instance.id,
                "email_verified": instance.email_verified,
                "two_factor_enabled": instance.two_factor_enabled,
                "account_locked": instance.is_account_locked()
            }
        )
    except Exception as e:
        logger.error(f"Error sending auth update: {e}")

# Two-factor authentication backup codes
class TwoFactorBackupCode(models.Model):
    """Backup codes for 2FA recovery"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='backup_codes')
    code = models.CharField(max_length=10)  # 8-10 character backup code
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'code')
    
    def __str__(self):
        return f"2FA Backup code for {self.user.username}"
    
    @classmethod
    def generate_backup_codes(cls, user, count=10):
        """Generate backup codes for a user"""
        import random
        import string
        
        # Delete existing unused codes
        cls.objects.filter(user=user, used=False).delete()
        
        codes = []
        for _ in range(count):
            # Generate a random 8-character code
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            codes.append(cls.objects.create(user=user, code=code))
        
        return codes

# User login history for security monitoring
class LoginHistory(models.Model):
    """Track user login attempts for security purposes"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    successful = models.BooleanField(default=True)
    location = models.CharField(max_length=255, blank=True)  # City, Country if available
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Login histories"
    
    def __str__(self):
        status = "successful" if self.successful else "failed"
        return f"{status} login for {self.user.username} at {self.timestamp}"