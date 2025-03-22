# blockchain_django/blockchain_service.py
import os
import asyncio
import threading
import logging
from blockchain.blockchain import Blockchain

logger = logging.getLogger(__name__)

# Global reference to blockchain instance
_blockchain_instance = None
_blockchain_initialized = False
_initialization_lock = threading.Lock()

def initialize_blockchain():
    global _blockchain_instance, _blockchain_initialized
    with _initialization_lock:
        if _blockchain_initialized:
            return True
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            # No wallet_password needed for initialization
            _blockchain_instance = Blockchain(node_id="main_node")
            loop.run_until_complete(_blockchain_instance.initialize())
            _blockchain_initialized = True
            logger.info("Blockchain initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize blockchain: {e}")
            return False
        finally:
            loop.close()

def get_blockchain():
    """Get the global blockchain instance, initializing if needed"""
    global _blockchain_instance, _blockchain_initialized
    
    if not _blockchain_initialized:
        success = initialize_blockchain()
        if not success:
            # Instead of raising an exception, return a dummy blockchain
            # for wallet info endpoints that won't cause crashes
            logger.warning("Returning inactive blockchain instance")
            return DummyBlockchain()
    
    return _blockchain_instance

class DummyBlockchain:
    """A placeholder blockchain that won't crash wallet info views"""
    def __init__(self):
        self.initialized = False
        
    async def get_wallet(self, address):
        return {
            "status": "inactive",
            "message": "Blockchain not fully initialized"
        }