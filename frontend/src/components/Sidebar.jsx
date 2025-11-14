import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar(){
  return (
    <aside className="w-56 bg-gray-800 text-white p-4">
      <nav className="flex flex-col gap-3">
        <Link to="/" className="py-2 px-3 rounded hover:bg-gray-700">Dashboard</Link>
        <Link to="/orders" className="py-2 px-3 rounded hover:bg-gray-700">Orders</Link>
        <Link to="/menu" className="py-2 px-3 rounded hover:bg-gray-700">Menu</Link>
        <Link to="/customers" className="py-2 px-3 rounded hover:bg-gray-700">Customers</Link>
        <Link to="/reports" className="py-2 px-3 rounded hover:bg-gray-700">Reports</Link>
        <Link to="/terminal" className="py-2 px-3 rounded hover:bg-gray-700 bg-blue-600">🖥️ Terminal</Link>
      </nav>
    </aside>
  )
}