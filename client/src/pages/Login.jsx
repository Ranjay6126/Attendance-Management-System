// React state management hooks
import { useState } from 'react';
// Custom auth context: handles JWT login, logout, and current user
import { useAuth } from '../context/AuthContext';
// Navigation helper from React Router
import { useNavigate } from 'react-router-dom';
// Preconfigured axios instance with token interceptor
import axios from '../api/axios';
// Theme provider (dark/light)
import { useTheme } from '../context/ThemeContext';
// Toggle button component for theme switching
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [error, setError] = useState('');
    const [setupMsg, setSetupMsg] = useState('');
    const [loginRole, setLoginRole] = useState('Employee');
    const [loading, setLoading] = useState(false);

    // Submit login form: calls auth.login and navigates to dashboard
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await login(email, password);
            if (response) {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    // One-time system initialization: creates default Super Admin
    const handleSetup = async () => {
        try {
            await axios.post('/auth/setup');
            setSetupMsg('Super Admin created! Login with admin@planningguru.com / admin123');
        } catch (err) {
            setSetupMsg(err.response?.data?.message || 'Setup failed');
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center transition-colors px-4 py-8 ${
            isDark ? 'bg-gray-900' : 'bg-slate-100'
        }`}>
            {/* Theme Toggle - Top Right */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <div className={`w-full max-w-md p-4 sm:p-8 rounded-lg border transition-colors ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            }`}>
                {/* Brand and sign-in role */}
                <div className="flex flex-col items-center w-full min-w-0 mb-8">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white p-0.5 mb-4 border-2 border-blue-600">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            <img src="/logo.png" alt="Employees Attendance Management System logo" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    
                    <h2 className={`self-stretch min-w-0 shrink-0 text-center px-1 whitespace-nowrap text-sm sm:text-[11px] md:text-sm lg:text-sm xl:text-base font-bold mb-2 ${
                        isDark ? 'text-green-400' : 'text-green-600'
                    }`}>
                        Employees Attendance Management System
                    </h2>
                    <h3 className={`text-lg sm:text-xl font-bold underline mb-2 ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                        {loginRole} Sign In
                    </h3>
                    <p className={`text-xs sm:text-sm font-bold ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                        Strick ways to mark the Attendance.
                    </p>
                </div>

                {error && (
                    <div className={`mb-4 sm:mb-6 p-3 rounded-lg text-xs sm:text-sm text-center font-semibold border ${
                        isDark 
                            ? 'bg-red-900/30 text-red-300 border-red-700' 
                            : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                        {error}
                    </div>
                )}
                {setupMsg && (
                    <div className={`mb-4 sm:mb-6 p-3 rounded-lg text-xs sm:text-sm text-center font-semibold border ${
                        isDark 
                            ? 'bg-green-900/30 text-green-300 border-green-700' 
                            : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                        {setupMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all font-medium ${
                                isDark
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all font-medium ${
                                isDark
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-lg font-semibold text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div className="mt-6 sm:mt-8">
                    <div className="relative">
                        <div className={`absolute inset-0 flex items-center ${
                            isDark ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                            <div className={`w-full border-t ${
                                isDark ? 'border-gray-700' : 'border-gray-200'
                            }`}></div>
                        </div>
                        <div className="relative flex justify-center text-xs sm:text-sm">
                            <span className={`px-3 font-semibold ${
                                isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'
                            }`}>
                                Or sign in as
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm font-bold">
                        {[
                            { role: 'Employee', active: 'bg-blue-600 text-white', idle: isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300' },
                            { role: 'Admin', active: 'bg-blue-600 text-white', idle: isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300' },
                            { role: 'Super Admin', active: 'bg-blue-600 text-white', idle: isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300' },
                        ].map(({ role, active, idle }) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => setLoginRole(role)}
                                aria-pressed={loginRole === role}
                                className={`rounded-lg px-3 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    loginRole === role ? active : idle
                                }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Hidden setup trigger for dev/first-run */}
                <div className="mt-6 sm:mt-8 text-center opacity-0 hover:opacity-100 transition-opacity">
                    <button 
                        type="button"
                        onClick={handleSetup} 
                        className={`text-xs font-medium transition-colors ${
                            isDark ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500'
                        }`}
                    >
                        Initialize System
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
