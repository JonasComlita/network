import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import TransactionList from './TransactionList';

// Register all components
Chart.register(...registerables);

const BlockchainChart = () => {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    const token = localStorage.getItem('token'); // Example of retrieving token from local storage

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/blocks/', {
                    headers: {
                        Authorization: `Bearer ${token}`, // Use the retrieved token
                    },
                });
                setBlocks(response.data);
            } catch (error) {
                console.error('Error fetching blocks:', error);
            }
        };
        fetchBlocks();

        const socket = new WebSocket('ws://localhost:8000/ws/blocks/');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Handle the incoming block update
            fetchBlocks(); // Re-fetch blocks or update state accordingly
        };

        return () => {
            socket.close();
        };
    }, [token]);

    useEffect(() => {
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            // Create your chart here
        }
    }, [blocks]); // Ensure this runs when data changes

    const filteredBlocks = blocks.filter(block => 
        block.index.toString().includes(searchTerm) || 
        new Date(block.timestamp).toLocaleString().includes(searchTerm)
    );

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/data/');
            // Handle response
        } catch (error) {
            console.error('Error fetching data:', error.response ? error.response.data : error.message);
        }
    };

    return (
        <div>
            <h2>Blockchain Data</h2>
            <input
                type="text"
                placeholder="Search blocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border p-2 mb-4"
            />
            {filteredBlocks && filteredBlocks.length > 0 ? (
                <canvas ref={chartRef} />
            ) : (
                <p>Loading...</p>
            )}
            <h3 className="mt-4">Blocks</h3>
            <ul>
                {filteredBlocks.map(block => (
                    <li key={block.id} className="border-b py-2 cursor-pointer" onClick={() => setSelectedBlockId(block.id)}>
                        Block {block.index} - {new Date(block.timestamp).toLocaleString()}
                    </li>
                ))}
            </ul>
            {selectedBlockId && <TransactionList blockId={selectedBlockId} />}
        </div>
    );
};

export default BlockchainChart;
