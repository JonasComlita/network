from django.urls import re_path
from . import consumers

# Define WebSocket URL patterns for forum app
websocket_urlpatterns = [
    # Forum-related WebSockets
    re_path(r'ws/forum/$', consumers.ForumConsumer.as_asgi()),
    re_path(r'ws/forum/thread/(?P<thread_id>\d+)/$', consumers.ForumConsumer.as_asgi()),
    re_path(r'ws/forum/category/(?P<category_slug>[^/]+)/$', consumers.ForumConsumer.as_asgi()),
]