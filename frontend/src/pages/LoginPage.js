import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [emailStyle, setEmailStyle] = useState(styles.input);
    const [passwordStyle, setPasswordStyle] = useState(styles.input);

    const handleEmailFocus = () => {
        setEmailStyle({ ...styles.input, ...styles.inputGroupFocus });
    };

    const handleEmailBlur = () => {
        setEmailStyle(styles.input);
    };

    const handlePasswordFocus = () => {
        setPasswordStyle({ ...styles.input, ...styles.inputGroupFocus });
    };

    const handlePasswordBlur = () => {
        setPasswordStyle(styles.input);
    };

    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const buttonStyle = {
        marginTop: '20px',
        width: '40%',
        padding: '20px',
        backgroundColor: 'Black',
        color: '#fff',
        border: 'none',
        borderRadius: '100px',
        cursor: 'pointer',
        fontSize: '25px',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.01s ease',
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5000/auth/login', { email, password });
            const { token } = response.data;

            // Save token to localStorage
            localStorage.setItem('authToken', token);

            // Navigate to home or dashboard
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    return (
        <div style={styles.container}>
            <form style={styles.form} onSubmit={handleLogin}>
                <h2 style={styles.h2}>Login</h2>
                {error && <p style={styles.error}>{error}</p>}
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        style={emailStyle}
                        onFocus={handleEmailFocus}
                        onBlur={handleEmailBlur}
                    />
                </div>
                <div style={styles.inputGroup}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        style={passwordStyle}
                        onFocus={handlePasswordFocus}
                        onBlur={handlePasswordBlur}
                    />
                </div>
                <button
                    type="submit"
                    style={buttonStyle}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    Login
                </button>
                <p style={styles.linkText}>
                    Don't have an account? <a href="/register">Register</a>
                </p>
            </form>
        </div>
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
        height: '100vh',
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
    inputGroup: {
        marginBottom: '20px',
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
    error: {
        color: 'red',
        marginBottom: '10px',
    },
    linkText: {
        marginTop: '20px',
        fontSize: '16px',
    },
};

export default LoginPage;
