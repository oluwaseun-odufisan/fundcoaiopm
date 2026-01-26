import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminLogin = ({ onSubmit }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (!email || !password) {
            setError('Please enter both email and password.');
            toast.error('Please enter both email and password.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/admin/login`, { email, password });
            console.log('Login response:', {
                success: response.data.success,
                token: response.data.token ? 'Present' : 'Missing',
                admin: response.data.admin,
            });
            if (response.data.success) {
                setSuccess('Login successful! Redirecting...');
                toast.success('Login successful!');
                console.log('Calling onSubmit with:', response.data);
                onSubmit(response.data);
                setIsLoading(false);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed. Please try again.';
            console.error('Login error:', { message: err.message, status: err.response?.status, data: err.response?.data });
            setError(message);
            toast.error(message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-teal-100 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-96 h-96 top-0 left-0 bg-teal-200/30 rounded-full filter blur-4xl animate-pulse-slow" />
                <div className="absolute w-96 h-96 bottom-0 right-0 bg-blue-200/30 rounded-full filter blur-4xl animate-pulse-slow-delayed" />
                <div className="absolute w-64 h-64 top-1/4 right-1/4 bg-teal-300/20 rounded-full filter blur-3xl animate-float" />
            </div>

            <div className="relative bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all duration-500 hover:scale-105">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-teal-600 animate-fade-in">NEGAITM Admin</h1>
                    <p className="text-sm text-blue-600 mt-2">Secure Access to Admin Portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <label htmlFor="email" className="sr-only">
                            Email
                        </label>
                        <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                            <Mail className="w-5 h-5 text-teal-600 ml-3" />
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                aria-label="Email address"
                                required
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label htmlFor="password" className="sr-only">
                            Password
                        </label>
                        <div className="flex items-center border border-teal-200 rounded-lg focus-within:ring-2 focus-within:ring-teal-400 transition-all duration-300">
                            <Lock className="w-5 h-5 text-teal-600 ml-3" />
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full p-3 bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                                aria-label="Password"
                                required
                            />
                        </div>
                    </div>

                    {success && (
                        <div className="text-teal-600 text-sm text-center animate-fade-in">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="text-red-500 text-sm text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 rounded-lg bg-teal-600 text-white font-semibold flex items-center justify-center transition-all duration-300 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-700 hover:shadow-lg'}`}
                        aria-label="Log in"
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                                <span>Logging in...</span>
                            </div>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5 mr-2" />
                                Log In
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-blue-600">
                    Don’t have an account?{' '}
                    <Link to="/admin/signup" className="underline hover:text-teal-600 transition-colors">
                        Sign up here
                    </Link>
                </p>
            </div>
        </div>
    );
};

AdminLogin.propTypes = {
    onSubmit: PropTypes.func.isRequired,
};

export default AdminLogin;