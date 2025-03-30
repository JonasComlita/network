"""
ASGI config for blockchain_project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django

# Set Django settings module and setup Django first
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "blockchain_project.settings")
django.setup()

# Import other modules after Django is set up
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.layers import get_channel_layer

# Import the middleware after Django setup
from blockchain_django.middleware import TokenAuthMiddlewareStack
from blockchain_project.routing import websocket_urlpatterns

# Get ASGI application
django_asgi_app = get_asgi_application()

# Initialize channel layer
channel_layer = get_channel_layer()

# Initialize blockchain in a separate function
async def init_blockchain():
    from blockchain_django.blockchain_service import get_blockchain, initialize_blockchain
    await initialize_blockchain()

# Define the application
application = ProtocolTypeRouter({
    # HTTP requests are handled by the standard Django ASGI application
    "http": django_asgi_app,
    
    # WebSocket handling with authentication and security
    "websocket": TokenAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})