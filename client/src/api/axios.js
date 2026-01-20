// Axios HTTP client with baseURL and JWT interceptors
import axios from 'axios';

// Use relative path for Vite proxy in development, or env variable for production
const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Inject Authorization header if JWT token is present
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global 401 handling: clear token and redirect to login
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default instance;
