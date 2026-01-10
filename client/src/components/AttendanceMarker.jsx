import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from '../api/axios';
import { Camera, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

const AttendanceMarker = ({ onSuccess }) => {
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
            formData.append('address', `Lat: ${location.latitude}, Long: ${location.longitude}`); // Mock address for now, ideally reverse geocode
            
            if (mode === 'checkin') {
                formData.append('attendanceType', attendanceType);
                await axios.post('/attendance/checkin', formData);
            } else {
                await axios.put('/attendance/checkout', formData);
            }
            
            setImgSrc(null);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Attendance marking failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Camera size={24} /> Mark Attendance
            </h3>
            
            {error && <div className="bg-red-100 text-red-700 p-2 mb-4 rounded flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}

            <div className="flex gap-4 mb-4">
                <button 
                    onClick={() => setMode('checkin')} 
                    className={`px-4 py-2 rounded ${mode === 'checkin' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Check In
                </button>
                <button 
                    onClick={() => setMode('checkout')} 
                    className={`px-4 py-2 rounded ${mode === 'checkout' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Check Out
                </button>
            </div>

            {mode === 'checkin' && (
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Attendance Type</label>
                    <select 
                        className="w-full p-2 border rounded"
                        value={attendanceType}
                        onChange={(e) => setAttendanceType(e.target.value)}
                    >
                        <option value="Office">Office</option>
                        <option value="WFH">Work From Home</option>
                        <option value="Field">Field / Client Location</option>
                    </select>
                </div>
            )}

            <div className="mb-4">
                {imgSrc ? (
                    <img src={imgSrc} alt="captured" className="w-full rounded" />
                ) : (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full rounded"
                    />
                )}
            </div>

            <div className="flex gap-2 mb-4">
                {!imgSrc ? (
                    <button onClick={capture} className="bg-gray-800 text-white px-4 py-2 rounded flex-1">Capture Photo</button>
                ) : (
                    <button onClick={() => setImgSrc(null)} className="bg-gray-500 text-white px-4 py-2 rounded flex-1">Retake</button>
                )}
                
                <button onClick={getLocation} className="bg-green-600 text-white px-4 py-2 rounded flex-1 flex items-center justify-center gap-2">
                    <MapPin size={16} /> {location ? 'Location Captured' : 'Get Location'}
                </button>
            </div>

            <button 
                onClick={handleSubmit} 
                disabled={loading || !imgSrc || !location}
                className="w-full bg-blue-600 text-white py-3 rounded font-bold disabled:bg-gray-300 flex items-center justify-center gap-2"
            >
                {loading ? 'Processing...' : <><CheckCircle size={20} /> Submit Attendance</>}
            </button>
        </div>
    );
};

export default AttendanceMarker;
