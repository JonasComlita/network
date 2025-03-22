import hashlib
import secrets
from typing import Dict, Optional
from cryptography.fernet import Fernet
import asyncio
import time
from utils import TransactionType, Transaction
from utils import generate_wallet

class UserManager:
    def __init__(self, blockchain):
        self.blockchain = blockchain
        self.users: Dict[str, Dict] = {}  # username: {password_hash, salt, address}
        self.session_tokens: Dict[str, str] = {}

    async def register_user(self, username: str, password: str) -> str:
        if username in self.users:
            return None
        
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        wallet = generate_wallet()
        address = wallet["address"]
        
        # Store user registration and wallet on-chain
        tx = Transaction(
            sender="system",
            recipient=username,
            tx_type=TransactionType.PROFILE_UPDATE,
            content={"username": username, "password_hash": password_hash, "salt": salt, "public_key": wallet["public_key"]}
        )
        await self.blockchain.add_transaction_to_mempool(tx)
        await self.blockchain.key_manager.save_wallet(username, address, wallet, password)
        
        self.users[username] = {"password_hash": password_hash, "salt": salt, "address": address}
        return address

    async def login(self, username: str, password: str) -> Optional[str]:
        if username not in self.users:
            await self.load_users_from_blockchain()
        if username not in self.users:
            return None
        
        user_data = self.users[username]
        if hashlib.sha256((password + user_data["salt"]).encode()).hexdigest() == user_data["password_hash"]:
            token = secrets.token_hex(32)
            self.session_tokens[token] = username
            return token
        return None

    async def load_users_from_blockchain(self):
        for block in self.blockchain.chain:
            for tx in block.transactions:
                if tx.tx_type == TransactionType.PROFILE_UPDATE and tx.recipient:
                    self.users[tx.recipient] = tx.content