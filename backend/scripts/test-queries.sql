-- ============================================
-- Hotel Management System - Test SQL Queries
-- Run these in MySQL Workbench to test all features
-- ============================================

USE hotel_db;

-- ============================================
-- 1. VIEW ALL DATA (Current State)
-- ============================================

-- View all customers
SELECT * FROM Customers ORDER BY createdAt DESC;

-- View all menu items by category
SELECT category, name, price, available 
FROM MenuItems 
ORDER BY category, name;

-- View all staff with roles
SELECT name, role, salary, experience, isActive, shift 
FROM Staff 
ORDER BY role, name;

-- View all orders with customer info
SELECT o.id, o.tableNumber, o.status, o.total, 
       c.name AS customerName, c.phone,
       o.createdAt
FROM Orders o
LEFT JOIN Customers c ON o.customerId = c.id
ORDER BY o.createdAt DESC
LIMIT 20;

-- View order details (orders with items)
SELECT o.id AS orderId, o.tableNumber, o.status, o.total,
       oi.quantity, oi.price AS itemPrice,
       m.name AS itemName, m.category
FROM Orders o
JOIN OrderItems oi ON o.id = oi.orderId
JOIN MenuItems m ON oi.menuItemId = m.id
ORDER BY o.id DESC, m.name;

-- View all payments
SELECT p.id, p.orderId, p.amount, p.method, p.status,
       o.tableNumber, o.total AS orderTotal
FROM Payments p
LEFT JOIN Orders o ON p.orderId = o.id
ORDER BY p.createdAt DESC;

-- View all reviews
SELECT r.id, c.name AS customerName, r.rating,
       r.foodRating, r.serviceRating, r.ambianceRating,
       r.comment, r.isVerified, r.createdAt
FROM Reviews r
LEFT JOIN Customers c ON r.customerId = c.id
ORDER BY r.createdAt DESC;

-- View inventory
SELECT itemName, quantity, cost, 
       (quantity * cost) AS totalValue
FROM Inventories
ORDER BY itemName;


-- ============================================
-- 2. INSERT QUERIES (Add New Data)
-- ============================================

-- Add a new customer
INSERT INTO Customers (name, phone, email, loyaltyPoints, createdAt, updatedAt) 
VALUES ('John Smith', '9876543210', 'john.smith@email.com', 50, NOW(), NOW());

-- Add a new menu item
INSERT INTO MenuItems (name, description, price, category, isVeg, available, createdAt, updatedAt) 
VALUES ('Chocolate Brownie', 'Rich chocolate brownie with vanilla ice cream', 120, 'Dessert', 1, 1, NOW(), NOW());

-- Add a new staff member
INSERT INTO Staff (name, email, phone, role, experience, salary, dateOfJoining, isActive, shift, createdAt, updatedAt) 
VALUES ('Sarah Johnson', 'sarah.j@hotel.com', '9988776655', 'waiter', 2, 18000, CURDATE(), 1, 'morning', NOW(), NOW());

-- Add a new order (you'll need to replace customerId with actual ID)
INSERT INTO Orders (tableNumber, customerId, status, total, createdAt, updatedAt) 
VALUES ('A5', 1, 'PENDING', 0, NOW(), NOW());

-- Add order items (replace orderId and menuItemId with actual IDs)
-- First get the last order ID:
SET @lastOrderId = LAST_INSERT_ID();
INSERT INTO OrderItems (orderId, menuItemId, quantity, price, createdAt, updatedAt) 
VALUES 
(@lastOrderId, 1, 2, 250, NOW(), NOW()),  -- 2 Margherita Pizza
(@lastOrderId, 3, 1, 80, NOW(), NOW());   -- 1 Cold Coffee
-- Update order total
UPDATE Orders SET total = (SELECT SUM(quantity * price) FROM OrderItems WHERE orderId = @lastOrderId) WHERE id = @lastOrderId;

-- Add a payment
INSERT INTO Payments (orderId, amount, method, status, createdAt, updatedAt) 
VALUES (@lastOrderId, 580, 'card', 'completed', NOW(), NOW());

-- Add a review
INSERT INTO Reviews (customerId, orderId, rating, foodRating, serviceRating, ambianceRating, comment, isVerified, createdAt, updatedAt) 
VALUES (1, 1, 5, 5, 4, 5, 'Excellent food and great ambiance! Loved the pizza.', 1, NOW(), NOW());

-- Add inventory item
INSERT INTO Inventories (itemName, quantity, cost, createdAt, updatedAt) 
VALUES ('Fresh Basil', 50, 10, NOW(), NOW());


-- ============================================
-- 3. UPDATE QUERIES (Modify Existing Data)
-- ============================================

-- Update customer loyalty points
UPDATE Customers 
SET loyaltyPoints = loyaltyPoints + 25 
WHERE phone = '9876543210';

-- Update menu item price
UPDATE MenuItems 
SET price = 270 
WHERE name = 'Margherita Pizza';

-- Make a menu item unavailable
UPDATE MenuItems 
SET available = 0 
WHERE name = 'Chocolate Brownie';

-- Update staff salary
UPDATE Staff 
SET salary = salary * 1.10  -- 10% raise
WHERE name = 'Sarah Johnson';

-- Change staff shift
UPDATE Staff 
SET shift = 'evening' 
WHERE name = 'Sarah Johnson';

-- Update order status (Kitchen workflow)
UPDATE Orders 
SET status = 'PREPARING' 
WHERE id = @lastOrderId;

UPDATE Orders 
SET status = 'READY' 
WHERE id = @lastOrderId;

UPDATE Orders 
SET status = 'SERVED' 
WHERE id = @lastOrderId;

UPDATE Orders 
SET status = 'COMPLETED' 
WHERE id = @lastOrderId;

-- Update order total if items changed
UPDATE Orders o
SET total = (
    SELECT SUM(oi.quantity * oi.price) 
    FROM OrderItems oi 
    WHERE oi.orderId = o.id
)
WHERE id = @lastOrderId;

-- Update payment status
UPDATE Payments 
SET status = 'refunded' 
WHERE orderId = @lastOrderId;

-- Update inventory quantity (after usage)
UPDATE Inventories 
SET quantity = quantity - 10 
WHERE itemName = 'Fresh Basil';

-- Verify a review
UPDATE Reviews 
SET isVerified = 1 
WHERE id = 1;

-- Deactivate staff member
UPDATE Staff 
SET isActive = 0 
WHERE name = 'Sarah Johnson';


-- ============================================
-- 4. DELETE QUERIES (Remove Data)
-- ============================================

-- Delete a customer (will affect related orders)
DELETE FROM Customers 
WHERE phone = '9876543210' AND id NOT IN (SELECT DISTINCT customerId FROM Orders WHERE customerId IS NOT NULL);

-- Delete a menu item (only if not in any orders)
DELETE FROM MenuItems 
WHERE name = 'Chocolate Brownie' AND id NOT IN (SELECT DISTINCT menuItemId FROM OrderItems);

-- Delete a staff member
DELETE FROM Staff 
WHERE email = 'sarah.j@hotel.com' AND isActive = 0;

-- Delete an order item
DELETE FROM OrderItems 
WHERE orderId = @lastOrderId AND menuItemId = 3;
-- Update order total after deleting item
UPDATE Orders 
SET total = (SELECT IFNULL(SUM(quantity * price), 0) FROM OrderItems WHERE orderId = @lastOrderId) 
WHERE id = @lastOrderId;

-- Delete a payment
DELETE FROM Payments 
WHERE orderId = @lastOrderId AND status = 'refunded';

-- Delete an entire order (will cascade delete order items)
DELETE FROM Orders 
WHERE id = @lastOrderId;

-- Delete a review
DELETE FROM Reviews 
WHERE id = 1 AND customerId = 1;

-- Delete inventory item
DELETE FROM Inventories 
WHERE itemName = 'Fresh Basil' AND quantity < 5;


-- ============================================
-- 5. ADVANCED QUERIES (Analytics & Reports)
-- ============================================

-- Total revenue by day
SELECT DATE(createdAt) AS orderDate, 
       COUNT(*) AS totalOrders,
       SUM(total) AS totalRevenue
FROM Orders
WHERE status = 'COMPLETED'
GROUP BY DATE(createdAt)
ORDER BY orderDate DESC;

-- Most popular menu items
SELECT m.name, m.category, 
       COUNT(oi.id) AS timesOrdered,
       SUM(oi.quantity) AS totalQuantity,
       SUM(oi.quantity * oi.price) AS revenue
FROM MenuItems m
JOIN OrderItems oi ON m.id = oi.menuItemId
GROUP BY m.id, m.name, m.category
ORDER BY timesOrdered DESC
LIMIT 10;

-- Staff performance (by orders served)
SELECT s.name, s.role, s.shift,
       COUNT(DISTINCT o.id) AS ordersHandled
FROM Staff s
CROSS JOIN Orders o
WHERE s.isActive = 1
GROUP BY s.id, s.name, s.role, s.shift
ORDER BY ordersHandled DESC;

-- Customer loyalty ranking
SELECT name, phone, loyaltyPoints,
       COUNT(o.id) AS totalOrders,
       IFNULL(SUM(o.total), 0) AS totalSpent
FROM Customers c
LEFT JOIN Orders o ON c.id = o.customerId
GROUP BY c.id, c.name, c.phone, c.loyaltyPoints
ORDER BY totalSpent DESC
LIMIT 10;

-- Average ratings breakdown
SELECT 
    AVG(rating) AS avgOverallRating,
    AVG(foodRating) AS avgFoodRating,
    AVG(serviceRating) AS avgServiceRating,
    AVG(ambianceRating) AS avgAmbianceRating,
    COUNT(*) AS totalReviews
FROM Reviews
WHERE isVerified = 1;

-- Inventory value
SELECT 
    COUNT(*) AS totalItems,
    SUM(quantity) AS totalQuantity,
    SUM(quantity * cost) AS totalInventoryValue
FROM Inventories;

-- Orders by status
SELECT status, 
       COUNT(*) AS count,
       SUM(total) AS totalAmount
FROM Orders
GROUP BY status
ORDER BY count DESC;

-- Revenue by payment method
SELECT p.method,
       COUNT(*) AS transactions,
       SUM(p.amount) AS totalAmount
FROM Payments p
WHERE p.status = 'completed'
GROUP BY p.method
ORDER BY totalAmount DESC;

-- Menu items by category count
SELECT category, 
       COUNT(*) AS itemCount,
       AVG(price) AS avgPrice,
       MIN(price) AS minPrice,
       MAX(price) AS maxPrice
FROM MenuItems
WHERE available = 1
GROUP BY category
ORDER BY category;


-- ============================================
-- 6. USEFUL VERIFICATION QUERIES
-- ============================================

-- Check for orders with mismatched totals
SELECT o.id, o.total AS recordedTotal,
       IFNULL(SUM(oi.quantity * oi.price), 0) AS calculatedTotal,
       (o.total - IFNULL(SUM(oi.quantity * oi.price), 0)) AS difference
FROM Orders o
LEFT JOIN OrderItems oi ON o.id = oi.orderId
GROUP BY o.id, o.total
HAVING ABS(difference) > 0.01;

-- Check for unpaid orders
SELECT o.id, o.tableNumber, o.status, o.total,
       IFNULL(SUM(p.amount), 0) AS totalPaid,
       (o.total - IFNULL(SUM(p.amount), 0)) AS balance
FROM Orders o
LEFT JOIN Payments p ON o.orderId = p.id AND p.status = 'completed'
WHERE o.status = 'COMPLETED'
GROUP BY o.id, o.tableNumber, o.status, o.total
HAVING balance > 0;

-- Check customer data integrity
SELECT * FROM Customers WHERE phone IS NULL OR name IS NULL;

-- Check for inactive staff still assigned shifts
SELECT * FROM Staff WHERE isActive = 0 AND shift IS NOT NULL;

-- Low inventory alert
SELECT * FROM Inventories WHERE quantity < 10 ORDER BY quantity;


-- ============================================
-- 7. QUICK TEST SCENARIOS
-- ============================================

-- Scenario 1: New customer places an order
START TRANSACTION;
INSERT INTO Customers (name, phone, email, loyaltyPoints, createdAt, updatedAt) VALUES ('Test Customer', '5555555555', 'test@test.com', 0, NOW(), NOW());
SET @newCustomerId = LAST_INSERT_ID();
INSERT INTO Orders (tableNumber, customerId, status, total, createdAt, updatedAt) VALUES ('TEST1', @newCustomerId, 'PENDING', 0, NOW(), NOW());
SET @newOrderId = LAST_INSERT_ID();
INSERT INTO OrderItems (orderId, menuItemId, quantity, price, createdAt, updatedAt) VALUES (@newOrderId, 1, 1, 250, NOW(), NOW());
UPDATE Orders SET total = 250 WHERE id = @newOrderId;
SELECT * FROM Orders WHERE id = @newOrderId;
ROLLBACK; -- Remove test data

-- Scenario 2: Complete order workflow
START TRANSACTION;
INSERT INTO Orders (tableNumber, status, total, createdAt, updatedAt) VALUES ('TEST2', 'PENDING', 350, NOW(), NOW());
SET @testOrderId = LAST_INSERT_ID();
UPDATE Orders SET status = 'PREPARING' WHERE id = @testOrderId;
UPDATE Orders SET status = 'READY' WHERE id = @testOrderId;
UPDATE Orders SET status = 'SERVED' WHERE id = @testOrderId;
INSERT INTO Payments (orderId, amount, method, status, createdAt, updatedAt) VALUES (@testOrderId, 350, 'cash', 'completed', NOW(), NOW());
UPDATE Orders SET status = 'COMPLETED' WHERE id = @testOrderId;
SELECT * FROM Orders WHERE id = @testOrderId;
ROLLBACK; -- Remove test data


-- ============================================
-- 8. DATABASE STATISTICS
-- ============================================

SELECT 
    'Customers' AS TableName, COUNT(*) AS RecordCount FROM Customers
UNION ALL SELECT 'MenuItems', COUNT(*) FROM MenuItems
UNION ALL SELECT 'Orders', COUNT(*) FROM Orders
UNION ALL SELECT 'OrderItems', COUNT(*) FROM OrderItems
UNION ALL SELECT 'Payments', COUNT(*) FROM Payments
UNION ALL SELECT 'Staff', COUNT(*) FROM Staff
UNION ALL SELECT 'Inventories', COUNT(*) FROM Inventories
UNION ALL SELECT 'Reviews', COUNT(*) FROM Reviews
UNION ALL SELECT 'Users', COUNT(*) FROM Users;
