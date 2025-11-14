const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');

// Execute SQL query
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required and must be a string' });
    }

    // Execute the raw SQL query
    const [results, metadata] = await sequelize.query(query);
    
    // Emit query result to all connected clients via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('query-executed', {
        query,
        results,
        timestamp: new Date().toISOString(),
        rowCount: Array.isArray(results) ? results.length : 0
      });
    }

    res.json({
      success: true,
      query,
      results,
      rowCount: Array.isArray(results) ? results.length : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Query execution error:', error);
    
    // Emit error to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('query-error', {
        query: req.body.query,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
      query: req.body.query
    });
  }
});

// Get query history (if you want to store it)
router.get('/history', async (req, res) => {
  try {
    // For now, return empty array. You can implement storage later
    res.json({ history: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
