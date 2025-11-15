require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize, ...models } = require('./models');
const { attachExportHooks, exportAllTables } = require('./utils/tableExporter');
const { watchMarkdownFiles } = require('./utils/markdownSync');

const customersRouter = require('./routes/customers');
const menuRouter = require('./routes/menu');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const staffRouter = require('./routes/staff');
const inventoryRouter = require('./routes/inventory');
const reviewsRouter = require('./routes/reviews');
const authRouter = require('./routes/auth');
const { auth } = require('./middleware/auth');

const app = express();
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

// Error handling
const errorHandler = require('./middleware/error');
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start(){
  await sequelize.sync({ alter: true });
  
  // Attach export hooks to automatically update markdown files when data changes
  attachExportHooks(models);
  console.log('✅ Table export hooks attached');
  
  // Export all tables initially
  await exportAllTables(models);
  console.log('✅ Initial table export completed');
  
  // Watch markdown files for changes and sync to database
  if (process.env.ENABLE_MARKDOWN_SYNC !== 'false') {
    watchMarkdownFiles();
    console.log('✅ Markdown file watcher enabled (edit data_tables/*.md to update database)');
  }
  
  app.listen(PORT, () => console.log(`Server started on ${PORT}`));
}
start();