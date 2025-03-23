# blockchain_django/wallet_service.py

import asyncio
import threading
import logging
import time
from typing import Optional, Dict, List
import importlib

logger = logging.getLogger(__name__)

class WalletService:
    """
    A service for handling wallet operations that properly bridges
    async/sync boundaries in Django with improved thread safety.
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
        self._shutting_down = False
        self._initialization_lock = threading.Lock()
        
    def start(self):
        """Start the wallet service in a background thread with proper initialization checks"""
        with self._initialization_lock:
            if self._initialized:
                logger.info("Wallet service already initialized")
                return
                
            if self._thread and self._thread.is_alive():
                logger.info("Wallet service thread already running")
                return
                
            self._thread = threading.Thread(target=self._run_service_thread, daemon=True)
            self._thread.start()
            logger.info("Wallet service started in background thread")
            
            # Wait for initialization to complete with timeout
            start_time = time.time()
            while not self._initialized and time.time() - start_time < 30:
                time.sleep(0.1)
                
            if not self._initialized:
                logger.warning("Wallet service initialization timed out")
        
    def _run_service_thread(self):
        """Run the wallet service in a dedicated thread with proper error handling"""
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
        """Initialize the blockchain instance with proper error handling"""
        try:
            # Dynamically import the blockchain to avoid circular imports
            blockchain_module = importlib.import_module('blockchain.blockchain')
            Blockchain = blockchain_module.Blockchain
            
            # Create a blockchain instance with proper data directory
            import os
            data_dir = os.path.join(os.getcwd(), 'blockchain_data', 'wallet_service')
            os.makedirs(data_dir, exist_ok=True)
            
            self._blockchain = Blockchain(
                storage_path=os.path.join(data_dir, 'chain.db'), 
                node_id=self.node_id
            )
            await self._blockchain.initialize()
            
            # Set initialized flag
            self._initialized = True
            logger.info("Wallet service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize wallet service: {e}", exc_info=True)
            
    def create_wallet(self, user_id: str = None, wallet_passphrase: str = None, timeout=30) -> Optional[str]:
        """
        Create a new wallet (synchronous interface) with proper timeout and error handling
        
        Args:
            user_id: Optional user ID to associate with the wallet
            wallet_passphrase: Passphrase to encrypt the wallet
            timeout: Maximum time to wait for operation
            
        Returns:
            str: Wallet address or None if operation fails
        """
        if self._shutting_down:
            raise RuntimeError("Wallet service is shutting down")
            
        # Auto-start if not initialized
        if not self._initialized:
            logger.info("Auto-starting wallet service")
            self.start()
            
            # Wait for initialization with timeout
            start_time = time.time()
            while not self._initialized and time.time() - start_time < timeout:
                time.sleep(0.1)
                
            if not self._initialized:
                raise RuntimeError("Wallet service initialization timed out")
        
        # Use a synchronous approach with Future to get the result from the async operation
        future = asyncio.run_coroutine_threadsafe(
            self._blockchain.create_wallet(user_id=user_id, wallet_passphrase=wallet_passphrase), 
            self._loop
        )
        try:
            return future.result(timeout=timeout)
        except asyncio.TimeoutError:
            logger.error(f"Timeout creating wallet after {timeout} seconds")
            return None
        except Exception as e:
            logger.error(f"Error creating wallet: {e}", exc_info=True)
            raise
    
    def get_balance(self, address: str, timeout=10) -> float:
        """
        Get wallet balance (synchronous interface) with proper timeout
        
        Args:
            address: Wallet address to check
            timeout: Maximum time to wait for operation
            
        Returns:
            float: Wallet balance
        """
        if self._shutting_down:
            raise RuntimeError("Wallet service is shutting down")
            
        if not self._initialized:
            raise RuntimeError("Wallet service not initialized")
            
        future = asyncio.run_coroutine_threadsafe(
            self._blockchain.get_balance(address), 
            self._loop
        )
        try:
            return future.result(timeout=timeout)
        except asyncio.TimeoutError:
            logger.error(f"Timeout getting balance for {address} after {timeout} seconds")
            return 0.0
        except Exception as e:
            logger.error(f"Error getting balance for {address}: {e}", exc_info=True)
            return 0.0
    
    def send_transaction(self, sender: str, recipient: str, amount: float, 
                           private_key: str = None, wallet_passphrase: str = None, 
                           memo: str = "", timeout=30):
        """
        Send a transaction (synchronous interface) with proper error handling
        
        Args:
            sender: Sender wallet address
            recipient: Recipient wallet address
            amount: Amount to send
            private_key: Optional private key for signing (if wallet not in keystore)
            wallet_passphrase: Optional passphrase to decrypt wallet (if in keystore)
            memo: Optional transaction memo
            timeout: Maximum time to wait for operation
            
        Returns:
            dict: Transaction details if successful
        """
        if self._shutting_down:
            raise RuntimeError("Wallet service is shutting down")
            
        if not self._initialized:
            raise RuntimeError("Wallet service not initialized")
        
        # Prepare the coroutine based on available credentials
        if private_key:
            # If private key is provided directly
            coro = self._blockchain.create_transaction(
                private_key=private_key,
                sender=sender,
                recipient=recipient,
                amount=amount,
                memo=memo
            )
        elif wallet_passphrase:
            # If wallet passphrase is provided to decrypt from keystore
            coro = self._send_with_passphrase(
                sender=sender,
                recipient=recipient,
                amount=amount,
                wallet_passphrase=wallet_passphrase,
                memo=memo
            )
        else:
            raise ValueError("Either private_key or wallet_passphrase must be provided")
            
        # Execute the coroutine in the event loop
        future = asyncio.run_coroutine_threadsafe(coro, self._loop)
        try:
            tx = future.result(timeout=timeout)
            
            # Add to mempool
            add_future = asyncio.run_coroutine_threadsafe(
                self._blockchain.add_transaction_to_mempool(tx),
                self._loop
            )
            success = add_future.result(timeout=timeout)
            
            if success:
                return {
                    'tx_id': tx.tx_id,
                    'sender': sender,
                    'recipient': recipient,
                    'amount': amount,
                    'timestamp': tx.timestamp,
                    'success': True
                }
            else:
                raise RuntimeError("Transaction rejected by mempool")
        except asyncio.TimeoutError:
            logger.error(f"Timeout sending transaction after {timeout} seconds")
            raise
        except Exception as e:
            logger.error(f"Error sending transaction: {e}", exc_info=True)
            raise
    
    async def _send_with_passphrase(self, sender, recipient, amount, wallet_passphrase, memo):
        """Helper method to send transaction using wallet passphrase"""
        # Get wallet using passphrase
        wallet = await self._blockchain.get_wallet(sender, wallet_passphrase)
        if not wallet:
            raise ValueError(f"Wallet not found or incorrect passphrase for {sender}")
            
        # Create transaction using private key from wallet
        return await self._blockchain.create_transaction(
            private_key=wallet['private_key'],
            sender=sender,
            recipient=recipient,
            amount=amount,
            memo=memo
        )
    
    def get_transactions(self, address: str, limit: int = 50, timeout=20):
        """
        Get transaction history for an address (synchronous interface)
        
        Args:
            address: Wallet address
            limit: Maximum number of transactions to return
            timeout: Maximum time to wait for operation
            
        Returns:
            list: Transaction history
        """
        if self._shutting_down:
            raise RuntimeError("Wallet service is shutting down")
            
        if not self._initialized:
            raise RuntimeError("Wallet service not initialized")
            
        future = asyncio.run_coroutine_threadsafe(
            self._blockchain.get_transactions_for_address(address, limit),
            self._loop
        )
        try:
            return future.result(timeout=timeout)
        except asyncio.TimeoutError:
            logger.error(f"Timeout getting transactions for {address} after {timeout} seconds")
            return []
        except Exception as e:
            logger.error(f"Error getting transactions for {address}: {e}", exc_info=True)
            return []
    
    def shutdown(self):
        """Shutdown the wallet service cleanly"""
        self._shutting_down = True
        
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