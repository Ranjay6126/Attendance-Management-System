import { useState, useEffect } from 'react';
import AttendanceMarker from '../AttendanceMarker';
import axios from '../../api/axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

const EmployeeDashboard = () => {
    const { isDark } = useTheme();
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                <AttendanceMarker onSuccess={() => setRefresh(!refresh)} />
                <div className={`p-4 sm:p-6 rounded-xl transition-colors ${
                    isDark 
                        ? 'bg-gray-800 border border-gray-700 shadow-xl' 
                        : 'bg-white border border-gray-200 shadow-2xl'
                }`}>
                    <h3 className={`text-lg sm:text-xl font-extrabold mb-4 ${
                        isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                        Monthly Summary
                    </h3>
                    <div className="flex justify-center">
                        <Pie data={data} options={{ maintainAspectRatio: true }} />
                    </div>
                </div>
            </div>
            
            <div className="lg:col-span-2">
                <div className={`p-4 sm:p-6 rounded-xl transition-colors ${
                    isDark 
                        ? 'bg-gray-800 border border-gray-700 shadow-xl' 
                        : 'bg-white border border-gray-200 shadow-2xl'
                }`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                        <h3 className={`text-lg sm:text-xl font-extrabold ${
                            isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                            Attendance History (Last 3 Months)
                        </h3>
                        <button 
                            onClick={handleDownload} 
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
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
                                    {attendanceHistory.map((record) => (
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
                                    {attendanceHistory.length === 0 && (
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
    );
};

export default EmployeeDashboard;
