from django.urls import re_path
from . import consumers

# Define WebSocket URL patterns for gaming app
websocket_urlpatterns = [
    # Gaming-related WebSockets
    re_path(r'ws/gaming/$', consumers.GamingConsumer.as_asgi()),
    re_path(r'ws/gaming/games/(?P<game_id>[^/]+)/$', consumers.GameConsumer.as_asgi()),
    re_path(r'ws/gaming/leaderboards/(?P<game_id>[^/]+)/$', consumers.LeaderboardConsumer.as_asgi()),
    re_path(r'ws/gaming/nfts/$', consumers.GamingConsumer.as_asgi()),
]