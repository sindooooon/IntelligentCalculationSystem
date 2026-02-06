/* HTML要素 */
/* ゲーム情報 */
let gameWindTop = document.getElementById("gameWindTop");
let gameHombaTop = document.getElementById("gameHombaTop");
let gameKyotakuTop = document.getElementById("gameKyotakuTop");
let gameWindBottom = document.getElementById("gameWindBottom");
let gameHombaBottom = document.getElementById("gameHombaBottom");
let gameKyotakuBottom = document.getElementById("gameKyotakuBottom");
/* プレイヤー名 */
const playerTop = document.getElementById("player-top");
const playerRight = document.getElementById("player-right");
const playerBottom = document.getElementById("player-bottom");
const playerLeft = document.getElementById("player-left");
/* ポイント */
const scoreTop = document.getElementById("score-top");
const scoreRight = document.getElementById("score-right");
const scoreBottom = document.getElementById("score-bottom");
const scoreLeft = document.getElementById("score-left");
/* モーダル */
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalContent = document.getElementById("modalContent");
const winBtn = document.getElementById("winBtn");
const ryukyokuBtn = document.getElementById("ryukyokuBtn");
const modalCloseBtn = document.getElementById("modalCloseBtn");


/* 変数 */
/* プレイヤー */
const players = [];
/* ゲーム情報 */
let gameWind = 0;
let gameKyoku = 1;
let gameHomba = 0;
let gameKyotaku = 0;
/* 差表示フラグ */
let isDisplayDiff = false;

// 放銃者選択で使用
const TSUMO_ID = 9;
const TOP = "top";
const RIGHT = "right";
const BOTTOM = "bottom";
const LEFT = "left";

const eastText = "東"; 
const southText = "南"; 
const westText = "西"; 
const northText = "北"; 
const WIND = [{id: 0, text: eastText}, {id: 1, text: southText}, {id: 2, text: westText}, {id: 3, text: northText}];

let winInfos = [];
let winInfo = {};

const DEFAULT_POINT = 25000;

// screen.orientation.lock();

/* 起動時 */
document.addEventListener("DOMContentLoaded", async () => {
  // ゲーム情報取得
  const res = await sendGetGameStart();
  const gameInfo = res.row;
  console.log(gameInfo);
  // ゲーム情報設定
  initGameInfoTop();
  initGameInfoBottom();
  // プレイヤー名設定
  initPlayers(gameInfo.player1, gameInfo.player2, gameInfo.player3, gameInfo.player4);
});

// 上部ゲーム情報設定
function initGameInfoTop(){
  initGameWindKyokuTop();
  initGameHombaTop();
  initGameKyotakuTop();
}

// 画面下部のゲーム情報設定
function initGameInfoBottom(){
  initGameKyotakuBottom();
  initGameHombaBottom();
  initGameWindKyokuBottom();
}

// 東一局を設定
function initGameWindKyokuTop(){
  const windText = getWindTextById(gameWind);
  if(!windText) console.error("場wind不正");

  const div = document.createElement("div");
  div.className = "info-box";
  div.id = "gameWindTop";
  div.textContent = windText + gameKyoku + "局";
  document.getElementById("round-info-top").appendChild(div);
}

// 0本場を設定
function initGameHombaTop(){
  const div = document.createElement("div");
  div.className = "info-box";
  div.id = "gameHombaTop";
  div.textContent = gameHomba + "本場";
  document.getElementById("round-info-top").appendChild(div);
}

// 供託0を設定
function initGameKyotakuTop(){
  const div = document.createElement("div");
  div.className = "info-box";
  div.id = "gameKyotakuTop";
  div.textContent = "供託 " + gameKyotaku;
  document.getElementById("round-info-top").appendChild(div);
}

// 東一局を設定
function initGameWindKyokuBottom(){
  const windText = getWindTextById(gameWind);
  if(!windText) console.error("場wind不正");

  const div = document.createElement("div");
  div.className = "info-box";
  div.id = "gameWindBottom";
  div.textContent = windText + gameKyoku + "局";
  div.classList.add("rotate-180");
  document.getElementById("round-info-bottom").appendChild(div);
}

// 0本場を設定
function initGameHombaBottom(){
  const div = document.createElement("div");
  div.className = "info-box";
  div.id = "gameHombaBottom";
  div.textContent = gameHomba + "本場";
  div.classList.add("rotate-180");
  document.getElementById("round-info-bottom").appendChild(div);
}

// 供託0を設定
function initGameKyotakuBottom(){
  const div = document.createElement("div");
  div.className = "info-box";
  div.id = "gameKyotakuBottom";
  div.textContent = "供託 " + gameKyotaku;  
  div.classList.add("rotate-180");
  document.getElementById("round-info-bottom").appendChild(div);
}

/* API */
/* ゲーム情報取得リクエスト */
async function sendGetGameStart() {
  const data = { gameId: getGameId() };
  const res = await fetch("/api/start-game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

/* 点数リスト取得リクエスト */
async function sendGetPointList() {
  const res = await fetch("/api/get-pointlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(winInfo)
  });
  return res.json();
}

/* 和了登録リクエスト */
async function sendInsertWins(reach) {
  const params = {reach: reach, winInfos: winInfos};
  const res = await fetch("/api/insert-wins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  return res.json();
}

/* テンパイ登録リクエスト */
async function sendInsertTempai(reach, tempai) {
  const params = {reach: reach, tempai: tempai};
  const res = await fetch("/api/insert-tempai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  return res.json();
}

/* オーラス親アガリ連荘リクエスト */
async function sendNextByParentWin() {
  const res = await fetch("/api/next-parentwin", {
    method: "GET"
  });
  return res.json();
}

/* オーラス親テンパイ連荘リクエスト */
async function sendNextByParentTempai() {
  const res = await fetch("/api/next-parent-tempai", {
    method: "GET"
  });
  return res.json();
}

/* 半荘終了リクエスト */
async function sendEndGame() {
  const res = await fetch("/api/end-game", {
    method: "GET"
  });
  return res.json();
}


/**部品関数 */
/* ゲームIDをURLから取得 */
function getGameId(){
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("gameId");
  if (!gameId) {
    alert("ゲームIDがありません");
    console.error("ゲームID取得失敗", err);
  }else{
    return gameId;
  }
}

function initPlayers(p1, p2, p3, p4) {
  players.length = 0;
  players.push({wind: 0, name: p1, point: DEFAULT_POINT, position: TOP, reach: false});
  players.push({wind: 1, name: p2, point: DEFAULT_POINT, position: LEFT, reach: false});
  players.push({wind: 2, name: p3, point: DEFAULT_POINT, position: BOTTOM, reach: false});
  players.push({wind: 3, name: p4, point: DEFAULT_POINT, position: RIGHT, reach: false});
  updatePlayerLabel();
}

// 場風をid取得
function getWindTextById(id){
  return WIND.find((w) => w.id === id).text;
}

// 位置からplayerを取得
function getPlayerByPosition(position){
  return players.find((p) => p.position === position);
}

// 場風からplayerを取得
function getPlayerByWind(wind){
  return players.find((p) => p.wind === wind);
}

function updatePlayerLabel(){
  // 上
  const infoPlayerTop = getPlayerByPosition(TOP);
  playerTop.querySelector(".wind").textContent = getWindTextById(infoPlayerTop.wind);
  playerTop.querySelector(".name").textContent = infoPlayerTop.name;
  playerTop.querySelector(".score").textContent = infoPlayerTop.point;
  // 左
  const infoPlayerLeft = getPlayerByPosition(LEFT);
  playerLeft.querySelector(".wind").textContent = getWindTextById(infoPlayerLeft.wind);
  playerLeft.querySelector(".name").textContent = infoPlayerLeft.name;
  playerLeft.querySelector(".score").textContent = infoPlayerLeft.point;
  // 下
  const infoPlayerBottom = getPlayerByPosition(BOTTOM);
  playerBottom.querySelector(".wind").textContent = getWindTextById(infoPlayerBottom.wind);
  playerBottom.querySelector(".name").textContent = infoPlayerBottom.name;
  playerBottom.querySelector(".score").textContent = infoPlayerBottom.point;
  // 右
  const infoPlayerRight = getPlayerByPosition(RIGHT);
  playerRight.querySelector(".wind").textContent = getWindTextById(infoPlayerRight.wind);
  playerRight.querySelector(".name").textContent = infoPlayerRight.name;
  playerRight.querySelector(".score").textContent = infoPlayerRight.point;

}

/* ===== モーダル表示 ===== */
function showModal(title, contentBuilder) {
  modalTitle.textContent = title;
  modalContent.innerHTML = "";
  contentBuilder();
  modalOverlay.classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  // 作成中の全アガリ情報をクリア
  winInfos = [];
  winInfo = {};
}

// 立直情報をリセット
function resetReach(){
  document.querySelectorAll('[data-score]').forEach(score => {
    players.forEach(p => {
      p.reach = false;
    })
    // 色を戻す
    score.classList.remove('active');
  })
}

/* ===== 和了者 ===== */
function showWinnerSelect() {
  showModal("和了者を選択", () => {
    // プレイヤーを東からソート 
    sortPlayersByWind();
    let winPlayers = players;
    if(winInfos.length > 0){
      // 登録済みの和了があるならばその和了者は表示しない
      winInfos.forEach(w => {
        winPlayers = winPlayers.filter(p => p.wind !== w.winnerWind);
      });
      // 放銃者も表示しない
      winPlayers = winPlayers.filter(p => p.wind !== winInfos[0].loserWind);
    }
    winPlayers.forEach(p => {
      const div = document.createElement("div");
      div.className = "score-list-item";
      const text =  `${getWindTextById(p.wind)} : ${p.name}`;
      div.textContent = text;
      div.onmouseover = () => {
        div.style.backgroundColor = 'rgba(255,255,255,0.5)';
      };
      div.onclick = () => {
        div.disabled = true;
        winInfo = {};
        winInfo.winnerWind = p.wind;
        showLoserSelect();
      };
      modalContent.appendChild(div);
    });
  });
}

/* ===== 放銃者 ===== */
function showLoserSelect() {
  showModal("放銃者を選択", () => {
    let losePlayers =[];
    if(winInfos.length > 0){
      // 登録済みの和了があるならば放銃者は同じ一人
      losePlayers.push(players.find(p => p.wind === winInfos[0].loserWind));
    }else{
      // 登録済みの和了がないなら、放銃者は和了者以外を表示
      losePlayers = players.filter(p => p.wind !== winInfo.winnerWind);
      // ツモの選択肢を追加
      const tsumo = document.createElement("div");
      tsumo.className = "score-list-item";
      tsumo.classList.add("green");
      tsumo.textContent = "ツモ";
      tsumo.onclick = () => {
        winInfo.loserWind = TSUMO_ID;
        showHanSelect();
      };
      modalContent.appendChild(tsumo);
    }
    losePlayers.forEach(p => {
      const div = document.createElement("div");
      div.className = "score-list-item";
      const text =  `${getWindTextById(p.wind)} : ${p.name}`;
      div.textContent = text;
      div.onclick = () => {
        winInfo.loserWind = p.wind;
        showHanSelect();
      };
      modalContent.appendChild(div);
    });
  });
}

/* ===== 翻数 ===== */
function showHanSelect() {
  showModal("翻数を選択", async () => {
    // 点数リスト取得
    const res = await sendGetPointList();
    let hanList = res.list;
    [
      {id: 1, text: "1翻"},
      {id: 2, text: "2翻"},
      {id: 3, text: "3翻"},
      {id: 4, text: "4翻"},
      {id: 5, text: "満貫"},
      {id: 6, text: "跳満"},
      {id: 7, text: "倍満"},
      {id: 8, text: "三倍満"},
      {id: 9, text: "役満"},
      {id: 10, text: "W役満"}
    ]
    .forEach(h => {
      const div = document.createElement("div");
      div.classList.add("score-list-item");
      div.classList.add("thin");
      const row = hanList.find((item) => item.han === h.id);
      if(h.id < 5){
        // 満貫未満
        div.textContent = h.text;
      }else{
        // 満貫以上
        div.innerHTML = `
          <div>${h.text}</div>
          <span>${createPointText(row)}</span>
        `;
      }
      div.onclick = () => {
        winInfo.han = h.id;
        if(h.id < 5){
          showFuSelect();
        }else{
          winInfo.fu = 0;
          winInfo.point1 = row.point1;
          winInfo.point2 = row.point2;
          winInfos.push(winInfo);
          showConfirm();
        }
      };
      modalContent.appendChild(div);
    });
  });
}

/* ===== 符数（点数付き） ===== */
function showFuSelect() {
  showModal("符数を選択", async () => {
    // 点数リスト取得
    const res = await sendGetPointList();
    let fuList = res.list;
    fuList.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("score-list-item");
      div.classList.add("thin");
      div.innerHTML = `
        <div>${winInfo.han}翻${item.fu}符</div>
        <span>${createPointText(item)}</span>
      `;
      div.onclick = () => {
        winInfo.fu = item.fu;
        winInfo.point1 = item.point1;
        winInfo.point2 = item.point2;
        winInfos.push(winInfo);
        showConfirm();
      };
      modalContent.appendChild(div);
    });
  });
}

/* ===== 確認 ===== */
function showConfirm() {
  showModal("確認", () => {
    winInfos.forEach(wi => {
      const div = document.createElement("div");
      div.className = "score-list-label";
      let text = ``;
      let winPoint = 0;
      let losePoint; 
      if(wi.loserWind === TSUMO_ID){
        // ツモの場合　和了者以外の3行を作成
        players.filter(p => p.wind !== wi.winnerWind).forEach(p => {
          if(wi.winnerWind === 0){
            // 親のツモの場合
            losePoint = wi.point1;
          }else{
            // 子のツモの場合
            // 親はpoint2、子はpoint1
            losePoint = p.wind === 0 ? wi.point2 : wi.point1;
          }
          losePoint = addHomba(losePoint, wi.loserWind);
          text += `${getWindTextById(p.wind)} ${p.name} -${losePoint}<br>`;
          // 失点合計を加算
          winPoint += losePoint;
        });
        // 和了者の1行を作成
        text += `→ ${getWindTextById(wi.winnerWind)} ${getPlayerByWind(wi.winnerWind).name} +${addKyotaku(winPoint)}`;
      }else{
        // ロンの場合
        losePoint = addHomba(wi.point1, wi.loserWind);
        winPoint = addKyotaku(losePoint);
        text = `${getWindTextById(wi.loserWind)} ${getPlayerByWind(wi.loserWind).name} -${losePoint}<br>
                → ${getWindTextById(wi.winnerWind)} ${getPlayerByWind(wi.winnerWind).name} +${winPoint}`;
      }
      div.innerHTML = text;
      modalContent.appendChild(div);
    });
    const confirmBtn = document.createElement("div");
    confirmBtn.className = "score-list-item";
    confirmBtn.textContent = "完了";
    confirmBtn.style.backgroundColor = 'rgba(255,255,255,0.4)';
    confirmBtn.onclick = async () => {
      confirmBtn.setAttribute("disabled", true);
      // 立直情報をセット
      const reach = {};
      reach.east = getPlayerByWind(0).reach;
      reach.south = getPlayerByWind(1).reach;
      reach.west = getPlayerByWind(2).reach;
      reach.north = getPlayerByWind(3).reach;
      console.log(reach);
      console.log(winInfos);
      // 和了情報を送信
      const res = await sendInsertWins(reach);
      // 半荘終了判断
      if(res.kyokuEndStatus === 0){
        // 次局情報で表示更新
        console.log(res.next);
        updateToNext(res.next);
        resetReach();
        closeModal();
      } else {
        // 局終了確認モーダル表示
        showEndConfirmModal(res.kyokuEndStatus, 0);
      }
    };
    modalContent.appendChild(confirmBtn);

    if(winInfos.length < 3 && winInfos.filter(w => w.loserWind === TSUMO_ID).length === 0){
      //  登録済みの和了が、3つ未満かつすべてロン上がりの場合、和了追加ボタンあり
      const addWinBtn = document.createElement("div");
      addWinBtn.className = "score-list-item";
      addWinBtn.textContent = "他の和了を追加";
      addWinBtn.style.backgroundColor = 'rgba(255,255,255,0.4)';
      addWinBtn.onclick = () => {
        showWinnerSelect();
      };
      modalContent.appendChild(addWinBtn);
    }

  });
}

/* ===== テンパイ者 ===== */ 
function showTempaiSelect() {
  showModal("テンパイ者を選択", () => {
    const tempais =[{wind: 0, tempai: false}, {wind: 1, tempai: false}, {wind: 2, tempai: false}, {wind: 3, tempai: false}];
    // プレイヤーを東からソート 
    sortPlayersByWind();
    players.forEach(p => {
      const div = document.createElement("div");
      div.className = "score-list-item";
      const text =  `${getWindTextById(p.wind)} : ${p.name}`;
      div.textContent = text;
      const tempai = tempais.find(t => t.wind === p.wind);
      if(p.reach){
        // 立直者ははじめから緑色でクリック不可
        tempai.tempai = true;
        div.classList.add("green");
      }else{
        div.onclick = () => {
          tempai.tempai = !tempai.tempai;
          // 色
          if(div.classList.contains("green")){
            div.classList.remove("green");
          }else{
            div.classList.add("green");
          }
        };
      }
      modalContent.appendChild(div);
    });

    const completeBtn = document.createElement("div");
    completeBtn.className = "score-list-item";
    const text =  "完了";
    completeBtn.textContent = text;
    completeBtn.classList.add("light-blue");
    completeBtn.onclick = async () => {
      // 立直情報をセット
      const reach = {};
      reach.east = getPlayerByWind(0).reach;
      reach.south = getPlayerByWind(1).reach;
      reach.west = getPlayerByWind(2).reach;
      reach.north = getPlayerByWind(3).reach;
      // テンパイ情報を送信
      const res = await sendInsertTempai(reach, tempais);
      // 半荘終了判断
      if(res.kyokuEndStatus === 0){// ここで連荘のときも0ではなくなっている
        // 次局情報で表示更新
        console.log(res.next);
        updateToNext(res.next);
        resetReach();
        closeModal();
      } else {
        // 局終了確認モーダル表示
        showEndConfirmModal(res.kyokuEndStatus, 1);
      }

    };
    modalContent.appendChild(completeBtn);
  });
}


// 東南西北で並ぶようにソート
function sortPlayersByWind(){
  return players.sort((a, b) => {
    return a.wind - b.wind;
  });
}

function createPointText(row){
    if(winInfo.loserWind === TSUMO_ID){
      if(winInfo.winnerWind === 0){
        // 親ツモ
        return `${row.point1}点オール`;
      }else{
        // 子ツモ
        return `${row.point1}点 - ${row.point2}点`;
      }
    }else{
      // ロン
      return `${row.point1}点`;
    }
}

function addHomba(point, loserWind){
  let plus;
  if(loserWind === TSUMO_ID){
    plus = 100;
  }else{
    plus = 300;
  }
  return point += gameHomba * plus;
}

function addKyotaku(point){
  return point += gameKyotaku * 1000;
}

// function minusReach(point, wind){
//   let ret = point;
//   if(players.find(p => p.wind === wind).reach){
//     ret = point -= 1000;
//   }
//   return ret;
// }

function updateToNext({gameId, wind, kyoku, homba, kyotaku, east_point, south_point, west_point, north_point}){
  if(gameKyoku === kyoku){
    // 旧局=最新局ならば連荘
    getPlayerByWind(0).point = east_point;
    getPlayerByWind(1).point = south_point;
    getPlayerByWind(2).point = west_point;
    getPlayerByWind(3).point = north_point;
  }else{
    // 旧局!=最新局ならば循環、ポイント更新
    const oldEastPlayer = getPlayerByWind(0);
    const oldSouthPlayer = getPlayerByWind(1);
    const oldWestPlayer = getPlayerByWind(2);
    const oldNorthPlayer = getPlayerByWind(3);
    oldEastPlayer.wind = 3;
    oldEastPlayer.point = north_point;
    oldSouthPlayer.wind = 0;
    oldSouthPlayer.point = east_point;
    oldWestPlayer.wind = 1;
    oldWestPlayer.point = south_point;
    oldNorthPlayer.wind = 2;
    oldNorthPlayer.point = west_point;
  }

  gameWind = wind;
  gameKyoku = kyoku;
  gameHomba = homba;
  gameKyotaku = kyotaku;

  // 表示更新
  updatePlayerLabel();
  updateGameInfo();
}

function updateGameInfo(){
  let gameWindTop = document.getElementById("gameWindTop");
  gameWindTop.textContent = getWindTextById(gameWind) + gameKyoku + "局";
  let gameWindBottom = document.getElementById("gameWindBottom");
  gameWindBottom.textContent = getWindTextById(gameWind) + gameKyoku + "局";

  let gameHombaTop = document.getElementById("gameHombaTop");
  gameHombaTop.textContent = gameHomba + "本場";
  let gameHombaBottom = document.getElementById("gameHombaBottom");
  gameHombaBottom.textContent = gameHomba + "本場";

  let gameKyotakuTop = document.getElementById("gameKyotakuTop");
  gameKyotakuTop.textContent = "供託 " + gameKyotaku;
  let gameKyotakuBottom = document.getElementById("gameKyotakuBottom");
  gameKyotakuBottom.textContent = "供託 " + gameKyotaku;
}

// 半荘終了確認モーダル表示
function showEndConfirmModal(kyokuEndStatus, isByTempai){
  let title;
  if(kyokuEndStatus === 1){
    title = "半荘を終了します";
  }else if(kyokuEndStatus === 2){
     title = "半荘を終了しますか？";
  } else if(kyokuEndStatus === 3){
    title = "半荘をトビ終了します";
  }
  showModal(title, () => {
    if(kyokuEndStatus === 2){
      // 2の場合は連荘用の選択肢
      const continueBtn = document.createElement("div");
      continueBtn.className = "score-list-item";
      continueBtn.textContent = "続ける";
      continueBtn.style.backgroundColor = 'rgba(255,255,255,0.4)';
      continueBtn.onclick = async () => {
        // 次の局へ進むAPI呼び出す
        let res;
        if(isByTempai){
          res = await sendNextByParentTempai();
        }else{
          res = await sendNextByParentWin();
        }
        // 次局情報で表示更新
        console.log(res.next);
        updateToNext(res.next);
        resetReach();
        closeModal();
      }
      modalContent.appendChild(continueBtn);
    }
    const confirmBtn = document.createElement("div");
    confirmBtn.className = "score-list-item";
    confirmBtn.textContent = "終了する";
    confirmBtn.style.backgroundColor = 'rgba(255,255,255,0.4)';
    confirmBtn.onclick = async () => {
      // 終了API呼び出す
      const res = await sendEndGame();
      // 結果表示画面へ遷移
      console.log(res.next);
      window.location.href = 'result.html';

    }
    modalContent.appendChild(confirmBtn);
  })
}

/**ボタン等押下処理 */
/* ポイント表示押下処理 */
document.querySelectorAll('[data-score]').forEach(score => {
  score.addEventListener('click', () => {
    // 誰かが差分表示中なら処理なし
    if(isDisplayDiff) {
      return;
    }
    // players更新
    const position = score.id.substring(6);
    const player = players.find(p => p.position === position);
    // 1000点未満だと立直できない
    if(player.point < 1000){
      return;
    }
    let afterButton;
    if(!score.classList.contains('active')){
      // 立直前→立直済
      // 赤くする
      score.classList.add('active');
      // 数字表示変更
      afterButton = player.point - 1000;
      // 供託増やす
      gameKyotaku += 1;
      // 立直フラグ
      player.reach = true;
      // 表示更新
      updateGameKyotaku();
    } else {
      // 供託が0のときはおかしいので処理なしで戻るようにする
      if(gameKyotaku === 0) {
        return;
      }
      // 立直済→立直前
      // 色も戻す
      score.classList.remove('active');
      // 数字表示変更
      afterButton = player.point + 1000;
      // 供託減らす
      gameKyotaku -= 1;
      // 立直フラグ
      player.reach = false;
      // 表示更新
      updateGameKyotaku();
    }
    // ポイント表示更新
    score.textContent = afterButton;
    // players更新
    player.point = afterButton;
  });
});

function updateGameKyotaku(){
  gameKyotakuTop = document.getElementById("gameKyotakuTop");
  gameKyotakuTop.textContent = "供託 " + gameKyotaku;
  gameKyotakuBottom = document.getElementById("gameKyotakuBottom");
  gameKyotakuBottom.textContent = "供託 " + gameKyotaku;
}

/* 差ボタン押下処理 */
document.querySelectorAll('[diff-btn]').forEach(btn => {
  btn.addEventListener('click', () => {
    if(!btn.classList.contains('active')){
      // ポイント表示→差表示
      // 既に他の誰かが差分表示中なら処理なし
      if(isDisplayDiff) {
        return;
      }
      // ボタン色変更
      btn.classList.add('active');
      // ボタンのIDの位置文字列から自分のplayer情報を取得を取得
      let position = btn.id.substring(9);
      const myself = players.find((player) => player.position === position);

      players.forEach(player => {
        if(btn.id.includes(player.position)){
          // 自分のポイント表示はそのまま
        } else{
          // 他プレイヤーの表示は差にする
          const diff = (player.point - myself.point).toString();
          const otherPlayerScore = document.getElementById("score-" + player.position);
          otherPlayerScore.textContent = diff > 0 ? "+" + diff : diff;
          otherPlayerScore.classList.add('diff');
        }
      });
      isDisplayDiff = true;
    } else {
      // 差表示→ポイント表示
      // ボタン色変更
      btn.classList.remove('active');
      
      players.forEach(player => {
        // 表示をポイントにする
        const playerScore = document.getElementById("score-" + player.position);
        playerScore.textContent = player.point;
        playerScore.classList.remove('diff');
      });
      isDisplayDiff = false;
    }
  });
});

/* ===== 和了ボタン ===== */
winBtn.addEventListener("click", () => {
  if(isDisplayDiff){
    return;
  }
  // 一時的な全アガリをクリア
  winInfos = [];// モーダル閉じたときでもいいかも
  // 和了者モーダル表示
  showWinnerSelect();
});

/* ===== 流局ボタン ===== */
ryukyokuBtn.addEventListener("click", () => {
  if(isDisplayDiff){
    return;
  }
  // テンパイ者モーダル表示
  showTempaiSelect();
});


/* モーダル閉じるボタン */
modalCloseBtn.addEventListener("click", () => {
  closeModal();
});


// 4 ブラウザ更新表示の対応 そのまま局表示し続けられるか

// 1 南4局終了で、結果画面へ遷移し結果をポイント表示 できた

// 3 ホーム画面の後
//   続きのゲームボタン（途中のゲームを最新から3~5件表示し選択できる画面へ遷移）
//   or新ゲームボタン（setting画面へ遷移でよい？）

// 2 途中トビ終了でも結果画面へ できた

// のち追加機能
//   返し点設定可能
//   アガリやめ何着まで設定可能
//   テンパイやめありなし