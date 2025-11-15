const { Order, sequelize } = require('./models');

(async () => {
  try {
    const orders = await Order.findAll({
      attributes: ['id', 'status', 'tableNumber', 'total'],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('\n=== All Orders with Status ===');
    orders.forEach(o => {
      console.log(`Order #${o.id} | Table: ${o.tableNumber} | Status: "${o.status}" | Total: ₹${o.total}`);
    });
    
    console.log('\n=== Status Summary ===');
    const statusCounts = {};
    orders.forEach(o => {
      const status = o.status || 'NULL';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count} orders`);
    });
    
    console.log(`\nTotal Orders: ${orders.length}`);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
})();
