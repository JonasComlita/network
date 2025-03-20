import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NotificationList = ({ token }) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            const response = await axios.get('http://localhost:8000/api/notifications/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setNotifications(response.data);
        };
        fetchNotifications();
    }, [token]);

    const markAsRead = async (id) => {
        await axios.patch(`http://localhost:8000/api/notifications/${id}/`, { is_read: true }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        setNotifications(notifications.filter(notification => notification.id !== id));
    };

    return (
        <div>
            <h2>Notifications</h2>
            <ul>
                {notifications.map(notification => (
                    <li key={notification.id} className={`border-b py-2 ${notification.is_read ? 'text-gray-500' : ''}`}>
                        <p>{notification.message}</p>
                        <button onClick={() => markAsRead(notification.id)}>Mark as Read</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default NotificationList;
