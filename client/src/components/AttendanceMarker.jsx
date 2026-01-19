import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from '../api/axios';
import { Camera, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const AttendanceMarker = ({ onSuccess }) => {
    const { isDark } = useTheme();
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attendanceType, setAttendanceType] = useState('Office');
    const [mode, setMode] = useState('checkin'); // checkin or checkout

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    }, [webcamRef]);

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setError('');
            },
            () => {
                setError('Unable to retrieve your location');
            }
        );
    };

    const handleSubmit = async () => {
        if (!imgSrc || !location) {
            setError('Please capture image and allow location access');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Convert base64 to blob
            const fetchRes = await fetch(imgSrc);
            const blob = await fetchRes.blob();
            const file = new File([blob], "attendance.jpg", { type: "image/jpeg" });

            const formData = new FormData();
            formData.append('image', file);
            formData.append('latitude', location.latitude);
            formData.append('longitude', location.longitude);
            formData.append('address', `Lat: ${location.latitude}, Long: ${location.longitude}`);
            
            if (mode === 'checkin') {
                formData.append('attendanceType', attendanceType);
                await axios.post('/attendance/checkin', formData);
            } else {
                await axios.put('/attendance/checkout', formData);
            }
            
            setImgSrc(null);
            setLocation(null);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Attendance marking failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`p-4 sm:p-6 rounded-2xl transition-colors ${
            isDark ? 'bg-gray-800 border border-gray-700 shadow-xl' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 shadow-2xl'
        }`}>
            <h3 className={`text-lg sm:text-xl font-extrabold mb-5 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-indigo-950'
            }`}>
                <Camera size={24} className="sm:w-7 sm:h-7" /> Mark Attendance
            </h3>
            
            {error && (
                <div className={`p-3 mb-4 rounded-lg flex items-center gap-2 font-bold text-sm ${
                    isDark ? 'bg-red-900/30 text-red-300 border border-red-700' : 'bg-red-100 text-red-800 border border-red-300'
                }`}>
                    <AlertCircle size={16}/> {error}
                </div>
            )}

            <div className={`flex gap-2 sm:gap-4 mb-5 p-3 rounded-xl ${
                isDark ? 'bg-gray-700/50' : 'bg-gradient-to-r from-indigo-100 to-blue-100 border border-blue-200'
            }`}>
                <button 
                    onClick={() => {
                        setMode('checkin');
                        setError('');
                    }} 
                    className={`flex-1 px-3 sm:px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                        mode === 'checkin' 
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg scale-105' 
                            : isDark 
                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-300'
                    }`}
                >
                    ✓ Check In
                </button>
                <button 
                    onClick={() => {
                        setMode('checkout');
                        setError('');
                    }} 
                    className={`flex-1 px-3 sm:px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                        mode === 'checkout' 
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg scale-105' 
                            : isDark 
                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                                : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-300'
                    }`}
                >
                    ✕ Check Out
                </button>
            </div>

            {mode === 'checkin' && (
                <div className="mb-5 p-3 rounded-lg bg-gradient-to-r from-indigo-100 to-blue-100 border border-indigo-300">
                    <label className={`block font-bold text-xs sm:text-sm mb-2 ${
                        isDark ? 'text-gray-300' : 'text-indigo-950'
                    }`}>
                        🏢 Attendance Type
                    </label>
                    <select 
                        className={`w-full p-2.5 sm:p-3 border-2 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
                            isDark
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-indigo-400 text-gray-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200'
                        }`}
                        value={attendanceType}
                        onChange={(e) => setAttendanceType(e.target.value)}
                    >
                        <option value="Office">🏢 Office</option>
                        <option value="WFH">💻 Work From Home</option>
                        <option value="Field">🌍 Field / Client Location</option>
                    </select>
                </div>
            )}

            <div className="mb-4 rounded-xl overflow-hidden border-2 border-indigo-300 shadow-md">
                {imgSrc ? (
                    <img src={imgSrc} alt="captured" className="w-full h-auto rounded-lg" />
                ) : (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-auto rounded-lg"
                        videoConstraints={{
                            width: { ideal: 640 },
                            height: { ideal: 480 },
                            facingMode: 'user'
                        }}
                    />
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                {!imgSrc ? (
                    <button 
                        onClick={capture} 
                        className={`flex-1 px-4 py-3 rounded-lg font-bold text-xs sm:text-sm transition-all transform hover:scale-105 ${
                            isDark 
                                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                : 'bg-gradient-to-r from-indigo-700 to-blue-800 text-white hover:from-indigo-800 hover:to-blue-900 shadow-lg'
                        }`}
                    >
                        📸 Capture Photo
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            setImgSrc(null);
                            setError('');
                        }} 
                        className={`flex-1 px-4 py-3 rounded-lg font-bold text-xs sm:text-sm transition-all transform hover:scale-105 ${
                            isDark 
                                ? 'bg-gray-600 text-white hover:bg-gray-500' 
                                : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg'
                        }`}
                    >
                        🔄 Retake
                    </button>
                )}
                
                <button 
                    onClick={getLocation} 
                    className={`flex-1 px-4 py-3 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 transform hover:scale-105 ${
                        location
                            ? isDark 
                                ? 'bg-green-700 text-white' 
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                            : isDark
                                ? 'bg-green-800 text-white hover:bg-green-700'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-lg'
                    }`}
                >
                    <MapPin size={16} /> {location ? '📍 Location Captured' : '📍 Get Location'}
                </button>
            </div>

            <button 
                onClick={handleSubmit} 
                disabled={loading || !imgSrc || !location}
                className={`w-full py-3 rounded-lg font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:disabled:scale-100 ${
                    loading || !imgSrc || !location
                        ? isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-500'
                        : 'bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white hover:from-indigo-700 hover:via-blue-700 hover:to-purple-700'
                }`}
            >
                {loading ? '⏳ Processing...' : <><CheckCircle size={20} /> Submit Attendance</>}
            </button>
        </div>
    );
};

export default AttendanceMarker;
