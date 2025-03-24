# blockchain_django/views/auth_views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model

from blockchain_django.email_verifier import EmailVerifier
from blockchain_django.serializers import UserSerializer

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
        user.save()
        
        return Response({
            'message': 'Password has been reset successfully. You can now log in with your new password.'
        }, status=status.HTTP_200_OK)
    
    