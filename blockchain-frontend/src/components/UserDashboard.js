import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserDashboard = ({ token }) => {
    const [dashboardData, setDashboardData] = useState({});

    useEffect(() => {
        const fetchDashboardData = async () => {
            const response = await axios.get('http://localhost:8000/api/dashboard/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setDashboardData(response.data);
        };
        fetchDashboardData();
    }, [token]);

    return (
        <div>
            <h2>User Dashboard</h2>
            <p>Total Transactions: {dashboardData.total_transactions}</p>
            <p>Total Amount: {dashboardData.total_amount}</p>
            <h3>Your Transactions</h3>
            <ul>
                {dashboardData.transactions && dashboardData.transactions.map(tx => (
                    <li key={tx.id}>
                        From: {tx.sender}, To: {tx.recipient}, Amount: {tx.amount}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserDashboard;
