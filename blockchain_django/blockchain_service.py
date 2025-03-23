# blockchain_django/blockchain_service.py
import os
import asyncio
import threading
import logging
import time 

logger = logging.getLogger(__name__)

# Global reference to blockchain instance
_blockchain_instance = None
_blockchain_initialized = False
_initialization_lock = threading.Lock()
_event_loop = None
_service_thread = None

def get_or_create_event_loop():
    """Get the current event loop or create a new one for this thread"""
    try:
        return asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop

def run_blockchain_thread():
    """Run the blockchain service in its own thread with proper event loop handling"""
    global _event_loop
    
    try:
        # Create event loop for this thread
        _event_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_event_loop)
        
        # Return a DummyBlockchain for now to avoid initialization issues
        # We'll update this to use the real blockchain when we fix the initialization issue
        dummy = DummyBlockchain()
        
        # Update global reference
        global _blockchain_instance, _blockchain_initialized
        _blockchain_instance = dummy
        _blockchain_initialized = True
        
        logger.info("Dummy blockchain initialized in background thread")
        
        # Keep the event loop running to handle future tasks
        _event_loop.run_forever()
    except Exception as e:
        logger.error(f"Error in blockchain thread: {e}", exc_info=True)
    finally:
        if _event_loop and not _event_loop.is_closed():
            _event_loop.close()
            logger.info("Blockchain event loop closed")

def initialize_blockchain(wait=True, timeout=30):
    """
    Initialize the blockchain service in a background thread
    
    Args:
        wait: Whether to wait for initialization to complete
        timeout: Maximum time to wait for initialization (in seconds)
        
    Returns:
        bool: Success status
    """
    global _blockchain_initialized, _service_thread
    
    with _initialization_lock:
        if _blockchain_initialized:
            logger.info("Blockchain already initialized")
            return True
            
        if _service_thread and _service_thread.is_alive():
            logger.info("Blockchain initialization already in progress")
            if not wait:
                return False
        else:
            # Start blockchain in a background thread
            _service_thread = threading.Thread(target=run_blockchain_thread, daemon=True)
            _service_thread.start()
            logger.info("Blockchain initialization started in background thread")
    
    # If wait is True, wait for initialization to complete
    if wait:
        start_time = time.time()
        while not _blockchain_initialized and time.time() - start_time < timeout:
            time.sleep(0.1)
            
        if not _blockchain_initialized:
            logger.warning(f"Blockchain initialization timed out after {timeout} seconds")
            return False
    
    return _blockchain_initialized

def get_blockchain():
    """
    Get the global blockchain instance, initializing if needed
    
    Returns:
        Blockchain: The global blockchain instance or a dummy blockchain if initialization failed
    """
    global _blockchain_instance, _blockchain_initialized
    
    if not _blockchain_initialized:
        success = initialize_blockchain(wait=True)
        if not success:
            # Return a dummy blockchain that won't cause crashes
            logger.warning("Returning inactive blockchain instance")
            return DummyBlockchain()
    
    return _blockchain_instance

def execute_async_blockchain_operation(coro, timeout=30):
    """
    Execute an async blockchain operation from a synchronous context
    
    Args:
        coro: Coroutine to execute
        timeout: Maximum time to wait for the operation
        
    Returns:
        Any: The result of the coroutine
    """
    global _event_loop, _blockchain_initialized
    
    if not _blockchain_initialized or not _event_loop:
        success = initialize_blockchain(wait=True)
        if not success:
            raise RuntimeError("Blockchain initialization failed")
    
    # Run the coroutine in the blockchain's event loop
    future = asyncio.run_coroutine_threadsafe(coro, _event_loop)
    
    try:
        return future.result(timeout=timeout)
    except asyncio.TimeoutError:
        logger.error(f"Blockchain operation timed out after {timeout} seconds")
        raise
    except Exception as e:
        logger.error(f"Error in blockchain operation: {e}", exc_info=True)
        raise

class DummyBlockchain:
    """A placeholder blockchain that won't crash wallet info views"""
    def __init__(self):
        self.initialized = True  # Set to True to avoid initialization attempts
        self.listeners = {"new_block": [], "new_transaction": []}
        logger.info("DummyBlockchain created")
        
    async def initialize(self):
        """Dummy initialize method that does nothing"""
        logger.info("DummyBlockchain.initialize called")
        return True
        
    def subscribe(self, event_type, callback):
        """Dummy implementation of subscribe to prevent errors"""
        if event_type not in self.listeners:
            self.listeners[event_type] = []
        
        self.listeners[event_type].append(callback)
        logger.info(f"Added callback to dummy blockchain for {event_type}")
        return True
        
    def unsubscribe(self, event_type, callback):
        """Dummy implementation of unsubscribe"""
        if event_type in self.listeners and callback in self.listeners[event_type]:
            self.listeners[event_type].remove(callback)
            return True
        return False
        
    async def get_wallet(self, address, wallet_passphrase=None):
        return {
            "status": "inactive",
            "message": "Blockchain not fully initialized"
        }
        
    async def get_balance(self, address):
        return 0.0
        
    async def create_wallet(self, user_id=None, wallet_passphrase=None):
        return "dummy_wallet_address"
        
    async def get_transactions_for_address(self, address, limit=50):
        return []
        
    async def create_transaction(self, private_key, sender, recipient, amount, memo=""):
        return {
            "status": "error",
            "message": "Blockchain not initialized"
        }
        
    async def add_transaction_to_mempool(self, transaction):
        return False
        
    async def shutdown(self):
        """Dummy shutdown method that does nothing"""
        logger.info("DummyBlockchain.shutdown called")
        return True

def shutdown_blockchain():
    """Shut down the blockchain service cleanly"""
    global _blockchain_instance, _blockchain_initialized, _event_loop
    
    if not _blockchain_initialized or not _blockchain_instance:
        logger.info("No blockchain instance to shut down")
        return
        
    if _event_loop and not _event_loop.is_closed():
        # Schedule shutdown in the event loop
        try:
            future = asyncio.run_coroutine_threadsafe(
                _blockchain_instance.shutdown(),
                _event_loop
            )
            
            # Wait for shutdown to complete
            future.result(timeout=10)
            
            # Stop the event loop
            _event_loop.call_soon_threadsafe(_event_loop.stop)
            
            logger.info("Blockchain service shut down successfully")
        except Exception as e:
            logger.error(f"Error shutting down blockchain: {e}")
    else:
        logger.info("Event loop already closed, cannot shut down blockchain properly")