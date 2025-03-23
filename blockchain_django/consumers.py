import json
import logging
import asyncio
import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from blockchain_django.blockchain_service import get_blockchain
from blockchain.blockchain import Blockchain

logger = logging.getLogger('django')
User = get_user_model()

class HealthCheckConsumer(AsyncWebsocketConsumer):
    """Simple consumer for health checking WebSocket connections"""
    async def connect(self):
        await self.accept()
        # Send a confirmation message
        await self.send(text_data=json.dumps({
            'status': 'ok',
            'message': 'WebSocket connection healthy'
        }))

    async def disconnect(self, close_code):
        pass

class BlockConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("blocks", self.channel_name)
        await self.accept()
        
        # Send initial connection message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to blocks WebSocket'
        }))
        
        # Get blockchain instance
        blockchain = get_blockchain()
        
        # Check if blockchain is initialized and has subscribe method
        if hasattr(blockchain, 'initialized') and blockchain.initialized and hasattr(blockchain, 'subscribe'):
            blockchain.subscribe("new_block", self.on_new_block)
            await self.send(text_data=json.dumps({
                'type': 'status',
                'message': 'Subscribed to blockchain updates'
            }))
        else:
            # Handle inactive or initializing blockchain case
            logger.warning("Blockchain not fully initialized or missing subscribe method")
            
            # Try to add callback to listeners directly if available
            if hasattr(blockchain, 'listeners') and isinstance(blockchain.listeners, dict):
                if "new_block" not in blockchain.listeners:
                    blockchain.listeners["new_block"] = []
                blockchain.listeners["new_block"].append(self.on_new_block)
                await self.send(text_data=json.dumps({
                    'type': 'status',
                    'message': 'Added to blockchain listeners (limited functionality)'
                }))
            else:
                # Inform client of limited functionality
                await self.send(text_data=json.dumps({
                    'type': 'warning',
                    'message': 'Blockchain service not fully initialized. Some features may be unavailable.'
                }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("blocks", self.channel_name)
        
        # Try to unsubscribe if possible
        try:
            blockchain = get_blockchain()
            if hasattr(blockchain, 'initialized') and blockchain.initialized and hasattr(blockchain, 'unsubscribe'):
                blockchain.unsubscribe("new_block", self.on_new_block)
        except Exception as e:
            logger.error(f"Error in disconnect: {e}")

    async def on_new_block(self, block):
        try:
            # Handle different block formats
            if hasattr(block, 'to_dict') and callable(getattr(block, 'to_dict')):
                try:
                    block_dict = block.to_dict()
                except Exception as e:
                    logger.error(f"Error in block.to_dict(): {e}")
                    block_dict = {
                        'index': getattr(block, 'index', 'unknown'),
                        'error': 'Could not convert block to dictionary'
                    }
            else:
                # If block is already a dict or has another format
                block_dict = {'error': 'Invalid block format'}
                
                # Try to extract some basic info
                if hasattr(block, 'index'):
                    block_dict['index'] = block.index
                if hasattr(block, 'hash'):
                    block_dict['hash'] = block.hash
                    
            await self.send(text_data=json.dumps({
                "type": "new_block",
                "block": block_dict
            }))
        except Exception as e:
            logger.error(f"Error sending block update: {e}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": f"Error processing block update: {str(e)}"
            }))

    async def send_block_update(self, event):
        await self.send(text_data=json.dumps(event))


class TransactionConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("transactions", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to transactions WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("transactions", self.channel_name)

    async def send_transaction_update(self, event):
        await self.send(text_data=json.dumps(event))

class PriceChangeConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("price_changes", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message with sample data
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to price WebSocket',
            'bitcoin': {
                'usd': 53245.67  # Sample price data
            }
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("price_changes", self.channel_name)

    async def send_price_change_update(self, event):
        await self.send(text_data=json.dumps(event))

class HistoricalTransactionDataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("historical_transactions", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to historical transactions WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("historical_transactions", self.channel_name)

    async def send_historical_transaction_update(self, event):
        await self.send(text_data=json.dumps(event))

class NewsDataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("news", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to news WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("news", self.channel_name)

    async def send_news_update(self, event):
        await self.send(text_data=json.dumps(event))

class UserAnalyticsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("user_analytics", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to user analytics WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("user_analytics", self.channel_name)

    async def send_user_analytics_update(self, event):
        await self.send(text_data=json.dumps(event))

class SentimentDataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("sentiment", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to sentiment WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("sentiment", self.channel_name)

    async def send_sentiment_update(self, event):
        await self.send(text_data=json.dumps(event))

class MarketDataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("market_data", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to market data WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("market_data", self.channel_name)

    async def send_market_data_update(self, event):
        await self.send(text_data=json.dumps(event))

class UserDashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("user_dashboard", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to user dashboard WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("user_dashboard", self.channel_name)

    async def send_user_dashboard_update(self, event):
        await self.send(text_data=json.dumps(event))

class HistoricalDataConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("historical_data", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to historical data WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("historical_data", self.channel_name)

    async def send_historical_data_update(self, event):
        await self.send(text_data=json.dumps(event))

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("notifications", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to notifications WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("notifications", self.channel_name)

    async def send_notification_update(self, event):
        await self.send(text_data=json.dumps(event))

class AdvancedAnalyticsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("advanced_analytics", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to advanced analytics WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("advanced_analytics", self.channel_name)

    async def send_advanced_analytics_update(self, event):
        await self.send(text_data=json.dumps(event))

class TransactionAnalyticsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("transaction_analytics", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to transaction analytics WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("transaction_analytics", self.channel_name)

    async def send_transaction_analytics_update(self, event):
        await self.send(text_data=json.dumps(event))

class UserProfileConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("user_profile", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to user profile WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("user_profile", self.channel_name)

    async def send_user_profile_update(self, event):
        await self.send(text_data=json.dumps(event))

class UserPreferencesConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("user_preferences", self.channel_name)
        await self.accept()
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to user preferences WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("user_preferences", self.channel_name)

    async def send_user_preferences_update(self, event):
        await self.send(text_data=json.dumps(event))

class BlockchainChartConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("blockchain_chart", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("blockchain_chart", self.channel_name)

    async def send_blockchain_chart_update(self, event):
        await self.send(text_data=json.dumps(event))

class TestConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("TestConsumer: Connection attempt")
        await self.accept()
        print("TestConsumer: Connection accepted")
        await self.send(text_data=json.dumps({
            'message': 'Connected to test consumer'
        }))

    async def disconnect(self, close_code):
        print(f"TestConsumer: Disconnected with code {close_code}")

# Add this to your blockchain/consumers.py file

import json
import logging
import asyncio
import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger('django')
User = get_user_model()

class WalletConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for wallet updates"""
    
    async def connect(self):
        self.user = None
        self.user_id = None
        self.wallet_address = None
        
        # Try to authenticate from query params first
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
        
        # Try to authenticate with token from query params
        if token:
            try:
                self.user = await self.get_user_from_token(token)
            except Exception as e:
                logger.error(f"WebSocket auth error from query params: {e}")
        
        # If no token in query params or authentication failed, check if user is authenticated from scope
        if not self.user and self.scope.get("user") and self.scope["user"].is_authenticated:
            self.user = self.scope["user"]
        
        # Accept the connection for now, authentication will be confirmed in the first message
        await self.accept()

        await self.send(text_data=json.dumps({
        'type': 'connection_established',
        'message': 'Connected to wallet WebSocket'
        }))
        
        # If user is already authenticated, set up the connection
        if self.user and self.user.is_authenticated:
            self.user_id = self.user.id
            self.wallet_address = getattr(self.user, 'wallet_address', None)
            
            if self.wallet_address:
                # Add to wallet group
                self.wallet_group_name = f"user_{self.user_id}_wallet"
                await self.channel_layer.group_add(
                    self.wallet_group_name,
                    self.channel_name
                )
                
                # Send initial wallet data
                await self.send_wallet_status()
            else:
                # Send message indicating no wallet
                await self.send(text_data=json.dumps({
                    'type': 'wallet_info',
                    'has_wallet': False,
                    'message': 'No wallet associated with this account'
                }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave wallet group
        if hasattr(self, 'wallet_group_name'):
            await self.channel_layer.group_discard(
                self.wallet_group_name,
                self.channel_name
            )
        logger.info(f"WebSocket disconnected, code: {close_code}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket client"""
        try:
            data = json.loads(text_data)
            
            # Handle token auth message
            if 'token' in data:
                try:
                    self.user = await self.get_user_from_token(data['token'])
                    self.user_id = self.user.id
                    self.wallet_address = getattr(self.user, 'wallet_address', None)
                    
                    if not self.wallet_address:
                        await self.send(text_data=json.dumps({
                            'type': 'wallet_info',
                            'has_wallet': False,
                            'message': 'No wallet associated with this account'
                        }))
                    else:
                        # Update group membership if needed
                        new_group = f"user_{self.user_id}_wallet"
                        if hasattr(self, 'wallet_group_name') and self.wallet_group_name != new_group:
                            # Leave old group
                            await self.channel_layer.group_discard(
                                self.wallet_group_name,
                                self.channel_name
                            )
                            # Join new group
                            self.wallet_group_name = new_group
                            await self.channel_layer.group_add(
                                self.wallet_group_name,
                                self.channel_name
                            )
                        
                        # Send current wallet status
                        await self.send_wallet_status()
                except Exception as e:
                    logger.error(f"WebSocket token auth error: {e}")
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Authentication failed'
                    }))
            
            # Handle command to get balance
            elif 'command' in data and data['command'] == 'get_balance':
                if self.user and self.wallet_address:
                    await self.send_wallet_status()
                else:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Not authenticated or no wallet'
                    }))
            
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in WebSocket")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid message format'
            }))
        except Exception as e:
            logger.error(f"Error in WebSocket receive: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Server error processing message'
            }))
    
    async def balance_update(self, event):
        """Handle balance update events from group"""
        # Send balance update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'balance_update',
            'balance': event['balance'],
            'wallet_address': event['wallet_address'],
            'timestamp': event.get('timestamp', datetime.datetime.now().isoformat())
        }))
    
    async def transaction_update(self, event):
        """Handle transaction update events from group"""
        # Send transaction update to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'transaction_update',
            'transaction': event['transaction']
        }))
    
    async def send_wallet_status(self):
        """Send current wallet status to client"""
        if not self.user or not self.wallet_address:
            return
        
        try:
            # Get current balance from user model
            await self.refresh_user()
            balance = getattr(self.user, 'wallet_balance', 0)
            
            # Send current status to client
            await self.send(text_data=json.dumps({
                'type': 'wallet_status',
                'has_wallet': True,
                'status': 'active',
                'wallet_address': self.wallet_address,
                'balance': float(balance) if balance is not None else 0.0
            }))
        except Exception as e:
            logger.error(f"Error sending wallet status: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error retrieving wallet status: {str(e)}'
            }))
    
    @database_sync_to_async
    def get_user_from_token(self, token_key):
        """Get user from JWT token"""
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
    
    @database_sync_to_async
    def refresh_user(self):
        """Refresh user data from database"""
        if self.user and self.user.id:
            self.user = User.objects.get(id=self.user.id)