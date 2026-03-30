// src/pages/Signup.jsx
import React, { useState } from 'react';
import { UserPlus, User, Mail, Lock, Shield, Briefcase, Building, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

const INITIAL_FORM = {
    firstName: '',
    lastName: '',
    otherName: '',
    position: '',
    unitSector: '',
    email: '',
    password: '',
    repeatPassword: '',
    role: 'standard'
};

const Signup = ({ onSwitchMode, onSubmit }) => {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showRepeatPassword, setShowRepeatPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.password !== formData.repeatPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${API_URL}/api/user/register`, formData);
            toast.success('Registration successful! Logging you in...');

            const loginResponse = await axios.post(`${API_URL}/api/user/login`, {
                email: formData.email,
                password: formData.password,
            });

            if (!loginResponse.data.success || !loginResponse.data.token) {
                throw new Error(loginResponse.data.message || 'Auto-login failed');
            }

            localStorage.setItem('token', loginResponse.data.token);
            localStorage.setItem('userId', loginResponse.data.user.id);

            // Pass full user object to parent (Layout)
            if (onSubmit && typeof onSubmit === 'function') {
                onSubmit(loginResponse.data.user);
            }

            toast.success('Login successful! Redirecting to dashboard...');
            setFormData(INITIAL_FORM);
            setTimeout(() => navigate('/'), 1000);
        } catch (err) {
            console.error('Signup or auto-login error:', err);
            toast.error(err.response?.data?.message || 'An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSubmit(e);
    };

    const FIELDS = [
        { name: 'firstName', type: 'text', placeholder: 'First Name', icon: User },
        { name: 'lastName', type: 'text', placeholder: 'Last Name', icon: User },
        { name: 'otherName', type: 'text', placeholder: 'Other Name (optional)', icon: User },
        { name: 'position', type: 'text', placeholder: 'Position Held / Role', icon: Briefcase },
        { name: 'unitSector', type: 'text', placeholder: 'Unit/Sector', icon: Building },
        { name: 'email', type: 'email', placeholder: 'Email Address', icon: Mail },
        { name: 'password', type: 'password', placeholder: 'Password', icon: Lock },
        { name: 'repeatPassword', type: 'password', placeholder: 'Repeat Password', icon: Lock },
        {
            name: 'role',
            type: 'select',
            placeholder: 'Account Type',
            icon: Shield,
            options: ['standard', 'team-lead', 'admin']
        },
    ];

    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar />

            <div className="w-full max-w-md bg-white shadow-xl rounded-3xl p-6 sm:p-8 border border-blue-200 max-h-[95vh] overflow-y-auto">
                <div className="mb-8 text-center">
                    <div className="w-24 h-24 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <UserPlus className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                        Create Account
                    </h2>
                    <p className="text-blue-700 text-lg sm:text-xl mt-3 font-semibold">
                        Start Managing Your Tasks
                    </p>
                </div>

                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
                    {FIELDS.map(({ name, type, placeholder, icon: Icon, options }) => (
                        <div key={name} className="relative group">
                            <div className="flex items-center border border-blue-200 rounded-2xl px-5 py-3 bg-blue-50/30 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-300">
                                {Icon && <Icon className="text-blue-700 w-6 h-6 mr-4 flex-shrink-0" />}

                                {type === 'select' ? (
                                    <select
                                        name={name}
                                        value={formData[name]}
                                        onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                                        className="w-full focus:outline-none text-lg text-gray-800 bg-transparent"
                                        required
                                    >
                                        {options.map((option) => (
                                            <option key={option} value={option}>
                                                {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="relative flex-1">
                                        <input
                                            type={
                                                name === 'password'
                                                    ? showPassword ? 'text' : 'password'
                                                    : name === 'repeatPassword'
                                                    ? showRepeatPassword ? 'text' : 'password'
                                                    : type
                                            }
                                            placeholder={placeholder}
                                            value={formData[name]}
                                            onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                                            className="w-full pr-12 focus:outline-none text-lg text-gray-800 placeholder-gray-500 bg-transparent"
                                            required={name !== 'otherName'}
                                        />

                                        {(name === 'password' || name === 'repeatPassword') && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    name === 'password'
                                                        ? setShowPassword(!showPassword)
                                                        : setShowRepeatPassword(!showRepeatPassword)
                                                }
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-700 hover:text-blue-800 active:scale-95 transition-all duration-200 focus:outline-none p-1"
                                            >
                                                {name === 'password' ? (
                                                    showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />
                                                ) : showRepeatPassword ? (
                                                    <EyeOff className="w-6 h-6" />
                                                ) : (
                                                    <Eye className="w-6 h-6" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 flex items-center justify-center gap-3 text-white bg-blue-700 hover:bg-blue-800 rounded-2xl shadow-md font-bold text-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                Signing Up...
                            </span>
                        ) : (
                            <>
                                <UserPlus className="w-6 h-6" />
                                Sign Up
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-base sm:text-lg text-gray-600 mt-10">
                    Already have an account?{' '}
                    <button
                        onClick={onSwitchMode}
                        className="text-blue-700 hover:text-blue-800 font-bold hover:underline transition-all duration-300"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Signup;