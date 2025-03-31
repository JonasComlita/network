from rest_framework import viewsets, generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.text import slugify
from django.utils import timezone

from .models import Category, Thread, Reply
from .serializers import (
    CategorySerializer, ThreadListSerializer, ThreadDetailSerializer,
    ThreadCreateSerializer, ReplySerializer, ReplyCreateSerializer
)
from blockchain_django.blockchain_service import get_blockchain


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for forum categories"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    permission_classes = [IsAuthenticatedOrReadOnly]


class ThreadListView(generics.ListAPIView):
    """API endpoint to list forum threads"""
    serializer_class = ThreadListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'author', 'pinned']
    search_fields = ['title', 'body']
    ordering_fields = ['created_at', 'updated_at', 'views']
    ordering = ['-pinned', '-created_at']
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Get threads with replies count and filter by category if specified"""
        category_slug = self.request.query_params.get('category_slug')
        
        queryset = Thread.objects.annotate(replies_count=Count('replies'))
        
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        return queryset


class ThreadDetailView(generics.RetrieveAPIView):
    """API endpoint to retrieve a thread with its replies"""
    serializer_class = ThreadDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'

    def get_queryset(self):
        return Thread.objects.all()

    def retrieve(self, request, *args, **kwargs):
        """Increment view count on thread retrieval"""
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        return super().retrieve(request, *args, **kwargs)


class ThreadCreateView(generics.CreateAPIView):
    """API endpoint to create a new thread"""
    serializer_class = ThreadCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Set thread author and verify on blockchain"""
        thread = serializer.save(author=self.request.user)
        
        # Blockchain verification (async task)
        self.verify_on_blockchain(thread)
        
        return thread

    def verify_on_blockchain(self, thread):
        """Verify thread on blockchain"""
        try:
            # Get blockchain instance
            blockchain = get_blockchain()
            
            # Create data to be stored on blockchain
            thread_data = {
                'type': 'forum_thread',
                'thread_id': thread.id,
                'title': thread.title,
                'author_id': thread.author.id,
                'timestamp': timezone.now().isoformat()
            }
            
            # In production, this should be a Celery task
            import threading
            def record_on_blockchain():
                try:
                    # Call blockchain service to record the thread
                    from blockchain_django.fix_asyncio import run_async
                    tx_hash = run_async(blockchain.store_data(thread_data))
                    
                    if tx_hash:
                        thread.blockchain_verified = True
                        thread.transaction_hash = tx_hash
                        thread.save(update_fields=['blockchain_verified', 'transaction_hash'])
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error verifying thread on blockchain: {str(e)}")
            
            # Run in background thread to avoid blocking response
            t = threading.Thread(target=record_on_blockchain)
            t.daemon = True
            t.start()
        
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error starting blockchain verification for thread: {str(e)}")


class ReplyCreateView(generics.CreateAPIView):
    """API endpoint to create a reply to a thread"""
    serializer_class = ReplyCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Set reply author and verify on blockchain"""
        reply = serializer.save(author=self.request.user)
        
        # Blockchain verification (async task)
        self.verify_on_blockchain(reply)
        
        return reply

    def verify_on_blockchain(self, reply):
        """Verify reply on blockchain"""
        try:
            # Get blockchain instance
            blockchain = get_blockchain()
            
            # Create data to be stored on blockchain
            reply_data = {
                'type': 'forum_reply',
                'reply_id': reply.id,
                'thread_id': reply.thread.id,
                'author_id': reply.author.id,
                'timestamp': timezone.now().isoformat()
            }
            
            # In production, this should be a Celery task
            import threading
            def record_on_blockchain():
                try:
                    # Call blockchain service to record the reply
                    from blockchain_django.fix_asyncio import run_async
                    tx_hash = run_async(blockchain.store_data(reply_data))
                    
                    if tx_hash:
                        reply.blockchain_verified = True
                        reply.transaction_hash = tx_hash
                        reply.save(update_fields=['blockchain_verified', 'transaction_hash'])
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error verifying reply on blockchain: {str(e)}")
            
            # Run in background thread to avoid blocking response
            t = threading.Thread(target=record_on_blockchain)
            t.daemon = True
            t.start()
        
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error starting blockchain verification for reply: {str(e)}")


class PopularThreadsView(generics.ListAPIView):
    """API endpoint to get popular threads"""
    serializer_class = ThreadListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Get threads with most replies in the past month"""
        one_month_ago = timezone.now() - timezone.timedelta(days=30)
        
        return Thread.objects.annotate(
            replies_count=Count('replies')
        ).filter(
            Q(created_at__gte=one_month_ago) | Q(replies__created_at__gte=one_month_ago)
        ).order_by('-replies_count', '-views')[:5]


class ForumSearchView(generics.ListAPIView):
    """API endpoint to search across forum content"""
    serializer_class = ThreadListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Search threads by title, body, or author username"""
        query = self.request.query_params.get('q', '')
        
        if not query:
            return Thread.objects.none()
            
        return Thread.objects.filter(
            Q(title__icontains=query) | 
            Q(body__icontains=query) |
            Q(author__username__icontains=query)
        ).annotate(
            replies_count=Count('replies')
        ).order_by('-created_at')


class UserThreadsView(generics.ListAPIView):
    """API endpoint to get threads created by a specific user"""
    serializer_class = ThreadListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Thread.objects.filter(
            author=self.request.user
        ).annotate(
            replies_count=Count('replies')
        ).order_by('-created_at')


class UserRepliesView(generics.ListAPIView):
    """API endpoint to get replies created by a specific user"""
    serializer_class = ReplySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Reply.objects.filter(
            author=self.request.user
        ).order_by('-created_at')