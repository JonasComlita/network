from rest_framework import serializers
from .models import Category, Thread, Reply
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


class ReplySerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Reply
        fields = ['id', 'author', 'body', 'created_at', 'updated_at', 'blockchain_verified', 'transaction_hash']
        read_only_fields = ['blockchain_verified', 'transaction_hash']


class ThreadListSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    replies_count = serializers.IntegerField(read_only=True)
    last_reply_author = serializers.SerializerMethodField()
    last_reply_time = serializers.SerializerMethodField()
    
    class Meta:
        model = Thread
        fields = ['id', 'title', 'slug', 'author', 'category', 'category_name', 'pinned', 
                 'views', 'replies_count', 'created_at', 'updated_at', 'last_reply_author',
                 'last_reply_time', 'blockchain_verified', 'transaction_hash']
    
    def get_last_reply_author(self, obj):
        last_reply = obj.last_reply
        if last_reply:
            return last_reply.author.username
        return None
    
    def get_last_reply_time(self, obj):
        last_reply = obj.last_reply
        if last_reply:
            return last_reply.created_at
        return None


class ThreadDetailSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    replies = ReplySerializer(many=True, read_only=True)
    
    class Meta:
        model = Thread
        fields = ['id', 'title', 'slug', 'author', 'body', 'category', 'category_name', 
                 'pinned', 'views', 'created_at', 'updated_at', 'replies', 
                 'blockchain_verified', 'transaction_hash']
        read_only_fields = ['views', 'blockchain_verified', 'transaction_hash']


class CategorySerializer(serializers.ModelSerializer):
    threads_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'created_at', 'updated_at', 'threads_count']
    
    def get_threads_count(self, obj):
        return obj.threads.count()


class ThreadCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thread
        fields = ['title', 'category', 'body']


class ReplyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reply
        fields = ['thread', 'body']