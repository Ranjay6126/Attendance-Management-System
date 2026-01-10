import { useState, useEffect } from 'react';
import axios from '../../api/axios';

const SuperAdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('attendance');
    const [attendanceData, setAttendanceData] = useState([]);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Admin', department: '', designation: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchAttendance();
    }, []);

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
        try {
            await axios.post('/auth/register', newUser);
            setMessage('User created successfully');
            setNewUser({ name: '', email: '', password: '', role: 'Admin', department: '', designation: '' });
        } catch (error) {
            setMessage('Failed to create user');
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
            <div className="flex gap-4 mb-6">
                <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded ${activeTab === 'attendance' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>Full System Attendance</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>Create Admin/Employee</button>
            </div>

            {activeTab === 'users' && (
                <div className="bg-white p-6 rounded shadow-md max-w-2xl">
                    <h3 className="text-xl font-bold mb-4">Create New User</h3>
                    {message && <div className="mb-4 text-green-600">{message}</div>}
                    <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                        <input placeholder="Name" className="p-2 border rounded" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                        <input placeholder="Email" type="email" className="p-2 border rounded" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                        <input placeholder="Password" type="password" className="p-2 border rounded" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                        <select className="p-2 border rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                            <option value="Admin">Admin</option>
                            <option value="Employee">Employee</option>
                        </select>
                        <input placeholder="Department" className="p-2 border rounded" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />
                        <input placeholder="Designation" className="p-2 border rounded" value={newUser.designation} onChange={e => setNewUser({...newUser, designation: e.target.value})} />
                        <button type="submit" className="col-span-2 bg-purple-600 text-white p-2 rounded">Create User</button>
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
                                    <th className="p-3 border">In</th>
                                    <th className="p-3 border">Out</th>
                                    <th className="p-3 border">Hours</th>
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
                                        <td className="p-3">{record.workingHours ? record.workingHours.toFixed(2) : '0'}</td>
                                        <td className="p-3">{record.status} ({record.approvalStatus})</td>
                                        <td className="p-3 flex gap-2">
                                            <button onClick={() => handleApprove(record._id, 'Approved')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Approve</button>
                                            <button onClick={() => handleRectify(record._id)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Rectify</button>
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
