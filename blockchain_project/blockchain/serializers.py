from rest_framework import serializers
from .models import Block, Transaction, CustomUser, Notification, HistoricalData, HistoricalTransactionData, NewsData, UserAnalytics
from django.contrib.auth.models import User

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class BlockSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Block
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'is_admin', 'is_miner', 'profile_picture', 'bio', 'notify_price_changes', 'notify_transaction_updates']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser(**validated_data)
        user.set_password(validated_data['password'])
        user.save()
        return user

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
