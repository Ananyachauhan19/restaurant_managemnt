import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/api';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

// Icons
const PackageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const DollarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [stats, setStats] = useState({});
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  async function loadInventory() {
    try {
      setLoading(true);
      const [inventoryData, statsData, alertsData] = await Promise.all([
        api.getInventory(),
        api.getInventoryStats(),
        api.getLowStockAlerts()
      ]);
      const inventoryArray = Array.isArray(inventoryData) ? inventoryData : (inventoryData.data || inventoryData.inventory || []);
      setInventory(inventoryArray);
      setFilteredInventory(inventoryArray);
      setStats(statsData.data || statsData);
      setLowStockAlerts(alertsData || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }

  // Filter inventory based on search term and category
  useEffect(() => {
    let filtered = inventory;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (showLowStock) {
      filtered = filtered.filter(item => item.currentStock <= item.minimumStock);
    }

    setFilteredInventory(filtered);
  }, [searchTerm, categoryFilter, showLowStock, inventory]);

  useEffect(() => {
    if (user) {
      loadInventory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getCategoryColor = (category) => {
    const colors = {
      'Furniture': 'bg-brown-100 text-brown-800',
      'Kitchen Equipment': 'bg-red-100 text-red-800',
      'Food Supplies': 'bg-green-100 text-green-800',
      'Cleaning Supplies': 'bg-blue-100 text-blue-800',
      'Utensils': 'bg-gray-100 text-gray-800',
      'Electronics': 'bg-purple-100 text-purple-800',
      'Decorations': 'bg-pink-100 text-pink-800',
      'Maintenance': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Furniture': '🪑',
      'Kitchen Equipment': '🍳',
      'Food Supplies': '🥘',
      'Cleaning Supplies': '🧽',
      'Utensils': '🍴',
      'Electronics': '📱',
      'Decorations': '🎨',
      'Maintenance': '🔧'
    };
    return icons[category] || '📦';
  };

  const getStockStatus = (currentStock, minimumStock) => {
    if (currentStock <= minimumStock) {
      return { status: 'Low Stock', color: 'bg-red-100 text-red-800' };
    } else if (currentStock <= minimumStock * 1.5) {
      return { status: 'Medium Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    reset({
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      price: item.price,
      supplier: item.supplier || ''
    });
    setShowEditForm(true);
  };

  const onSubmit = async (data) => {
    try {
      await api.updateInventoryItem(editingItem.id, data);
      toast.success('Inventory item updated successfully!');
      setShowEditForm(false);
      setEditingItem(null);
      reset();
      loadInventory();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast.error('Failed to update inventory item');
    }
  };

  const handleCloseForm = () => {
    setShowEditForm(false);
    setEditingItem(null);
    reset();
  };

  const uniqueCategories = [...new Set(inventory.map(item => item.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-cyan-600 font-medium">Loading Inventory Data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cyan-50 flex items-center justify-center">
        <div className="text-center bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-3">📦</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Inventory Management</h2>
          <p className="text-gray-600 text-sm mb-4">Please log in to manage inventory</p>
          <a 
            href="/login" 
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <span>📦</span>
            <span>Inventory Management</span>
          </h1>
          <p className="text-cyan-100">Track stock levels and manage restaurant supplies</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-cyan-200">
            <div className="flex items-center">
              <div className="p-3 bg-cyan-100 rounded-xl">
                <PackageIcon />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalItems || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-cyan-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertIcon />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900">{stats.lowStockCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-cyan-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <PackageIcon />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Items</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeItems || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-cyan-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <DollarIcon />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-3xl font-bold text-gray-900">₹{stats.totalValue || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search inventory by name, category, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-sm"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent shadow-sm"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                showLowStock 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-red-600 border border-red-300 hover:bg-red-50'
              }`}
            >
              {showLowStock ? 'Show All' : 'Low Stock Only'}
            </button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {lowStockAlerts.length > 0 && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
              <AlertIcon />
              Low Stock Alerts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockAlerts.slice(0, 6).map(item => (
                <div key={item.id} className="bg-white p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">{item.currentStock} left</p>
                      <p className="text-xs text-gray-500">Min: {item.minimumStock}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInventory.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || categoryFilter || showLowStock ? 'No items found' : 'No inventory items yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm || categoryFilter || showLowStock ? 'Try adjusting your search criteria' : 'Inventory items will appear here once added'}
              </p>
            </div>
          ) : (
            filteredInventory.map(item => {
              const stockStatus = getStockStatus(item.currentStock, item.minimumStock);
              return (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-cyan-200 group">
                  {/* Item Header */}
                  <div className="h-32 bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center relative">
                    <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {getCategoryIcon(item.category)}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                        {item.name}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Stock:</span>
                        <span className="text-sm font-semibold text-gray-900">{item.currentStock} {item.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Minimum Stock:</span>
                        <span className="text-sm text-gray-900">{item.minimumStock} {item.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="text-sm font-semibold text-green-600">₹{item.price}</span>
                      </div>
                      {item.supplier && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Supplier:</span>
                          <span className="text-sm text-gray-900">{item.supplier}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-cyan-600 hover:text-cyan-800 p-2 rounded-lg hover:bg-cyan-50 transition-colors"
                            title="Edit inventory item"
                          >
                            <EditIcon />
                          </button>
                          <span className="text-xs text-gray-500">
                            ID: {item.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Inventory Item Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form 
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="bg-cyan-500 text-white p-6">
              <h3 className="text-xl font-bold">Update Inventory Item</h3>
              <p className="text-cyan-100 text-sm">{editingItem?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Current Stock</label>
                <input
                  type="number"
                  min="0"
                  {...register('currentStock', { required: true, min: 0 })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter current stock"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Minimum Stock</label>
                <input
                  type="number"
                  min="0"
                  {...register('minimumStock', { required: true, min: 0 })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter minimum stock"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price', { required: true, min: 0 })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Supplier (Optional)</label>
                <input
                  type="text"
                  {...register('supplier')}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter supplier name"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 bg-gray-50">
              <button
                type="submit"
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Update Item
              </button>
              <button
                type="button"
                onClick={handleCloseForm}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}