from django.core.management.base import BaseCommand
from blockchain.services import fetch_price_data
from blockchain.models import Notification, CustomUser

class Command(BaseCommand):
    help = 'Check for price changes and notify users'

    def handle(self, *args, **kwargs):
        current_price = fetch_price_data().get('bitcoin', {}).get('usd', 0)
        # Logic to compare with previous price and notify users
        for user in CustomUser.objects.all():
            # Check user's previous price and compare
            # If price has changed, create a notification
            Notification.objects.create(user=user, message=f"Bitcoin price changed to ${current_price}")
