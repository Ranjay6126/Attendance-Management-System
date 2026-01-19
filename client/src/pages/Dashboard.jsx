import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import EmployeeDashboard from '../components/dashboards/EmployeeDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import SuperAdminDashboard from '../components/dashboards/SuperAdminDashboard';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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
            <Navbar onLogout={handleLogout} />

            <div className="container mx-auto p-3 sm:p-4">
                {user.role === 'Employee' && <EmployeeDashboard />}
                {user.role === 'Admin' && <AdminDashboard />}
                {user.role === 'SuperAdmin' && <SuperAdminDashboard />}
            </div>
        </div>
    );
};

export default Dashboard;
