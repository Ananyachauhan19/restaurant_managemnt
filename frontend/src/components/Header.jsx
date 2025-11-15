import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Header(){
  const { user, logout } = useAuth();
  
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-slate-800">Hotel Management System</h1>
        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Pro</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
            {(user?.name || user?.username)?.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-600 font-medium">
            {user?.name || user?.username}
          </span>
        </div>
        <button 
          onClick={logout}
          className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  )
}