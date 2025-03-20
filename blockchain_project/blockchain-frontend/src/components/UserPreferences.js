import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserPreferences = ({ token }) => {
    const [preferences, setPreferences] = useState({
        notify_price_changes: true,
        notify_transaction_updates: true,
    });

    useEffect(() => {
        const fetchUserPreferences = async () => {
            const response = await axios.get('http://localhost:8000/api/profile/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setPreferences({
                notify_price_changes: response.data.notify_price_changes,
                notify_transaction_updates: response.data.notify_transaction_updates,
            });
        };
        fetchUserPreferences();
    }, [token]);

    const handleUpdatePreferences = async (e) => {
        e.preventDefault();
        await axios.patch('http://localhost:8000/api/profile/', preferences, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        alert('Preferences updated successfully!');
    };

    return (
        <form onSubmit={handleUpdatePreferences}>
            <h2>User Preferences</h2>
            <label>
                <input
                    type="checkbox"
                    checked={preferences.notify_price_changes}
                    onChange={(e) => setPreferences({ ...preferences, notify_price_changes: e.target.checked })}
                />
                Notify me of price changes
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={preferences.notify_transaction_updates}
                    onChange={(e) => setPreferences({ ...preferences, notify_transaction_updates: e.target.checked })}
                />
                Notify me of transaction updates
            </label>
            <button type="submit">Update Preferences</button>
        </form>
    );
};

export default UserPreferences;
