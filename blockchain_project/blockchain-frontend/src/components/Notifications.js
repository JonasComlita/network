import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            const response = await axios.get('http://localhost:8000/api/notifications/');
            setNotifications(response.data);
        };
        fetchNotifications();
    }, []);

    return (
        <div>
            <h2>Your Notifications</h2>
            <ul>
                {notifications.map((notification) => (
                    <li key={notification.id}>
                        {notification.price_change} at {new Date(notification.timestamp).toLocaleString()}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Notifications;
