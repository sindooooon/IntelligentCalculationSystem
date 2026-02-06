const express = require('express');
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 30000;

app.use(cors());
// JSON受け取り
app.use(express.json());

// ★ 静的ファイル配信（ここが超重要）
app.use(express.static(__dirname));

const settingRoute = require("./routes/game");
app.use("/api", settingRoute);

// ===== サーバー起動 =====
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "home.html"));
});
