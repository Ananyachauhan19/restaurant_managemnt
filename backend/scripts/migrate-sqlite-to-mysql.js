// Migration script: copy data from existing SQLite database into MySQL.
// Run AFTER configuring MySQL env variables and BEFORE switching app permanently.
// Usage:
//   1. Ensure current SQLite data exists (database.sqlite).
//   2. Set MySQL vars in .env (MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, DB_DIALECT=mysql).
//   3. Run: node scripts/migrate-sqlite-to-mysql.js
//   4. On success, start backend with MySQL enabled.

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// SQLite source connection (always points to file regardless of DB_DIALECT)
const sqlite = new Sequelize('sqlite:./database.sqlite', { dialect: 'sqlite', logging: false });

// MySQL target connection
const {
  MYSQL_HOST,
  MYSQL_PORT = 3306,
  MYSQL_DATABASE,
  MYSQL_USER,
  MYSQL_PASSWORD
} = process.env;

if (!MYSQL_HOST || !MYSQL_DATABASE || !MYSQL_USER) {
  console.error('❌ Missing MySQL environment variables. Please set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD.');
  process.exit(1);
}

const mysql = new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, {
  host: MYSQL_HOST,
  port: parseInt(MYSQL_PORT, 10),
  dialect: 'mysql',
  logging: false,
  timezone: '+00:00'
});

// Define minimal models (mirror existing definitions)
function defineModels(conn) {
  const Customer = conn.define('Customer', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING,
    dateOfBirth: DataTypes.STRING
  });
  const MenuItem = conn.define('MenuItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    price: DataTypes.FLOAT,
    category: DataTypes.STRING,
    isVeg: DataTypes.BOOLEAN,
    available: DataTypes.BOOLEAN
  });
  const Order = conn.define('Order', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tableNumber: DataTypes.STRING,
    status: { type: DataTypes.STRING },
    total: DataTypes.FLOAT
  });
  const OrderItem = conn.define('OrderItem', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    quantity: DataTypes.INTEGER,
    price: DataTypes.FLOAT
  });
  const Payment = conn.define('Payment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    amount: DataTypes.FLOAT,
    method: DataTypes.STRING
  });
  const User = conn.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    name: DataTypes.STRING,
    role: DataTypes.STRING
  });
  const Staff = conn.define('Staff', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    role: DataTypes.STRING,
    salary: DataTypes.FLOAT
  });
  const Inventory = conn.define('Inventory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    itemName: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    cost: DataTypes.FLOAT
  });
  const Review = conn.define('Review', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rating: DataTypes.INTEGER,
    comment: DataTypes.TEXT
  });

  // Basic associations (needed for foreign keys ordering maybe)
  Order.belongsTo(Customer, { foreignKey: 'customerId' });
  Customer.hasMany(Order, { foreignKey: 'customerId' });
  Order.belongsToMany(MenuItem, { through: OrderItem, foreignKey: 'orderId' });
  MenuItem.belongsToMany(Order, { through: OrderItem, foreignKey: 'menuItemId' });
  Order.hasMany(OrderItem, { foreignKey: 'orderId' });
  OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
  OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' });
  MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId' });
  Review.belongsTo(Customer, { foreignKey: 'customerId' });
  Customer.hasMany(Review, { foreignKey: 'customerId' });
  Review.belongsTo(Order, { foreignKey: 'orderId' });
  Order.hasMany(Review, { foreignKey: 'orderId' });

  return { Customer, MenuItem, Order, OrderItem, Payment, User, Staff, Inventory, Review };
}

async function migrate() {
  try {
    console.log('🔌 Connecting to SQLite & MySQL...');
    await sqlite.authenticate();
    await mysql.authenticate();
    console.log('✅ Connections established');

    const src = defineModels(sqlite);
    const dest = defineModels(mysql);

    console.log('🛠️  Syncing MySQL schema (no force)...');
    await mysql.sync();

    // Helper to copy a table preserving ids
    async function copy(modelName) {
      const sModel = src[modelName];
      const dModel = dest[modelName];
      const rows = await sModel.findAll({ raw: true });
      if (!rows.length) {
        console.log(`ℹ️  ${modelName}: no rows`);
        return;
      }
      // Insert with explicit ids; disable autoincrement for bulkCreate
      await dModel.bulkCreate(rows, { validate: false, ignoreDuplicates: true });
      console.log(`✅ ${modelName}: migrated ${rows.length} rows`);
    }

    // Order: tables without FKs first
    await copy('User');
    await copy('Customer');
    await copy('MenuItem');
    await copy('Staff');
    await copy('Inventory');
    await copy('Order');
    await copy('OrderItem');
    await copy('Payment');
    await copy('Review');

    console.log('🎉 Migration complete. Switch DB_DIALECT to mysql and restart backend.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await sqlite.close();
    await mysql.close();
    process.exit();
  }
}

migrate();