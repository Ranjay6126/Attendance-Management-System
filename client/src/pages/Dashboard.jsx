import { useAuth } from '../context/AuthContext';
import EmployeeDashboard from '../components/dashboards/EmployeeDashboard';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import SuperAdminDashboard from '../components/dashboards/SuperAdminDashboard';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Dashboard = () => {
    const { user, logout } = useAuth();
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
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4 mb-6">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">Planning Guru - Attendance</h1>
                    <div className="flex items-center gap-4">
                        <span className="font-semibold">{user.name} ({user.role})</span>
                        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
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
