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

        try:
            # Initialize blockchain service
            from .blockchain_service import initialize_blockchain
            
            # Check if we have a channel layer with an event loop
            channel_layer = get_channel_layer()
            if channel_layer and hasattr(channel_layer, 'loop'):
                loop = channel_layer.loop
                loop.create_task(initialize_blockchain())
                logger.info("Scheduled blockchain initialization")
            else:
                # Create a separate event loop for blockchain initialization
                async def init_blockchain():
                    try:
                        await initialize_blockchain()
                        logger.info("Blockchain initialized in separate event loop")
                    except Exception as e:
                        logger.error(f"Blockchain initialization failed: {e}", exc_info=True)
                
                # Run in an event loop
                try:
                    loop = asyncio.get_event_loop()
                except RuntimeError:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                
                # Run the initialization in background or run it synchronously
                try:
                    if loop.is_running():
                        loop.create_task(init_blockchain())
                    else:
                        loop.run_until_complete(init_blockchain())
                except Exception as e:
                    logger.error(f"Error running blockchain initialization: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Failed to initialize blockchain service: {e}", exc_info=True)

        # Initialize wallet service
        try:
            from .wallet_service import wallet_service
            wallet_service.start()
            logger.info("Wallet service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize wallet service: {e}", exc_info=True)

        logger.info("Blockchain Django app initialization completed")