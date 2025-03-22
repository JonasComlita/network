from aiohttp import web
import json
from blockchain.blockchain import Blockchain
from network.core import BlockchainNetwork
from security.user_manager import UserManager
from utils import generate_wallet
import asyncio
from utils import TransactionType, Transaction
from utils.ipfs_utils import IPFSManager

class WebGUI:
    def __init__(self, blockchain: Blockchain, network: BlockchainNetwork):
        self.blockchain = blockchain
        self.network = network
        self.user_manager = UserManager(blockchain)
        self.ipfs = IPFSManager()
        self.app = web.Application()
        self.setup_routes()

    def setup_routes(self):
        self.app.add_routes([
            web.post('/register', self.register),
            web.post('/login', self.login),
            web.post('/send_coins', self.send_coins),
            web.get('/balance', self.get_balance),
            web.post('/create_post', self.create_post),
            web.post('/follow', self.follow),
            web.get('/feed', self.get_feed),
            web.post('/tip', self.tip),
        ])

    async def register(self, request):
        data = await request.json()
        address = await self.user_manager.register_user(data["username"], data["password"])
        return web.json_response({"address": address} if address else {"error": "Username taken"})

    async def login(self, request):
        data = await request.json()
        token = await self.user_manager.login(data["username"], data["password"])
        return web.json_response({"token": token} if token else {"error": "Invalid credentials"})

    async def send_coins(self, request):
        token = request.headers.get("Authorization")
        if not token or token not in self.user_manager.session_tokens:
            return web.Response(status=401, text="Unauthorized")
        
        data = await request.json()
        username = self.user_manager.session_tokens[token]
        wallet = await self.blockchain.key_manager.load_wallet(username, username, data["wallet_password"])
        if not wallet:
            return web.json_response({"error": "Invalid password"})
        
        tx = Transaction(sender=username, recipient=data["recipient"], amount=float(data["amount"]), tx_type=TransactionType.TRANSFER)
        tx.sign(wallet["private_key"])
        success = await self.blockchain.add_transaction_to_mempool(tx)
        return web.json_response({"success": success})

    async def get_balance(self, request):
        token = request.headers.get("Authorization")
        if not token or token not in self.user_manager.session_tokens:
            return web.Response(status=401, text="Unauthorized")
        
        username = self.user_manager.session_tokens[token]
        balance = await self.blockchain.get_balance(username)
        return web.json_response({"balance": balance})

    async def create_post(self, request):
        token = request.headers.get("Authorization")
        if not token or token not in self.user_manager.session_tokens:
            return web.Response(status=401, text="Unauthorized")
        
        data = await request.json()
        username = self.user_manager.session_tokens[token]
        wallet = await self.blockchain.key_manager.load_wallet(username, username, data["wallet_password"])
        
        content = {}
        if data.get("text"):
            content["text"] = data["text"]
        if data.get("media"):
            media_hash = await self.ipfs.add_content(data["media"].encode())
            content["media_hash"] = media_hash
        
        tx = Transaction(sender=username, tx_type=TransactionType.POST, content=content)
        tx.sign(wallet["private_key"])
        success = await self.blockchain.add_transaction_to_mempool(tx)
        return web.json_response({"success": success, "tx_id": tx.tx_id})

    async def follow(self, request):
        token = request.headers.get("Authorization")
        if not token or token not in self.user_manager.session_tokens:
            return web.Response(status=401, text="Unauthorized")
        
        data = await request.json()
        username = self.user_manager.session_tokens[token]
        wallet = await self.blockchain.key_manager.load_wallet(username, username, data["wallet_password"])
        
        tx = Transaction(sender=username, recipient=data["target"], tx_type=TransactionType.FOLLOW)
        tx.sign(wallet["private_key"])
        success = await self.blockchain.add_transaction_to_mempool(tx)
        return web.json_response({"success": success})

    async def get_feed(self, request):
        token = request.headers.get("Authorization")
        if not token or token not in self.user_manager.session_tokens:
            return web.Response(status=401, text="Unauthorized")
        
        username = self.user_manager.session_tokens[token]
        feed = await self.blockchain.get_feed(username)
        return web.json_response({"feed": feed})

    async def tip(self, request):
        token = request.headers.get("Authorization")
        if not token or token not in self.user_manager.session_tokens:
            return web.Response(status=401, text="Unauthorized")
        
        data = await request.json()
        username = self.user_manager.session_tokens[token]
        wallet = await self.blockchain.key_manager.load_wallet(username, username, data["wallet_password"])
        
        tx = Transaction(sender=username, recipient=data["recipient"], amount=float(data["amount"]), tx_type=TransactionType.TIP)
        tx.sign(wallet["private_key"])
        success = await self.blockchain.add_transaction_to_mempool(tx)
        return web.json_response({"success": success})

    async def run(self):
        runner = web.AppRunner(self.app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', 8080)
        await site.start()
        print("Web GUI running on http://0.0.0.0:8080")
        await asyncio.Event().wait()