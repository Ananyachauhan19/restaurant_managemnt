import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import toast from 'react-hot-toast';

export default function OrderForm({ onClose }) {
  const [menu, setMenu] = useState([]);
  const [items, setItems] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Customer creation fields
  const [customerOption, setCustomerOption] = useState('existing'); // 'existing' or 'new'
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [menuData, customersData] = await Promise.all([
        api.getMenu(),
        api.getCustomers()
      ]);
      setMenu(menuData.items || menuData || []);
      setCustomers(customersData.customers || customersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load menu and customers');
      setMenu([]);
      setCustomers([]);
    }
  };

  const addItem = (menuId) => {
    const existingItem = items.find(item => item.menuItemId === menuId);
    if (existingItem) {
      updateQty(items.findIndex(item => item.menuItemId === menuId), existingItem.qty + 1);
    } else {
      setItems([...items, { menuItemId: menuId, qty: 1 }]);
    }
  };

  const updateQty = (idx, qty) => {
    if (qty <= 0) {
      removeItem(idx);
      return;
    }
    const copy = [...items];
    copy[idx].qty = qty;
    setItems(copy);
  };

  const removeItem = (idx) => {
    const copy = [...items];
    copy.splice(idx, 1);
    setItems(copy);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const menuItem = menu.find(m => m.id === item.menuItemId);
      return total + (menuItem ? menuItem.price * item.qty : 0);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!tableNumber.trim()) {
      toast.error('Please enter a table number');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    if (customerOption === 'new') {
      if (!newCustomer.name.trim()) {
        toast.error('Please enter customer name');
        return;
      }
      if (!newCustomer.phone.trim()) {
        toast.error('Please enter customer phone number');
        return;
      }
    }

    try {
      setLoading(true);
      
      let finalCustomerId = customerId;
      
      // Create new customer if needed
      if (customerOption === 'new') {
        const createdCustomer = await api.createCustomer({
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim(),
          email: newCustomer.email.trim() || null
        });
        finalCustomerId = createdCustomer.id;
        toast.success('Customer created successfully!');
      }
      
      // Normalize payload: ensure numeric fields are numbers
      const payloadItems = items.map(i => ({
        menuItemId: Number(i.menuItemId),
        qty: Number(i.qty)
      }));

      const payload = {
        tableNumber: tableNumber.trim(),
        customerId: finalCustomerId ? Number(finalCustomerId) : null,
        items: payloadItems
      };

      // Create order
      await api.createOrder(payload);
      toast.success('Order created successfully!');
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      // If backend returned validation errors, show them
      if (error?.data?.errors && Array.isArray(error.data.errors)) {
        const msgs = error.data.errors.map(e => e.msg || e.message).filter(Boolean).join('\n');
        toast.error(msgs || error.message || 'Failed to create order');
      } else if (error?.data?.message) {
        toast.error(error.data.message);
      } else {
        toast.error(error.message || 'Failed to create order');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Create New Order</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            {/* Left Column - Scrollable Form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Order Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number *
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Table 5, A1, etc."
                />
              </div>

              {/* Customer Selection */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Customer Information</h4>
                
                {/* Customer Option Toggle */}
                <div className="flex space-x-4 mb-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="customerOption"
                      value="existing"
                      checked={customerOption === 'existing'}
                      onChange={(e) => setCustomerOption(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Select Existing Customer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="customerOption"
                      value="new"
                      checked={customerOption === 'new'}
                      onChange={(e) => setCustomerOption(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Create New Customer</span>
                  </label>
                </div>

                {/* Existing Customer Selection */}
                {customerOption === 'existing' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Select Customer
                    </label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose from existing customers</option>
                      {customers && customers.length > 0 && customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Leave empty for walk-in customer</p>
                  </div>
                )}

                {/* New Customer Form */}
                {customerOption === 'new' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-3">Menu Items</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {menu && menu.length > 0 ? menu.map(item => (
                    <div key={item.id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-sm font-medium text-gray-900">{item.name}</h5>
                        <span className="text-sm font-semibold text-green-600">₹{item.price}</span>
                      </div>
                      {item.category && (
                        <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                      )}
                      <button
                        onClick={() => addItem(item.id)}
                        className="w-full btn-primary text-sm py-1.5"
                      >
                        Add to Order
                      </button>
                    </div>
                  )) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      No menu items available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sticky Selected Items */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center justify-between">
                    <span>Selected Items</span>
                    <span className="text-sm text-gray-600">({items.length})</span>
                  </h4>
                  
                  {items.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No items added yet
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
                      {items.map((item, idx) => {
                        const menuItem = menu.find(m => m.id === item.menuItemId);
                        if (!menuItem) return null;
                        return (
                          <div key={idx} className="bg-white p-2.5 rounded border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="text-sm font-medium text-gray-900 flex-1">{menuItem.name}</h5>
                              <button
                                onClick={() => removeItem(idx)}
                                className="text-red-500 hover:text-red-700 ml-2"
                                title="Remove item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQty(idx, Math.max(1, item.qty - 1))}
                                className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-sm"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => updateQty(idx, parseInt(e.target.value) || 1)}
                                className="w-12 text-center border border-gray-300 rounded py-1 text-sm"
                              />
                              <button
                                onClick={() => updateQty(idx, item.qty + 1)}
                                className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-sm"
                              >
                                +
                              </button>
                              <span className="text-sm text-gray-600 ml-auto">
                                ₹{(menuItem.price * item.qty).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="border-t-2 border-blue-300 pt-3 mt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-green-600">
                        ₹{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 px-4 pb-4 pt-2 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || items.length === 0 || !tableNumber.trim()}
              className="btn-primary px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}