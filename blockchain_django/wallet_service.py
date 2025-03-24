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
                from blockchain_service import get_blockchain
                
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

# blockchain_django/services/wallet_service.py
import logging
import asyncio
import time
from typing import Dict, List, Optional
from django.db import transaction
from django.utils import timezone
from django.conf import settings

from blockchain_django.models import CustomUser, UserWallet, WalletBackup
from blockchain_django.blockchain_service import get_blockchain

logger = logging.getLogger(__name__)

class MultiWalletService:
    """Service for managing multiple wallets per user"""
    
    def __init__(self):
        self._blockchain = None
        self._initialized = False
        
    async def _ensure_blockchain(self):
        """Get the blockchain instance, initializing if needed"""
        if not self._initialized:
            self._blockchain = get_blockchain()
            
            if not getattr(self._blockchain, 'initialized', False):
                await self._blockchain.initialize()
                
            self._initialized = True
            
        return self._blockchain
        
    async def create_wallet(self, user, wallet_name, wallet_passphrase):
        """
        Create a new wallet for the user
        
        Args:
            user (CustomUser): The user to create a wallet for
            wallet_name (str): A name for the wallet
            wallet_passphrase (str): The passphrase to secure the wallet
            
        Returns:
            UserWallet or None: The created wallet object if successful, None otherwise
        """
        try:
            # Get blockchain instance
            blockchain = await self._ensure_blockchain()
            
            # Create wallet on blockchain
            wallet_address = await blockchain.create_wallet(
                user_id=str(user.id), 
                wallet_passphrase=wallet_passphrase
            )
            
            if not wallet_address:
                logger.error(f"Failed to create wallet for user {user.id}")
                return None
                
            # Create wallet record in database
            primary = not UserWallet.objects.filter(user=user).exists()
            
            # Use transaction to ensure data consistency
            with transaction.atomic():
                wallet = UserWallet.objects.create(
                    user=user,
                    wallet_address=wallet_address,
                    wallet_name=wallet_name,
                    is_primary=primary,
                    is_active=True,
                    balance=0,
                    created_at=timezone.now()
                )
                
                # If this is the first wallet or the user doesn't have a wallet on their profile,
                # update the user's primary wallet address
                if primary or not user.wallet_address:
                    user.wallet_address = wallet_address
                    user.is_wallet_active = True
                    user.save(update_fields=['wallet_address', 'is_wallet_active'])
                    
            logger.info(f"Created wallet {wallet_address} for user {user.username}")
            return wallet
            
        except Exception as e:
            logger.error(f"Error creating wallet: {e}")
            return None
            
    async def get_wallet_details(self, wallet_address, wallet_passphrase):
        """
        Get detailed wallet information from blockchain
        
        Args:
            wallet_address (str): The wallet address
            wallet_passphrase (str): The wallet passphrase
            
        Returns:
            dict: Wallet details if successful, None otherwise
        """
        try:
            blockchain = await self._ensure_blockchain()
            
            # Get wallet details from blockchain
            wallet_data = await blockchain.get_wallet(wallet_address, wallet_passphrase)
            
            return wallet_data
        except Exception as e:
            logger.error(f"Error getting wallet details for {wallet_address}: {e}")
            return None
            
    async def get_user_wallets(self, user):
        """
        Get all wallets for a user with updated balances
        
        Args:
            user (CustomUser): The user to get wallets for
            
        Returns:
            list: List of wallet objects with updated balances
        """
        try:
            # Get wallet objects from database
            wallets = UserWallet.objects.filter(user=user).order_by('-is_primary', '-created_at')
            
            # Update balances in background tasks
            update_tasks = []
            for wallet in wallets:
                update_tasks.append(self.update_wallet_balance(wallet))
                
            # Run balance updates concurrently
            if update_tasks:
                await asyncio.gather(*update_tasks)
                
            # Refresh the queryset to get updated balances
            wallets = UserWallet.objects.filter(user=user).order_by('-is_primary', '-created_at')
            return wallets
            
        except Exception as e:
            logger.error(f"Error getting wallets for user {user.id}: {e}")
            return []
            
    async def update_wallet_balance(self, wallet):
        """
        Update wallet balance from blockchain
        
        Args:
            wallet (UserWallet): The wallet to update
            
        Returns:
            bool: True if update was successful, False otherwise
        """
        try:
            blockchain = await self._ensure_blockchain()
            
            # Get balance from blockchain
            balance = await blockchain.get_balance(wallet.wallet_address)
            
            # Update wallet balance
            if balance is not None:
                wallet.balance = balance
                wallet.save(update_fields=['balance'])
                
                # If this is the primary wallet, also update user's balance
                if wallet.is_primary:
                    user = wallet.user
                    user.wallet_balance = balance
                    user.save(update_fields=['wallet_balance'])
                
                return True
            return False
                
        except Exception as e:
            logger.error(f"Error updating balance for wallet {wallet.wallet_address}: {e}")
            return False
            
    async def set_primary_wallet(self, user, wallet_address):
        """
        Set a wallet as the primary wallet for a user
        
        Args:
            user (CustomUser): The user
            wallet_address (str): The wallet address to set as primary
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Find the wallet
            wallet = UserWallet.objects.get(user=user, wallet_address=wallet_address)
            
            # Use transaction to ensure data consistency
            with transaction.atomic():
                # Set all user's wallets as non-primary
                UserWallet.objects.filter(user=user).update(is_primary=False)
                
                # Set this wallet as primary
                wallet.is_primary = True
                wallet.save(update_fields=['is_primary'])
                
                # Update user's primary wallet address
                user.wallet_address = wallet_address
                user.save(update_fields=['wallet_address'])
                
            return True
        except UserWallet.DoesNotExist:
            logger.error(f"Wallet {wallet_address} not found for user {user.id}")
            return False
        except Exception as e:
            logger.error(f"Error setting primary wallet: {e}")
            return False
            
    async def send_transaction(self, wallet, recipient, amount, memo="", fee=None, wallet_passphrase=None):
        """
        Send a transaction from a wallet
        
        Args:
            wallet (UserWallet): The wallet to send from
            recipient (str): The recipient wallet address
            amount (float): The amount to send
            memo (str): Optional transaction memo
            fee (float): Optional transaction fee (default = None will use blockchain default)
            wallet_passphrase (str): The wallet passphrase for signing the transaction
            
        Returns:
            dict: Transaction details if successful, None otherwise
        """
        try:
            if not wallet_passphrase:
                logger.error("Wallet passphrase is required for sending transactions")
                return None
                
            blockchain = await self._ensure_blockchain()
            
            # Get wallet details to access private key
            wallet_details = await self.get_wallet_details(wallet.wallet_address, wallet_passphrase)
            
            if not wallet_details or 'private_key' not in wallet_details:
                logger.error(f"Failed to get wallet details for {wallet.wallet_address}")
                return None
                
            # Create and add transaction to mempool
            tx = await blockchain.create_transaction(
                private_key=wallet_details['private_key'],
                sender=wallet.wallet_address, 
                recipient=recipient, 
                amount=float(amount),
                memo=memo,
                fee=fee
            )
            
            success = await blockchain.add_transaction_to_mempool(tx)
            
            if success:
                # Update wallet last transaction time
                wallet.last_transaction_at = timezone.now()
                wallet.save(update_fields=['last_transaction_at'])
                
                # Also update user's last transaction time if this is their primary wallet
                if wallet.is_primary:
                    user = wallet.user
                    user.last_transaction_at = timezone.now()
                    user.save(update_fields=['last_transaction_at'])
                
                # Return transaction details
                return {
                    'tx_id': tx.tx_id,
                    'sender': wallet.wallet_address,
                    'recipient': recipient,
                    'amount': amount,
                    'memo': memo,
                    'fee': fee,
                    'timestamp': timezone.now().isoformat()
                }
            else:
                logger.error(f"Transaction rejected by blockchain")
                return None
                
        except Exception as e:
            logger.error(f"Error sending transaction: {e}")
            return None
            
    async def backup_wallet(self, wallet, wallet_passphrase):
        """
        Create an encrypted backup of a wallet
        
        Args:
            wallet (UserWallet): The wallet to backup
            wallet_passphrase (str): The wallet passphrase for decryption
            
        Returns:
            WalletBackup: The backup object if successful, None otherwise
        """
        try:
            blockchain = await self._ensure_blockchain()
            
            # Get wallet details
            wallet_details = await self.get_wallet_details(wallet.wallet_address, wallet_passphrase)
            
            if not wallet_details or 'private_key' not in wallet_details:
                logger.error(f"Failed to get wallet details for backup: {wallet.wallet_address}")
                return None
                
            # Create encrypted backup
            from security.backup import KeyBackupManager
            
            # Initialize backup manager
            backup_dir = getattr(settings, 'WALLET_BACKUP_DIR', 'wallet_backups')
            backup_manager = KeyBackupManager(backup_dir)
            
            # Create backup
            backup_path = await backup_manager.create_backup(
                keys={
                    'private_key': wallet_details['private_key'],
                    'public_key': wallet_details['public_key'],
                    'address': wallet.wallet_address
                },
                password=wallet_passphrase
            )
            
            if not backup_path:
                logger.error(f"Failed to create backup for wallet {wallet.wallet_address}")
                return None
                
            # Read the encrypted backup data
            with open(backup_path, 'rb') as f:
                encrypted_backup = f.read()
                
            # Create backup record in database
            backup = WalletBackup.objects.create(
                address=wallet.wallet_address,
                encrypted_backup=encrypted_backup,
                user=wallet.user
            )
            
            return backup
            
        except Exception as e:
            logger.error(f"Error creating wallet backup: {e}")
            return None
            
    async def get_transaction_history(self, wallet, limit=50):
        """
        Get transaction history for a wallet
        
        Args:
            wallet (UserWallet): The wallet to get history for
            limit (int): Maximum number of transactions to return
            
        Returns:
            list: List of transaction objects
        """
        try:
            blockchain = await self._ensure_blockchain()
            
            # Get transactions from blockchain
            transactions = await blockchain.get_transactions_for_address(wallet.wallet_address, limit)
            
            # Convert to a more frontend-friendly format
            formatted_transactions = []
            
            for tx in transactions:
                is_outgoing = tx.sender == wallet.wallet_address
                
                formatted_tx = {
                    'tx_id': tx.tx_id,
                    'sender': tx.sender,
                    'recipient': tx.recipient,
                    'amount': float(tx.amount),
                    'timestamp': tx.timestamp,
                    'is_outgoing': is_outgoing,
                    'confirmed': getattr(tx, 'confirmed', False),
                    'block_index': getattr(tx, 'block_index', None),
                    'memo': getattr(tx, 'memo', ''),
                    'fee': float(getattr(tx, 'fee', 0)),
                }
                
                formatted_transactions.append(formatted_tx)
                
            return formatted_transactions
            
        except Exception as e:
            logger.error(f"Error getting transaction history for {wallet.wallet_address}: {e}")
            return []

# Create a singleton instance
multi_wallet_service = MultiWalletService()