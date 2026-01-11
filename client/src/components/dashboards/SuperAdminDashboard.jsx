import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import AttendanceMarker from '../AttendanceMarker';
import { useAuth } from '../../context/AuthContext';

const SuperAdminDashboard = () => {
    const { user } = useAuth();
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
            <div className="flex gap-4 mb-6 flex-wrap">
                <button onClick={() => setActiveTab('myAttendance')} className={`px-4 py-2 rounded ${activeTab === 'myAttendance' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>My Attendance</button>
                <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded ${activeTab === 'attendance' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>All Attendance Records</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>Create Admin/Employee</button>
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
                        <div className="bg-white p-6 rounded shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold">My Attendance History (Last 3 Months)</h3>
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
                                }} className="bg-green-600 text-white px-4 py-2 rounded">Download Report</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-3 border">Date</th>
                                            <th className="p-3 border">Check In</th>
                                            <th className="p-3 border">Check Out</th>
                                            <th className="p-3 border">Hours</th>
                                            <th className="p-3 border">Type</th>
                                            <th className="p-3 border">Status</th>
                                            <th className="p-3 border">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myAttendanceData.map((record) => (
                                            <tr key={record._id} className="border-b">
                                                <td className="p-3">{record.date}</td>
                                                <td className="p-3">{record.checkInTime ? new Date(record.checkInTime).toLocaleString() : '-'}</td>
                                                <td className="p-3">{record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : '-'}</td>
                                                <td className="p-3">{record.workingHours ? record.workingHours.toFixed(2) : '0'}</td>
                                                <td className="p-3">{record.attendanceType}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-sm ${
                                                        record.status === 'Present' ? 'bg-green-100 text-green-800' :
                                                        record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs">
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
            )}

            {activeTab === 'users' && (
                <div className="bg-white p-6 rounded shadow-md max-w-2xl">
                    <h3 className="text-xl font-bold mb-4">Create New User</h3>
                    {message && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded border border-green-200">{message}</div>}
                    {errorMessage && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{errorMessage}</div>}
                    <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                        <input 
                            placeholder="Full Name (e.g., John Doe)" 
                            className="p-2 border rounded placeholder:text-gray-500 placeholder:opacity-100 text-gray-900" 
                            value={newUser.name} 
                            onChange={e => setNewUser({...newUser, name: e.target.value})} 
                            required 
                        />
                        <input 
                            placeholder="Email (e.g., john.doe@gmail.com)" 
                            type="email" 
                            className="p-2 border rounded placeholder:text-gray-500 placeholder:opacity-100 text-gray-900" 
                            value={newUser.email} 
                            onChange={e => setNewUser({...newUser, email: e.target.value})} 
                            required 
                        />
                        <input 
                            placeholder="Password (min 6 characters)" 
                            type="password" 
                            className="p-2 border rounded placeholder:text-gray-500 placeholder:opacity-100 text-gray-900" 
                            value={newUser.password} 
                            onChange={e => setNewUser({...newUser, password: e.target.value})} 
                            required 
                            minLength={6}
                        />
                        <select 
                            className="p-2 border rounded text-gray-900" 
                            value={newUser.role} 
                            onChange={e => setNewUser({...newUser, role: e.target.value})}
                        >
                            <option value="Admin">Admin</option>
                            <option value="Employee">Employee</option>
                        </select>
                        <div className="col-span-2 text-xs text-gray-500">
                            Note: Super Admin can only create Admin and Employee accounts. Provide the email and password to the user for login.
                        </div>
                        <input 
                            placeholder="Department (e.g., IT, HR, Sales)" 
                            className="p-2 border rounded placeholder:text-gray-500 placeholder:opacity-100 text-gray-900" 
                            value={newUser.department} 
                            onChange={e => setNewUser({...newUser, department: e.target.value})} 
                        />
                        <input 
                            placeholder="Designation (e.g., Developer, Manager)" 
                            className="p-2 border rounded placeholder:text-gray-500 placeholder:opacity-100 text-gray-900" 
                            value={newUser.designation} 
                            onChange={e => setNewUser({...newUser, designation: e.target.value})} 
                        />
                        <button type="submit" className="col-span-2 bg-purple-600 text-white p-2 rounded hover:bg-purple-700 transition-colors">Create User</button>
                    </form>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="bg-white p-6 rounded shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">All Attendance Records</h3>
                        <button onClick={handleDownload} className="bg-green-600 text-white px-4 py-2 rounded">Download Full Report</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="p-3 border">Employee</th>
                                    <th className="p-3 border">Date</th>
                                    <th className="p-3 border">Check In</th>
                                    <th className="p-3 border">Check Out</th>
                                    <th className="p-3 border">Hours</th>
                                    <th className="p-3 border">Type</th>
                                    <th className="p-3 border">Status</th>
                                    <th className="p-3 border">Location</th>
                                    <th className="p-3 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceData.map((record) => (
                                    <tr key={record._id} className="border-b">
                                        <td className="p-3">{record.user?.name}</td>
                                        <td className="p-3">{record.date}</td>
                                        <td className="p-3">{record.checkInTime ? new Date(record.checkInTime).toLocaleString() : '-'}</td>
                                        <td className="p-3">{record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : '-'}</td>
                                        <td className="p-3">{record.workingHours ? record.workingHours.toFixed(2) : '0'}</td>
                                        <td className="p-3">{record.attendanceType || '-'}</td>
                                        <td className="p-3">
                                            <div className="flex flex-col">
                                                <span className={`px-2 py-1 rounded text-sm ${
                                                    record.status === 'Present' ? 'bg-green-100 text-green-800' :
                                                    record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {record.status}
                                                </span>
                                                {record.approvalStatus && (
                                                    <span className="text-xs text-gray-500 mt-1">{record.approvalStatus}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-xs">
                                            {record.checkInLocation?.address || '-'}
                                        </td>
                                        <td className="p-3 flex gap-2">
                                            <button onClick={() => handleApprove(record._id, 'Approved')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Approve</button>
                                            <button onClick={() => handleRectify(record._id)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Rectify</button>
                                        </td>
                                    </tr>
                                ))}
                                {attendanceData.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="p-3 text-center">No records found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
