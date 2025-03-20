"""
ASGI config for blockchain_project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from blockchain.routing import websocket_urlpatterns  # Adjust the import based on your routing
from channels.layers import get_channel_layer

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "blockchain_project.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})


channel_layer = get_channel_layer()
