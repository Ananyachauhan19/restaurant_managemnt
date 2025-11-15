import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar(){
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/orders', label: 'Orders', icon: '🛒' },
    { path: '/menu', label: 'Menu', icon: '🍽️' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/staff', label: 'Staff', icon: '👨‍💼' },
    { path: '/inventory', label: 'Inventory', icon: '📦' },
    { path: '/reviews', label: 'Reviews', icon: '⭐' },
    { path: '/reports', label: 'Reports', icon: '📈' },
  ];
  
  return (
    <aside className="w-52 bg-gradient-to-b from-slate-800 to-slate-900 text-white border-r border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-base font-bold text-white">HMS</h2>
        <p className="text-xs text-slate-400 mt-0.5">Management Portal</p>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        {navItems.map(item => (
          <Link 
            key={item.path}
            to={item.path} 
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-150 ${
              isActive(item.path) 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}