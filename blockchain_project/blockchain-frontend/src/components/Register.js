import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isMiner, setIsMiner] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8000/api/register/', { username, email, password, is_admin: isAdmin, is_miner: isMiner });
            alert('Registration successful!');
        } catch (error) {
            const errorMessage = error.response ? error.response.data.detail || error.message : 'An error occurred';
            alert('Registration failed: ' + errorMessage);
        }
    };

    return (
        <form onSubmit={handleRegister}>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <label>
                <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                />
                Admin
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={isMiner}
                    onChange={(e) => setIsMiner(e.target.checked)}
                />
                Miner
            </label>
            <button type="submit">Register</button>
        </form>
    );
};

export default Register;
