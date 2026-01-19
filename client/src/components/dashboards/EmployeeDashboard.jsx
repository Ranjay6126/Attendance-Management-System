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

    const chartOptions = {
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    font: {
                        weight: 'bold',
                        size: 13,
                    },
                    padding: 15,
                }
            }
        }
    };

    const data = {
        labels: ['Present', 'Absent', 'Leave'],
        datasets: [
            {
                data: [stats.Present, stats.Absent, stats.Leave],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                borderColor: [isDark ? '#1e293b' : '#ffffff', isDark ? '#1e293b' : '#ffffff', isDark ? '#1e293b' : '#ffffff'],
                borderWidth: 3,
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
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    const getStatusBadgeColor = (status) => {
        switch(status) {
            case 'Present':
            case 'Pending Approval':
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
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-6 rounded-xl transition-all ${
                    isDark 
                        ? 'bg-gradient-to-br from-green-900 to-green-800 border border-green-700 shadow-lg' 
                        : 'bg-gradient-to-br from-green-50 to-green-100 border border-green-300 shadow-md'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-green-200' : 'text-green-700'}`}>
                                Total Present
                            </p>
                            <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-green-900'}`}>
                                {stats.Present}
                            </p>
                        </div>
                        <svg className={`w-12 h-12 ${isDark ? 'text-green-400' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                <div className={`p-6 rounded-xl transition-all ${
                    isDark 
                        ? 'bg-gradient-to-br from-red-900 to-red-800 border border-red-700 shadow-lg' 
                        : 'bg-gradient-to-br from-red-50 to-red-100 border border-red-300 shadow-md'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-red-200' : 'text-red-700'}`}>
                                Total Absent
                            </p>
                            <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-red-900'}`}>
                                {stats.Absent}
                            </p>
                        </div>
                        <svg className={`w-12 h-12 ${isDark ? 'text-red-400' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                <div className={`p-6 rounded-xl transition-all ${
                    isDark 
                        ? 'bg-gradient-to-br from-amber-900 to-amber-800 border border-amber-700 shadow-lg' 
                        : 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 shadow-md'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>
                                Total Leave
                            </p>
                            <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-amber-900'}`}>
                                {stats.Leave}
                            </p>
                        </div>
                        <svg className={`w-12 h-12 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Attendance Marker and Chart */}
                <div className="lg:col-span-1 space-y-6">
                    <AttendanceMarker onSuccess={() => setRefresh(!refresh)} />
                </div>
                
                {/* Right Column - History Table */}
                <div className="lg:col-span-2">
                    <div className={`p-6 rounded-xl transition-all ${
                        isDark 
                            ? 'bg-gray-800 border border-gray-700 shadow-xl' 
                            : 'bg-white border border-gray-200 shadow-lg'
                    }`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <h3 className={`text-lg font-bold ${
                                isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                                Attendance History (Last 3 Months)
                            </h3>
                            <button 
                                onClick={handleDownload} 
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Download Report
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className={`border-b-2 ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-300 bg-gray-100'}`}>
                                        <th className={`p-3 font-bold text-xs uppercase tracking-wider ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}>Date</th>
                                        <th className={`p-3 font-bold text-xs uppercase tracking-wider ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}>Check In</th>
                                        <th className={`p-3 font-bold text-xs uppercase tracking-wider ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}>Check Out</th>
                                        <th className={`p-3 font-bold text-xs uppercase tracking-wider ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}>Hours</th>
                                        <th className={`p-3 font-bold text-xs uppercase tracking-wider ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}>Type</th>
                                        <th className={`p-3 font-bold text-xs uppercase tracking-wider ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceHistory.length > 0 ? attendanceHistory.map((record) => (
                                        <tr key={record._id} className={`border-b transition-colors ${
                                            isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'
                                        }`}>
                                            <td className={`p-3 text-sm font-medium ${
                                                isDark ? 'text-gray-300' : 'text-gray-800'
                                            }`}>
                                                {record.date}
                                            </td>
                                            <td className={`p-3 text-sm font-medium ${
                                                isDark ? 'text-gray-300' : 'text-gray-800'
                                            }`}>
                                                {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}
                                            </td>
                                            <td className={`p-3 text-sm font-medium ${
                                                isDark ? 'text-gray-300' : 'text-gray-800'
                                            }`}>
                                                {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                                            </td>
                                            <td className={`p-3 text-sm font-bold ${
                                                isDark ? 'text-blue-400' : 'text-blue-600'
                                            }`}>
                                                {record.workingHours ? record.workingHours.toFixed(2) + 'h' : '0h'}
                                            </td>
                                            <td className={`p-3 text-sm font-semibold ${
                                                isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                                {record.attendanceType}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className={`p-8 text-center font-semibold ${
                                                isDark ? 'text-gray-400' : 'text-gray-500'
                                            }`}>
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
        </div>
    );
};

export default EmployeeDashboard;
