import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const ResetPassword = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12 overflow-y-auto">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 my-auto text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <FaCheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
        <p className="text-gray-600 mb-6">
          If you requested a password reset, follow the link in your email to finish the process.
        </p>
        <div className="space-y-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Login
          </Link>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center w-full py-2 px-4 rounded-md text-blue-600 border border-blue-600 hover:bg-blue-50"
          >
            Send Another Reset Link
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
