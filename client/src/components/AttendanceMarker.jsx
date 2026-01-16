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
        <div className={`p-4 sm:p-6 rounded-xl shadow-lg transition-colors ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
            <h3 className={`text-lg sm:text-xl font-extrabold mb-4 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-gray-900'
            }`}>
                <Camera size={20} className="sm:w-6 sm:h-6" /> Mark Attendance
            </h3>
            
            {error && (
                <div className={`p-3 mb-4 rounded-lg flex items-center gap-2 font-bold text-sm ${
                    isDark ? 'bg-red-900/30 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    <AlertCircle size={16}/> {error}
                </div>
            )}

            <div className="flex gap-2 sm:gap-4 mb-4">
                <button 
                    onClick={() => {
                        setMode('checkin');
                        setError('');
                    }} 
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors ${
                        mode === 'checkin' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : isDark 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Check In
                </button>
                <button 
                    onClick={() => {
                        setMode('checkout');
                        setError('');
                    }} 
                    className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors ${
                        mode === 'checkout' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : isDark 
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Check Out
                </button>
            </div>

            {mode === 'checkin' && (
                <div className="mb-4">
                    <label className={`block font-bold text-xs sm:text-sm mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        Attendance Type
                    </label>
                    <select 
                        className={`w-full p-2 sm:p-3 border-2 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                            isDark
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        value={attendanceType}
                        onChange={(e) => setAttendanceType(e.target.value)}
                    >
                        <option value="Office">Office</option>
                        <option value="WFH">Work From Home</option>
                        <option value="Field">Field / Client Location</option>
                    </select>
                </div>
            )}

            <div className="mb-4 rounded-lg overflow-hidden">
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
                        className={`flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-colors ${
                            isDark 
                                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                                : 'bg-gray-800 text-white hover:bg-gray-900'
                        }`}
                    >
                        Capture Photo
                    </button>
                ) : (
                    <button 
                        onClick={() => {
                            setImgSrc(null);
                            setError('');
                        }} 
                        className={`flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-colors ${
                            isDark 
                                ? 'bg-gray-600 text-white hover:bg-gray-500' 
                                : 'bg-gray-500 text-white hover:bg-gray-600'
                        }`}
                    >
                        Retake
                    </button>
                )}
                
                <button 
                    onClick={getLocation} 
                    className={`flex-1 px-4 py-2.5 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 ${
                        location
                            ? isDark 
                                ? 'bg-green-700 text-white' 
                                : 'bg-green-600 text-white'
                            : isDark
                                ? 'bg-green-800 text-white hover:bg-green-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    <MapPin size={16} /> {location ? 'Location Captured' : 'Get Location'}
                </button>
            </div>

            <button 
                onClick={handleSubmit} 
                disabled={loading || !imgSrc || !location}
                className={`w-full py-3 rounded-lg font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                    loading || !imgSrc || !location
                        ? isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-500'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
                {loading ? 'Processing...' : <><CheckCircle size={20} /> Submit Attendance</>}
            </button>
        </div>
    );
};

export default AttendanceMarker;
