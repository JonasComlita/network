import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserProfile = ({ token }) => {
    const [user, setUser] = useState({});
    const [bio, setBio] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const response = await axios.get('http://localhost:8000/api/profile/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUser(response.data);
            setBio(response.data.bio);
        };
        fetchUserProfile();
    }, [token]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('bio', bio);
        if (profilePicture) {
            formData.append('profile_picture', profilePicture);
        }

        await axios.patch('http://localhost:8000/api/profile/', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        alert('Profile updated successfully!');
    };

    return (
        <form onSubmit={handleProfileUpdate}>
            <h2>User Profile</h2>
            <img src={user.profile_picture} alt="Profile" width="100" />
            <input
                type="text"
                placeholder="Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
            />
            <input
                type="file"
                onChange={(e) => setProfilePicture(e.target.files[0])}
            />
            <button type="submit">Update Profile</button>
        </form>
    );
};

export default UserProfile;
