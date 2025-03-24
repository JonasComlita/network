import React, { useEffect, useRef } from 'react';

const BlockchainVisualization = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const blocksRef = useRef([]);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    const updateCanvasSize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    
    updateCanvasSize();
    
    // Block properties
    const maxBlocks = 15;
    const blockWidth = 80;
    const blockHeight = 50;
    const blockSpacing = 40;
    
    // Add initial blocks
    const addInitialBlocks = () => {
      blocksRef.current = [];
      for (let i = 0; i < 10; i++) {
        addBlock();
      }
    };
    
    // Function to add a new block
    const addBlock = () => {
      // If we have max blocks, remove the first one
      if (blocksRef.current.length >= maxBlocks) {
        blocksRef.current.shift();
      }
      
      // Create new block
      const block = {
        id: Math.floor(Math.random() * 10000000),
        hash: generateRandomHash(),
        transactions: Math.floor(Math.random() * 20) + 1,
        x: canvas.width + blockWidth,
        y: canvas.height / 2 - blockHeight / 2,
        color: `rgb(${70 + Math.random() * 30}, ${70 + Math.random() * 20}, ${200 + Math.random() * 55})`,
        lineColor: `rgba(${79 + Math.random() * 20}, ${70 + Math.random() * 10}, ${229 + Math.random() * 26}, 0.8)`,
        size: 0,
        targetSize: 1
      };
      
      blocksRef.current.push(block);
    };
    
    // Generate random hash string
    const generateRandomHash = () => {
      let hash = '0x';
      const characters = '0123456789abcdef';
      
      for (let i = 0; i < 12; i++) {
        hash += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      return hash;
    };
    
    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw blocks and connections
      blocksRef.current.forEach((block, index) => {
        // Update position (blocks move from right to left)
        block.x += (canvas.width - (blocksRef.current.length - index) * (blockWidth + blockSpacing) - block.x) * 0.05;
        
        // Update size (for block creation animation)
        block.size += (block.targetSize - block.size) * 0.1;
        
        // Draw connection line between blocks
        if (index > 0) {
          const prevBlock = blocksRef.current[index - 1];
          
          ctx.beginPath();
          ctx.strokeStyle = block.lineColor;
          ctx.lineWidth = 2;
          
          // Create a slightly curved line
          ctx.moveTo(prevBlock.x + blockWidth, prevBlock.y + blockHeight/2);
          ctx.lineTo(block.x, block.y + blockHeight/2);
          
          // Add small circles to show data transmission
          const numPoints = 3;
          for(let i = 0; i < numPoints; i++) {
            const t = (Date.now() / 1000 + i * 0.3) % 1;
            const pointX = prevBlock.x + blockWidth + (block.x - prevBlock.x - blockWidth) * t;
            const pointY = prevBlock.y + blockHeight/2;
            
            ctx.fillStyle = `rgba(79, 70, 229, ${0.7 - t * 0.7})`;
            ctx.beginPath();
            ctx.arc(pointX, pointY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.stroke();
        }
        
        // Draw block
        const actualWidth = blockWidth * block.size;
        const actualHeight = blockHeight * block.size;
        const x = block.x + (blockWidth - actualWidth) / 2;
        const y = block.y + (blockHeight - actualHeight) / 2;
        
        // Block background
        ctx.fillStyle = block.color;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(x, y, actualWidth, actualHeight);
        
        // Block border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, actualWidth, actualHeight);
        
        // Reset alpha
        ctx.globalAlpha = 1;
        
        // Block text
        if (block.size > 0.7) {
          ctx.fillStyle = 'white';
          ctx.font = '10px Inter, Arial, sans-serif';
          ctx.fillText(`Block #${block.id}`, x + 5, y + 15);
          ctx.fillText(`${block.hash.substring(0, 8)}...`, x + 5, y + 30);
          ctx.fillText(`Txs: ${block.transactions}`, x + 5, y + 45);
        }
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Initialize
    addInitialBlocks();
    animate();
    
    // Add new blocks periodically
    const blockInterval = setInterval(addBlock, 3000);
    
    // Handle window resize
    window.addEventListener('resize', updateCanvasSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationRef.current);
      clearInterval(blockInterval);
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="relative overflow-hidden rounded-lg bg-gray-900 border border-gray-800 h-96 mb-8"
    >
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-gradient-to-b from-gray-900/60 to-transparent pointer-events-none p-6">
        <h3 className="text-xl font-semibold text-white mb-2">Live Blockchain Visualization</h3>
        <p className="text-gray-300 text-center max-w-lg">Watch transactions and blocks being added to the chain in real-time</p>
      </div>
    </div>
  );
};

export default BlockchainVisualization;
