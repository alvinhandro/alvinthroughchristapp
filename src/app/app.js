// --- src/context/AuthContext.js (NEW) ---
// This context will manage the JWT and user state.

import React, { useState, useEffect, createContext, useContext } from 'react';
import { jwtVerify } from 'jose'; // npm install jose

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null); // Will hold decoded token payload
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        localStorage.setItem('token', token);
        
        const verifyToken = async () => {
            if (token) {
                try {
                    // This is a simplified verification for the client-side.
                    // The real verification happens on the server.
                    // We just decode it here to get the user ID (`sub`).
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    
                    setUser(JSON.parse(jsonPayload));

                } catch (e) {
                    console.error("Invalid token:", e);
                    setToken(null);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setIsAuthReady(true);
        };

        verifyToken();

    }, [token]);

    const login = (newToken) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAuthReady }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);


// --- src/App.js (UPDATED) ---
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppBody from './components/AppBody'; // Assuming you structure components

export default function App() {
    return (
        <AuthProvider>
            <AppBody />
        </AuthProvider>
    );
}


// --- src/components/AuthScreen.js (UPDATED) ---
// An example of how the AuthScreen would change.

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const url = isLogin ? '/api/login' : '/api/register';
        const body = isLogin ? { email, password } : { email, username, password };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'An error occurred.');
            }

            if (isLogin) {
                login(data.token);
            } else {
                // Automatically switch to login view after successful registration
                setIsLogin(true);
                alert('Registration successful! Please log in.');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // ... JSX for the form remains mostly the same ...
    return (
        <div>
            <h1>{isLogin ? 'Login' : 'Register'}</h1>
            <form onSubmit={handleAuthAction}>
                {/* Form inputs for email, password, username */}
                <button type="submit" disabled={loading}>
                    {loading ? '...' : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>
            </form>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <button onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Need an account?' : 'Already have an account?'}
            </button>
        </div>
    );
};

// You would need to update all other components (Verse, Profile, etc.)
// to use `fetch` with the Authorization header, like this:
/*
async function likeVerse() {
    const response = await fetch(`/api/verse/.../like`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    // ... handle response
}
*/
                                                      
