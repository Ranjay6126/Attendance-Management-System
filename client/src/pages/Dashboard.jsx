import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import EmployeeDashboard from '../components/dashboards/EmployeeDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import SuperAdminDashboard from '../components/dashboards/SuperAdminDashboard';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ThemeToggle from '../components/ThemeToggle';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        // Request notification permission
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        // Check time for 11:00 AM notification
        const checkTime = setInterval(() => {
            const now = new Date();
            if (now.getHours() === 11 && now.getMinutes() === 0) {
                new Notification("Attendance Reminder", {
                    body: "It's 11:00 AM! Please mark your attendance.",
                });
            }
        }, 60000); // Check every minute

        return () => clearInterval(checkTime);
    }, []);

    if (!user) return (
        <div className={`min-h-screen flex items-center justify-center ${
            isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}>
            <div className="text-xl font-bold">Loading...</div>
        </div>
    );

    return (
        <div className={`min-h-screen transition-colors ${
            isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
            <nav className={`shadow-lg p-3 sm:p-4 mb-4 sm:mb-6 transition-colors sticky top-0 z-40 ${
                isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'
            }`}>
                <div className="container mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <img 
                            src="/logo.png" 
                            alt="HatBoy Logo" 
                            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <h1 className={`text-lg sm:text-xl md:text-2xl font-extrabold ${
                            isDark ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                            Hat-Boy <span className="text-sm sm:text-base md:text-lg font-bold">attendance_system</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className={`font-bold text-xs sm:text-sm ${
                            isDark ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                            {user.name} <span className="hidden sm:inline">({user.role})</span>
                        </span>
                        <ThemeToggle />
                        <button 
                            onClick={handleLogout} 
                            className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded font-bold text-xs sm:text-sm transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto p-3 sm:p-4">
                {user.role === 'Employee' && <EmployeeDashboard />}
                {user.role === 'Admin' && <AdminDashboard />}
                {user.role === 'SuperAdmin' && <SuperAdminDashboard />}
            </div>
        </div>
    );
};

export default Dashboard;
