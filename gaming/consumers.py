import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()
logger = logging.getLogger(__name__)

class GamingConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for gaming updates"""
    
    async def connect(self):
        """Connect to WebSocket and join gaming group"""
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
        
        # Accept connection only if authenticated
        if self.user and self.user.is_authenticated:
            # Join user-specific groups for gaming updates
            self.user_id = self.user.id
            
            # NFT updates group
            await self.channel_layer.group_add(
                f"user_{self.user_id}_nfts",
                self.channel_name
            )
            
            # Game wallet updates group
            await self.channel_layer.group_add(
                f"user_{self.user_id}_game_wallet",
                self.channel_name
            )
            
            # Achievements updates group
            await self.channel_layer.group_add(
                f"user_{self.user_id}_achievements",
                self.channel_name
            )
            
            # Accept the connection
            await self.accept()
            
            # Send connection confirmation
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'Connected to gaming updates'
            }))
        else:
            # Reject unauthenticated connections
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave user-specific groups
        if hasattr(self, 'user_id'):
            # NFT updates group
            await self.channel_layer.group_discard(
                f"user_{self.user_id}_nfts",
                self.channel_name
            )
            
            # Game wallet updates group
            await self.channel_layer.group_discard(
                f"user_{self.user_id}_game_wallet",
                self.channel_name
            )
            
            # Achievements updates group
            await self.channel_layer.group_discard(
                f"user_{self.user_id}_achievements",
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle messages from client"""
        try:
            data = json.loads(text_data)
            
            # Handle token authentication
            if data.get('token'):
                try:
                    self.user = await self.get_user_from_token(data.get('token'))
                    self.user_id = self.user.id
                    
                    # Re-join user-specific groups with new user ID
                    await self.channel_layer.group_add(
                        f"user_{self.user_id}_nfts",
                        self.channel_name
                    )
                    
                    await self.channel_layer.group_add(
                        f"user_{self.user_id}_game_wallet",
                        self.channel_name
                    )
                    
                    await self.channel_layer.group_add(
                        f"user_{self.user_id}_achievements",
                        self.channel_name
                    )
                    
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
            
            # Other commands could be handled here
            
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
    
    async def nft_update(self, event):
        """Handle NFT update events from other consumers"""
        # Forward the update to the WebSocket
        await self.send(text_data=json.dumps(event))
    
    async def transaction_update(self, event):
        """Handle transaction update events from other consumers"""
        # Forward the update to the WebSocket
        await self.send(text_data=json.dumps(event))
    
    async def achievement_update(self, event):
        """Handle achievement update events from other consumers"""
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


class GameConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for specific game updates"""
    
    async def connect(self):
        """Connect to WebSocket and join game-specific group"""
        self.user = None
        self.game_id = self.scope['url_route']['kwargs'].get('game_id')
        
        if not self.game_id:
            logger.error("No game ID provided in URL")
            await self.close()
            return
        
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
        
        # Join game-specific group
        self.game_group_name = f"game_{self.game_id}"
        await self.channel_layer.group_add(
            self.game_group_name,
            self.channel_name
        )
        
        # Accept connection
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to game {self.game_id} updates',
            'authenticated': bool(self.user and self.user.is_authenticated)
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave game-specific group
        if hasattr(self, 'game_group_name'):
            await self.channel_layer.group_discard(
                self.game_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle messages from client"""
        try:
            data = json.loads(text_data)
            
            # Handle token authentication
            if data.get('token'):
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
            
            # Handle game events
            elif data.get('event'):
                event_type = data.get('event')
                
                # Verify user is authenticated for events that require it
                if not self.user or not self.user.is_authenticated:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Authentication required for this action'
                    }))
                    return
                
                # Handle different event types
                if event_type == 'score_update':
                    # Broadcast score update to game group
                    await self.channel_layer.group_send(
                        self.game_group_name,
                        {
                            'type': 'game_event',
                            'event': 'score_update',
                            'user': self.user.username,
                            'score': data.get('score', 0)
                        }
                    )
                elif event_type == 'achievement_unlocked':
                    # Broadcast achievement update to game group
                    await self.channel_layer.group_send(
                        self.game_group_name,
                        {
                            'type': 'game_event',
                            'event': 'achievement_unlocked',
                            'user': self.user.username,
                            'achievement': data.get('achievement', '')
                        }
                    )
                elif event_type == 'game_chat':
                    # Broadcast chat message to game group
                    await self.channel_layer.group_send(
                        self.game_group_name,
                        {
                            'type': 'game_chat',
                            'user': self.user.username,
                            'message': data.get('message', '')
                        }
                    )
        
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
    
    async def game_event(self, event):
        """Handle game events from other consumers"""
        # Forward the event to the WebSocket
        await self.send(text_data=json.dumps(event))
    
    async def game_chat(self, event):
        """Handle game chat messages from other consumers"""
        # Forward the chat message to the WebSocket
        await self.send(text_data=json.dumps({
            'type': 'game_chat',
            'user': event['user'],
            'message': event['message']
        }))
    
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


class LeaderboardConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for leaderboard updates"""
    
    async def connect(self):
        """Connect to WebSocket and join leaderboard group"""
        self.game_id = self.scope['url_route']['kwargs'].get('game_id')
        
        if not self.game_id:
            logger.error("No game ID provided in URL")
            await self.close()
            return
        
        # Join leaderboard-specific group
        self.leaderboard_group_name = f"leaderboard_{self.game_id}"
        await self.channel_layer.group_add(
            self.leaderboard_group_name,
            self.channel_name
        )
        
        # Accept connection
        await self.accept()
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Connected to leaderboard updates for game {self.game_id}'
        }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave leaderboard-specific group
        if hasattr(self, 'leaderboard_group_name'):
            await self.channel_layer.group_discard(
                self.leaderboard_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle messages from client"""
        # This consumer primarily handles incoming updates from server,
        # so we don't expect many client messages
        pass
    
    async def leaderboard_update(self, event):
        """Handle leaderboard update events"""
        # Forward the update to the WebSocket
        await self.send(text_data=json.dumps(event))