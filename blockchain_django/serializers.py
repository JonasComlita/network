from rest_framework import serializers
from .models import Block, BlockchainTransaction, CustomUser, Notification, HistoricalData, HistoricalTransactionData, NewsData, UserAnalytics, UserWallet
from django.contrib.auth.models import User

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockchainTransaction
        fields = '__all__'

class BlockSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Block
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'is_admin', 'is_miner',
            'profile_picture', 'bio', 'notify_price_changes',
            'notify_transaction_updates', 'wallet_address', 'is_wallet_active'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser(**validated_data)
        user.set_password(validated_data['password'])
        user.save()
        return user

# Add to blockchain_django/serializers.py

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information"""
    wallet_address_display = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'bio',
            'profile_picture', 'wallet_address', 'wallet_address_display',
            'wallet_balance', 'is_wallet_active', 'wallet_created_at',
            'date_joined', 'two_factor_enabled', 'email_verified'
        ]
        read_only_fields = [
            'id', 'username', 'email', 'wallet_address', 'wallet_balance',
            'is_wallet_active', 'wallet_created_at', 'date_joined',
            'two_factor_enabled', 'email_verified', 'wallet_address_display'
        ]
    
    def get_wallet_address_display(self, obj):
        """Return a shortened wallet address suitable for display"""
        return obj.get_wallet_display()

class UserPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for user preferences"""
    
    class Meta:
        model = CustomUser
        fields = [
            'notify_price_changes', 'notify_transaction_updates'
        ]

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class HistoricalTransactionDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricalTransactionData
        fields = '__all__'

class HistoricalDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricalData
        fields = '__all__'

class NewsDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsData
        fields = '__all__'

class UserAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnalytics
        fields = '__all__'

class UserWalletSerializer(serializers.ModelSerializer):
    """Serializer for user wallet information"""
    display_address = serializers.SerializerMethodField()
    
    class Meta:
        model = UserWallet
        fields = [
            'wallet_address', 'wallet_name', 'is_primary', 
            'is_active', 'balance', 'created_at', 
            'last_transaction_at', 'display_address'
        ]
        read_only_fields = [
            'wallet_address', 'balance', 'created_at', 
            'last_transaction_at', 'display_address'
        ]
    
    def get_display_address(self, obj):
        """Return a shortened wallet address suitable for display"""
        return obj.get_display_address()

class WalletTransactionSerializer(serializers.Serializer):
    """Serializer for wallet transactions"""
    tx_id = serializers.CharField()
    sender = serializers.CharField()
    recipient = serializers.CharField()
    amount = serializers.FloatField()
    timestamp = serializers.DateTimeField()
    is_outgoing = serializers.BooleanField()
    confirmed = serializers.BooleanField(default=False)
    block_index = serializers.IntegerField(allow_null=True)
    memo = serializers.CharField(allow_blank=True)
    fee = serializers.FloatField(default=0)
    
    # Add formatted fields for frontend display
    display_sender = serializers.SerializerMethodField()
    display_recipient = serializers.SerializerMethodField()
    
    def get_display_sender(self, obj):
        """Return a shortened sender address"""
        sender = obj.get('sender', '')
        if sender:
            return f"{sender[:6]}...{sender[-4:]}"
        return "Unknown"
    
    def get_display_recipient(self, obj):
        """Return a shortened recipient address"""
        recipient = obj.get('recipient', '')
        if recipient:
            return f"{recipient[:6]}...{recipient[-4:]}"
        return "Unknown"