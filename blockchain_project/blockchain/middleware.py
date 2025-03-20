from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.conf import settings
from urllib.parse import parse_qs
import jwt
from jwt import InvalidTokenError

@database_sync_to_async
def get_user(token_key):
    try:
        # Verify the token
        payload = jwt.decode(
            token_key,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        # Get the user model
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Try to find the user by ID in the payload
        user_id = payload.get('user_id')
        if user_id:
            return User.objects.get(id=user_id)
        
        # If user_id is not in payload, try username
        username = payload.get('username')
        if username:
            return User.objects.get(username=username)
        
        return AnonymousUser()
    except (InvalidTokenError, User.DoesNotExist):
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get the token from query string
        query_params = parse_qs(scope["query_string"].decode())
        token = query_params.get("token", [None])[0]

        if token:
            # Get the user and attach it to the scope
            scope["user"] = await get_user(token)
        else:
            scope["user"] = AnonymousUser()
            
        return await super().__call__(scope, receive, send)

def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(inner)