-- Hotel Management System - MySQL Database Schema
-- Run this script in MySQL Workbench to create the database structure
-- Generated for MySQL 8.0+

-- Create database (run only if needed)
CREATE DATABASE IF NOT EXISTS hotel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_db;

-- Drop existing tables (if re-running script)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Reviews;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS OrderItems;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Inventories;
DROP TABLE IF EXISTS Staff;
DROP TABLE IF EXISTS MenuItems;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users table (authentication and system users)
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table
CREATE TABLE Customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    loyaltyPoints INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MenuItems table
CREATE TABLE MenuItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    isVeg TINYINT(1) DEFAULT 1,
    available TINYINT(1) DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_available (available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE Orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT,
    tableNumber VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING',
    total DECIMAL(10,2) DEFAULT 0.00,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Customers(id) ON DELETE SET NULL,
    INDEX idx_customer (customerId),
    INDEX idx_status (status),
    INDEX idx_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OrderItems table (junction table for Orders and MenuItems)
CREATE TABLE OrderItems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT NOT NULL,
    menuItemId INT NOT NULL,
    quantity INT DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menuItemId) REFERENCES MenuItems(id) ON DELETE CASCADE,
    INDEX idx_order (orderId),
    INDEX idx_menu (menuItemId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE Payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId INT,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE SET NULL,
    INDEX idx_order (orderId),
    INDEX idx_method (method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff table
CREATE TABLE Staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    role ENUM('chef', 'cook', 'waiter', 'manager', 'cashier', 'cleaner', 'security') NOT NULL,
    experience INT NOT NULL DEFAULT 0,
    salary DECIMAL(10,2) NOT NULL,
    address TEXT,
    dateOfBirth DATE,
    dateOfJoining DATE NOT NULL,
    isActive TINYINT(1) DEFAULT 1,
    emergencyContact VARCHAR(255),
    emergencyContactPhone VARCHAR(50),
    skills TEXT,
    shift ENUM('morning', 'afternoon', 'evening', 'night'),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_isActive (isActive),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventories table
CREATE TABLE Inventories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    itemName VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 0,
    cost DECIMAL(10,2),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_item (itemName)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews table
CREATE TABLE Reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customerId INT,
    orderId INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    foodRating INT,
    serviceRating INT,
    ambianceRating INT,
    isVerified TINYINT(1) DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Customers(id) ON DELETE SET NULL,
    FOREIGN KEY (orderId) REFERENCES Orders(id) ON DELETE SET NULL,
    INDEX idx_customer (customerId),
    INDEX idx_order (orderId),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123, hashed with bcrypt)
INSERT INTO Users (username, password, name, role) VALUES
('admin', '$2b$10$5QRIIRpxisHkYX/g9c7ZxezuFrnG3.kh.qmkYFgD4z2ZYicYxXFvO', 'Admin User', 'admin');

-- Sample data verification
SELECT 'Database schema created successfully' AS status;
SELECT TABLE_NAME, TABLE_ROWS 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'hotel_db' 
ORDER BY TABLE_NAME;


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

select * from orders;

UPDATE ORDERS SET STATUS = 'PREPARING' where id = 16;


UPDATE ORDERS SET STATUS = 'READY' where id = 16;

UPDATE ORDERS SET STATUS = 'DELIVERED' where id = 16;

UPDATE ORDERS SET STATUS = 'PAID' where id = 16;

DELETE FROM ORDERS WHERE id = 16;


desc menuitems;


insert into menuitems (name, price, category, isVeg, available, createdAt, updatedAt) 
values ("Sheer Korma", 250, "Rice", 1, 1, NOW(), NOW());

select * from menuitems;

update menuitems set category = 'Dessert' where id = 119;


select * from customers;
delete from customers where name = 'Kavita Joshi';

update customers set loyaltypoints = 5 where id = 3;