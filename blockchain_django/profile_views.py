# blockchain_django/views/profile_views.py
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import update_session_auth_hash
from blockchain_django.models import CustomUser
from blockchain_django.serializers import UserProfileSerializer, UserPreferencesSerializer
from security.mfa import MFAManager

logger = logging.getLogger(__name__)

class UserProfileView(APIView):
    """View for getting and updating user profile information"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
        """Get user profile information"""
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update user profile information"""
        user = request.user
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserPreferencesView(APIView):
    """View for getting and updating user preferences"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user preferences"""
        user = request.user
        serializer = UserPreferencesSerializer(user)
        return Response(serializer.data)
    
    def patch(self, request):
        """Update user preferences"""
        user = request.user
        serializer = UserPreferencesSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    """View for changing user password"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Handle password change request"""
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        # Validate input
        if not current_password or not new_password:
            return Response({
                'error': 'Current password and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check current password
        if not user.check_password(current_password):
            return Response({
                'error': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Update session to keep user logged in
        update_session_auth_hash(request, user)
        
        return Response({
            'message': 'Password changed successfully'
        })

class TwoFactorSetupView(APIView):
    """View for setting up two-factor authentication"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Initialize 2FA setup"""
        user = request.user
        
        # Create MFA manager instance
        mfa_manager = MFAManager()
        
        try:
            # Generate new MFA secret
            secret = mfa_manager.generate_mfa_secret(user.wallet_address or str(user.id))
            
            # Generate QR code for user to scan
            qr_code = mfa_manager.get_mfa_qr(
                user.wallet_address or str(user.id), 
                user.username
            )
            
            # Convert QR code image to base64 string for frontend
            import io
            import base64
            buffer = io.BytesIO()
            qr_code.save(buffer, format="PNG")
            qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            return Response({
                'secret': secret,
                'qr_code': qr_code_base64,
                'username': user.username,
                'status': 'setup_initiated'
            })
        except Exception as e:
            logger.error(f"Error setting up 2FA: {e}")
            return Response({
                'error': 'Failed to set up two-factor authentication'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TwoFactorVerifySetupView(APIView):
    """View for verifying two-factor authentication setup"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Verify 2FA setup with code"""
        user = request.user
        verification_code = request.data.get('code')
        
        if not verification_code:
            return Response({
                'error': 'Verification code is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create MFA manager instance
        mfa_manager = MFAManager()
        
        # Verify the code
        is_valid = mfa_manager.verify_mfa(
            user.wallet_address or str(user.id), 
            verification_code
        )
        
        if is_valid:
            # Update user's 2FA status
            user.two_factor_enabled = True
            user.save(update_fields=['two_factor_enabled'])
            
            return Response({
                'message': 'Two-factor authentication enabled successfully',
                'status': 'enabled'
            })
        else:
            return Response({
                'error': 'Invalid verification code',
                'status': 'failed'
            }, status=status.HTTP_400_BAD_REQUEST)

class TwoFactorDisableView(APIView):
    """View for disabling two-factor authentication"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Disable 2FA with verification code"""
        user = request.user
        verification_code = request.data.get('code')
        
        if not user.two_factor_enabled:
            return Response({
                'error': 'Two-factor authentication is not enabled',
                'status': 'not_enabled'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not verification_code:
            return Response({
                'error': 'Verification code is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create MFA manager instance
        mfa_manager = MFAManager()
        
        # Verify the code
        is_valid = mfa_manager.verify_mfa(
            user.wallet_address or str(user.id), 
            verification_code
        )
        
        if is_valid:
            # Reset MFA
            mfa_manager.reset_mfa(user.wallet_address or str(user.id))
            
            # Update user's 2FA status
            user.two_factor_enabled = False
            user.save(update_fields=['two_factor_enabled'])
            
            return Response({
                'message': 'Two-factor authentication disabled successfully',
                'status': 'disabled'
            })
        else:
            return Response({
                'error': 'Invalid verification code',
                'status': 'failed'
            }, status=status.HTTP_400_BAD_REQUEST)