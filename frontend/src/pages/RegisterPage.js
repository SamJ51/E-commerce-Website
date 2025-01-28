import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [usernameStyle, setUsernameStyle] = useState(styles.input);
    const [emailStyle, setEmailStyle] = useState(styles.input);
    const [passwordStyle, setPasswordStyle] = useState(styles.input);

    const handleFocus = (setStyle) => {
        setStyle({ ...styles.input, ...styles.inputGroupFocus });
    };

    const handleBlur = (setStyle) => {
        setStyle(styles.input);
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

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5000/auth/register', {
                username,
                email,
                password,
                role_id: 1,
            });

            // Navigate to login or dashboard after successful registration
            navigate('/login');
        } catch (err) {
            console.error("Registration Error:", err); // Log the full error object
            setError(err.response?.data?.message || 'Something went wrong');
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(err.response.data);
                console.log(err.response.status);
                console.log(err.response.headers);
            } else if (err.request) {
                // The request was made but no response was received
                // `err.request` is an instance of XMLHttpRequest in the browser and an instance of
                // http.ClientRequest in node.js
                console.log(err.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', err.message);
            }
        }
    };

    return (
        <div style={styles.container}>
            <form style={styles.form} onSubmit={handleRegister}>
                <h2 style={styles.h2}>Register</h2>
                {error && <p style={styles.error}>{error}</p>}
                <div>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        style={usernameStyle}
                        onFocus={() => handleFocus(setUsernameStyle)}
                        onBlur={() => handleBlur(setUsernameStyle)}
                    />
                </div>
                <div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        style={emailStyle}
                        onFocus={() => handleFocus(setEmailStyle)}
                        onBlur={() => handleBlur(setEmailStyle)}
                    />
                </div>
                <div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        style={passwordStyle}
                        onFocus={() => handleFocus(setPasswordStyle)}
                        onBlur={() => handleBlur(setPasswordStyle)}
                    />
                </div>
                <button
                    type="submit"
                    style={buttonStyle}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    Register
                </button>
                <p style={styles.linkText}>
                    Already have an account?{' '}
                    <a style={styles.link} href="/login">
                        Login
                    </a>
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
        color: 'black',
    },
};

export default RegisterPage;
