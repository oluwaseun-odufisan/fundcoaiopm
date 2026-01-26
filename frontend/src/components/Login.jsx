import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
const INITIAL_FORM = { email: '', password: '' };

const Login = ({ onSubmit, onSwitchMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      (async () => {
        try {
          const { data } = await axios.get(`${API_URL}/api/user/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (data.success) {
            onSubmit?.({ token, userId, ...data.user });
            toast.success('Welcome back! Redirecting...');
            navigate('/');
          } else {
            localStorage.clear();
            toast.error('Session invalid. Please log in again.');
          }
        } catch (err) {
          localStorage.clear();
          toast.error('Unable to verify session. Please log in again.');
        }
      })();
    }
  }, [navigate, onSubmit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/user/login`, formData);
      if (!data.success || !data.token) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      onSubmit?.({ token: data.token, userId: data.user.id, ...data.user });
      toast.success('Login successful! Redirecting...');
      setFormData(INITIAL_FORM);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    toast.dismiss();
    onSwitchMode?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const fields = [
    {
      name: 'email',
      type: 'email',
      placeholder: 'Your Email Address',
      icon: Mail,
    },
    {
      name: 'password',
      type: showPassword ? 'text' : 'password',
      placeholder: 'Your Password',
      icon: Lock,
      isPassword: true,
    },
  ];

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />

      <div className="w-full max-w-md bg-white shadow-xl rounded-3xl p-6 sm:p-8 border border-blue-200">
        {/* Logo & Title */}
        <div className="mb-10 text-center">
          <div className="w-24 h-24 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <LogIn className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-blue-700 text-lg sm:text-xl mt-3 font-semibold">
            Access Your TaskManager Dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
          {fields.map(({ name, type, placeholder, icon: Icon, isPassword }) => (
            <div key={name} className="relative group">
              <div className="flex items-center border border-blue-200 rounded-2xl px-5 py-3 bg-blue-50/30 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-300">
                {Icon && <Icon className="text-blue-700 w-6 h-6 mr-4" />}
                <input
                  type={type}
                  placeholder={placeholder}
                  value={formData[name]}
                  onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                  className="w-full focus:outline-none text-lg text-gray-800 placeholder-gray-500 bg-transparent"
                  required
                />
                {isPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="ml-2 text-gray-500 hover:text-blue-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-5 w-5 text-blue-700 border-blue-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="rememberMe" className="ml-3 text-lg text-gray-700">
              Remember me on this device
            </label>
          </div>

          {/* Submit Button */}
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
                Logging you in...
              </span>
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                Log In
              </>
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-base sm:text-lg text-gray-600 mt-10">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={handleSwitchMode}
            className="text-blue-700 hover:text-blue-800 font-bold hover:underline transition-all duration-300"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;