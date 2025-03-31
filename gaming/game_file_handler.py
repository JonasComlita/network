import os
import shutil
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class GameFileHandler:
    """
    Utility class to handle game file operations.
    This class is responsible for copying, preparing and managing game files.
    """
    
    def __init__(self):
        """Initialize the game file handler"""
        self.games_dir = getattr(settings, 'GAMING_CONFIG', {}).get(
            'game_files_dir', 
            os.path.join(settings.MEDIA_ROOT, 'games')
        )
        
        # Create games directory if it doesn't exist
        if not os.path.exists(self.games_dir):
            os.makedirs(self.games_dir, exist_ok=True)
    
    def prepare_game_files(self, game):
        """
        Prepare game files for serving:
        1. Copy game files from source to public directory
        2. Inject blockchain integration code
        3. Update file references
        
        Args:
            game: Game model instance
        
        Returns:
            bool: Success status
        """
        try:
            # Skip if no filename is provided
            if not game.file_name:
                logger.warning(f"No file name provided for game {game.id}")
                return False
            
            # Create game-specific directory
            game_dir = os.path.join(self.games_dir, game.id)
            if not os.path.exists(game_dir):
                os.makedirs(game_dir, exist_ok=True)
            
            # Source file path (from uploads)
            source_file = os.path.join(settings.MEDIA_ROOT, 'uploads', game.file_name)
            
            # Skip if source file doesn't exist
            if not os.path.exists(source_file):
                logger.warning(f"Source file {source_file} not found for game {game.id}")
                return False
            
            # Destination path
            dest_file = os.path.join(game_dir, os.path.basename(game.file_name))
            
            # Read source file
            with open(source_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Modify content for blockchain integration
            content = self._inject_blockchain_integration(content, game.id)
            
            # Update dependency references if any
            if game.dependencies:
                for dep in game.dependencies:
                    # Copy dependency file
                    dep_source = os.path.join(settings.MEDIA_ROOT, 'uploads', dep)
                    dep_dest = os.path.join(game_dir, os.path.basename(dep))
                    
                    if os.path.exists(dep_source):
                        shutil.copyfile(dep_source, dep_dest)
                    
                    # Update reference in main file
                    content = content.replace(
                        f'src="{dep}"',
                        f'src="/media/games/{game.id}/{os.path.basename(dep)}"'
                    )
            
            # Write modified content to destination
            with open(dest_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"Game files prepared successfully for {game.id}")
            return True
            
        except Exception as e:
            logger.error(f"Error preparing game files for {game.id}: {str(e)}")
            return False
    
    def _inject_blockchain_integration(self, content, game_id):
        """
        Inject blockchain integration code into game HTML
        
        Args:
            content: Original HTML content
            game_id: Game ID for tracking
        
        Returns:
            str: Modified HTML content
        """
        # Blockchain integration script to inject
        integration_script = """
            <!-- NetWork Blockchain Integration -->
            <script src="/static/js/blockchain-integration.js"></script>
            <script>
                // Initialize blockchain connection
                document.addEventListener('DOMContentLoaded', function() {
                    // Get auth token from URL parameters
                    const urlParams = new URLSearchParams(window.location.search);
                    const authToken = urlParams.get('auth');
                    
                    if (authToken) {
                        // Initialize blockchain connection for this game session
                        window.NetworkBlockchain = new NetworkBlockchainSDK({
                            gameId: '%s',
                            authToken: authToken,
                            environment: 'production'
                        });
                        
                        // Start tracking game session
                        window.NetworkBlockchain.startGameSession();
                        
                        // Set up event listeners for game progress and rewards
                        window.NetworkBlockchain.setupEventListeners();
                        
                        // Add rewards badge to the game
                        const rewardsBadge = document.createElement('div');
                        rewardsBadge.className = 'network-blockchain-badge';
                        rewardsBadge.innerHTML = `
                            <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #4f46e5; 
                                        padding: 5px 10px; border-radius: 5px; font-family: Arial, sans-serif; z-index: 9999; 
                                        display: flex; align-items: center; font-size: 14px;">
                                <span style="margin-right: 5px;">◆</span> NetWork Blockchain Connected
                            </div>
                        `;
                        document.body.appendChild(rewardsBadge);
                    } else {
                        console.warn('No authentication token provided. Blockchain features disabled.');
                    }
                });
                
                // Listen for game shutdown
                window.addEventListener('beforeunload', function() {
                    if (window.NetworkBlockchain) {
                        window.NetworkBlockchain.endGameSession();
                    }
                });
            </script>
        """ % game_id
        
        # Insert script before closing body tag
        if '</body>' in content:
            content = content.replace('</body>', f'{integration_script}\n</body>')
        else:
            # If no body tag, append to end
            content += f'\n{integration_script}'
        
        return content
    
    def clean_game_files(self, game_id):
        """
        Remove game files
        
        Args:
            game_id: Game ID
        
        Returns:
            bool: Success status
        """
        try:
            game_dir = os.path.join(self.games_dir, game_id)
            
            if os.path.exists(game_dir):
                shutil.rmtree(game_dir)
                logger.info(f"Game files removed for {game_id}")
                return True
            else:
                logger.warning(f"No game directory found for {game_id}")
                return False
        except Exception as e:
            logger.error(f"Error cleaning game files for {game_id}: {str(e)}")
            return False