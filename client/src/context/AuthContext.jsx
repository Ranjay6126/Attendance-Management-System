// Global auth state and context
import { createContext, useState, useEffect, useContext } from 'react';
// Preconfigured axios client with token injection
import axios from '../api/axios';
// Navigation is not used here; provider may be outside Router
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // const navigate = useNavigate(); // Can't use inside provider if provider is outside Router, check App.jsx

    // Restore session if JWT token exists; fetch /auth/me for user profile
    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await axios.get('/auth/me');
                    setUser(data);
                } catch (error) {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    // Perform login and persist JWT in localStorage
    const login = async (email, password) => {
        try {
            const { data } = await axios.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            setUser(data);
            return data;
        } catch (error) {
            throw error;
        }
    };

    // Clear session token and user state
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
