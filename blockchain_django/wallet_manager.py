# blockchain_django/wallet_manager.py

import asyncio
import logging
import threading
from datetime import datetime
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db import transaction

from blockchain.blockchain import Blockchain
from django.conf import settings

logger = logging.getLogger(__name__)

class WalletManager:
    """
    Enhanced service class to handle wallet operations with proper thread and 
    event loop management. Added support for multiple wallets and transaction history.
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
    
    def create_wallet(self, user_id=None, wallet_name=None, wallet_passphrase=None):
        """
        Create a new wallet synchronously with enhanced parameters
        
        Args:
            user_id (str, optional): The user ID to associate with the wallet
            wallet_name (str, optional): A name for the wallet
            wallet_passphrase (str, optional): Passphrase to secure the wallet
            
        Returns:
            str: The wallet address if successful, None otherwise
        """
        try:
            self._ensure_blockchain_initialized()
            
            # Create a new event loop for this thread if necessary
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Prepare parameters
            create_params = {}
            if user_id:
                create_params['user_id'] = str(user_id)
            if wallet_passphrase:
                create_params['wallet_passphrase'] = wallet_passphrase
                
            # Run the async operation in this thread's event loop
            wallet_address = loop.run_until_complete(
                self.blockchain.create_wallet(**create_params)
            )
            
            # Log wallet creation
            if wallet_address:
                logger.info(f"Created wallet {wallet_address} for user {user_id}")
                
                # Send notification via WebSocket if a channel layer is available
                self._notify_wallet_created(user_id, wallet_address)
                
            return wallet_address
        except Exception as e:
            logger.error(f"Error creating wallet: {e}")
            raise
    
    def get_balance(self, address):
        """
        Get wallet balance synchronously
        
        Args:
            address (str): The wallet address
            
        Returns:
            float: The wallet balance
        """
        try:
            self._ensure_blockchain_initialized()
            
            loop = self._get_event_loop_in_thread()
            balance = loop.run_until_complete(self.blockchain.get_balance(address))
            
            return balance
        except Exception as e:
            logger.error(f"Error getting balance for {address}: {e}")
            raise
    
    def get_wallet(self, address, wallet_passphrase):
        """
        Get wallet details synchronously
        
        Args:
            address (str): The wallet address
            wallet_passphrase (str): The wallet passphrase
            
        Returns:
            dict: Wallet details
        """
        try:
            self._ensure_blockchain_initialized()
            
            loop = self._get_event_loop_in_thread()
            wallet = loop.run_until_complete(
                self.blockchain.get_wallet(address, wallet_passphrase)
            )
            
            return wallet
        except Exception as e:
            logger.error(f"Error getting wallet {address}: {e}")
            raise
    
    def get_transactions(self, address, limit=50):
        """
        Get transaction history for a wallet synchronously
        
        Args:
            address (str): The wallet address
            limit (int): Maximum number of transactions to return
            
        Returns:
            list: List of transactions
        """
        try:
            self._ensure_blockchain_initialized()
            
            loop = self._get_event_loop_in_thread()
            transactions = loop.run_until_complete(
                self.blockchain.get_transactions_for_address(address, limit)
            )
            
            # Format transactions for API
            formatted_transactions = []
            for tx in transactions:
                is_outgoing = tx.sender == address
                
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
            logger.error(f"Error getting transactions for {address}: {e}")
            raise
    
    def send_transaction(self, sender, recipient, amount, wallet_passphrase, memo="", fee=None):
        """
        Send a transaction synchronously
        
        Args:
            sender (str): Sender wallet address
            recipient (str): Recipient wallet address
            amount (float): Transaction amount
            wallet_passphrase (str): Wallet passphrase for signing
            memo (str, optional): Transaction memo
            fee (float, optional): Transaction fee
            
        Returns:
            dict: Transaction details
        """
        try:
            self._ensure_blockchain_initialized()
            
            loop = self._get_event_loop_in_thread()
            
            # Get wallet details to access private key
            wallet = loop.run_until_complete(
                self.blockchain.get_wallet(sender, wallet_passphrase)
            )
            
            if not wallet or 'private_key' not in wallet:
                raise ValueError("Failed to get wallet details for transaction")
            
            # Create transaction
            tx = loop.run_until_complete(
                self.blockchain.create_transaction(
                    private_key=wallet['private_key'],
                    sender=sender,
                    recipient=recipient,
                    amount=float(amount),
                    memo=memo,
                    fee=fee
                )
            )
            
            # Add to mempool
            success = loop.run_until_complete(
                self.blockchain.add_transaction_to_mempool(tx)
            )
            
            if not success:
                raise ValueError("Transaction rejected by blockchain")
            
            # Send WebSocket notifications
            self._notify_transaction_sent(sender, recipient, tx)
            
            # Return transaction details
            return {
                'tx_id': tx.tx_id,
                'sender': sender,
                'recipient': recipient,
                'amount': float(amount),
                'memo': memo,
                'fee': fee if fee else 0,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error sending transaction: {e}")
            raise
    
    def backup_wallet(self, address, wallet_passphrase):
        """
        Create wallet backup
        
        Args:
            address (str): Wallet address
            wallet_passphrase (str): Wallet passphrase
            
        Returns:
            bytes: Encrypted backup data
        """
        try:
            self._ensure_blockchain_initialized()
            
            loop = self._get_event_loop_in_thread()
            
            # Get wallet details
            wallet = loop.run_until_complete(
                self.blockchain.get_wallet(address, wallet_passphrase)
            )
            
            if not wallet or 'private_key' not in wallet:
                raise ValueError("Failed to get wallet details for backup")
            
            # Create backup (implementation depends on your blockchain module)
            if hasattr(self.blockchain, 'create_wallet_backup'):
                backup_data = loop.run_until_complete(
                    self.blockchain.create_wallet_backup(address, wallet_passphrase)
                )
                return backup_data
            else:
                # Fallback: return wallet details as JSON for storage
                import json
                backup_data = json.dumps({
                    'private_key': wallet['private_key'],
                    'public_key': wallet['public_key'],
                    'address': address
                }).encode('utf-8')
                return backup_data
        except Exception as e:
            logger.error(f"Error creating wallet backup: {e}")
            raise
    
    def update_balances_for_user(self, user):
        """
        Update balances for all wallets belonging to a user
        
        Args:
            user: User object with wallets
            
        Returns:
            dict: Map of wallet addresses to balances
        """
        from blockchain_django.models import UserWallet
        
        balances = {}
        
        try:
            # Get all active wallets for user
            wallets = UserWallet.objects.filter(user=user, is_active=True)
            
            for wallet in wallets:
                try:
                    balance = self.get_balance(wallet.wallet_address)
                    
                    # Update wallet balance in database
                    wallet.balance = balance
                    wallet.save(update_fields=['balance'])
                    
                    # Update primary wallet balance in user profile
                    if wallet.is_primary:
                        user.wallet_balance = balance
                        user.save(update_fields=['wallet_balance'])
                    
                    balances[wallet.wallet_address] = balance
                    
                    # Send WebSocket notification
                    self._notify_balance_update(user.id, wallet.wallet_address, balance)
                        
                except Exception as inner_e:
                    logger.error(f"Error updating balance for wallet {wallet.wallet_address}: {inner_e}")
                    balances[wallet.wallet_address] = None
            
            return balances
        except Exception as e:
            logger.error(f"Error updating balances for user {user.id}: {e}")
            raise
    
    def _notify_wallet_created(self, user_id, wallet_address):
        """Send WebSocket notification about wallet creation"""
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                # Notify user's wallets group
                async_to_sync(channel_layer.group_send)(
                    f"user_{user_id}_wallets",
                    {
                        "type": "wallet_list_update",
                        "action": "created",
                        "wallet_address": wallet_address
                    }
                )
        except Exception as e:
            logger.error(f"Error sending wallet creation notification: {e}")
    
    def _notify_balance_update(self, user_id, wallet_address, balance):
        """Send WebSocket notification about balance update"""
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                # Notify wallet-specific group
                async_to_sync(channel_layer.group_send)(
                    f"wallet_{wallet_address}",
                    {
                        "type": "wallet_update",
                        "wallet_address": wallet_address,
                        "balance": str(balance),
                        "timestamp": datetime.now().isoformat()
                    }
                )
                
                # Notify user's wallets group
                async_to_sync(channel_layer.group_send)(
                    f"user_{user_id}_wallets",
                    {
                        "type": "balance_update",
                        "wallet_address": wallet_address,
                        "balance": str(balance),
                        "timestamp": datetime.now().isoformat()
                    }
                )
        except Exception as e:
            logger.error(f"Error sending balance update notification: {e}")
    
    def _notify_transaction_sent(self, sender, recipient, tx):
        """Send WebSocket notification about transaction"""
        try:
            from blockchain_django.models import UserWallet
            
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            # Format transaction data
            tx_data = {
                "tx_id": tx.tx_id,
                "sender": sender,
                "recipient": recipient,
                "amount": float(tx.amount),
                "timestamp": datetime.now().isoformat(),
                "memo": getattr(tx, 'memo', ''),
                "fee": float(getattr(tx, 'fee', 0)),
                "confirmed": False,
                "block_index": None
            }
            
            # Find sender's user
            try:
                sender_wallet = UserWallet.objects.get(wallet_address=sender)
                sender_user_id = sender_wallet.user_id
                
                # Send to sender's wallet group
                async_to_sync(channel_layer.group_send)(
                    f"wallet_{sender}",
                    {
                        "type": "transaction_update",
                        "transaction": {
                            **tx_data,
                            "is_outgoing": True
                        }
                    }
                )
                
                # Send to sender's general wallet group
                async_to_sync(channel_layer.group_send)(
                    f"user_{sender_user_id}_wallets",
                    {
                        "type": "transaction_update",
                        "wallet_address": sender,
                        "transaction": {
                            **tx_data,
                            "is_outgoing": True
                        }
                    }
                )
            except UserWallet.DoesNotExist:
                pass
            
            # Find recipient's user
            try:
                recipient_wallet = UserWallet.objects.get(wallet_address=recipient)
                recipient_user_id = recipient_wallet.user_id
                
                # Send to recipient's wallet group
                async_to_sync(channel_layer.group_send)(
                    f"wallet_{recipient}",
                    {
                        "type": "transaction_update",
                        "transaction": {
                            **tx_data,
                            "is_outgoing": False
                        }
                    }
                )
                
                # Send to recipient's general wallet group
                async_to_sync(channel_layer.group_send)(
                    f"user_{recipient_user_id}_wallets",
                    {
                        "type": "transaction_update",
                        "wallet_address": recipient,
                        "transaction": {
                            **tx_data,
                            "is_outgoing": False
                        }
                    }
                )
            except UserWallet.DoesNotExist:
                pass
            
            # Send to general transaction group
            async_to_sync(channel_layer.group_send)(
                "transactions",
                {
                    "type": "send_transaction_update",
                    "transaction": tx_data
                }
            )
        except Exception as e:
            logger.error(f"Error sending transaction notification: {e}")

# Create a singleton instance
wallet_manager = WalletManager()