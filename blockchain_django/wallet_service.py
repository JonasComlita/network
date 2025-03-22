# blockchain_django/wallet_service.py

import asyncio
import threading
import logging
import subprocess
import os
import json
import time
from typing import Optional, Dict, List
import importlib

logger = logging.getLogger(__name__)

class WalletService:
    """
    A service for handling wallet operations that properly bridges
    async/sync boundaries in Django.
    """
    _instance = None
    _lock = threading.Lock()
    
    @classmethod
    def get_instance(cls):
        """Get the singleton instance of WalletService"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        """Initialize the wallet service"""
        self.node_id = f"wallet-service-{int(time.time())}"
        self._loop = None
        self._thread = None
        self._initialized = False
        self._blockchain = None
        
    def start(self):
        """Start the wallet service in a background thread"""
        if self._thread and self._thread.is_alive():
            logger.info("Wallet service already running")
            return
            
        self._thread = threading.Thread(target=self._run_service_thread, daemon=True)
        self._thread.start()
        logger.info("Wallet service started in background thread")
        
        # Wait for initialization to complete
        start_time = time.time()
        while not self._initialized and time.time() - start_time < 30:
            time.sleep(0.1)
            
        if not self._initialized:
            logger.warning("Wallet service initialization timed out")
        
    def _run_service_thread(self):
        """Run the wallet service in a dedicated thread"""
        try:
            # Create a new event loop for this thread
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)
            
            # Run the initialization
            self._loop.run_until_complete(self._initialize())
            
            # Run the event loop to handle async tasks
            self._loop.run_forever()
        except Exception as e:
            logger.error(f"Error in wallet service thread: {e}", exc_info=True)
        finally:
            if self._loop and not self._loop.is_closed():
                self._loop.close()
                logger.info("Wallet service event loop closed")
                
    async def _initialize(self):
        """Initialize the blockchain instance"""
        try:
            # Dynamically import the blockchain to avoid circular imports
            blockchain_module = importlib.import_module('blockchain.blockchain')
            Blockchain = blockchain_module.Blockchain
            
            # Create a blockchain instance
            self._blockchain = Blockchain(node_id=self.node_id)
            await self._blockchain.initialize()
            
            # Set initialized flag
            self._initialized = True
            logger.info("Wallet service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize wallet service: {e}", exc_info=True)
            
    def create_wallet(self, timeout=30) -> Optional[str]:
        """Create a new wallet (synchronous interface)"""
        if not self._initialized or not self._blockchain:
            if not self._initialized:
                logger.warning("Wallet service not initialized yet, starting...")
                self.start()
                # Wait for initialization
                start_time = time.time()
                while not self._initialized and time.time() - start_time < timeout:
                    time.sleep(0.1)
                if not self._initialized:
                    raise RuntimeError("Wallet service initialization timed out")
            else:
                raise RuntimeError("Blockchain not initialized in wallet service")
        
        # Use a synchronous approach with Future to get the result from the async operation
        future = asyncio.run_coroutine_threadsafe(self._blockchain.create_wallet(), self._loop)
        try:
            return future.result(timeout=timeout)
        except Exception as e:
            logger.error(f"Error creating wallet: {e}", exc_info=True)
            raise
    
    def get_balance(self, address: str, timeout=10) -> float:
        """Get wallet balance (synchronous interface)"""
        if not self._initialized or not self._blockchain:
            raise RuntimeError("Wallet service not initialized")
            
        future = asyncio.run_coroutine_threadsafe(self._blockchain.get_balance(address), self._loop)
        try:
            return future.result(timeout=timeout)
        except Exception as e:
            logger.error(f"Error getting balance for {address}: {e}", exc_info=True)
            raise
    
    def send_transaction(self, sender: str, recipient: str, amount: float, memo: str = "", timeout=30):
        """Send a transaction (synchronous interface)"""
        if not self._initialized or not self._blockchain:
            raise RuntimeError("Wallet service not initialized")
            
        future = asyncio.run_coroutine_threadsafe(
            self._blockchain.send_transaction(sender, recipient, amount, memo), 
            self._loop
        )
        try:
            return future.result(timeout=timeout)
        except Exception as e:
            logger.error(f"Error sending transaction: {e}", exc_info=True)
            raise
    
    def shutdown(self):
        """Shutdown the wallet service"""
        if self._loop and not self._loop.is_closed():
            future = asyncio.run_coroutine_threadsafe(self._stop_service(), self._loop)
            try:
                future.result(timeout=10)
            except Exception as e:
                logger.error(f"Error shutting down wallet service: {e}", exc_info=True)
                
    async def _stop_service(self):
        """Stop the service cleanly"""
        if self._blockchain:
            await self._blockchain.shutdown()
        
        # Stop the event loop
        self._loop.stop()

# Create a global instance
wallet_service = WalletService.get_instance()

# Import this in your Django startup (e.g., AppConfig.ready())
def initialize_wallet_service():
    """Initialize the wallet service at Django startup"""
    wallet_service.start()
    logger.info("Wallet service initialization requested")