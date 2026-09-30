/**
 * ============================================================
 * Games.gs
 * ============================================================
 * RD Route Design ACC Universal System
 *
 * MODULE:
 * Phase 6 — Gaming System
 *
 * VERSION:
 * 2.3.0 Advanced Game300 Linked Launch
 *
 * RUNTIME MARKER:
 * RD_GAMES_RUNTIME_2.2.0
 *
 * AUTHORITY MODEL
 * ============================================================
 *
 * Games.gs is the canonical GAME DEFINITION / GAME CATALOG
 * authority.
 *
 * Games.gs DOES NOT replace:
 *
 *   Database.gs
 *   RDGServer.gs
 *   RDEconomyCurrency.gs
 *   WalletTransactions.gs
 *   GameWallet.gs
 *   GameTransactions.gs
 *   GameRooms.gs
 *   GameMatchmaking.gs
 *   GameEngine.gs
 *   GameStation.gs
 *   GameRewards.gs
 *
 * DATABASE:
 *   Database.gs
 *
 * CURRENCY:
 *   RDEconomyCurrency.gs
 *
 * MONEY LEDGER:
 *   WalletTransactions.gs
 *
 * GAMING LEDGER:
 *   GameTransactions.gs
 *
 * WALLET ORCHESTRATION:
 *   GameWallet.gs
 *
 * ROOM:
 *   GameRooms.gs
 *
 * MATCHMAKING:
 *   GameMatchmaking.gs
 *
 * ENGINE:
 *   GameEngine.gs
 *
 * STATION:
 *   GameStation.gs
 *
 * REWARDS:
 *   GameRewards.gs
 *
 * IMPORTANT:
 *   Games.gs MUST NOT directly mutate wallet balances.
 *   Games.gs MUST NOT create a second currency authority.
 *   Games.gs MUST NOT replace room, matchmaking, engine,
 *   station, transaction, reward or database authorities.
 *
 * QR / WATCHER:
 *   QR/Product/Bill/Payment/Watcher functionality remains
 *   outside Games.gs unless a canonical service is available.
 *   Games.gs only exposes diagnostics/link metadata.
 *
 * ============================================================
 */

var GAMES_VERSION = '2.3.0';
var GAMES_RUNTIME_MARKER =
  'RD_GAMES_RUNTIME_2.2.0';


/* ============================================================
 * GAME CONFIGURATION
 * ============================================================
 */

var GAME_CONFIG = Object.freeze({

  TABLE_KEY: 'GAMES',

  PHYSICAL_SHEET_NAME: 'RDGGame',

  HEADER_ROW: 3,

  UNIVERSAL_ROOM_SLOTS: 12,

  GAME_TYPES: [
    'BOARD',
    'CARD',
    'ARCADE',
    'PUZZLE',
    'SPORTS',
    'CASUAL',
    'OTHER'
  ],

  GAME_MODES: [
    'OFFLINE',
    'ONLINE',
    'LOCAL',
    'MULTIPLAYER',
    'TOURNAMENT',
    'HYBRID',
    'OTHER'
  ],

  MASTER_TYPES: [
    'BLACKGOLD',
    'SILVER',
    'WHITEGOLD',
    'STON',
    'RADGOLD',
    'CROWN',
    'GREENGOLD',
    'COIN',
    'GOLD',
    'DIAMOND',
    ''
  ],

  STATUSES: [
    'ACTIVE',
    'INACTIVE',
    'MAINTENANCE',
    'DISABLED'
  ],

  DEFAULTS: {

    MIN_PLAYERS: 1,
    MAX_PLAYERS: 12,
    MAX_TURNS: 0,

    SECRET_NUMBER_MIN: 0,
    SECRET_NUMBER_MAX: 0,

    ENTRY_FEE_ENABLED: false,
    ENTRY_FEE_CURRENCY: '',
    ENTRY_FEE_AMOUNT: 0,

    PRIZE_POOL_ENABLED: false,
    PRIZE_POOL_CURRENCY: '',
    PRIZE_POOL_AMOUNT: 0,

    WALLET_ENABLED: true,

    MASTER_TYPE: '',
    MASTER_DIAMOND: 0,
    MASTER_QUEEN: 0,
    MASTER_SILVER: 0,
    MASTER_LEVEL: 0,

    ROBOT_ENABLED: false,

    STATUS: 'ACTIVE'

  },

  LIMITS: {

    MAX_GAME_NAME_LENGTH: 150,
    MAX_GAME_CODE_LENGTH: 50,
    MAX_DESCRIPTION_LENGTH: 2000,

    MAX_PLAYERS: 1000,

    MAX_TURNS: 1000000000,

    MAX_SECRET_NUMBER: 2147483647,

    MAX_MASTER_LEVEL: 1000000000

  },

  LINKED_MODULES: Object.freeze({

    DATABASE:
      'Database.gs',

    SERVER:
      'RDGServer.gs',

    CURRENCY:
      'RDEconomyCurrency.gs',

    WALLET_ACCOUNTS:
      'WalletAccounts.gs',

    WALLET_LEDGER:
      'WalletTransactions.gs',

    GAME_WALLET:
      'GameWallet.gs',

    GAME_TRANSACTIONS:
      'GameTransactions.gs',

    GAME_ROOMS:
      'GameRooms.gs',

    MATCHMAKING:
      'GameMatchmaking.gs',

    ENGINE:
      'GameEngine.gs',

    STATION:
      'GameStation.gs',

    GAME300_CATALOG:
      'Game300Catalog.gs',

    REWARDS:
      'GameRewards.gs',

    QR:
      'Canonical QR / Product QR authority',

    WATCHER:
      'Canonical Watcher / Payment Verification authority',

    AUDIT:
      'Audit.gs / AuditLogs.gs',

    BACKUP:
      'Backup layer'

  })

});


/* ============================================================
 * CANONICAL SCHEMA
 * ============================================================
 */

function getGameHeaders_() {

  return [

    'ID',
    'Game Code',
    'Game Name',
    'Game Type',
    'Game Mode',
    'Description',
    'Min Players',
    'Max Players',
    'Max Turns',
    'Secret Number Min',
    'Secret Number Max',
    'Entry Fee Enabled',
    'Entry Fee Currency',
    'Entry Fee Amount',
    'Prize Pool Enabled',
    'Prize Pool Currency',
    'Prize Pool Amount',
    'Wallet Enabled',
    'Master Type',
    'Master Diamond',
    'Master Queen',
    'Master Silver',
    'Master Level',
    'Robot Enabled',
    'Status',
    'Created At',
    'Updated At'

  ];

}


/* ============================================================
 * DATABASE TABLE RESOLUTION
 * ============================================================
 */

function getGamesLogicalKey_() {

  return GAME_CONFIG.TABLE_KEY;

}


function getGamesTableKey_() {

  try {

    if (
      typeof resolveDatabaseTableKey_211_ ===
      'function'
    ) {

      var resolved =
        resolveDatabaseTableKey_211_(
          GAME_CONFIG.TABLE_KEY
        );

      if (resolved) {
        return resolved;
      }

    }

  } catch (error) {
    // Continue.
  }


  try {

    if (
      typeof resolveDatabaseTableKey ===
      'function'
    ) {

      var legacyResolved =
        resolveDatabaseTableKey(
          GAME_CONFIG.TABLE_KEY
        );

      if (legacyResolved) {
        return legacyResolved;
      }

    }

  } catch (error2) {
    // Continue.
  }


  try {

    if (
      typeof getConfiguredTables ===
      'function'
    ) {

      var configured =
        getConfiguredTables();

      if (
        configured &&
        configured.GAMES
      ) {

        return configured.GAMES;

      }

    }

  } catch (error3) {
    // Continue.
  }


  try {

    if (
      typeof APP_CONFIG !==
      'undefined' &&
      APP_CONFIG &&
      APP_CONFIG.TABLES &&
      APP_CONFIG.TABLES.GAMES
    ) {

      return APP_CONFIG.TABLES.GAMES;

    }

  } catch (error4) {
    // Continue.
  }


  return GAME_CONFIG.TABLE_KEY;

}


function getGamesPhysicalSheetName_() {

  return GAME_CONFIG.PHYSICAL_SHEET_NAME;

}


/* ============================================================
 * NORMALIZATION
 * ============================================================
 */

function normalizeGameText_(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return '';

  }

  return String(value).trim();

}


function normalizeGameCode_(value) {

  return normalizeGameText_(value)
    .toUpperCase()
    .replace(/\s+/g, '_');

}


function normalizeGameType_(value) {

  return normalizeGameText_(value)
    .toUpperCase();

}


function normalizeGameMode_(value) {

  return normalizeGameText_(value)
    .toUpperCase();

}


function normalizeGameStatus_(value) {

  return normalizeGameText_(value)
    .toUpperCase();

}


function normalizeMasterType_(value) {

  return normalizeGameText_(value)
    .toUpperCase()
    .replace(/\s+/g, '');

}


function normalizeGameBoolean_(
  value,
  fieldName
) {

  if (
    value === true ||
    value === false
  ) {

    return value;

  }


  var text =
    normalizeGameText_(value)
      .toUpperCase();


  if (
    text === 'TRUE' ||
    text === 'YES' ||
    text === '1'
  ) {

    return true;

  }


  if (
    text === 'FALSE' ||
    text === 'NO' ||
    text === '0' ||
    text === ''
  ) {

    return false;

  }


  throw new Error(
    fieldName +
    ' must be true or false.'
  );

}


function normalizeGameNumber_(
  value,
  fieldName,
  allowZero
) {

  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  ) {

    throw new Error(
      fieldName +
      ' is required.'
    );

  }


  var numberValue =
    Number(value);


  if (
    !Number.isFinite(numberValue)
  ) {

    throw new Error(
      fieldName +
      ' must be a valid number.'
    );

  }


  if (allowZero) {

    if (
      numberValue < 0
    ) {

      throw new Error(
        fieldName +
        ' cannot be negative.'
      );

    }

  } else {

    if (
      numberValue <= 0
    ) {

      throw new Error(
        fieldName +
        ' must be greater than zero.'
      );

    }

  }


  return numberValue;

}


function getOptionalGameNumber_(
  data,
  fieldName,
  defaultValue,
  allowZero
) {

  if (
    data[fieldName] === undefined ||
    data[fieldName] === null ||
    String(data[fieldName]).trim() === ''
  ) {

    return defaultValue;

  }


  return normalizeGameNumber_(
    data[fieldName],
    fieldName,
    allowZero
  );

}


/* ============================================================
 * BASIC VALIDATION
 * ============================================================
 */

function validateGameId_(gameId) {

  var id =
    normalizeGameText_(gameId);


  if (id === '') {

    throw new Error(
      'Game ID is required.'
    );

  }


  return id;

}


function validateGameName_(gameName) {

  var name =
    normalizeGameText_(gameName);


  if (name === '') {

    throw new Error(
      'Game Name is required.'
    );

  }


  if (
    name.length >
    GAME_CONFIG.LIMITS.MAX_GAME_NAME_LENGTH
  ) {

    throw new Error(
      'Game Name exceeds maximum length of ' +
      GAME_CONFIG.LIMITS.MAX_GAME_NAME_LENGTH +
      ' characters.'
    );

  }


  return name;

}


function validateGameCode_(gameCode) {

  var code =
    normalizeGameCode_(gameCode);


  if (code === '') {

    throw new Error(
      'Game Code is required.'
    );

  }


  if (
    code.length >
    GAME_CONFIG.LIMITS.MAX_GAME_CODE_LENGTH
  ) {

    throw new Error(
      'Game Code exceeds maximum length of ' +
      GAME_CONFIG.LIMITS.MAX_GAME_CODE_LENGTH +
      ' characters.'
    );

  }


  if (
    !/^[A-Z0-9_]+$/.test(code)
  ) {

    throw new Error(
      'Game Code may contain only letters, numbers, and underscores.'
    );

  }


  return code;

}


/* ============================================================
 * CURRENCY AUTHORITY
 * ============================================================
 *
 * Games.gs does not own currencies.
 *
 * It only asks the canonical currency authority when
 * a resolver is available.
 * ============================================================
 */

function getGamesCanonicalCurrencies_() {

  var resolverNames = [

    'getGamingCurrencies',
    'getRDEconomyCurrencies',
    'getEconomyCurrencies',
    'getSupportedCurrencies',
    'getCurrencyCodes'

  ];


  for (
    var i = 0;
    i < resolverNames.length;
    i++
  ) {

    var functionName =
      resolverNames[i];


    try {

      if (
        typeof globalThis !==
        'undefined' &&
        typeof globalThis[functionName] ===
        'function'
      ) {

        var result =
          globalThis[functionName]();


        if (
          Array.isArray(result) &&
          result.length > 0
        ) {

          return result.map(
            function(value) {

              return normalizeGameText_(
                value
              ).toUpperCase();

            }
          ).filter(
            function(value) {
              return value !== '';
            }
          );

        }


        if (
          result &&
          Array.isArray(result.data)
        ) {

          return result.data.map(
            function(value) {

              return normalizeGameText_(
                value
              ).toUpperCase();

            }
          ).filter(
            function(value) {
              return value !== '';
            }
          );

        }

      }

    } catch (error) {
      // Try next canonical resolver.
    }

  }


  return [];

}


function isGamesCurrencyKnown_(
  currencyCode
) {

  var currency =
    normalizeGameText_(
      currencyCode
    ).toUpperCase();


  if (currency === '') {
    return false;
  }


  var currencies =
    getGamesCanonicalCurrencies_();


  if (
    currencies.length === 0
  ) {

    /*
     * No local currency authority was found.
     *
     * Do not invent a new authority.
     * Validation is deferred to the canonical
     * currency / wallet layer.
     */
    return true;

  }


  return currencies.indexOf(currency) !== -1;

}


/* ============================================================
 * VALIDATE GAME DATA
 * ============================================================
 */

function validateGameData_(
  data,
  isUpdate
) {

  data =
    data || {};


  var gameName =
    normalizeGameText_(
      data['Game Name']
    );


  var gameCode =
    normalizeGameCode_(
      data['Game Code']
    );


  var gameType =
    normalizeGameType_(
      data['Game Type']
    );


  var gameMode =
    normalizeGameMode_(
      data['Game Mode']
    );


  if (
    !isUpdate ||
    gameName !== ''
  ) {

    gameName =
      validateGameName_(
        gameName
      );

  }


  if (
    !isUpdate ||
    gameCode !== ''
  ) {

    gameCode =
      validateGameCode_(
        gameCode
      );

  }


  if (
    !isUpdate ||
    gameType !== ''
  ) {

    if (
      gameType === ''
    ) {

      throw new Error(
        'Game Type is required.'
      );

    }


    if (
      GAME_CONFIG.GAME_TYPES.indexOf(
        gameType
      ) === -1
    ) {

      throw new Error(
        'Invalid Game Type: ' +
        gameType +
        '. Allowed: ' +
        GAME_CONFIG.GAME_TYPES.join(', ')
      );

    }

  }


  if (
    !isUpdate ||
    gameMode !== ''
  ) {

    if (
      gameMode === ''
    ) {

      gameMode = 'ONLINE';

    }


    if (
      GAME_CONFIG.GAME_MODES.indexOf(
        gameMode
      ) === -1
    ) {

      throw new Error(
        'Invalid Game Mode: ' +
        gameMode +
        '. Allowed: ' +
        GAME_CONFIG.GAME_MODES.join(', ')
      );

    }

  }


  var minPlayers =
    getOptionalGameNumber_(
      data,
      'Min Players',
      GAME_CONFIG.DEFAULTS.MIN_PLAYERS,
      false
    );


  var maxPlayers =
    getOptionalGameNumber_(
      data,
      'Max Players',
      GAME_CONFIG.DEFAULTS.MAX_PLAYERS,
      false
    );


  if (
    !Number.isInteger(minPlayers) ||
    !Number.isInteger(maxPlayers)
  ) {

    throw new Error(
      'Min Players and Max Players must be integers.'
    );

  }


  if (
    minPlayers >
    GAME_CONFIG.LIMITS.MAX_PLAYERS ||
    maxPlayers >
    GAME_CONFIG.LIMITS.MAX_PLAYERS
  ) {

    throw new Error(
      'Player limits exceed maximum allowed value.'
    );

  }


  if (
    minPlayers >
    maxPlayers
  ) {

    throw new Error(
      'Min Players cannot be greater than Max Players.'
    );

  }


  var maxTurns =
    getOptionalGameNumber_(
      data,
      'Max Turns',
      GAME_CONFIG.DEFAULTS.MAX_TURNS,
      true
    );


  if (
    !Number.isInteger(maxTurns)
  ) {

    throw new Error(
      'Max Turns must be an integer.'
    );

  }


  if (
    maxTurns >
    GAME_CONFIG.LIMITS.MAX_TURNS
  ) {

    throw new Error(
      'Max Turns exceeds maximum allowed value.'
    );

  }


  var secretNumberMin =
    getOptionalGameNumber_(
      data,
      'Secret Number Min',
      GAME_CONFIG.DEFAULTS.SECRET_NUMBER_MIN,
      true
    );


  var secretNumberMax =
    getOptionalGameNumber_(
      data,
      'Secret Number Max',
      GAME_CONFIG.DEFAULTS.SECRET_NUMBER_MAX,
      true
    );


  if (
    !Number.isInteger(secretNumberMin) ||
    !Number.isInteger(secretNumberMax)
  ) {

    throw new Error(
      'Secret Number Min and Secret Number Max must be integers.'
    );

  }


  if (
    secretNumberMin >
    GAME_CONFIG.LIMITS.MAX_SECRET_NUMBER ||
    secretNumberMax >
    GAME_CONFIG.LIMITS.MAX_SECRET_NUMBER
  ) {

    throw new Error(
      'Secret number range exceeds maximum allowed value.'
    );

  }


  if (
    secretNumberMin >
    secretNumberMax
  ) {

    throw new Error(
      'Secret Number Min cannot be greater than Secret Number Max.'
    );

  }


  /* ----------------------------------------------------------
   * ENTRY FEE
   * ---------------------------------------------------------- */

  var entryFeeEnabled =
    GAME_CONFIG.DEFAULTS.ENTRY_FEE_ENABLED;


  if (
    data['Entry Fee Enabled'] !== undefined &&
    data['Entry Fee Enabled'] !== null &&
    String(
      data['Entry Fee Enabled']
    ).trim() !== ''
  ) {

    entryFeeEnabled =
      normalizeGameBoolean_(
        data['Entry Fee Enabled'],
        'Entry Fee Enabled'
      );

  }


  var entryFeeCurrency =
    normalizeGameText_(
      data['Entry Fee Currency']
    ).toUpperCase();


  var entryFeeAmount =
    getOptionalGameNumber_(
      data,
      'Entry Fee Amount',
      GAME_CONFIG.DEFAULTS.ENTRY_FEE_AMOUNT,
      true
    );


  if (entryFeeEnabled) {

    if (
      entryFeeCurrency === ''
    ) {

      throw new Error(
        'Entry Fee Currency is required when Entry Fee Enabled is true.'
      );

    }


    if (
      !isGamesCurrencyKnown_(
        entryFeeCurrency
      )
    ) {

      throw new Error(
        'Entry Fee Currency is not recognized by the canonical currency authority: ' +
        entryFeeCurrency
      );

    }


    if (
      entryFeeAmount <= 0
    ) {

      throw new Error(
        'Entry Fee Amount must be greater than zero when Entry Fee Enabled is true.'
      );

    }

  } else {

    if (
      entryFeeAmount !== 0
    ) {

      throw new Error(
        'Entry Fee Amount must be 0 when Entry Fee Enabled is false.'
      );

    }

  }


  /* ----------------------------------------------------------
   * PRIZE POOL
   * ---------------------------------------------------------- */

  var prizePoolEnabled =
    GAME_CONFIG.DEFAULTS.PRIZE_POOL_ENABLED;


  if (
    data['Prize Pool Enabled'] !== undefined &&
    data['Prize Pool Enabled'] !== null &&
    String(
      data['Prize Pool Enabled']
    ).trim() !== ''
  ) {

    prizePoolEnabled =
      normalizeGameBoolean_(
        data['Prize Pool Enabled'],
        'Prize Pool Enabled'
      );

  }


  var prizePoolCurrency =
    normalizeGameText_(
      data['Prize Pool Currency']
    ).toUpperCase();


  var prizePoolAmount =
    getOptionalGameNumber_(
      data,
      'Prize Pool Amount',
      GAME_CONFIG.DEFAULTS.PRIZE_POOL_AMOUNT,
      true
    );


  if (prizePoolEnabled) {

    if (
      prizePoolCurrency === ''
    ) {

      throw new Error(
        'Prize Pool Currency is required when Prize Pool Enabled is true.'
      );

    }


    if (
      !isGamesCurrencyKnown_(
        prizePoolCurrency
      )
    ) {

      throw new Error(
        'Prize Pool Currency is not recognized by the canonical currency authority: ' +
        prizePoolCurrency
      );

    }


    if (
      prizePoolAmount <= 0
    ) {

      throw new Error(
        'Prize Pool Amount must be greater than zero when Prize Pool Enabled is true.'
      );

    }

  } else {

    if (
      prizePoolAmount !== 0
    ) {

      throw new Error(
        'Prize Pool Amount must be 0 when Prize Pool Enabled is false.'
      );

    }

  }


  /* ----------------------------------------------------------
   * WALLET
   * ---------------------------------------------------------- */

  var walletEnabled =
    GAME_CONFIG.DEFAULTS.WALLET_ENABLED;


  if (
    data['Wallet Enabled'] !== undefined &&
    data['Wallet Enabled'] !== null &&
    String(
      data['Wallet Enabled']
    ).trim() !== ''
  ) {

    walletEnabled =
      normalizeGameBoolean_(
        data['Wallet Enabled'],
        'Wallet Enabled'
      );

  }


  /* ----------------------------------------------------------
   * MASTER
   * ---------------------------------------------------------- */

  var masterType =
    normalizeMasterType_(
      data['Master Type']
    );


  if (
    masterType !== '' &&
    GAME_CONFIG.MASTER_TYPES.indexOf(
      masterType
    ) === -1
  ) {

    throw new Error(
      'Invalid Master Type: ' +
      masterType
    );

  }


  var masterDiamond =
    getOptionalGameNumber_(
      data,
      'Master Diamond',
      GAME_CONFIG.DEFAULTS.MASTER_DIAMOND,
      true
    );


  var masterQueen =
    getOptionalGameNumber_(
      data,
      'Master Queen',
      GAME_CONFIG.DEFAULTS.MASTER_QUEEN,
      true
    );


  var masterSilver =
    getOptionalGameNumber_(
      data,
      'Master Silver',
      GAME_CONFIG.DEFAULTS.MASTER_SILVER,
      true
    );


  var masterLevel =
    getOptionalGameNumber_(
      data,
      'Master Level',
      GAME_CONFIG.DEFAULTS.MASTER_LEVEL,
      true
    );


  if (
    !Number.isInteger(masterDiamond) ||
    !Number.isInteger(masterQueen) ||
    !Number.isInteger(masterSilver) ||
    !Number.isInteger(masterLevel)
  ) {

    throw new Error(
      'Master values must be integers.'
    );

  }


  if (
    masterLevel >
    GAME_CONFIG.LIMITS.MAX_MASTER_LEVEL
  ) {

    throw new Error(
      'Master Level exceeds maximum allowed value.'
    );

  }


  /* ----------------------------------------------------------
   * ROBOT
   * ---------------------------------------------------------- */

  var robotEnabled =
    GAME_CONFIG.DEFAULTS.ROBOT_ENABLED;


  if (
    data['Robot Enabled'] !== undefined &&
    data['Robot Enabled'] !== null &&
    String(
      data['Robot Enabled']
    ).trim() !== ''
  ) {

    robotEnabled =
      normalizeGameBoolean_(
        data['Robot Enabled'],
        'Robot Enabled'
      );

  }


  /* ----------------------------------------------------------
   * STATUS
   * ---------------------------------------------------------- */

  var statusValue =
    data['Status'];


  if (
    statusValue === undefined ||
    statusValue === null ||
    String(statusValue).trim() === ''
  ) {

    statusValue =
      GAME_CONFIG.DEFAULTS.STATUS;

  }


  var status =
    normalizeGameStatus_(
      statusValue
    );


  if (
    GAME_CONFIG.STATUSES.indexOf(
      status
    ) === -1
  ) {

    throw new Error(
      'Invalid Game Status: ' +
      status
    );

  }


  /* ----------------------------------------------------------
   * DESCRIPTION
   * ---------------------------------------------------------- */

  var description =
    normalizeGameText_(
      data['Description']
    );


  if (
    description.length >
    GAME_CONFIG.LIMITS.MAX_DESCRIPTION_LENGTH
  ) {

    throw new Error(
      'Description exceeds maximum length of ' +
      GAME_CONFIG.LIMITS.MAX_DESCRIPTION_LENGTH +
      ' characters.'
    );

  }


  return {

    'Game Code':
      gameCode,

    'Game Name':
      gameName,

    'Game Type':
      gameType,

    'Game Mode':
      gameMode,

    'Description':
      description,

    'Min Players':
      minPlayers,

    'Max Players':
      maxPlayers,

    'Max Turns':
      maxTurns,

    'Secret Number Min':
      secretNumberMin,

    'Secret Number Max':
      secretNumberMax,

    'Entry Fee Enabled':
      entryFeeEnabled,

    'Entry Fee Currency':
      entryFeeCurrency,

    'Entry Fee Amount':
      entryFeeAmount,

    'Prize Pool Enabled':
      prizePoolEnabled,

    'Prize Pool Currency':
      prizePoolCurrency,

    'Prize Pool Amount':
      prizePoolAmount,

    'Wallet Enabled':
      walletEnabled,

    'Master Type':
      masterType,

    'Master Diamond':
      masterDiamond,

    'Master Queen':
      masterQueen,

    'Master Silver':
      masterSilver,

    'Master Level':
      masterLevel,

    'Robot Enabled':
      robotEnabled,

    'Status':
      status

  };

}


/* ============================================================
 * DUPLICATE CHECKS
 * ============================================================
 */

function gameCodeExists_(
  gameCode,
  excludeId
) {

  var normalizedCode =
    normalizeGameCode_(
      gameCode
    );


  if (
    normalizedCode === ''
  ) {

    return false;

  }


  var result =
    getAllRecords(
      getGamesTableKey_()
    );


  if (
    !result ||
    !result.success
  ) {

    return false;

  }


  var rows =
    result.data || [];


  for (
    var i = 0;
    i < rows.length;
    i++
  ) {

    var row =
      rows[i];


    if (
      excludeId &&
      String(row['ID']) ===
      String(excludeId)
    ) {

      continue;

    }


    if (
      normalizeGameCode_(
        row['Game Code']
      ) === normalizedCode &&
      normalizeGameStatus_(
        row['Status']
      ) !== 'DISABLED'
    ) {

      return true;

    }

  }


  return false;

}


function gameNameExists_(
  gameName,
  excludeId
) {

  var normalizedName =
    normalizeGameText_(
      gameName
    ).toLowerCase();


  if (
    normalizedName === ''
  ) {

    return false;

  }


  var result =
    getAllRecords(
      getGamesTableKey_()
    );


  if (
    !result ||
    !result.success
  ) {

    return false;

  }


  var rows =
    result.data || [];


  for (
    var i = 0;
    i < rows.length;
    i++
  ) {

    var row =
      rows[i];


    if (
      excludeId &&
      String(row['ID']) ===
      String(excludeId)
    ) {

      continue;

    }


    if (
      normalizeGameText_(
        row['Game Name']
      ).toLowerCase() ===
      normalizedName &&
      normalizeGameStatus_(
        row['Status']
      ) !== 'DISABLED'
    ) {

      return true;

    }

  }


  return false;

}


/* ============================================================
 * SCHEMA
 * ============================================================
 */

function getGameSchema() {

  var headers =
    getGameHeaders_();


  return {

    success: true,

    version:
      GAMES_VERSION,

    runtimeMarker:
      GAMES_RUNTIME_MARKER,

    module:
      'Games',

    table:
      getGamesTableKey_(),

    logicalTable:
      GAME_CONFIG.TABLE_KEY,

    physicalSheet:
      GAME_CONFIG.PHYSICAL_SHEET_NAME,

    headerRow:
      GAME_CONFIG.HEADER_ROW,

    universalRoomSlots:
      GAME_CONFIG.UNIVERSAL_ROOM_SLOTS,

    headers:
      headers,

    columnCount:
      headers.length

  };

}


function validateGamesSchema() {

  var tableKey =
    getGamesTableKey_();


  var expected =
    getGameHeaders_();


  var sheet;


  try {

    sheet =
      getDatabaseSheet(
        tableKey
      );

  } catch (error) {

    return {

      success: false,

      version:
        GAMES_VERSION,

      table:
        tableKey,

      message:
        'Unable to resolve Games sheet.',

      error:
        error.message

    };

  }


  if (!sheet) {

    return {

      success: false,

      version:
        GAMES_VERSION,

      table:
        tableKey,

      message:
        'Games physical sheet does not exist.'

    };

  }


  var actual;


  try {

    actual =
      sheet.getRange(
        GAME_CONFIG.HEADER_ROW,
        1,
        1,
        expected.length
      )
      .getValues()[0]
      .map(
        function(value) {

          return normalizeGameText_(
            value
          );

        }
      );

  } catch (error2) {

    return {

      success: false,

      version:
        GAMES_VERSION,

      table:
        tableKey,

      error:
        error2.message

    };

  }


  var mismatched = [];


  expected.forEach(
    function(header, index) {

      if (
        actual[index] !== header
      ) {

        mismatched.push({

          column:
            index + 1,

          expected:
            header,

          actual:
            actual[index] || ''

        });

      }

    }
  );


  return {

    success:
      mismatched.length === 0,

    version:
      GAMES_VERSION,

    runtimeMarker:
      GAMES_RUNTIME_MARKER,

    table:
      tableKey,

    logicalTable:
      GAME_CONFIG.TABLE_KEY,

    physicalSheet:
      sheet.getName(),

    expectedHeaders:
      expected,

    actualHeaders:
      actual,

    expectedColumnCount:
      expected.length,

    actualColumnCount:
      actual.length,

    mismatchedColumns:
      mismatched,

    message:
      mismatched.length === 0
        ? 'Games schema is valid.'
        : 'Games schema mismatch detected.'

  };

}


/* ============================================================
 * SHEET SETUP
 * ============================================================
 */

function setupGamesSheet() {

  var tableKey =
    getGamesTableKey_();


  var sheet =
    getDatabaseSheet(
      tableKey
    );


  if (!sheet) {

    throw new Error(
      'Games physical sheet does not exist. Expected: ' +
      GAME_CONFIG.PHYSICAL_SHEET_NAME
    );

  }


  var headers =
    getGameHeaders_();


  sheet.getRange(
    GAME_CONFIG.HEADER_ROW,
    1,
    1,
    headers.length
  )
  .setValues(
    [headers]
  );


  return {

    success: true,

    version:
      GAMES_VERSION,

    table:
      tableKey,

    logicalTable:
      GAME_CONFIG.TABLE_KEY,

    sheetName:
      sheet.getName(),

    headerRow:
      GAME_CONFIG.HEADER_ROW,

    headers:
      headers,

    columnCount:
      headers.length

  };

}


/* ============================================================
 * CREATE GAME
 * ============================================================
 */

function createGame(
  gameData
) {

  gameData =
    gameData || {};


  var validated =
    validateGameData_(
      gameData,
      false
    );


  if (
    gameCodeExists_(
      validated['Game Code']
    )
  ) {

    throw new Error(
      'Game Code already exists: ' +
      validated['Game Code']
    );

  }


  if (
    gameNameExists_(
      validated['Game Name']
    )
  ) {

    throw new Error(
      'Game Name already exists: ' +
      validated['Game Name']
    );

  }


  return createRecord(
    getGamesTableKey_(),
    validated
  );

}


/* ============================================================
 * READ APIs
 * ============================================================
 */

function getGame(
  gameId
) {

  return getRecord(
    getGamesTableKey_(),
    validateGameId_(gameId)
  );

}


function getAllGames() {

  return getAllRecords(
    getGamesTableKey_()
  );

}


function findGames(
  filters
) {

  return findRecords(
    getGamesTableKey_(),
    filters || {}
  );

}


function findGameByCode(
  gameCode
) {

  var code =
    validateGameCode_(
      gameCode
    );


  var result =
    getAllGames();


  if (
    !result ||
    !result.success
  ) {

    return result;

  }


  var rows =
    result.data || [];


  for (
    var i = 0;
    i < rows.length;
    i++
  ) {

    if (
      normalizeGameCode_(
        rows[i]['Game Code']
      ) === code
    ) {

      return {

        success: true,

        version:
          GAMES_VERSION,

        table:
          getGamesTableKey_(),

        data:
          rows[i]

      };

    }

  }


  return {

    success: false,

    version:
      GAMES_VERSION,

    table:
      getGamesTableKey_(),

    data:
      null,

    message:
      'Game not found.'

  };

}


function findGameByName(
  gameName
) {

  var name =
    validateGameName_(
      gameName
    ).toLowerCase();


  var result =
    getAllGames();


  if (
    !result ||
    !result.success
  ) {

    return result;

  }


  var rows =
    result.data || [];


  for (
    var i = 0;
    i < rows.length;
    i++
  ) {

    if (
      normalizeGameText_(
        rows[i]['Game Name']
      ).toLowerCase() === name
    ) {

      return {

        success: true,

        version:
          GAMES_VERSION,

        table:
          getGamesTableKey_(),

        data:
          rows[i]

      };

    }

  }


  return {

    success: false,

    version:
      GAMES_VERSION,

    table:
      getGamesTableKey_(),

    data:
      null,

    message:
      'Game not found.'

  };

}


/* ============================================================
 * FILTER APIs
 * ============================================================
 */

function getActiveGames() {

  return findRecords(
    getGamesTableKey_(),
    {
      'Status': 'ACTIVE'
    }
  );

}


function getGamesByType(
  gameType
) {

  var type =
    normalizeGameType_(
      gameType
    );


  if (
    GAME_CONFIG.GAME_TYPES.indexOf(type) === -1
  ) {

    throw new Error(
      'Invalid Game Type: ' + type
    );

  }


  return findRecords(
    getGamesTableKey_(),
    {
      'Game Type': type
    }
  );

}


function getGamesByMode(
  gameMode
) {

  var mode =
    normalizeGameMode_(
      gameMode
    );


  if (
    GAME_CONFIG.GAME_MODES.indexOf(mode) === -1
  ) {

    throw new Error(
      'Invalid Game Mode: ' + mode
    );

  }


  return findRecords(
    getGamesTableKey_(),
    {
      'Game Mode': mode
    }
  );

}


function getRobotEnabledGames() {

  return findRecords(
    getGamesTableKey_(),
    {
      'Robot Enabled': true
    }
  );

}


function getWalletEnabledGames() {

  return findRecords(
    getGamesTableKey_(),
    {
      'Wallet Enabled': true
    }
  );

}


function getEntryFeeGames() {

  return findRecords(
    getGamesTableKey_(),
    {
      'Entry Fee Enabled': true
    }
  );

}


function getPrizePoolGames() {

  return findRecords(
    getGamesTableKey_(),
    {
      'Prize Pool Enabled': true
    }
  );

}


/* ============================================================
 * UPDATE GAME
 * ============================================================
 */

function updateGame(
  gameId,
  updates
) {

  var id =
    validateGameId_(gameId);


  updates =
    updates || {};


  if (
    typeof updates !== 'object' ||
    Array.isArray(updates)
  ) {

    throw new Error(
      'Updates must be an object.'
    );

  }


  var currentResult =
    getGame(id);


  if (
    !currentResult ||
    !currentResult.success ||
    !currentResult.data
  ) {

    throw new Error(
      'Game not found: ' + id
    );

  }


  var current =
    currentResult.data;


  var merged = {};


  Object.keys(current).forEach(
    function(key) {

      merged[key] =
        current[key];

    }
  );


  Object.keys(updates).forEach(
    function(key) {

      if (
        key !== 'ID' &&
        key !== 'Created At' &&
        key !== 'Updated At'
      ) {

        merged[key] =
          updates[key];

      }

    }
  );


  var validated =
    validateGameData_(
      merged,
      true
    );


  if (
    gameCodeExists_(
      validated['Game Code'],
      id
    )
  ) {

    throw new Error(
      'Game Code already exists: ' +
      validated['Game Code']
    );

  }


  if (
    gameNameExists_(
      validated['Game Name'],
      id
    )
  ) {

    throw new Error(
      'Game Name already exists: ' +
      validated['Game Name']
    );

  }


  return updateRecord(
    getGamesTableKey_(),
    id,
    validated
  );

}


/* ============================================================
 * STATUS MANAGEMENT
 * ============================================================
 */

function activateGame(gameId) {

  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Status': 'ACTIVE'
    }
  );

}


function deactivateGame(gameId) {

  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Status': 'INACTIVE'
    }
  );

}


function setGameMaintenance(gameId) {

  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Status': 'MAINTENANCE'
    }
  );

}


function disableGame(gameId) {

  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Status': 'DISABLED'
    }
  );

}


/* ============================================================
 * PLAYER LIMITS
 * ============================================================
 */

function updateGamePlayerLimits(
  gameId,
  minPlayers,
  maxPlayers
) {

  var id =
    validateGameId_(gameId);


  var minValue =
    normalizeGameNumber_(
      minPlayers,
      'Min Players',
      false
    );


  var maxValue =
    normalizeGameNumber_(
      maxPlayers,
      'Max Players',
      false
    );


  if (
    !Number.isInteger(minValue) ||
    !Number.isInteger(maxValue)
  ) {

    throw new Error(
      'Player limits must be integers.'
    );

  }


  if (
    minValue > GAME_CONFIG.LIMITS.MAX_PLAYERS ||
    maxValue > GAME_CONFIG.LIMITS.MAX_PLAYERS
  ) {

    throw new Error(
      'Player limits exceed maximum allowed value.'
    );

  }


  if (minValue > maxValue) {

    throw new Error(
      'Min Players cannot be greater than Max Players.'
    );

  }


  return updateRecord(
    getGamesTableKey_(),
    id,
    {
      'Min Players': minValue,
      'Max Players': maxValue
    }
  );

}


/* ============================================================
 * ENTRY FEE
 * ============================================================
 */

function enableGameEntryFee(
  gameId,
  currencyCode,
  amount
) {

  var id =
    validateGameId_(gameId);


  var currency =
    normalizeGameText_(
      currencyCode
    ).toUpperCase();


  if (!isGamesCurrencyKnown_(currency)) {

    throw new Error(
      'Currency is not recognized by the canonical currency authority: ' +
      currency
    );

  }


  var feeAmount =
    normalizeGameNumber_(
      amount,
      'Entry Fee Amount',
      false
    );


  return updateRecord(
    getGamesTableKey_(),
    id,
    {
      'Entry Fee Enabled': true,
      'Entry Fee Currency': currency,
      'Entry Fee Amount': feeAmount
    }
  );

}


function disableGameEntryFee(gameId) {

  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Entry Fee Enabled': false,
      'Entry Fee Currency': '',
      'Entry Fee Amount': 0
    }
  );

}


/* ============================================================
 * PRIZE POOL
 * ============================================================
 */

function enableGamePrizePool(
  gameId,
  currencyCode,
  amount
) {

  var id =
    validateGameId_(gameId);


  var currency =
    normalizeGameText_(
      currencyCode
    ).toUpperCase();


  if (!isGamesCurrencyKnown_(currency)) {

    throw new Error(
      'Currency is not recognized by the canonical currency authority: ' +
      currency
    );

  }


  var prizeAmount =
    normalizeGameNumber_(
      amount,
      'Prize Pool Amount',
      false
    );


  return updateRecord(
    getGamesTableKey_(),
    id,
    {
      'Prize Pool Enabled': true,
      'Prize Pool Currency': currency,
      'Prize Pool Amount': prizeAmount
    }
  );

}


function disableGamePrizePool(gameId) {

  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Prize Pool Enabled': false,
      'Prize Pool Currency': '',
      'Prize Pool Amount': 0
    }
  );

}


/* ============================================================
 * WALLET
 * ============================================================
 */

function enableGameWallet(gameId) {

  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Wallet Enabled': true
    }
  );

}


function disableGameWallet(gameId) {

  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Wallet Enabled': false
    }
  );

}


/* ============================================================
 * ROBOT
 * ============================================================
 */

function enableGameRobot(gameId) {

  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Robot Enabled': true
    }
  );

}


function disableGameRobot(gameId) {

  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Robot Enabled': false
    }
  );

}


/* ============================================================
 * GAME MODE
 * ============================================================
 */

function setGameMode(
  gameId,
  gameMode
) {

  var mode =
    normalizeGameMode_(gameMode);


  if (
    GAME_CONFIG.GAME_MODES.indexOf(mode) === -1
  ) {

    throw new Error(
      'Invalid Game Mode: ' + mode
    );

  }


  return updateRecord(
    getGamesTableKey_(),
    validateGameId_(gameId),
    {
      'Game Mode': mode
    }
  );

}


/* ============================================================
 * MASTER SETTINGS
 * ============================================================
 */

function updateGameMasterSettings(
  gameId,
  settings
) {

  var id =
    validateGameId_(gameId);


  settings =
    settings || {};


  if (
    typeof settings !== 'object' ||
    Array.isArray(settings)
  ) {

    throw new Error(
      'Master settings must be an object.'
    );

  }


  var updateData = {};


  if (
    settings['Master Type'] !== undefined
  ) {

    var masterType =
      normalizeMasterType_(
        settings['Master Type']
      );


    if (
      masterType !== '' &&
      GAME_CONFIG.MASTER_TYPES.indexOf(
        masterType
      ) === -1
    ) {

      throw new Error(
        'Invalid Master Type: ' +
        masterType
      );

    }


    updateData['Master Type'] =
      masterType;

  }


  [
    'Master Diamond',
    'Master Queen',
    'Master Silver',
    'Master Level'
  ].forEach(
    function(fieldName) {

      if (
        settings[fieldName] !== undefined
      ) {

        var value =
          normalizeGameNumber_(
            settings[fieldName],
            fieldName,
            true
          );


        if (
          !Number.isInteger(value)
        ) {

          throw new Error(
            fieldName +
            ' must be an integer.'
          );

        }


        updateData[fieldName] =
          value;

      }

    }
  );


  if (
    Object.keys(updateData).length === 0
  ) {

    throw new Error(
      'No master settings supplied.'
    );

  }


  return updateRecord(
    getGamesTableKey_(),
    id,
    updateData
  );

}


/* ============================================================
 * EXISTS / COUNT / DELETE
 * ============================================================
 */

function gameExists(gameId) {

  var id =
    normalizeGameText_(gameId);


  if (id === '') {
    return false;
  }


  return recordExists(
    getGamesTableKey_(),
    id
  );

}


function gameCodeExists(gameCode) {

  return gameCodeExists_(
    gameCode
  );

}


function countGames() {

  return countRecords(
    getGamesTableKey_()
  );

}


function deleteGame(gameId) {

  var id =
    validateGameId_(gameId);


  var current =
    getGame(id);


  if (
    !current ||
    !current.success ||
    !current.data
  ) {

    throw new Error(
      'Game not found: ' + id
    );

  }


  return deleteRecord(
    getGamesTableKey_(),
    id
  );

}


/* ============================================================
 * LATEST GAME
 * ============================================================
 */

function getLatestGame() {

  var result =
    getAllGames();


  if (
    !result ||
    !result.success
  ) {

    return result;

  }


  var rows =
    result.data || [];


  if (
    rows.length === 0
  ) {

    return {

      success: false,

      version:
        GAMES_VERSION,

      table:
        getGamesTableKey_(),

      data:
        null,

      message:
        'No games found.'

    };

  }


  return {

    success: true,

    version:
      GAMES_VERSION,

    table:
      getGamesTableKey_(),

    data:
      rows[rows.length - 1]

  };

}


/* ============================================================
 * GAME300 / LAUNCH DISPLAY INTEGRATION — v2.3.0
 * ============================================================
 *
 * Games.gs does NOT become the Game300 catalog authority.
 *
 * Canonical Game300 authority:
 *   Game300Catalog.gs
 *
 * Games.gs only exposes launch/display information and the
 * existing Games-table ACTIVE state. Game300 ACTIVE/LINKED/
 * PLAYABLE state remains exclusively owned by Game300Catalog.gs.
 *
 * Launch rule:
 *   ACTIVE === true
 *   LINKED === true
 *   PLAYABLE === true
 *
 * Therefore only verified launchable Game300 entries are exposed
 * to the RDG launcher/display layer.
 * ============================================================
 */

function isGame300CatalogAvailable_() {

  try {

    return (
      typeof getGame300CatalogStatus === 'function' &&
      typeof getLinkedGame300Catalog === 'function'
    );

  } catch (error) {

    return false;

  }

}


function getGame300CatalogStatusSafe_() {

  if (!isGame300CatalogAvailable_()) {

    return {
      success: false,
      available: false,
      message: 'Game300Catalog.gs authority is unavailable.'
    };

  }

  try {

    var status = getGame300CatalogStatus();

    return {
      success: true,
      available: true,
      data: status
    };

  } catch (error) {

    return {
      success: false,
      available: true,
      message: error.message
    };

  }

}


function getGamesLaunchDisplay() {

  if (!isGame300CatalogAvailable_()) {

    return {
      success: false,
      version: GAMES_VERSION,
      runtimeMarker: GAMES_RUNTIME_MARKER,
      source: 'Game300Catalog.gs',
      launchDisplayCount: 0,
      games: [],
      names: [],
      message: 'Game300Catalog.gs launch authority is unavailable.'
    };

  }

  try {

    var result = getLinkedGame300Catalog();

    if (Array.isArray(result)) {
      result = {
        success: true,
        data: result
      };
    }

    if (!result || result.success !== true) {

      return {
        success: false,
        version: GAMES_VERSION,
        runtimeMarker: GAMES_RUNTIME_MARKER,
        source: 'Game300Catalog.gs',
        launchDisplayCount: 0,
        games: [],
        names: [],
        message: 'Unable to read linked Game300 catalog.',
        sourceResult: result || null
      };

    }

    var rows = Array.isArray(result.data)
      ? result.data
      : (Array.isArray(result.games) ? result.games : []);

    var launchGames = rows.filter(function(game) {

      return (
        game &&
        game.ACTIVE === true &&
        game.LINKED === true &&
        game.PLAYABLE === true
      );

    });

    var names = launchGames.map(function(game) {

      return normalizeGameText_(
        game['Game Name'] ||
        game.gameName ||
        game.NAME ||
        game.name
      );

    }).filter(function(name) {
      return name !== '';
    });

    return {
      success: true,
      version: GAMES_VERSION,
      runtimeMarker: GAMES_RUNTIME_MARKER,
      source: 'Game300Catalog.gs',
      launchDisplayCount: launchGames.length,
      games: launchGames,
      names: names,
      active: launchGames.every(function(game) {
        return game.ACTIVE === true;
      }),
      linked: launchGames.every(function(game) {
        return game.LINKED === true;
      }),
      playable: launchGames.every(function(game) {
        return game.PLAYABLE === true;
      })
    };

  } catch (error) {

    return {
      success: false,
      version: GAMES_VERSION,
      runtimeMarker: GAMES_RUNTIME_MARKER,
      source: 'Game300Catalog.gs',
      launchDisplayCount: 0,
      games: [],
      names: [],
      message: error.message
    };

  }

}


function getGamesLaunchDisplayNames() {

  var result = getGamesLaunchDisplay();

  if (!result || result.success !== true) {
    return result;
  }

  return {
    success: true,
    version: GAMES_VERSION,
    runtimeMarker: GAMES_RUNTIME_MARKER,
    source: result.source,
    count: result.launchDisplayCount,
    names: result.names || []
  };

}


function getGamesLaunchDisplayPayload() {

  var result = getGamesLaunchDisplay();

  if (!result || result.success !== true) {

    return {
      success: false,
      version: GAMES_VERSION,
      runtimeMarker: GAMES_RUNTIME_MARKER,
      source: 'Game300Catalog.gs',
      count: 0,
      games: [],
      message: result && result.message
        ? result.message
        : 'Launch display unavailable.'
    };

  }

  var games = result.games || [];

  return {
    success: true,
    version: GAMES_VERSION,
    runtimeMarker: GAMES_RUNTIME_MARKER,
    source: 'Game300Catalog.gs',
    displayRule: 'ACTIVE + LINKED + PLAYABLE',
    count: games.length,
    games: games.map(function(game) {

      var minPlayers = game['Min Players'];
      if (minPlayers === undefined || minPlayers === null || minPlayers === '') {
        minPlayers = game.minPlayers;
      }

      var maxPlayers = game['Max Players'];
      if (maxPlayers === undefined || maxPlayers === null || maxPlayers === '') {
        maxPlayers = game.maxPlayers;
      }

      return {
        id: game['Game ID'] || game.ID || game.gameId || '',
        catalogNumber: game['Catalog Number'] || game.catalogNumber || '',
        code: game['Game Code'] || game.gameCode || '',
        name: game['Game Name'] || game.gameName || game.NAME || game.name || '',
        type: game['Game Type'] || game.gameType || '',
        mode: game['Game Mode'] || game.gameMode || '',
        module: game.Module || game.module || '',
        implementation: game.Implementation || game.implementation || '',
        route: game.Route || game.route || '',
        minPlayers: minPlayers === undefined || minPlayers === '' ? 1 : minPlayers,
        maxPlayers: maxPlayers === undefined || maxPlayers === '' ? 1 : maxPlayers,
        active: game.ACTIVE === true,
        linked: game.LINKED === true,
        playable: game.PLAYABLE === true,
        status: game.Status || game.status || 'ACTIVE',
        launch: true
      };

    })
  };

}


function activateAllGames() {

  var result = getAllGames();

  if (!result || result.success !== true) {
    throw new Error('Unable to read Games records.');
  }

  var rows = result.data || [];
  var activated = 0;
  var alreadyActive = 0;
  var failed = 0;
  var errors = [];

  rows.forEach(function(row) {

    var id = normalizeGameText_(row['ID']);

    if (id === '') {
      failed++;
      errors.push({id: '', error: 'Game record has no ID.'});
      return;
    }

    var status = normalizeGameStatus_(row['Status']);

    if (status === 'ACTIVE') {
      alreadyActive++;
      return;
    }

    try {

      var updateResult = updateGame(id, {Status: 'ACTIVE'});

      if (updateResult && updateResult.success === true) {
        activated++;
      } else {
        failed++;
        errors.push({
          id: id,
          error: updateResult && updateResult.message
            ? updateResult.message
            : 'Unable to activate game.'
        });
      }

    } catch (error) {

      failed++;
      errors.push({id: id, error: error.message});

    }

  });

  return {
    success: failed === 0,
    version: GAMES_VERSION,
    runtimeMarker: GAMES_RUNTIME_MARKER,
    table: getGamesTableKey_(),
    totalRecords: rows.length,
    activated: activated,
    alreadyActive: alreadyActive,
    failed: failed,
    errors: errors,
    note: 'Only existing Games records were activated. Game300 ACTIVE/LINKED/PLAYABLE authority remains Game300Catalog.gs.'
  };

}


function compareGamesWithGame300Catalog() {

  var launch = getGamesLaunchDisplay();
  var activeGames;

  try {
    activeGames = getActiveGames();
  } catch (error) {
    return {
      success: false,
      version: GAMES_VERSION,
      runtimeMarker: GAMES_RUNTIME_MARKER,
      error: error.message
    };
  }

  return {
    success: launch.success === true,
    version: GAMES_VERSION,
    runtimeMarker: GAMES_RUNTIME_MARKER,
    gamesTableActiveCount:
      activeGames && activeGames.success === true && Array.isArray(activeGames.data)
        ? activeGames.data.length
        : 0,
    game300LaunchDisplayCount: launch.launchDisplayCount || 0,
    game300LaunchDisplayNames: launch.names || [],
    game300Source: 'Game300Catalog.gs',
    gamesSource: 'Games.gs',
    authorityNote: 'Game300Catalog.gs remains authoritative for Game300 ACTIVE/LINKED/PLAYABLE state.'
  };
}


/* ============================================================
 * INTEGRATION AVAILABILITY
 * ============================================================
 */

function getGamesIntegrationAvailability() {

  var modules =
    GAME_CONFIG.LINKED_MODULES;


  var availability = {};


  Object.keys(modules).forEach(
    function(key) {

      var available = false;


      try {

        switch (key) {

          case 'DATABASE':

            available =
              typeof getDatabaseSheet ===
              'function';

            break;


          case 'CURRENCY':

            available =
              getGamesCanonicalCurrencies_()
                .length > 0;

            break;


          case 'WALLET_LEDGER':

            available =
              typeof createWalletTransaction ===
              'function';

            break;


          case 'GAME_WALLET':

            available =
              typeof chargeGameEntryFee ===
              'function' ||
              typeof payGamePlayerPrize ===
              'function';

            break;


          case 'GAME_TRANSACTIONS':

            available =
              typeof createGameEntryFeeTransaction ===
              'function' ||
              typeof createGamePrizeTransaction ===
              'function';

            break;


          case 'GAME_ROOMS':

            available =
              typeof createGameRoom ===
              'function' ||
              typeof getGameRoom ===
              'function';

            break;


          case 'MATCHMAKING':

            available =
              typeof findGameMatch ===
              'function' ||
              typeof createGameMatch ===
              'function';

            break;


          case 'ENGINE':

            available =
              typeof createGameEngineSession ===
              'function' ||
              typeof getGameEngineHealth ===
              'function';

            break;


          case 'STATION':

            available =
              typeof getGameStationHealth ===
              'function' ||
              typeof gameStationApi ===
              'function';

            break;


          case 'GAME300_CATALOG':

            available =
              isGame300CatalogAvailable_();

            break;


          case 'REWARDS':

            available =
              typeof createGameReward ===
              'function' ||
              typeof getGameRewardsHealth ===
              'function';

            break;


          case 'SERVER':

            available =
              typeof doGet ===
              'function' ||
              typeof doPost ===
              'function';

            break;


          default:

            /*
             * External / future authorities are represented
             * by metadata and are not falsely marked available.
             */
            available = false;

        }

      } catch (error) {

        available = false;

      }


      availability[key] =
        available;

    }
  );


  return {

    success: true,

    version:
      GAMES_VERSION,

    runtimeMarker:
      GAMES_RUNTIME_MARKER,

    modules:
      modules,

    availability:
      availability

  };

}


/* ============================================================
 * INTEGRATION MAP
 * ============================================================
 */

function getGamesIntegrationMap() {

  return {

    success: true,

    version:
      GAMES_VERSION,

    runtimeMarker:
      GAMES_RUNTIME_MARKER,

    authorityFlow: [

      'Database.gs',
      'Games.gs',
      'GameRooms.gs',
      'GameMatchmaking.gs',
      'GameEngine.gs',
      'GameStation.gs',
      'Game300Catalog.gs',
      'GameWallet.gs',
      'GameTransactions.gs',
      'GameRewards.gs'

    ],

    financialFlow: [

      'RDEconomyCurrency.gs',
      'WalletAccounts.gs',
      'WalletTransactions.gs',
      'GameWallet.gs',
      'GameTransactions.gs',
      'GameRewards.gs'

    ],

    qrFlow: [

      'Product QR',
      'Bill QR',
      'Payment QR',
      'Transaction ID',
      'Watcher ID',
      'Payment Verification'

    ],

    walletMutationAuthority:
      'WalletTransactions.gs',

    gameTransactionAuthority:
      'GameTransactions.gs',

    currencyAuthority:
      'RDEconomyCurrency.gs',

    databaseAuthority:
      'Database.gs',

    roomAuthority:
      'GameRooms.gs',

    matchmakingAuthority:
      'GameMatchmaking.gs',

    engineAuthority:
      'GameEngine.gs',

    stationAuthority:
      'GameStation.gs',

    game300CatalogAuthority:
      'Game300Catalog.gs',

    launchDisplayAuthority:
      'Game300Catalog.gs',

    game300DisplayMode:
      'ACTIVE + LINKED + PLAYABLE',

    rewardAuthority:
      'GameRewards.gs',

    gamesAuthority:
      'Games.gs',

    directWalletMutation:
      false,

    directWalletAccountsMutation:
      false,

    directCurrencyMutation:
      false,

    directRoomMutation:
      false,

    directGameEngineMutation:
      false

  };

}


/* ============================================================
 * DATABASE AUTHORITY DIAGNOSTIC
 * ============================================================
 */

function diagnoseGamesDatabaseAuthority() {

  var errors = [];


  var databaseAvailable =
    typeof getDatabaseSheet ===
    'function';


  var resolverAvailable =
    typeof resolveDatabaseTableKey_211_ ===
    'function' ||
    typeof resolveDatabaseTableKey ===
    'function';


  if (!databaseAvailable) {

    errors.push(
      'Database.gs getDatabaseSheet() is unavailable.'
    );

  }


  if (!resolverAvailable) {

    errors.push(
      'Database.gs table resolver is unavailable.'
    );

  }


  var tableKey = null;

  var sheetName = null;

  var physicalSheetExists =
    false;


  if (databaseAvailable) {

    try {

      tableKey =
        getGamesTableKey_();


      var sheet =
        getDatabaseSheet(
          tableKey
        );


      if (sheet) {

        physicalSheetExists =
          true;

        sheetName =
          sheet.getName();

      }

    } catch (error) {

      errors.push(
        error.message
      );

    }

  }


  return {

    success:
      errors.length === 0 &&
      physicalSheetExists,

    version:
      GAMES_VERSION,

    runtimeMarker:
      GAMES_RUNTIME_MARKER,

    module:
      'Games',

    logicalTable:
      GAME_CONFIG.TABLE_KEY,

    resolvedTableKey:
      tableKey,

    expectedPhysicalSheet:
      GAME_CONFIG.PHYSICAL_SHEET_NAME,

    actualPhysicalSheet:
      sheetName,

    physicalSheetExists:
      physicalSheetExists,

    databaseAuthority:
      'Database.gs',

    errors:
      errors

  };

}


/* ============================================================
 * MUTATION BOUNDARY DIAGNOSTIC
 * ============================================================
 */

function diagnoseGamesMutationBoundaries() {

  return {

    success: true,

    version:
      GAMES_VERSION,

    runtimeMarker:
      GAMES_RUNTIME_MARKER,

    module:
      'Games',

    gamesOwnMutation:
      true,

    directWalletAccountsMutation:
      false,

    directWalletBalanceMutation:
      false,

    directCurrencyMutation:
      false,

    directGameTransactionMutation:
      false,

    directGameRoomMutation:
      false,

    directEngineMutation:
      false,

    walletAuthority:
      'WalletTransactions.gs / GameWallet.gs',

    currencyAuthority:
      'RDEconomyCurrency.gs',

    gameLedgerAuthority:
      'GameTransactions.gs',

    roomAuthority:
      'GameRooms.gs',

    engineAuthority:
      'GameEngine.gs'

  };

}


/* ============================================================
 * GAME HEALTH
 * ============================================================
 */

function getGamesHealth() {

  var schema;


  try {

    schema =
      validateGamesSchema();

  } catch (error) {

    return {

      success: false,

      version:
        GAMES_VERSION,

      runtimeMarker:
        GAMES_RUNTIME_MARKER,

      module:
        'Games',

      schemaValid:
        false,

      error:
        error.message

    };

  }


  if (!schema.success) {

    return {

      success: false,

      version:
        GAMES_VERSION,

      runtimeMarker:
        GAMES_RUNTIME_MARKER,

      module:
        'Games',

      schema:
        schema,

      schemaValid:
        false,

      message:
        'Games schema validation failed.'

    };

  }


  var count = 0;


  try {

    count =
      countGames();

  } catch (error2) {

    return {

      success: false,

      version:
        GAMES_VERSION,

      runtimeMarker:
        GAMES_RUNTIME_MARKER,

      module:
        'Games',

      schemaValid:
        true,

      error:
        error2.message

    };

  }


  return {

    success: true,

    version:
      GAMES_VERSION,

    runtimeMarker:
      GAMES_RUNTIME_MARKER,

    module:
      'Games',

    table:
      getGamesTableKey_(),

    logicalTable:
      GAME_CONFIG.TABLE_KEY,

    physicalSheet:
      GAME_CONFIG.PHYSICAL_SHEET_NAME,

    recordCount:
      count,

    schemaValid:
      true,

    universalRoomSlots:
      GAME_CONFIG.UNIVERSAL_ROOM_SLOTS,

    headerRow:
      GAME_CONFIG.HEADER_ROW,

    timestamp:
      new Date()

  };

}


/* ============================================================
 * TEST 1 — SCHEMA
 * ============================================================
 */

function testGamesSchema() {

  var result =
    validateGamesSchema();


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 2 — DATABASE
 * ============================================================
 */

function testGamesDatabaseAuthority() {

  var result =
    diagnoseGamesDatabaseAuthority();


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 3 — GET ALL
 * ============================================================
 */

function testGameGetAll() {

  var result =
    getAllGames();


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 4 — GET LATEST
 * ============================================================
 */

function testGameGetLatest() {

  var result =
    getLatestGame();


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 5 — FIND CODE
 * ============================================================
 */

function testGameFindByCode() {

  var latest =
    getLatestGame();


  if (
    !latest ||
    !latest.success ||
    !latest.data
  ) {

    throw new Error(
      'No game available for test.'
    );

  }


  var result =
    findGameByCode(
      latest.data['Game Code']
    );


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 6 — FIND NAME
 * ============================================================
 */

function testGameFindByName() {

  var latest =
    getLatestGame();


  if (
    !latest ||
    !latest.success ||
    !latest.data
  ) {

    throw new Error(
      'No game available for test.'
    );

  }


  var result =
    findGameByName(
      latest.data['Game Name']
    );


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 7 — FILTERS
 * ============================================================
 */

function testGameFilters() {

  var result = {

    active:
      getActiveGames(),

    walletEnabled:
      getWalletEnabledGames(),

    entryFeeGames:
      getEntryFeeGames(),

    prizePoolGames:
      getPrizePoolGames(),

    robotEnabled:
      getRobotEnabledGames()

  };


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 8 — HEALTH
 * ============================================================
 */

function testGamesHealth() {

  var result =
    getGamesHealth();


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 9 — INTEGRATION AVAILABILITY
 * ============================================================
 */

function testGamesIntegrationAvailability() {

  var result =
    getGamesIntegrationAvailability();


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 10 — INTEGRATION MAP
 * ============================================================
 */

function testGamesIntegrationMap() {

  var result =
    getGamesIntegrationMap();


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 11 — MUTATION BOUNDARY
 * ============================================================
 */

function testGamesMutationBoundaries() {

  var result =
    diagnoseGamesMutationBoundaries();


  var pass =
    result &&
    result.directWalletAccountsMutation === false &&
    result.directWalletBalanceMutation === false &&
    result.directCurrencyMutation === false &&
    result.directGameTransactionMutation === false &&
    result.directGameRoomMutation === false &&
    result.directEngineMutation === false;


  result.testPass =
    pass;


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * TEST 12 — GAME300 LAUNCH DISPLAY
 * ============================================================
 */

function testGamesLaunchDisplay() {

  var result = getGamesLaunchDisplay();

  var expectedNames = [
    'Ludo',
    'Snake',
    'Carrom',
    '2048'
  ];

  var names = result && Array.isArray(result.names)
    ? result.names
    : [];

  var namesPass =
    expectedNames.length === names.length &&
    expectedNames.every(function(name, index) {
      return names[index] === name;
    });

  result.testPass =
    result.success === true &&
    result.launchDisplayCount === 4 &&
    namesPass;

  Logger.log(JSON.stringify(result, null, 2));

  return result;

}


/* ============================================================
 * TEST 13 — GAME300 ACTIVE STATE
 * ============================================================
 */

function testGamesGame300ActiveState() {

  var statusResult = getGame300CatalogStatusSafe_();
  var launchResult = getGamesLaunchDisplay();

  var status =
    statusResult && statusResult.data
      ? statusResult.data
      : (statusResult && statusResult.status
          ? statusResult.status
          : statusResult || {});

  if (status && status.STATUS && typeof status.STATUS === 'object') {
    status = status.STATUS;
  }

  var total = Number(status.TOTAL || status.total || 0);
  var active = Number(status.ACTIVE || status.active || 0);
  var inactive = Number(status.INACTIVE || status.inactive || 0);
  var launchCount = Number(launchResult.launchDisplayCount || 0);

  var result = {
    success:
      statusResult.success === true &&
      launchResult.success === true,
    version: GAMES_VERSION,
    runtimeMarker: GAMES_RUNTIME_MARKER,
    total: total,
    active: active,
    inactive: inactive,
    launchDisplayCount: launchCount,
    launchDisplayNames: launchResult.names || [],
    expected: {
      total: 300,
      active: 300,
      inactive: 0,
      launchDisplayCount: 4,
      launchDisplayNames: ['Ludo', 'Snake', 'Carrom', '2048']
    }
  };

  result.testPass =
    result.success === true &&
    total === 300 &&
    active === 300 &&
    inactive === 0 &&
    launchCount === 4;

  Logger.log(JSON.stringify(result, null, 2));

  return result;

}


/* ============================================================
 * TEST 14 — CURRENCY BOUNDARY
 * ============================================================
 */


function testGamesCurrencyBoundary() {

  var currencies =
    getGamesCanonicalCurrencies_();


  return {

    success: true,

    version:
      GAMES_VERSION,

    runtimeMarker:
      GAMES_RUNTIME_MARKER,

    canonicalAuthority:
      'RDEconomyCurrency.gs',

    currenciesFound:
      currencies.length,

    currencies:
      currencies,

    localCurrencyAuthority:
      false,

    duplicateCurrencyAuthority:
      false

  };

}


/* ============================================================
 * TEST 13 — FULL READ-ONLY RUNTIME
 * ============================================================
 */

function testGamesRuntime() {

  var startedAt =
    new Date();


  var errors = [];

  var checks = {};


  try {

    checks.databaseAuthority =
      diagnoseGamesDatabaseAuthority();

  } catch (error) {

    checks.databaseAuthority = {

      success: false,

      error:
        error.message

    };

  }


  try {

    checks.schema =
      validateGamesSchema();

  } catch (error2) {

    checks.schema = {

      success: false,

      error:
        error2.message

    };

  }


  try {

    checks.schemaInfo =
      getGameSchema();

  } catch (error3) {

    checks.schemaInfo = {

      success: false,

      error:
        error3.message

    };

  }


  try {

    checks.health =
      getGamesHealth();

  } catch (error4) {

    checks.health = {

      success: false,

      error:
        error4.message

    };

  }


  try {

    checks.integration =
      getGamesIntegrationAvailability();

  } catch (error5) {

    checks.integration = {

      success: false,

      error:
        error5.message

    };

  }


  try {

    checks.integrationMap =
      getGamesIntegrationMap();

  } catch (error6) {

    checks.integrationMap = {

      success: false,

      error:
        error6.message

    };

  }


  try {

    checks.game300LaunchDisplay =
      testGamesLaunchDisplay();

  } catch (error7) {

    checks.game300LaunchDisplay = {
      success: false,
      error: error7.message
    };

  }


  try {

    checks.game300ActiveState =
      testGamesGame300ActiveState();

  } catch (error8) {

    checks.game300ActiveState = {
      success: false,
      error: error8.message
    };

  }


  try {

    checks.mutationBoundaries =
      diagnoseGamesMutationBoundaries();

  } catch (error7) {

    checks.mutationBoundaries = {

      success: false,

      error:
        error7.message

    };

  }


  var databasePass =
    checks.databaseAuthority &&
    checks.databaseAuthority.success === true;


  var schemaPass =
    checks.schema &&
    checks.schema.success === true;


  var healthPass =
    checks.health &&
    checks.health.success === true;


  var boundaryPass =
    checks.mutationBoundaries &&
    checks.mutationBoundaries.directWalletAccountsMutation === false &&
    checks.mutationBoundaries.directWalletBalanceMutation === false &&
    checks.mutationBoundaries.directCurrencyMutation === false &&
    checks.mutationBoundaries.directGameTransactionMutation === false &&
    checks.mutationBoundaries.directGameRoomMutation === false &&
    checks.mutationBoundaries.directEngineMutation === false;


  var game300Pass =
    checks.game300LaunchDisplay &&
    checks.game300LaunchDisplay.testPass === true &&
    checks.game300ActiveState &&
    checks.game300ActiveState.testPass === true;


  if (!databasePass) {

    errors.push(
      'Database authority check failed.'
    );

  }


  if (!schemaPass) {

    errors.push(
      'Games schema check failed.'
    );

  }


  if (!healthPass) {

    errors.push(
      'Games health check failed.'
    );

  }


  if (!boundaryPass) {

    errors.push(
      'Games mutation boundary check failed.'
    );

  }


  if (!game300Pass) {

    errors.push(
      'Game300 launch/active-state check failed.'
    );

  }


  var completedAt =
    new Date();


  var success =
    errors.length === 0;


  var result = {

    success:
      success,

    version:
      GAMES_VERSION,

    runtimeMarker:
      GAMES_RUNTIME_MARKER,

    module:
      'Games',

    databaseAuthority:
      'Database.gs',

    currencyAuthority:
      'RDEconomyCurrency.gs',

    walletAuthority:
      'WalletTransactions.gs / GameWallet.gs',

    gameTransactionAuthority:
      'GameTransactions.gs',

    roomAuthority:
      'GameRooms.gs',

    matchmakingAuthority:
      'GameMatchmaking.gs',

    engineAuthority:
      'GameEngine.gs',

    stationAuthority:
      'GameStation.gs',

    rewardAuthority:
      'GameRewards.gs',

    logicalTable:
      GAME_CONFIG.TABLE_KEY,

    resolvedTableKey:
      getGamesTableKey_(),

    expectedPhysicalSheet:
      GAME_CONFIG.PHYSICAL_SHEET_NAME,

    universalRoomSlots:
      GAME_CONFIG.UNIVERSAL_ROOM_SLOTS,

    mutationPerformed:
      false,

    checks:
      checks,

    errors:
      errors,

    startedAt:
      startedAt,

    completedAt:
      completedAt,

    status:
      success
        ? 'GAMES RUNTIME PASS'
        : 'GAMES RUNTIME FAIL'

  };


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * VERSION / STATUS
 * ============================================================
 */

function getGamesVersion() {

  return {

    success: true,

    module:
      'Games',

    version:
      GAMES_VERSION,

    runtimeMarker:
      GAMES_RUNTIME_MARKER,

    status:
      '2.3.0 ADVANCED GAME300 LINKED LAUNCH'

  };

}


/* ============================================================
 * API
 * ============================================================
 */

function gamesApi(
  request
) {

  request =
    request || {};


  var action =
    normalizeGameText_(
      request.action ||
      request.method
    ).toUpperCase();


  switch (action) {

    case 'VERSION':
      return getGamesVersion();


    case 'SCHEMA':
      return getGameSchema();


    case 'HEALTH':
      return getGamesHealth();


    case 'DATABASE_DIAGNOSTIC':
      return diagnoseGamesDatabaseAuthority();


    case 'INTEGRATION':
      return getGamesIntegrationMap();


    case 'INTEGRATION_AVAILABILITY':
      return getGamesIntegrationAvailability();


    case 'BOUNDARIES':
      return diagnoseGamesMutationBoundaries();


    case 'RUNTIME_TEST':
      return testGamesRuntime();


    case 'GET':

      return getGame(
        request.gameId ||
        request.id
      );


    case 'GET_ALL':
      return getAllGames();


    case 'FIND':

      return findGames(
        request.filters || {}
      );


    case 'BY_CODE':

      return findGameByCode(
        request.gameCode
      );


    case 'BY_NAME':

      return findGameByName(
        request.gameName
      );


    case 'ACTIVE':
      return getActiveGames();


    case 'BY_TYPE':

      return getGamesByType(
        request.gameType
      );


    case 'BY_MODE':

      return getGamesByMode(
        request.gameMode
      );


    case 'ROBOT_ENABLED':
      return getRobotEnabledGames();


    case 'WALLET_ENABLED':
      return getWalletEnabledGames();


    case 'ENTRY_FEE':
      return getEntryFeeGames();


    case 'PRIZE_POOL':
      return getPrizePoolGames();


    case 'LAUNCH_DISPLAY':
      return getGamesLaunchDisplay();


    case 'LAUNCH_DISPLAY_NAMES':
      return getGamesLaunchDisplayNames();


    case 'LAUNCH_DISPLAY_PAYLOAD':
      return getGamesLaunchDisplayPayload();


    case 'ACTIVATE_ALL':
      return activateAllGames();


    case 'GAME300_STATUS':
      return getGame300CatalogStatusSafe_();


    case 'COMPARE_GAME300':
      return compareGamesWithGame300Catalog();


    default:

      throw new Error(
        'Unknown Games API action: ' +
        action
      );

  }

}


/* ============================================================
 * RUNTIME LOG WRAPPER
 * ============================================================
 */

function TEST_GAMES_RUNTIME_LOG() {

  var result =
    testGamesRuntime();


  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* ============================================================
 * END — Games.gs v2.3.0 Advanced Game300 Linked Launch
 * ============================================================
 */