# blockchain/management/commands/blockchain_node.py

import asyncio
import logging
import signal
import sys
import time
from django.core.management.base import BaseCommand
from blockchain.blockchain import Blockchain
from blockchain_django.background_service import blockchain_service
from blockchain_django.models import CustomUser

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Manage the blockchain node'

    def add_arguments(self, parser):
        parser.add_argument(
            'action',
            type=str,
            choices=['start', 'stop', 'status', 'mine', 'create_genesis'],
            help='Action to perform on the blockchain node'
        )
        parser.add_argument(
            '--miner',
            type=str,
            help='Username of the miner to receive rewards (for mine action)',
            default=None
        )

    def handle(self, *args, **options):
        action = options['action']

        if action == 'start':
            self.start_node()
        elif action == 'stop':
            self.stop_node()
        elif action == 'status':
            self.show_status()
        elif action == 'mine':
            self.start_mining(options['miner'])
        elif action == 'create_genesis':
            self.create_genesis_block()

    def start_node(self):
        try:
            # Check if the node is already running
            if blockchain_service.running:
                self.stdout.write(self.style.WARNING('Blockchain node is already running'))
                return

            # Start the background service
            blockchain_service.start()
            self.stdout.write(self.style.SUCCESS('Blockchain node started successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to start blockchain node: {e}'))

    def stop_node(self):
        try:
            # Check if the node is running
            if not blockchain_service.running:
                self.stdout.write(self.style.WARNING('Blockchain node is not running'))
                return

            # Stop the background service
            blockchain_service.stop()
            self.stdout.write(self.style.SUCCESS('Blockchain node stopped successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to stop blockchain node: {e}'))

    def show_status(self):
        try:
            # Initialize blockchain if needed
            blockchain = Blockchain(node_id="command-line")
            loop = asyncio.get_event_loop()
            
            async def check_status():
                if not blockchain.initialized:
                    await blockchain.initialize()
                
                # Get blockchain details
                chain_length = len(blockchain.chain)
                difficulty = blockchain.difficulty
                current_reward = blockchain.current_reward
                mempool_size = blockchain.mempool.size()
                is_mining = getattr(blockchain, 'mining', False)
                
                return {
                    'chain_length': chain_length,
                    'difficulty': difficulty,
                    'current_reward': current_reward,
                    'mempool_size': mempool_size,
                    'is_mining': is_mining,
                    'service_running': blockchain_service.running
                }
            
            # Run the async function
            status = loop.run_until_complete(check_status())
            
            # Display status information
            self.stdout.write(self.style.SUCCESS('Blockchain Status:'))
            self.stdout.write(f"Chain Length: {status['chain_length']} blocks")
            self.stdout.write(f"Current Difficulty: {status['difficulty']}")
            self.stdout.write(f"Current Block Reward: {status['current_reward']} ORIG")
            self.stdout.write(f"Pending Transactions: {status['mempool_size']}")
            self.stdout.write(f"Mining Active: {status['is_mining']}")
            self.stdout.write(f"Background Service Running: {status['service_running']}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to get blockchain status: {e}'))

    def start_mining(self, miner_username):
        try:
            # Validate miner username
            if not miner_username:
                self.stdout.write(self.style.ERROR('Miner username is required'))
                return
                
            try:
                miner = CustomUser.objects.get(username=miner_username)
                if not miner.wallet_address:
                    self.stdout.write(self.style.ERROR(f'User {miner_username} does not have a wallet'))
                    return
            except CustomUser.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User {miner_username} does not exist'))
                return
            
            # Initialize blockchain
            blockchain = Blockchain(node_id="command-line")
            loop = asyncio.get_event_loop()
            
            async def start_mining_async():
                if not blockchain.initialized:
                    await blockchain.initialize()
                
                # Check if already mining
                if getattr(blockchain, 'mining', False):
                    self.stdout.write(self.style.WARNING('Mining is already in progress'))
                    return False
                
                # Start mining
                await blockchain.start_mining(miner.wallet_address)
                return True
            
            # Run the async function
            success = loop.run_until_complete(start_mining_async())
            
            if success:
                self.stdout.write(self.style.SUCCESS(f'Mining started for {miner_username}'))
                self.stdout.write('Press Ctrl+C to stop mining...')
                
                # Wait for Ctrl+C
                try:
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    loop.run_until_complete(blockchain.stop_mining())
                    self.stdout.write(self.style.SUCCESS('Mining stopped'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to start mining: {e}'))

    def create_genesis_block(self):
        try:
            # Initialize blockchain
            blockchain = Blockchain(node_id="command-line")
            loop = asyncio.get_event_loop()
            
            async def create_genesis_async():
                if not blockchain.initialized:
                    await blockchain.initialize()
                
                # Check if chain already exists
                if len(blockchain.chain) > 0:
                    self.stdout.write(self.style.WARNING('Blockchain already has a genesis block'))
                    return False
                
                # Create genesis block
                blockchain.create_genesis_block()
                await blockchain.save_chain()
                return True
            
            # Run the async function
            success = loop.run_until_complete(create_genesis_async())
            
            if success:
                self.stdout.write(self.style.SUCCESS('Genesis block created successfully'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to create genesis block: {e}'))