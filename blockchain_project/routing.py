# blockchain_project/routing.py
from django.urls import re_path
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# Define a function to safely import patterns
def get_patterns(module_path):
    try:
        module = __import__(module_path, fromlist=['websocket_urlpatterns'])
        return module.websocket_urlpatterns
    except (ImportError, AttributeError):
        return []

# Get patterns from each app
blockchain_patterns = get_patterns('blockchain_django.routing')
forum_patterns = get_patterns('forum.routing')  # Changed - matching your URL configuration
gaming_patterns = get_patterns('gaming.routing')  # Changed - matching your URL configuration

# Combine all patterns
websocket_urlpatterns = blockchain_patterns + forum_patterns + gaming_patterns

# Define application for ASGI configuration
application = ProtocolTypeRouter({
    # WebSocket handling with authentication
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})