const express = require("express");
const router = express.Router();
const { insertGame, getPlayerByGameId, getPointList, insertResult, updateGameStatus, getResult} = require("../db/query");

const TSUMO_ID = 9;
let gameInfo = {};
function initGame(id){
  gameInfo.gameId = id;
  gameInfo.wind = 0;
  gameInfo.kyoku = 1;
  gameInfo.homba = 0;
  gameInfo.kyotaku = 0;
}

let calcInfo = {};
function initCalcInfo(row){
  calcInfo.uma1 = row.uma1;
  calcInfo.uma2 = row.uma2;
  calcInfo.west_in = row.west_in;
  calcInfo.tobi = row.tobi;
}

const DEFAULT_POINT = 25000;
let players = [];
function initPlayers(row){
  players.length = 0;
  players.push({wind: 0, name: row.player1, point: DEFAULT_POINT, reach: false});
  players.push({wind: 1, name: row.player2, point: DEFAULT_POINT, reach: false});
  players.push({wind: 2, name: row.player3, point: DEFAULT_POINT, reach: false});
  players.push({wind: 3, name: row.player4, point: DEFAULT_POINT, reach: false});
}
let simulate_players = [];
let simulate_kyotaku = 0;
let tempWinInfos = [];
let tempTempaiInfos = [];
let tobiInfo = {};
function initTobiInfo(){
  tobiInfo = {get: undefined, player: ""};
}
function isTobi(){
  return tobiInfo.get !== undefined;
}

router.post("/insert-game", async (req, res) => {
  try {
    const gameId = await insertGame(req.body);
    const { players, uma, westIn, tobi } = req.body;
    console.log('=== insert-game ===');
    console.log(players);
    console.log(uma, westIn, tobi);
    res.json({ success: true, gameId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/start-game", async (req, res) => {
  try {
    const gameId = req.body.gameId;
    const row = await getPlayerByGameId(gameId);
    // ゲーム情報プレイヤー情報精算情報をセット
    initGame(gameId);
    initPlayers(row);
    initCalcInfo(row);
    console.log('=== start-game ===');
    for (const [key, value] of Object.entries(row)){
      console.log(`${key} = ${value}`);
    }
    // insert処理
    const arg = createInsertArg(0);
    await insertResult(arg);

    // game.statusを更新
    await updateGameStatus(gameId, 1);

    res.json({ success: true, row: row });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/get-pointlist", async (req, res) => {
  try {
    let isParent = req.body.winnerWind !== 0 ? 0 : 1;
    let isTsumo = req.body.loserWind !== TSUMO_ID ? 0 : 1;
    let list;
    if(req.body.han === undefined){
      // 翻決定前 符指定なし
      list = await getPointList(isParent, isTsumo);
    }else{
      // 翻決定後 符指定あり
      list = await getPointList(isParent, isTsumo, req.body.han);
    }
    res.json({ success: true, list: list });
    console.log('=== get-pointlist ===');
    // for (const a of list){
    //   console.log(`${a.point1} : ${a.point2}`);
    // }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

/**和了を登録 */
router.post("/insert-wins", async (req, res) => {
  try {
    // ソート
    const winInfos = sortWinInfos(req.body.winInfos);
    const reach = req.body.reach;

    // 点数移動計算を仮想で行う
    simulatePointsByWin(reach, winInfos);

    // ゲーム終了確認
    const kyokuEndStatus = getKyokuEndStatusByWin(winInfos);
    console.log("kyokuEndStatus", kyokuEndStatus);

    if(kyokuEndStatus === 0){
      // 仮想計算結果を反映
      players = structuredClone(simulate_players);
      gameInfo.kyotaku = simulate_kyotaku;

      // 次の局に進める
      updateToNextByWin(winInfos);

      // insert処理
      const arg = createInsertArg(0);
      await insertResult(arg);
      console.log('=== insert-result ===');

      // レスポンス
      res.json({ success: true, kyokuEndStatus: kyokuEndStatus, next: arg });

    }else {
      // 1 終了します。はいモーダル
      // 2 終了しますか？はいいいえモーダル
      // どちらかを表示する
      // コピー保存する
      tempWinInfos.length = 0;
      winInfos.forEach(wi => {
        tempWinInfos.push(wi);
      } );
      console.log('=== disp-confirm-modal ===');
      // レスポンス
      res.json({ success: true, kyokuEndStatus: kyokuEndStatus});

    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

/**流局を登録 */
router.post("/insert-tempai", async (req, res) => {
  const tempai = req.body.tempai;
  const reach = req.body.reach;

  // 点数移動計算を仮想で行う
  simulatePointsByTempai(reach, tempai);

  // ゲーム終了確認　着手中 終局確認一度レスポンス返す
  const kyokuEndStatus = getKyokuEndStatusByTempai(tempai);// 親2着以上の時2で返せていない TODO
  console.log("kyokuEndStatus", kyokuEndStatus);

  if(kyokuEndStatus === 0){
    // 仮想計算結果を反映
    players = structuredClone(simulate_players);
    gameInfo.kyotaku = simulate_kyotaku;

    // 次の局に進める
    updateToNextByTempai(tempai);

    // insert処理
    const arg = createInsertArg(0);
    await insertResult(arg);
    console.log('=== insert-result tempai ===');
    // レスポンス
    res.json({ success: true, kyokuEndStatus: kyokuEndStatus, next: arg });
  }else {
    // 1 終了します。はいモーダル
    // 2 終了しますか？はいいいえモーダル
    // どちらかを表示する
    // コピー保存する
    tempTempaiInfos.length = 0;
    tempai.forEach(t => {
      tempTempaiInfos.push(t);
    } );
    console.log('=== disp-confirm-modal ===');
    // レスポンス
    res.json({ success: true, kyokuEndStatus: kyokuEndStatus});

  }

});

/**オーラスの親アガリ連荘を登録 */
router.get("/next-parentwin", async (req, res) => {
  // 仮想計算結果を反映
  players = structuredClone(simulate_players);
  gameInfo.kyotaku = simulate_kyotaku;

  // 次の局に進める
  updateToNextByWin(tempWinInfos);

  // insert処理
  const arg = createInsertArg(0);
  await insertResult(arg);
  console.log('=== insert-result next-parentwin ===');

  // レスポンス
  res.json({ success: true, next: arg });

});

/**オーラスの親アガリ連荘を登録 */
router.get("/next-parent-tempai", async (req, res) => {
  // 仮想計算結果を反映
  players = structuredClone(simulate_players);
  gameInfo.kyotaku = simulate_kyotaku;

  // 次の局に進める
  updateToNextByTempai(tempTempaiInfos);

  // insert処理
  const arg = createInsertArg(0);
  await insertResult(arg);
  console.log('=== insert-result next-parent-tempai ===');

  // レスポンス
  res.json({ success: true, next: arg });

});

/**半荘終了を登録 */
router.get("/end-game", async (req, res) => {
  // 仮想計算結果を反映
  players = structuredClone(simulate_players);
  gameInfo.kyotaku = simulate_kyotaku;

  // insert処理
  const arg = createInsertArg(1);
  await insertResult(arg);

  // game.statusを更新
  await updateGameStatus(gameInfo.gameId, 2);

  console.log('=== insert-result game-end ===');
  // レスポンス
  res.json({ success: true, next: arg});

});

/**結果を取得 */
router.get("/get-result", async (req, res) => {
  // 結果取得
  const row = await getResult();

  // レスポンス内容
  const arg = [{col: 1}, {col: 2}, {col: 3}, {col :4}];
  // 名前
  arg[0].name = row.player1;
  arg[1].name = row.player2;
  arg[2].name = row.player3;
  arg[3].name = row.player4;
  // 持ち点
  const realPoint = [];
  realPoint.push(row.east_point);
  realPoint.push(row.south_point);
  realPoint.push(row.west_point);
  realPoint.push(row.north_point);
  // windも保存しておく
  const wind = [0, 1, 2, 3];
  // 局からプレイヤー名と並びを合わせる 1:0123 2:3012 3:2301 4:1230 
  for(let i = 0; i < row.kyoku - 1; i++){
    // 先頭を末尾に移動
    realPoint.unshift(realPoint.pop());
    wind.unshift(wind.pop());
  }
  for(let i = 0; i < arg.length; i++){
    arg[i].realPoint = realPoint[i];
    arg[i].wind = wind[i];
  }
  // 順位
  const map = new Map(arg.map(a => [a.col, a]));
  [...arg].sort((a, b) => {
    if (b.realPoint !== a.realPoint) {
      return b.realPoint - a.realPoint;
    }
    return a.col - b.col;
  })
  .forEach((player, index) => {
    player.rank = index + 1;
  });
  // 供託はトップどり
  if(row.kyotaku !== 0){
    arg.find(a => a.rank === 1).realPoint += row.kyotaku * 1000;
  }
  // トビ
  if(row.tobi_get !== null && row.tobi_player !== null){
    arg.forEach(a => {
      if(row.tobi_player.includes(String(a.wind))){
        a.tobi = -10;
      }else if(row.tobi_get === a.wind){
        a.tobi = 10 * row.tobi_player.length;
      }else{
        a.tobi = 0;
      }
    });
  }
  // 素点/オカ/ウマ/結果
  arg.forEach(a => {
    a.point = (a.realPoint - 30000) / 1000;
    if(a.rank === 1){
      a.uma = row.uma2;
      a.oka = 20;
    }else if(a.rank === 2){
      a.uma = row.uma1;
      a.oka = 0;
    }else if(a.rank === 3){
      a.uma = row.uma1 * -1;
      a.oka = 0;
    }else if(a.rank === 4){
      a.uma = row.uma2 * -1;
      a.oka = 0;
    }
    a.total = a.point + a.uma + a.oka;
    if(row.tobi_get !== null && row.tobi_player !== null){
      a.total += a.tobi;
    }
  });

  arg.forEach(a => {
    console.log(a);
  })
  // トータルチェック
  let allTotal = 0;
  arg.forEach(a => {allTotal += a.total});
  if(allTotal !== 0) {
    console.error("結果トータルが0でない");
    throw Error(allTotal);
  }
  
  console.log('=== get-result ===');
  // レスポンス
  res.json({ success: true, result: arg });

});



// 放銃者の下家から並ぶようにソート
function sortWinInfos(wins){
  return wins.sort((a, b) => {
    const orderA = (a.winnerWind - a.loserWind + 4) % 4;
    const orderB = (b.winnerWind - b.loserWind + 4) % 4;
    return orderA - orderB;
  });
}

function addHomba(point, loserWind){
  let plus;
  if(loserWind === TSUMO_ID){
    plus = 100;
  }else{
    plus = 300;
  }
  return point += gameInfo.homba * plus;
}

function addSimulateKyotaku(point){
  return point += simulate_kyotaku * 1000;
}

// 東南西北で並ぶようにソート
function sortPlayersByWind(){
  return players.sort((a, b) => {
    return a.wind - b.wind;
  });
}

// 場風からplayerを取得
function getPlayerByWind(wind){
  return players.find((p) => p.wind === wind);
}

function checkTotalPoints(){
  let total = 0;
  simulate_players.forEach(p => {
    total += p.point;
  })
  total += simulate_kyotaku * 1000;
  if(total !== 100000){
    console.error("点数合計不正");
    throw Error(total);
  }
}

function createInsertArg(end){
    const arg = {};
    arg.gameId = gameInfo.gameId;
    arg.wind = gameInfo.wind;
    arg.kyoku = gameInfo.kyoku;
    arg.homba = gameInfo.homba;
    arg.kyotaku = gameInfo.kyotaku;
    arg.end = end;
    arg.east_point = getPlayerByWind(0).point;
    arg.south_point = getPlayerByWind(1).point;
    arg.west_point = getPlayerByWind(2).point;
    arg.north_point = getPlayerByWind(3).point;
    if(isTobi()){
      arg.tobi_player = tobiInfo.player;
      arg.tobi_get = tobiInfo.get;
    }else{
      arg.tobi_player = null;
      arg.tobi_get = null;      
    }
    return arg;
}

/** 和了による点数移動を仮想で計算 */
function simulatePointsByWin(reach, winInfos){
  simulate_players = structuredClone(players);

  simulate_kyotaku = gameInfo.kyotaku;
  // 立直棒の計算
  if(reach.east){
    simulate_players.find((p) => p.wind === 0).point -= 1000;
    simulate_kyotaku ++;
  }
  if(reach.south){
    simulate_players.find((p) => p.wind === 1).point -= 1000;
    simulate_kyotaku ++;
  }
  if(reach.west){
    simulate_players.find((p) => p.wind === 2).point -= 1000;
    simulate_kyotaku ++;
  }
  if(reach.north){
    simulate_players.find((p) => p.wind === 3).point -= 1000;
    simulate_kyotaku ++;
  }
  console.log("立直棒計算");
  for (const a of simulate_players){
    console.log(`${a.point}`);
  }

  // 点数移動の計算
  console.log(winInfos);
  // 本場供託を得るフラグ
  let isGetHombaKyotaku = true;

  // トビを得るフラグ
  let isGetTobi = true;
  // トビ情報初期化  
  initTobiInfo();

  for (const win of winInfos) {
    // 和了情報を処理
    const { winnerWind, loserWind, han, fu, point1, point2 } = win;
    const winPlayer = simulate_players.find(w => w.wind === winnerWind);
    console.log(winPlayer);
    if(loserWind !== TSUMO_ID){
      // ロンの場合
      const losePlayer = simulate_players.find(w => w.wind === loserWind);
      const includeHomba = addHomba(point1, loserWind);
      losePlayer.point -= includeHomba;
      if(isGetHombaKyotaku){
        // 放銃者の下家一人だけが本場を得る
        winPlayer.point += includeHomba;
      }else{
        // 二人目以降は本場なし
        winPlayer.point += point1;
      }
      // 放銃者が持ち点マイナスになる和了の1つ目であればトビ
      if(losePlayer.point < 0 && isGetTobi){
        isGetTobi = false;
        tobiInfo.get = winnerWind;
        tobiInfo.player = String(loserWind);
      }
    } else{
      // ツモの場合
      let losePoint = 0;
      let winPoint = 0;
      // 和了者以外の点数減らす
      simulate_players.filter(p => p.wind !== winnerWind).forEach(p => {
        if(winnerWind === 0){
          // 親ツモ
          losePoint = point1;
        }else{
          // 子のツモの場合
          // 親はpoint2、子はpoint1
          losePoint = p.wind === 0 ? point2 : point1;
        }
        losePoint = addHomba(losePoint, loserWind);
        p.point -= losePoint;
        winPoint += losePoint;
        
        // ツモられた人でマイナスの人がいればトビ
        if(p.point < 0){
          tobiInfo.get = winnerWind;
          tobiInfo.player += String(loserWind);
        }
      });
      // 和了者の点数増やす
      winPlayer.point += winPoint;
    }
    // 供託追加
    if(isGetHombaKyotaku){
      // 放銃者の下家一人だけが供託を得る
      winPlayer.point = addSimulateKyotaku(winPlayer.point);
      simulate_kyotaku = 0;
      // 二人目以降は供託なし
      isGetHombaKyotaku = false;
    }
    console.log("和了情報");
    console.log(win);
  }
  console.log("立直情報");
  console.log(reach);
  console.log("点数移動完了")
  for (const a of simulate_players){
    console.log(`${a.point}`);
  }

  // 合計点10万点チェック
  checkTotalPoints();
 
}

/** 流局による点数移動を仮想で計算 */
function simulatePointsByTempai(reach, tempai){
  simulate_players = structuredClone(players);

  simulate_kyotaku = gameInfo.kyotaku;
  // 立直棒の計算
  if(reach.east){
    simulate_players.find((p) => p.wind === 0).point -= 1000;
    simulate_kyotaku ++;
  }
  if(reach.south){
    simulate_players.find((p) => p.wind === 1).point -= 1000;
    simulate_kyotaku ++;
  }
  if(reach.west){
    simulate_players.find((p) => p.wind === 2).point -= 1000;
    simulate_kyotaku ++;
  }
  if(reach.north){
    simulate_players.find((p) => p.wind === 3).point -= 1000;
    simulate_kyotaku ++;
  }
  console.log("立直棒計算");
  for (const a of simulate_players){
    console.log(`${a.point}`);
  }

  // テンパイ状況による点数移動
  const tempaiOnly = tempai.filter(t => t.tempai === true);
  const NOTtempai = tempai.filter(t => t.tempai === false);
  const tempaiTotal = tempaiOnly.length;
  if(tempaiTotal === 0 || tempaiTotal === 4){
    // 全員テンパイorノーテンなら点数そのまま
  }else if(tempaiTotal > 0 && tempaiTotal < 4){
    // 1~3人テンパイなら、3000/ノーテン人数を移動
    const PENALTY = 3000;
    NOTtempai.forEach(t => {
      // getPlayerByWind(t.wind).point -= penalty;
      simulate_players.find(p => p.wind === t.wind).point -= PENALTY / NOTtempai.length;
    });
    tempaiOnly.forEach(t => {
      // getPlayerByWind(t.wind).point += penalty * NOTtempai.length / tempaiOnly.length;
      simulate_players.find(p => p.wind === t.wind).point += PENALTY / tempaiOnly.length;
    });
  }else{
    console.err("テンパイ者不正値");
  }
  console.log("テンパイ情報");
  console.log(tempai);
  console.log("立直情報");
  console.log(reach);
  console.log("点数移動完了")
  for (const a of simulate_players){
    console.log(`${a.point}`);
  }

  // 合計点10万点チェック
  checkTotalPoints();
 
}

/* その局で半荘が終了するかを返す
   0→次の局に進む
   1→終了します。はい。モーダル
   2→終了しますか？はい、いいえ。モーダル
*/
function getKyokuEndStatusByWin(winInfos){
  // tobiInfoがあればトビ終了するので1
  if(isTobi()){
    return 3;
  }
  // 〇4局フラグ
  const isWindLast = gameInfo.wind !== 0 && gameInfo.kyoku === 4;
  if(isWindLast && !isWestIn()){ // 4局かつ西入しない
    if(isParentWin(winInfos)){
      if(isParentCanEndRank()){
        // 親終了可能→終了しますか？はいいいえ
        return 2;
      }else{
        // 親連荘確定→次の局
        return 0;
      }
    }else{
      // 子のアガリ→終了しますはい
      return 1;
    }
  }else{
    // 次の局
    return 0;
  }
}

/* その局で半荘が終了するかを返す
   0→次の局に進む
   1→終了します。はい。モーダル
   2→終了しますか？はい、いいえ。モーダル
*/
function getKyokuEndStatusByTempai(tempais){
  // 〇4局フラグ
  const isWindLast = gameInfo.wind !== 0 && gameInfo.kyoku === 4;
  if(isWindLast && !isWestIn()){ // 4局かつ西入しない
    if(isParentTempai(tempais)){
      if(isParentCanEndRank()){
        // 親終了可能→終了しますか？はいいいえ
        return 2;
      }else{
        // 親連荘確定→次の局
            console.log("BBB");
        return 0;
      }
    }else{
      // 親ノーテン→終了しますはい
      return 1;
    }
  }else{
    // 次の局
    console.log("AAA");
    return 0;
  }
}

// 親のアガリフラグ
function isParentWin(winInfos){
  let isParentWin = false;
  winInfos.forEach(wi => {
    if(wi.winnerWind === 0) {
      isParentWin = true;
    }
  });
  return isParentWin;
}

// 親のテンパイフラグ
function isParentTempai(tempais){
  return tempais.find(t => t.wind === 0).tempai;
}

// 親が2着以上であるか、あがりやめフラグ
function isParentCanEndRank(){
  const parent = simulate_players.find((p) => p.wind === 0);
  let countBeyondParent = 0;
  simulate_players.filter(p => p.wind !== 0).forEach(p => {
    if(parent.point < p.point){
      countBeyondParent ++;
    }
  })
  console.log(countBeyondParent);
  return !(countBeyondParent > 1);
}

// 西入フラグ
function isWestIn(){
  let count = 0;
  simulate_players.forEach(p => {
    if(p.point >= calcInfo.west_in) count ++;
  })
  return count === 0;
}

// アガリで次の局に進める
function updateToNextByWin(winInfos){
  // 風を進める
  let isNOTParentWin = winInfos.filter(wi => wi.winnerWind === 0).length === 0;
  if(gameInfo.kyoku === 4 && isNOTParentWin){
    // ~4局で子のアガリのみがあった場合
    gameInfo.wind += 1;
  }
  // 局を進める
  if(isNOTParentWin){
    // 子のアガリがあった場合
    if(gameInfo.kyoku < 4){
      gameInfo.kyoku += 1;
    }else{
      gameInfo.kyoku = 1;
    }
  }else{
    // 親連荘はそのまま
  }
  // 本場を足す
  if(isNOTParentWin){
    // 子のアガリ
    gameInfo.homba = 0;
  }else{
    // 親の連荘
    gameInfo.homba += 1;
  }
  // 供託を0にする アガリがあるから必ず0
  gameInfo.kyotaku = 0;
  console.log(gameInfo);
  // playersのwind循環
  if(isNOTParentWin){
    players.forEach(p => {
      if(p.wind > 0){
        p.wind -= 1;
      }else{
        p.wind = 3;
      }
    });
  }
}

function updateToNextByTempai(tempais){
  // 次の局に進める
  // 風を進める
  let isNOTParentTempai = !isParentTempai(tempais);
  if(gameInfo.kyoku === 4 && isNOTParentTempai){
    // ~4局で親ノーテンの場合
    gameInfo.wind += 1;
  }
  // 局を進める
  if(isNOTParentTempai){
    // 親ノーテンの場合
    if(gameInfo.kyoku < 4){
      gameInfo.kyoku += 1;
    }else{
      gameInfo.kyoku = 1;
    }
  }else{
    // 親テンパイはそのまま
  }
  // 本場は必ず足す
  gameInfo.homba += 1;
  // 供託はそのまま

  console.log(gameInfo);
  // playersのwind循環
  if(isNOTParentTempai){
    players.forEach(p => {
      if(p.wind > 0){
        p.wind -= 1;
      }else{
        p.wind = 3;
      }
    });
  }

}

module.exports = router;
