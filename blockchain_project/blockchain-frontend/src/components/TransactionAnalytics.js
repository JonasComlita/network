import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TransactionAnalytics = () => {
    const [analytics, setAnalytics] = useState({});

    useEffect(() => {
        const fetchAnalytics = async () => {
            const response = await axios.get('http://localhost:8000/api/analytics/');
            setAnalytics(response.data);
        };
        fetchAnalytics();
    }, []);

    return (
        <div>
            <h2>Transaction Analytics</h2>
            <p>Total Transactions: {analytics.total_transactions}</p>
            <p>Total Amount: {analytics.total_amount}</p>
            <p>Average Amount: {analytics.average_amount}</p>
        </div>
    );
};

export default TransactionAnalytics;
