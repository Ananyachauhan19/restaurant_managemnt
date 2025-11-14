# Quick Start Guide

## ✅ System Status

Both servers are running:
- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:5173

## 🚀 How to Use

### Step 1: Login to Frontend

1. Open your browser and go to: **http://localhost:5173**
2. You'll see the login page
3. Enter credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
4. Click "Login"

### Step 2: Explore the Dashboard

After logging in, you'll see:
- Dashboard with statistics
- Navigation sidebar with menu options
- 🖥️ **Terminal** option (for SQL queries)

### Step 3: Use the SQL Terminal (Frontend)

1. Click "🖥️ Terminal" in the sidebar
2. Type a SQL query in the text area, for example:
   ```sql
   SELECT * FROM Customers
   ```
3. Click "Execute"
4. See results displayed in real-time below

### Step 4: Execute Queries from Command Line

First, login and get your token:

```bash
# Login and save token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Save it for later use
echo $TOKEN
```

Then execute queries:

```bash
cd /Users/alok/Documents/hotelmanagement/Hotel-Management2/backend

# Execute query with token
TOKEN="YOUR_TOKEN_HERE" bash query.sh "SELECT * FROM Customers"
```

The query results will appear:
- In your terminal (as JSON)
- In the frontend Terminal page (real-time via WebSocket)

## 📊 Available Tables

Query these tables in your database:

- `Customers` - Customer records
- `Orders` - Order information
- `OrderItems` - Items in orders
- `MenuItems` - Menu items
- `Payments` - Payment records
- `Staff` - Staff members
- `Inventory` - Inventory items
- `Reviews` - Customer reviews
- `Users` - System users

## 🔄 Common Queries

```sql
-- Get all customers
SELECT * FROM Customers;

-- Count orders
SELECT COUNT(*) as total FROM Orders;

-- Get menu items
SELECT * FROM MenuItems LIMIT 10;

-- Get staff by role
SELECT * FROM Staff WHERE role = 'chef';

-- Join customers and orders
SELECT c.name, o.totalAmount 
FROM Customers c 
LEFT JOIN Orders o ON c.id = o.customerId;
```

## 🛠️ Troubleshooting

### "Invalid token" errors in frontend
- You need to login through the frontend first
- Go to http://localhost:5173 and login with admin/admin123

### "Access denied" when running queries from terminal
- Get a fresh token by logging in via curl
- Make sure to set the TOKEN environment variable

### Port already in use
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

## 🎯 Next Steps

1. **Explore the Dashboard**: View statistics and charts
2. **Manage Orders**: Create and track orders
3. **Update Menu**: Add/edit menu items
4. **View Customers**: See customer list and details
5. **Run SQL Queries**: Use the Terminal feature for custom queries
6. **Reports**: View detailed analytics

Enjoy your Hotel Management System! 🎉
