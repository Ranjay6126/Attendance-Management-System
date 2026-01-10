import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('attendance');
    const [attendanceData, setAttendanceData] = useState([]);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Employee', department: '', designation: '' });
    const [message, setMessage] = useState('');
    const [selectedRecord, setSelectedRecord] = useState(null); // For modal
    const [modalMode, setModalMode] = useState(''); // 'approve', 'rectify'
    const [remarks, setRemarks] = useState('');
    const [rectifyData, setRectifyData] = useState({ status: '', checkInTime: '', checkOutTime: '', attendanceType: '' });
    const [exportFilters, setExportFilters] = useState({ startDate: '', endDate: '', employeeId: '', attendanceType: '' });

    useEffect(() => {
        fetchAttendance();
        fetchAnalytics();
    }, []);

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
        try {
            await axios.post('/auth/register', newUser);
            setMessage('User created successfully');
            setNewUser({ name: '', email: '', password: '', role: 'Employee', department: '', designation: '' });
        } catch (error) {
            setMessage('Failed to create user');
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
            <div className="flex gap-4 mb-6">
                <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded ${activeTab === 'attendance' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Attendance Management</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Create Employee</button>
                <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Analytics</button>
            </div>

            {activeTab === 'users' && (
                <div className="bg-white p-6 rounded shadow-md max-w-2xl">
                    <h3 className="text-xl font-bold mb-4">Create New Employee</h3>
                    {message && <div className="mb-4 text-green-600">{message}</div>}
                    <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                        <input placeholder="Name" className="p-2 border rounded" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                        <input placeholder="Email" type="email" className="p-2 border rounded" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                        <input placeholder="Password" type="password" className="p-2 border rounded" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                        <select className="p-2 border rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                            <option value="Employee">Employee</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <input placeholder="Department" className="p-2 border rounded" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} />
                        <input placeholder="Designation" className="p-2 border rounded" value={newUser.designation} onChange={e => setNewUser({...newUser, designation: e.target.value})} />
                        <button type="submit" className="col-span-2 bg-blue-600 text-white p-2 rounded">Create User</button>
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
