import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { CalendarCheck } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [setupMsg, setSetupMsg] = useState('');
    const [loginRole, setLoginRole] = useState('Employee'); // 'Employee', 'Admin', 'Super Admin'

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userData = await login(email, password);
            
            // Optional: Enforce role matching if desired, but typically backend handles this.
            // For now, we just redirect. If strict role separation is needed visually:
            /*
            if (loginRole === 'Employee' && userData.role !== 'Employee') {
                throw new Error('Please login via the correct role page.');
            }
            */
            
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
            <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-blue-100 p-3 rounded-xl mb-4">
                        <CalendarCheck className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{loginRole} Sign In</h2>
                    <p className="text-gray-500 mt-2">Your attendance, simplified.</p>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-3 mb-6 rounded-lg text-sm text-center border border-red-100">{error}</div>}
                {setupMsg && <div className="bg-green-50 text-green-600 p-3 mb-6 rounded-lg text-sm text-center border border-green-100">{setupMsg}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Username"
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 placeholder-gray-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700 placeholder-gray-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-3.5 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg shadow-blue-500/30 mt-2"
                    >
                        Sign in
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
                            <button onClick={() => setLoginRole('Employee')} className="text-blue-600 hover:text-blue-800 transition-colors">
                                Employee
                            </button>
                        )}
                        {loginRole !== 'Admin' && (
                            <button onClick={() => setLoginRole('Admin')} className="text-blue-600 hover:text-blue-800 transition-colors">
                                Admin
                            </button>
                        )}
                        {loginRole !== 'Super Admin' && (
                            <button onClick={() => setLoginRole('Super Admin')} className="text-blue-600 hover:text-blue-800 transition-colors">
                                Super Admin
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Hidden setup trigger for dev/first-run */}
                <div className="mt-8 text-center opacity-0 hover:opacity-100 transition-opacity">
                    <button onClick={handleSetup} className="text-xs text-gray-300 hover:text-gray-500">
                        Initialize System
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
