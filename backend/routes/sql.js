const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { auth } = require('../middleware/auth');

// Execute SQL query
router.post('/execute', auth, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'SQL query is required' 
      });
    }

    // Security: Block dangerous operations in production
    const trimmedQuery = query.trim().toUpperCase();
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE'];
    
    // Detect query types
    const isSelectQuery = trimmedQuery.startsWith('SELECT');
    const isPragmaQuery = trimmedQuery.startsWith('PRAGMA');
    const isReadOnly = process.env.NODE_ENV === 'production' && !isSelectQuery && !isPragmaQuery;
    
    if (isReadOnly) {
      // In production, only allow SELECT queries
      return res.status(403).json({ 
        success: false, 
        error: 'Only SELECT queries are allowed in production mode' 
      });
    }

    // Check for dangerous keywords (even in development, warn about destructive operations)
    const hasDangerousKeyword = dangerousKeywords.some(keyword => 
      trimmedQuery.includes(keyword)
    );

    if (hasDangerousKeyword && !isSelectQuery) {
      // In development, allow but log a warning
      console.warn(`⚠️  Potentially dangerous SQL query executed: ${query.substring(0, 100)}`);
    }

    // Execute the query - supports SQLite & MySQL (dialect differences minimal for SELECT/DDL here)
    let results;
    let affectedRows = 0;
    
    if (isPragmaQuery) {
      // PRAGMA queries need special handling - use RAW type
      // PRAGMA returns [[results], metadata] where results is array of objects
      const queryResult = await sequelize.query(query, {
        type: sequelize.QueryTypes.RAW
      });
      
      // Extract the actual results array
      // queryResult format: [[{...}, {...}], {}]
      if (Array.isArray(queryResult) && queryResult.length > 0 && Array.isArray(queryResult[0])) {
        results = queryResult[0]; // This is the array of row objects
      } else if (Array.isArray(queryResult) && queryResult.length > 0) {
        // Fallback: if first element is not array, use it directly
        results = queryResult[0];
      } else if (Array.isArray(queryResult)) {
        results = queryResult;
      } else {
        results = [];
      }
    } else if (isSelectQuery) {
      // For SELECT queries
      results = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
      });
    } else {
      // For INSERT, UPDATE, DELETE, etc.
      const queryResult = await sequelize.query(query);
      // SQLite returns [result, metadata] format
      if (Array.isArray(queryResult) && queryResult.length === 2) {
        const metadata = queryResult[1];
        // Try to get affected rows from metadata
        if (metadata && typeof metadata === 'object') {
          affectedRows = metadata.changes || metadata.affectedRows || 0;
        }
        results = queryResult[0];
      } else {
        results = queryResult;
      }
    }

    // Format results - handle both array and object formats
    let formattedResults = [];
    let columns = [];
    
    if (isPragmaQuery && results) {
      // PRAGMA results should already be an array of objects
      if (Array.isArray(results) && results.length > 0) {
        formattedResults = results;
        // Get columns from first row
        if (typeof results[0] === 'object' && results[0] !== null) {
          columns = Object.keys(results[0]);
        }
      } else if (typeof results === 'object' && results !== null && !Array.isArray(results)) {
        // Single object result
        formattedResults = [results];
        columns = Object.keys(results);
      } else {
        formattedResults = [];
        columns = [];
      }
    } else if (isSelectQuery && results) {
      // Handle SELECT query results
      if (Array.isArray(results)) {
        formattedResults = results.map(row => {
          if (typeof row === 'object' && row !== null) {
            const formattedRow = {};
            Object.keys(row).forEach(key => {
              // Handle SQLite's column naming (table.column format)
              const cleanKey = key.includes('.') ? key.split('.').pop() : key;
              formattedRow[cleanKey] = row[key];
            });
            return formattedRow;
          }
          return row;
        });
      } else if (typeof results === 'object') {
        // Single result object
        const formattedRow = {};
        Object.keys(results).forEach(key => {
          const cleanKey = key.includes('.') ? key.split('.').pop() : key;
          formattedRow[cleanKey] = results[key];
        });
        formattedResults = [formattedRow];
      }
      
      // Get columns from first row if available
      columns = formattedResults.length > 0 && typeof formattedResults[0] === 'object'
        ? Object.keys(formattedResults[0])
        : [];
    }

    // Return response
    if (isSelectQuery || isPragmaQuery) {
      // Debug log for PRAGMA queries
      if (isPragmaQuery) {
        console.log('PRAGMA Response:', {
          formattedResultsLength: formattedResults.length,
          columnsLength: columns.length,
          sampleRow: formattedResults[0]
        });
      }
      
      res.json({
        success: true,
        data: formattedResults,
        rowCount: formattedResults.length,
        columns: columns,
        message: `Query executed successfully. ${formattedResults.length} row(s) returned.`
      });
    } else {
      res.json({
        success: true,
        data: [],
        rowCount: 0,
        columns: [],
        affectedRows: affectedRows,
        message: `Query executed successfully. ${affectedRows} row(s) affected.`,
        dialect: sequelize.getDialect(),
        insertId: (sequelize.getDialect() === 'mysql' && typeof results === 'object' && results && results.insertId) ? results.insertId : undefined
      });
    }

  } catch (error) {
    console.error('SQL Query Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute SQL query',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get table list
router.get('/tables', auth, async (req, res) => {
  try {
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    res.json({
      success: true,
      tables: tables.map(t => t.name || t.NAME || t.Name)
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tables'
    });
  }
});

// Get table schema
router.get('/schema/:tableName', auth, async (req, res) => {
  try {
    const { tableName } = req.params;
    
    // Validate table name (only alphanumeric and underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid table name'
      });
    }
    
    const schema = await sequelize.query(
      `PRAGMA table_info(${tableName})`,
      { type: sequelize.QueryTypes.SELECT }
    );
    
    res.json({
      success: true,
      tableName,
      schema
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch table schema'
    });
  }
});

module.exports = router;

