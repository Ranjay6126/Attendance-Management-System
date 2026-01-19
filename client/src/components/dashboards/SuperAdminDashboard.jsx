import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import AttendanceMarker from '../AttendanceMarker';
import LeaveRequest from '../LeaveRequest';
import LeaveHistory from '../LeaveHistory';
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
    const [leaveRefresh, setLeaveRefresh] = useState(false);

    useEffect(() => {
        fetchAttendance();
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

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setMessage('');
        setErrorMessage('');
        try {
            await axios.post('/auth/register', newUser);
            setMessage('User created successfully!');
            setTimeout(() => setMessage(''), 3000);
            setNewUser({ name: '', email: '', password: '', role: 'Admin', department: '', designation: '' });
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to create user. Please check all fields and try again.';
            setErrorMessage(errorMsg);
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
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    const getStatusBadgeColor = (status) => {
        switch(status) {
            case 'Present':
                return isDark ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-green-100 text-green-700 border border-green-300';
            case 'Absent':
                return isDark ? 'bg-red-900/30 text-red-300 border border-red-700' : 'bg-red-100 text-red-700 border border-red-300';
            case 'Leave':
                return isDark ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700' : 'bg-yellow-100 text-yellow-700 border border-yellow-300';
            default:
                return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className={`flex flex-wrap gap-2 p-1 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700/50' : 'bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300'
            }`}>
                {['myAttendance', 'requestLeave', 'attendance', 'users'].map((tab) => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)} 
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                            activeTab === tab 
                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg scale-105' 
                                : isDark 
                                    ? 'text-gray-300 hover:text-white' 
                                    : 'text-indigo-700 hover:bg-indigo-50 border border-indigo-300 bg-white'
                        }`}
                    >
                        {tab === 'myAttendance' && '📋 My Attendance'}
                        {tab === 'requestLeave' && '📝 Request Leave'}
                        {tab === 'attendance' && '📊 All Records'}
                        {tab === 'users' && '➕ Create User'}
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
                        <div className={`p-6 rounded-2xl transition-all ${
                            isDark 
                                ? 'bg-gray-800 border border-gray-700 shadow-xl' 
                                : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 shadow-2xl'
                        }`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-indigo-950'}`}>
                                    📅 My Attendance History
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
                                }} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Download
                                </button>
                            </div>
                            <div className="overflow-x-auto rounded-lg border border-blue-200">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className={`border-b-2 ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-indigo-400 bg-gradient-to-r from-indigo-200 to-blue-200'}`}>
                                            <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Date</th>
                                            <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>In</th>
                                            <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Out</th>
                                            <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Hours</th>
                                            <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Type</th>
                                            <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myAttendanceData.length > 0 ? myAttendanceData.map((record, index) => (
                                            <tr key={record._id} className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : `border-blue-100 ${index % 2 === 0 ? 'bg-blue-50/40' : 'bg-indigo-50/30'} hover:bg-blue-100/60`}`}>
                                                <td className={`p-4 text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-indigo-900'}`}>{record.date}</td>
                                                <td className={`p-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                                                <td className={`p-4 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                                                <td className={`p-4 text-sm font-bold ${isDark ? 'text-blue-400' : 'text-indigo-700'}`}>{record.workingHours ? record.workingHours.toFixed(2) + 'h' : '0h'}</td>
                                                <td className={`p-4 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{record.attendanceType}</td>
                                                <td><span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(record.status)}`}>{record.status}</span></td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className={`p-8 text-center font-semibold ${isDark ? 'text-gray-400' : 'text-indigo-600'}`}>
                                                    📊 No attendance records found
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

            {/* Request Leave Tab */}
            {activeTab === 'requestLeave' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LeaveRequest isDark={isDark} onSuccess={() => setLeaveRefresh(!leaveRefresh)} />
                    </div>
                    <LeaveHistory isDark={isDark} isAdmin={true} refreshKey={leaveRefresh} />
                </div>
            )}

            {/* Create User Tab */}
            {activeTab === 'users' && (
                <div className={`p-8 rounded-2xl transition-all max-w-2xl mx-auto ${
                    isDark ? 'bg-gray-800 border border-gray-700 shadow-xl' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-2xl'
                }`}>
                    <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-green-950'}`}>
                        ➕ Create New User
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
                            <input placeholder="Full Name" className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500' : 'bg-white border-green-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500'} focus:outline-none`} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                            <input placeholder="Email Address" type="email" className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500' : 'bg-white border-green-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500'} focus:outline-none`} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                            <input placeholder="Password (Min 6 chars)" type="password" className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500' : 'bg-white border-green-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500'} focus:outline-none`} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required minLength={6} />
                            <select className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-green-500' : 'bg-white border-green-300 text-gray-900 focus:ring-2 focus:ring-green-500'} focus:outline-none`} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                <option value="Admin">Admin</option>
                                <option value="Employee">Employee</option>
                            </select>
                            <input placeholder="Department (e.g., IT, HR)" className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500' : 'bg-white border-green-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500'} focus:outline-none`} value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />
                            <input placeholder="Designation (e.g., Developer)" className={`w-full p-3.5 rounded-lg border-2 transition-all font-medium ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500' : 'bg-white border-green-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500'} focus:outline-none`} value={newUser.designation} onChange={e => setNewUser({...newUser, designation: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]">
                            ✅ Create User
                        </button>
                    </form>
                </div>
            )}

            {/* All Attendance Tab */}
            {activeTab === 'attendance' && (
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800 border border-gray-700 shadow-xl' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 shadow-2xl'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-amber-950'}`}>
                            📊 All Attendance Records
                        </h3>
                        <button 
                            onClick={handleDownload} 
                            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Download Full Report
                        </button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-amber-200">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className={`border-b-2 ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-amber-400 bg-gradient-to-r from-amber-200 to-orange-200'}`}>
                                    <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-amber-950'}`}>Employee</th>
                                    <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-amber-950'}`}>Date</th>
                                    <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-amber-950'}`}>In Time</th>
                                    <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-amber-950'}`}>Out Time</th>
                                    <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-amber-950'}`}>Hours</th>
                                    <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-amber-950'}`}>Type</th>
                                    <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-amber-950'}`}>Status</th>
                                    <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-amber-950'}`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.slice(0, 50).map((record, index) => (
                                    <tr key={record._id} className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : `border-amber-100 ${index % 2 === 0 ? 'bg-amber-50/40' : 'bg-orange-50/30'} hover:bg-amber-100/60`}`}>
                                        <td className={`p-4 font-semibold ${isDark ? 'text-gray-300' : 'text-amber-900'}`}>{record.user?.name || '-'}</td>
                                        <td className={`p-4 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{record.date}</td>
                                        <td className={`p-4 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                                        <td className={`p-4 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
                                        <td className={`p-4 font-bold ${isDark ? 'text-blue-400' : 'text-amber-700'}`}>{record.workingHours ? record.workingHours.toFixed(2) + 'h' : '-'}</td>
                                        <td className={`p-4 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{record.attendanceType || '-'}</td>
                                        <td><span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(record.status)}`}>{record.status}</span></td>
                                        <td className="p-4 flex gap-2">
                                            <button onClick={() => handleApprove(record._id, 'Approved')} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold transition-all shadow-md hover:shadow-lg">✓ Approve</button>
                                            <button onClick={() => handleRectify(record._id)} className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-3 py-1 rounded text-xs font-semibold transition-all shadow-md hover:shadow-lg">✎ Rectify</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SuperAdminDashboard;
