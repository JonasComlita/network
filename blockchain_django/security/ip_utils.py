# blockchain_django/security/ip_utils.py
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

def get_client_ip(request):
    """
    Get the client IP address from the request
    
    Args:
        request: HttpRequest object
        
    Returns:
        str: IP address or None if not found
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # If behind a proxy, get the real IP
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    
    return ip

def get_location_from_ip(ip_address):
    """
    Get location information from an IP address
    
    Args:
        ip_address (str): IP address to look up
        
    Returns:
        str: Location information (City, Country) or empty string if not found
    """
    if not ip_address:
        return ""
    
    # Skip lookup for local/private IPs
    if ip_address in ('127.0.0.1', 'localhost', '::1') or ip_address.startswith(('10.', '172.16.', '192.168.')):
        return "Local Network"
    
    # Try to use a geolocation API
    geolocation_api_key = getattr(settings, 'GEOLOCATION_API_KEY', None)
    
    if not geolocation_api_key:
        # No API key available, return empty string
        return ""
    
    try:
        # Using ipstack.com as an example, replace with your preferred provider
        response = requests.get(
            f"http://api.ipstack.com/{ip_address}",
            params={
                "access_key": geolocation_api_key,
                "fields": "city,country_name",
                "output": "json"
            },
            timeout=3  # Short timeout to avoid slowing down the request
        )
        
        if response.status_code == 200:
            data = response.json()
            city = data.get('city', '')
            country = data.get('country_name', '')
            
            if city and country:
                return f"{city}, {country}"
            elif country:
                return country
    except Exception as e:
        logger.error(f"Error getting location from IP: {e}")
    
    # Return empty string if lookup fails
    return ""

def is_suspicious_ip(ip_address, user):
    """
    Check if an IP address is suspicious for a user
    (e.g., different from their usual login location)
    
    Args:
        ip_address (str): IP address to check
        user: User object
        
    Returns:
        bool: True if suspicious, False otherwise
    """
    if not ip_address or not user:
        return False
    
    from blockchain_django.models import LoginHistory
    
    # Skip check for local/private IPs
    if ip_address in ('127.0.0.1', 'localhost', '::1') or ip_address.startswith(('10.', '172.16.', '192.168.')):
        return False
    
    # Compare with user's last login IP
    if user.last_login_ip and user.last_login_ip != ip_address:
        # Check login history to see if this IP has been used before
        has_previous_login = LoginHistory.objects.filter(
            user=user,
            ip_address=ip_address,
            successful=True
        ).exists()
        
        # If no previous successful login from this IP, mark as suspicious
        if not has_previous_login:
            return True
    
    return False