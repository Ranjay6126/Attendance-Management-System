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
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [modalMode, setModalMode] = useState('');
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
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const filtered = data.filter(record => {
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
            setTimeout(() => setMessage(''), 3000);
            setNewUser({ name: '', email: '', password: '', role: 'Employee', department: '', designation: '' });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create user. Please check all fields and try again.';
            setErrorMessage(errorMsg);
        }
    };

    const handleExport = async () => {
        try {
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
            document.body.removeChild(link);
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
            await axios.put(`/attendance/${selectedRecord._id}/approve`, { approvalStatus: status, remarks });
            fetchAttendance();
            closeModal();
        } catch (error) {
            console.error(error);
        }
    };

    const submitRectification = async () => {
        try {
            await axios.put(`/attendance/${selectedRecord._id}/rectify`, { ...rectifyData, remarks });
            fetchAttendance();
            closeModal();
        } catch (error) {
            alert('Rectification failed or limit reached');
        }
    };

    const chartOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    font: { weight: 'bold', size: 12 },
                    padding: 15,
                }
            }
        }
    };

    const pieData = analyticsData ? {
        labels: Object.keys(analyticsData.typeDistribution),
        datasets: [{
            data: Object.values(analyticsData.typeDistribution),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
            borderColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 2,
        }]
    } : null;

    const getStatusBadgeColor = (status) => {
        switch(status) {
            case 'Present':
                return isDark ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-green-100 text-green-700 border border-green-300';
            case 'Absent':
                return isDark ? 'bg-red-900/30 text-red-300 border border-red-700' : 'bg-red-100 text-red-700 border border-red-300';
            case 'Leave':
                return isDark ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700' : 'bg-yellow-100 text-yellow-700 border border-yellow-300';
            case 'Pending Approval':
                return isDark ? 'bg-blue-900/30 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-700 border border-blue-300';
            default:
                return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className={`flex flex-wrap gap-2 p-1 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}>
                {['myAttendance', 'attendance', 'users', 'analytics'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)} 
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                            activeTab === tab 
                                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' 
                                : isDark 
                                    ? 'text-gray-300 hover:text-white' 
                                    : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        {tab === 'myAttendance' && '📋 My Attendance'}
                        {tab === 'attendance' && '👥 Manage Employees'}
                        {tab === 'users' && '➕ Create Employee'}
                        {tab === 'analytics' && '📊 Analytics'}
                    </button>
                ))}
            </div>

            {/* My Attendance Tab */}
            {activeTab === 'myAttendance' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <AttendanceMarker onSuccess={() => {
                            setRefreshMyAttendance(!refreshMyAttendance);
                            fetchMyAttendance();
                        }} />
                    </div>
                    
                    <div className="lg:col-span-2">
                        <div className={`p-6 rounded-xl transition-all ${
                            isDark 
                                ? 'bg-gray-800 border border-gray-700 shadow-xl' 
                                : 'bg-white border border-gray-200 shadow-lg'
                        }`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
                                        document.body.removeChild(link);
                                    } catch (error) {
                                        console.error('Download failed', error);
                                    }
                                }} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Download
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className={`border-b-2 ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-300 bg-gray-100'}`}>
                                            <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                                            <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>In</th>
                                            <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Out</th>
                                            <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Hours</th>
                                            <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Type</th>
                                            <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myAttendanceData.length > 0 ? myAttendanceData.map((record) => (
                                            <tr key={record._id} className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                <td className={`p-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{record.date}</td>
                                                <td className={`p-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                                                <td className={`p-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                                                <td className={`p-3 text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{record.workingHours ? record.workingHours.toFixed(2) + 'h' : '0h'}</td>
                                                <td className={`p-3 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{record.attendanceType}</td>
                                                <td><span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(record.status)}`}>{record.status}</span></td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className={`p-8 text-center font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    No attendance records found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Employee Tab */}
            {activeTab === 'users' && (
                <div className={`p-8 rounded-xl transition-all max-w-2xl mx-auto ${
                    isDark ? 'bg-gray-800 border border-gray-700 shadow-xl' : 'bg-white border border-gray-200 shadow-lg'
                }`}>
                    <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Create New Employee
                    </h3>
                    {message && (
                        <div className={`mb-4 p-4 rounded-lg font-semibold border flex items-center gap-2 ${
                            isDark 
                                ? 'bg-green-900/30 text-green-300 border-green-700' 
                                : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            {message}
                        </div>
                    )}
                    {errorMessage && (
                        <div className={`mb-4 p-4 rounded-lg font-semibold border flex items-center gap-2 ${
                            isDark 
                                ? 'bg-red-900/30 text-red-300 border-red-700' 
                                : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            {errorMessage}
                        </div>
                    )}
                    <form onSubmit={handleCreateUser} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <input placeholder="Full Name" className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'} focus:outline-none`} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                            <input placeholder="Email Address" type="email" className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'} focus:outline-none`} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                            <input placeholder="Password (Min 6 chars)" type="password" className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'} focus:outline-none`} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required minLength={6} />
                            <select className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500'} focus:outline-none`} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                <option value="Employee">Employee</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <input placeholder="Department (e.g., IT, HR)" className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'} focus:outline-none`} value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />
                            <input placeholder="Designation (e.g., Developer)" className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'} focus:outline-none`} value={newUser.designation} onChange={e => setNewUser({...newUser, designation: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white p-4 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]">
                            Create Employee
                        </button>
                    </form>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && analyticsData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700 shadow-xl' : 'bg-white border border-gray-200 shadow-lg'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Today's Attendance Type</h3>
                        <div className="h-64">
                            {pieData && <Pie data={pieData} options={chartOptions} />}
                        </div>
                    </div>
                    <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700 shadow-xl' : 'bg-white border border-gray-200 shadow-lg'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Key Metrics</h3>
                        <div className="space-y-3">
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                                <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Total Check-ins</p>
                                <p className={`text-3xl font-bold ${isDark ? 'text-blue-100' : 'text-blue-900'}`}>{analyticsData.todayStats?.total || 0}</p>
                            </div>
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                                <p className={`text-sm font-medium ${isDark ? 'text-green-300' : 'text-green-600'}`}>Present</p>
                                <p className={`text-3xl font-bold ${isDark ? 'text-green-100' : 'text-green-900'}`}>{analyticsData.todayStats?.present || 0}</p>
                            </div>
                            <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/30 border border-purple-700' : 'bg-purple-50 border border-purple-200'}`}>
                                <p className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Avg Working Hours (7 Days)</p>
                                <p className={`text-3xl font-bold ${isDark ? 'text-purple-100' : 'text-purple-900'}`}>{(analyticsData.avgWorkingHours || 0).toFixed(1)} hrs</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee Management Tab */}
            {activeTab === 'attendance' && (
                <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800 border border-gray-700 shadow-xl' : 'bg-white border border-gray-200 shadow-lg'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Employee Attendance Management</h3>
                        <div className="flex flex-wrap gap-2">
                            <input type="date" className={`p-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={exportFilters.startDate} onChange={e => setExportFilters({...exportFilters, startDate: e.target.value})} />
                            <input type="date" className={`p-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={exportFilters.endDate} onChange={e => setExportFilters({...exportFilters, endDate: e.target.value})} />
                            <select className={`p-2 border rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={exportFilters.attendanceType} onChange={e => setExportFilters({...exportFilters, attendanceType: e.target.value})}>
                                <option value="">All Types</option>
                                <option value="Office">Office</option>
                                <option value="WFH">WFH</option>
                                <option value="Field">Field</option>
                            </select>
                            <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg">Export</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className={`border-b-2 ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-300 bg-gray-100'}`}>
                                    <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Employee</th>
                                    <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                                    <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>In Time</th>
                                    <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Out Time</th>
                                    <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                                    <th className={`p-3 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.slice(0, 20).map((record) => (
                                    <tr key={record._id} className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <td className={`p-3 font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{record.user?.name}</td>
                                        <td className={`p-3 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{record.date}</td>
                                        <td className={`p-3 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                                        <td className={`p-3 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                                        <td><span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(record.status)}`}>{record.status}</span></td>
                                        <td className="p-3 flex gap-2">
                                            <button onClick={() => openModal(record, 'approve')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors">Verify</button>
                                            <button onClick={() => openModal(record, 'rectify')} className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors">Rectify</button>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className={`p-6 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {modalMode === 'approve' ? 'Verify Attendance' : 'Rectify Attendance'}
                        </h3>
                        <div className={`text-sm space-y-2 mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                            <p><strong>Employee:</strong> {selectedRecord.user?.name}</p>
                            <p><strong>Date:</strong> {selectedRecord.date}</p>
                            <p><strong>Current Status:</strong> {selectedRecord.status}</p>
                        </div>
                        <textarea placeholder="Remarks" className={`w-full p-3 border-2 rounded-lg mb-4 resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={remarks} onChange={(e) => setRemarks(e.target.value)} rows="3" />
                        <div className="flex gap-2 justify-end">
                            <button onClick={closeModal} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-300 text-gray-900 hover:bg-gray-400'}`}>Cancel</button>
                            {modalMode === 'approve' ? (
                                <>
                                    <button onClick={() => submitApproval('Rejected')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">Reject</button>
                                    <button onClick={() => submitApproval('Approved')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">Approve</button>
                                </>
                            ) : (
                                <button onClick={submitRectification} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">Save Changes</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
