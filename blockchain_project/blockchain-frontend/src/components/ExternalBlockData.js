import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ExternalBlockData = () => {
    const [blockData, setBlockData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get('http://localhost:8000/api/external/block/');
            setBlockData(response.data);
        };
        fetchData();
    }, []);

    return (
        <div>
            <h3>External Block Data</h3>
            {blockData ? (
                <div>
                    <p>Hash: {blockData.hash}</p>
                    <p>Time: {new Date(blockData.time * 1000).toLocaleString()}</p>
                    <p>Height: {blockData.height}</p>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default ExternalBlockData;
