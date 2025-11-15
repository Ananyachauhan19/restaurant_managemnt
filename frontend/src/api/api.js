const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('token');
}

// Enhanced fetch function with error handling and auth
export async function fetchJSON(path, opts = {}) {
  const token = getAuthToken();
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'x-auth-token': token })
  };

  const config = {
    ...opts,
    headers: {
      ...defaultHeaders,
      ...opts.headers
    }
  };

  try {
    const res = await fetch(`${BASE}${path}`, config);
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Network error' }));

      // Handle token expiration or invalid token (401 or 400 with "Invalid token")
      if (res.status === 401 || (res.status === 400 && errorData.message?.includes('Invalid token'))) {
        console.warn('Token invalid or expired. Clearing localStorage and redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?session=expired';
        const err = new Error('Session expired. Please login again.');
        err.data = errorData;
        throw err;
      }

      const err = new Error(errorData.message || `HTTP ${res.status}`);
      err.data = errorData;
      throw err;
    }
    
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Specific API functions
export const api = {
  // Auth
  login: (username, password) => 
    fetchJSON('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  
  register: (userData) => 
    fetchJSON('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  // Orders
  getOrders: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetchJSON(`/orders${query ? `?${query}` : ''}`);
    return res.orders || res.data?.orders || res;
  },
  
  createOrder: (orderData) => 
    fetchJSON('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    }),
  
  updateOrderStatus: (orderId, status) =>
    fetchJSON(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  
  getOrderById: (orderId) => fetchJSON(`/orders/${orderId}`),

  // Menu
  getMenu: async (params = {}) => {
    const query = new URLSearchParams({ limit: '500', ...params }).toString();
    const res = await fetchJSON(`/menu${query ? `?${query}` : ''}`);
    return res.items || res;
  },
  
  createMenuItem: (itemData) => 
    fetchJSON('/menu', {
      method: 'POST',
      body: JSON.stringify(itemData)
    }),

  // Customers
  getCustomers: async () => {
    const res = await fetchJSON('/customers');
    return res.customers || res.data?.customers || res;
  },
  
  createCustomer: (customerData) => 
    fetchJSON('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    }),

  updateCustomer: (id, customerData) => 
    fetchJSON(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData)
    }),

  deleteCustomer: (id) => 
    fetchJSON(`/customers/${id}`, {
      method: 'DELETE'
    }),

  // Staff
  // Returns backend shape { success, data: { staff, pagination } }
  // Keep shape so pages expecting response.data.staff continue to work
  getStaff: () => fetchJSON('/staff'),
  
  createStaff: (staffData) => 
    fetchJSON('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData)
    }),

  updateStaff: (id, staffData) => 
    fetchJSON(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData)
    }),

  deleteStaff: (id) => 
    fetchJSON(`/staff/${id}`, {
      method: 'DELETE'
    }),

  // Unwrap to data object so reports page can use fields directly
  getStaffStats: async () => {
    const res = await fetchJSON('/staff/stats/overview');
    return res.data ?? res;
  },

  // Inventory
  // Unwrap to data object so pages can read response.inventory
  getInventory: async () => {
    const res = await fetchJSON('/inventory');
    return res.data ?? res;
  },
  
  createInventory: (inventoryData) => 
    fetchJSON('/inventory', {
      method: 'POST',
      body: JSON.stringify(inventoryData)
    }),

  updateInventory: (id, inventoryData) => 
    fetchJSON(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(inventoryData)
    }),

  deleteInventory: (id) => 
    fetchJSON(`/inventory/${id}`, {
      method: 'DELETE'
    }),

  updateStock: (id, stockData) => 
    fetchJSON(`/inventory/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(stockData)
    }),

  // Unwrap to data for reports and inventory pages
  getInventoryStats: async () => {
    const res = await fetchJSON('/inventory/stats/overview');
    return res.data ?? res;
  },

  // Return the array directly for UI convenience
  getLowStockAlerts: async () => {
    const res = await fetchJSON('/inventory/alerts/low-stock');
    return res.data ?? res;
  },
  
  updateInventoryItem: (id, data) =>
    fetchJSON(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // Reviews
  getReviews: () => fetchJSON('/reviews'),
  createReview: (reviewData) => fetchJSON('/reviews', { method: 'POST', body: JSON.stringify(reviewData) }),
  updateReview: (id, reviewData) => fetchJSON(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(reviewData) }),
  deleteReview: (id) => fetchJSON(`/reviews/${id}`, { method: 'DELETE' }),
  // Unwrap to data so reports and reviews pages read fields directly
  getReviewStats: async () => {
    const res = await fetchJSON('/reviews/stats/overview');
    return res.data ?? res;
  },

  // Payments
  getPayments: async () => {
    const res = await fetchJSON('/payments');
    return res.data?.payments || res.payments || res;
  },
  
  createPayment: (paymentData) => 
    fetchJSON('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    }),

  getPaymentStats: async () => {
    const res = await fetchJSON('/payments/stats/overview');
    return res.data ?? res;
  },

  // SQL Terminal
  executeSQL: (query) => 
    fetchJSON('/sql/execute', {
      method: 'POST',
      body: JSON.stringify({ query })
    }),
  
  getTables: () => fetchJSON('/sql/tables'),
  
  getTableSchema: (tableName) => fetchJSON(`/sql/schema/${tableName}`)
};