# blockchain_django/email_verifier.py
import logging
import secrets
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import timezone
from .models import VerificationToken, CustomUser

logger = logging.getLogger(__name__)

class EmailVerifier:
    """
    Handles email verification for user registration and password recovery
    """
    
    TOKEN_EXPIRY_HOURS = 24  # Tokens expire after 24 hours
    
    @classmethod
    def generate_token(cls, user, token_type='email_verification'):
        """
        Generate a unique verification token for a user
        
        Args:
            user (CustomUser): The user to generate a token for
            token_type (str): Type of token ('email_verification' or 'password_reset')
            
        Returns:
            str: The generated token
        """
        # Generate a secure random token
        token = secrets.token_urlsafe(32)
        
        # Calculate expiry time
        expiry_time = timezone.now() + timedelta(hours=cls.TOKEN_EXPIRY_HOURS)
        
        # Create or update token in database
        VerificationToken.objects.update_or_create(
            user=user,
            token_type=token_type,
            defaults={
                'token': token,
                'expires_at': expiry_time
            }
        )
        
        logger.info(f"Generated {token_type} token for user {user.username}")
        return token
    
    @classmethod
    def send_verification_email(cls, user, request=None):
        """
        Send verification email to a newly registered user
        
        Args:
            user (CustomUser): The user to send verification to
            request: The HTTP request object (optional, for building absolute URLs)
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        token = cls.generate_token(user, 'email_verification')
        
        try:
            # Build verification URL
            if request:
                verification_url = request.build_absolute_uri(
                    reverse('verify_email', kwargs={'token': token})
                )
            else:
                # Fallback if request is not provided
                site_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                verification_url = f"{site_url}{reverse('verify_email', kwargs={'token': token})}"
            
            # Render email template
            context = {
                'username': user.username,
                'verification_url': verification_url,
                'expiry_hours': cls.TOKEN_EXPIRY_HOURS,
                'current_year': datetime.now().year
            }
            html_message = render_to_string('emails/verify_email.html', context)
            plain_message = render_to_string('emails/verify_email.txt', context)
            
            # Send email
            send_mail(
                subject='Verify your account',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False
            )
            
            logger.info(f"Verification email sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {e}")
            return False
    
    @classmethod
    def send_password_reset_email(cls, user, request=None):
        """
        Send password reset email to user
        
        Args:
            user (CustomUser): The user requesting password reset
            request: The HTTP request object (optional, for building absolute URLs)
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        token = cls.generate_token(user, 'password_reset')
        
        try:
            # Build reset URL
            if request:
                reset_url = request.build_absolute_uri(
                    reverse('password_reset_confirm', kwargs={'token': token})
                )
            else:
                # Fallback if request is not provided
                site_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                reset_url = f"{site_url}{reverse('password_reset_confirm', kwargs={'token': token})}"
            
            # Render email template
            context = {
                'username': user.username,
                'reset_url': reset_url,
                'expiry_hours': cls.TOKEN_EXPIRY_HOURS,
                'current_year': datetime.now().year
            }
            html_message = render_to_string('emails/password_reset.html', context)
            plain_message = render_to_string('emails/password_reset.txt', context)
            
            # Send email
            send_mail(
                subject='Reset your password',
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False
            )
            
            logger.info(f"Password reset email sent to {user.email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send password reset email to {user.email}: {e}")
            return False
    
    @classmethod
    def verify_token(cls, token, token_type='email_verification'):
        """
        Verify a token and return the associated user if valid
        
        Args:
            token (str): The token to verify
            token_type (str): Type of token ('email_verification' or 'password_reset')
            
        Returns:
            CustomUser or None: The user associated with the token if valid, None otherwise
        """
        try:
            # Find the token in the database
            token_obj = VerificationToken.objects.get(
                token=token,
                token_type=token_type,
                expires_at__gt=timezone.now()  # Token is not expired
            )
            
            # Get the associated user
            user = token_obj.user
            
            # For email verification, mark the user as verified
            if token_type == 'email_verification':
                user.email_verified = True
                user.save(update_fields=['email_verified'])
            
            # Delete the used token
            token_obj.delete()
            
            logger.info(f"Successfully verified {token_type} token for user {user.username}")
            return user
        except VerificationToken.DoesNotExist:
            logger.warning(f"Invalid or expired {token_type} token: {token}")
            return None
        except Exception as e:
            logger.error(f"Error verifying {token_type} token: {e}")
            return None