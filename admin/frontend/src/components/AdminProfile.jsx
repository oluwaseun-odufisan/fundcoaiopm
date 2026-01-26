import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { User, Mail, Bell, Lock, CheckCircle, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminProfile = ({ admin, setAdmin, onLogout }) => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: admin?.name || '',
        email: admin?.email || '',
        notifications: admin?.notifications ?? true,
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Sync formData with admin prop changes
    useEffect(() => {
        if (admin) {
            setFormData({
                name: admin.name,
                email: admin.email,
                notifications: admin.notifications,
            });
        }
    }, [admin]);

    // Redirect to dashboard after success message
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                navigate('/admin/dashboard');
            }, 2000); // 2-second delay
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);

    // Handle profile form changes
    const handleProfileChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setError('');
        setSuccess('');
    };

    // Handle password form changes
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    // Reset forms and return to profile settings
    const handleCancel = () => {
        setIsEditing(false);
        setIsChangingPassword(false);
        setFormData({
            name: admin.name,
            email: admin.email,
            notifications: admin.notifications,
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setError('');
        setSuccess('');
    };

    // Navigate to dashboard from profile settings
    const handleExit = () => {
        navigate('/admin/dashboard');
    };

    // Handle profile form submission
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        const token = localStorage.getItem('adminToken');
        if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
            setError('Invalid session. Please log in again.');
            toast.error('Invalid session. Logging out.');
            onLogout();
            setIsLoading(false);
            return;
        }

        if (!formData.name || formData.name.length < 2) {
            setError('Name must be at least 2 characters long.');
            setIsLoading(false);
            return;
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.put(`${API_BASE_URL}/api/admin/profile`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                setAdmin(response.data.admin);
                setSuccess('Profile updated successfully!');
                setIsEditing(false);
                toast.success('Profile updated!');
            }
        } catch (err) {
            console.error('Profile update error:', err.message, 'Token:', token);
            const message = err.response?.data?.message || 'Failed to update profile.';
            setError(message);
            toast.error(message);
            if (err.response?.status === 401 && err.response?.data?.message === 'Invalid token') {
                onLogout();
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle password form submission
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        const token = localStorage.getItem('adminToken');
        if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
            setError('Invalid session. Please log in again.');
            toast.error('Invalid session. Logging out.');
            onLogout();
            setIsLoading(false);
            return;
        }

        const { currentPassword, newPassword, confirmPassword } = passwordData;
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All password fields are required.');
            setIsLoading(false);
            return;
        }
        if (newPassword.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword)) {
            setError('New password must be at least 8 characters with uppercase, lowercase, number, and special character.');
            setIsLoading(false);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.put(`${API_BASE_URL}/api/admin/password`, {
                currentPassword,
                newPassword,
                confirmPassword,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                setSuccess('Password updated successfully!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setIsChangingPassword(false);
                toast.success('Password updated!');
            }
        } catch (err) {
            console.error('Password update error:', err.message, 'Token:', token);
            const message = err.response?.data?.message || 'Failed to update password.';
            setError(message);
            toast.error(message);
            if (err.response?.status === 401 && err.response?.data?.message === 'Invalid token') {
                onLogout();
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!admin) {
        return (
            <div className="min-h-screen bg-teal-50 flex items-center justify-center">
                <div className="text-teal-600 text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-teal-100 flex items-center justify-center relative overflow-hidden p-6">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-96 h-96 top-0 left-0 bg-teal-200/30 rounded-full filter blur-4xl animate-pulse-slow" />
                <div className="absolute w-96 h-96 bottom-0 right-0 bg-blue-200/30 rounded-full filter blur-4xl animate-pulse-slow-delayed" />
                <div className="absolute w-64 h-64 top-1/4 right-1/4 bg-teal-300/20 rounded-full filter blur-3xl animate-float" />
            </div>

            {/* Profile Card */}
            <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all duration-500 hover:scale-105">
                {/* Red Cancel Icon */}
                <button
                    onClick={isEditing || isChangingPassword ? handleCancel : handleExit}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-600 transition-colors"
                    aria-label={isEditing || isChangingPassword ? 'Cancel changes' : 'Return to dashboard'}
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Branding */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-teal-600 animate-fade-in">Admin Profile</h1>
                    <p className="text-sm text-blue-600 mt-2">Manage your account details</p>
                </div>

                {/* Success/Error Messages */}
                {error && (
                    <div className="text-red-500 text-sm text-center animate-shake mb-4">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="text-teal-600 text-sm text-center animate-fade-in mb-4">
                        {success}
                    </div>
                )}

                {/* Profile Information */}
                {!isEditing && !isChangingPassword && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex items-center space-x-3">
                            <User className="w-6 h-6 text-teal-600" />
                            <div>
                                <p className="text-sm text-blue-600">Name</p>
                                <p className="text-gray-700 font-medium">{admin.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Mail className="w-6 h-6 text-teal-600" />
                            <div>
                                <p className="text-sm text-blue-600">Email</p>
                                <p className="text-gray-700 font-medium">{admin.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Bell className="w-6 h-6 text-teal-600" />
                            <div>
                                <p className="text-sm text-blue-600">Notifications</p>
                                <p className="text-gray-700 font-medium">{admin.notifications ? 'Enabled' : 'Disabled'}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <User className="w-6 h-6 text-teal-600" />
                            <div>
                                <p className="text-sm text-blue-600">Role</p>
                                <p className="text-gray-700 font-medium">{admin.role === 'super-admin' ? 'Super Admin' : 'Manager'}</p>
                            </div>
                        </div>
                        <div className="flex space-x-4 mt-6">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full py-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 hover:shadow-lg transition-all duration-300"
                                aria-label="Edit profile"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                                aria-label="Change password"
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Profile Form */}
                {isEditing && (
                    <form onSubmit={handleProfileSubmit} className="space-y-6 animate-slide-in">
                        <div className="relative">
                            <label htmlFor="name" className="sr-only">
                                Name
                            </label>
                            <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                <User className="w-5 h-5 text-teal-600 ml-3" />
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleProfileChange}
                                    placeholder="Enter your name"
                                    className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                    aria-label="Full name"
                                    required
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <label htmlFor="email" className="sr-only">
                                Email
                            </label>
                            <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                <Mail className="w-5 h-5 text-teal-600 ml-3" />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleProfileChange}
                                    placeholder="Enter your email"
                                    className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                    aria-label="Email address"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-teal-600" />
                            <label htmlFor="notifications" className="text-gray-700">
                                Enable Notifications
                            </label>
                            <input
                                type="checkbox"
                                id="notifications"
                                name="notifications"
                                checked={formData.notifications}
                                onChange={handleProfileChange}
                                className="h-5 w-5 text-teal-600 focus:ring-teal-400"
                                aria-label="Enable notifications"
                            />
                        </div>
                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'}`}
                                aria-label="Save profile"
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </div>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Save
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                                aria-label="Cancel"
                            >
                                <X className="w-5 h-5 mr-2 inline" />
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Change Password Form */}
                {isChangingPassword && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-6 animate-slide-in">
                        <div className="relative">
                            <label htmlFor="currentPassword" className="sr-only">
                                Current Password
                            </label>
                            <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                <Lock className="w-5 h-5 text-teal-600 ml-3" />
                                <input
                                    type="password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Enter current password"
                                    className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                    aria-label="Current password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <label htmlFor="newPassword" className="sr-only">
                                New Password
                            </label>
                            <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                <Lock className="w-5 h-5 text-teal-600 ml-3" />
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Enter new password"
                                    className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                    aria-label="New password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <label htmlFor="confirmPassword" className="sr-only">
                                Confirm New Password
                            </label>
                            <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                                <Lock className="w-5 h-5 text-teal-600 ml-3" />
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Confirm new password"
                                    className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                    aria-label="Confirm new password"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'}`}
                                aria-label="Save password"
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                        <span>Saving...</span>
                                    </div>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Save Password
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300"
                                aria-label="Cancel"
                            >
                                <X className="w-5 h-5 mr-2 inline" />
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

AdminProfile.propTypes = {
    admin: PropTypes.shape({
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        role: PropTypes.string.isRequired,
        notifications: PropTypes.bool,
    }),
    setAdmin: PropTypes.func.isRequired,
    onLogout: PropTypes.func.isRequired,
};

export default AdminProfile;