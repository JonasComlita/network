import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()
logger = logging.getLogger(__name__)

class ForumConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for forum updates"""
    
    async def connect(self):
        """Connect to WebSocket and join forum group"""
        self.user = None
        
        # Try to authenticate from query params
        query_string = self.scope.get('query_string', b'').decode()
        query_params = {}
        
        if '=' in query_string:
            try:
                for param in query_string.split('&'):
                    if '=' in param:
                        key, value = param.split('=')
                        query_params[key] = value
            except Exception as e:
                logger.error(f"Error parsing query params: {e}")
                
        token = query_params.get('token')
        
        # Try to authenticate with token
        if token:
            try:
                self.user = await self.get_user_from_token(token)
            except Exception as e:
                logger.error(f"WebSocket auth error: {e}")
        
        # Also check if user is authenticated from scope
        if not self.user and self.scope.get("user") and self.scope["user"].is_authenticated:
            self.user = self.scope["user"]
        
        # Join the forum_updates group
        await self.channel_layer.group_add(
            "forum_updates",
            self.channel_name
        )
        
        # Accept connection
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to forum updates'
        }))
        
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave forum group
        await self.channel_layer.group_discard(
            "forum_updates",
            self.channel_name
        )
        
        # Leave any thread-specific groups
        if hasattr(self, 'thread_groups'):
            for group_name in self.thread_groups:
                await self.channel_layer.group_discard(
                    group_name,
                    self.channel_name
                )
    
    async def receive(self, text_data):
        """Handle messages from client"""
        try:
            data = json.loads(text_data)
            
            # Handle subscribing to thread updates
            if data.get('command') == 'subscribe_thread':
                thread_id = data.get('thread_id')
                if thread_id:
                    # Initialize thread_groups if not exists
                    if not hasattr(self, 'thread_groups'):
                        self.thread_groups = set()
                    
                    # Join thread group
                    group_name = f"thread_{thread_id}"
                    await self.channel_layer.group_add(
                        group_name,
                        self.channel_name
                    )
                    
                    # Add to tracked groups
                    self.thread_groups.add(group_name)
                    
                    # Confirm subscription
                    await self.send(text_data=json.dumps({
                        'type': 'thread_subscription',
                        'thread_id': thread_id,
                        'status': 'subscribed'
                    }))
            
            # Handle unsubscribing from thread updates
            elif data.get('command') == 'unsubscribe_thread':
                thread_id = data.get('thread_id')
                if thread_id:
                    group_name = f"thread_{thread_id}"
                    
                    # Leave thread group
                    await self.channel_layer.group_discard(
                        group_name,
                        self.channel_name
                    )
                    
                    # Remove from tracked groups
                    if hasattr(self, 'thread_groups'):
                        self.thread_groups.discard(group_name)
                    
                    # Confirm unsubscription
                    await self.send(text_data=json.dumps({
                        'type': 'thread_subscription',
                        'thread_id': thread_id,
                        'status': 'unsubscribed'
                    }))
                    
            # Handle token authentication
            elif data.get('token'):
                try:
                    self.user = await self.get_user_from_token(data.get('token'))
                    await self.send(text_data=json.dumps({
                        'type': 'authentication',
                        'status': 'success',
                    }))
                except Exception as e:
                    await self.send(text_data=json.dumps({
                        'type': 'authentication',
                        'status': 'failed',
                        'message': str(e)
                    }))
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error processing message: {str(e)}'
            }))
    
    async def forum_update(self, event):
        """Handle forum update events from other consumers"""
        # Forward the update to the WebSocket
        await self.send(text_data=json.dumps(event))
    
    async def thread_update(self, event):
        """Handle thread update events from other consumers"""
        # Forward the update to the WebSocket
        await self.send(text_data=json.dumps(event))
    
    @database_sync_to_async
    def get_user_from_token(self, token_key):
        """Validate JWT token and get user"""
        try:
            # Validate token
            token = AccessToken(token_key)
            user_id = token.payload.get('user_id')
            
            # Get user from database
            user = User.objects.get(id=user_id)
            return user
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            logger.error(f"Token authentication error: {str(e)}")
            raise