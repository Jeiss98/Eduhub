// config/mysql.js — Pool de conexiones MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.MYSQL_HOST     || 'localhost',
  port:     parseInt(process.env.MYSQL_PORT || '3306'),
  user:     process.env.MYSQL_USER     || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'eduhub_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '-05:00', // Colombia (UTC-5)
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL conectado →', process.env.MYSQL_DATABASE);
    conn.release();
  } catch (err) {
    console.error('❌ MySQL ERROR:', err);
    console.error('   Verifica tus credenciales en .env');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
