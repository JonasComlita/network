# blockchain/services/background_service.py

import asyncio
import logging
import threading
import time
from django.conf import settings
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from django.db import connection
from django.contrib.auth import get_user_model
from blockchain.blockchain import Blockchain
from blockchain_django.models import BlockchainTransaction, Block, CustomUser
from utils import is_port_available, find_available_port_async

logger = logging.getLogger(__name__)
User = get_user_model()

# Database operations wrapped with database_sync_to_async
@database_sync_to_async
def get_existing_block_indices():
    """Get list of existing block indices from the database"""
    return list(Block.objects.values_list('index', flat=True))

@database_sync_to_async
def save_block_record(block_record):
    """Save a block record to the database"""
    block_record.save()
    return block_record

@database_sync_to_async
def create_transaction(amount, block, recipient, sender, created_at):
    """Create a new blockchain transaction in the database"""
    return BlockchainTransaction.objects.create(
        amount=amount,
        block=block,
        recipient=recipient,
        sender=sender or "0",  # Use "0" for coinbase
        created_at=created_at
    )

@database_sync_to_async
def get_users_with_wallets():
    """Get all users with wallet addresses"""
    return list(CustomUser.objects.filter(wallet_address__isnull=False))

@database_sync_to_async
def save_user_balance(user, balance):
    """Save updated balance for a user"""
    user.wallet_balance = balance
    user.save(update_fields=['wallet_balance'])
    return user

@database_sync_to_async
def get_active_miners():
    """Get miners ordered by last transaction time"""
    miners = CustomUser.objects.filter(is_miner=True, wallet_address__isnull=False)
    if miners.exists():
        return miners.order_by('last_transaction_at').first()
    return None

class BlockchainBackgroundService:
    """Background service for blockchain operations"""
    
    def __init__(self):
        self.blockchain = Blockchain(node_id="background-service")
        self.running = False
        self.thread = None
        self.channel_layer = get_channel_layer()
        self.tasks = []
        
    async def initialize_blockchain(self):
        """Initialize the blockchain instance with dynamic port selection"""
        try:
            # Try alternative ports if default is taken
            from utils import find_available_port_async
            
            if not self.blockchain.initialized:
                # If p2p_port is in use, find an alternative
                if not is_port_available(self.blockchain.port):
                    new_port = await find_available_port_async(8400, 8499)  # Try range 8400-8499
                    logger.info(f"Default port in use, using alternative port: {new_port}")
                    self.blockchain.port = new_port
                    
                # Initialize with the new port
                await self.blockchain.initialize()
                logger.info("Blockchain initialized in background service")
        except Exception as e:
            logger.error(f"Failed to initialize blockchain: {e}")
    
    async def sync_blockchain_data(self):
        """Sync blockchain data to database"""
        try:
            # Ensure blockchain is initialized
            await self.initialize_blockchain()
            
            # Sync blocks from blockchain to database
            chain = self.blockchain.chain
            existing_blocks = await get_existing_block_indices()
            
            for block in chain:
                if block.index not in existing_blocks:
                    # Create new block record
                    block_record = Block(
                        index=block.index,
                        hash=block.hash,
                        previous_hash=block.previous_hash,
                        timestamp=block.timestamp
                    )
                    block_record = await save_block_record(block_record)
                    
                    # Process transactions in the block
                    for tx in block.transactions:
                        try:
                            await create_transaction(
                                amount=tx.amount,
                                block=block_record,
                                recipient=tx.recipient,
                                sender=tx.sender or "0",  # Use "0" for coinbase
                                created_at=tx.timestamp
                            )
                        except Exception as e:
                            logger.error(f"Error saving transaction: {e}")
            
            logger.info(f"Synced blockchain data. Current height: {len(chain)}")
        except Exception as e:
            logger.error(f"Error syncing blockchain data: {e}")
    
    async def update_user_balances(self):
        """Update balances for all users with wallets"""
        try:
            # Ensure blockchain is initialized
            await self.initialize_blockchain()
            
            # Get all users with wallet addresses
            users = await get_users_with_wallets()
            updated_count = 0
            
            for user in users:
                try:
                    balance = await self.blockchain.get_balance(user.wallet_address)
                    
                    # Update user balance if it changed
                    if balance != user.wallet_balance:
                        user = await save_user_balance(user, balance)
                        updated_count += 1
                        
                        # Notify user about balance update
                        # Convert async to sync for channel layer operations
                        await self.channel_layer.group_send(
                            f"user_{user.id}_wallet",
                            {
                                "type": "balance_update",
                                "balance": float(balance),
                                "wallet_address": user.wallet_address,
                                "timestamp": time.time()
                            }
                        )
                except Exception as e:
                    logger.error(f"Error updating balance for user {user.username}: {e}")
            
            if updated_count > 0:
                logger.info(f"Updated balances for {updated_count} users")
                
        except Exception as e:
            logger.error(f"Error updating user balances: {e}")
    
    async def mine_block_if_needed(self):
        """Mine a new block if there are pending transactions"""
        try:
            # Ensure blockchain is initialized
            await self.initialize_blockchain()
            
            # Check if mining is already in progress
            if getattr(self.blockchain, 'mining', False):
                return
                
            # Check if there are transactions in mempool
            if not self.blockchain.mempool.is_empty():
                # Find a user to receive mining reward (round-robin)
                miner = await get_active_miners()
                
                if miner:
                    # Start mining asynchronously
                    logger.info(f"Starting mining for miner {miner.username}")
                    await self.blockchain.start_mining(miner.wallet_address)
                    
                    # Mining will complete in blockchain background process
        except Exception as e:
            logger.error(f"Error in mine_block_if_needed: {e}")
    
    async def run_background_tasks(self):
        """Run all background tasks in a loop"""
        try:
            # Initialize the blockchain first
            await self.initialize_blockchain()
            
            while self.running:
                # Run tasks sequentially with proper error handling
                try:
                    await self.sync_blockchain_data()
                    await self.update_user_balances()
                    await self.mine_block_if_needed()
                    
                    # Use direct async calls
                    if hasattr(self.channel_layer, 'group_send'):
                        await self.channel_layer.group_send(
                            "blockchain_chart",
                            {
                                "type": "send_blockchain_chart_update",
                                "block_height": len(self.blockchain.chain),
                                "last_block_time": time.time()
                            }
                        )
                except Exception as e:
                    logger.error(f"Error in background tasks: {e}")
                
                # Sleep between cycles
                await asyncio.sleep(60)  # Run every minute
                
        except Exception as e:
            logger.error(f"Background task loop failed: {e}")
            self.running = False
    
    def start(self):
        """Start the background service in a separate thread"""
        if self.running:
            logger.warning("Background service is already running")
            return
            
        self.running = True
        
        # Create event loop for the thread
        def run_async_loop():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                loop.run_until_complete(self.run_background_tasks())
            finally:
                loop.close()
        
        # Start thread
        self.thread = threading.Thread(target=run_async_loop, daemon=True)
        self.thread.start()
        logger.info("Blockchain background service started")
    
    def stop(self):
        """Stop the background service"""
        self.running = False
        
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
            logger.info("Blockchain background service stopped")
            
# Create global instance
blockchain_service = BlockchainBackgroundService()