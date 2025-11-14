#!/usr/bin/env node

const readline = require('readline');
const axios = require('axios');
const { io } = require('socket.io-client');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:4000';
const TOKEN = process.env.AUTH_TOKEN || '';

// Create socket connection
const socket = io(API_URL);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'SQL> '
});

console.log('╔═══════════════════════════════════════════════╗');
console.log('║   Hotel Management - SQL Terminal Client     ║');
console.log('╚═══════════════════════════════════════════════╝');
console.log('');
console.log('Connecting to server...');

socket.on('connect', () => {
  console.log('✓ Connected to server');
  console.log('');
  console.log('Commands:');
  console.log('  - Enter SQL query to execute');
  console.log('  - Type "exit" or "quit" to close');
  console.log('  - Type "help" for examples');
  console.log('');
  rl.prompt();
});

socket.on('disconnect', () => {
  console.log('✗ Disconnected from server');
});

socket.on('query-executed', (data) => {
  console.log('');
  console.log('✓ Query executed successfully');
  console.log(`  Rows returned: ${data.rowCount}`);
  console.log(`  Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
  
  if (data.results && data.results.length > 0) {
    console.log('');
    console.table(data.results);
  }
  console.log('');
  rl.prompt();
});

socket.on('query-error', (data) => {
  console.log('');
  console.log('✗ Query failed');
  console.log(`  Error: ${data.error}`);
  console.log(`  Timestamp: ${new Date(data.timestamp).toLocaleString()}`);
  console.log('');
  rl.prompt();
});

rl.on('line', async (line) => {
  const query = line.trim();

  if (!query) {
    rl.prompt();
    return;
  }

  if (query.toLowerCase() === 'exit' || query.toLowerCase() === 'quit') {
    console.log('Goodbye!');
    socket.disconnect();
    process.exit(0);
  }

  if (query.toLowerCase() === 'help') {
    console.log('');
    console.log('Example queries:');
    console.log('  SELECT * FROM Customers LIMIT 10');
    console.log('  SELECT * FROM Orders WHERE status = "pending"');
    console.log('  SELECT * FROM MenuItems');
    console.log('  SELECT COUNT(*) as total FROM Orders');
    console.log('  SELECT * FROM Customers WHERE name LIKE "%John%"');
    console.log('');
    rl.prompt();
    return;
  }

  // Execute query via socket
  console.log('Executing query...');
  socket.emit('execute-query', { query });
});

rl.on('close', () => {
  console.log('Goodbye!');
  socket.disconnect();
  process.exit(0);
});

// Handle errors
process.on('uncaughtException', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
