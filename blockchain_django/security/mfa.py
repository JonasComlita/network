# blockchain_django/security/mfa.py
import logging
import random
import string
import base64
import pyotp
import qrcode
from io import BytesIO
from django.conf import settings
from django.db import transaction
from django.contrib.auth import get_user_model
from blockchain_django.models import TwoFactorBackupCode

logger = logging.getLogger(__name__)
User = get_user_model()

class MFAManager:
    """
    Manages two-factor authentication functionality
    including TOTP code generation, verification, and backup codes
    """
    
    def __init__(self):
        self.issuer_name = getattr(settings, 'MFA_ISSUER_NAME', 'Blockchain App')
        self.otp_secret_key = getattr(settings, 'OTP_SECRET_KEY', 'blockchain_app_secret_key')
        self.otp_digits = getattr(settings, 'OTP_DIGITS', 6)
        self.otp_interval = getattr(settings, 'OTP_INTERVAL', 30)
    
    def generate_mfa_secret(self, user_id):
        """
        Generate a new MFA secret for a user
        
        Args:
            user_id (str): User ID or wallet address to bind to the secret
            
        Returns:
            str: The generated secret key
        """
        try:
            # Generate a random base32 encoded secret key
            secret = pyotp.random_base32()
            
            # Store the secret in the database
            self._store_secret(user_id, secret)
            
            return secret
        except Exception as e:
            logger.error(f"Error generating MFA secret: {e}")
            raise
    
    def get_mfa_qr(self, user_id, username):
        """
        Generate a QR code for MFA setup
        
        Args:
            user_id (str): User ID or wallet address
            username (str): Username to display in authenticator app
            
        Returns:
            PIL.Image: QR code image
        """
        try:
            # Get the secret from storage
            secret = self._get_secret(user_id)
            
            if not secret:
                # Generate a new secret if not found
                secret = self.generate_mfa_secret(user_id)
            
            # Create a TOTP provisioning URI
            totp = pyotp.TOTP(secret)
            uri = totp.provisioning_uri(name=username, issuer_name=self.issuer_name)
            
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(uri)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            return img
        except Exception as e:
            logger.error(f"Error generating MFA QR code: {e}")
            raise
    
    def generate_backup_codes(self, user, count=10):
        """
        Generate backup codes for a user
        
        Args:
            user (User): User to generate backup codes for
            count (int): Number of backup codes to generate
            
        Returns:
            list: List of generated backup codes
        """
        try:
            # Use the model's method for generating backup codes
            backup_codes = TwoFactorBackupCode.generate_backup_codes(user, count)
            
            # Extract just the codes
            codes = [code.code for code in backup_codes]
            
            return codes
        except Exception as e:
            logger.error(f"Error generating backup codes: {e}")
            raise
    
    def verify_mfa(self, user_id, code):
        """
        Verify a TOTP code
        
        Args:
            user_id (str): User ID or wallet address
            code (str): TOTP code to verify
            
        Returns:
            bool: True if code is valid, False otherwise
        """
        try:
            # Get the secret from storage
            secret = self._get_secret(user_id)
            
            if not secret:
                logger.error(f"No MFA secret found for user {user_id}")
                return False
            
            # Create a TOTP object
            totp = pyotp.TOTP(secret)
            
            # Verify the code with a small window for time drift (1 interval before and after)
            return totp.verify(code, valid_window=1)
        except Exception as e:
            logger.error(f"Error verifying MFA code: {e}")
            return False
    
    def reset_mfa(self, user_id):
        """
        Reset MFA for a user
        
        Args:
            user_id (str): User ID or wallet address
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Remove the secret from storage
            self._remove_secret(user_id)
            
            # Reset the user's 2FA status
            try:
                # Try to find user by ID (assuming user_id is the user's primary key)
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                try:
                    # Try to find user by wallet address
                    user = User.objects.get(wallet_address=user_id)
                except User.DoesNotExist:
                    logger.error(f"User not found for MFA reset: {user_id}")
                    return False
            
            user.two_factor_enabled = False
            user.twofa_secret = None
            user.save(update_fields=['two_factor_enabled', 'twofa_secret'])
            
            # Delete any existing backup codes
            with transaction.atomic():
                TwoFactorBackupCode.objects.filter(user=user).delete()
            
            return True
        except Exception as e:
            logger.error(f"Error resetting MFA: {e}")
            return False
    
    def _store_secret(self, user_id, secret):
        """
        Store a secret for a user
        
        Args:
            user_id (str): User ID or wallet address
            secret (str): Secret to store
        """
        try:
            # Try to find user by ID, handling string IDs properly
            try:
                # Try to convert to integer if it's a numeric string
                user_id_int = int(user_id)
                user = User.objects.get(id=user_id_int)
            except (ValueError, User.DoesNotExist):
                # If not a numeric ID, try by wallet address
                user = User.objects.get(wallet_address=user_id)
        except User.DoesNotExist:
            logger.error(f"User not found for MFA setup: {user_id}")
            return
        
        # Store the secret in the user model
        user.twofa_secret = secret
        user.save(update_fields=['twofa_secret'])
    
    def _get_secret(self, user_id):
        """
        Get a stored secret for a user
        
        Args:
            user_id (str): User ID or wallet address
            
        Returns:
            str: The stored secret key or None if not found
        """
        try:
            # Try to find user by ID, handling string IDs properly
            try:
                # Try to convert to integer if it's a numeric string
                user_id_int = int(user_id)
                user = User.objects.get(id=user_id_int)
            except (ValueError, User.DoesNotExist):
                # If not a numeric ID, try by wallet address
                user = User.objects.get(wallet_address=user_id)
        except User.DoesNotExist:
            logger.error(f"User not found for MFA lookup: {user_id}")
            return None
        
        # Get the secret from the user model
        return user.twofa_secret
    
    def _remove_secret(self, user_id):
        """
        Remove a stored secret for a user
        
        Args:
            user_id (str): User ID or wallet address
        """
        try:
            # Try to find user by ID (assuming user_id is the user's primary key)
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            try:
                # Try to find user by wallet address
                user = User.objects.get(wallet_address=user_id)
            except User.DoesNotExist:
                logger.error(f"User not found for MFA removal: {user_id}")
                return
        
        # Remove the secret from the user model
        user.twofa_secret = None
        user.save(update_fields=['twofa_secret'])