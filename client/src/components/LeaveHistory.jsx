import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const LeaveHistory = ({ isDark, isAdmin = false, refreshKey, hideCancel = false, excludeOwnLeaves = false }) => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLeaves();
    }, [isAdmin, refreshKey, excludeOwnLeaves]);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const endpoint = isAdmin ? '/leaves/all-leaves' : '/leaves/my-leaves';
            const response = await axios.get(endpoint);
            
            // Filter out admin's own leaves if excludeOwnLeaves is true
            let filteredLeaves = response.data;
            if (excludeOwnLeaves && isAdmin && user) {
                filteredLeaves = response.data.filter(leave => {
                    const leaveUserId = typeof leave.user === 'object' ? leave.user._id : leave.user;
                    return leaveUserId !== user._id;
                });
            }
            
            setLeaves(filteredLeaves);
            setError('');
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch leaves';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (leaveId) => {
        try {
            const reason = prompt('Enter approval comments (optional):');
            await axios.put(`/leaves/${leaveId}/approve`, { comments: reason || '' });
            setMessage('Leave approved successfully');
            fetchLeaves();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to approve leave';
            setError(errorMsg);
        }
    };

    const handleReject = async (leaveId) => {
        try {
            const reason = prompt('Enter rejection reason:');
            if (!reason) return;
            await axios.put(`/leaves/${leaveId}/reject`, { comments: reason });
            setMessage('Leave rejected successfully');
            fetchLeaves();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to reject leave';
            setError(errorMsg);
        }
    };

    const handleCancel = async (leaveId) => {
        if (window.confirm('Are you sure you want to cancel this leave?')) {
            try {
                await axios.put(`/leaves/${leaveId}/cancel`, {});
                setMessage('Leave cancelled successfully');
                fetchLeaves();
                setTimeout(() => setMessage(''), 3000);
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.message || 'Failed to cancel leave';
                setError(errorMsg);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved':
                return isDark ? 'bg-green-900/30 text-green-300 border-green-700' : 'bg-green-50 text-green-700 border-green-200';
            case 'Rejected':
                return isDark ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-50 text-red-700 border-red-200';
            case 'Pending':
                return isDark ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700' : 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'Cancelled':
                return isDark ? 'bg-gray-900/30 text-gray-300 border-gray-700' : 'bg-gray-50 text-gray-700 border-gray-200';
            default:
                return isDark ? 'bg-blue-900/30 text-blue-300 border-blue-700' : 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return '✅';
            case 'Rejected': return '❌';
            case 'Pending': return '⏳';
            case 'Cancelled': return '🚫';
            default: return '📋';
        }
    };

    return (
        <div className={`p-6 rounded-2xl transition-all ${
            isDark 
                ? 'bg-gray-800 border border-gray-700 shadow-xl' 
                : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 shadow-2xl'
        }`}>
            <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-indigo-950'}`}>
                📅 {isAdmin ? 'All Leave Requests' : 'My Leave History'}
            </h3>

            {message && (
                <div className={`mb-4 p-4 rounded-lg font-semibold border flex items-center gap-2 ${
                    isDark 
                        ? 'bg-green-900/30 text-green-300 border-green-700' 
                        : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {message}
                </div>
            )}

            {error && (
                <div className={`mb-4 p-4 rounded-lg font-semibold border flex items-center gap-2 ${
                    isDark 
                        ? 'bg-red-900/30 text-red-300 border-red-700' 
                        : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <p className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-indigo-600'}`}>
                        ⏳ Loading leave requests...
                    </p>
                </div>
            ) : leaves.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-indigo-200">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className={`border-b-2 ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-indigo-400 bg-gradient-to-r from-indigo-200 to-purple-200'}`}>
                                {isAdmin && <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Employee</th>}
                                <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Type</th>
                                <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>From</th>
                                <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>To</th>
                                <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Days</th>
                                <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Reason</th>
                                <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Status</th>
                                {isAdmin && <th className={`p-4 font-bold text-xs uppercase tracking-wider ${isDark ? 'text-gray-300' : 'text-indigo-950'}`}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map((leave, index) => (
                                <tr 
                                    key={leave._id} 
                                    className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : `border-indigo-100 ${index % 2 === 0 ? 'bg-indigo-50/40' : 'bg-purple-50/30'} hover:bg-indigo-100/60`}`}
                                >
                                    {isAdmin && <td className={`p-4 font-semibold ${isDark ? 'text-gray-300' : 'text-indigo-900'}`}>{leave.user?.name || '-'}</td>}
                                    <td className={`p-4 font-semibold ${isDark ? 'text-gray-300' : 'text-indigo-900'}`}>{leave.leaveType}</td>
                                    <td className={`p-4 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{new Date(leave.startDate).toLocaleDateString()}</td>
                                    <td className={`p-4 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{new Date(leave.endDate).toLocaleDateString()}</td>
                                    <td className={`p-4 font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{leave.numberOfDays} days</td>
                                    <td className={`p-4 text-xs max-w-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-700'}`} title={leave.reason}>{leave.reason}</td>
                                    <td className={`p-4`}>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(leave.status)}`}>
                                            {getStatusIcon(leave.status)} {leave.status}
                                        </span>
                                    </td>
                                    {isAdmin && leave.status === 'Pending' && (
                                        <td className="p-4 flex gap-2">
                                            <button 
                                                onClick={() => handleApprove(leave._id)}
                                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold transition-all shadow-md hover:shadow-lg"
                                            >
                                                ✓ Approve
                                            </button>
                                            <button 
                                                onClick={() => handleReject(leave._id)}
                                                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-3 py-1 rounded text-xs font-semibold transition-all shadow-md hover:shadow-lg"
                                            >
                                                ✗ Reject
                                            </button>
                                        </td>
                                    )}
                                    {!isAdmin && !hideCancel && (leave.status === 'Pending' || leave.status === 'Approved') && (
                                        <td className="p-4">
                                            <button 
                                                onClick={() => handleCancel(leave._id)}
                                                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-3 py-1 rounded text-xs font-semibold transition-all shadow-md hover:shadow-lg"
                                            >
                                                🚫 Cancel
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={`text-center py-8 p-4 rounded-lg ${isDark ? 'bg-gray-700/30' : 'bg-indigo-50/50'}`}>
                    <p className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-indigo-600'}`}>
                        📋 No leave requests found
                    </p>
                </div>
            )}
        </div>
    );
};

export default LeaveHistory;
