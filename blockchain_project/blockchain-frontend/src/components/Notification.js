import React, { useEffect, useState } from 'react';

const Notification = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8000/ws/transactions/');

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setNotifications(prev => [...prev, data.message]);
        };

        return () => {
            socket.close();
        };
    }, []);

    return (
        <div>
            <h3>Notifications</h3>
            <ul>
                {notifications.map((note, index) => (
                    <li key={index}>{note}</li>
                ))}
            </ul>
        </div>
    );
};

export default Notification;
