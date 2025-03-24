# blockchain_django/views/auth_views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from blockchain_django.email_verifier import EmailVerifier
from blockchain_django.serializers import UserSerializer
from blockchain_django.models import LoginHistory, VerificationToken
from blockchain_django.security.mfa import MFAManager  # Assuming you have an MFA manager
from blockchain_django.security.ip_utils import get_client_ip, get_location_from_ip

User = get_user_model()

class VerifyEmailView(APIView):
    """Verify user email with token"""
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        """Handle GET request to verify email"""
        user = EmailVerifier.verify_token(token, 'email_verification')
        
        if user:
            return Response({
                'message': 'Email verification successful. You can now log in.'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid or expired verification token'
            }, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    """Request a password reset"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Handle POST request to initiate password reset"""
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            
            # Generate and send password reset email
            success = EmailVerifier.send_password_reset_email(user, request)
            
            if success:
                return Response({
                    'message': 'Password reset instructions have been sent to your email'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Failed to send password reset email. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except User.DoesNotExist:
            # For security reasons, don't reveal that the email doesn't exist
            return Response({
                'message': 'Password reset instructions have been sent to your email'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'An error occurred. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetConfirmView(APIView):
    """Confirm password reset with token"""
    permission_classes = [AllowAny]
    
    def post(self, request, token):
        """Handle POST request to reset password"""
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response({
                'error': 'New password is required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Verify token and get user
        user = EmailVerifier.verify_token(token, 'password_reset')
        
        if not user:
            return Response({
                'error': 'Invalid or expired password reset token'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Set new password
        user.set_password(new_password)
        user.last_password_change = timezone.now()
        user.save()
        
        return Response({
            'message': 'Password has been reset successfully. You can now log in with your new password.'
        }, status=status.HTTP_200_OK)

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that handles login tracking and 2FA"""
    
    def post(self, request, *args, **kwargs):
        # Extract username from request data for login tracking
        username = request.data.get('username', '')
        
        # Get IP address and geolocation data
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        location = get_location_from_ip(ip_address)
        
        try:
            # Call the parent class's post method to authenticate and get tokens
            response = super().post(request, *args, **kwargs)
            
            # If login successful, get the user
            if response.status_code == status.HTTP_200_OK:
                try:
                    user = User.objects.get(username=username)
                    
                    # Record successful login
                    LoginHistory.objects.create(
                        user=user,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        location=location,
                        successful=True
                    )
                    
                    # Reset failed login attempts
                    user.reset_login_attempts()
                    
                    # Update last login IP
                    user.last_login_ip = ip_address
                    user.save(update_fields=['last_login_ip'])
                    
                    # Check if 2FA is enabled for this user
                    if user.two_factor_enabled:
                        # Generate temp token for 2FA verification
                        refresh = RefreshToken.for_user(user)
                        refresh['temp_token'] = True
                        
                        # Return temp token for 2FA verification
                        return Response({
                            'require_2fa': True,
                            'temp_token': str(refresh),
                            'user_id': user.id,
                            'username': user.username
                        }, status=status.HTTP_200_OK)
                    
                    # Add wallet info to response if 2FA not enabled
                    response.data['wallet_address'] = user.wallet_address
                    response.data['email_verified'] = user.email_verified
                    response.data['two_factor_enabled'] = user.two_factor_enabled
                    
                except User.DoesNotExist:
                    # Should not happen, but handle anyway
                    pass
                    
            return response
            
        except Exception as e:
            # Handle authentication failure
            try:
                # Track failed login attempts
                try:
                    user = User.objects.get(username=username)
                    user.increment_login_attempts()
                    
                    # Record failed login
                    LoginHistory.objects.create(
                        user=user,
                        ip_address=ip_address,
                        user_agent=user_agent,
                        location=location,
                        successful=False
                    )
                    
                    # Check if account is locked
                    if user.is_account_locked():
                        return Response({
                            'error': 'Your account has been locked due to multiple failed login attempts. '
                                    'Please try again later or reset your password.'
                        }, status=status.HTTP_401_UNAUTHORIZED)
                        
                except User.DoesNotExist:
                    # User doesn't exist, return generic error
                    pass
                    
                if isinstance(e, InvalidToken):
                    return Response({
                        'error': 'Invalid credentials'
                    }, status=status.HTTP_401_UNAUTHORIZED)
                    
                return Response({
                    'error': 'Authentication failed'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
            except Exception as inner_e:
                # Handle unexpected errors during error handling
                return Response({
                    'error': 'Authentication failed'
                }, status=status.HTTP_401_UNAUTHORIZED)

class LoginWithTwoFactorView(APIView):
    """Verify 2FA code and complete login"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        temp_token = request.data.get('temp_token')
        verification_code = request.data.get('code')
        use_backup_code = request.data.get('use_backup_code', False)
        
        if not temp_token or not verification_code:
            return Response({
                'error': 'Temp token and verification code are required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Validate temp token
        try:
            # Decode the token without verification to get user ID
            from rest_framework_simplejwt.tokens import AccessToken
            token = RefreshToken(temp_token)
            
            # Check if this is a temp token
            if not token.get('temp_token', False):
                return Response({
                    'error': 'Invalid temporary token'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            user_id = token.get('user_id')
            
            # Get the user
            user = User.objects.get(id=user_id)
            
            # Verify 2FA code
            mfa_manager = MFAManager()
            
            if use_backup_code:
                # Verify backup code
                from blockchain_django.models import TwoFactorBackupCode
                
                is_valid = False
                with transaction.atomic():
                    try:
                        backup_code = TwoFactorBackupCode.objects.select_for_update().get(
                            user=user, 
                            code=verification_code,
                            used=False
                        )
                        # Mark code as used
                        backup_code.used = True
                        backup_code.save()
                        is_valid = True
                    except TwoFactorBackupCode.DoesNotExist:
                        is_valid = False
            else:
                # Verify TOTP code
                is_valid = mfa_manager.verify_mfa(
                    user.wallet_address or str(user.id),
                    verification_code
                )
            
            if is_valid:
                # Generate new token pair for authenticated user
                refresh = RefreshToken.for_user(user)
                
                # Return tokens
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'wallet_address': user.wallet_address,
                    'email_verified': user.email_verified,
                    'two_factor_enabled': user.two_factor_enabled
                }, status=status.HTTP_200_OK)
            else:
                # Record failed 2FA attempt
                LoginHistory.objects.create(
                    user=user,
                    ip_address=get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    location=get_location_from_ip(get_client_ip(request)),
                    successful=False
                )
                
                return Response({
                    'error': 'Invalid verification code'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'error': 'Authentication failed'
            }, status=status.HTTP_401_UNAUTHORIZED)

class TokenRefreshWithTwoFactorView(TokenRefreshView):
    """Custom token refresh view that handles 2FA requirements"""
    
    def post(self, request, *args, **kwargs):
        try:
            # Call the parent class's post method to refresh the token
            response = super().post(request, *args, **kwargs)
            
            return response
            
        except Exception as e:
            if isinstance(e, InvalidToken):
                return Response({
                    'error': 'Invalid refresh token'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
            return Response({
                'error': 'Token refresh failed'
            }, status=status.HTTP_401_UNAUTHORIZED)