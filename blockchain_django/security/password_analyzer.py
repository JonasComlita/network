# blockchain_django/security/password_analyzer.py
import logging
import re
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import check_password

logger = logging.getLogger(__name__)

def analyze_password_strength(user):
    """
    Analyze a user's password strength based on various criteria and heuristics.
    Since we don't have access to the plaintext password, this is an approximation
    based on when the password was set and if the password has been checked against
    known breached passwords during account creation.
    
    Args:
        user: User object
        
    Returns:
        str: Password strength classification ('weak', 'medium', 'strong')
    """
    # Start with a default assumption
    strength = 'medium'
    
    # Check how recently the password was set
    if user.last_password_change:
        days_since_change = (timezone.now() - user.last_password_change).days
        
        if days_since_change > 180:  # More than 6 months old
            strength = 'weak'  # Downgrade to weak if password is old
    else:
        # No record of password change, assume it's the original password from registration
        account_age = (timezone.now() - user.date_joined).days
        if account_age > 180:  # Account older than 6 months
            strength = 'weak'  # Downgrade if original password is old
    
    # Check for recent login failures (which might indicate password guessing)
    if user.failed_login_attempts > 3:
        strength = 'weak'  # High number of failed attempts might indicate simple password
    
    # If the user has 2FA enabled, it's a good security practice
    if user.two_factor_enabled:
        if strength == 'weak':
            strength = 'medium'  # Upgrade weak to medium
        else:
            strength = 'strong'  # Upgrade medium to strong
    
    # If the user has changed their password recently, that's also good
    if user.last_password_change and (timezone.now() - user.last_password_change).days < 30:
        if strength == 'weak':
            strength = 'medium'  # Upgrade weak to medium
    
    return strength

def is_password_compromised(password):
    """
    Check if a password is compromised using the 'Have I Been Pwned' API
    
    Args:
        password (str): Password to check
        
    Returns:
        bool: True if compromised, False otherwise
    """
    import hashlib
    import requests
    
    # Hash the password with SHA-1
    password_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    
    # We'll use the k-anonymity model: send first 5 chars of hash
    hash_prefix = password_hash[:5]
    hash_suffix = password_hash[5:]
    
    try:
        # Query the API
        response = requests.get(f"https://api.pwnedpasswords.com/range/{hash_prefix}")
        
        if response.status_code == 200:
            # Check if our hash suffix is in the response
            hashes = response.text.splitlines()
            for h in hashes:
                if hash_suffix in h.split(':')[0]:
                    return True
    except Exception as e:
        logger.error(f"Error checking compromised password: {e}")
    
    return False

def check_password_against_user_info(password, user):
    """
    Check if password contains user information
    
    Args:
        password (str): Password to check
        user: User object
        
    Returns:
        bool: True if password contains user info, False otherwise
    """
    # Convert password to lowercase for case-insensitive comparison
    password_lower = password.lower()
    
    # Get user attributes to check against
    attributes = [
        user.username.lower(),
        user.email.lower().split('@')[0],  # Email username part
    ]
    
    # Add first and last name if available
    if hasattr(user, 'first_name') and user.first_name:
        attributes.append(user.first_name.lower())
    if hasattr(user, 'last_name') and user.last_name:
        attributes.append(user.last_name.lower())
    
    # Check if any attributes are in the password
    for attr in attributes:
        if len(attr) >= 3 and attr in password_lower:
            return True
    
    return False

def validate_password_strength(password):
    """
    Validate password strength based on various criteria
    
    Args:
        password (str): Password to validate
        
    Returns:
        (bool, str): (valid, message) tuple where valid is True if password
                     is strong enough, and message explains any issues
    """
    # Check length
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    # Check for common patterns
    common_patterns = [
        r'123456',
        r'qwerty',
        r'password',
        r'admin',
        r'welcome',
        r'abc123',
    ]
    
    for pattern in common_patterns:
        if re.search(pattern, password.lower()):
            return False, "Password contains a common pattern"
    
    # Check character variety
    has_uppercase = bool(re.search(r'[A-Z]', password))
    has_lowercase = bool(re.search(r'[a-z]', password))
    has_digit = bool(re.search(r'\d', password))
    has_special = bool(re.search(r'[^A-Za-z0-9]', password))
    
    variety_count = sum([has_uppercase, has_lowercase, has_digit, has_special])
    
    if variety_count < 3:
        return False, ("Password must contain at least three of the following: "
                      "uppercase letters, lowercase letters, digits, and special characters")
    
    # If we get here, password is valid
    return True, "Password meets strength requirements"