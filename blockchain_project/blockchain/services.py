import requests
import random
import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def fetch_external_block_data():
    """
    Fetches external blockchain data (this is a mock function)
    """
    # In a real application, you would call an external API
    return {
        'latest_block': {
            'height': 800245,
            'hash': '00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a54f',
            'timestamp': '2023-05-15T12:34:56Z'
        }
    }

def fetch_price_data():
    """
    Fetches cryptocurrency price data (this is a mock function)
    """
    # In a real application, you would call an external API like CoinGecko
    return {
        'bitcoin': {
            'usd': random.uniform(50000, 60000)
        },
        'ethereum': {
            'usd': random.uniform(2000, 3000)
        }
    }

def fetch_market_data():
    """
    Fetches cryptocurrency market data (this is a mock function)
    """
    return {
        'market_cap': {
            'bitcoin': random.uniform(900, 1200) * 1e9,
            'total': random.uniform(1.5, 2.5) * 1e12
        },
        'volume': {
            'bitcoin': random.uniform(20, 40) * 1e9,
            'total': random.uniform(80, 120) * 1e9
        }
    }

def fetch_news_data():
    """
    Fetches cryptocurrency news (this is a mock function)
    """
    return {
        'articles': [
            {
                'title': 'Bitcoin Reaches New All-Time High',
                'content': 'Bitcoin has reached a new all-time high of $75,000...',
                'source': 'CryptoNews',
                'publish_date': '2023-05-15T10:30:00Z'
            },
            {
                'title': 'Ethereum Completes Major Network Upgrade',
                'content': 'Ethereum has successfully completed its latest network upgrade...',
                'source': 'BlockchainReport',
                'publish_date': '2023-05-14T16:45:00Z'
            }
        ]
    }

def fetch_sentiment_data():
    """
    Fetches cryptocurrency sentiment data (this is a mock function)
    """
    return [
        {
            'sentiment': 'positive',
            'score': random.uniform(0.6, 0.9)
        },
        {
            'sentiment': 'negative',
            'score': random.uniform(0.2, 0.5)
        },
        {
            'sentiment': 'neutral',
            'score': random.uniform(0.3, 0.7)
        }
    ]

# Functions to broadcast updates via WebSockets

def broadcast_price_update():
    """
    Broadcasts a price update via WebSocket
    """
    channel_layer = get_channel_layer()
    
    price_data = fetch_price_data()
    
    async_to_sync(channel_layer.group_send)(
        "price_changes",
        {
            "type": "send_price_change_update",
            "bitcoin": price_data['bitcoin'],
            "ethereum": price_data.get('ethereum', {})
        }
    )
    
    return True

def broadcast_block_update(block_data=None):
    """
    Broadcasts a block update via WebSocket
    """
    channel_layer = get_channel_layer()
    
    if block_data is None:
        block_data = fetch_external_block_data()
    
    async_to_sync(channel_layer.group_send)(
        "blocks",
        {
            "type": "send_block_update",
            "block": block_data.get('latest_block', {})
        }
    )
    
    return True

def broadcast_notification(user_id, message, notification_type="info"):
    """
    Broadcasts a notification via WebSocket
    """
    channel_layer = get_channel_layer()
    
    notification = {
        "id": random.randint(1000, 9999),
        "message": message,
        "type": notification_type,
        "timestamp": "2023-05-15T12:34:56Z",
        "is_read": False
    }
    
    async_to_sync(channel_layer.group_send)(
        "notifications",
        {
            "type": "send_notification_update",
            "notification_type": "new_notification",
            "notification": notification
        }
    )
    
    return True