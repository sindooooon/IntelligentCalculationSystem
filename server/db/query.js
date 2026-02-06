const db = require("./connection");

/**
 * ゲーム作成
 */
async function insertGame({ players, uma, westIn, tobi}) {
    const sql = `
      INSERT INTO game
      (player1, player2, player3, player4, uma1, uma2, west_in, tobi, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      players[0].name,
      players[1].name,
      players[2].name,
      players[3].name,
      uma[0],
      uma[1],
      westIn,
      tobi,
      0
    ];

    const [result] = await db.query(sql, values);
    return result.insertId;
}

/*
ゲーム情報取得
*/
async function getPlayerByGameId(gameId) {
  const sql = `
    SELECT
      player1,
      player2,
      player3,
      player4,
      uma1,
      uma2,
      west_in,
      tobi
    FROM game
    WHERE id = ?
  `;

  const [rows] = await db.query(sql, [gameId]);
  if (rows.length !== 1) {
    return null;
  }
  return rows[0];
}

/*
ゲームステータス更新
*/
async function updateGameStatus(gameId, status) {
  const sql = `UPDATE game SET status = ? WHERE id = ?`;
  const values = [status, gameId];

  await db.query(sql, values);
}


async function getPointList(isParent, isTsumo, hanId) {
  let sql;
  let values;
  if(hanId === undefined){
    // 翻取得
    sql = `
      SELECT
        han,
        MIN(point1) AS point1,
        MIN(point2) AS point2
      FROM point_list
      WHERE parent = ?
      AND tsumo = ?
      AND han > 4
      GROUP BY han
    `;

    values = [
      isParent,
      isTsumo
    ];

  }else{
    // 符取得
    sql = `
      SELECT
        fu,
        point1,
        point2
      FROM point_list
      WHERE parent = ?
      AND tsumo = ?
      AND han = ?
    `;

    values = [
      isParent,
      isTsumo,
      hanId,
    ];
  }

  const [rows] = await db.query(sql, values);
  return rows;
}

/**
 * 局の結果登録
 */
async function insertResult({gameId, wind, kyoku, homba, kyotaku, end, east_point, south_point, west_point, north_point, tobi_player, tobi_get}) {
    const sql = `
      INSERT INTO kyoku
      (game_id, wind, kyoku, homba, kyotaku, end, east_point, south_point, west_point, north_point, tobi_player, tobi_get)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      gameId,
      wind,
      kyoku,
      homba,
      kyotaku,
      end,
      east_point,
      south_point,
      west_point,
      north_point,
      tobi_player,
      tobi_get
    ];

    const [result] = await db.query(sql, values);
    // console.log("DBresponse");
    // console.log(result);
    return result;
}

/*
結果取得
*/
async function getResult() {
  const sql = `
  SELECT
    player1
    , player2
    , player3
    , player4
    , uma1
    , uma2
    , kyoku
    , kyotaku
    , east_point
    , south_point
    , west_point
    , north_point
    , tobi_player
    , tobi_get
  FROM game 
    INNER JOIN kyoku
    ON id = game_id
  WHERE kyoku.end = 1
  ORDER BY game_id DESC
  LIMIT 1;
  `;

  const [rows] = await db.query(sql);
  if (rows.length !== 1) {
    return null;
  }
  return rows[0];
}


module.exports = {
  insertGame,
  getPlayerByGameId,
  getPointList,
  insertResult,
  updateGameStatus,
  getResult
};
