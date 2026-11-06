const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'planner_db',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;