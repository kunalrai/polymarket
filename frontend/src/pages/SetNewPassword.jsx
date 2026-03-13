import React from 'react';
import { Link } from 'react-router-dom';

export default function SetNewPassword() {
  return (
    <div className="max-w-md mx-auto mt-16 px-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Password Reset</h2>
      <p className="text-gray-600 mb-6">Use the Forgot Password page to reset your password via email code.</p>
      <Link to="/forgot-password" className="text-blue-600 hover:underline">Go to Forgot Password</Link>
    </div>
  );
}
