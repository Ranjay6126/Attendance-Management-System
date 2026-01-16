import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { useTheme } from '../context/ThemeContext';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userData = await login(email, password);
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
            setSetupMsg('Super Admin created! Login with superhatboy@gmail.com / sudo@8848');
        } catch (err) {
            setSetupMsg(err.response?.data?.message || 'Setup failed');
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center transition-colors px-4 py-8 ${
            isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
        }`}>
            {/* Theme Toggle - Top Right */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <div className={`w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl transition-colors ${
                isDark ? 'bg-gray-800/95 border border-gray-700 backdrop-blur-sm' : 'bg-white/95 border border-gray-200 backdrop-blur-sm'
            }`}>
                {/* Logo Section - Above "Sign in as Employee" */}
                <div className="flex flex-col items-center mb-8">
                    {/* HatBoy Logo */}
                    <div className="mb-4 relative">
                        <img 
                            src="/logo.png" 
                            alt="HatBoy Logo" 
                            className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-lg"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.classList.remove('hidden');
                            }}
                        />
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg hidden">
                            <div className="text-white text-3xl sm:text-4xl font-bold">HB</div>
                        </div>
                    </div>
                    
                    <h1 className={`text-xl sm:text-2xl font-extrabold mb-1 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        Hat-Boy
                    </h1>
                    <h2 className={`text-lg sm:text-xl font-bold mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        Attendance_system
                    </h2>
                    <h3 className={`text-lg sm:text-xl font-bold mb-2 ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                        {loginRole} Sign In
                    </h3>
                    <p className={`text-xs sm:text-sm font-medium ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                        Your attendance, simplified.
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
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-lg font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
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

                    <div className="mt-4 sm:mt-6 flex justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-bold">
                        {loginRole !== 'Employee' && (
                            <button 
                                type="button"
                                onClick={() => setLoginRole('Employee')} 
                                className={`transition-colors ${
                                    isDark 
                                        ? 'text-blue-400 hover:text-blue-300' 
                                        : 'text-blue-600 hover:text-blue-800'
                                }`}
                            >
                                Employee
                            </button>
                        )}
                        {loginRole !== 'Admin' && (
                            <button 
                                type="button"
                                onClick={() => setLoginRole('Admin')} 
                                className={`transition-colors ${
                                    isDark 
                                        ? 'text-blue-400 hover:text-blue-300' 
                                        : 'text-blue-600 hover:text-blue-800'
                                }`}
                            >
                                Admin
                            </button>
                        )}
                        {loginRole !== 'Super Admin' && (
                            <button 
                                type="button"
                                onClick={() => setLoginRole('Super Admin')} 
                                className={`transition-colors ${
                                    isDark 
                                        ? 'text-blue-400 hover:text-blue-300' 
                                        : 'text-blue-600 hover:text-blue-800'
                                }`}
                            >
                                Super Admin
                            </button>
                        )}
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
