# blockchain_django/apps.py
from django.apps import AppConfig
import logging
import asyncio
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

class BlockchainDjangoConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'blockchain_django'

    def ready(self):
        """Initialize services when Django starts."""
        import os
        if os.environ.get('RUN_MAIN', None) != 'true':
            return

        # Initialize blockchain service
        from .blockchain_service import initialize_blockchain
        channel_layer = get_channel_layer()
        if channel_layer and hasattr(channel_layer, 'loop'):
            loop = channel_layer.loop
            loop.create_task(initialize_blockchain())
            logger.info("Scheduled blockchain initialization")
        else:
            logger.error("Channel layer not available or no event loop found")

        # Initialize wallet service
        try:
            from .wallet_service import wallet_service
            wallet_service.start()
            logger.info("Wallet service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize wallet service: {e}", exc_info=True)

        logger.info("All blockchain services initialized")