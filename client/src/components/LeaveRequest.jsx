import React, { useState } from 'react';
import axios from '../api/axios';

const LeaveRequest = ({ isDark, onSuccess }) => {
    const [formData, setFormData] = useState({
        leaveType: 'Sick Leave',
        startDate: '',
        endDate: '',
        reason: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            if (!formData.startDate || !formData.endDate || !formData.reason) {
                setError('All fields are required');
                setLoading(false);
                return;
            }

            const response = await axios.post('/leaves/create', formData);
            setMessage(response.data.message);
            setFormData({
                leaveType: 'Sick Leave',
                startDate: '',
                endDate: '',
                reason: '',
            });
            if (onSuccess) onSuccess();

            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to submit leave request';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`p-6 rounded-2xl transition-all ${
            isDark 
                ? 'bg-gray-800 border border-gray-700 shadow-xl' 
                : 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-2xl'
        }`}>
            <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-purple-950'}`}>
                📝 Request Leave
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

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-purple-900'}`}>
                        Leave Type
                    </label>
                    <select 
                        name="leaveType"
                        value={formData.leaveType}
                        onChange={handleChange}
                        className={`w-full p-3 rounded-lg border-2 transition-all font-medium ${
                            isDark 
                                ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-purple-500' 
                                : 'bg-white border-purple-300 text-gray-900 focus:ring-2 focus:ring-purple-500'
                        } focus:outline-none`}
                    >
                        <option value="Sick Leave">🤒 Sick Leave</option>
                        <option value="Casual Leave">😴 Casual Leave</option>
                        <option value="Paid Leave">💰 Paid Leave</option>
                        <option value="Unpaid Leave">📌 Unpaid Leave</option>
                        <option value="Maternity Leave">👶 Maternity Leave</option>
                        <option value="Paternity Leave">👨‍👧 Paternity Leave</option>
                        <option value="Bereavement Leave">🙏 Bereavement Leave</option>
                        <option value="Other">📋 Other</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-purple-900'}`}>
                            Start Date
                        </label>
                        <div className={`relative flex items-center rounded-lg border-2 transition-all overflow-hidden ${
                            isDark 
                                ? 'border-purple-500 bg-gray-700' 
                                : 'border-purple-400 bg-white'
                        } focus-within:ring-2 focus-within:ring-purple-500`}>
                            <svg className={`absolute left-3 w-6 h-6 pointer-events-none flex-shrink-0 ${
                                isDark ? 'text-purple-400' : 'text-purple-600'
                            }`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-5-5H7v5h7v-5z"/>
                            </svg>
                            <input 
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className={`w-full p-3 pl-12 rounded-lg border-0 transition-all font-medium text-base ${
                                    isDark 
                                        ? 'bg-gray-700 text-white focus:ring-0' 
                                        : 'bg-white text-gray-900 focus:ring-0'
                                } focus:outline-none cursor-pointer`}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-purple-900'}`}>
                            End Date
                        </label>
                        <div className={`relative flex items-center rounded-lg border-2 transition-all overflow-hidden ${
                            isDark 
                                ? 'border-purple-500 bg-gray-700' 
                                : 'border-purple-400 bg-white'
                        } focus-within:ring-2 focus-within:ring-purple-500`}>
                            <svg className={`absolute left-3 w-6 h-6 pointer-events-none flex-shrink-0 ${
                                isDark ? 'text-purple-400' : 'text-purple-600'
                            }`} fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-5-5H7v5h7v-5z"/>
                            </svg>
                            <input 
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className={`w-full p-3 pl-12 rounded-lg border-0 transition-all font-medium text-base ${
                                    isDark 
                                        ? 'bg-gray-700 text-white focus:ring-0' 
                                        : 'bg-white text-gray-900 focus:ring-0'
                                } focus:outline-none cursor-pointer`}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-purple-900'}`}>
                        Reason
                    </label>
                    <textarea 
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="Please provide a reason for your leave request..."
                        rows="4"
                        className={`w-full p-3 rounded-lg border-2 transition-all font-medium resize-none ${
                            isDark 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500' 
                                : 'bg-white border-purple-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500'
                        } focus:outline-none`}
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className={`w-full p-4 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${
                        loading 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                    }`}
                >
                    {loading ? '⏳ Submitting...' : '✅ Submit Leave Request'}
                </button>
            </form>
        </div>
    );
};

export default LeaveRequest;
