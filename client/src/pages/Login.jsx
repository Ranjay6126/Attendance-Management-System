import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [setupMsg, setSetupMsg] = useState('');
    const [loginRole, setLoginRole] = useState('Employee');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userData = await login(email, password);
            // Verify role matches if user selected a specific role (optional check)
            // For now, we allow any role to login - the backend will route to correct dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSetup = async () => {
        try {
            await axios.post('/auth/setup');
            setSetupMsg('Super Admin created! Login with admin@planningguru.com / admin123');
        } catch (err) {
            setSetupMsg(err.response?.data?.message || 'Setup failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white font-sans">
            <div className="bg-white w-full max-w-md p-10">
                <div className="flex flex-col items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{loginRole} Sign In</h2>
                    <p className="text-gray-500 text-sm">Your attendance, simplified.</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 mb-6 rounded-lg text-sm text-center border border-red-100">{error}</div>}
                {setupMsg && <div className="bg-green-50 text-green-600 p-3 mb-6 rounded-lg text-sm text-center border border-green-100">{setupMsg}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-3.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white p-3.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="mt-8">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or sign in as</span>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center gap-6 text-sm font-medium">
                        {loginRole !== 'Employee' && (
                            <button 
                                type="button"
                                onClick={() => setLoginRole('Employee')} 
                                className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                            >
                                Employee
                            </button>
                        )}
                        {loginRole !== 'Admin' && (
                            <button 
                                type="button"
                                onClick={() => setLoginRole('Admin')} 
                                className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                            >
                                Admin
                            </button>
                        )}
                        {loginRole !== 'Super Admin' && (
                            <button 
                                type="button"
                                onClick={() => setLoginRole('Super Admin')} 
                                className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                            >
                                Super Admin
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Hidden setup trigger for dev/first-run */}
                <div className="mt-8 text-center opacity-0 hover:opacity-100 transition-opacity">
                    <button 
                        type="button"
                        onClick={handleSetup} 
                        className="text-xs text-gray-300 hover:text-gray-500"
                    >
                        Initialize System
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
