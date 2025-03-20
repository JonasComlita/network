import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdvancedAnalytics = ({ token }) => {
    const [analytics, setAnalytics] = useState({});

    useEffect(() => {
        const fetchAnalytics = async () => {
            const response = await axios.get('http://localhost:8000/api/advanced-analytics/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setAnalytics(response.data);
        };
        fetchAnalytics();
    }, [token]);

    return (
        <div>
            <h2>Advanced Analytics</h2>
            <p>Total Transactions: {analytics.total_transactions}</p>
            <p>Total Amount: {analytics.total_amount}</p>
            <p>Average Amount: {analytics.average_amount}</p>
            <p>Your Total Amount: {analytics.user_total_amount}</p>
            <p>Your Average Amount: {analytics.user_average_amount}</p>
        </div>
    );
};

export default AdvancedAnalytics;
