// const mysql = require("mysql2/promise");

// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "password", // 自分の環境
//   database: "mahjong"
// });
// module.exports = db;
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log("DB pool created");
module.exports = pool;

