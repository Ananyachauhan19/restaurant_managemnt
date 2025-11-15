import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();

  useEffect(() => {
    // Check if user was redirected due to invalid token
    const params = new URLSearchParams(window.location.search);
    if (params.get('session') === 'expired') {
      toast.error('Your session has expired. Please login again.');
    }
  }, []);

  const onSubmit = async (data) => {
    const success = await login(data.username, data.password);
    if (!success) {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="text-center mb-6">
          <div className="inline-block p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Hotel Management System</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to continue</p>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
          <p className="font-semibold text-blue-900 mb-1">Default Credentials:</p>
          <div className="space-y-0.5 text-blue-700">
            <p>Username: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">admin</code></p>
            <p>Password: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">admin123</code></p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              {...register('username')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}