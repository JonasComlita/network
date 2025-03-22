from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
import requests
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.views import APIView
from rest_framework.response import Response
from blockchain.blockchain import Blockchain
from blockchain.transaction import Transaction as BlockchainTransactionClass
from utils import SecurityUtils
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Create your models here.
# Initialize your blockchain instance
blockchain_instance = Blockchain()
    
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

    # New fields for blockchain integration
    wallet_address = models.CharField(max_length=50, blank=True, null=True)
    wallet_balance = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    is_wallet_active = models.BooleanField(default=False)
    wallet_created_at = models.DateTimeField(auto_now_add=True, null=True)
    last_transaction_at = models.DateTimeField(null=True, blank=True)

    # Specify related_name to avoid clashes
    groups = models.ManyToManyField(
        Group,
        related_name='customuser_set',  # Change this to avoid clash
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='customuser_set',  # Change this to avoid clash
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
        from blockchain.blockchain import Blockchain
        if self.wallet_address:
            try:
                blockchain = Blockchain()
                if not blockchain.initialized:
                    await blockchain.initialize()
                balance = await blockchain.get_balance(self.wallet_address)
                self.wallet_balance = balance
                self.save(update_fields=['wallet_balance'])
                return balance
            except Exception as e:
                logger.error(f"Failed to update wallet balance for {self.username}: {e}")
        return self.wallet_balance

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
    # Define your fields here
    timestamp = models.DateTimeField(auto_now_add=True)
    price = models.FloatField()
    volume = models.FloatField()
    # Add any other fields you need

    def __str__(self):
        return f"Data at {self.timestamp}: Price {self.price}, Volume {self.volume}"
    
class HistoricalTransactionData(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    amount = models.FloatField()
    # Add any other fields you need

    def __str__(self):
        return f"Data at {self.timestamp}: Amount {self.amount}"
    
class NewsData(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    # Add any other fields you need

    def __str__(self):
        return f"Data at {self.timestamp}: Title {self.title}"
    
class UserAnalytics(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total_transactions = models.IntegerField()
    total_amount = models.FloatField()
    # Add any other fields you need

