/**
 * NetWork Blockchain SDK for Game Integration
 * This file provides the JavaScript SDK for integrating games with the NetWork blockchain
 */

class NetworkBlockchainSDK {
    /**
     * Initialize the NetWork Blockchain SDK
     * @param {Object} options - Configuration options
     * @param {string} options.gameId - The ID of the game
     * @param {string} options.authToken - Authentication token for the user
     * @param {string} options.environment - Environment to use (development, staging, production)
     */
    constructor(options) {
      this.gameId = options.gameId;
      this.authToken = options.authToken;
      this.environment = options.environment || 'development';
      this.apiUrl = this.getApiUrl();
      this.sessionStartTime = null;
      this.rewards = {
        pending: 0,
        confirmed: 0,
        transactions: []
      };
      this.eventListeners = [];
      
      // Parse auth token to get user info
      try {
        const tokenData = JSON.parse(atob(options.authToken));
        this.userId = tokenData.userId;
        this.timestamp = tokenData.timestamp;
      } catch (error) {
        console.error('Invalid auth token format:', error);
        this.userId = 'anonymous';
        this.timestamp = Date.now();
      }
      
      console.log(`NetworkBlockchainSDK initialized for game ${this.gameId} and user ${this.userId}`);
    }
    
    /**
     * Get the API URL based on the environment
     * @returns {string} The API URL
     */
    getApiUrl() {
      switch (this.environment) {
        case 'production':
          return '/api/games';
        case 'staging':
          return 'https://staging-api.network.io/api/games';
        case 'development':
        default:
          return 'http://localhost:3000/api/games';
      }
    }
    
    /**
     * Start tracking a game session
     * @returns {Promise<Object>} The session information
     */
    async startGameSession() {
      this.sessionStartTime = Date.now();
      
      // Record the session start on the blockchain
      try {
        const response = await fetch(`${this.apiUrl}/session/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            gameId: this.gameId,
            userId: this.userId,
            timestamp: this.sessionStartTime,
            signature: this.generateSignature('session_start')
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to start session: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Game session started on blockchain:', data);
        
        // Update UI with session info
        this.updateRewardsBadge();
        
        return data;
      } catch (error) {
        console.error('Error starting game session:', error);
        // Continue anyway to not disrupt gameplay
        return { error: error.message };
      }
    }
    
    /**
     * End the current game session
     * @returns {Promise<Object>} The session summary
     */
    async endGameSession() {
      if (!this.sessionStartTime) {
        console.warn('No active session to end');
        return { error: 'No active session' };
      }
      
      const sessionEndTime = Date.now();
      const sessionDuration = sessionEndTime - this.sessionStartTime;
      
      // Record the session end on the blockchain
      try {
        const response = await fetch(`${this.apiUrl}/session/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            gameId: this.gameId,
            userId: this.userId,
            startTime: this.sessionStartTime,
            endTime: sessionEndTime,
            duration: sessionDuration,
            pendingRewards: this.rewards.pending,
            signature: this.generateSignature('session_end')
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to end session: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Game session ended on blockchain:', data);
        
        // Process any pending rewards
        if (this.rewards.pending > 0) {
          await this.processRewards();
        }
        
        return data;
      } catch (error) {
        console.error('Error ending game session:', error);
        return { error: error.message };
      }
    }
    
    /**
     * Award tokens to the player
     * @param {number} amount - The amount of tokens to award
     * @param {string} reason - The reason for the reward
     * @returns {Promise<Object>} The reward transaction information
     */
    async awardTokens(amount, reason) {
      if (!amount || amount <= 0) {
        console.warn('Invalid reward amount:', amount);
        return { error: 'Invalid reward amount' };
      }
      
      // Add to pending rewards
      this.rewards.pending += amount;
      this.updateRewardsBadge();
      
      // Process rewards immediately if above threshold
      if (this.rewards.pending >= 10) {
        return this.processRewards(reason);
      }
      
      return { 
        status: 'pending',
        amount: amount,
        pending: this.rewards.pending
      };
    }
    
    /**
     * Process all pending rewards
     * @param {string} reason - The reason for the rewards
     * @returns {Promise<Object>} The reward transaction information
     */
    async processRewards(reason = 'gameplay') {
      if (this.rewards.pending <= 0) {
        return { status: 'no_pending_rewards' };
      }
      
      const rewardAmount = this.rewards.pending;
      
      try {
        const response = await fetch(`${this.apiUrl}/rewards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            gameId: this.gameId,
            userId: this.userId,
            action: reason,
            amount: rewardAmount,
            timestamp: Date.now(),
            signature: this.generateSignature('reward')
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to process rewards: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Processed ${rewardAmount} NET tokens reward:`, data);
        
        // Update rewards tracking
        this.rewards.confirmed += rewardAmount;
        this.rewards.pending = 0;
        this.rewards.transactions.push({
          amount: rewardAmount,
          reason: reason,
          timestamp: Date.now(),
          transactionId: data.transactionId
        });
        
        // Show a reward notification
        this.showRewardNotification(rewardAmount);
        
        // Update UI
        this.updateRewardsBadge();
        
        return data;
      } catch (error) {
        console.error('Error processing rewards:', error);
        return { error: error.message };
      }
    }
    
    /**
     * Generate a signature for blockchain transactions
     * @param {string} action - The action being performed
     * @returns {string} The generated signature
     */
    generateSignature(action) {
      // In a real implementation, this would use proper cryptographic signing
      // For this demo, we'll just create a simple hash
      const data = `${this.gameId}:${this.userId}:${action}:${Date.now()}`;
      return btoa(data); // Base64 encoding as a simple "signature"
    }
    
    /**
     * Set up event listeners for game-specific events
     */
    setupEventListeners() {
      // Common game events to listen for
      const gameSpecificSetup = {
        'pygame-zero': () => {
          // For the Pygame Zero game, award tokens when the player clicks
          document.addEventListener('click', () => {
            this.awardTokens(0.1, 'interaction');
          });
        },
        'vertical-platformer': () => {
          // For platformer, monitor jump events and height reached
          const checkHeight = setInterval(() => {
            const platformerScore = window.scrollY || 0;
            if (platformerScore > 1000) {
              this.awardTokens(5, 'achievement');
              clearInterval(checkHeight);
            }
          }, 1000);
          
          this.eventListeners.push(() => clearInterval(checkHeight));
        },
        'poker-game': () => {
          // For poker, track hands won
          const originalDisplayGameState = window.displayGameState;
          if (typeof originalDisplayGameState === 'function') {
            window.displayGameState = (...args) => {
              const result = originalDisplayGameState.apply(this, args);
              
              // Check if player won
              if (document.body.innerHTML.includes('You won')) {
                this.awardTokens(2, 'game_win');
              }
              
              return result;
            };
          }
        },
        'roulette': () => {
          // For roulette, track wins
          const originalCheckResult = window.checkResult;
          if (typeof originalCheckResult === 'function') {
            window.checkResult = (winningNumber) => {
              const result = originalCheckResult(winningNumber);
              
              // Check if player won
              if (document.getElementById('result').textContent.includes('won')) {
                const winAmount = parseFloat(document.getElementById('result').textContent.match(/\$(\d+(\.\d+)?)/)[1]);
                this.awardTokens(winAmount / 10, 'game_win'); // 10% of winnings as NET tokens
              }
              
              return result;
            };
          }
        },
        'pixel-game': () => {
          // For pixel game, award tokens for finding the winning pixel
          const handleWin = (e) => {
            if (e.target.textContent && e.target.textContent.includes('winner')) {
              this.awardTokens(10, 'achievement');
            }
          };
          
          document.addEventListener('click', handleWin);
          this.eventListeners.push(() => document.removeEventListener('click', handleWin));
        },
        'checkers': () => {
          // For checkers, set up a timer to award tokens for time played
          const playTimer = setInterval(() => {
            this.awardTokens(0.5, 'playtime');
          }, 60000); // Award 0.5 NET every minute
          
          this.eventListeners.push(() => clearInterval(playTimer));
        },
        'racing-game': () => {
          // For racing game, award tokens for completing laps
          const originalCompleteLap = window.completeLap;
          if (typeof originalCompleteLap === 'function') {
            window.completeLap = () => {
              const result = originalCompleteLap();
              this.awardTokens(5, 'lap_completion');
              return result;
            };
          }
        }
      };
      
      // Set up game-specific event listeners
      if (gameSpecificSetup[this.gameId]) {
        gameSpecificSetup[this.gameId]();
      } else {
        console.log(`No specific event setup for game ${this.gameId}`);
        
        // Generic playtime rewards
        const playTimer = setInterval(() => {
          this.awardTokens(0.2, 'playtime');
        }, 60000); // Award 0.2 NET every minute
        
        this.eventListeners.push(() => clearInterval(playTimer));
      }
    }
    
    /**
     * Show a reward notification to the player
     * @param {number} amount - The amount of the reward
     */
    showRewardNotification(amount) {
      const notification = document.createElement('div');
      notification.className = 'network-reward-notification';
      notification.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.85); color: #10B981; 
                    padding: 10px 15px; border-radius: 5px; font-family: Arial, sans-serif; z-index: 9999; 
                    display: flex; align-items: center; font-size: 16px; animation: fadeInOut 5s forwards;">
          <span style="margin-right: 8px; font-size: 20px;">+</span> ${amount} NET tokens earned!
        </div>
      `;
      
      // Add animation styles
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(20px); }
          10% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(notification);
      
      // Remove notification after animation
      setTimeout(() => {
        notification.remove();
      }, 5000);
    }
    
    /**
     * Update the rewards badge in the UI
     */
    updateRewardsBadge() {
      const badge = document.querySelector('.network-blockchain-badge');
      if (badge) {
        badge.innerHTML = `
          <div style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #4f46e5; 
                      padding: 5px 10px; border-radius: 5px; font-family: Arial, sans-serif; z-index: 9999; 
                      display: flex; align-items: center; font-size: 14px;">
            <span style="margin-right: 5px;">◆</span> 
            NetWork Connected | ${this.rewards.confirmed} NET earned
            ${this.rewards.pending > 0 ? ` | <span style="color: #10B981;">+${this.rewards.pending} pending</span>` : ''}
          </div>
        `;
      }
    }
    
    /**
     * Clean up event listeners when the SDK is no longer needed
     */
    cleanup() {
      // Remove all registered event listeners
      this.eventListeners.forEach(cleanup => cleanup());
      this.eventListeners = [];
    }
  }
  
  // Handle window close/navigation to process rewards
  window.addEventListener('beforeunload', () => {
    if (window.NetworkBlockchain) {
      window.NetworkBlockchain.processRewards('session_end');
    }
  });