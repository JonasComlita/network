# blockchain_django/wallet_manager.py

import asyncio
import logging
import threading
from blockchain.blockchain import Blockchain
from django.conf import settings

logger = logging.getLogger(__name__)

class WalletManager:
    """
    Service class to handle wallet operations with proper thread and event loop management.
    This avoids the "no running event loop" errors when working with Django.
    """
    
    def __init__(self):
        self.blockchain = None
        self._initialization_lock = threading.Lock()
        self._is_initialized = False
    
    def _get_event_loop_in_thread(self):
        """Get or create an event loop in the current thread"""
        try:
            return asyncio.get_event_loop()
        except RuntimeError:
            # If there's no event loop in this thread, create a new one
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            return loop
    
    def _ensure_blockchain_initialized(self):
        """Initialize blockchain in a thread-safe way"""
        if self._is_initialized:
            return

        with self._initialization_lock:
            if not self._is_initialized:
                self.blockchain = Blockchain(node_id="wallet-service")
                
                # Initialize the blockchain in a new event loop
                loop = self._get_event_loop_in_thread()
                loop.run_until_complete(self.blockchain.initialize())
                
                self._is_initialized = True
                logger.info("Wallet manager blockchain initialized")
    
    def create_wallet(self):
        """Create a new wallet synchronously"""
        try:
            self._ensure_blockchain_initialized()
            
            # Create a new event loop for this thread if necessary
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
            # Run the async operation in this thread's event loop
            wallet_address = loop.run_until_complete(self.blockchain.create_wallet())
            
            return wallet_address
        except Exception as e:
            logger.error(f"Error creating wallet: {e}")
            raise
        
    def get_balance(self, address):
        """Get wallet balance synchronously"""
        try:
            self._ensure_blockchain_initialized()
            
            loop = self._get_event_loop_in_thread()
            balance = loop.run_until_complete(self.blockchain.get_balance(address))
            
            return balance
        except Exception as e:
            logger.error(f"Error getting balance for {address}: {e}")
            raise
    
    def send_transaction(self, sender, recipient, amount, memo=""):
        """Send a transaction synchronously"""
        try:
            self._ensure_blockchain_initialized()
            
            loop = self._get_event_loop_in_thread()
            tx = loop.run_until_complete(
                self.blockchain.send_transaction(
                    sender=sender,
                    recipient=recipient,
                    amount=amount,
                    memo=memo
                )
            )
            
            return tx
        except Exception as e:
            logger.error(f"Error sending transaction: {e}")
            raise

# Create a singleton instance
wallet_manager = WalletManager()