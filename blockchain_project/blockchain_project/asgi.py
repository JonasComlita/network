"""
ASGI config for blockchain_project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from blockchain.routing import websocket_urlpatterns  # Adjust the import based on your routing
from channels.layers import get_channel_layer
from blockchain.middleware import TokenAuthMiddlewareStack  # Import our custom middleware

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "blockchain_project.settings")

# Get ASGI application first
django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddlewareStack(  # Use our custom token middleware
        URLRouter(websocket_urlpatterns)
    ),
})

channel_layer = get_channel_layer()