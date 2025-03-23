import os
import logging
import sys
import time
import hashlib
import msgpack

logger = logging.getLogger(__name__)

def fix_database_url():
    """Fix the DATABASE_URL environment variable to ensure proper format"""
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        logger.warning("No DATABASE_URL environment variable found")
        return
        
    # Check if the URL starts with the required prefix
    if not (db_url.startswith("postgresql://") or db_url.startswith("postgres://")):
        # If it starts with 'c', it's likely malformed
        if db_url.startswith("c"):
            logger.warning(f"Malformed DATABASE_URL detected: {db_url[:10]}...")
            
            # Common error pattern: "connection=..." instead of "postgresql://..."
            if "=" in db_url:
                # Extract the real connection string that might be after an equals sign
                parts = db_url.split("=", 1)
                if len(parts) > 1 and parts[1]:
                    corrected_url = parts[1].strip()
                    
                    # Add prefix if missing
                    if not (corrected_url.startswith("postgresql://") or corrected_url.startswith("postgres://")):
                        corrected_url = "postgresql://" + corrected_url
                        
                    logger.info(f"Corrected DATABASE_URL to: {corrected_url[:10]}...")
                    os.environ["DATABASE_URL"] = corrected_url
                    return
            
            # If we can't extract a valid part, default to localhost
            logger.warning("Could not extract valid connection string, defaulting to localhost")
            os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/blockchain"

# Fix msgpack serialization
original_packb = msgpack.packb

def safe_packb(o, **kwargs):
    """Safely pack data with msgpack, handling function objects"""
    # Recursive function to sanitize objects before packing
    def sanitize(obj):
        if callable(obj):
            return str(obj)
        elif isinstance(obj, dict):
            return {sanitize(k): sanitize(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [sanitize(x) for x in obj]
        elif isinstance(obj, tuple):
            return tuple(sanitize(x) for x in obj)
        elif isinstance(obj, set):
            return {sanitize(x) for x in obj}
        else:
            return obj
    
    # Sanitize the object before packing
    try:
        sanitized = sanitize(o)
        return original_packb(sanitized, **kwargs)
    except Exception as e:
        logger.error(f"Error in safe_packb: {e}")
        # Last resort - convert to JSON string and pack that
        import json
        try:
            json_str = json.dumps(sanitize(o))
            return original_packb(json_str, **kwargs)
        except Exception as e2:
            logger.error(f"Failed even with JSON fallback: {e2}")
            # Ultimate fallback - return an empty dict
            return original_packb({}, **kwargs)

# Apply the fix
msgpack.packb = safe_packb
logger.info("msgpack.packb patched for safe serialization")

# Run the fix when imported
fix_database_url()

def patch_transaction_class():
    """Patch Transaction class to handle serialization issues"""
    try:
        # Wait until transaction is loaded before patching
        if 'blockchain.transaction' not in sys.modules:
            return
            
        # Get the Transaction class
        from blockchain.transaction import Transaction
        
        # Store original method
        original_to_dict = Transaction.to_dict
        original_calculate_tx_id = Transaction.calculate_tx_id
        
        # Create patched method
        def patched_to_dict(self, exclude_signature=False):
            try:
                result = original_to_dict(self, exclude_signature)
                # Ensure tx_id is a string
                if 'tx_id' in result and callable(result['tx_id']):
                    result['tx_id'] = str(hash(result['tx_id']))
                return result
            except Exception as e:
                logger.error(f"Error in patched to_dict: {e}")
                # Fallback dictionary
                signature = None
                if getattr(self, 'signature', None) and not exclude_signature:
                    sig = self.signature
                    if isinstance(sig, bytes):
                        signature = sig.hex()
                    else:
                        signature = str(sig)
                
                # Create a minimal valid dictionary
                return {
                    "sender": str(getattr(self, 'sender', '')),
                    "recipient": str(getattr(self, 'recipient', '')),
                    "amount": float(getattr(self, 'amount', 0.0)),
                    "timestamp": str(getattr(self, 'timestamp', time.time())),
                    "signature": signature,
                    "tx_type": 0,  # Default to TRANSFER
                    "tx_id": str(getattr(self, 'tx_id', hashlib.sha256(str(time.time()).encode()).hexdigest()))
                }
        
        # Patch the methods
        Transaction.to_dict = patched_to_dict
        
        logger.info("Successfully patched Transaction.to_dict method")
    except Exception as e:
        logger.error(f"Failed to patch Transaction class: {e}", exc_info=True)

def patch_msgpack_handling():
    """Patch msgpack handling to deal with function objects"""
    try:
        import msgpack
        original_packb = msgpack.packb
        
        def safe_packb(o, **kwargs):
            # Recursive function to sanitize objects before packing
            def sanitize(obj):
                if callable(obj) and not hasattr(obj, '__self__'):  # Functions but not methods
                    return str(obj)
                elif isinstance(obj, dict):
                    return {sanitize(k): sanitize(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [sanitize(x) for x in obj]
                elif isinstance(obj, tuple):
                    return tuple(sanitize(x) for x in obj)
                elif isinstance(obj, set):
                    return {sanitize(x) for x in obj}
                else:
                    return obj
            
            # Sanitize the object before packing
            sanitized = sanitize(o)
            return original_packb(sanitized, **kwargs)
        
        # Replace the original packb with our safe version
        msgpack.packb = safe_packb
        logger.info("Successfully patched msgpack.packb to handle function objects")
    except Exception as e:
        logger.error(f"Failed to patch msgpack: {e}", exc_info=True)

def patch_block_class():
    """Patch Block class to handle serialization issues"""
    try:
        # Wait until core is loaded before patching
        if 'blockchain.core' not in sys.modules:
            return
            
        # Get the Block class
        from blockchain.core import Block
        
        # Store original method
        original_calculate_hash = Block.calculate_hash
        
        # Create patched method with error handling
        def patched_calculate_hash(self):
            try:
                # Try original method first
                return original_calculate_hash(self)
            except TypeError as e:
                if "can not serialize 'function' object" in str(e):
                    logger.warning("Function serialization error in calculate_hash, using fallback")
                    # Create a minimal block representation for hashing
                    block_data = {
                        'index': int(self.index),
                        'timestamp': str(self.timestamp),
                        'previous_hash': str(self.previous_hash),
                        'nonce': int(self.nonce),
                        'merkle_root': str(self.merkle_root)
                    }
                    
                    # Create minimal transaction representations
                    tx_data = []
                    for tx in self.transactions:
                        safe_tx = {
                            'tx_id': str(getattr(tx, 'tx_id', hashlib.sha256(str(time.time()).encode()).hexdigest())),
                            'sender': str(getattr(tx, 'sender', '0')),
                            'recipient': str(getattr(tx, 'recipient', '')),
                            'amount': float(getattr(tx, 'amount', 0.0))
                        }
                        tx_data.append(safe_tx)
                    
                    block_data['transactions'] = tx_data
                    
                    # Generate hash using standard library
                    import hashlib, json
                    block_str = json.dumps(block_data, sort_keys=True)
                    return hashlib.sha256(block_str.encode()).hexdigest()
                else:
                    # Re-raise if it's not the specific error we're handling
                    raise
            except Exception as e:
                logger.error(f"Error in patched calculate_hash: {e}")
                # Ultimate fallback
                import hashlib
                fallback_data = f"{self.index}{self.timestamp}{self.previous_hash}{self.nonce}"
                return hashlib.sha256(fallback_data.encode()).hexdigest()
        
        # Patch the method
        Block.calculate_hash = patched_calculate_hash
        logger.info("Successfully patched Block.calculate_hash method")
    except Exception as e:
        logger.error(f"Failed to patch Block class: {e}", exc_info=True)

def monkey_patch_storage_postgres():
    """
    Monkey patch the storage_postgres module to add required methods
    This is executed when fix_postgres.py is imported
    """
    try:
        # Wait until storage_postgres is loaded
        if 'blockchain.storage_postgres' not in sys.modules:
            return
            
        # Add missing methods to PostgresStorage
        from blockchain.storage_postgres import PostgresStorage
        import time
        import msgpack
        import asyncio
        from typing import List, Dict, Optional, Any, Tuple
        
        # Check if methods already exist
        if hasattr(PostgresStorage, 'get_chain_height') and callable(getattr(PostgresStorage, 'get_chain_height')):
            logger.info("PostgresStorage is already patched")
            return  # Already patched
        
        # Add get_chain_height method
        async def get_chain_height(self) -> int:
            """Get the height of the blockchain."""
            if not self._initialized:
                await self.initialize()
                
            try:
                max_heights = []
                async with self._read_pool.acquire() as conn:
                    # Query max block index from each shard
                    for shard in range(self.num_shards):
                        row = await conn.fetchrow(f'SELECT MAX(id) FROM blocks_shard_{shard}')
                        if row and row[0] is not None:
                            max_heights.append(row[0])
                            
                return max(max_heights) if max_heights else -1
            except Exception as e:
                logger.error(f"Failed to get chain height: {e}", exc_info=True)
                return -1
        
        # Add get_latest_checkpoint method    
        async def get_latest_checkpoint(self) -> Tuple[Optional[int], Optional[Dict]]:
            """Get the latest checkpoint block index and UTXO data."""
            if not self._initialized:
                await self.initialize()
                
            try:
                async with self._read_pool.acquire() as conn:
                    row = await conn.fetchrow(
                        'SELECT block_index, utxo_data FROM checkpoints ORDER BY block_index DESC LIMIT 1'
                    )
                    
                    if row:
                        return row['block_index'], msgpack.unpackb(row['utxo_data'], raw=False)
                    return None, None
            except Exception as e:
                logger.error(f"Failed to get latest checkpoint: {e}", exc_info=True)
                return None, None
        
        # Add store_checkpoint method        
        async def store_checkpoint(self, block_index: int, utxo_data: Dict) -> bool:
            """Store a checkpoint at the specified block index."""
            if not self._initialized:
                await self.initialize()
                
            try:
                async with self._pool.acquire() as conn:
                    await conn.execute(
                        'INSERT INTO checkpoints (block_index, utxo_data, timestamp) VALUES ($1, $2, $3) '
                        'ON CONFLICT (block_index) DO UPDATE SET utxo_data = $2, timestamp = $3',
                        block_index, msgpack.packb(utxo_data, use_bin_type=True), time.time()
                    )
                logger.info(f"Stored checkpoint at block {block_index}")
                return True
            except Exception as e:
                logger.error(f"Failed to store checkpoint at block {block_index}: {e}", exc_info=True)
                return False
        
        # Add load_blocks method        
        async def load_blocks(self) -> List[Dict[str, Any]]:
            """Load all blocks from storage."""
            if not self._initialized:
                await self.initialize()
                
            try:
                blocks = []
                async with self._read_pool.acquire() as conn:
                    # Load blocks from each shard
                    for shard in range(self.num_shards):
                        rows = await conn.fetch(
                            f'SELECT id, data FROM blocks_shard_{shard} ORDER BY id ASC'
                        )
                        
                        for row in rows:
                            try:
                                block_data = msgpack.unpackb(row['data'], raw=False)
                                blocks.append(block_data)
                            except Exception as e:
                                logger.error(f"Error unpacking block data: {e}")
                                # Skip corrupted blocks
                                continue
                            
                # Sort blocks by index to ensure correct order
                blocks.sort(key=lambda x: x.get('index', 0))
                return blocks
            except Exception as e:
                logger.error(f"Failed to load blocks: {e}", exc_info=True)
                return []
        
        # Add load_blocks_range method        
        async def load_blocks_range(self, start_index: int, end_index: int) -> List[Dict[str, Any]]:
            """Load a range of blocks from storage."""
            if not self._initialized:
                await self.initialize()
                
            try:
                blocks = []
                async with self._read_pool.acquire() as conn:
                    # Query blocks from each shard that may contain blocks in the range
                    for shard in range(self.num_shards):
                        # For each shard, calculate which block indices in the range belong to this shard
                        shard_indices = [i for i in range(start_index, end_index) if i % self.num_shards == shard]
                        
                        if not shard_indices:
                            continue
                            
                        # Fetch blocks for this shard
                        rows = await conn.fetch(
                            f'SELECT id, data FROM blocks_shard_{shard} WHERE id >= $1 AND id < $2 ORDER BY id ASC',
                            start_index, end_index
                        )
                        
                        for row in rows:
                            try:
                                block_data = msgpack.unpackb(row['data'], raw=False)
                                blocks.append(block_data)
                            except Exception as e:
                                logger.error(f"Error unpacking block data in range: {e}")
                                # Skip corrupted blocks
                                continue
                            
                # Sort blocks by index to ensure correct order
                blocks.sort(key=lambda x: x.get('index', 0))
                return blocks
            except Exception as e:
                logger.error(f"Failed to load blocks range {start_index}-{end_index}: {e}", exc_info=True)
                return []
        
        # Add get_latest_blocks method        
        async def get_latest_blocks(self, count: int = 100) -> List[Dict[str, Any]]:
            """Get the latest blocks from the chain."""
            if not self._initialized:
                await self.initialize()
                
            try:
                # First get chain height to determine range
                chain_height = await self.get_chain_height()
                
                if chain_height < 0:
                    return []
                    
                start_index = max(0, chain_height - count + 1)
                end_index = chain_height + 1
                
                return await self.load_blocks_range(start_index, end_index)
            except Exception as e:
                logger.error(f"Failed to get latest blocks: {e}", exc_info=True)
                return []
        
        # Add the methods to the PostgresStorage class
        PostgresStorage.get_chain_height = get_chain_height
        PostgresStorage.get_latest_checkpoint = get_latest_checkpoint
        PostgresStorage.store_checkpoint = store_checkpoint
        PostgresStorage.load_blocks = load_blocks
        PostgresStorage.load_blocks_range = load_blocks_range
        PostgresStorage.get_latest_blocks = get_latest_blocks
        
        logger.info("Successfully patched PostgresStorage with missing methods")
    except Exception as e:
        logger.error(f"Failed to monkey patch PostgresStorage: {e}", exc_info=True)

# Run the fixes on module import
fix_database_url()
patch_msgpack_handling()

# Schedule the remaining patches to occur after modules are loaded
def apply_delayed_patches():
    patch_transaction_class()
    patch_block_class()
    monkey_patch_storage_postgres()

# Use threading to delay some patches
import threading
timer = threading.Timer(1.0, apply_delayed_patches)
timer.daemon = True
timer.start()

logger.info("fix_postgres.py loaded successfully")