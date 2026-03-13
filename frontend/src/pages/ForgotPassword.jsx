import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';

export default function ForgotPassword() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await signIn('password', { email, flow: 'reset' });
      setCodeSent(true);
      setMessage('Check your email for a reset code.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await signIn('password', { email, code, newPassword, flow: 'reset-verification' });
      setMessage('Password updated! You can now log in.');
    } catch (err) {
      setError(err.message || 'Reset failed. Check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h2 className="text-3xl font-bold text-center mb-8">Reset Password</h2>
      <div className="bg-white shadow rounded-lg p-8">
        {message && <div className="mb-4 text-green-600 bg-green-50 border border-green-200 rounded px-4 py-2 text-sm">{message}</div>}
        {error && <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2 text-sm">{error}</div>}

        {!codeSent ? (
          <form onSubmit={handleRequestReset}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md transition">
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reset Code</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-md transition">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
