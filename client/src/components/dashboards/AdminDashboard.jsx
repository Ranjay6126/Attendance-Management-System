import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import AttendanceMarker from '../AttendanceMarker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const AdminDashboard = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('myAttendance');
    const [attendanceData, setAttendanceData] = useState([]);
    const [myAttendanceData, setMyAttendanceData] = useState([]);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Employee', department: '', designation: '' });
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null); // For modal
    const [modalMode, setModalMode] = useState(''); // 'approve', 'rectify'
    const [remarks, setRemarks] = useState('');
    const [rectifyData, setRectifyData] = useState({ status: '', checkInTime: '', checkOutTime: '', attendanceType: '' });
    const [exportFilters, setExportFilters] = useState({ startDate: '', endDate: '', employeeId: '', attendanceType: '' });
    const [refreshMyAttendance, setRefreshMyAttendance] = useState(false);

    useEffect(() => {
        fetchAttendance();
        fetchAnalytics();
        fetchMyAttendance();
    }, [refreshMyAttendance]);
    
    const fetchMyAttendance = async () => {
        try {
            const { data } = await axios.get('/attendance');
            // Filter to show only Admin's own attendance (last 3 months like Employee)
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const filtered = data.filter(record => {
                // Filter by current user's ID
                const isMyRecord = record.user && (
                    (typeof record.user === 'object' && record.user._id === user?._id) ||
                    (typeof record.user === 'string' && record.user === user?._id) ||
                    record.user === user?._id
                );
                const recordDate = new Date(record.date);
                return isMyRecord && recordDate >= threeMonthsAgo;
            });
            setMyAttendanceData(filtered);
        } catch (error) {
            console.error('Error fetching my attendance', error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const { data } = await axios.get('/attendance');
            setAttendanceData(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const { data } = await axios.get('/attendance/analytics');
            setAnalyticsData(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrorMessage('');
        try {
            await axios.post('/auth/register', newUser);
            setMessage('User created successfully!');
            setNewUser({ name: '', email: '', password: '', role: 'Employee', department: '', designation: '' });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create user. Please check all fields and try again.';
            setErrorMessage(errorMsg);
            console.error('Create user error:', error);
        }
    };

    const handleExport = async () => {
        try {
            // Remove empty filters
            const params = new URLSearchParams();
            Object.keys(exportFilters).forEach(key => {
                if (exportFilters[key]) params.append(key, exportFilters[key]);
            });

            const response = await axios.get(`/attendance/export?${params.toString()}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_report_${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed");
        }
    };

    const openModal = (record, mode) => {
        setSelectedRecord(record);
        setModalMode(mode);
        setRemarks(record.remarks || '');
        if (mode === 'rectify') {
            setRectifyData({
                status: record.status,
                checkInTime: record.checkInTime || '',
                checkOutTime: record.checkOutTime || '',
                attendanceType: record.attendanceType || 'Office'
            });
        }
    };

    const closeModal = () => {
        setSelectedRecord(null);
        setModalMode('');
        setRemarks('');
    };

    const submitApproval = async (status) => {
        try {
            await axios.put(`/attendance/${selectedRecord._id}/approve`, { 
                approvalStatus: status,
                remarks 
            });
            fetchAttendance();
            closeModal();
        } catch (error) {
            console.error(error);
        }
    };

    const submitRectification = async () => {
        try {
            await axios.put(`/attendance/${selectedRecord._id}/rectify`, { 
                ...rectifyData,
                remarks 
            });
            fetchAttendance();
            closeModal();
        } catch (error) {
            alert('Rectification failed or limit reached');
        }
    };

    const pieData = analyticsData ? {
        labels: Object.keys(analyticsData.typeDistribution),
        datasets: [{
            data: Object.values(analyticsData.typeDistribution),
            backgroundColor: ['#60a5fa', '#34d399', '#ffb703']
        }]
    } : null;

    const lineData = analyticsData && analyticsData.dailyTrend ? {
        labels: analyticsData.dailyTrend.map(d => d.date),
        datasets: [{
            label: 'Daily Attendance',
            data: analyticsData.dailyTrend.map(d => d.count),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.3
        }]
    } : null;

    const barData = analyticsData && analyticsData.employeeStats ? {
        labels: analyticsData.employeeStats.map(d => d.name),
        datasets: [{
            label: 'Days Present (Last 30 Days)',
            data: analyticsData.employeeStats.map(d => d.count),
            backgroundColor: '#10b981',
        }]
    } : null;

    return (
        <div>
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto pb-2">
                <button 
                    onClick={() => setActiveTab('myAttendance')} 
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'myAttendance' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : isDark 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    My Attendance
                </button>
                <button 
                    onClick={() => setActiveTab('attendance')} 
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'attendance' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : isDark 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Employee Management
                </button>
                <button 
                    onClick={() => setActiveTab('users')} 
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'users' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : isDark 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Create Employee
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')} 
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'analytics' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : isDark 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Analytics
                </button>
            </div>

            {activeTab === 'myAttendance' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <AttendanceMarker onSuccess={() => {
                            setRefreshMyAttendance(!refreshMyAttendance);
                            fetchMyAttendance();
                        }} />
                    </div>
                    
                    <div className="md:col-span-2">
                        <div className={`p-4 sm:p-6 rounded-xl shadow-lg transition-colors ${
                            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                                <h3 className={`text-lg sm:text-xl font-extrabold ${
                                    isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                    My Attendance History (Last 3 Months)
                                </h3>
                                <button onClick={async () => {
                                    try {
                                        const response = await axios.get('/attendance/export', { responseType: 'blob' });
                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', 'my_attendance.xlsx');
                                        document.body.appendChild(link);
                                        link.click();
                                    } catch (error) {
                                        console.error('Download failed', error);
                                    }
                                }} className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors shadow-md">Download Report</button>
                            </div>
                            <div className="overflow-x-auto -mx-4 sm:mx-0">
                                <div className="inline-block min-w-full align-middle">
                                    <table className="min-w-full text-left border-collapse">
                                        <thead>
                                            <tr className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                                                <th className={`p-2 sm:p-3 border font-bold text-xs sm:text-sm ${
                                                    isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                                }`}>
                                                    Date
                                                </th>
                                                <th className={`p-2 sm:p-3 border font-bold text-xs sm:text-sm ${
                                                    isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                                }`}>
                                                    Check In
                                                </th>
                                                <th className={`p-2 sm:p-3 border font-bold text-xs sm:text-sm ${
                                                    isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                                }`}>
                                                    Check Out
                                                </th>
                                                <th className={`p-2 sm:p-3 border font-bold text-xs sm:text-sm ${
                                                    isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                                }`}>
                                                    Hours
                                                </th>
                                                <th className={`p-2 sm:p-3 border font-bold text-xs sm:text-sm ${
                                                    isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                                }`}>
                                                    Type
                                                </th>
                                                <th className={`p-2 sm:p-3 border font-bold text-xs sm:text-sm ${
                                                    isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                                }`}>
                                                    Status
                                                </th>
                                                <th className={`p-2 sm:p-3 border font-bold text-xs sm:text-sm ${
                                                    isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                                }`}>
                                                    Location
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myAttendanceData.map((record) => (
                                                <tr key={record._id} className={`border-b font-medium ${
                                                    isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'
                                                }`}>
                                                    <td className={`p-2 sm:p-3 text-xs sm:text-sm font-semibold ${
                                                        isDark ? 'text-gray-300' : 'text-gray-800'
                                                    }`}>
                                                        {record.date}
                                                    </td>
                                                    <td className={`p-2 sm:p-3 text-xs sm:text-sm font-semibold ${
                                                        isDark ? 'text-gray-300' : 'text-gray-800'
                                                    }`}>
                                                        {record.checkInTime ? new Date(record.checkInTime).toLocaleString() : '-'}
                                                    </td>
                                                    <td className={`p-2 sm:p-3 text-xs sm:text-sm font-semibold ${
                                                        isDark ? 'text-gray-300' : 'text-gray-800'
                                                    }`}>
                                                        {record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : '-'}
                                                    </td>
                                                    <td className={`p-2 sm:p-3 text-xs sm:text-sm font-semibold ${
                                                        isDark ? 'text-gray-300' : 'text-gray-800'
                                                    }`}>
                                                        {record.workingHours ? record.workingHours.toFixed(2) : '0'}
                                                    </td>
                                                    <td className={`p-2 sm:p-3 text-xs sm:text-sm font-semibold ${
                                                        isDark ? 'text-gray-300' : 'text-gray-800'
                                                    }`}>
                                                        {record.attendanceType}
                                                    </td>
                                                    <td className="p-2 sm:p-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            record.status === 'Present' 
                                                                ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800' :
                                                            record.status === 'Absent' 
                                                                ? isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800' :
                                                                isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td className={`p-2 sm:p-3 text-xs font-semibold ${
                                                        isDark ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                        {record.checkInLocation?.address || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        {myAttendanceData.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="p-3 text-center">No records found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className={`p-6 sm:p-8 rounded-xl transition-colors max-w-3xl ${
                    isDark ? 'bg-gray-800 border border-gray-700 shadow-xl' : 'bg-white border border-gray-200 shadow-2xl'
                }`}>
                    <h3 className={`text-2xl font-extrabold mb-6 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        Create New Employee
                    </h3>
                    {message && (
                        <div className={`mb-4 p-4 rounded-lg font-semibold border ${
                            isDark 
                                ? 'bg-green-900/30 text-green-300 border-green-700' 
                                : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                            {message}
                        </div>
                    )}
                    {errorMessage && (
                        <div className={`mb-4 p-4 rounded-lg font-semibold border ${
                            isDark 
                                ? 'bg-red-900/30 text-red-300 border-red-700' 
                                : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {errorMessage}
                        </div>
                    )}
                    <form onSubmit={handleCreateUser} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    placeholder="e.g., John Doe" 
                                    className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${
                                        isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                    value={newUser.name} 
                                    onChange={e => setNewUser({...newUser, name: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    placeholder="e.g., john.doe@company.com" 
                                    type="email" 
                                    className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${
                                        isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                    value={newUser.email} 
                                    onChange={e => setNewUser({...newUser, email: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    placeholder="Minimum 6 characters" 
                                    type="password" 
                                    className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${
                                        isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                    value={newUser.password} 
                                    onChange={e => setNewUser({...newUser, password: e.target.value})} 
                                    required 
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select 
                                    className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${
                                        isDark
                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                    value={newUser.role} 
                                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Department
                                </label>
                                <input 
                                    placeholder="e.g., IT, HR, Sales, Marketing" 
                                    className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${
                                        isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                    value={newUser.department} 
                                    onChange={e => setNewUser({...newUser, department: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${
                                    isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Designation
                                </label>
                                <input 
                                    placeholder="e.g., Developer, Manager, Analyst" 
                                    className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${
                                        isDark
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                                    value={newUser.designation} 
                                    onChange={e => setNewUser({...newUser, designation: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div className={`p-4 rounded-lg border ${
                            isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-blue-50 border-blue-200'
                        }`}>
                            <p className={`text-xs sm:text-sm font-semibold ${
                                isDark ? 'text-gray-400' : 'text-blue-700'
                            }`}>
                                <span className="font-bold">Note:</span> Admin can create Employee accounts. Provide the email and password to the user for login.
                            </p>
                        </div>
                        <button 
                            type="submit" 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg font-extrabold text-base transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Create Employee
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'analytics' && analyticsData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded shadow-md">
                        <h3 className="text-xl font-bold mb-4">Today's Attendance Type</h3>
                        <div className="h-64 flex justify-center">
                             <Pie data={pieData} />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded shadow-md">
                         <h3 className="text-xl font-bold mb-4">Key Metrics</h3>
                         <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-blue-50 p-4 rounded">
                                <h4 className="text-gray-500">Total Check-ins</h4>
                                <p className="text-2xl font-bold">{analyticsData.todayStats.total}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded">
                                <h4 className="text-gray-500">Present</h4>
                                <p className="text-2xl font-bold">{analyticsData.todayStats.present}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded col-span-2">
                                <h4 className="text-gray-500">Avg Working Hours (Last 7 Days)</h4>
                                <p className="text-2xl font-bold">{analyticsData.avgWorkingHours || 0} hrs</p>
                            </div>
                         </div>
                    </div>
                    {lineData && (
                        <div className="bg-white p-6 rounded shadow-md md:col-span-2">
                            <h3 className="text-xl font-bold mb-4">Daily Attendance Trend (Last 7 Days)</h3>
                            <div className="h-64">
                                <Line data={lineData} options={{ maintainAspectRatio: false }} />
                            </div>
                        </div>
                    )}
                    {barData && (
                        <div className="bg-white p-6 rounded shadow-md md:col-span-2">
                            <h3 className="text-xl font-bold mb-4">Top 5 Employees (Attendance Days)</h3>
                            <div className="h-64">
                                <Bar data={barData} options={{ maintainAspectRatio: false }} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="bg-white p-6 rounded shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Employee Attendance</h3>
                        <div className="flex gap-2">
                            <input 
                                type="date" 
                                className="p-2 border rounded text-sm" 
                                value={exportFilters.startDate} 
                                onChange={e => setExportFilters({...exportFilters, startDate: e.target.value})} 
                            />
                            <input 
                                type="date" 
                                className="p-2 border rounded text-sm" 
                                value={exportFilters.endDate} 
                                onChange={e => setExportFilters({...exportFilters, endDate: e.target.value})} 
                            />
                            <select 
                                className="p-2 border rounded text-sm" 
                                value={exportFilters.attendanceType} 
                                onChange={e => setExportFilters({...exportFilters, attendanceType: e.target.value})}
                            >
                                <option value="">All Types</option>
                                <option value="Office">Office</option>
                                <option value="WFH">WFH</option>
                                <option value="Field">Field</option>
                            </select>
                            <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                                Export Excel
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-3 border">Employee</th>
                                    <th className="p-3 border">Date</th>
                                    <th className="p-3 border">In</th>
                                    <th className="p-3 border">Out</th>
                                    <th className="p-3 border">Loc</th>
                                    <th className="p-3 border">Image</th>
                                    <th className="p-3 border">Status</th>
                                    <th className="p-3 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.map((record) => (
                                    <tr key={record._id} className="border-b">
                                        <td className="p-3">{record.user?.name}</td>
                                        <td className="p-3">{record.date}</td>
                                        <td className="p-3">{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                                        <td className="p-3">{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                                        <td className="p-3 text-xs">
                                            {record.checkInLocation?.latitude && (
                                                <a href={`https://www.google.com/maps?q=${record.checkInLocation.latitude},${record.checkInLocation.longitude}`} target="_blank" className="text-blue-500 underline">
                                                    Map
                                                </a>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {record.checkInImage && <a href={`http://localhost:5000/${record.checkInImage}`} target="_blank" className="text-blue-500 underline">View</a>}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                <span>{record.status}</span>
                                                <span className="text-xs text-gray-500">{record.approvalStatus}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 flex gap-2">
                                            <button onClick={() => openModal(record, 'approve')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Verify</button>
                                            <button onClick={() => openModal(record, 'rectify')} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Rectify</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {selectedRecord && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            {modalMode === 'approve' ? 'Verify Attendance' : 'Rectify Attendance'}
                        </h3>

                        {/* Images */}
                        <div className="flex gap-4 mb-4">
                            {selectedRecord.checkInImage && (
                                <div className="flex-1">
                                    <p className="text-sm font-bold mb-1">Check In</p>
                                    <img src={`http://localhost:5000/${selectedRecord.checkInImage}`} className="w-full rounded border" />
                                </div>
                            )}
                            {selectedRecord.checkOutImage && (
                                <div className="flex-1">
                                    <p className="text-sm font-bold mb-1">Check Out</p>
                                    <img src={`http://localhost:5000/${selectedRecord.checkOutImage}`} className="w-full rounded border" />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="mb-4 text-sm">
                            <p><strong>Employee:</strong> {selectedRecord.user?.name}</p>
                            <p><strong>Date:</strong> {selectedRecord.date}</p>
                            <p><strong>Location:</strong> {selectedRecord.checkInLocation?.address}</p>
                            <p><strong>Lat/Long:</strong> {selectedRecord.checkInLocation?.latitude}, {selectedRecord.checkInLocation?.longitude}</p>
                        </div>

                        {/* Form */}
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-1">Remarks</label>
                            <textarea 
                                className="w-full p-2 border rounded" 
                                value={remarks} 
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>

                        {modalMode === 'rectify' && (
                            <div className="space-y-2 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm">Status</label>
                                    <select 
                                        className="w-full p-2 border rounded"
                                        value={rectifyData.status}
                                        onChange={(e) => setRectifyData({...rectifyData, status: e.target.value})}
                                    >
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                        <option value="Leave">Leave</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm">Attendance Type</label>
                                    <select 
                                        className="w-full p-2 border rounded"
                                        value={rectifyData.attendanceType}
                                        onChange={(e) => setRectifyData({...rectifyData, attendanceType: e.target.value})}
                                    >
                                        <option value="Office">Office</option>
                                        <option value="WFH">WFH</option>
                                        <option value="Field">Field</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 justify-end">
                            <button onClick={closeModal} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                            {modalMode === 'approve' ? (
                                <>
                                    <button onClick={() => submitApproval('Rejected')} className="bg-red-500 text-white px-4 py-2 rounded">Reject</button>
                                    <button onClick={() => submitApproval('Approved')} className="bg-green-600 text-white px-4 py-2 rounded">Approve</button>
                                </>
                            ) : (
                                <button onClick={submitRectification} className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
