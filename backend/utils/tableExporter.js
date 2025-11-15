const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models');
const { setExportInProgress, clearExportFlag } = require('./markdownSyncFlag');

function ensureOutputDir() {
  const outDir = path.join(__dirname, '..', 'data_tables');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  return outDir;
}

function mapModelToFilename(modelName) {
  const map = {
    User: 'authenticate',
    Staff: 'staff',
    MenuItem: 'menu',
    Customer: 'customers',
    Order: 'orders',
    OrderItem: 'order_items',
    Inventory: 'inventory',
    Payment: 'payments',
    Review: 'reviews'
  };
  return map[modelName] || modelName.toLowerCase();
}

function toMarkdownTable(rows) {
  if (!rows || rows.length === 0) {
    return 'No data.';
  }
  const columns = Object.keys(rows[0]);
  const header = `| ${columns.join(' | ')} |`;
  const sep = `| ${columns.map(() => '---').join(' | ')} |`;
  const body = rows.map(r => `| ${columns.map(k => formatCell(r[k])).join(' | ')} |`).join('\n');
  return `${header}\n${sep}\n${body}`;
}

function formatCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return '`' + JSON.stringify(value) + '`';
  return String(value).replace(/\n/g, ' ').slice(0, 500);
}

async function exportModelToMarkdown(model, filename) {
  const outDir = ensureOutputDir();
  const filePath = path.join(outDir, `${filename}.md`);
  
  // Get model data with appropriate includes for better relationships
  let rows;
  try {
    if (filename === 'orders') {
      rows = await model.findAll({ 
        include: [
          { model: sequelize.models.Customer, attributes: ['id', 'name', 'email'] },
          { model: sequelize.models.OrderItem, include: [{ model: sequelize.models.MenuItem, attributes: ['name', 'price'] }] }
        ],
        raw: false 
      });
      // Convert to plain objects for table formatting
      rows = rows.map(row => ({
        id: row.id,
        tableNumber: row.tableNumber,
        status: row.status,
        total: row.total,
        customer: row.Customer ? `${row.Customer.name} (${row.Customer.email})` : 'Walk-in',
        items: row.OrderItems ? row.OrderItems.map(item => `${item.MenuItem.name} x${item.quantity}`).join(', ') : '',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }));
    } else if (filename === 'order_items') {
      rows = await model.findAll({ 
        include: [
          { model: sequelize.models.Order, attributes: ['id', 'tableNumber'] },
          { model: sequelize.models.MenuItem, attributes: ['name', 'price'] }
        ],
        raw: false 
      });
      rows = rows.map(row => ({
        id: row.id,
        orderId: row.orderId,
        orderTable: row.Order ? `Order #${row.Order.id} (Table ${row.Order.tableNumber})` : `Order #${row.orderId}`,
        menuItem: row.MenuItem ? row.MenuItem.name : `Item #${row.menuItemId}`,
        quantity: row.quantity,
        price: row.price,
        total: row.quantity * row.price,
        createdAt: row.createdAt
      }));
    } else if (filename === 'payments') {
      rows = await model.findAll({ 
        include: [
          { model: sequelize.models.Order, attributes: ['id', 'tableNumber', 'total'] }
        ],
        raw: false 
      });
      rows = rows.map(row => ({
        id: row.id,
        orderId: row.orderId,
        orderInfo: row.Order ? `Order #${row.Order.id} (Table ${row.Order.tableNumber})` : `Order #${row.orderId}`,
        amount: row.amount,
        method: row.method,
        status: row.status,
        createdAt: row.createdAt
      }));
    } else if (filename === 'reviews') {
      rows = await model.findAll({ 
        include: [
          { model: sequelize.models.Customer, attributes: ['name', 'email'] },
          { model: sequelize.models.Order, attributes: ['id', 'tableNumber'] }
        ],
        raw: false 
      });
      rows = rows.map(row => ({
        id: row.id,
        customer: row.Customer ? `${row.Customer.name} (${row.Customer.email})` : 'Anonymous',
        order: row.Order ? `Order #${row.Order.id} (Table ${row.Order.tableNumber})` : `Order #${row.orderId}`,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.createdAt
      }));
    } else {
      rows = await model.findAll({ raw: true });
    }
  } catch (error) {
    console.error(`Error fetching data for ${filename}:`, error.message);
    rows = await model.findAll({ raw: true });
  }
  
  const content = `# ${filename.charAt(0).toUpperCase() + filename.slice(1)}\n\n**Last Updated:** ${new Date().toLocaleString()}\n\n**Total Records:** ${rows.length}\n\n${toMarkdownTable(rows)}\n`;
  // Mark export in progress to avoid triggering the markdown watcher loop
  try {
    setExportInProgress(filename, true);
    fs.writeFileSync(filePath, content, 'utf8');
  } finally {
    // Clear the flag shortly after writing to re-enable watcher handling
    setTimeout(() => clearExportFlag(filename), 1200);
  }
}

async function exportAllTables(modelsRegistry) {
  const modelEntries = Object.entries(modelsRegistry).filter(([key]) => key[0] === key[0].toUpperCase());
  for (const [name, model] of modelEntries) {
    const filename = mapModelToFilename(name);
    try {
      await exportModelToMarkdown(model, filename);
    } catch (err) {
      // Best-effort: do not crash the app on export failure
      // eslint-disable-next-line no-console
      console.error(`[tableExporter] Failed to export ${name}:`, err.message);
    }
  }
}

function attachExportHooks(modelsRegistry) {
  const modelEntries = Object.entries(modelsRegistry).filter(([key]) => key[0] === key[0].toUpperCase());
  for (const [name, model] of modelEntries) {
    const filename = mapModelToFilename(name);
    const trigger = async () => {
      try {
        await exportModelToMarkdown(model, filename);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[tableExporter] Hook export failed for ${name}:`, err.message);
      }
    };
    model.addHook('afterCreate', trigger);
    model.addHook('afterUpdate', trigger);
    model.addHook('afterDestroy', trigger);
  }
}

module.exports = { exportAllTables, attachExportHooks };


