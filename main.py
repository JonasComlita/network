import asyncio
import ssl
import argparse
import logging
import signal
import sys
import os
import time
import concurrent.futures
from blockchain.blockchain import Blockchain
from utils import  TransactionType
from blockchain.core import Block
from network.core import BlockchainNetwork, load_config, save_config
from network.p2p import NodeIdentity
import getpass
from utils import init_rotation_manager, find_available_port_async, is_port_available
from web_gui import WebGUI
import threading
from threading import Lock, Event
from security import SecurityMonitor, MFAManager, KeyBackupManager
from key_rotation.core import KeyRotationManager
import aiohttp
# Add project root to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

config = {
  "api_port": 8332,
  "bootstrap_nodes": [],
  "data_dir": "data",
  "isolation_timeout": 300,
  "key_rotation_port": 8334,
  "log_level": "INFO",
  "max_peers": 10,
  "max_retries": 3,
  "p2p_port": 8333,
  "peer_discovery_enabled": True,
  "peer_discovery_interval": 60,
  "ssl": {
    "ca_validity_days": 3650,
    "cert_validity_days": 365,
    "enabled": True
  },
  "sync_interval": 10
}

def create_ssl_context():
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = True
    ssl_context.minimum_version = ssl.TLSVersion.TLS1_2
    ssl_context.set_ciphers('ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384')
    ssl_context.verify_mode = ssl.CERT_REQUIRED
    return ssl_context

async def health_check(host: str, port: int, client_ssl_context=None, retries: int = 5, delay: float = 1.0) -> bool:
    """Check if the node is healthy with robust connection handling"""
    logger.info(f"Starting health check for {host}:{port}")
    
    # Try both HTTP and HTTPS
    urls = [
        f"http://{host}:{port}/health",  # Try without SSL first
        f"https://{host}:{port}/health"  # Then with SSL
    ]
    
    for attempt in range(retries):
        for url in urls:
            try:
                logger.debug(f"Health check attempt {attempt+1}/{retries} to {url}")
                async with aiohttp.ClientSession() as session:
                    # Skip SSL verification completely for health checks
                    async with session.get(url, ssl=False, timeout=5) as resp:
                        if resp.status == 200:
                            logger.info(f"Health check successful to {url}")
                            return True
            except Exception as e:
                logger.warning(f"Health check attempt {attempt+1}/{retries} to {url} failed: {e}")
        
        # If we've tried all URLs and none worked, wait before trying again
        if attempt < retries - 1:
            await asyncio.sleep(delay)
    
    logger.error(f"Health check failed after {retries} attempts to {host}:{port}")
    return False

async def run_async_tasks(blockchain: Blockchain, network: BlockchainNetwork, rotation_manager, loop: asyncio.AbstractEventLoop):
    """Run initial async tasks with health check"""
    await asyncio.sleep(3)  # Wait for servers to start
    if not await health_check(network.host, network.port, network.client_ssl_context):
        logger.error("Health check failed after retries")
        return False
    return True

def validate_port(port: int) -> bool:
    if not is_port_available(config["p2p_port"]):
        logger.error(f"Port {config['p2p_port']} is in use")
        sys.exit(1)
    return isinstance(port, int) and 1024 <= port <= 65535

async def test_bootstrap_node(host: str, port: int) -> bool:
    try:
        async with aiohttp.ClientSession() as session:
            await session.get(f"http://{host}:{port}/health", timeout=aiohttp.ClientTimeout(total=2))
            return True
    except:
        return False

def validate_bootstrap_nodes(nodes_str: str) -> bool:
    
    try:
        nodes = nodes_str.split(",")
        for node in nodes:
            host, port = node.split(":")
            if not (validate_port(int(port)) and len(host) > 0):
                return False
        return True
    except:
        return False

def set_resource_limits():
    """Set resource limits based on platform"""
    import platform
    if platform.system() == 'Windows':
        try:
            import psutil
            process = psutil.Process()
            process.nice(psutil.NORMAL_PRIORITY_CLASS)
        except Exception as e:
            logger.warning(f"Could not set Windows process priority: {e}")

    if platform.system() == 'Darwin':
        # macOS-specific limits (e.g., using `ulimit` equivalents)
        os.system("ulimit -n 1024")
    else:
        try:
            import resource
            soft, hard = resource.getrlimit(resource.RLIMIT_AS)
            resource.setrlimit(resource.RLIMIT_AS, (2 * 1024 * 1024 * 1024, hard))
            soft, hard = resource.getrlimit(resource.RLIMIT_NOFILE)
            resource.setrlimit(resource.RLIMIT_NOFILE, (1024, hard))
        except Exception as e:
            logger.warning(f"Could not set resource limits: {e}")

async def initialize_security(node_id: str) -> tuple:
    """Initialize security components"""
    security_monitor = SecurityMonitor()
    mfa_manager = MFAManager()
    backup_manager = KeyBackupManager(backup_dir=os.path.join('data', 'key_backups'))
    await security_monitor.start()
    return security_monitor, mfa_manager, backup_manager

async def get_wallet_password(blockchain: Blockchain) -> str:
    """Asynchronously get or set wallet password with proper assignment"""
    print("\n=== Wallet Connection ===")
    choice = input("Do you want to connect to an existing wallet (1) or create a new one (2)? [1/2]: ").strip()
    
    if choice == "2":
        while True:
            password = getpass.getpass("Set a wallet encryption password: ").strip()
            if not password:
                print("Password cannot be empty. Please try again.")
                continue
            confirm = getpass.getpass("Confirm password: ").strip()
            if password != confirm:
                print("Passwords do not match. Please try again.")
                continue
            
            # IMPORTANT: Set the password BEFORE creating the wallet
            blockchain.key_manager.password = password
            
            # Now create the wallet with password already set
            address = await blockchain.create_wallet()
            
            # Save wallets with the password already set
            await blockchain.save_wallets()
            print(f"New wallet created with address: {address}")
            return password
    
    elif choice == "1":
        while True:
            password = getpass.getpass("Enter wallet encryption password: ").strip()
            if not password:
                print("Password cannot be empty. Please try again.")
                continue
            original_password = blockchain.key_manager.password
            blockchain.key_manager.password = password
            try:
                wallets = await blockchain.key_manager.load_keys()
                if wallets:
                    print(f"Successfully connected to wallet(s). Found {len(wallets)} address(es).")
                    blockchain.wallets = wallets
                    return password
                else:
                    print("No wallets found with this password. Please try again or create a new wallet.")
                    blockchain.key_manager.password = original_password
            except ValueError as e:
                if "Incorrect password" in str(e):
                    print("Incorrect password. Please try again.")
                else:
                    raise
    else:
        print("Invalid choice. Please enter 1 or 2.")
        return await get_wallet_password(blockchain)

async def async_main(args, loop):
    """Async initialization with retry logic"""
    config = load_config(args.config)

    # Before starting the network
    for port_name, port_value in [("p2p_port", config["p2p_port"]), 
                                ("api_port", config["api_port"]), 
                                ("key_rotation_port", config["key_rotation_port"])]:
        if not is_port_available(port_value, host="127.0.0.1"):
            new_port = await find_available_port_async(start_port=port_value+1, end_port=port_value+100, host="127.0.0.1")
            if new_port:
                logger.info(f"{port_name.upper()} {port_value} is in use, using alternative port {new_port}")
                config[port_name] = new_port
                # Save updated config
                save_config(config, args.config)

    # Parse bootstrap nodes
    bootstrap_nodes = []
    if args.bootstrap:
        try:
            for node in args.bootstrap.split(","):
                host, port = node.strip().split(":")
                port_num = int(port)
                if not validate_port(port_num) or not host:
                    raise ValueError(f"Invalid bootstrap node: {node}")
                bootstrap_nodes.append((host, port_num))
            logger.info(f"Using bootstrap nodes: {bootstrap_nodes}")
        except Exception as e:
            logger.error(f"Failed to parse bootstrap nodes '{args.bootstrap}': {e}")

    # Initialize node identity and blockchain
    node_identity = NodeIdentity(config["data_dir"])
    node_id, private_key, public_key = await node_identity.initialize()
    blockchain = Blockchain(node_id=node_id, wallet_password=None, port=config["p2p_port"])
    wallet_password = await get_wallet_password(blockchain)
    blockchain.key_manager.password = wallet_password
    await blockchain.initialize()

    # Initialize security components
    security_monitor, mfa_manager, backup_manager = await initialize_security(node_id)
    await init_rotation_manager(node_id)
    from utils import rotation_manager

    # Start network with retry
    network = None
    for attempt in range(3):
        try:
            network = BlockchainNetwork(
                blockchain, node_id, "127.0.0.1", config["p2p_port"], bootstrap_nodes,
                security_monitor=security_monitor, config_path=args.config
            )
            network.private_key = private_key
            network.public_key = public_key
            network.loop = loop
            await network.start()
            break
        except Exception as e:
            logger.warning(f"Network start attempt {attempt + 1}/3 failed: {e}")
            if attempt == 2:
                raise
            await asyncio.sleep(2)

    if network is None:
        raise RuntimeError("Failed to start network after 3 attempts")

    # Adjust key rotation port if needed
    key_rotation_port = config["key_rotation_port"]
    if not is_port_available(key_rotation_port, host="127.0.0.1"):
        new_port = await find_available_port_async(start_port=key_rotation_port + 1, end_port=key_rotation_port + 100, host="127.0.0.1")
        if new_port:
            logger.info(f"Using alternative port {new_port} for key rotation")
            key_rotation_port = new_port
            config["key_rotation_port"] = new_port
            save_config(config, args.config)

    # Start key rotation
    from key_rotation.main import main as rotation_main
    shutdown_event = asyncio.Event()
    rotation_task = asyncio.create_task(rotation_main(
        node_id, args.validator, key_rotation_port, "127.0.0.1", loop, shutdown_event, blockchain))
    network.background_tasks.append(rotation_task)

    # Verify health
    if not await run_async_tasks(blockchain, network, rotation_manager, loop):
        raise RuntimeError("Health check failed")

    return blockchain, network, security_monitor, mfa_manager, backup_manager, rotation_manager, shutdown_event

def run_async_loop(loop):
    """Run the asyncio event loop in a separate thread"""
    asyncio.set_event_loop(loop)
    try:
        loop.run_forever()
    except Exception as e:
        logger.error(f"Async loop crashed: {e}")
    finally:
        logger.info("Async loop stopped")

# In async_shutdown function in main.py:
async def async_shutdown(network: BlockchainNetwork, blockchain: Blockchain, shutdown_event: asyncio.Event, loop: asyncio.AbstractEventLoop):
    """Cleanly shut down all components with controlled event loop handling"""
    logger.info("Initiating shutdown...")
    
    # Signal shutdown to all components
    if shutdown_event:
        shutdown_event.set()
    
    # First save important data
    if blockchain:
        try:
            await blockchain.save_chain()
            await blockchain.save_wallets()
        except Exception as e:
            logger.error(f"Error saving blockchain data during shutdown: {str(e)}")
    
    # Stop network services
    if network:
        try:
            await network.stop()
        except Exception as e:
            logger.error(f"Error stopping network during shutdown: {str(e)}")
    
    # Clean blockchain shutdown
    if blockchain:
        try:
            await blockchain.shutdown()
        except Exception as e:
            logger.error(f"Error during blockchain shutdown: {str(e)}")
    
    # Wait a moment for tasks to settle
    await asyncio.sleep(0.5)
    
    # Cancel remaining tasks with protection against recursion
    try:
        # Get all tasks but exclude current task
        current_task = asyncio.current_task(loop)
        tasks = [t for t in asyncio.all_tasks(loop) if t is not current_task and not t.done()]
        
        if tasks:
            logger.info(f"Cancelling {len(tasks)} remaining tasks")
            
            # Cancel each task
            for task in tasks:
                if not task.done():
                    task.cancel()
            
            # Wait for a short duration for tasks to complete cancellation
            try:
                # Short timeout to avoid hanging
                await asyncio.wait(tasks, timeout=1)
            except Exception as e:
                logger.warning(f"Error waiting for tasks to cancel: {e}")
    except Exception as e:
        logger.error(f"Error cancelling tasks during shutdown: {str(e)}")
    
    # Don't stop the event loop here - let it finish naturally
    logger.info("Shutdown complete")

async def async_main_wrapper():
    """Async wrapper for the main function"""
    parser = argparse.ArgumentParser(description="Run a blockchain node.")
    parser.add_argument("--config", type=str, default="network_config.json", help="Path to configuration file")
    parser.add_argument("--p2p-port", type=int, default=None, help="P2P communication port")
    parser.add_argument("--api-port", type=int, default=None, help="HTTP API port")
    parser.add_argument("--key-rotation-port", type=int, default=None, help="Key rotation port")
    parser.add_argument("--data-dir", type=str, default=None, help="Data directory")
    parser.add_argument("--bootstrap", type=str, default=None, help="Comma-separated list of bootstrap nodes (host:port)")
    parser.add_argument("--validator", action="store_true", help="Run as validator node")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode with additional logging")

    args = parser.parse_args()

    # Then update the logging level if --debug is set:
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        for handler in logging.getLogger().handlers:
            handler.setLevel(logging.DEBUG)

    if args.p2p_port and not validate_port(args.p2p_port):
        logger.error("Invalid P2P port number")
        sys.exit(1)
    if args.api_port and not validate_port(args.api_port):
        logger.error("Invalid API port number")
        sys.exit(1)
    if args.bootstrap and not validate_bootstrap_nodes(args.bootstrap):
        logger.error("Invalid bootstrap nodes format")
        sys.exit(1)
    if args.data_dir and not os.path.isdir(args.data_dir):
        logger.error(f"Data directory {args.data_dir} is not accessible")
        sys.exit(1)

    set_resource_limits()
    
    # Create event loop for main thread
    loop = asyncio.get_running_loop()
    
    # Create thread for async operations
    async_thread = threading.Thread(target=run_async_loop, args=(loop,), daemon=True)
    async_thread.start()

    # Default values in case of early exit
    blockchain = None
    network = None
    shutdown_event = asyncio.Event()
    
    try:
        # Async initialization
        blockchain, network, security_monitor, mfa_manager, backup_manager, rotation_manager, shutdown_event = await async_main(args, loop)
        
        # Setup GUI with event subscription
        if threading.current_thread() is threading.main_thread():
            # Create GUI in main thread
            web_gui = WebGUI(blockchain, network)
            await web_gui.run()
            
            # Set up callbacks using queue instead of direct calls
            blockchain.subscribe("new_block", lambda block: gui.update_queue.put(
                lambda: gui.update_chain_display()))
            blockchain.subscribe("error", lambda error: gui.update_queue.put(
                lambda: gui.show_error(str(error))))
            
        else:
            # If not in main thread, don't use GUI
            logger.warning("Not running in main thread, GUI disabled")
            gui = None
            gui_thread = None

        # Signal handlers
        def signal_handler(sig, frame):
            logger.info(f"Received signal {sig}, shutting down...")
            loop.call_soon_threadsafe(lambda: asyncio.create_task(async_shutdown(network, blockchain, shutdown_event, loop)))
            
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
                
    except Exception as e:
        logger.error(f"Application failed: {e}", exc_info=True)
        await async_shutdown(network, blockchain, shutdown_event, loop)
        return 1
        
    finally:
        # Final cleanup
        await async_shutdown(network, blockchain, shutdown_event, loop)
        logger.info("Application fully shut down")
    
    return 0

if __name__ == "__main__":
    try:
        # Use asyncio.run for the new async main wrapper
        sys.exit(asyncio.run(async_main_wrapper()))
    except Exception as e:
        logger.critical(f"Critical error in main program: {e}", exc_info=True)
        sys.exit(1)