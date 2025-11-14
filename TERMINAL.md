# SQL Terminal Feature

Execute SQL queries from the terminal and see results reflected in the frontend in real-time!

## Features

- ✅ Execute SQL queries from command line
- ✅ Real-time updates via WebSocket
- ✅ See query results in frontend UI
- ✅ Query history tracking
- ✅ Beautiful terminal interface
- ✅ Error handling and feedback

## Setup

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend should now be running on `http://localhost:4000` with WebSocket support.

### 2. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend should now be running on `http://localhost:3000`.

### 3. Open Terminal Page

Navigate to `http://localhost:3000/terminal` (or click "🖥️ Terminal" in the sidebar after logging in).

## Usage

### Method 1: Using the Bash Script (Recommended)

```bash
cd backend
./query.sh "SELECT * FROM Customers LIMIT 10"
```

The query will execute and results will appear:
- In your terminal (as JSON)
- In the frontend Terminal page (real-time)

**Examples:**

```bash
# Get all customers
./query.sh "SELECT * FROM Customers"

# Get pending orders
./query.sh "SELECT * FROM Orders WHERE status = 'pending'"

# Get menu items
./query.sh "SELECT * FROM MenuItems"

# Count total orders
./query.sh "SELECT COUNT(*) as total FROM Orders"

# Search customers by name
./query.sh "SELECT * FROM Customers WHERE name LIKE '%John%'"
```

### Method 2: Using cURL Directly

```bash
curl -X POST http://localhost:4000/api/terminal/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"query": "SELECT * FROM Customers LIMIT 10"}'
```

### Method 3: Using the Node.js CLI Client

```bash
cd backend
node terminal-client.js
```

This will open an interactive SQL terminal where you can type queries:

```
SQL> SELECT * FROM Customers LIMIT 5
SQL> SELECT * FROM Orders WHERE status = 'pending'
SQL> help
SQL> exit
```

### Method 4: Using the Frontend UI

1. Login to the application
2. Click "🖥️ Terminal" in the sidebar
3. Type your SQL query in the text area
4. Click "Execute"
5. See results in the terminal output below

## How It Works

1. **Query Submission**: You submit a SQL query via terminal, script, or frontend
2. **WebSocket Broadcast**: The backend executes the query and broadcasts results via Socket.io
3. **Real-time Updates**: All connected frontend clients receive the update instantly
4. **Display**: Results appear in the frontend Terminal page with formatted tables

## Available Tables

Based on the schema, you can query these tables:

- `Customers` - Customer information
- `Orders` - Order details
- `OrderItems` - Items in each order
- `MenuItems` - Restaurant menu
- `Payments` - Payment records
- `Staff` - Staff members
- `Inventory` - Inventory items
- `Reviews` - Customer reviews
- `Users` - System users

## Example Queries

### Basic Queries
```sql
SELECT * FROM Customers;
SELECT * FROM Orders;
SELECT * FROM MenuItems;
```

### Filtered Queries
```sql
SELECT * FROM Orders WHERE status = 'pending';
SELECT * FROM Customers WHERE email LIKE '%@gmail.com';
SELECT * FROM MenuItems WHERE price > 10;
```

### Aggregate Queries
```sql
SELECT COUNT(*) as total_orders FROM Orders;
SELECT SUM(totalAmount) as total_revenue FROM Orders;
SELECT AVG(price) as avg_price FROM MenuItems;
```

### Join Queries
```sql
SELECT o.id, c.name, o.totalAmount 
FROM Orders o 
JOIN Customers c ON o.customerId = c.id;

SELECT m.name, oi.quantity, oi.price 
FROM OrderItems oi 
JOIN MenuItems m ON oi.menuItemId = m.id;
```

## Security

⚠️ **Important**: The terminal feature requires authentication. Make sure to:

1. Login to get an auth token
2. Include the token in API requests (or let the frontend handle it)
3. Only authorized users can execute queries

## Troubleshooting

### "Not connected to server"
- Ensure backend is running on port 4000
- Check WebSocket connection in browser console
- Verify CORS settings

### "Query failed"
- Check SQL syntax
- Ensure table names are correct (case-sensitive)
- Review error message in terminal output

### Script permissions
```bash
chmod +x backend/query.sh
chmod +x backend/terminal-client.js
```

## Development

### Backend Files
- `routes/terminal.js` - Query execution endpoint
- `server.js` - WebSocket setup and handlers

### Frontend Files
- `pages/Terminal.jsx` - Terminal UI component
- Socket.io client configuration

## Future Enhancements

- [ ] Query history persistence
- [ ] Query favorites/bookmarks
- [ ] Query autocomplete
- [ ] Multiple terminal tabs
- [ ] Export results to CSV/JSON
- [ ] Query performance metrics
