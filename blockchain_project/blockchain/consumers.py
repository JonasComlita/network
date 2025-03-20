import json
from channels.generic.websocket import AsyncWebsocketConsumer

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
        
        # Send initial confirmation message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to blocks WebSocket'
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("blocks", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Handle incoming data if needed

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