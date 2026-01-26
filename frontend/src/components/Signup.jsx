import React, { useState } from 'react';
import { UserPlus, User, Mail, Lock, Shield } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
const INITIAL_FORM = { name: '', email: '', password: '', role: 'standard' };

const Signup = ({ onSwitchMode }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const { data } = await axios.post(`${API_URL}/api/user/register`, formData);
      setMessage({ text: 'Registration successful! You can now log in.', type: 'success' });
      setFormData(INITIAL_FORM);
    } catch (err) {
      console.error('Signup error:', err);
      setMessage({
        text: err.response?.data?.message || 'An error occurred. Please try again later.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const FIELDS = [
    {
      name: 'name',
      type: 'text',
      placeholder: 'Your Full Name',
      icon: User,
    },
    {
      name: 'email',
      type: 'email',
      placeholder: 'Your Email Address',
      icon: Mail,
    },
    {
      name: 'password',
      type: 'password',
      placeholder: 'Your Password',
      icon: Lock,
    },
    {
      name: 'role',
      type: 'select',
      placeholder: 'Select Role',
      icon: Shield,
      options: ['standard', 'team-lead', 'admin'],
    },
  ];

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="w-full max-w-md bg-white shadow-xl rounded-3xl p-6 sm:p-8 border border-blue-200">
        {/* Logo & Title */}
        <div className="mb-10 text-center">
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

        {/* Message */}
        {message.text && (
          <div
            className={`text-center py-3 px-5 rounded-xl text-base font-medium transition-all duration-300 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6 mt-6">
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
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                    className="w-full focus:outline-none text-lg text-gray-800 placeholder-gray-500 bg-transparent"
                    required
                  />
                )}
              </div>
            </div>
          ))}

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

        {/* Login Link */}
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