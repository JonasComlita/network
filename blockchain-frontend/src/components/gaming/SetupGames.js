// server/setupGames.js
/**
 * This file contains server-side code to serve game files directly
 * and handle game-related blockchain transactions
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Set up routes for serving game files
 * @param {Express} app - Express app instance
 */
const setupGameRoutes = (app) => {
  // Create a dedicated games folder if it doesn't exist
  const gamesDir = path.join(__dirname, '../public/games');
  if (!fs.existsSync(gamesDir)) {
    fs.mkdirSync(gamesDir, { recursive: true });
  }

  // Copy game files to public directory for serving
  const copyGameFiles = () => {
    // Define source and destination maps for each game
    const gamePaths = [
      { 
        id: 'pygame-zero',
        source: 'Untitled-1.html', 
        dest: 'pygame-zero.html'
      },
      { 
        id: 'vertical-platformer',
        source: 'Untitled-2.html', 
        dest: 'vertical-platformer.html'
      },
      { 
        id: 'poker-game',
        source: 'Untitled-3.html', 
        dest: 'poker-game.html',
        dependencies: [
          { source: 'Untitled-3.js', dest: 'poker-game.js' }
        ]
      },
      { 
        id: 'roulette',
        source: 'Untitled-4.html', 
        dest: 'roulette.html'
      },
      { 
        id: 'pixel-game',
        source: 'Untitled-5.html', 
        dest: 'pixel-game.html'
      },
      { 
        id: 'checkers',
        source: 'Untitled-6.html', 
        dest: 'checkers.html'
      },
      { 
        id: 'racing-game',
        source: 'untitled-7.html', 
        dest: 'racing-game.html',
        dependencies: [
          { source: 'untitled-7.js', dest: 'racing-game.js' }
        ]
      }
    ];

    // Copy each game file and its dependencies
    gamePaths.forEach(game => {
      try {
        // Create a directory for each game
        const gameDir = path.join(gamesDir, game.id);
        if (!fs.existsSync(gameDir)) {
          fs.mkdirSync(gameDir, { recursive: true });
        }

        // Copy main HTML file
        const sourcePath = path.join(__dirname, '..', 'resources', 'games', game.source);
        const destPath = path.join(gameDir, game.dest);
        
        // Read the source file
        let sourceContent = fs.readFileSync(sourcePath, 'utf8');
        
        // Modify HTML content to add blockchain integration code
        sourceContent = injectBlockchainIntegration(sourceContent, game.id);
        
        // Update script references for dependencies
        if (game.dependencies && game.dependencies.length > 0) {
          game.dependencies.forEach(dep => {
            // Replace references to the original JS files with new paths
            const scriptPattern = new RegExp(`<script.*?src=["']${dep.source}["'].*?></script>`, 'g');
            sourceContent = sourceContent.replace(scriptPattern, `<script src="/games/${game.id}/${dep.dest}"></script>`);
          });
        }
        
        // Write the modified content to the destination
        fs.writeFileSync(destPath, sourceContent);
        
        // Copy dependencies
        if (game.dependencies && game.dependencies.length > 0) {
          game.dependencies.forEach(dep => {
            const depSourcePath = path.join(__dirname, '..', 'resources', 'games', dep.source);
            const depDestPath = path.join(gameDir, dep.dest);
            fs.copyFileSync(depSourcePath, depDestPath);
          });
        }
        
        console.log(`Game ${game.id} copied successfully to public/games/${game.id}`);
      } catch (error) {
        console.error(`Error copying game ${game.id}:`, error);
      }
    });
  };

  // Inject blockchain integration code into HTML files
  const injectBlockchainIntegration = (htmlContent, gameId) => {
    // Add blockchain integration scripts
    const blockchainScript = `
      <!-- NetWork Blockchain Integration -->
      <script src="/js/blockchain-integration.js"></script>
      <script>
        // Initialize blockchain connection
        document.addEventListener('DOMContentLoaded', function() {
          // Get auth token from URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          const authToken = urlParams.get('auth');
          
          if (authToken) {
            // Initialize blockchain connection for this game session
            window.NetworkBlockchain = new NetworkBlockchainSDK({
              gameId: '${gameId}',
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
            rewardsBadge.innerHTML = \`
              <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #4f46e5; 
                          padding: 5px 10px; border-radius: 5px; font-family: Arial, sans-serif; z-index: 9999; 
                          display: flex; align-items: center; font-size: 14px;">
                <span style="margin-right: 5px;">◆</span> NetWork Blockchain Connected
              </div>
            \`;
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
    `;
    
    // Insert the blockchain integration scripts before the closing </body> tag
    return htmlContent.replace('</body>', `${blockchainScript}\n</body>`);
  };
  
  // Create API route for game rewards and blockchain interaction
  app.post('/api/games/rewards', (req, res) => {
    const { gameId, userId, action, amount, timestamp, signature } = req.body;
    
    // Verify the request is legitimate with the signature
    if (!verifySignature(gameId, userId, action, amount, timestamp, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process the reward on the blockchain
    try {
      // In a real implementation, this would call your blockchain service
      // to mint or transfer tokens to the user's wallet
      
      // For demo purposes, just log and return success
      console.log(`Processing ${amount} NET tokens for user ${userId} in game ${gameId}`);
      
      return res.status(200).json({
        success: true,
        transactionId: `0x${Math.random().toString(16).substring(2, 42)}`,
        reward: amount,
        balance: 1000 + amount // Placeholder value
      });
    } catch (error) {
      console.error('Error processing blockchain reward:', error);
      return res.status(500).json({ error: 'Failed to process blockchain reward' });
    }
  });
  
  // Function to verify the signature of game reward requests
  const verifySignature = (gameId, userId, action, amount, timestamp, signature) => {
    // In a real implementation, this would verify a cryptographic signature
    // For demo purposes, we'll just do basic validation
    
    // Check if required fields are present
    if (!gameId || !userId || !action || !amount || !timestamp || !signature) {
      return false;
    }
    
    // Check if timestamp is recent (within 5 minutes)
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    if (now - timestamp > maxAge) {
      return false;
    }
    
    // Additional validation would go here in a real implementation
    
    return true;
  };

  // Serve static game files
  app.use('/games', express.static(path.join(__dirname, '../public/games')));
  
  // Copy games during server startup
  copyGameFiles();
  
  console.log('Game routes and files set up successfully');
};

module.exports = setupGameRoutes;