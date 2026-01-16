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

    if (!user) return <div>Loading...</div>;

    return (
        <div className={`min-h-screen transition-colors ${
            isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
            <nav className={`shadow-sm p-4 mb-6 transition-colors ${
                isDark ? 'bg-gray-800 border-b border-gray-700' : 'bg-white'
            }`}>
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className={`text-2xl font-bold ${
                        isDark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                        HatBoy attendance_system
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className={`font-semibold ${
                            isDark ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                            {user.name} ({user.role})
                        </span>
                        <ThemeToggle />
                        <button 
                            onClick={handleLogout} 
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto p-4">
                {user.role === 'Employee' && <EmployeeDashboard />}
                {user.role === 'Admin' && <AdminDashboard />}
                {user.role === 'SuperAdmin' && <SuperAdminDashboard />}
            </div>
        </div>
    );
};

export default Dashboard;
