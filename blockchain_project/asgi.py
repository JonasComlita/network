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
from blockchain_django.routing import websocket_urlpatterns
from channels.layers import get_channel_layer

# Import the middleware after Django setup
from blockchain_django.middleware import TokenAuthMiddlewareStack

# Get ASGI application
django_asgi_app = get_asgi_application()

# Initialize channel layer
channel_layer = get_channel_layer()

# Initialize blockchain in a separate function
async def init_blockchain():
    from blockchain_django.background_service import blockchain_service
    await blockchain_service.initialize_blockchain()

# Define the application
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})