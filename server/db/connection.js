const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password", // 自分の環境
  database: "mahjong"
});

console.log("DB pool created");

// db.connect(err => {
//   if (err) {
//     console.error("DB connection error:", err);
//     return;
//   }
//   console.log("MySQL connected");
// });

module.exports = db;
