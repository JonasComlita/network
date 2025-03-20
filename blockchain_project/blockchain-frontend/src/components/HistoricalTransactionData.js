import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

const HistoricalTransactionData = ({ token }) => {
    const [historicalData, setHistoricalData] = useState([]);

    useEffect(() => {
        const fetchHistoricalData = async () => {
            const response = await axios.get('http://localhost:8000/api/historical-transactions/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setHistoricalData(response.data);
        };
        fetchHistoricalData();
    }, [token]);

    const data = {
        labels: historicalData.map(data => data.created_at__date),
        datasets: [
            {
                label: 'Total Amount',
                data: historicalData.map(data => data.total_amount),
                borderColor: 'rgba(75,192,192,1)',
                fill: false,
            },
        ],
    };

    return (
        <div>
            <h2>Historical Transaction Data</h2>
            <Line data={data} />
        </div>
    );
};

export default HistoricalTransactionData;
