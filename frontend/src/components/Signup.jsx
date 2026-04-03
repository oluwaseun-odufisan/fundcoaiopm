// src/pages/Signup.jsx
import React from 'react';
import { ShieldAlert, Mail, LogIn } from 'lucide-react';

const Signup = ({ onSwitchMode }) => {
    return (
        <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-md bg-white shadow-xl rounded-3xl p-8 sm:p-10 border border-blue-200 text-center">

                {/* Icon */}
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                    <ShieldAlert className="w-12 h-12 text-red-600" />
                </div>

                {/* Main Heading */}
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                    Registration Unavailable
                </h2>

                {/* Bold Notice */}
                <p className="text-lg sm:text-xl font-black text-red-600 uppercase tracking-wide mb-6">
                    Self-registration is currently disabled.
                </p>

                {/* Explanation */}
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6">
                    Accounts on this platform are created exclusively by the Administrator.
                    To get access, please reach out to the Admin and your account will be set up.
                </p>

                {/* Admin Contact Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5 mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Mail className="w-5 h-5 text-blue-700 flex-shrink-0" />
                        <span className="font-bold text-blue-800 text-base sm:text-lg">How to get your account</span>
                    </div>
                    <p className="text-blue-700 text-sm sm:text-base leading-relaxed">
                        Contact your your team lead or admin and provide your <strong>full name</strong>,{' '}
                        <strong>email address</strong>, <strong>position</strong>, and <strong>unit/sector</strong>.
                        Your account will be created and credentials sent to you directly.
                    </p>
                </div>

                {/* Back to Login */}
                <p className="text-base sm:text-lg text-gray-600">
                    Already have an account?{' '}
                    <button
                        onClick={onSwitchMode}
                        className="text-blue-700 hover:text-blue-800 font-bold hover:underline transition-all duration-300"
                    >
                        Log In here
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Signup;