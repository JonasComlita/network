from celery import shared_task
from django.contrib.auth.models import User
from .models import PriceChangeNotification
from .external_api import get_current_price  # Assume this function fetches the current price

@shared_task
def check_price_changes():
    threshold = 0.01  # Define your threshold value here
    current_price = get_current_price()
    last_known_price = ...  # Fetch from your database or cache

    if abs(current_price - last_known_price) > threshold:
        # Notify all users
        for user in User.objects.all():
            PriceChangeNotification.objects.create(user=user, price_change=current_price - last_known_price)
