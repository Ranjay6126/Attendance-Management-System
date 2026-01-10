import { useState, useEffect } from 'react';
import AttendanceMarker from '../AttendanceMarker';
import axios from '../../api/axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const EmployeeDashboard = () => {
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [refresh, setRefresh] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await axios.get('/attendance');
                setAttendanceHistory(data);
            } catch (error) {
                console.error('Error fetching history', error);
            }
        };
        fetchHistory();
    }, [refresh]);

    const stats = {
        Present: attendanceHistory.filter(a => a.status === 'Present' || a.status === 'Pending Approval').length,
        Absent: attendanceHistory.filter(a => a.status === 'Absent').length,
        Leave: attendanceHistory.filter(a => a.status === 'Leave').length,
    };

    const data = {
        labels: ['Present', 'Absent', 'Leave'],
        datasets: [
            {
                data: [stats.Present, stats.Absent, stats.Leave],
                backgroundColor: ['#4ade80', '#f87171', '#fbbf24'],
            },
        ],
    };

    const handleDownload = async () => {
        try {
            const response = await axios.get('/attendance/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'attendance.xlsx');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <AttendanceMarker onSuccess={() => setRefresh(!refresh)} />
                <div className="mt-6 bg-white p-6 rounded shadow-md">
                    <h3 className="text-xl font-bold mb-4">Monthly Summary</h3>
                    <Pie data={data} />
                </div>
            </div>
            
            <div className="md:col-span-2">
                <div className="bg-white p-6 rounded shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Attendance History (Last 3 Months)</h3>
                        <button onClick={handleDownload} className="bg-green-600 text-white px-4 py-2 rounded">Download Report</button>
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
                                </tr>
                            </thead>
                            <tbody>
                                {attendanceHistory.map((record) => (
                                    <tr key={record._id} className="border-b">
                                        <td className="p-3">{record.date}</td>
                                        <td className="p-3">{record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}</td>
                                        <td className="p-3">{record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}</td>
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
                                    </tr>
                                ))}
                                {attendanceHistory.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-3 text-center">No records found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
