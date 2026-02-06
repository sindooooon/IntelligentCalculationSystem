// document.getElementById('start-button').addEventListener('click', () => {
//   // 次の画面へ遷移
//   window.location.href = 'game.html';
// });

// screen.orientation.lock();

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-button");

  startBtn.addEventListener("click", onStart);
});


const WIND_MAP = {
  "東": 0,
  "南": 1,
  "西": 2,
  "北": 3
};

function getPlayers() {
  const rows = document.querySelectorAll(".player-row");

  return Array.from(rows).map(row => {
    const windText = row.querySelector(".wind").textContent;
    const name = row.querySelector(".name-box").value || "";

    return {
      wind: WIND_MAP[windText],
      name: name
    };
  });
}

function getSettings() {
  return {
    uma: [
      Number(document.getElementById("uma-1").value),
      Number(document.getElementById("uma-2").value)
    ],
    westIn: Number(document.getElementById("west-in").value),
    tobi: Number(document.getElementById("tobi").value)
  };
}

async function onStart() {
  const players = getPlayers();
  const settings = getSettings();

  const payload = {
    players,
    uma: settings.uma,
    westIn: settings.westIn,
    tobi: settings.tobi
  };
  const result = await insertGame(payload);

  console.log("ゲーム開始:", result);
  window.location.href = `game.html?gameId=${result.gameId}`;
}

/* ゲーム作成 */
async function insertGame(data) {
  const res = await fetch("/api/insert-game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

