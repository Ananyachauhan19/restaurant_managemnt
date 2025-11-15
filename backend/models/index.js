const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Customer = require('./customer')(sequelize);
const MenuItem = require('./menuItem')(sequelize);
const Order = require('./order')(sequelize);
const OrderItem = require('./orderItem')(sequelize);
const Payment = require('./payment')(sequelize);
const User = require('./user')(sequelize);
const Staff = require('./staff')(sequelize);
const Inventory = require('./inventory')(sequelize);
const Review = require('./review')(sequelize);

// Associations with cascade delete/update where appropriate
Customer.hasMany(Order, { foreignKey: 'customerId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Order.belongsTo(Customer, { foreignKey: 'customerId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Order.belongsToMany(MenuItem, { through: OrderItem, foreignKey: 'orderId' });
MenuItem.belongsToMany(Order, { through: OrderItem, foreignKey: 'menuItemId' });

// When an Order is deleted, cascade delete its OrderItems
Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE', onUpdate: 'CASCADE', hooks: true });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

OrderItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' });
MenuItem.hasMany(OrderItem, { foreignKey: 'menuItemId' });

// When an Order is deleted, also cascade delete its Payment
Order.hasOne(Payment, { foreignKey: 'orderId', onDelete: 'CASCADE', onUpdate: 'CASCADE', hooks: true });
Payment.belongsTo(Order, { foreignKey: 'orderId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

// Review associations - if a Customer or Order is deleted, remove related Reviews
Review.belongsTo(Customer, { foreignKey: 'customerId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Customer.hasMany(Review, { foreignKey: 'customerId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Review.belongsTo(Order, { foreignKey: 'orderId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Order.hasMany(Review, { foreignKey: 'orderId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

module.exports = {
  sequelize,
  Customer,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  User,
  Staff,
  Inventory,
  Review
};