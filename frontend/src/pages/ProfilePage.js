import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../components/NavBar';

const ProfilePage = () => {
    const [profile, setProfile] = useState({ username: '', email: '' });
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [usernameStyle, setUsernameStyle] = useState(styles.input);
    const [emailStyle, setEmailStyle] = useState(styles.input);

    const handleFocus = (setStyle) => {
        setStyle({ ...styles.input, ...styles.inputGroupFocus });
    };

    const handleBlur = (setStyle) => {
        setStyle(styles.input);
    };

    useEffect(() => {
        // Fetch user profile on component load
        const fetchProfile = async () => {
            try {
                const response = await axios.get('http://localhost:5000/user/profile', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
                });
                setProfile(response.data);
            } catch (err) {
                setError('Failed to fetch profile.');
            }
        };

        fetchProfile();
    }, []);

    const handleSave = async () => {
        try {
            const response = await axios.patch('http://localhost:5000/user/profile', profile, {
                headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
            });
            setProfile(response.data);
            setEditing(false);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError('Failed to update profile.');
        }
    };

    return (
        <><NavBar /><div style={styles.container}>

            <div style={styles.form}>
                <h2 style={styles.h2}>Profile</h2>
                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>{success}</p>}
                <div>
                    <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        disabled={!editing}
                        style={usernameStyle}
                        onFocus={() => handleFocus(setUsernameStyle)}
                        onBlur={() => handleBlur(setUsernameStyle)}
                        placeholder="Username" />
                </div>
                <div>
                    <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled={!editing}
                        style={emailStyle}
                        onFocus={() => handleFocus(setEmailStyle)}
                        onBlur={() => handleBlur(setEmailStyle)}
                        placeholder="Email" />
                </div>
                {editing ? (
                    <button
                        onClick={handleSave}
                        style={styles.button}
                    >
                        Save
                    </button>
                ) : (
                    <button
                        onClick={() => setEditing(true)}
                        style={styles.button}
                    >
                        Edit Profile
                    </button>
                )}
            </div>
        </div></>
    );
};

const styles = {
    h2: {
        color: 'black',
        textAlign: 'center',
        fontSize: '50px',
        marginBottom: '50px',
        marginTop: '0',
    },
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '92vh',
        backgroundColor: '#f5f5f5',
        textAlign: 'center',
    },
    form: {
        width: '500px',
        padding: '30px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        borderRadius: '30px',
    },
    input: {
        width: '80%',
        padding: '10px',
        boxSizing: 'border-box',
        borderRadius: '5px',
        border: '1px solid #ccc',
        fontSize: '16px',
        color: 'Black',
        marginBottom: '10px',
        marginTop: '5px',
    },
    inputGroupFocus: {
        borderColor: 'rgba(0, 132, 255, 0.8)',
        outline: 'none',
        boxShadow: '0 0 10px rgba(0, 132, 255, 0.8)',
    },
    button: {
        marginTop: '20px',
        width: '40%',
        padding: '20px',
        backgroundColor: 'Black',
        color: '#fff',
        border: 'none',
        borderRadius: '100px',
        cursor: 'pointer',
        fontSize: '25px',
        transform: 'scale(1)',
        transition: 'all 0.01s ease',
    },
    error: {
        color: 'red',
        marginBottom: '10px',
    },
    success: {
        color: 'green',
        marginBottom: '10px',
    },
};

export default ProfilePage;
