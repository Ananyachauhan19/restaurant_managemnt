import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/api';
import OrderForm from '../components/OrderForm';
import toast from 'react-hot-toast';

// Icons
const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const TableIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all orders for stats
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Always fetch all orders first for stats (with high limit to get all orders)
      const allData = await api.getOrders({ limit: 1000 });
      setAllOrders(allData.orders || allData);
      
      // Then fetch filtered orders for display
      const data = await api.getOrders({ status: statusFilter, limit: 1000 });
      setOrders(data.orders || data);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [statusFilter, user]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated');
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-orange-100 text-orange-800',
      READY: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-purple-100 text-purple-800',
      PAID: 'bg-emerald-100 text-emerald-800',
      COMPLETED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status?.toUpperCase()] || 'bg-gray-100 text-gray-800';
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      PENDING: 'CONFIRMED',
      CONFIRMED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'DELIVERED',
      DELIVERED: 'PAID'
    };
    return statusFlow[currentStatus];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Orders Management</h2>
          <p className="text-gray-600 text-sm mb-4">Please log in to manage orders</p>
          <a 
            href="/login" 
            className="btn-primary px-4 py-2 rounded-md text-sm"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                <span>📋</span>
                <span>Order Management</span>
              </h1>
              <p className="text-green-100 text-xs">{allOrders.length} orders in system</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white hover:bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <PlusIcon />
              New Order
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-green-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <ClockIcon />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{allOrders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-yellow-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                <ClockIcon />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-900">{allOrders.filter(o => o.status?.toUpperCase() === 'PENDING').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-orange-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <ClockIcon />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Preparing</p>
                <p className="text-xl font-bold text-gray-900">{allOrders.filter(o => o.status?.toUpperCase() === 'PREPARING').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-green-100">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <CheckIcon />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900">{allOrders.filter(o => o.status && (o.status.toUpperCase() === 'PAID' || o.status.toUpperCase() === 'DELIVERED' || o.status.toUpperCase() === 'COMPLETED')).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Filter by Status</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${
                statusFilter === '' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-green-50 border border-green-200'
              }`}
            >
              All Orders
            </button>
            {['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'PAID', 'COMPLETED', 'CANCELLED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${
                  statusFilter === status 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-green-50 border border-green-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Order Workflow Guide */}
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span>📋</span>
            <span>Order Workflow Guide</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-1">
                <span className="text-yellow-600 font-bold text-xs">1</span>
              </div>
              <p className="text-xs font-medium text-gray-700">PENDING</p>
              <p className="text-[10px] text-gray-500">New order</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-1">
                <span className="text-blue-600 font-bold text-xs">2</span>
              </div>
              <p className="text-xs font-medium text-gray-700">CONFIRMED</p>
              <p className="text-[10px] text-gray-500">Accepted</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-1">
                <span className="text-orange-600 font-bold text-xs">3</span>
              </div>
              <p className="text-xs font-medium text-gray-700">PREPARING</p>
              <p className="text-[10px] text-gray-500">Cooking</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-1">
                <span className="text-green-600 font-bold text-xs">4</span>
              </div>
              <p className="text-xs font-medium text-gray-700">READY</p>
              <p className="text-[10px] text-gray-500">Ready</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-1">
                <span className="text-purple-600 font-bold text-xs">5</span>
              </div>
              <p className="text-xs font-medium text-gray-700">DELIVERED</p>
              <p className="text-[10px] text-gray-500">Served</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto mb-1">
                <span className="text-emerald-600 font-bold text-xs">6</span>
              </div>
              <p className="text-xs font-medium text-gray-700">PAID</p>
              <p className="text-[10px] text-gray-500">Complete</p>
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-3 text-center">
            💡 <strong>Manual Control:</strong> Each step requires confirmation
          </p>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">
                {statusFilter ? 'No orders with this status' : 'Create your first order to get started!'}
              </p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-200 hover:border-green-300 group relative">
                {/* Order Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold">Order #{order.id}</h3>
                      <p className="text-green-100 text-xs mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  {/* Order Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <TableIcon />
                      <span className="text-xs">Table {order.tableNumber}</span>
                    </div>
                    {order.Customer && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <UserIcon />
                        <span className="text-xs">{order.Customer.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <ClockIcon />
                      <span className="text-xs font-semibold">
                        Total: ₹{order.total || order.OrderItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0}
                      </span>
                    </div>
                  </div>

                  {/* View Items Button */}
                  {order.OrderItems && order.OrderItems.length > 0 && (
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="w-full mb-3 bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 px-3 rounded text-xs font-medium transition-colors border border-blue-200"
                    >
                      View Order Items ({order.OrderItems.length})
                    </button>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Status Update Button */}
                    {getNextStatus(order.status) && order.status !== 'PAID' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status))}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                      >
                        <CheckIcon />
                        Mark as {getNextStatus(order.status)}
                      </button>
                    )}
                    
                    {/* Cancel Button for Pending Orders */}
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                      >
                        <XIcon />
                        Cancel Order
                      </button>
                    )}
                    
                    {/* Completed Status Indicator */}
                    {order.status === 'PAID' && (
                      <div className="w-full bg-green-100 text-green-800 py-2 px-3 rounded-lg text-xs font-semibold text-center border border-green-200">
                        ✅ Order Completed & Paid
                      </div>
                    )}
                    
                    {/* Cancelled Status Indicator */}
                    {order.status === 'CANCELLED' && (
                      <div className="w-full bg-red-100 text-red-800 py-3 px-4 rounded-lg text-sm font-semibold text-center border border-red-200">
                        ❌ Order Cancelled
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <OrderForm 
          onClose={() => { 
            setShowForm(false); 
            loadOrders(); 
          }} 
        />
      )}

      {/* Order Items Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Order #{selectedOrder.id}</h3>
                <p className="text-green-100 text-xs mt-0.5">Table {selectedOrder.tableNumber}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
              >
                <XIcon />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Items:</h4>
              <div className="space-y-2">
                {selectedOrder.OrderItems?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{item.MenuItem?.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Quantity: {item.quantity}</div>
                      <div className="text-xs text-gray-600 mt-0.5">₹{item.price} each</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-green-600">₹{item.price * item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                  <span className="text-xl font-bold text-green-600">
                    ₹{selectedOrder.total || selectedOrder.OrderItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}