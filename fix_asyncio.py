# fix_asyncio.py - Add this to your project root
import asyncio
import functools
import threading
import logging

logger = logging.getLogger(__name__)

# Keep track of event loops by thread
_thread_local = threading.local()

def get_or_create_event_loop():
    """Get the current event loop or create a new one for this thread"""
    # Check if we already have an event loop for this thread
    if not hasattr(_thread_local, 'event_loop'):
        # Create and set a new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        _thread_local.event_loop = loop
        logger.info(f"Created new event loop for thread {threading.current_thread().name}")
    return _thread_local.event_loop

def ensure_event_loop(func):
    """Decorator to ensure an event loop exists before calling an async function"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        loop = get_or_create_event_loop()
        return loop.run_until_complete(func(*args, **kwargs))
    return wrapper

# Add the missing run_async function
def run_async(coroutine, timeout=30):
    """Run an async function from a synchronous context"""
    loop = get_or_create_event_loop()
    return loop.run_until_complete(asyncio.wait_for(coroutine, timeout))

# Monkey patch key blockchain methods that might be called from threads
def patch_blockchain_async_methods():
    try:
        from blockchain.blockchain import Blockchain
        
        # Store original method
        original_create_wallet = Blockchain.create_wallet
        
        # Create wrapper that ensures event loop exists
        @functools.wraps(original_create_wallet)
        async def wrapped_create_wallet(self, user_id=None, wallet_passphrase=None):
            try:
                # Ensure we have an event loop
                if not asyncio._get_running_loop():
                    loop = get_or_create_event_loop()
                    return await asyncio.wait_for(original_create_wallet(self, user_id, wallet_passphrase), 30)
                return await original_create_wallet(self, user_id, wallet_passphrase)
            except Exception as e:
                logger.error(f"Error in wrapped create_wallet: {e}")
                raise
        
        # Apply the patch
        Blockchain.create_wallet = wrapped_create_wallet
        logger.info("Successfully patched Blockchain.create_wallet method")
        
        # Patch other async methods that might be called from threads
        # (Add more methods as needed)
        
    except (ImportError, AttributeError) as e:
        logger.error(f"Failed to patch blockchain async methods: {e}")

# Run the patches
patch_blockchain_async_methods()
logger.info("Asyncio fixes applied")