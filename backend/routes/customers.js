const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Customer } = require('../models');
const { Order, OrderItem, Payment, Review, sequelize } = require('../models');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ]
    } : {};
    
    const customers = await Customer.findAndCountAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      customers: customers.rows,
      total: customers.count,
      page: parseInt(page),
      pages: Math.ceil(customers.count / limit)
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// Create new customer
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('email').optional().isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customer.update(req.body);
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const customer = await Customer.findByPk(id, { transaction: t });

    if (!customer) {
      await t.rollback();
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Find all orders for this customer
    const orders = await Order.findAll({ where: { customerId: id }, attributes: ['id'], transaction: t });
    const orderIds = orders.map(o => o.id);

    // Delete payments for these orders
    if (orderIds.length > 0) {
      await Payment.destroy({ where: { orderId: orderIds }, transaction: t });
      await OrderItem.destroy({ where: { orderId: orderIds }, transaction: t });
      await Review.destroy({ where: { orderId: orderIds }, transaction: t });
      await Order.destroy({ where: { id: orderIds }, transaction: t });
    }

    // Delete reviews left by the customer (not tied to orders)
    await Review.destroy({ where: { customerId: id }, transaction: t });

    // Finally delete the customer
    await customer.destroy({ transaction: t });

    await t.commit();
    res.json({ message: 'Customer and related records deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Error deleting customer and related records:', error);
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Cannot delete customer because related records exist (orders, payments, reviews).' });
    }
    res.status(500).json({ message: 'Failed to delete customer' });
  }
});

module.exports = router;