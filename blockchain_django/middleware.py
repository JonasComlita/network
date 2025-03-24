# blockchain_django/middleware.py

import json
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from channels.auth import AuthMiddlewareStack
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
from urllib.parse import parse_qs

@database_sync_to_async
def get_user_from_token(token_key):
    User = get_user_model()
    
    try:
        # Validate token and get user
        token = AccessToken(token_key)
        user_id = token.payload.get('user_id')
        
        # Get user from database
        user = User.objects.get(id=user_id)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    """
    Custom middleware that takes a token from the query string and authenticates via JWT.
    """
    
    async def __call__(self, scope, receive, send):
        # Try to get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        
        # Get token from query params, if exists
        token = query_params.get('token', [None])[0]
        
        if token:
            # Authenticate using the token
            scope['user'] = await get_user_from_token(token)
        else:
            # Set anonymous user initially
            scope['user'] = AnonymousUser()
            
            # Handle token in first message (for browsers that don't support query params in WebSocket URLs)
            original_receive = receive
            
            async def receive_wrapper():
                message = await original_receive()
                
                if message['type'] == 'websocket.receive':
                    try:
                        data = json.loads(message.get('text', '{}'))
                        if 'token' in data:
                            scope['user'] = await get_user_from_token(data['token'])
                    except (json.JSONDecodeError, KeyError):
                        pass
                
                return message
                
            receive = receive_wrapper
        
        return await super().__call__(scope, receive, send)

def TokenAuthMiddlewareStack(inner):
    """Wrapper function for token auth middleware"""
    return TokenAuthMiddleware(AuthMiddlewareStack(inner))