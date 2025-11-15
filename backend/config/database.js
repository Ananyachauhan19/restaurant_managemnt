const { Sequelize } = require('sequelize');
require('dotenv').config();

// Decide dialect: prefer explicit MYSQL_* variables; fallback to DATABASE_URL; else sqlite
const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_DATABASE,
  MYSQL_USER,
  MYSQL_PASSWORD,
  DB_DIALECT
} = process.env;

let sequelize;

if ((DB_DIALECT && DB_DIALECT.toLowerCase() === 'mysql') || (MYSQL_HOST && MYSQL_DATABASE)) {
  // MySQL configuration
  sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD, {
    host: MYSQL_HOST || 'localhost',
    port: MYSQL_PORT ? parseInt(MYSQL_PORT, 10) : 3306,
    dialect: 'mysql',
    logging: false,
    timezone: '+00:00', // store in UTC
    define: {
      underscored: false
    }
  });
  console.log('🛢️  Using MySQL database');
} else {
  // SQLite fallback (development default)
  const sqliteUrl = process.env.DATABASE_URL || 'sqlite:./database.sqlite';
  sequelize = new Sequelize(sqliteUrl, {
    logging: false,
    dialect: 'sqlite',
    storage: './database.sqlite'
  });
  console.log('🗄️  Using SQLite database');
}

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

testConnection();

module.exports = sequelize;