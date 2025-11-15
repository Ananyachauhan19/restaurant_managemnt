const fs = require('fs');
const path = require('path');
const { sequelize, Customer, MenuItem, Order, OrderItem, Payment, Staff, Inventory, Review } = require('../models');

// Map filename to model
const filenameToModel = {
  'customers': Customer,
  'menu': MenuItem,
  'orders': Order,
  'order_items': OrderItem,
  'payments': Payment,
  'staff': Staff,
  'inventory': Inventory,
  'reviews': Review
};

// Parse markdown table to array of objects
function parseMarkdownTable(content) {
  const lines = content.split('\n').filter(line => line.trim());
  
  // Find the table start (line with |)
  let tableStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('|') && !lines[i].includes('---')) {
      tableStart = i;
      break;
    }
  }
  
  if (tableStart === -1) return [];
  
  // Get headers
  const headerLine = lines[tableStart];
  const headers = headerLine.split('|').map(h => h.trim()).filter(h => h && h !== '---');
  
  // Get data rows (skip separator line)
  const dataRows = [];
  for (let i = tableStart + 2; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('|')) break;
    const values = lines[i].split('|').map(v => v.trim()).filter((v, idx) => idx > 0 && idx <= headers.length);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, idx) => {
        let value = values[idx];
        // Parse value types
        if (value === '' || value === 'null') {
          value = null;
        } else if (!isNaN(value) && value !== '') {
          value = value.includes('.') ? parseFloat(value) : parseInt(value);
        } else if (value === 'true' || value === 'false') {
          value = value === 'true';
        } else if (value.startsWith('`') && value.endsWith('`')) {
          try {
            value = JSON.parse(value.slice(1, -1));
          } catch {
            value = value.slice(1, -1);
          }
        }
        row[header] = value;
      });
      dataRows.push(row);
    }
  }
  
  return dataRows;
}

// Sync markdown file to database
async function syncMarkdownToDatabase(filename) {
  const model = filenameToModel[filename];
  if (!model) {
    console.log(`[markdownSync] No model found for ${filename}`);
    return;
  }

  const filePath = path.join(__dirname, '..', 'data_tables', `${filename}.md`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`[markdownSync] File not found: ${filePath}`);
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = parseMarkdownTable(content);
    
    if (rows.length === 0) {
      console.log(`[markdownSync] No data found in ${filename}.md`);
      return;
    }

    console.log(`[markdownSync] Syncing ${rows.length} records from ${filename}.md to database...`);
    
    // For now, we'll update existing records and create new ones
    // This is a simple sync - in production, you'd want more sophisticated diffing
    for (const row of rows) {
      if (row.id) {
        const existing = await model.findByPk(row.id);
        if (existing) {
          // Update existing
          await existing.update(row);
        } else {
          // Create new
          await model.create(row);
        }
      }
    }
    
    console.log(`[markdownSync] ✅ Synced ${filename}.md to database`);
  } catch (error) {
    console.error(`[markdownSync] ❌ Error syncing ${filename}.md:`, error.message);
  }
}

// Watch markdown files for changes
function watchMarkdownFiles() {
  const dataTablesDir = path.join(__dirname, '..', 'data_tables');
  
  if (!fs.existsSync(dataTablesDir)) {
    console.log('[markdownSync] data_tables directory not found');
    return;
  }

  console.log('[markdownSync] Watching markdown files for changes...');

  const { isExportInProgress } = require('./markdownSyncFlag');

  // Watch the entire directory
  fs.watch(dataTablesDir, { recursive: false }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.md')) return;

    const baseName = path.basename(filename, '.md');

    // If table export just wrote this file, ignore the event
    if (isExportInProgress(baseName)) {
      // console.log(`[markdownSync] Ignoring change in ${filename} (export in progress)`);
      return;
    }

    // Debounce: wait 1 second after last change
    clearTimeout(watchMarkdownFiles.timeouts?.[baseName]);
    if (!watchMarkdownFiles.timeouts) watchMarkdownFiles.timeouts = {};

    watchMarkdownFiles.timeouts[baseName] = setTimeout(() => {
      console.log(`[markdownSync] Detected change in ${filename}`);
      syncMarkdownToDatabase(baseName);
    }, 1000);
  });
}

// Sync all markdown files to database
async function syncAllMarkdownFiles() {
  const dataTablesDir = path.join(__dirname, '..', 'data_tables');
  
  if (!fs.existsSync(dataTablesDir)) {
    console.log('[markdownSync] data_tables directory not found');
    return;
  }

  const files = fs.readdirSync(dataTablesDir).filter(f => f.endsWith('.md'));
  
  console.log(`[markdownSync] Syncing ${files.length} markdown files to database...`);
  
  for (const file of files) {
    const baseName = path.basename(file, '.md');
    await syncMarkdownToDatabase(baseName);
  }
  
  console.log('[markdownSync] ✅ All markdown files synced');
}

module.exports = {
  syncMarkdownToDatabase,
  syncAllMarkdownFiles,
  watchMarkdownFiles
};

