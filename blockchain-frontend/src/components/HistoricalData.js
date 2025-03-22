import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HistoricalData = ({ token }) => {
    const [historicalData, setHistoricalData] = useState([]);

    useEffect(() => {
        const fetchHistoricalData = async () => {
            const response = await axios.get('http://localhost:8000/api/historical-data/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setHistoricalData(response.data);
        };
        fetchHistoricalData();
    }, [token]);

    return (
        <div>
            <h2>Historical Data</h2>
            <ul>
                {historicalData.map(data => (
                    <li key={data.created_at__date}>
                        Date: {data.created_at__date}, Total Amount: {data.total_amount}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default HistoricalData;
