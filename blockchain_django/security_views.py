# blockchain_django/security_views.py
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from datetime import timedelta

from blockchain_django.models import LoginHistory, TwoFactorBackupCode
from blockchain_django.security.mfa import MFAManager
from blockchain_django.security.ip_utils import get_client_ip, get_location_from_ip
from blockchain_django.security.password_analyzer import analyze_password_strength

logger = logging.getLogger(__name__)

class LoginHistoryPagination(PageNumberPagination):
    """Custom pagination for login history"""
    page_size = 20
    page_size_query_param = 'per_page'
    max_page_size = 100

class LoginHistoryView(APIView):
    """
    API view for accessing login history
    """
    permission_classes = [IsAuthenticated]
    pagination_class = LoginHistoryPagination
    
    def get(self, request):
        """Get login history for the current user"""
        user = request.user
        
        # Get filter parameters
        days = request.query_params.get('days')
        successful = request.query_params.get('successful')
        
        # Build query
        queryset = LoginHistory.objects.filter(user=user).order_by('-timestamp')
        
        # Apply filters
        if days:
            try:
                days = int(days)
                cutoff_date = timezone.now() - timedelta(days=days)
                queryset = queryset.filter(timestamp__gte=cutoff_date)
            except ValueError:
                pass
        
        if successful is not None:
            successful_bool = successful.lower() == 'true'
            queryset = queryset.filter(successful=successful_bool)
        
        # Apply pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        
        # Serialize the login history data
        data = []
        for login in page:
            data.append({
                'id': login.id,
                'timestamp': login.timestamp,
                'ip_address': login.ip_address,
                'user_agent': login.user_agent,
                'location': login.location,
                'successful': login.successful
            })
        
        return paginator.get_paginated_response(data)

class SecurityOverviewView(APIView):
    """
    API view for getting security overview data
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get security overview for the current user"""
        user = request.user
        
        # Analyze password strength
        password_strength = analyze_password_strength(user)
        
        # Check for recent password change (within last 90 days)
        has_recent_password_change = False
        if user.last_password_change:
            days_since_change = (timezone.now() - user.last_password_change).days
            has_recent_password_change = days_since_change <= 90
        
        # Check if user has a wallet backup
        has_wallet_backup = hasattr(user, 'wallet_backup_verified') and user.wallet_backup_verified
        
        # Check if user has multiple wallets
        has_multiple_wallets = hasattr(user, 'wallets') and user.wallets.count() > 1
        
        # Check if user has a recovery email (not implemented in the model)
        has_recovery_email = False  # Placeholder
        
        # Get recent login history (last 5 entries)
        recent_logins = LoginHistory.objects.filter(user=user).order_by('-timestamp')[:5]
        
        # Format login history
        login_history = []
        for login in recent_logins:
            login_history.append({
                'timestamp': login.timestamp,
                'ip_address': login.ip_address,
                'location': login.location,
                'user_agent': login.user_agent,
                'successful': login.successful
            })
        
        # Build response
        response_data = {
            'email_verified': user.email_verified,
            'two_factor_enabled': user.two_factor_enabled,
            'password_strength': password_strength,
            'has_recent_password_change': has_recent_password_change,
            'last_password_change': user.last_password_change,
            'has_wallet_backup': has_wallet_backup,
            'has_multiple_wallets': has_multiple_wallets,
            'has_recovery_email': has_recovery_email,
            'recent_logins': login_history,
            'account_locked': user.is_account_locked(),
            'failed_login_attempts': user.failed_login_attempts
        }
        
        return Response(response_data)

class TwoFactorStatusView(APIView):
    """
    API view for checking 2FA status
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get 2FA status for the current user"""
        user = request.user
        
        # Check if user has backup codes
        has_backup_codes = TwoFactorBackupCode.objects.filter(user=user, used=False).exists()
        
        response_data = {
            'enabled': user.two_factor_enabled,
            'has_backup_codes': has_backup_codes
        }
        
        return Response(response_data)

class TwoFactorBackupCodesView(APIView):
    """
    API view for managing 2FA backup codes
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get backup codes for the current user"""
        user = request.user
        
        if not user.two_factor_enabled:
            return Response({
                'error': 'Two-factor authentication is not enabled'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get unused backup codes
        backup_codes = TwoFactorBackupCode.objects.filter(user=user, used=False)
        
        # Convert to list of codes
        codes = [code.code for code in backup_codes]
        
        return Response({
            'codes': codes
        })
    
    def post(self, request):
        """Generate new backup codes for the current user"""
        user = request.user
        
        if not user.two_factor_enabled:
            return Response({
                'error': 'Two-factor authentication is not enabled'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate new backup codes
        mfa_manager = MFAManager()
        backup_codes = mfa_manager.generate_backup_codes(user)
        
        return Response({
            'codes': backup_codes
        })