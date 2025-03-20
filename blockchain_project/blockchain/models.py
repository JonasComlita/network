from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.contrib.auth.models import User
import requests
from django.utils import timezone

# Create your models here.

class Transaction(models.Model):
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

class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message}"

class PriceChangeNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
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
