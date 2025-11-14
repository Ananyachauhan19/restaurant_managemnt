require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { sequelize } = require('./models');
const models = require('./models');
const { exportAllTables, attachExportHooks } = require('./utils/tableExporter');

const customersRouter = require('./routes/customers');
const menuRouter = require('./routes/menu');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const staffRouter = require('./routes/staff');
const inventoryRouter = require('./routes/inventory');
const reviewsRouter = require('./routes/reviews');
const authRouter = require('./routes/auth');
const terminalRouter = require('./routes/terminal');
const { auth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Store io instance for use in routes
app.set('io', io);

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRouter);

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/customers', auth, customersRouter);
app.use('/api/menu', auth, menuRouter);
app.use('/api/orders', auth, ordersRouter);
app.use('/api/payments', auth, paymentsRouter);
app.use('/api/staff', auth, staffRouter);
app.use('/api/inventory', auth, inventoryRouter);
app.use('/api/reviews', auth, reviewsRouter);
app.use('/api/terminal', auth, terminalRouter);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('execute-query', async (data) => {
    try {
      const { query } = data;
      const [results, metadata] = await sequelize.query(query);
      
      io.emit('query-executed', {
        query,
        results,
        timestamp: new Date().toISOString(),
        rowCount: Array.isArray(results) ? results.length : 0
      });
    } catch (error) {
      io.emit('query-error', {
        query: data.query,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
});

// Error handling
const errorHandler = require('./middleware/error');
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start(){
  await sequelize.sync();
  // Attach hooks once models are synced
  attachExportHooks(models);
  // Initial export on boot
  exportAllTables(models);
  server.listen(PORT, () => console.log(`Server started on ${PORT}`));
}
start();