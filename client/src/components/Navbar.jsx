import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import axios from '../api/axios';

const Navbar = ({ onLogout }) => {
    const { user, setUser } = useAuth();
    const { isDark } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleProfileImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const { data } = await axios.post('/auth/upload-profile-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUser(data);
            alert('Profile image updated successfully!');
        } catch (error) {
            console.error('Upload failed:', error);
            alert(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const profileImageUrl = user?.profileImage ? `data:image/jpeg;base64,${user.profileImage}` : null;

    return (
        <nav className={`shadow-lg transition-all sticky top-0 z-50 ${
            isDark 
                ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700' 
                : 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 border-b border-blue-400'
        }`}>
            <div className="h-full px-3 sm:px-6 py-4">
                <div className="flex items-center justify-between h-full">
                    {/* Logo and Title */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold text-white ${
                            isDark ? 'bg-blue-600' : 'bg-white/20'
                        }`}>
                            HB
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-white font-bold text-lg sm:text-xl">Hat-Boy</h1>
                            <p className="text-blue-100 text-xs font-medium">Attendance System</p>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3 sm:gap-6">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Profile Section */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 sm:gap-3 focus:outline-none group"
                            >
                                {/* Profile Circle */}
                                <div className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white cursor-pointer transition-all ring-2 group-hover:ring-4 ${
                                    isDark 
                                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 ring-purple-400 group-hover:ring-purple-300' 
                                        : 'bg-gradient-to-br from-yellow-300 to-orange-400 ring-white group-hover:ring-gray-100'
                                }`}
                                title="Click to view profile options"
                                >
                                    {profileImageUrl ? (
                                        <img 
                                            src={profileImageUrl} 
                                            alt={user?.name} 
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm sm:text-base font-bold">
                                            {getInitials(user?.name || 'U')}
                                        </span>
                                    )}
                                </div>

                                {/* User Info - Hidden on small screens */}
                                <div className="hidden md:block text-left">
                                    <p className="text-white font-semibold text-sm truncate">
                                        {user?.name}
                                    </p>
                                    <p className="text-blue-100 text-xs truncate">
                                        {user?.role}
                                    </p>
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl transition-all z-50 ${
                                    isDark 
                                        ? 'bg-gray-800 border border-gray-700' 
                                        : 'bg-white border border-gray-200'
                                }`}>
                                    {/* Profile Info */}
                                    <div className={`p-4 border-b ${
                                        isDark ? 'border-gray-700' : 'border-gray-200'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white ${
                                                isDark 
                                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                                                    : 'bg-gradient-to-br from-yellow-300 to-orange-400'
                                            }`}>
                                                {profileImageUrl ? (
                                                    <img 
                                                        src={profileImageUrl} 
                                                        alt={user?.name} 
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span>{getInitials(user?.name || 'U')}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {user?.name}
                                                </p>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {user?.email}
                                                </p>
                                                <p className={`text-xs font-semibold mt-1 px-2 py-1 rounded-full w-fit ${
                                                    isDark 
                                                        ? 'bg-blue-900 text-blue-200' 
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {user?.role}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upload Profile Image */}
                                    <button
                                        onClick={handleProfileImageClick}
                                        disabled={isUploading}
                                        className={`w-full px-4 py-3 text-left text-sm font-semibold transition-colors border-b flex items-center gap-2 ${
                                            isDark 
                                                ? 'text-blue-400 hover:bg-gray-700 border-gray-700' 
                                                : 'text-blue-600 hover:bg-gray-50 border-gray-200'
                                        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                                        </svg>
                                        {isUploading ? 'Uploading...' : 'Upload Profile Picture'}
                                    </button>

                                    {/* Additional Info */}
                                    <div className={`px-4 py-3 border-b text-xs space-y-1 ${
                                        isDark ? 'border-gray-700' : 'border-gray-200'
                                    }`}>
                                        {user?.department && (
                                            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                <span className="font-semibold">Department:</span> {user.department}
                                            </p>
                                        )}
                                        {user?.designation && (
                                            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                                <span className="font-semibold">Designation:</span> {user.designation}
                                            </p>
                                        )}
                                    </div>

                                    {/* Logout */}
                                    <button
                                        onClick={() => {
                                            setIsDropdownOpen(false);
                                            onLogout();
                                        }}
                                        className={`w-full px-4 py-3 text-left text-sm font-semibold transition-colors flex items-center gap-2 ${
                                            isDark 
                                                ? 'text-red-400 hover:bg-gray-700' 
                                                : 'text-red-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9l-2.293 2.293z" clipRule="evenodd" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            )}

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
