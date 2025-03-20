import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import TransactionList from './TransactionList';

const BlockchainChart = () => {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchBlocks = async () => {
            const response = await axios.get('http://localhost:8000/api/blocks/');
            setBlocks(response.data);
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
    }, []);

    const filteredBlocks = blocks.filter(block => 
        block.index.toString().includes(searchTerm) || 
        new Date(block.timestamp).toLocaleString().includes(searchTerm)
    );

    const chartData = {
        labels: filteredBlocks.map(block => new Date(block.timestamp).toLocaleString()),
        datasets: [
            {
                label: 'Block Index',
                data: filteredBlocks.map(block => block.index),
                borderColor: 'rgba(75,192,192,1)',
                fill: false,
            },
        ],
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
            <Line data={chartData} />
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
