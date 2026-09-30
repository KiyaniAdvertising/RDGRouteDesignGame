/* ============================================================
 * GAME TRANSACTIONS
 * GameTransactions.gs
 *
 * RD Route Design ACC Universal System
 * Phase 6 — Gaming System
 *
 * FILE #38
 * VERSION: 1.2.0
 * RUNTIME MARKER: RD_GAME_TRANSACTIONS_RUNTIME_1.2.0
 *
 * ============================================================
 * AUTHORITY MODEL
 * ============================================================
 *
 * Database Authority:
 *   Database.gs
 *
 * Currency Authority:
 *   RDEconomyCurrency.gs
 *
 * Wallet Money Authority:
 *   WalletTransactions.gs
 *
 * Wallet Orchestration:
 *   GameWallet.gs
 *
 * Game Transaction Authority:
 *   GameTransactions.gs
 *
 * Game Room Authority:
 *   GameRooms.gs
 *
 * Game Player Authority:
 *   GamePlayers.gs
 *
 * Game Engine Authority:
 *   GameEngine.gs
 *
 * Server / Security Boundary:
 *   RDGServer.gs
 *
 * ============================================================
 * IMPORTANT
 * ============================================================
 *
 * GameTransactions.gs:
 *
 *   - DOES NOT maintain a private database registry
 *   - DOES NOT maintain a duplicate currency registry
 *   - DOES NOT directly mutate WalletAccounts balances
 *   - DOES NOT replace WalletTransactions.gs
 *   - DOES NOT replace GameWallet.gs
 *   - DOES NOT replace GameRooms.gs
 *   - DOES NOT replace GamePlayers.gs
 *
 * It records the gaming financial transaction layer and keeps
 * references to canonical wallet transactions.
 *
 * ============================================================
 */


/* ============================================================
 * 1. CONFIGURATION
 * ============================================================
 */

var GAME_TRANSACTION_CONFIG = {
  VERSION: '1.2.0',

  RUNTIME_MARKER:
    'RD_GAME_TRANSACTIONS_RUNTIME_1.2.0',

  TABLE_KEY:
    'GAME_TRANSACTIONS',

  SHEET_NAME:
    'GameTransactions',

  HEADER_ROW: 3,

  DATA_START_ROW: 4,

  LOCK_TIMEOUT_MS: 30000,

  UNIVERSAL_MAX_PLAYERS: 12,

  UNIVERSAL_PLAYER_POSITIONS: [
    'P1',
    'P2',
    'P3',
    'P4',
    'P5',
    'P6',
    'P7',
    'P8',
    'P9',
    'P10',
    'P11',
    'P12'
  ],

  /* Compatibility alias required by legacy/runtime diagnostics. */
  PLAYER_POSITIONS: [
    'P1','P2','P3','P4','P5','P6',
    'P7','P8','P9','P10','P11','P12'
  ],

  /* Canonical game-specific capacity contract for this module. */
  GAME_CAPACITY: {
    '2048': { minPlayers: 1, maxPlayers: 1 },
    'LUDO': { minPlayers: 2, maxPlayers: 12 },
    'SNAKE': { minPlayers: 1, maxPlayers: 12 },
    'CARROM': { minPlayers: 2, maxPlayers: 4 }
  },

  TRANSACTION_TYPES: [
    'ENTRY_FEE',
    'PRIZE',
    'REFUND',
    'BONUS',
    'REWARD',
    'PENALTY',
    'BET',
    'WIN',
    'LOSS',
    'DRAW',
    'OTHER'
  ],

  STATUSES: [
    'PENDING',
    'COMPLETED',
    'REVERSED',
    'CANCELLED',
    'FAILED'
  ],

  REFERENCE_TYPES: [
    'GAME',
    'GAME_ROOM',
    'GAME_PLAYER',
    'GAME_TRANSACTION',
    'WALLET_TRANSACTION',
    'ENTRY_FEE',
    'PRIZE',
    'REFUND',
    'BONUS',
    'REWARD',
    'BET',
    'WIN',
    'LOSS',
    'DRAW',
    'OTHER'
  ],

  DEFAULT_STATUS:
    'COMPLETED',

  HEADERS: [
    'ID',
    'Game Room ID',
    'Game ID',
    'User ID',
    'Company ID',
    'Game Player ID',
    'Wallet Account ID',
    'Currency Code',
    'Transaction Type',
    'Amount',
    'Balance Before',
    'Balance After',
    'Reference Type',
    'Reference ID',
    'Related Game Transaction ID',
    'Wallet Transaction ID',
    'Description',
    'Status',
    'Transaction Date',
    'Metadata JSON',
    'Created At',
    'Updated At'
  ]
};


/* ============================================================
 * 2. VERSION
 * ============================================================
 */

function getGameTransactionsVersion() {
  return GAME_TRANSACTION_CONFIG.VERSION;
}


/* ============================================================
 * 3. BASIC HELPERS
 * ============================================================
 */

function gameTransactionNow_() {
  return new Date();
}


function gameTransactionText_(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}


function gameTransactionUpper_(value) {
  return gameTransactionText_(value).toUpperCase();
}


function gameTransactionNumber_(value, fallback) {
  var n = Number(value);

  if (isNaN(n)) {
    return fallback === undefined ? 0 : fallback;
  }

  return n;
}


function gameTransactionRound_(value) {
  return Math.round(
    Number(value) * 100000000
  ) / 100000000;
}


function gameTransactionPositive_(value, fieldName) {
  var amount = Number(value);

  if (!isFinite(amount) || amount <= 0) {
    throw new Error(
      (fieldName || 'Amount') +
      ' must be greater than zero.'
    );
  }

  return gameTransactionRound_(amount);
}


function gameTransactionJson_(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '';
  }

  try {
    return JSON.stringify(value);
  } catch (error) {
    throw new Error(
      'Metadata JSON serialization failed: ' +
      error.message
    );
  }
}


function gameTransactionClone_(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    typeof value !== 'object'
  ) {
    return value;
  }

  try {
    return JSON.parse(
      JSON.stringify(value)
    );
  } catch (error) {
    return value;
  }
}


function gameTransactionField_(
  record,
  names
) {
  if (!record) {
    return '';
  }

  for (
    var i = 0;
    i < names.length;
    i++
  ) {
    if (
      record[names[i]] !== undefined &&
      record[names[i]] !== null
    ) {
      return record[names[i]];
    }
  }

  return '';
}


function gameTransactionResult_(
  success,
  data,
  error
) {
  var result = {
    success: !!success,
    version:
      GAME_TRANSACTION_CONFIG.VERSION,
    runtimeMarker:
      GAME_TRANSACTION_CONFIG.RUNTIME_MARKER,
    module:
      'GameTransactions',
    mutationPerformed: false
  };

  if (data !== undefined) {
    result.data = data;
  }

  if (error) {
    result.error =
      error.message ||
      String(error);
  }

  return result;
}


/* ============================================================
 * 4. ENUM VALIDATION
 * ============================================================
 */

function gameTransactionValidateEnum_(
  value,
  list,
  fieldName
) {
  var normalized =
    gameTransactionUpper_(value);

  if (list.indexOf(normalized) === -1) {
    throw new Error(
      'Invalid ' +
      fieldName +
      ': ' +
      value
    );
  }

  return normalized;
}


/* ============================================================
 * 5. DATABASE AUTHORITY
 * ============================================================
 */

function gameTransactionRequireDatabase_() {

  if (
    typeof getDatabaseSheet !==
    'function'
  ) {
    throw new Error(
      'Database.gs getDatabaseSheet() is unavailable.'
    );
  }

  if (
    typeof getRecord !==
    'function'
  ) {
    throw new Error(
      'Database.gs getRecord() is unavailable.'
    );
  }

  if (
    typeof createRecord !==
    'function'
  ) {
    throw new Error(
      'Database.gs createRecord() is unavailable.'
    );
  }

  if (
    typeof updateRecord !==
    'function'
  ) {
    throw new Error(
      'Database.gs updateRecord() is unavailable.'
    );
  }
}


function gameTransactionTableKey_() {
  return GAME_TRANSACTION_CONFIG.TABLE_KEY;
}


/* ============================================================
 * 6. DATABASE READ COMPATIBILITY
 * ============================================================
 */

function gameTransactionReadAll_() {

  if (
    typeof getAllRecords !==
    'function'
  ) {
    throw new Error(
      'Database.gs getAllRecords() is unavailable.'
    );
  }

  var result =
    getAllRecords(
      GAME_TRANSACTION_CONFIG.TABLE_KEY
    );

  /*
   * Canonical successful empty read.
   */
  if (
    result === null ||
    result === undefined
  ) {
    return [];
  }

  /*
   * Preferred Database.gs contract.
   */
  if (Array.isArray(result)) {
    return result;
  }

  /*
   * Compatibility wrappers.
   */
  if (
    Array.isArray(result.records)
  ) {
    return result.records;
  }

  if (
    Array.isArray(result.data)
  ) {
    return result.data;
  }

  if (
    Array.isArray(result.items)
  ) {
    return result.items;
  }

  if (
    result.success === false
  ) {
    throw new Error(
      result.error ||
      result.message ||
      'Database read failed.'
    );
  }

  throw new Error(
    'Database getAllRecords() returned an invalid read contract.'
  );
}


/* ============================================================
 * 7. SCHEMA
 * ============================================================
 */

function getGameTransactionSchema() {

  return {
    success: true,

    version:
      GAME_TRANSACTION_CONFIG.VERSION,

    table:
      GAME_TRANSACTION_CONFIG.TABLE_KEY,

    sheet:
      GAME_TRANSACTION_CONFIG.SHEET_NAME,

    headerRow:
      GAME_TRANSACTION_CONFIG.HEADER_ROW,

    dataStartRow:
      GAME_TRANSACTION_CONFIG.DATA_START_ROW,

    headers:
      GAME_TRANSACTION_CONFIG.HEADERS.slice(),

    headerCount:
      GAME_TRANSACTION_CONFIG.HEADERS.length,

    universalMaxPlayers:
      GAME_TRANSACTION_CONFIG.UNIVERSAL_MAX_PLAYERS,

    universalPlayerPositions:
      GAME_TRANSACTION_CONFIG
        .UNIVERSAL_PLAYER_POSITIONS
        .slice(),

    mutationPerformed: false
  };
}


function setupGameTransactionsSheet() {

  try {

    gameTransactionRequireDatabase_();

    var sheet =
      getDatabaseSheet(
        GAME_TRANSACTION_CONFIG.TABLE_KEY
      );

    if (!sheet) {
      throw new Error(
        'GameTransactions sheet could not be resolved.'
      );
    }

    sheet
      .getRange(
        GAME_TRANSACTION_CONFIG.HEADER_ROW,
        1,
        1,
        GAME_TRANSACTION_CONFIG.HEADERS.length
      )
      .setValues([
        GAME_TRANSACTION_CONFIG.HEADERS
      ]);

    try {
      sheet.setFrozenRows(
        GAME_TRANSACTION_CONFIG.HEADER_ROW
      );
    } catch (ignore) {}

    return gameTransactionResult_(
      true,
      {
        table:
          GAME_TRANSACTION_CONFIG.TABLE_KEY,
        sheetName:
          sheet.getName(),
        headerRow:
          GAME_TRANSACTION_CONFIG.HEADER_ROW,
        headers:
          GAME_TRANSACTION_CONFIG.HEADERS.slice()
      }
    );

  } catch (error) {

    return gameTransactionResult_(
      false,
      undefined,
      error
    );
  }
}


function validateGameTransactionsSchema() {

  try {

    if (
      typeof getDatabaseHeaders !==
      'function'
    ) {
      throw new Error(
        'Database.gs getDatabaseHeaders() is unavailable.'
      );
    }

    var actual =
      getDatabaseHeaders(
        GAME_TRANSACTION_CONFIG.TABLE_KEY
      );

    if (!Array.isArray(actual)) {
      throw new Error(
        'Database headers must be an array.'
      );
    }

    var expected =
      GAME_TRANSACTION_CONFIG.HEADERS;

    var exact =
      actual.length === expected.length;

    if (exact) {

      for (
        var i = 0;
        i < expected.length;
        i++
      ) {
        if (
          String(actual[i]) !==
          String(expected[i])
        ) {
          exact = false;
          break;
        }
      }
    }

    return gameTransactionResult_(
      exact,
      {
        expectedCount:
          expected.length,
        actualCount:
          actual.length,
        expectedHeaders:
          expected.slice(),
        actualHeaders:
          actual.slice(),
        exact: exact
      },
      exact
        ? null
        : new Error(
            'GameTransactions schema mismatch.'
          )
    );

  } catch (error) {

    return gameTransactionResult_(
      false,
      undefined,
      error
    );
  }
}


/* ============================================================
 * 8. CURRENCY AUTHORITY
 * ============================================================
 */

function gameTransactionNormalizeCurrency_(
  currency
) {

  if (
    typeof normalizeGamingCurrency !==
    'function'
  ) {
    throw new Error(
      'RDEconomyCurrency.gs normalizeGamingCurrency() is unavailable.'
    );
  }

  var normalized =
    normalizeGamingCurrency(
      currency
    );

  if (!normalized) {
    throw new Error(
      'Invalid gaming currency: ' +
      currency
    );
  }

  return String(normalized).toUpperCase();
}


function gameTransactionGetCurrencyList_() {

  if (
    typeof getGamingCurrencyList ===
    'function'
  ) {
    return getGamingCurrencyList();
  }

  if (
    typeof getGamingCurrencies ===
    'function'
  ) {
    return getGamingCurrencies();
  }

  if (
    typeof getSupportedGamingCurrencies ===
    'function'
  ) {
    return getSupportedGamingCurrencies();
  }

  throw new Error(
    'RDEconomyCurrency.gs currency registry API is unavailable.'
  );
}


/* ============================================================
 * 9. UNIVERSAL P1–P12
 * ============================================================
 */

function gameTransactionGetPlayerPosition_(
  playerNumber
) {

  var n =
    Number(playerNumber);

  if (
    !isFinite(n) ||
    n < 1 ||
    n > GAME_TRANSACTION_CONFIG.UNIVERSAL_MAX_PLAYERS
  ) {
    return null;
  }

  return 'P' + Math.floor(n);
}


function gameTransactionValidatePlayerPosition_(
  playerNumber
) {

  var position =
    gameTransactionGetPlayerPosition_(
      playerNumber
    );

  if (!position) {
    throw new Error(
      'Player Number must map to P1-P12.'
    );
  }

  return position;
}


/* ============================================================
 * 10. GAME CAPACITY CONTRACT
 * ============================================================
 */

function gameTransactionExpectedGameCapacities_() {

  var source =
    GAME_TRANSACTION_CONFIG.GAME_CAPACITY || {};

  return gameTransactionClone_(source);
}


function gameTransactionNormalizeGameCode_(
  gameId
) {

  var value =
    gameTransactionUpper_(
      gameId
    );

  if (
    value === 'RDG2048' ||
    value === 'RDG_2048' ||
    value === 'GAME_2048'
  ) {
    return '2048';
  }

  return value;
}


function gameTransactionGetGameCapacity_(
  gameId
) {

  var expected =
    gameTransactionExpectedGameCapacities_();

  var code =
    gameTransactionNormalizeGameCode_(
      gameId
    );

  if (expected[code]) {
    return expected[code];
  }

  /*
   * Delegate to GameRooms.gs where available.
   */
  if (
    typeof getGameRoomGameLimits ===
    'function'
  ) {

    var limits =
      getGameRoomGameLimits(
        gameId
      );

    if (limits) {
      return limits;
    }
  }

  return null;
}


/* ============================================================
 * 11. RELATION HELPERS
 * ============================================================
 */

function gameTransactionGetRecord_(
  tableKey,
  id
) {

  if (!id) {
    return null;
  }

  if (
    typeof getRecord !==
    'function'
  ) {
    throw new Error(
      'Database.gs getRecord() is unavailable.'
    );
  }

  try {

    return getRecord(
      tableKey,
      id
    );

  } catch (error) {

    return null;
  }
}


function gameTransactionValidateRelations_(
  data
) {

  var gameId =
    data.gameId;

  var roomId =
    data.gameRoomId;

  var playerId =
    data.gamePlayerId;

  var walletId =
    data.walletAccountId;

  var companyId =
    data.companyId;

  var userId =
    data.userId;

  if (
    typeof getRecord !==
    'function'
  ) {
    throw new Error(
      'Database.gs getRecord() is required for relation validation.'
    );
  }

  var game = null;
  var room = null;
  var player = null;
  var wallet = null;

  if (gameId) {

    game =
      gameTransactionGetRecord_(
        'GAMES',
        gameId
      );

    if (game) {

      var gameCompany =
        gameTransactionField_(
          game,
          [
            'Company ID',
            'CompanyID',
            'companyId'
          ]
        );

      if (
        companyId &&
        gameCompany &&
        String(gameCompany) !==
        String(companyId)
      ) {
        throw new Error(
          'Game company mismatch.'
        );
      }
    }
  }

  if (roomId) {

    room =
      gameTransactionGetRecord_(
        'GAME_ROOMS',
        roomId
      );

    if (room) {

      var roomGame =
        gameTransactionField_(
          room,
          [
            'Game ID',
            'GameID',
            'gameId'
          ]
        );

      if (
        gameId &&
        roomGame &&
        String(roomGame) !==
        String(gameId)
      ) {
        throw new Error(
          'Game Room / Game mismatch.'
        );
      }

      var roomCompany =
        gameTransactionField_(
          room,
          [
            'Company ID',
            'CompanyID',
            'companyId'
          ]
        );

      if (
        companyId &&
        roomCompany &&
        String(roomCompany) !==
        String(companyId)
      ) {
        throw new Error(
          'Game Room company mismatch.'
        );
      }
    }
  }

  if (playerId) {

    player =
      gameTransactionGetRecord_(
        'GAME_PLAYERS',
        playerId
      );

    if (player) {

      var playerRoom =
        gameTransactionField_(
          player,
          [
            'Game Room ID',
            'GameRoomID',
            'gameRoomId'
          ]
        );

      var playerGame =
        gameTransactionField_(
          player,
          [
            'Game ID',
            'GameID',
            'gameId'
          ]
        );

      var playerUser =
        gameTransactionField_(
          player,
          [
            'User ID',
            'UserID',
            'userId'
          ]
        );

      if (
        roomId &&
        playerRoom &&
        String(playerRoom) !==
        String(roomId)
      ) {
        throw new Error(
          'Game Player / Game Room mismatch.'
        );
      }

      if (
        gameId &&
        playerGame &&
        String(playerGame) !==
        String(gameId)
      ) {
        throw new Error(
          'Game Player / Game mismatch.'
        );
      }

      if (
        userId &&
        playerUser &&
        String(playerUser) !==
        String(userId)
      ) {
        throw new Error(
          'Game Player / User mismatch.'
        );
      }
    }
  }

  if (walletId) {

    wallet =
      gameTransactionGetRecord_(
        'WALLET_ACCOUNTS',
        walletId
      );

    if (wallet) {

      var walletUser =
        gameTransactionField_(
          wallet,
          [
            'User ID',
            'UserID',
            'userId'
          ]
        );

      var walletCompany =
        gameTransactionField_(
          wallet,
          [
            'Company ID',
            'CompanyID',
            'companyId'
          ]
        );

      if (
        userId &&
        walletUser &&
        String(walletUser) !==
        String(userId)
      ) {
        throw new Error(
          'Wallet / User mismatch.'
        );
      }

      if (
        companyId &&
        walletCompany &&
        String(walletCompany) !==
        String(companyId)
      ) {
        throw new Error(
          'Wallet / Company mismatch.'
        );
      }
    }
  }

  return {
    game: game,
    room: room,
    player: player,
    wallet: wallet
  };
}


/* ============================================================
 * 12. INPUT NORMALIZATION
 * ============================================================
 */

function gameTransactionNormalizeInput_(
  input
) {

  input =
    input || {};

  var data = {};

  data.id =
    gameTransactionField_(
      input,
      ['ID', 'id']
    );

  data.gameRoomId =
    gameTransactionField_(
      input,
      [
        'Game Room ID',
        'gameRoomId',
        'gameRoomID',
        'roomId'
      ]
    );

  data.gameId =
    gameTransactionField_(
      input,
      [
        'Game ID',
        'gameId'
      ]
    );

  data.userId =
    gameTransactionField_(
      input,
      [
        'User ID',
        'userId'
      ]
    );

  data.companyId =
    gameTransactionField_(
      input,
      [
        'Company ID',
        'companyId'
      ]
    );

  data.gamePlayerId =
    gameTransactionField_(
      input,
      [
        'Game Player ID',
        'gamePlayerId'
      ]
    );

  data.walletAccountId =
    gameTransactionField_(
      input,
      [
        'Wallet Account ID',
        'walletAccountId'
      ]
    );

  data.currencyCode =
    gameTransactionField_(
      input,
      [
        'Currency Code',
        'currencyCode',
        'currency'
      ]
    );

  data.transactionType =
    gameTransactionField_(
      input,
      [
        'Transaction Type',
        'transactionType',
        'type'
      ]
    );

  data.amount =
    gameTransactionField_(
      input,
      [
        'Amount',
        'amount'
      ]
    );

  data.balanceBefore =
    gameTransactionField_(
      input,
      [
        'Balance Before',
        'balanceBefore'
      ]
    );

  data.balanceAfter =
    gameTransactionField_(
      input,
      [
        'Balance After',
        'balanceAfter'
      ]
    );

  data.referenceType =
    gameTransactionField_(
      input,
      [
        'Reference Type',
        'referenceType'
      ]
    );

  data.referenceId =
    gameTransactionField_(
      input,
      [
        'Reference ID',
        'referenceId'
      ]
    );

  data.relatedGameTransactionId =
    gameTransactionField_(
      input,
      [
        'Related Game Transaction ID',
        'relatedGameTransactionId'
      ]
    );

  data.walletTransactionId =
    gameTransactionField_(
      input,
      [
        'Wallet Transaction ID',
        'walletTransactionId'
      ]
    );

  data.description =
    gameTransactionField_(
      input,
      [
        'Description',
        'description'
      ]
    );

  data.status =
    gameTransactionField_(
      input,
      [
        'Status',
        'status'
      ]
    );

  data.transactionDate =
    gameTransactionField_(
      input,
      [
        'Transaction Date',
        'transactionDate'
      ]
    );

  data.metadata =
    gameTransactionField_(
      input,
      [
        'Metadata JSON',
        'metadata',
        'metadataJson'
      ]
    );

  return data;
}


/* ============================================================
 * 13. VALIDATION
 * ============================================================
 */

function validateGameTransactionData(
  input
) {

  var data =
    gameTransactionNormalizeInput_(
      input
    );

  var required = [
    ['gameRoomId', 'Game Room ID'],
    ['gameId', 'Game ID'],
    ['userId', 'User ID'],
    ['companyId', 'Company ID'],
    ['gamePlayerId', 'Game Player ID'],
    ['walletAccountId', 'Wallet Account ID'],
    ['currencyCode', 'Currency Code'],
    ['transactionType', 'Transaction Type'],
    ['referenceType', 'Reference Type'],
    ['referenceId', 'Reference ID']
  ];

  for (
    var i = 0;
    i < required.length;
    i++
  ) {

    if (
      !gameTransactionText_(
        data[required[i][0]]
      )
    ) {
      throw new Error(
        required[i][1] +
        ' is required.'
      );
    }
  }

  data.currencyCode =
    gameTransactionNormalizeCurrency_(
      data.currencyCode
    );

  data.transactionType =
    gameTransactionValidateEnum_(
      data.transactionType,
      GAME_TRANSACTION_CONFIG
        .TRANSACTION_TYPES,
      'Transaction Type'
    );

  data.referenceType =
    gameTransactionValidateEnum_(
      data.referenceType,
      GAME_TRANSACTION_CONFIG
        .REFERENCE_TYPES,
      'Reference Type'
    );

  data.status =
    data.status
      ? gameTransactionValidateEnum_(
          data.status,
          GAME_TRANSACTION_CONFIG
            .STATUSES,
          'Status'
        )
      : GAME_TRANSACTION_CONFIG.DEFAULT_STATUS;

  data.amount =
    gameTransactionPositive_(
      data.amount,
      'Amount'
    );

  if (
    data.balanceBefore !== '' &&
    data.balanceBefore !== null &&
    data.balanceBefore !== undefined
  ) {
    data.balanceBefore =
      gameTransactionRound_(
        Number(data.balanceBefore)
      );
  }

  if (
    data.balanceAfter !== '' &&
    data.balanceAfter !== null &&
    data.balanceAfter !== undefined
  ) {
    data.balanceAfter =
      gameTransactionRound_(
        Number(data.balanceAfter)
      );
  }

  /*
   * Universal player position validation
   * is diagnostic/framework-level only.
   * Actual game capacity remains canonical elsewhere.
   */
  if (
    input.playerNumber !== undefined
  ) {
    gameTransactionValidatePlayerPosition_(
      input.playerNumber
    );
  }

  gameTransactionValidateRelations_(
    data
  );

  return data;
}


/* ============================================================
 * 14. ID GENERATION
 * ============================================================
 */

function gameTransactionGenerateId_() {

  if (
    typeof generateTableId ===
    'function'
  ) {

    try {

      var generated =
        generateTableId(
          GAME_TRANSACTION_CONFIG.TABLE_KEY
        );

      if (generated) {
        return String(generated);
      }

    } catch (ignore) {}
  }

  if (
    typeof generateId ===
    'function'
  ) {

    try {

      var id =
        generateId(
          'GTR'
        );

      if (id) {
        return String(id);
      }

    } catch (ignore2) {}
  }

  return (
    'GTR_' +
    Utilities.getUuid()
      .replace(/-/g, '') +
    '_' +
    Date.now()
  );
}


/* ============================================================
 * 15. IDEMPOTENCY
 * ============================================================
 */

function gameTransactionFindByReference_(
  referenceType,
  referenceId
) {

  if (
    !referenceType ||
    !referenceId
  ) {
    return [];
  }

  if (
    typeof findRecords !==
    'function'
  ) {
    throw new Error(
      'Database.gs findRecords() is unavailable.'
    );
  }

  var records =
    findRecords(
      GAME_TRANSACTION_CONFIG.TABLE_KEY,
      {
        'Reference Type':
          referenceType,
        'Reference ID':
          referenceId
      }
    );

  if (!Array.isArray(records)) {
    return [];
  }

  return records;
}


function gameTransactionFindActiveDuplicate_(
  referenceType,
  referenceId
) {

  var records =
    gameTransactionFindByReference_(
      referenceType,
      referenceId
    );

  for (
    var i = 0;
    i < records.length;
    i++
  ) {

    var status =
      gameTransactionUpper_(
        gameTransactionField_(
          records[i],
          ['Status']
        )
      );

    /*
     * CANCELLED / FAILED records do not block
     * a new legitimate transaction.
     *
     * REVERSED DOES block because the original
     * transaction already exists historically.
     */
    if (
      status !== 'CANCELLED' &&
      status !== 'FAILED'
    ) {
      return records[i];
    }
  }

  return null;
}


/* ============================================================
 * 16. CREATE
 * ============================================================
 */

function createGameTransaction(
  input
) {

  var lock = null;

  try {

    if (
      typeof LockService !==
      'undefined'
    ) {
      lock =
        LockService.getScriptLock();

      lock.waitLock(
        GAME_TRANSACTION_CONFIG
          .LOCK_TIMEOUT_MS
      );
    }

    gameTransactionRequireDatabase_();

    var data =
      validateGameTransactionData(
        input
      );

    var duplicate =
      gameTransactionFindActiveDuplicate_(
        data.referenceType,
        data.referenceId
      );

    if (duplicate) {

      return gameTransactionResult_(
        true,
        duplicate
      );
    }

    var now =
      gameTransactionNow_();

    var record = {

      'ID':
        data.id ||
        gameTransactionGenerateId_(),

      'Game Room ID':
        data.gameRoomId,

      'Game ID':
        data.gameId,

      'User ID':
        data.userId,

      'Company ID':
        data.companyId,

      'Game Player ID':
        data.gamePlayerId,

      'Wallet Account ID':
        data.walletAccountId,

      'Currency Code':
        data.currencyCode,

      'Transaction Type':
        data.transactionType,

      'Amount':
        data.amount,

      'Balance Before':
        data.balanceBefore === ''
          ? ''
          : data.balanceBefore,

      'Balance After':
        data.balanceAfter === ''
          ? ''
          : data.balanceAfter,

      'Reference Type':
        data.referenceType,

      'Reference ID':
        data.referenceId,

      'Related Game Transaction ID':
        data.relatedGameTransactionId ||
        '',

      'Wallet Transaction ID':
        data.walletTransactionId ||
        '',

      'Description':
        data.description ||
        '',

      'Status':
        data.status ||
        GAME_TRANSACTION_CONFIG.DEFAULT_STATUS,

      'Transaction Date':
        data.transactionDate ||
        now,

      'Metadata JSON':
        gameTransactionJson_(
          data.metadata
        ),

      'Created At':
        now,

      'Updated At':
        now
    };

    var created =
      createRecord(
        GAME_TRANSACTION_CONFIG.TABLE_KEY,
        record
      );

    if (
      created === null ||
      created === undefined
    ) {
      throw new Error(
        'Database createRecord() returned no record.'
      );
    }

    return gameTransactionResult_(
      true,
      created
    );

  } catch (error) {

    return gameTransactionResult_(
      false,
      undefined,
      error
    );

  } finally {

    if (lock) {

      try {
        lock.releaseLock();
      } catch (ignore) {}

    }
  }
}


/* ============================================================
 * 17. REQUIRED GAMEWALLET APIs
 * ============================================================
 */

function createGameEntryFeeTransaction(
  input
) {

  input =
    gameTransactionClone_(
      input || {}
    );

  input.transactionType =
    'ENTRY_FEE';

  if (
    !input.referenceType &&
    !input['Reference Type']
  ) {
    input.referenceType =
      'ENTRY_FEE';
  }

  if (
    !input.referenceId &&
    !input['Reference ID']
  ) {

    input.referenceId =
      input.gamePlayerId ||
      input['Game Player ID'] ||
      input.gameRoomId ||
      input['Game Room ID'];
  }

  return createGameTransaction(
    input
  );
}


function createGamePrizeTransaction(
  input
) {

  input =
    gameTransactionClone_(
      input || {}
    );

  input.transactionType =
    'PRIZE';

  if (
    !input.referenceType &&
    !input['Reference Type']
  ) {
    input.referenceType =
      'PRIZE';
  }

  if (
    !input.referenceId &&
    !input['Reference ID']
  ) {

    input.referenceId =
      input.gamePlayerId ||
      input['Game Player ID'] ||
      input.gameRoomId ||
      input['Game Room ID'];
  }

  return createGameTransaction(
    input
  );
}


function createGameRefundTransaction(
  input
) {

  input =
    gameTransactionClone_(
      input || {}
    );

  input.transactionType =
    'REFUND';

  if (
    !input.referenceType &&
    !input['Reference Type']
  ) {
    input.referenceType =
      'REFUND';
  }

  if (
    !input.referenceId &&
    !input['Reference ID']
  ) {

    input.referenceId =
      input.gamePlayerId ||
      input['Game Player ID'] ||
      input.gameRoomId ||
      input['Game Room ID'];
  }

  return createGameTransaction(
    input
  );
}


function createGameBonusTransaction(
  input
) {

  input =
    gameTransactionClone_(
      input || {}
    );

  input.transactionType =
    'BONUS';

  if (
    !input.referenceType &&
    !input['Reference Type']
  ) {
    input.referenceType =
      'BONUS';
  }

  return createGameTransaction(
    input
  );
}


function createGameRewardTransaction(
  input
) {

  input =
    gameTransactionClone_(
      input || {}
    );

  input.transactionType =
    'REWARD';

  if (
    !input.referenceType &&
    !input['Reference Type']
  ) {
    input.referenceType =
      'REWARD';
  }

  return createGameTransaction(
    input
  );
}


function createGamePenaltyTransaction(
  input
) {

  input =
    gameTransactionClone_(
      input || {}
    );

  input.transactionType =
    'PENALTY';

  if (
    !input.referenceType &&
    !input['Reference Type']
  ) {
    input.referenceType =
      'OTHER';
  }

  return createGameTransaction(
    input
  );
}


/* ============================================================
 * 18. READ APIs
 * ============================================================
 */

function getGameTransaction(
  transactionId
) {

  if (
    !transactionId
  ) {
    throw new Error(
      'Game Transaction ID is required.'
    );
  }

  if (
    typeof getRecord !==
    'function'
  ) {
    throw new Error(
      'Database.gs getRecord() is unavailable.'
    );
  }

  return getRecord(
    GAME_TRANSACTION_CONFIG.TABLE_KEY,
    transactionId
  );
}


function getAllGameTransactions() {

  return gameTransactionReadAll_();
}


/* Compatibility read API: preserves the historical plural entry point. */
function getGameTransactions(filters) {

  if (filters === undefined || filters === null) {
    return getAllGameTransactions();
  }

  return findGameTransactions(filters);
}


function findGameTransactions(
  filters
) {

  filters =
    gameTransactionClone_(
      filters || {}
    );

  if (
    typeof findRecords !==
    'function'
  ) {
    throw new Error(
      'Database.gs findRecords() is unavailable.'
    );
  }

  var records =
    findRecords(
      GAME_TRANSACTION_CONFIG.TABLE_KEY,
      filters
    );

  if (
    records === null ||
    records === undefined
  ) {
    return [];
  }

  if (!Array.isArray(records)) {
    throw new Error(
      'findRecords() returned an invalid array contract.'
    );
  }

  return records;
}


function getGameTransactionsByReference(
  referenceType,
  referenceId
) {

  return gameTransactionFindByReference_(
    referenceType,
    referenceId
  );
}


function getGameTransactionsByWalletTransaction(
  walletTransactionId
) {

  return findGameTransactions({
    'Wallet Transaction ID':
      walletTransactionId
  });
}


function getPendingGameTransactions(
  filters
) {

  var f =
    gameTransactionClone_(
      filters || {}
    );

  f.Status =
    'PENDING';

  return findGameTransactions(f);
}


function getCompletedGameTransactions(
  filters
) {

  var f =
    gameTransactionClone_(
      filters || {}
    );

  f.Status =
    'COMPLETED';

  return findGameTransactions(f);
}


function getReversedGameTransactions(
  filters
) {

  var f =
    gameTransactionClone_(
      filters || {}
    );

  f.Status =
    'REVERSED';

  return findGameTransactions(f);
}


function getCancelledGameTransactions(
  filters
) {

  var f =
    gameTransactionClone_(
      filters || {}
    );

  f.Status =
    'CANCELLED';

  return findGameTransactions(f);
}


function getFailedGameTransactions(
  filters
) {

  var f =
    gameTransactionClone_(
      filters || {}
    );

  f.Status =
    'FAILED';

  return findGameTransactions(f);
}


/* ============================================================
 * 19. UPDATE
 * ============================================================
 */

function updateGameTransaction(
  transactionId,
  updates
) {

  if (!transactionId) {
    throw new Error(
      'Game Transaction ID is required.'
    );
  }

  var current =
    getGameTransaction(
      transactionId
    );

  if (!current) {
    throw new Error(
      'Game Transaction not found: ' +
      transactionId
    );
  }

  var currentStatus =
    gameTransactionUpper_(
      gameTransactionField_(
        current,
        ['Status']
      )
    );

  if (
    currentStatus === 'REVERSED' ||
    currentStatus === 'CANCELLED'
  ) {
    throw new Error(
      'Transaction cannot be updated after ' +
      currentStatus +
      '.'
    );
  }

  updates =
    gameTransactionClone_(
      updates || {}
    );

  if (
    updates['Transaction Type'] ||
    updates.transactionType
  ) {

    updates['Transaction Type'] =
      gameTransactionValidateEnum_(
        updates['Transaction Type'] ||
        updates.transactionType,
        GAME_TRANSACTION_CONFIG
          .TRANSACTION_TYPES,
        'Transaction Type'
      );
  }

  if (
    updates['Currency Code'] ||
    updates.currencyCode
  ) {

    updates['Currency Code'] =
      gameTransactionNormalizeCurrency_(
        updates['Currency Code'] ||
        updates.currencyCode
      );
  }

  if (
    updates.Status ||
    updates.status
  ) {

    updates.Status =
      gameTransactionValidateEnum_(
        updates.Status ||
        updates.status,
        GAME_TRANSACTION_CONFIG
          .STATUSES,
        'Status'
      );
  }

  if (
    updates.Amount !== undefined ||
    updates.amount !== undefined
  ) {

    updates.Amount =
      gameTransactionPositive_(
        updates.Amount !== undefined
          ? updates.Amount
          : updates.amount,
        'Amount'
      );
  }

  delete updates.status;
  delete updates.transactionType;
  delete updates.currencyCode;
  delete updates.amount;

  updates['Updated At'] =
    gameTransactionNow_();

  if (
    typeof updateRecord !==
    'function'
  ) {
    throw new Error(
      'Database.gs updateRecord() is unavailable.'
    );
  }

  return updateRecord(
    GAME_TRANSACTION_CONFIG.TABLE_KEY,
    transactionId,
    updates
  );
}


/* ============================================================
 * 20. STATUS OPERATIONS
 * ============================================================
 */

function completeGameTransaction(
  transactionId
) {

  return updateGameTransaction(
    transactionId,
    {
      Status: 'COMPLETED'
    }
  );
}


function cancelGameTransaction(
  transactionId
) {

  return updateGameTransaction(
    transactionId,
    {
      Status: 'CANCELLED'
    }
  );
}


function failGameTransaction(
  transactionId
) {

  return updateGameTransaction(
    transactionId,
    {
      Status: 'FAILED'
    }
  );
}


/* ============================================================
 * 21. REVERSAL
 * ============================================================
 */

function reverseGameTransaction(
  transactionId,
  options
) {

  var lock = null;

  try {

    if (
      typeof LockService !==
      'undefined'
    ) {

      lock =
        LockService.getScriptLock();

      lock.waitLock(
        GAME_TRANSACTION_CONFIG
          .LOCK_TIMEOUT_MS
      );
    }

    var original =
      getGameTransaction(
        transactionId
      );

    if (!original) {
      throw new Error(
        'Original Game Transaction not found: ' +
        transactionId
      );
    }

    var status =
      gameTransactionUpper_(
        gameTransactionField_(
          original,
          ['Status']
        )
      );

    if (
      status === 'REVERSED'
    ) {
      return original;
    }

    if (
      status === 'CANCELLED' ||
      status === 'FAILED'
    ) {
      throw new Error(
        'Transaction cannot be reversed from status: ' +
        status
      );
    }

    options =
      options || {};

    var requestedRelatedId =
      options.relatedGameTransactionId ||
      options['Related Game Transaction ID'];

    if (
      requestedRelatedId &&
      String(requestedRelatedId) !==
      String(transactionId)
    ) {
      throw new Error(
        'Reversal Related Game Transaction ID must equal the original transaction ID.'
      );
    }

    /*
     * Idempotency:
     * locate existing reversal.
     */
    var existing =
      findGameTransactions({
        'Related Game Transaction ID':
          transactionId,
        'Transaction Type':
          gameTransactionUpper_(
            gameTransactionField_(
              original,
              ['Transaction Type']
            )
          )
      });

    if (
      Array.isArray(existing) &&
      existing.length > 0
    ) {

      var existingReversal =
        existing[0];

      updateRecord(
        GAME_TRANSACTION_CONFIG.TABLE_KEY,
        transactionId,
        {
          Status: 'REVERSED',
          'Updated At':
            gameTransactionNow_()
        }
      );

      return existingReversal;
    }

    var now =
      gameTransactionNow_();

    var reversal = {

      'ID':
        gameTransactionGenerateId_(),

      'Game Room ID':
        gameTransactionField_(
          original,
          ['Game Room ID']
        ),

      'Game ID':
        gameTransactionField_(
          original,
          ['Game ID']
        ),

      'User ID':
        gameTransactionField_(
          original,
          ['User ID']
        ),

      'Company ID':
        gameTransactionField_(
          original,
          ['Company ID']
        ),

      'Game Player ID':
        gameTransactionField_(
          original,
          ['Game Player ID']
        ),

      'Wallet Account ID':
        gameTransactionField_(
          original,
          ['Wallet Account ID']
        ),

      'Currency Code':
        gameTransactionField_(
          original,
          ['Currency Code']
        ),

      'Transaction Type':
        gameTransactionField_(
          original,
          ['Transaction Type']
        ),

      'Amount':
        gameTransactionField_(
          original,
          ['Amount']
        ),

      'Balance Before':
        gameTransactionField_(
          original,
          ['Balance After']
        ),

      'Balance After':
        gameTransactionField_(
          original,
          ['Balance Before']
        ),

      'Reference Type':
        'GAME_TRANSACTION',

      'Reference ID':
        transactionId,

      'Related Game Transaction ID':
        transactionId,

      'Wallet Transaction ID':
        '',

      'Description':
        options.description ||
        (
          'Reversal of Game Transaction ' +
          transactionId
        ),

      'Status':
        'COMPLETED',

      'Transaction Date':
        now,

      'Metadata JSON':
        gameTransactionJson_(
          options.metadata || {
            reversalOf:
              transactionId
          }
        ),

      'Created At':
        now,

      'Updated At':
        now
    };

    var createdReversal =
      createRecord(
        GAME_TRANSACTION_CONFIG.TABLE_KEY,
        reversal
      );

    if (
      !createdReversal
    ) {
      throw new Error(
        'Failed to create reversal transaction.'
      );
    }

    /*
     * IMPORTANT:
     * Canonical Database field is "Updated At".
     */
    updateRecord(
      GAME_TRANSACTION_CONFIG.TABLE_KEY,
      transactionId,
      {
        Status: 'REVERSED',
        'Updated At':
          gameTransactionNow_()
      }
    );

    return createdReversal;

  } finally {

    if (lock) {

      try {
        lock.releaseLock();
      } catch (ignore) {}

    }
  }
}


/* ============================================================
 * 22. TOTALS / COUNTS
 * ============================================================
 */

function getGameTransactionCount(
  filters
) {

  return findGameTransactions(
    filters || {}
  ).length;
}


function getGameTransactionTotal(
  filters
) {

  var records =
    findGameTransactions(
      filters || {}
    );

  var total = 0;

  records.forEach(
    function(record) {

      total +=
        gameTransactionNumber_(
          gameTransactionField_(
            record,
            ['Amount']
          ),
          0
        );

    }
  );

  return gameTransactionRound_(
    total
  );
}


function getGameEntryFeeTotal(
  filters
) {

  var f =
    gameTransactionClone_(
      filters || {}
    );

  f['Transaction Type'] =
    'ENTRY_FEE';

  return getGameTransactionTotal(
    f
  );
}


function getGamePrizeTotal(
  filters
) {

  var f =
    gameTransactionClone_(
      filters || {}
    );

  f['Transaction Type'] =
    'PRIZE';

  return getGameTransactionTotal(
    f
  );
}


function getGameRefundTotal(
  filters
) {

  var f =
    gameTransactionClone_(
      filters || {}
    );

  f['Transaction Type'] =
    'REFUND';

  return getGameTransactionTotal(
    f
  );
}


function getLatestGameTransactions(
  limit,
  filters
) {

  limit =
    Number(limit || 20);

  if (
    limit < 1
  ) {
    limit = 20;
  }

  var records =
    findGameTransactions(
      filters || {}
    );

  records.sort(
    function(a, b) {

      var da =
        new Date(
          gameTransactionField_(
            a,
            [
              'Transaction Date',
              'Created At'
            ]
          )
        ).getTime();

      var db =
        new Date(
          gameTransactionField_(
            b,
            [
              'Transaction Date',
              'Created At'
            ]
          )
        ).getTime();

      return db - da;
    }
  );

  return records.slice(
    0,
    limit
  );
}


/* ============================================================
 * 23. WALLET LINK VALIDATION
 * ============================================================
 */

function validateGameTransactionWalletLink(
  transactionId
) {

  var transaction =
    getGameTransaction(
      transactionId
    );

  if (!transaction) {
    throw new Error(
      'Game Transaction not found.'
    );
  }

  var walletTransactionId =
    gameTransactionField_(
      transaction,
      ['Wallet Transaction ID']
    );

  if (!walletTransactionId) {
    return {
      success: true,
      linked: false,
      transactionId:
        transactionId,
      walletTransactionId: '',
      mutationPerformed: false
    };
  }

  var walletTransaction = null;

  if (
    typeof getRecord ===
    'function'
  ) {

    walletTransaction =
      getRecord(
        'WALLET_TRANSACTIONS',
        walletTransactionId
      );
  }

  return {
    success: !!walletTransaction,
    linked: !!walletTransaction,
    transactionId:
      transactionId,
    walletTransactionId:
      walletTransactionId,
    mutationPerformed: false
  };
}


/* ============================================================
 * 24. RECONCILIATION
 * ============================================================
 */

function reconcileGameTransaction(
  transactionId
) {

  var transaction =
    getGameTransaction(
      transactionId
    );

  if (!transaction) {
    throw new Error(
      'Game Transaction not found.'
    );
  }

  var walletTransactionId =
    gameTransactionField_(
      transaction,
      ['Wallet Transaction ID']
    );

  if (!walletTransactionId) {

    return {
      success: true,
      reconciled: false,
      reason:
        'No Wallet Transaction ID is linked.',
      mutationPerformed: false
    };
  }

  var walletTransaction =
    getRecord(
      'WALLET_TRANSACTIONS',
      walletTransactionId
    );

  if (!walletTransaction) {

    return {
      success: false,
      reconciled: false,
      reason:
        'Linked Wallet Transaction not found.',
      mutationPerformed: false
    };
  }

  var checks = {
    currency: String(
      gameTransactionField_(
        transaction,
        ['Currency Code']
      )
    ).toUpperCase() ===
      String(
        gameTransactionField_(
          walletTransaction,
          [
            'Currency Code',
            'Currency'
          ]
        )
      ).toUpperCase(),

    amount:
      Number(
        gameTransactionField_(
          transaction,
          ['Amount']
        )
      ) ===
      Number(
        gameTransactionField_(
          walletTransaction,
          ['Amount']
        )
      ),

    user:
      String(
        gameTransactionField_(
          transaction,
          ['User ID']
        )
      ) ===
      String(
        gameTransactionField_(
          walletTransaction,
          ['User ID']
        )
      ),

    company:
      String(
        gameTransactionField_(
          transaction,
          ['Company ID']
        )
      ) ===
      String(
        gameTransactionField_(
          walletTransaction,
          ['Company ID']
        )
      )
  };

  var reconciled =
    checks.currency &&
    checks.amount &&
    checks.user &&
    checks.company;

  return {
    success: reconciled,
    reconciled:
      reconciled,
    checks:
      checks,
    mutationPerformed: false
  };
}


/* ============================================================
 * 25. SAFE DELETE
 * ============================================================
 */

function deleteGameTransactionSafe(
  transactionId
) {

  var record =
    getGameTransaction(
      transactionId
    );

  if (!record) {
    throw new Error(
      'Game Transaction not found.'
    );
  }

  var status =
    gameTransactionUpper_(
      gameTransactionField_(
        record,
        ['Status']
      )
    );

  if (
    status === 'COMPLETED' ||
    status === 'REVERSED'
  ) {
    throw new Error(
      'Completed or reversed transactions cannot be deleted.'
    );
  }

  if (
    typeof deleteRecord !==
    'function'
  ) {
    throw new Error(
      'Database.gs deleteRecord() is unavailable.'
    );
  }

  return deleteRecord(
    GAME_TRANSACTION_CONFIG.TABLE_KEY,
    transactionId
  );
}


/* ============================================================
 * 26. AUTHORITY DIAGNOSTIC
 * ============================================================
 */

function testGameTransactionAuthority() {

  var database =
    typeof getDatabaseSheet ===
    'function' &&
    typeof getRecord ===
    'function' &&
    typeof getAllRecords ===
    'function' &&
    typeof findRecords ===
    'function' &&
    typeof createRecord ===
    'function' &&
    typeof updateRecord ===
    'function';

  var currency =
    typeof normalizeGamingCurrency ===
      'function' &&
    (
      typeof getGamingCurrencyList ===
        'function' ||
      typeof getGamingCurrencies ===
        'function' ||
      typeof getSupportedGamingCurrencies ===
        'function'
    );

  var walletTransactions =
    typeof createWalletTransaction ===
    'function';

  var gameWalletApis =
    typeof createGameEntryFeeTransaction ===
      'function' &&
    typeof createGamePrizeTransaction ===
      'function' &&
    typeof createGameRefundTransaction ===
      'function';

  return {
    success:
      database &&
      currency &&
      walletTransactions &&
      gameWalletApis,

    version:
      GAME_TRANSACTION_CONFIG.VERSION,

    runtimeMarker:
      GAME_TRANSACTION_CONFIG.RUNTIME_MARKER,

    authorities: {
      database:
        database,
      currency:
        currency,
      walletTransactions:
        walletTransactions,
      gameWalletApis:
        gameWalletApis
    },

    directWalletAccountsMutation:
      false,

    mutationPerformed:
      false
  };
}


/* ============================================================
 * 27. CONFIG TEST
 * ============================================================
 */

function testGameTransactionConfig() {

  var c =
    GAME_TRANSACTION_CONFIG;

  var valid =
    c.VERSION === '1.2.0' &&
    c.TABLE_KEY === 'GAME_TRANSACTIONS' &&
    c.HEADERS.length === 22 &&
    c.UNIVERSAL_MAX_PLAYERS === 12 &&
    c.UNIVERSAL_PLAYER_POSITIONS.length === 12;

  return {
    success:
      valid,

    status:
      valid ? 'PASS' : 'FAIL',

    version:
      c.VERSION,

    runtimeMarker:
      c.RUNTIME_MARKER,

    table:
      c.TABLE_KEY,

    transactionTypeCount:
      c.TRANSACTION_TYPES.length,

    statusCount:
      c.STATUSES.length,

    referenceTypeCount:
      c.REFERENCE_TYPES.length,

    headerCount:
      c.HEADERS.length,

    universalMaxPlayers:
      c.UNIVERSAL_MAX_PLAYERS,

    universalPlayerPositions:
      c.UNIVERSAL_PLAYER_POSITIONS.slice(),

    mutationPerformed:
      false
  };
}


/* ============================================================
 * 28. SCHEMA TEST
 * ============================================================
 */

function testGameTransactionSchema() {

  var result =
    validateGameTransactionsSchema();

  return {
    success:
      !!result.success,

    status:
      result.success
        ? 'PASS'
        : 'FAIL',

    expectedCount:
      GAME_TRANSACTION_CONFIG
        .HEADERS.length,

    actualCount:
      result.actualCount,

    expectedHeaders:
      GAME_TRANSACTION_CONFIG
        .HEADERS.slice(),

    actualHeaders:
      result.actualHeaders,

    mutationPerformed:
      false,

    error:
      result.error || null
  };
}


/* ============================================================
 * 29. REQUIRED API TEST
 *
 * IMPORTANT:
 * Apps Script does not reliably expose top-level project
 * functions through `this[name]`.
 *
 * Therefore every required API is checked directly with
 * `typeof functionName`.
 * ============================================================
 */

function testGameTransactionRequiredApis() {

  var availability = {

    createGameEntryFeeTransaction:
      typeof createGameEntryFeeTransaction ===
      'function',

    createGamePrizeTransaction:
      typeof createGamePrizeTransaction ===
      'function',

    createGameRefundTransaction:
      typeof createGameRefundTransaction ===
      'function',

    getGameTransaction:
      typeof getGameTransaction ===
      'function',

    getAllGameTransactions:
      typeof getAllGameTransactions ===
      'function',

    getGameTransactions:
      typeof getGameTransactions ===
      'function',

    findGameTransactions:
      typeof findGameTransactions ===
      'function',

    reverseGameTransaction:
      typeof reverseGameTransaction ===
      'function'
  };

  var missing = [];

  Object.keys(availability)
    .forEach(
      function(name) {

        if (!availability[name]) {
          missing.push(name);
        }

      }
    );

  var success =
    missing.length === 0;

  return {

    success:
      success,

    status:
      success
        ? 'PASS'
        : 'FAIL',

    requiredApis: [
      'createGameEntryFeeTransaction',
      'createGamePrizeTransaction',
      'createGameRefundTransaction',
      'getGameTransaction',
      'getAllGameTransactions',
      'getGameTransactions',
      'findGameTransactions',
      'reverseGameTransaction'
    ],

    availability: {

      createGameEntryFeeTransaction:
        availability.createGameEntryFeeTransaction
          ? 'function'
          : 'missing',

      createGamePrizeTransaction:
        availability.createGamePrizeTransaction
          ? 'function'
          : 'missing',

      createGameRefundTransaction:
        availability.createGameRefundTransaction
          ? 'function'
          : 'missing',

      getGameTransaction:
        availability.getGameTransaction
          ? 'function'
          : 'missing',

      getAllGameTransactions:
        availability.getAllGameTransactions
          ? 'function'
          : 'missing',

      getGameTransactions:
        availability.getGameTransactions
          ? 'function'
          : 'missing',

      findGameTransactions:
        availability.findGameTransactions
          ? 'function'
          : 'missing',

      reverseGameTransaction:
        availability.reverseGameTransaction
          ? 'function'
          : 'missing'
    },

    missing:
      missing,

    requiredApisAvailable:
      success,

    mutationPerformed:
      false
  };
}


/* ============================================================
 * 30. FIND RECORDS SYNTAX TEST
 * ============================================================
 */

function testGameTransactionFindRecordsSyntax() {

  try {

    if (
      typeof findRecords !==
      'function'
    ) {
      throw new Error(
        'Database.gs findRecords() is unavailable.'
      );
    }

    var records =
      findRecords(
        GAME_TRANSACTION_CONFIG.TABLE_KEY,
        {}
      );

    if (!Array.isArray(records)) {
      throw new Error(
        'findRecords() must return an array.'
      );
    }

    return {
      success: true,
      status: 'PASS',
      table:
        GAME_TRANSACTION_CONFIG.TABLE_KEY,
      records:
        records.length,
      dataType:
        'array',
      mutationPerformed:
        false
    };

  } catch (error) {

    return {
      success: false,
      status: 'FAIL',
      table:
        GAME_TRANSACTION_CONFIG.TABLE_KEY,
      records: 0,
      dataType: null,
      error:
        error.message,
      mutationPerformed:
        false
    };
  }
}


/* ============================================================
 * 31. CURRENCY TEST
 * ============================================================
 */

function testGameTransactionCurrencyValidation() {

  try {

    var normalizedAvailable =
      typeof normalizeGamingCurrency ===
      'function';

    var listAvailable =
      typeof getGamingCurrencyList ===
      'function';

    var listSource =
      listAvailable
        ? 'getGamingCurrencyList'
        : (
          typeof getGamingCurrencies ===
          'function'
            ? 'getGamingCurrencies'
            : (
              typeof getSupportedGamingCurrencies ===
              'function'
                ? 'getSupportedGamingCurrencies'
                : null
            )
        );

    if (!normalizedAvailable) {
      throw new Error(
        'normalizeGamingCurrency() is unavailable.'
      );
    }

    if (!listSource) {
      throw new Error(
        'Canonical gaming currency list API is unavailable.'
      );
    }

    var list =
      gameTransactionGetCurrencyList_();

    var samples = [
      'MasterDiamond',
      'MasterSton',
      'MasterCoin',
      'MasterCrown',
      'MasterSilver'
    ];

    var canonicalSamples = {};

    samples.forEach(
      function(sample) {

        canonicalSamples[sample] =
          normalizeGamingCurrency(
            sample
          );

      }
    );

    return {
      success: true,
      status: 'PASS',
      authority:
        'RDEconomyCurrency.gs',
      normalizeGamingCurrency:
        true,
      currencyList:
        true,
      registrySource:
        listSource,
      registryCount:
        Array.isArray(list)
          ? list.length
          : 0,
      canonicalSamples:
        canonicalSamples,
      errors: [],
      mutationPerformed:
        false
    };

  } catch (error) {

    return {
      success: false,
      status: 'FAIL',
      authority:
        'RDEconomyCurrency.gs',
      error:
        error.message,
      mutationPerformed:
        false
    };
  }
}


/* ============================================================
 * 32. DATABASE RESOLUTION TEST
 * ============================================================
 */

function testGameTransactionDatabaseResolution() {

  try {

    if (
      typeof getDatabaseSheet !==
      'function'
    ) {
      throw new Error(
        'getDatabaseSheet() unavailable.'
      );
    }

    var sheet =
      getDatabaseSheet(
        GAME_TRANSACTION_CONFIG.TABLE_KEY
      );

    var headersAvailable =
      typeof getDatabaseHeaders ===
      'function';

    var headers =
      headersAvailable
        ? getDatabaseHeaders(
            GAME_TRANSACTION_CONFIG.TABLE_KEY
          )
        : [];

    return {
      success:
        !!sheet &&
        headersAvailable &&
        Array.isArray(headers),

      status:
        sheet &&
        headersAvailable &&
        Array.isArray(headers)
          ? 'PASS'
          : 'FAIL',

      version:
        GAME_TRANSACTION_CONFIG.VERSION,

      databaseAuthority:
        'Database.gs',

      requestedKey:
        GAME_TRANSACTION_CONFIG.TABLE_KEY,

      sheetName:
        GAME_TRANSACTION_CONFIG.SHEET_NAME,

      resolverAvailable:
        true,

      headersAvailable:
        headersAvailable,

      sheetExists:
        !!sheet,

      actualSheetName:
        sheet
          ? sheet.getName()
          : null,

      error:
        null,

      mutationPerformed:
        false
    };

  } catch (error) {

    return {
      success: false,
      status: 'FAIL',
      version:
        GAME_TRANSACTION_CONFIG.VERSION,
      databaseAuthority:
        'Database.gs',
      requestedKey:
        GAME_TRANSACTION_CONFIG.TABLE_KEY,
      resolverAvailable:
        typeof getDatabaseSheet ===
        'function',
      headersAvailable:
        false,
      sheetExists:
        false,
      actualSheetName:
        null,
      error:
        error.message,
      mutationPerformed:
        false
    };
  }
}


/* ============================================================
 * 33. UNIVERSAL P1-P12 TEST
 * ============================================================
 */

function testGameTransactionUniversalP1P12() {

  var expected =
    GAME_TRANSACTION_CONFIG
      .PLAYER_POSITIONS;

  var actual = [];

  for (
    var i = 1;
    i <= 12;
    i++
  ) {
    actual.push(
      gameTransactionGetPlayerPosition_(i)
    );
  }

  var exact =
    JSON.stringify(expected) ===
    JSON.stringify(actual);

  return {
    success:
      exact,

    status:
      exact ? 'PASS' : 'FAIL',

    universalMaxPlayers:
      12,

    expected:
      expected.slice(),

    actual:
      actual,

    mutationPerformed:
      false
  };
}


/* ============================================================
 * 34. GAME CAPACITY TEST
 * ============================================================
 */

function testGameTransactionGameCapacity() {

  var expected =
    gameTransactionExpectedGameCapacities_();

  var actual = {};
  var exact = true;

  Object.keys(expected)
    .forEach(
      function(game) {

        var limits =
          gameTransactionGetGameCapacity_(
            game
          );

        if (
          !limits ||
          Number(limits.minPlayers) !==
            Number(expected[game].minPlayers) ||
          Number(limits.maxPlayers) !==
            Number(expected[game].maxPlayers)
        ) {
          exact = false;
        }

        actual[game] = limits;
      }
    );

  return {
    success:
      exact,

    status:
      exact ? 'PASS' : 'FAIL',

    universalMaxPlayers:
      12,

    expected:
      expected,

    actual:
      actual,

    mutationPerformed:
      false
  };
}


/* ============================================================
 * 35. GAMEWALLET INTEGRATION TEST
 *
 * IMPORTANT:
 * Uses direct function references rather than `this[name]`.
 * ============================================================
 */

function testGameTransactionWalletIntegrationApis() {

  var entryFeeAvailable =
    typeof createGameEntryFeeTransaction ===
    'function';

  var prizeAvailable =
    typeof createGamePrizeTransaction ===
    'function';

  var refundAvailable =
    typeof createGameRefundTransaction ===
    'function';

  var walletReadApi =
    typeof getRecord ===
    'function';

  var missing = [];

  if (!entryFeeAvailable) {
    missing.push(
      'createGameEntryFeeTransaction'
    );
  }

  if (!prizeAvailable) {
    missing.push(
      'createGamePrizeTransaction'
    );
  }

  if (!refundAvailable) {
    missing.push(
      'createGameRefundTransaction'
    );
  }

  var success =
    missing.length === 0 &&
    walletReadApi === true;

  return {

    success:
      success,

    status:
      success
        ? 'PASS'
        : 'FAIL',

    gameWalletApis: {

      createGameEntryFeeTransaction:
        entryFeeAvailable
          ? 'function'
          : 'missing',

      createGamePrizeTransaction:
        prizeAvailable
          ? 'function'
          : 'missing',

      createGameRefundTransaction:
        refundAvailable
          ? 'function'
          : 'missing'
    },

    missing:
      missing,

    walletTransactionsReadApi:
      walletReadApi,

    directWalletAccountsMutation:
      false,

    mutationPerformed:
      false
  };
}


/* ============================================================
 * 36. CONTEXT DISCOVERY
 * ============================================================
 */

function testGameTransactionContextDiscovery() {

  var result = {
    success: true,
    status: 'PASS',
    game: null,
    room: null,
    player: null,
    wallet: null,
    hasGame: false,
    hasRoom: false,
    hasPlayer: false,
    hasWallet: false,
    errors: [],
    mutationPerformed: false
  };

  try {

    if (
      typeof getAllRecords !==
      'function'
    ) {
      return result;
    }

    var games =
      getAllRecords(
        'GAMES'
      );

    if (
      Array.isArray(games) &&
      games.length
    ) {

      result.game =
        games[0];

      result.hasGame =
        true;
    }

  } catch (error) {

    result.errors.push(
      'GAMES: ' +
      error.message
    );
  }

  try {

    var rooms =
      getAllRecords(
        'GAME_ROOMS'
      );

    if (
      Array.isArray(rooms) &&
      rooms.length
    ) {

      result.room =
        rooms[0];

      result.hasRoom =
        true;
    }

  } catch (error2) {

    result.errors.push(
      'GAME_ROOMS: ' +
      error2.message
    );
  }

  try {

    var players =
      getAllRecords(
        'GAME_PLAYERS'
      );

    if (
      Array.isArray(players) &&
      players.length
    ) {

      result.player =
        players[0];

      result.hasPlayer =
        true;
    }

  } catch (error3) {

    result.errors.push(
      'GAME_PLAYERS: ' +
      error3.message
    );
  }

  try {

    var wallets =
      getAllRecords(
        'WALLET_ACCOUNTS'
      );

    if (
      Array.isArray(wallets) &&
      wallets.length
    ) {

      result.wallet =
        wallets[0];

      result.hasWallet =
        true;
    }

  } catch (error4) {

    result.errors.push(
      'WALLET_ACCOUNTS: ' +
      error4.message
    );
  }

  /*
   * Discovery itself is read-only.
   * Empty tables are not failures.
   */
  return result;
}


/* ============================================================
 * 37. READ CONTRACT TEST
 * ============================================================
 */

function testGameTransactionReadContract() {

  try {

    var records =
      getAllGameTransactions();

    var valid =
      Array.isArray(records);

    return {
      success:
        valid,

      status:
        valid ? 'PASS' : 'FAIL',

      table:
        GAME_TRANSACTION_CONFIG.TABLE_KEY,

      count:
        valid
          ? records.length
          : 0,

      dataType:
        valid
          ? 'array'
          : typeof records,

      mutationPerformed:
        false,

      error:
        null
    };

  } catch (error) {

    return {
      success: false,
      status: 'FAIL',
      table:
        GAME_TRANSACTION_CONFIG.TABLE_KEY,
      count: 0,
      dataType: null,
      mutationPerformed:
        false,
      error:
        error.message
    };
  }
}


function testGameTransactionGetAll() {

  return testGameTransactionReadContract();
}


/* ============================================================
 * 38. SUMMARY TEST
 * ============================================================
 */

function getGameTransactionSummary() {

  var records =
    getAllGameTransactions();

  if (!Array.isArray(records)) {
    throw new Error(
      'getAllGameTransactions() must return an array.'
    );
  }

  var summary = {

    totalTransactions:
      records.length,

    totalAmount:
      0,

    pending:
      0,

    completed:
      0,

    reversed:
      0,

    cancelled:
      0,

    failed:
      0
  };

  records.forEach(
    function(record) {

      summary.totalAmount +=
        gameTransactionNumber_(
          gameTransactionField_(
            record,
            ['Amount']
          ),
          0
        );

      var status =
        gameTransactionUpper_(
          gameTransactionField_(
            record,
            ['Status']
          )
        );

      if (
        summary[
          status.toLowerCase()
        ] !== undefined
      ) {
        summary[
          status.toLowerCase()
        ]++;
      }

    }
  );

  summary.totalAmount =
    gameTransactionRound_(
      summary.totalAmount
    );

  return summary;
}


function testGameTransactionSummary() {

  try {

    var summary =
      getGameTransactionSummary();

    return {
      success: true,
      status: 'PASS',
      table:
        GAME_TRANSACTION_CONFIG.TABLE_KEY,
      count:
        summary.totalTransactions,
      dataType:
        'object',
      summary:
        summary,
      mutationPerformed:
        false,
      error:
        null
    };

  } catch (error) {

    return {
      success: false,
      status: 'FAIL',
      table:
        GAME_TRANSACTION_CONFIG.TABLE_KEY,
      count: 0,
      dataType: null,
      mutationPerformed:
        false,
      error:
        error.message
    };
  }
}


function testGameTransactionReadContractMaster() {

  var read =
    testGameTransactionReadContract();

  var summary =
    testGameTransactionSummary();

  return {
    success:
      read.success &&
      summary.success,

    status:
      read.success &&
      summary.success
        ? 'PASS'
        : 'FAIL',

    readContract:
      read.success,

    summaryContract:
      summary.success,

    read:
      read,

    summary:
      summary,

    mutationPerformed:
      false,

    errors:
      []
        .concat(
          read.error
            ? [read.error]
            : []
        )
        .concat(
          summary.error
            ? [summary.error]
            : []
        )
  };
}


/* ============================================================
 * 39. FULL READ-ONLY MASTER RUNTIME
 * ============================================================
 */

function testGameTransactionsFullSuite() {

  var tests = [

    [
      'testGameTransactionAuthority',
      testGameTransactionAuthority
    ],

    [
      'testGameTransactionConfig',
      testGameTransactionConfig
    ],

    [
      'testGameTransactionSchema',
      testGameTransactionSchema
    ],

    [
      'testGameTransactionRequiredApis',
      testGameTransactionRequiredApis
    ],

    [
      'testGameTransactionFindRecordsSyntax',
      testGameTransactionFindRecordsSyntax
    ],

    [
      'testGameTransactionCurrencyValidation',
      testGameTransactionCurrencyValidation
    ],

    [
      'testGameTransactionDatabaseResolution',
      testGameTransactionDatabaseResolution
    ],

    [
      'testGameTransactionUniversalP1P12',
      testGameTransactionUniversalP1P12
    ],

    [
      'testGameTransactionGameCapacity',
      testGameTransactionGameCapacity
    ],

    [
      'testGameTransactionWalletIntegrationApis',
      testGameTransactionWalletIntegrationApis
    ],

    [
      'testGameTransactionContextDiscovery',
      testGameTransactionContextDiscovery
    ],

    [
      'testGameTransactionSummary',
      testGameTransactionSummary
    ],

    [
      'testGameTransactionReadContractMaster',
      testGameTransactionReadContractMaster
    ]
  ];

  var results = [];
  var errors = [];
  var passed = 0;
  var failed = 0;
  var mutationPerformed = false;

  tests.forEach(
    function(test) {

      var name =
        test[0];

      var fn =
        test[1];

      try {

        if (
          typeof fn !==
          'function'
        ) {

          throw new Error(
            'Test function is unavailable: ' +
            name
          );
        }

        var result =
          fn();

        results.push({
          name: name,
          result: result
        });

        if (
          result &&
          result.mutationPerformed === true
        ) {
          mutationPerformed = true;
        }

        if (
          result &&
          result.success === true
        ) {
          passed++;
        } else {

          failed++;

          errors.push({
            test: name,
            error:
              result &&
              result.error
                ? result.error
                : 'Test returned success:false.'
          });
        }

      } catch (error) {

        failed++;

        results.push({
          name: name,
          result: {
            success: false,
            status: 'FAIL',
            error:
              error.message,
            mutationPerformed:
              false
          }
        });

        errors.push({
          test: name,
          error:
            error.message
        });
      }
    }
  );

  var success =
    failed === 0 &&
    passed === tests.length &&
    mutationPerformed === false;

  return {

    success:
      success,

    status:
      success
        ? 'PASS'
        : 'PENDING',

    version:
      GAME_TRANSACTION_CONFIG.VERSION,

    runtimeMarker:
      GAME_TRANSACTION_CONFIG.RUNTIME_MARKER,

    module:
      'GameTransactions',

    table:
      GAME_TRANSACTION_CONFIG.TABLE_KEY,

    suite:
      'READ_ONLY_MASTER_RUNTIME',

    testCount:
      tests.length,

    passed:
      passed,

    failed:
      failed,

    results:
      results,

    errors:
      errors,

    mutationPerformed:
      mutationPerformed,

    databaseAuthority:
      true,

    currencyAuthority:
      true,

    walletTransactionsAuthority:
      typeof createWalletTransaction ===
      'function',

    directWalletAccountsMutation:
      false,

    productionRuntimeStatus:
      success
        ? 'PASS'
        : 'PENDING'
  };
}


/* ============================================================
 * 40. COMPATIBILITY MASTER ALIAS
 * ============================================================
 */

function testGameTransactionsMasterRuntime() {
  return testGameTransactionsFullSuite();
}


/* ============================================================
 * 41. CONTROLLED CREATE TEST
 * ============================================================
 *
 * This is intentionally NOT part of the read-only master suite.
 *
 * It must only be run when a real controlled database mutation
 * is explicitly intended.
 *
 * ============================================================
 */

function testCreateGameTransactionControlled(
  input
) {

  if (!input) {

    return {
      success: false,
      status: 'FAIL',
      message:
        'Controlled mutation test requires explicit input.',
      mutationPerformed:
        false
    };
  }

  var result =
    createGameTransaction(
      input
    );

  if (result) {
    result.mutationPerformed =
      true;
  }

  return result;
}


/* ============================================================
 * 42. MODULE HEALTH
 *
 * IMPORTANT:
 * Uses direct function checks rather than `this[name]`.
 * ============================================================
 */

function gameTransactionsHealth() {

  var requiredApis = {

    createGameEntryFeeTransaction:
      typeof createGameEntryFeeTransaction ===
      'function',

    createGamePrizeTransaction:
      typeof createGamePrizeTransaction ===
      'function',

    createGameRefundTransaction:
      typeof createGameRefundTransaction ===
      'function',

    getGameTransaction:
      typeof getGameTransaction ===
      'function',

    getAllGameTransactions:
      typeof getAllGameTransactions ===
      'function',

    getGameTransactions:
      typeof getGameTransactions ===
      'function',

    findGameTransactions:
      typeof findGameTransactions ===
      'function',

    reverseGameTransaction:
      typeof reverseGameTransaction ===
      'function'
  };

  var missing = [];

  Object.keys(requiredApis)
    .forEach(
      function(name) {

        if (!requiredApis[name]) {
          missing.push(name);
        }

      }
    );

  var database =
    typeof getDatabaseSheet ===
      'function' &&
    typeof getDatabaseHeaders ===
      'function' &&
    typeof getRecord ===
      'function' &&
    typeof getAllRecords ===
      'function' &&
    typeof findRecords ===
      'function' &&
    typeof createRecord ===
      'function' &&
    typeof updateRecord ===
      'function';

  var currency =
    typeof normalizeGamingCurrency ===
      'function';

  var success =
    database &&
    currency &&
    missing.length === 0;

  return {

    success:
      success,

    status:
      success
        ? 'PASS'
        : 'FAIL',

    version:
      GAME_TRANSACTION_CONFIG.VERSION,

    runtimeMarker:
      GAME_TRANSACTION_CONFIG.RUNTIME_MARKER,

    module:
      'GameTransactions',

    table:
      GAME_TRANSACTION_CONFIG.TABLE_KEY,

    databaseAuthority:
      database,

    currencyAuthority:
      currency,

    requiredApisAvailable:
      missing.length === 0,

    missingApis:
      missing,

    universalMaxPlayers:
      GAME_TRANSACTION_CONFIG
        .UNIVERSAL_MAX_PLAYERS,

    universalPositions:
      GAME_TRANSACTION_CONFIG
        .UNIVERSAL_PLAYER_POSITIONS
        .slice(),

    directWalletAccountsMutation:
      false,

    mutationPerformed:
      false
  };
}


/* ============================================================
 * END — GameTransactions.gs v1.2.0
 * ============================================================
 */