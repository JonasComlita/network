# blockchain_django/wallet_service.py
import asyncio
import logging
from typing import Optional, Dict, Any
import concurrent.futures

logger = logging.getLogger(__name__)

class WalletService:
    """
    Enhanced service for managing blockchain wallets with improved reliability
    and error handling for the registration process.
    """
    
    def __init__(self):
        self._blockchain = None
        self._initialized = False
        self._executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)
        self._initialization_lock = asyncio.Lock()
        
    async def initialize(self):
        """Initialize the wallet service safely"""
        if self._initialized:
            return True
            
        async with self._initialization_lock:
            if self._initialized:
                return True
                
            try:
                # Dynamically import blockchain to avoid circular imports
                from blockchain_django.blockchain_service import get_blockchain
                
                # Get the blockchain instance
                self._blockchain = get_blockchain()
                
                # Initialize if needed
                if not getattr(self._blockchain, 'initialized', False):
                    await self._blockchain.initialize()
                    
                self._initialized = True
                logger.info("Enhanced wallet service initialized successfully")
                return True
            except Exception as e:
                logger.error(f"Failed to initialize wallet service: {e}", exc_info=True)
                return False
    
    async def create_wallet(self, user_id: str, wallet_passphrase: str) -> Optional[str]:
        """
        Create a new wallet with the provided passphrase.
        
        Args:
            user_id: The user ID to associate with the wallet
            wallet_passphrase: The passphrase to secure the wallet
            
        Returns:
            str: The wallet address if successful, None otherwise
        """
        # Ensure service is initialized
        if not self._initialized:
            success = await self.initialize()
            if not success:
                logger.error("Failed to initialize wallet service")
                return None
        
        try:
            # Create the wallet with a timeout
            wallet_address = await asyncio.wait_for(
                self._blockchain.create_wallet(
                    user_id=user_id,
                    wallet_passphrase=wallet_passphrase
                ),
                timeout=15.0  # 15 second timeout
            )
            
            if wallet_address:
                logger.info(f"Created wallet {wallet_address} for user {user_id}")
                return wallet_address
            else:
                logger.error(f"Failed to create wallet for user {user_id}")
                return None
        except asyncio.TimeoutError:
            logger.error(f"Wallet creation timed out for user {user_id}")
            return None
        except Exception as e:
            logger.error(f"Error creating wallet for user {user_id}: {e}", exc_info=True)
            return None
    
    async def get_wallet(self, address: str, wallet_passphrase: str) -> Optional[Dict[str, Any]]:
        """
        Get a wallet with the provided address and passphrase.
        
        Args:
            address: The wallet address
            wallet_passphrase: The passphrase to decrypt the wallet
            
        Returns:
            dict: The wallet data if successful, None otherwise
        """
        if not self._initialized:
            success = await self.initialize()
            if not success:
                return None
        
        try:
            wallet = await asyncio.wait_for(
                self._blockchain.get_wallet(address, wallet_passphrase),
                timeout=10.0
            )
            return wallet
        except Exception as e:
            logger.error(f"Error getting wallet {address}: {e}")
            return None
    
    async def get_balance(self, address: str) -> float:
        """
        Get wallet balance for the provided address.
        
        Args:
            address: The wallet address
            
        Returns:
            float: The wallet balance
        """
        if not self._initialized:
            success = await self.initialize()
            if not success:
                return 0.0
        
        try:
            balance = await asyncio.wait_for(
                self._blockchain.get_balance(address),
                timeout=10.0
            )
            return float(balance)
        except Exception as e:
            logger.error(f"Error getting balance for {address}: {e}")
            return 0.0
    
    def create_wallet_sync(self, user_id: str, wallet_passphrase: str) -> Optional[str]:
        """
        Synchronous version of create_wallet for use in Django views.
        
        Args:
            user_id: The user ID to associate with the wallet
            wallet_passphrase: The passphrase to secure the wallet
            
        Returns:
            str: The wallet address if successful, None otherwise
        """
        try:
            # Create a new event loop for this thread if needed
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Initialize if needed
            if not self._initialized:
                init_future = asyncio.run_coroutine_threadsafe(
                    self.initialize(),
                    loop
                )
                init_success = init_future.result(timeout=15)
                
                if not init_success:
                    logger.error("Failed to initialize wallet service")
                    return None
            
            # Create wallet
            wallet_future = asyncio.run_coroutine_threadsafe(
                self.create_wallet(user_id, wallet_passphrase),
                loop
            )
            
            # Wait for result with timeout
            return wallet_future.result(timeout=15)
        except Exception as e:
            logger.error(f"Error in create_wallet_sync: {e}", exc_info=True)
            return None

# Create a singleton instance
wallet_service = WalletService()