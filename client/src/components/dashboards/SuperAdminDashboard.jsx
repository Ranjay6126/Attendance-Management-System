import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import AttendanceMarker from '../AttendanceMarker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const SuperAdminDashboard = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('myAttendance');
    const [attendanceData, setAttendanceData] = useState([]);
    const [myAttendanceData, setMyAttendanceData] = useState([]);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Admin', department: '', designation: '' });
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [refreshMyAttendance, setRefreshMyAttendance] = useState(false);

    useEffect(() => {
        fetchAttendance();
        fetchMyAttendance();
    }, [refreshMyAttendance]);
    
    const fetchMyAttendance = async () => {
        try {
            const { data } = await axios.get('/attendance');
            // Filter to show only SuperAdmin's own attendance (last 3 months)
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

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrorMessage('');
        try {
            await axios.post('/auth/register', newUser);
            setMessage('User created successfully!');
            setNewUser({ name: '', email: '', password: '', role: 'Admin', department: '', designation: '' });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create user. Please check all fields and try again.';
            setErrorMessage(errorMsg);
            console.error('Create user error:', error);
        }
    };

    const handleApprove = async (id, status) => {
        try {
            await axios.put(`/attendance/${id}/approve`, { approvalStatus: status });
            fetchAttendance();
        } catch (error) {
            console.error(error);
        }
    };

    const handleRectify = async (id) => {
        const status = prompt("Enter new status (Present/Absent/Leave):");
        if (status) {
            try {
                await axios.put(`/attendance/${id}/rectify`, { status });
                fetchAttendance();
            } catch (error) {
                alert('Rectification failed or limit reached');
            }
        }
    };

    const handleDownload = async () => {
        try {
            const response = await axios.get('/attendance/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'attendance_full_report.xlsx');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto pb-2">
                <button 
                    onClick={() => setActiveTab('myAttendance')} 
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'myAttendance' 
                            ? 'bg-purple-600 text-white shadow-md' 
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
                            ? 'bg-purple-600 text-white shadow-md' 
                            : isDark 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    All Attendance Records
                </button>
                <button 
                    onClick={() => setActiveTab('users')} 
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors whitespace-nowrap ${
                        activeTab === 'users' 
                            ? 'bg-purple-600 text-white shadow-md' 
                            : isDark 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Create Admin/Employee
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
                        <div className={`p-4 sm:p-6 rounded-xl transition-colors ${
                            isDark ? 'bg-gray-800 border border-gray-700 shadow-xl' : 'bg-white border border-gray-200 shadow-2xl'
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
                                }} className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl ${
                                    isDark 
                                        ? 'bg-green-700 hover:bg-green-600 text-white' 
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}>
                                    Download Report
                                </button>
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
                                                <tr key={record._id} className={`border-b font-medium transition-colors ${
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
                                                    <td colSpan="7" className={`p-4 text-center font-bold ${
                                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                        No records found
                                                    </td>
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
                        Create New User
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
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
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
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
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
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
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
                                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                    }`}
                                    value={newUser.role} 
                                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Employee">Employee</option>
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
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
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
                                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
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
                                <span className="font-bold">Note:</span> Super Admin can only create Admin and Employee accounts. Provide the email and password to the user for login.
                            </p>
                        </div>
                        <button 
                            type="submit" 
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg font-extrabold text-base transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Create User
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className={`p-4 sm:p-6 rounded-xl transition-colors ${
                    isDark ? 'bg-gray-800 border border-gray-700 shadow-xl' : 'bg-white border border-gray-200 shadow-2xl'
                }`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
                        <h3 className={`text-xl sm:text-2xl font-extrabold ${
                            isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                            All Attendance Records
                        </h3>
                        <button 
                            onClick={handleDownload} 
                            className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl ${
                                isDark 
                                    ? 'bg-green-700 hover:bg-green-600 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            Download Full Report
                        </button>
                    </div>
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                            <table className="min-w-full text-left border-collapse">
                                <thead>
                                    <tr className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                                        <th className={`p-3 border font-extrabold text-xs sm:text-sm ${
                                            isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                        }`}>
                                            Employee
                                        </th>
                                        <th className={`p-3 border font-extrabold text-xs sm:text-sm ${
                                            isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                        }`}>
                                            Date
                                        </th>
                                        <th className={`p-3 border font-extrabold text-xs sm:text-sm ${
                                            isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                        }`}>
                                            Check In
                                        </th>
                                        <th className={`p-3 border font-extrabold text-xs sm:text-sm ${
                                            isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                        }`}>
                                            Check Out
                                        </th>
                                        <th className={`p-3 border font-extrabold text-xs sm:text-sm ${
                                            isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                        }`}>
                                            Hours
                                        </th>
                                        <th className={`p-3 border font-extrabold text-xs sm:text-sm ${
                                            isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                        }`}>
                                            Type
                                        </th>
                                        <th className={`p-3 border font-extrabold text-xs sm:text-sm ${
                                            isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                        }`}>
                                            Status
                                        </th>
                                        <th className={`p-3 border font-extrabold text-xs sm:text-sm ${
                                            isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                        }`}>
                                            Location
                                        </th>
                                        <th className={`p-3 border font-extrabold text-xs sm:text-sm ${
                                            isDark ? 'border-gray-600 text-gray-200' : 'border-gray-300 text-gray-800'
                                        }`}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.map((record) => (
                                        <tr key={record._id} className={`border-b font-semibold transition-colors ${
                                            isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'
                                        }`}>
                                            <td className={`p-3 text-sm font-bold ${
                                                isDark ? 'text-gray-300' : 'text-gray-800'
                                            }`}>
                                                {record.user?.name || '-'}
                                            </td>
                                            <td className={`p-3 text-sm font-semibold ${
                                                isDark ? 'text-gray-300' : 'text-gray-800'
                                            }`}>
                                                {record.date}
                                            </td>
                                            <td className={`p-3 text-xs sm:text-sm font-semibold ${
                                                isDark ? 'text-gray-300' : 'text-gray-800'
                                            }`}>
                                                {record.checkInTime ? new Date(record.checkInTime).toLocaleString() : '-'}
                                            </td>
                                            <td className={`p-3 text-xs sm:text-sm font-semibold ${
                                                isDark ? 'text-gray-300' : 'text-gray-800'
                                            }`}>
                                                {record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : '-'}
                                            </td>
                                            <td className={`p-3 text-sm font-semibold ${
                                                isDark ? 'text-gray-300' : 'text-gray-800'
                                            }`}>
                                                {record.workingHours ? record.workingHours.toFixed(2) : '0'}
                                            </td>
                                            <td className={`p-3 text-sm font-semibold ${
                                                isDark ? 'text-gray-300' : 'text-gray-800'
                                            }`}>
                                                {record.attendanceType || '-'}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                        record.status === 'Present' 
                                                            ? isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800' :
                                                        record.status === 'Absent' 
                                                            ? isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800' :
                                                            isDark ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {record.status}
                                                    </span>
                                                    {record.approvalStatus && (
                                                        <span className={`text-xs font-semibold ${
                                                            isDark ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>
                                                            {record.approvalStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`p-3 text-xs font-semibold ${
                                                isDark ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                                {record.checkInLocation?.address || '-'}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <button 
                                                        onClick={() => handleApprove(record._id, 'Approved')} 
                                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRectify(record._id)} 
                                                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg"
                                                    >
                                                        Rectify
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {attendanceData.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className={`p-4 text-center font-bold ${
                                                isDark ? 'text-gray-400' : 'text-gray-500'
                                            }`}>
                                                No records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
