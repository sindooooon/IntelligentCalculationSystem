/* 閉じるボタン */
const closeBtn = document.getElementById("closeBtn");
closeBtn.addEventListener("click", () => {
  // window.location.href = 'setting.html';
});

document.addEventListener("DOMContentLoaded", async() => {
  const res = await sendGetResult();
  const result = res.result;
  const isDispTobi = result[0].tobi !== undefined;
  document.getElementById("tobi").hidden = !isDispTobi;

  result.forEach(r => {
    document.getElementById(`player-${r.col}`).textContent = r.name;
    document.getElementById(`rank-${r.col}`).textContent = r.rank;
    document.getElementById(`real-point-${r.col}`).textContent = r.realPoint;
    document.getElementById(`point-${r.col}`).textContent = r.point;
    document.getElementById(`oka-${r.col}`).textContent = r.oka;
    document.getElementById(`uma-${r.col}`).textContent = r.uma;
    if(isDispTobi) {
      document.getElementById(`tobi-${r.col}`).textContent = r.tobi;
    }
    document.getElementById(`result-${r.col}`).textContent = r.total;
  });

});

/* 結果取得リクエスト */
async function sendGetResult() {
  const res = await fetch("/api/get-result", {
    method: "GET"
  });
  return res.json();
}
