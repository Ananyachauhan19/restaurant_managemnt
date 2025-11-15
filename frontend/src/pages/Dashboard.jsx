import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    menuItems: 0,
    totalCustomers: 0,
    totalStaff: 0,
    totalInventory: 0,
    totalPayments: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersData, menuData, customersData, staffData, inventoryData, paymentsData] = await Promise.all([
        api.getOrders({ limit: 1000 }),
        api.getMenu(),
        api.getCustomers(),
        api.getStaffStats(),
        api.getInventoryStats(),
        api.getPaymentStats()
      ]);

      const orders = ordersData.orders || ordersData;
      const paymentsTotalAmount = Number((paymentsData && (paymentsData.totalAmount || paymentsData.data?.totalAmount)) || 0);
      const ordersTotal = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const totalRevenue = paymentsTotalAmount > 0 ? paymentsTotalAmount : ordersTotal;
      const pendingOrders = orders.filter(order => order.status?.toUpperCase() === 'PENDING').length;

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        totalRevenue,
        menuItems: menuData.length,
        totalCustomers: customersData.length,
        totalStaff: staffData.totalStaff || staffData.data?.totalStaff || 0,
        totalInventory: inventoryData.totalItems || inventoryData.data?.totalItems || 0,
        totalPayments: paymentsData.totalPayments || paymentsData.data?.totalPayments || 0
      });
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
      PREPARING: 'bg-orange-100 text-orange-800 border-orange-200',
      READY: 'bg-green-100 text-green-800 border-green-200',
      DELIVERED: 'bg-gray-100 text-gray-800 border-gray-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      PAID: 'bg-green-100 text-green-800 border-green-200',
      COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return colors[status?.toUpperCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-3"></div>
          <p className="text-blue-600 font-medium text-sm">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-3">🍽️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Hotel Management System</h2>
          <p className="text-gray-600 text-sm mb-4">Please log in to access the dashboard</p>
          <a 
            href="/login" 
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-md"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <span>📊</span>
            <span>Dashboard</span>
          </h1>
          <p className="text-blue-100 text-xs">Welcome back, {user.name || user.username}! Here's your overview.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Total Orders */}
          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-blue-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-yellow-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-green-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Revenue</p>
                <p className="text-xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-purple-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Menu Items</p>
                <p className="text-xl font-bold text-gray-900">{stats.menuItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Customers */}
          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-indigo-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Customers</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>

          {/* Staff */}
          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-teal-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Staff</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalStaff}</p>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-cyan-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Inventory</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalInventory}</p>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-pink-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Payments</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalPayments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-100">
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span>
              <span>Recent Orders</span>
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-gray-500 text-sm">No orders found</p>
                <p className="text-gray-400 text-xs mt-1">Orders will appear here once customers start placing them</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">🍽️</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Order #{order.id}</p>
                      <p className="text-xs text-gray-600">
                        Table {order.tableNumber} • ₹{order.total}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 bg-white rounded-lg shadow-sm border border-blue-100 p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>⚡</span>
            <span>Quick Actions</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/orders" className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-3 rounded-lg text-center transition-all shadow-sm hover:shadow-md">
              <div className="text-xl mb-1">📋</div>
              <p className="text-xs font-medium text-blue-800">Manage Orders</p>
            </a>
            <a href="/menu" className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 p-3 rounded-lg text-center transition-all shadow-sm hover:shadow-md">
              <div className="text-xl mb-1">🍽️</div>
              <p className="text-xs font-medium text-green-800">View Menu</p>
            </a>
            <a href="/customers" className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 p-3 rounded-lg text-center transition-all shadow-sm hover:shadow-md">
              <div className="text-xl mb-1">👥</div>
              <p className="text-xs font-medium text-purple-800">Customers</p>
            </a>
            <a href="/payments" className="bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 p-3 rounded-lg text-center transition-all shadow-sm hover:shadow-md">
              <div className="text-xl mb-1">💳</div>
              <p className="text-xs font-medium text-pink-800">Payments</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}