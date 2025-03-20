// src/components/WebSocketTest.js
import React, { useEffect, useState } from 'react';

const WebSocketTest = () => {
  const [status, setStatus] = useState('disconnected');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create WebSocket connection
    console.log('Attempting to connect to test WebSocket...');
    setStatus('connecting');
    
    const socket = new WebSocket('ws://localhost:8000/ws/test/');
    
    socket.onopen = () => {
      console.log('Test WebSocket connected');
      setStatus('connected');
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      setMessage(data);
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
      setError(error);
    };
    
    socket.onclose = (event) => {
      console.log('WebSocket closed:', event);
      setStatus('disconnected');
    };
    
    // Cleanup
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  return (
    <div className="p-4 border rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">WebSocket Test</h2>
      
      <div className="mb-4">
        <strong>Status: </strong>
        <span className={
          status === 'connected' ? 'text-green-600' :
          status === 'connecting' ? 'text-yellow-600' :
          'text-red-600'
        }>
          {status}
        </span>
      </div>
      
      {message && (
        <div className="mb-4">
          <strong>Last Message:</strong>
          <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
            {JSON.stringify(message, null, 2)}
          </pre>
        </div>
      )}
      
      {error && (
        <div className="text-red-600">
          <strong>Error:</strong>
          <p>{String(error)}</p>
        </div>
      )}
    </div>
  );
};

export default WebSocketTest;