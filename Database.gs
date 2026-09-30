/***** Database.gs — RDG Universal Database Engine v2.1.1 *****/

/**
 * ============================================================
 * RDG DATABASE ENGINE
 * ============================================================
 *
 * Universal Google Sheets database layer.
 *
 * Responsibilities:
 * - Database spreadsheet resolution
 * - Table/key resolution
 * - Sheet management
 * - Header/data retrieval
 * - Row/object conversion
 * - Universal CRUD
 * - Soft delete
 * - Audit integration
 *
 * IMPORTANT:
 * - Header row = Row 3
 * - Data starts = Row 4
 * - ID column = "ID"
 * - Status column is required for soft delete
 * - Formula-controlled columns should not be overwritten
 *
 * ============================================================
 */


/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

var DATABASE_CONFIG = {
  VERSION: '4.3.5',
  HEADER_ROW: 3,
  DATA_START_ROW: 4,
  ID_HEADER: 'ID',
  STATUS_HEADER: 'Status',
  CREATED_AT_HEADER: 'Created At',
  UPDATED_AT_HEADER: 'Updated At',
  ENFORCE_SERVER_AUTH: false,
  LOCK_TIMEOUT_MS: 15000,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 50,
  MAX_SCAN_ROWS: 10000
};


/**
 * ============================================================
 * INTERNAL HELPERS
 * ============================================================
 */

/**
 * ============================================================
 * v4.3.5 ADVANCED SAFETY / LOCK HELPERS
 * ============================================================
 */

function withDatabaseLock_435_(operationName, callback) {
  if (typeof callback !== 'function') {
    throw new Error('Database lock callback is required.');
  }

  var timeout = 15000;
  try {
    if (typeof RDG_CONFIG !== 'undefined' && RDG_CONFIG && RDG_CONFIG.LOCK && RDG_CONFIG.LOCK.TIMEOUT_MS) {
      timeout = Number(RDG_CONFIG.LOCK.TIMEOUT_MS) || timeout;
    } else if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG && APP_CONFIG.LOCK && APP_CONFIG.LOCK.TIMEOUT_MS) {
      timeout = Number(APP_CONFIG.LOCK.TIMEOUT_MS) || timeout;
    }
  } catch (ignore) {}

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(timeout)) {
    throw new Error('Database operation is busy. Please retry: ' + String(operationName || 'operation'));
  }

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function databaseAuthorizeOperation_435_(operation, tableKey) {
  var enforce = false;
  try {
    enforce = !!(DATABASE_CONFIG && DATABASE_CONFIG.ENFORCE_SERVER_AUTH);
  } catch (ignore) {}

  if (!enforce) return true;

  if (typeof authorizeServerOperation_ !== 'function') {
    throw new Error('Server authorization is required but authorizeServerOperation_ is unavailable.');
  }

  var result = authorizeServerOperation_(String(operation || '').toUpperCase(), null, {
    tableKey: tableKey
  });

  if (result === false) {
    throw new Error('Database authorization denied.');
  }
  return true;
}

function databaseSafeErrorMessage_435_(error) {
  try {
    if (typeof safeErrorMessage_ === 'function') return safeErrorMessage_(error);
  } catch (ignore) {}
  return error && error.message ? String(error.message) : 'Database operation failed.';
}

function databaseGetCurrentActorId_435_(fallback) {
  try {
    if (typeof getCurrentServerUser_ === 'function') {
      var user = getCurrentServerUser_();
      if (user && user.id) return String(user.id);
    }
  } catch (ignore) {}
  try {
    if (typeof getCurrentUser === 'function') {
      var current = getCurrentUser();
      if (current && current.id) return String(current.id);
    }
  } catch (ignore) {}
  return databaseIsBlank_211_(fallback) ? 'SYSTEM' : String(fallback);
}



function databaseIsBlank_211_(value) {
  return (
    value === null ||
    value === undefined ||
    String(value).trim() === ''
  );
}


function databaseNormalizeKey_211_(value) {
  if (databaseIsBlank_211_(value)) {
    return '';
  }

  return String(value)
    .trim()
    .toUpperCase();
}


function databaseNormalizeHeader_211_(value) {
  if (databaseIsBlank_211_(value)) {
    return '';
  }

  return String(value).trim();
}


function databaseSafeObject_211_(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}


/**
 * ============================================================
 * DATABASE SPREADSHEET
 * ============================================================
 */

function getDatabaseSpreadsheet() {

  var spreadsheetId = '';

  /*
   * Canonical RDG configuration authority.
   *
   * RDGConfig.gs owns the production database identity through:
   *   RDG_CONFIG.DATABASE.SPREADSHEET_ID
   *
   * Database.gs remains the persistence authority, so it consumes
   * the existing configuration here instead of hard-coding an ID
   * or requiring GameMatchmaking/RDGServer to carry one.
   */
  try {
    if (
      typeof RDG_CONFIG !== 'undefined' &&
      RDG_CONFIG &&
      RDG_CONFIG.DATABASE &&
      RDG_CONFIG.DATABASE.SPREADSHEET_ID
    ) {
      spreadsheetId = String(
        RDG_CONFIG.DATABASE.SPREADSHEET_ID
      ).trim();
    }
  } catch (ignore) {}

  /*
   * Legacy/application configuration remains a compatibility
   * fallback. It is intentionally checked after RDG_CONFIG.
   */
  if (!spreadsheetId) {
    try {
      if (
        typeof APP_CONFIG !== 'undefined' &&
        APP_CONFIG &&
        APP_CONFIG.DATABASE &&
        APP_CONFIG.DATABASE.SPREADSHEET_ID
      ) {
        spreadsheetId = String(
          APP_CONFIG.DATABASE.SPREADSHEET_ID
        ).trim();
      }
    } catch (ignore2) {}
  }

  /*
   * Existing compatibility helper remains the final fallback.
   */
  if (!spreadsheetId) {
    try {
      if (typeof getDatabaseSpreadsheetId213_ === 'function') {
        spreadsheetId = String(
          getDatabaseSpreadsheetId213_()
        ).trim();
      }
    } catch (ignore3) {}
  }

  if (!spreadsheetId) {
    throw new Error(
      'RDG database spreadsheet is not configured. ' +
      'Set RDG_CONFIG.DATABASE.SPREADSHEET_ID, ' +
      'APP_CONFIG.DATABASE.SPREADSHEET_ID, or the legacy database ID resolver.'
    );
  }

  try {
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (error) {
    throw new Error(
      'Unable to open database spreadsheet. ' +
      'Verify the Spreadsheet ID and permissions. ' +
      'Original error: ' +
      error.message
    );
  }
}


/**
 * ============================================================
 * GET CONFIGURED TABLES
 * ============================================================
 */

function getDatabaseConfiguredTables_211_() {

  var tables = null;

  /*
   * Prefer the latest Config.gs public helper.
   */
  if (
    typeof getConfiguredTables === 'function'
  ) {

    try {

      tables =
        getConfiguredTables();

    } catch (error) {

      tables = null;
    }
  }


  /*
   * Fallback to APP_CONFIG.TABLES.
   */
  if (
    !databaseSafeObject_211_(tables) &&
    typeof APP_CONFIG !== 'undefined' &&
    APP_CONFIG &&
    databaseSafeObject_211_(
      APP_CONFIG.TABLES
    )
  ) {

    tables =
      APP_CONFIG.TABLES;
  }


  if (
    !databaseSafeObject_211_(tables)
  ) {

    throw new Error(
      'Configured database tables are missing in Config.gs.'
    );
  }

  /*
   * ============================================================
   * RDG GAME REWARDS TABLE COMPATIBILITY — v4.3.7
   * ============================================================
   *
   * Public RDG table key : GAME_REWARDS
   * Physical sheet name  : GameRewards
   *
   * Database.gs remains the single canonical table-resolution
   * authority. This compatibility bridge does NOT create a new
   * registry and does NOT replace Config.gs mappings.
   *
   * If an existing canonical mapping already represents
   * GameRewards, preserve that mapping. Otherwise expose the
   * public RDG compatibility key GAME_REWARDS -> GameRewards.
   * ============================================================
   */

  var gameRewardsCanonicalKey = '';
  var configuredTableKeys = Object.keys(tables);

  for (var gr = 0; gr < configuredTableKeys.length; gr++) {

    var configuredKey =
      String(configuredTableKeys[gr]).trim();

    var configuredSheet =
      String(tables[configuredKey] || '').trim();

    if (
      databaseNormalizeKey_211_(configuredKey) ===
      'GAME_REWARDS'
    ) {
      gameRewardsCanonicalKey = configuredKey;
      break;
    }

    if (
      databaseNormalizeKey_211_(configuredSheet) ===
      'GAMEREWARDS'
    ) {
      gameRewardsCanonicalKey = configuredKey;
      break;
    }
  }

  if (!gameRewardsCanonicalKey) {
    tables.GAME_REWARDS = 'GameRewards';
  }

  /*
   * ============================================================
   * RDG MATCHMAKING / ROOM / PLAYER TABLE COMPATIBILITY — v4.3.5
   * ============================================================
   *
   * Public RDG table keys must resolve through Database.gs before
   * any RDG module attempts its own compatibility lookup.
   *
   * Existing canonical mappings are preserved. These bridges are
   * added only when the requested public key (or its physical
   * sheet) is not already represented by Config.gs.
   *
   * Public key          Physical Google Sheet
   * ------------------------------------------------------------
   * GAME_MATCHMAKING    GameMatchmaking
   * GAME_ROOMS          GameRooms
   * GAME_PLAYERS        GamePlayers
   * ============================================================
   */

  var rdgCompatibilityMappings = [
    { key: 'GAME_MATCHMAKING', sheet: 'GameMatchmaking' },
    { key: 'GAME_ROOMS',       sheet: 'GameRooms' },
    { key: 'GAME_PLAYERS',     sheet: 'GamePlayers' }
  ];

  rdgCompatibilityMappings.forEach(function(mapping) {
    var canonicalKey = '';
    var normalizedKey = databaseNormalizeKey_211_(mapping.key);
    var normalizedSheet = databaseNormalizeKey_211_(mapping.sheet);

    configuredTableKeys = Object.keys(tables);

    for (var rm = 0; rm < configuredTableKeys.length; rm++) {
      var existingKey = String(configuredTableKeys[rm]).trim();
      var existingSheet = String(tables[existingKey] || '').trim();

      if (databaseNormalizeKey_211_(existingKey) === normalizedKey ||
          databaseNormalizeKey_211_(existingSheet) === normalizedSheet) {
        canonicalKey = existingKey;
        break;
      }
    }

    if (!canonicalKey) {
      tables[mapping.key] = mapping.sheet;
    }
  });

  return tables;
}


/**
 * ============================================================
 * GAME REWARDS TABLE MAPPING DIAGNOSTIC
 * ============================================================
 * Read-only. Confirms Database.gs canonical resolution for
 * GAME_REWARDS without creating or changing any records.
 * ============================================================
 */

function testDatabaseGameRewardsTableMapping437() {

  var result = {
    success: false,
    version: DATABASE_CONFIG.VERSION,
    databaseAuthority: 'Database.gs',
    requestedKey: 'GAME_REWARDS',
    resolvedKey: null,
    configuredSheet: null,
    sheetExists: false,
    error: null
  };

  try {
    var tables = getDatabaseConfiguredTables_211_();
    result.configuredSheet =
      tables && tables.GAME_REWARDS
        ? String(tables.GAME_REWARDS)
        : null;

    result.resolvedKey =
      resolveDatabaseTableKey_211_('GAME_REWARDS');

    result.sheetExists =
      databaseSheetExists('GAME_REWARDS');

    result.success =
      result.resolvedKey === 'GAME_REWARDS' &&
      result.configuredSheet === 'GameRewards' &&
      result.sheetExists === true;

  } catch (error) {
    result.error =
      error && error.message
        ? error.message
        : String(error);
  }

  Logger.log(
    '========================================'
  );
  Logger.log(
    'DATABASE GAME REWARDS TABLE MAPPING 4.3.7'
  );
  Logger.log(
    JSON.stringify(result, null, 2)
  );
  Logger.log(
    '========================================'
  );

  return result;
}


/**
 * ============================================================
 * GAME MATCHMAKING TABLE MAPPING DIAGNOSTIC
 * ============================================================
 * Read-only. Confirms the canonical Database.gs mappings used by
 * GameMatchmaking, GameRooms, and GamePlayers.
 * ============================================================
 */

function testDatabaseGameMatchmakingTableMapping435() {
  var requested = [
    'GAME_MATCHMAKING',
    'GAME_ROOMS',
    'GAME_PLAYERS',
    'GAMES',
    'USERS'
  ];

  var result = {
    success: true,
    version: DATABASE_CONFIG.VERSION,
    databaseAuthority: 'Database.gs',
    mappings: {},
    errors: []
  };

  try {
    var tables = getDatabaseConfiguredTables_211_();

    requested.forEach(function(tableKey) {
      try {
        var resolved = resolveDatabaseTableKey_211_(tableKey);
        var configuredSheet = tables[resolved] || '';
        var sheetExists = databaseSheetExists(tableKey);

        result.mappings[tableKey] = {
          resolvedKey: resolved,
          configuredSheet: String(configuredSheet),
          sheetExists: sheetExists
        };

        if (!sheetExists) {
          result.success = false;
          result.errors.push(tableKey + ': physical sheet not found: ' + configuredSheet);
        }
      } catch (error) {
        result.success = false;
        result.mappings[tableKey] = null;
        result.errors.push(
          tableKey + ': ' + databaseSafeErrorMessage_435_(error)
        );
      }
    });
  } catch (error) {
    result.success = false;
    result.errors.push(databaseSafeErrorMessage_435_(error));
  }

  Logger.log('========================================');
  Logger.log('DATABASE GAME MATCHMAKING TABLE MAPPING 4.3.5');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log('========================================');

  return result;
}


/**
 * ============================================================
 * RESOLVE TABLE KEY
 * ============================================================
 */

function resolveDatabaseTableKey_211_(tableKey) {

  if (
    databaseIsBlank_211_(tableKey)
  ) {

    throw new Error(
      'Table key is required.'
    );
  }

  var input =
    databaseNormalizeKey_211_(
      tableKey
    );

  var tables =
    getDatabaseConfiguredTables_211_();

  var keys =
    Object.keys(tables);


  for (
    var i = 0;
    i < keys.length;
    i++
  ) {

    var key =
      String(keys[i]).trim();

    var sheetName =
      String(
        tables[key]
      ).trim();


    if (
      databaseNormalizeKey_211_(key) ===
      input
    ) {

      return key;
    }


    if (
      databaseNormalizeKey_211_(sheetName) ===
      input
    ) {

      return key;
    }
  }


  throw new Error(
    'Unknown database table: ' +
    tableKey
  );
}


/**
 * ============================================================
 * PUBLIC TABLE RESOLVER
 * ============================================================
 */

function resolveDatabaseTableKey(tableKey) {

  return resolveDatabaseTableKey_211_(
    tableKey
  );
}


/**
 * ============================================================
 * GET DATABASE SHEET
 * ============================================================
 */

function getDatabaseSheet(tableKey) {

  var resolvedKey =
    resolveDatabaseTableKey_211_(
      tableKey
    );

  var tables =
    getDatabaseConfiguredTables_211_();

  var sheetName =
    String(
      tables[resolvedKey] || ''
    ).trim();

  if (!sheetName) {

    throw new Error(
      'Database sheet name is missing for table: ' +
      resolvedKey
    );
  }

  var ss =
    getDatabaseSpreadsheet();

  var sheet =
    ss.getSheetByName(
      sheetName
    );

  if (!sheet) {

    throw new Error(
      'Database sheet not found: ' +
      sheetName
    );
  }

  return sheet;
}


/**
 * ============================================================
 * CHECK SHEET EXISTS
 * ============================================================
 */

function databaseSheetExists(tableKey) {

  try {

    getDatabaseSheet(
      tableKey
    );

    return true;

  } catch (error) {

    return false;
  }
}


/**
 * ============================================================
 * CREATE DATABASE SHEET
 * ============================================================
 */

function createDatabaseSheet(tableKey) {

  var resolvedKey =
    resolveDatabaseTableKey_211_(
      tableKey
    );

  var tables =
    getDatabaseConfiguredTables_211_();

  var sheetName =
    String(
      tables[resolvedKey] || ''
    ).trim();

  if (!sheetName) {

    throw new Error(
      'Database sheet name is missing for table: ' +
      resolvedKey
    );
  }

  var ss =
    getDatabaseSpreadsheet();

  var sheet =
    ss.getSheetByName(
      sheetName
    );

  if (!sheet) {

    sheet =
      ss.insertSheet(
        sheetName
      );
  }

  return sheet;
}


/**
 * ============================================================
 * GET HEADERS
 * ============================================================
 */

function getDatabaseHeaders(tableKey) {

  var sheet =
    getDatabaseSheet(
      tableKey
    );

  var lastColumn =
    sheet.getLastColumn();

  if (
    lastColumn < 1
  ) {

    return [];
  }

  var headers =
    sheet
      .getRange(
        DATABASE_CONFIG.HEADER_ROW,
        1,
        1,
        lastColumn
      )
      .getDisplayValues()[0];

  return headers
    .map(function(header) {

      return databaseNormalizeHeader_211_(
        header
      );

    })
    .filter(function(header) {

      return header !== '';

    });
}


/**
 * ============================================================
 * GET DATA ROWS
 * ============================================================
 */

function getDatabaseRows(tableKey) {

  var sheet =
    getDatabaseSheet(
      tableKey
    );

  var lastRow =
    sheet.getLastRow();

  var lastColumn =
    sheet.getLastColumn();

  if (
    lastRow <
      DATABASE_CONFIG.DATA_START_ROW ||
    lastColumn < 1
  ) {

    return [];
  }

  return sheet
    .getRange(
      DATABASE_CONFIG.DATA_START_ROW,
      1,
      lastRow -
        DATABASE_CONFIG.DATA_START_ROW +
        1,
      lastColumn
    )
    .getValues();
}


/**
 * ============================================================
 * GET PHYSICAL DATA ROWS
 * ============================================================
 *
 * Prevents formula-only rows from being treated as real records.
 * A record is considered physical data when its ID cell is nonblank.
 * ============================================================
 */

function getDatabasePhysicalRows_211_(tableKey) {

  var sheet =
    getDatabaseSheet(
      tableKey
    );

  var headers =
    getDatabaseHeaders(
      tableKey
    );

  if (!headers.length) {
    return [];
  }

  var idIndex =
    headers.indexOf(
      DATABASE_CONFIG.ID_HEADER
    );

  if (idIndex === -1) {

    throw new Error(
      'ID column not found for table: ' +
      tableKey
    );
  }

  var rows =
    getDatabaseRows(
      tableKey
    );

  var physicalRows = [];

  for (
    var i = 0;
    i < rows.length;
    i++
  ) {

    var idValue =
      rows[i][idIndex];

    if (
      !databaseIsBlank_211_(
        idValue
      )
    ) {

      physicalRows.push({
        rowNumber:
          DATABASE_CONFIG.DATA_START_ROW + i,

        rowIndex:
          i,

        row:
          rows[i]
      });
    }
  }

  return physicalRows;
}


/**
 * ============================================================
 * ROW → OBJECT
 * ============================================================
 */

function databaseRowToObject_(
  headers,
  row
) {

  var object = {};

  headers.forEach(function(
    header,
    index
  ) {

    object[header] =
      row[index] !== undefined
        ? row[index]
        : '';

  });

  return object;
}


/**
 * ============================================================
 * OBJECT → ROW
 * ============================================================
 */

function databaseObjectToRow_(
  headers,
  object
) {

  return headers.map(function(
    header
  ) {

    if (
      object[header] !== undefined
    ) {

      return object[header];
    }

    return '';
  });
}


/**
 * ============================================================
 * FIND ROW BY ID
 * ============================================================
 */

function findDatabaseRowById_(
  tableKey,
  recordId
) {

  if (
    databaseIsBlank_211_(
      recordId
    )
  ) {

    return null;
  }

  var headers =
    getDatabaseHeaders(
      tableKey
    );

  var idIndex =
    headers.indexOf(
      DATABASE_CONFIG.ID_HEADER
    );

  if (
    idIndex === -1
  ) {

    throw new Error(
      'ID column not found for table: ' +
      tableKey
    );
  }

  var physicalRows =
    getDatabasePhysicalRows_211_(
      tableKey
    );

  var targetId =
    String(
      recordId
    ).trim();


  for (
    var i = 0;
    i < physicalRows.length;
    i++
  ) {

    var currentId =
      String(
        physicalRows[i].row[idIndex] || ''
      ).trim();

    if (
      currentId === targetId
    ) {

      return physicalRows[i];
    }
  }

  return null;
}


/**
 * ============================================================
 * GENERATE RECORD ID
 * ============================================================
 */

function generateDatabaseRecordId_211_(
  tableKey
) {

  if (
    typeof generateTableId === 'function'
  ) {

    return generateTableId(
      tableKey
    );
  }

  if (
    typeof getConfiguredIdPrefix === 'function'
  ) {

    var prefix =
      getConfiguredIdPrefix(
        tableKey
      );

    if (prefix) {

      return (
        String(prefix) +
        '-' +
        Utilities.getUuid()
          .replace(/-/g, '')
          .substring(0, 12)
          .toUpperCase()
      );
    }
  }

  throw new Error(
    'No table ID generator is available for: ' +
    tableKey
  );
}


/**
 * ============================================================
 * PROTECTED / FORMULA COLUMNS
 * ============================================================
 */

function getDatabaseFormulaProtectedHeaders_211_(
  sheet,
  headers
) {

  var protectedHeaders = {};

  /*
   * Inspect row 4 formulas.
   *
   * This protects formula-controlled columns such as:
   * ID, Increase Percent, Final Rate, etc.
   */
  if (
    sheet.getMaxRows() >=
    DATABASE_CONFIG.DATA_START_ROW &&
    sheet.getMaxColumns() >=
    headers.length
  ) {

    var formulas =
      sheet
        .getRange(
          DATABASE_CONFIG.DATA_START_ROW,
          1,
          1,
          headers.length
        )
        .getFormulas()[0];

    for (
      var i = 0;
      i < formulas.length;
      i++
    ) {

      if (
        formulas[i]
      ) {

        protectedHeaders[
          headers[i]
        ] = true;
      }
    }
  }

  return protectedHeaders;
}


/**
 * ============================================================
 * FILTER WRITABLE RECORD DATA
 * ============================================================
 */

function databasePrepareWritableRecord_211_(
  tableKey,
  data,
  headers,
  existingRecord
) {

  var record =
    Object.assign(
      {},
      data
    );

  var sheet =
    getDatabaseSheet(
      tableKey
    );

  var formulaProtected =
    getDatabaseFormulaProtectedHeaders_211_(
      sheet,
      headers
    );

  /*
   * Never allow lowercase "id" to bypass ID protection.
   */
  if (
    record.id !== undefined &&
    record.ID === undefined
  ) {

    record.ID =
      record.id;
  }

  delete record.id;


  /*
   * Formula-controlled fields must not be
   * explicitly overwritten.
   */
  Object.keys(
    formulaProtected
  ).forEach(function(header) {

    if (
      header === DATABASE_CONFIG.ID_HEADER
    ) {

      delete record[header];
      return;
    }

    /*
     * Existing formula columns remain untouched.
     */
    delete record[header];
  });


  /*
   * Existing record fields are only used when
   * an update is being prepared.
   */
  if (
    existingRecord &&
    databaseSafeObject_211_(
      existingRecord
    )
  ) {

    Object.keys(
      existingRecord
    ).forEach(function(field) {

      if (
        record[field] === undefined
      ) {

        record[field] =
          existingRecord[field];
      }
    });
  }

  return record;
}


/**
 * ============================================================
 * CREATE RECORD
 * ============================================================
 */

function createRecordCore_435_(
  tableKey,
  data,
  userId
) {

  if (
    databaseIsBlank_211_(
      tableKey
    )
  ) {

    throw new Error(
      'Table key is required.'
    );
  }

  if (
    !databaseSafeObject_211_(
      data
    )
  ) {

    throw new Error(
      'Record data must be an object.'
    );
  }

  var resolvedKey =
    resolveDatabaseTableKey_211_(
      tableKey
    );

  var sheet =
    getDatabaseSheet(
      resolvedKey
    );

  var headers =
    getDatabaseHeaders(
      resolvedKey
    );

  if (!headers.length) {

    throw new Error(
      'No headers found for table: ' +
      resolvedKey
    );
  }

  var record =
    databasePrepareWritableRecord_211_(
      resolvedKey,
      data,
      headers,
      null
    );


  /*
   * Generate ID only if the table does not
   * already control ID through a formula.
   */
  var idIndex =
    headers.indexOf(
      DATABASE_CONFIG.ID_HEADER
    );

  var idFormulaControlled =
    false;

  if (
    idIndex !== -1 &&
    sheet.getMaxRows() >=
      DATABASE_CONFIG.DATA_START_ROW
  ) {

    var idFormula =
      sheet
        .getRange(
          DATABASE_CONFIG.DATA_START_ROW,
          idIndex + 1
        )
        .getFormula();

    idFormulaControlled =
      !!idFormula;
  }


  if (
    idFormulaControlled
  ) {

    /*
     * Formula-generated ID:
     * do not write ID.
     *
     * The row is appended first and the
     * formula generates the ID.
     */
    delete record.ID;

  } else {

    if (
      databaseIsBlank_211_(
        record.ID
      )
    ) {

      record.ID =
        databaseGenerateUniqueId_211_(
          resolvedKey
        );
    }

    var duplicate =
      findDatabaseRowById_(
        resolvedKey,
        record.ID
      );

    if (duplicate) {

      throw new Error(
        'Record with ID "' +
        record.ID +
        '" already exists.'
      );
    }
  }


  /*
   * Timestamps.
   */
  if (
    headers.indexOf(
      DATABASE_CONFIG.CREATED_AT_HEADER
    ) !== -1 &&
    databaseIsBlank_211_(
      record[
        DATABASE_CONFIG.CREATED_AT_HEADER
      ]
    )
  ) {

    record[
      DATABASE_CONFIG.CREATED_AT_HEADER
    ] =
      new Date();
  }


  if (
    headers.indexOf(
      DATABASE_CONFIG.UPDATED_AT_HEADER
    ) !== -1 &&
    databaseIsBlank_211_(
      record[
        DATABASE_CONFIG.UPDATED_AT_HEADER
      ]
    )
  ) {

    record[
      DATABASE_CONFIG.UPDATED_AT_HEADER
    ] =
      new Date();
  }


  var row =
    databaseObjectToRow_(
      headers,
      record
    );


  /*
   * Append using the complete header width.
   */
  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      1,
      headers.length
    )
    .setValues([
      row
    ]);


  SpreadsheetApp.flush();


  /*
   * Formula-generated ID must be read back.
   */
  if (
    idFormulaControlled
  ) {

    var appendedRowNumber =
      sheet.getLastRow();

    var generatedId =
      sheet
        .getRange(
          appendedRowNumber,
          idIndex + 1
        )
        .getDisplayValue()
        .trim();

    if (!generatedId) {

      throw new Error(
        'Record was saved, but formula-generated ID is empty.'
      );
    }

    record.ID =
      generatedId;
  }


  var createdRecord =
    getRecord(
      resolvedKey,
      record.ID
    );


  if (
    !createdRecord ||
    !createdRecord.success
  ) {

    throw new Error(
      'Record was saved but could not be read back.'
    );
  }


  if (
    typeof createAuditLog === 'function'
  ) {

    createAuditLog(
      'CREATE',
      resolvedKey,
      record.ID,
      userId || 'SYSTEM',
      null,
      createdRecord.data
    );
  }


  return {

    success: true,

    message:
      'Record created successfully.',

    data:
      createdRecord.data
  };
}


/**
 * ============================================================
 * GENERATE UNIQUE ID
 * ============================================================
 */

function databaseGenerateUniqueId_211_(
  tableKey
) {

  var maxAttempts = 10;

  for (
    var attempt = 0;
    attempt < maxAttempts;
    attempt++
  ) {

    var candidate =
      databaseGenerateRecordIdFallback_211_(
        tableKey
      );

    if (
      !findDatabaseRowById_(
        tableKey,
        candidate
      )
    ) {

      return candidate;
    }
  }

  throw new Error(
    'Unable to generate a unique ID for table: ' +
    tableKey
  );
}


function databaseGenerateRecordIdFallback_211_(
  tableKey
) {

  if (
    typeof generateTableId === 'function'
  ) {

    return generateTableId(
      tableKey
    );
  }

  var prefix = 'RDG';

  if (
    typeof getConfiguredIdPrefix === 'function'
  ) {

    try {

      prefix =
        getConfiguredIdPrefix(
          tableKey
        ) || prefix;

    } catch (error) {}
  }

  return (
    String(prefix) +
    '-' +
    Utilities.getUuid()
      .replace(/-/g, '')
      .substring(0, 16)
      .toUpperCase()
  );
}


/**
 * ============================================================
 * PUBLIC CREATE / UPDATE / DELETE / APPEND WRAPPERS
 * ============================================================
 */

function createRecord(tableKey, data, userId) {
  databaseAuthorizeOperation_435_('CREATE', tableKey);
  return withDatabaseLock_435_('CREATE:' + tableKey, function() {
    return createRecordCore_435_(tableKey, data, userId || databaseGetCurrentActorId_435_('SYSTEM'));
  });
}

function updateRecord(tableKey, recordId, updates, userId) {
  databaseAuthorizeOperation_435_('UPDATE', tableKey);
  return withDatabaseLock_435_('UPDATE:' + tableKey, function() {
    return updateRecordCore_435_(tableKey, recordId, updates, userId || databaseGetCurrentActorId_435_('SYSTEM'));
  });
}

function deleteRecord(tableKey, recordId, userId) {
  databaseAuthorizeOperation_435_('DELETE', tableKey);
  return withDatabaseLock_435_('DELETE:' + tableKey, function() {
    return deleteRecordCore_435_(tableKey, recordId, userId || databaseGetCurrentActorId_435_('SYSTEM'));
  });
}

function appendDatabaseRow(tableKey, row) {
  databaseAuthorizeOperation_435_('CREATE', tableKey);
  return withDatabaseLock_435_('APPEND:' + tableKey, function() {
    return appendDatabaseRowCore_435_(tableKey, row);
  });
}

/**
 * ============================================================
 * GET RECORD
 * ============================================================
 */

function getRecord(
  tableKey,
  recordId
) {

  if (
    databaseIsBlank_211_(
      tableKey
    )
  ) {

    throw new Error(
      'Table key is required.'
    );
  }

  if (
    databaseIsBlank_211_(
      recordId
    )
  ) {

    throw new Error(
      'Record ID is required.'
    );
  }

  var resolvedKey =
    resolveDatabaseTableKey_211_(
      tableKey
    );

  var headers =
    getDatabaseHeaders(
      resolvedKey
    );

  var found =
    findDatabaseRowById_(
      resolvedKey,
      recordId
    );

  if (!found) {

    return {

      success: false,

      message:
        'Record not found: ' +
        recordId,

      data: null
    };
  }

  return {

    success: true,

    table:
      resolvedKey,

    rowNumber:
      found.rowNumber,

    data:
      databaseRowToObject_(
        headers,
        found.row
      )
  };
}


/**
 * ============================================================
 * GET ALL RECORDS
 * ============================================================
 */

function getAllRecords(
  tableKey
) {

  var resolvedKey =
    resolveDatabaseTableKey_211_(
      tableKey
    );

  var headers =
    getDatabaseHeaders(
      resolvedKey
    );

  var physicalRows =
    getDatabasePhysicalRows_211_(
      resolvedKey
    );

  var data =
    physicalRows.map(function(item) {

      return databaseRowToObject_(
        headers,
        item.row
      );

    });

  return {

    success: true,

    table:
      resolvedKey,

    count:
      data.length,

    data:
      data
  };
}


/**
 * ============================================================
 * FIND RECORDS
 * ============================================================
 */

function findRecords(
  tableKey,
  filters
) {

  var resolvedKey =
    resolveDatabaseTableKey_211_(
      tableKey
    );

  filters =
    filters || {};

  if (
    !databaseSafeObject_211_(
      filters
    )
  ) {

    throw new Error(
      'Filters must be an object.'
    );
  }

  var headers =
    getDatabaseHeaders(
      resolvedKey
    );

  var physicalRows =
    getDatabasePhysicalRows_211_(
      resolvedKey
    );

  var data = [];

  physicalRows.forEach(function(item) {

    var record =
      databaseRowToObject_(
        headers,
        item.row
      );

    var matches = true;

    Object.keys(
      filters
    ).forEach(function(field) {

      if (!matches) {
        return;
      }

      var expected =
        filters[field];

      var actual =
        record[field];

      var actualString =
        String(
          actual === null ||
          actual === undefined
            ? ''
            : actual
        ).trim();

      var expectedString =
        String(
          expected === null ||
          expected === undefined
            ? ''
            : expected
        ).trim();

      if (
        actualString !==
        expectedString
      ) {

        matches = false;
      }
    });

    if (matches) {
      data.push(record);
    }

  });

  return {

    success: true,

    table:
      resolvedKey,

    count:
      data.length,

    data:
      data
  };
}


/**
 * ============================================================
 * UPDATE RECORD
 * ============================================================
 */

function updateRecordCore_435_(
  tableKey,
  recordId,
  updates,
  userId
) {

  if (
    databaseIsBlank_211_(
      tableKey
    )
  ) {

    throw new Error(
      'Table key is required.'
    );
  }

  if (
    databaseIsBlank_211_(
      recordId
    )
  ) {

    throw new Error(
      'Record ID is required.'
    );
  }

  if (
    !databaseSafeObject_211_(
      updates
    )
  ) {

    throw new Error(
      'Updates must be an object.'
    );
  }

  var resolvedKey =
    resolveDatabaseTableKey_211_(
      tableKey
    );

  var sheet =
    getDatabaseSheet(
      resolvedKey
    );

  var headers =
    getDatabaseHeaders(
      resolvedKey
    );

  var found =
    findDatabaseRowById_(
      resolvedKey,
      recordId
    );

  if (!found) {

    return {

      success: false,

      message:
        'Record not found: ' +
        recordId
    };
  }


  var beforeState =
    databaseRowToObject_(
      headers,
      found.row
    );


  var currentRow =
    found.row.slice();


  var formulaProtected =
    getDatabaseFormulaProtectedHeaders_211_(
      sheet,
      headers
    );


  Object.keys(
    updates
  ).forEach(function(field) {

    /*
     * ID can never be modified.
     */
    if (
      field ===
      DATABASE_CONFIG.ID_HEADER ||
      field === 'id'
    ) {

      return;
    }


    /*
     * Formula-controlled columns cannot be
     * manually overwritten.
     */
    if (
      formulaProtected[field]
    ) {

      return;
    }


    var index =
      headers.indexOf(
        field
      );

    if (
      index !== -1
    ) {

      currentRow[index] =
        updates[field];
    }

  });


  var updatedAtIndex =
    headers.indexOf(
      DATABASE_CONFIG.UPDATED_AT_HEADER
    );


  if (
    updatedAtIndex !== -1 &&
    updates[
      DATABASE_CONFIG.UPDATED_AT_HEADER
    ] === undefined
  ) {

    currentRow[
      updatedAtIndex
    ] =
      new Date();
  }


  sheet
    .getRange(
      found.rowNumber,
      1,
      1,
      headers.length
    )
    .setValues([
      currentRow
    ]);


  SpreadsheetApp.flush();


  var updatedRecord =
    getRecord(
      resolvedKey,
      recordId
    );


  var afterState =
    updatedRecord &&
    updatedRecord.success
      ? updatedRecord.data
      : null;


  if (
    typeof createAuditLog === 'function'
  ) {

    createAuditLog(
      'UPDATE',
      resolvedKey,
      recordId,
      userId || 'SYSTEM',
      beforeState,
      afterState
    );
  }


  return {

    success: true,

    message:
      'Record updated successfully.',

    data:
      afterState
  };
}


/**
 * ============================================================
 * DELETE RECORD — SOFT DELETE
 * ============================================================
 */

function deleteRecordCore_435_(
  tableKey,
  recordId,
  userId
) {

  if (
    databaseIsBlank_211_(
      tableKey
    )
  ) {

    throw new Error(
      'Table key is required.'
    );
  }

  if (
    databaseIsBlank_211_(
      recordId
    )
  ) {

    throw new Error(
      'Record ID is required.'
    );
  }

  var resolvedKey =
    resolveDatabaseTableKey_211_(
      tableKey
    );

  var found =
    findDatabaseRowById_(
      resolvedKey,
      recordId
    );

  if (!found) {

    return {

      success: false,

      message:
        'Record not found: ' +
        recordId
    };
  }


  var headers =
    getDatabaseHeaders(
      resolvedKey
    );

  var beforeState =
    databaseRowToObject_(
      headers,
      found.row
    );


  var statusIndex =
    headers.indexOf(
      DATABASE_CONFIG.STATUS_HEADER
    );


  if (
    statusIndex === -1
  ) {

    throw new Error(
      'Status column not found. ' +
      'Soft delete cannot be performed.'
    );
  }


  var sheet =
    getDatabaseSheet(
      resolvedKey
    );


  var statusValue =
    'Deleted';


  /*
   * Respect formula-controlled Status fields.
   */
  var formulaProtected =
    getDatabaseFormulaProtectedHeaders_211_(
      sheet,
      headers
    );


  if (
    formulaProtected[
      DATABASE_CONFIG.STATUS_HEADER
    ]
  ) {

    throw new Error(
      'Status column is formula-controlled. ' +
      'Soft delete cannot modify it.'
    );
  }


  sheet
    .getRange(
      found.rowNumber,
      statusIndex + 1
    )
    .setValue(
      statusValue
    );


  var updatedAtIndex =
    headers.indexOf(
      DATABASE_CONFIG.UPDATED_AT_HEADER
    );


  if (
    updatedAtIndex !== -1 &&
    !formulaProtected[
      DATABASE_CONFIG.UPDATED_AT_HEADER
    ]
  ) {

    sheet
      .getRange(
        found.rowNumber,
        updatedAtIndex + 1
      )
      .setValue(
        new Date()
      );
  }


  SpreadsheetApp.flush();


  var afterResult =
    getRecord(
      resolvedKey,
      recordId
    );


  var afterState =
    afterResult &&
    afterResult.success
      ? afterResult.data
      : null;


  if (
    typeof createAuditLog === 'function'
  ) {

    createAuditLog(
      'DELETE',
      resolvedKey,
      recordId,
      userId || 'SYSTEM',
      beforeState,
      afterState
    );
  }


  return {

    success: true,

    message:
      'Record deleted successfully.',

    data:
      afterState
  };
}


/**
 * ============================================================
 * SOFT DELETE ALIAS
 * ============================================================
 */

function softDeleteRecord(
  tableKey,
  recordId,
  userId
) {

  return deleteRecord(
    tableKey,
    recordId,
    userId
  );
}


/**
 * ============================================================
 * RECORD EXISTS
 * ============================================================
 */

function recordExists(
  tableKey,
  recordId
) {

  if (
    databaseIsBlank_211_(
      tableKey
    ) ||
    databaseIsBlank_211_(
      recordId
    )
  ) {

    return false;
  }

  return !!findDatabaseRowById_(
    tableKey,
    recordId
  );
}


/**
 * ============================================================
 * EXISTS ALIAS
 * ============================================================
 */

function existsRecord(
  tableKey,
  recordId
) {

  return recordExists(
    tableKey,
    recordId
  );
}


/**
 * ============================================================
 * COUNT RECORDS
 * ============================================================
 */

function countRecords(
  tableKey
) {

  return getDatabasePhysicalRows_211_(
    tableKey
  ).length;
}


/**
 * ============================================================
 * APPEND DATABASE ROW
 * ============================================================
 */

function appendDatabaseRowCore_435_(
  tableKey,
  row
) {

  if (
    !Array.isArray(row)
  ) {

    throw new Error(
      'Row must be an array.'
    );
  }

  var sheet =
    getDatabaseSheet(
      tableKey
    );

  var headers =
    getDatabaseHeaders(
      tableKey
    );

  if (
    row.length >
    headers.length
  ) {

    throw new Error(
      'Row contains more values than database headers.'
    );
  }

  var normalizedRow =
    row.slice();

  while (
    normalizedRow.length <
    headers.length
  ) {

    normalizedRow.push('');
  }


  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      1,
      headers.length
    )
    .setValues([
      normalizedRow
    ]);


  return {

    success: true,

    message:
      'Database row appended successfully.'
  };
}


/**
 * ============================================================
 * PAGINATED RECORD ACCESS
 * ============================================================
 */

function getRecordsPage(tableKey, page, pageSize, options) {
  var resolvedKey = resolveDatabaseTableKey_211_(tableKey);
  options = databaseSafeObject_211_(options) ? options : {};
  page = Math.max(1, Number(page) || 1);
  pageSize = Math.max(1, Math.min(DATABASE_CONFIG.MAX_PAGE_SIZE, Number(pageSize) || DATABASE_CONFIG.DEFAULT_PAGE_SIZE));

  var headers = getDatabaseHeaders(resolvedKey);
  var physicalRows = getDatabasePhysicalRows_211_(resolvedKey);
  var includeDeleted = options.includeDeleted === true;
  var records = [];

  for (var i = 0; i < physicalRows.length && records.length < DATABASE_CONFIG.MAX_SCAN_ROWS; i++) {
    var record = databaseRowToObject_(headers, physicalRows[i].row);
    if (!includeDeleted && String(record[DATABASE_CONFIG.STATUS_HEADER] || '').toLowerCase() === 'deleted') continue;
    records.push(record);
  }

  var total = records.length;
  var start = (page - 1) * pageSize;
  var data = records.slice(start, start + pageSize);

  return {
    success: true,
    table: resolvedKey,
    page: page,
    pageSize: pageSize,
    count: data.length,
    total: total,
    totalPages: Math.ceil(total / pageSize),
    hasNext: start + data.length < total,
    hasPrevious: page > 1,
    data: data
  };
}

function getDatabasePage(tableKey, page, pageSize, options) {
  return getRecordsPage(tableKey, page, pageSize, options);
}

/**
 * ============================================================
 * DATABASE HEALTH CHECK
 * ============================================================
 */

function databaseHealthCheck() {

  var result = {

    success: true,

    version:
      DATABASE_CONFIG.VERSION,

    spreadsheetId: '',

    spreadsheetName: '',

    tables: {},

    errors: []
  };


  try {

    var ss =
      getDatabaseSpreadsheet();

    result.spreadsheetId =
      ss.getId();

    result.spreadsheetName =
      ss.getName();

  } catch (error) {

    result.success = false;

    result.errors.push(
      error.message
    );

    return result;
  }


  var tables;

  try {

    tables =
      getDatabaseConfiguredTables_211_();

  } catch (error) {

    result.success = false;

    result.errors.push(
      error.message
    );

    return result;
  }


  Object.keys(
    tables
  ).forEach(function(key) {

    var sheetName =
      String(
        tables[key]
      ).trim();

    var sheet =
      ss.getSheetByName(
        sheetName
      );

    result.tables[key] = {

      sheetName:
        sheetName,

      exists:
        !!sheet,

      headers:
        [],

      records:
        0
    };


    if (!sheet) {

      result.success = false;

      result.errors.push(
        'Database sheet not found: ' +
        sheetName
      );

      return;
    }


    try {

      var headers =
        getDatabaseHeaders(
          key
        );

      result.tables[key].headers =
        headers;

      result.tables[key].records =
        getDatabasePhysicalRows_211_(
          key
        ).length;

    } catch (error) {

      result.success = false;

      result.errors.push(
        key +
        ': ' +
        error.message
      );
    }

  });


  return result;
}


/**
 * ============================================================
 * TEST — DATABASE CONNECTION
 * ============================================================
 */

function testDatabaseConnection() {

  var ss =
    getDatabaseSpreadsheet();

  return {

    success: true,

    spreadsheetId:
      ss.getId(),

    spreadsheetName:
      ss.getName()
  };
}


/**
 * ============================================================
 * TEST — DATABASE CONFIGURATION AUTHORITY
 * ============================================================
 *
 * Read-only configuration/runtime diagnostic.
 * Confirms Database.gs can consume the existing RDGConfig.gs
 * database spreadsheet identity without hard-coding an ID.
 * ============================================================
 */

function testDatabaseConfigurationAuthority435() {

  var result = {
    success: false,
    version: DATABASE_CONFIG.VERSION,
    rdgConfigAvailable:
      typeof RDG_CONFIG !== 'undefined',
    rdgDatabaseConfigAvailable: false,
    configuredSpreadsheetId: '',
    resolvedSpreadsheetId: '',
    spreadsheetName: '',
    authority: 'RDG_CONFIG.DATABASE.SPREADSHEET_ID',
    error: null
  };

  try {
    result.rdgDatabaseConfigAvailable = !!(
      typeof RDG_CONFIG !== 'undefined' &&
      RDG_CONFIG &&
      RDG_CONFIG.DATABASE
    );

    if (!result.rdgDatabaseConfigAvailable) {
      throw new Error(
        'RDG_CONFIG.DATABASE is unavailable.'
      );
    }

    result.configuredSpreadsheetId = String(
      RDG_CONFIG.DATABASE.SPREADSHEET_ID || ''
    ).trim();

    if (!result.configuredSpreadsheetId) {
      throw new Error(
        'RDG_CONFIG.DATABASE.SPREADSHEET_ID is empty.'
      );
    }

    var ss = getDatabaseSpreadsheet();

    result.resolvedSpreadsheetId = String(
      ss.getId() || ''
    ).trim();

    result.spreadsheetName = ss.getName();
    result.success =
      result.resolvedSpreadsheetId ===
      result.configuredSpreadsheetId;

    if (!result.success) {
      result.error =
        'Resolved spreadsheet ID does not match RDG_CONFIG.DATABASE.SPREADSHEET_ID.';
    }
  } catch (error) {
    result.success = false;
    result.error = databaseSafeErrorMessage_435_(error);
  }

  // Apps Script editor execution logs do not reliably display a
  // returned object. Log the complete diagnostic explicitly so the
  // runtime result is visible and auditable. The spreadsheet IDs are
  // masked to avoid unnecessarily exposing configuration secrets.
  var configuredId = result.configuredSpreadsheetId || '';
  var resolvedId = result.resolvedSpreadsheetId || '';
  var visibleResult = {
    success: result.success,
    version: result.version,
    rdgConfigAvailable: result.rdgConfigAvailable,
    rdgDatabaseConfigAvailable: result.rdgDatabaseConfigAvailable,
    authority: result.authority,
    configuredSpreadsheetIdMasked: configuredId ?
      configuredId.substring(0, 4) + '...' + configuredId.substring(configuredId.length - 4) : '',
    resolvedSpreadsheetIdMasked: resolvedId ?
      resolvedId.substring(0, 4) + '...' + resolvedId.substring(resolvedId.length - 4) : '',
    spreadsheetName: result.spreadsheetName || '',
    error: result.error
  };

  Logger.log('DATABASE CONFIGURATION AUTHORITY 4.3.5');
  Logger.log(JSON.stringify(visibleResult, null, 2));

  return result;
}


/**
 * ============================================================
 * TEST — TABLE RESOLUTION
 * ============================================================
 */

function testDatabaseTableResolution() {

  var tables =
    getDatabaseConfiguredTables_211_();

  var result = {

    success: true,

    tables: {}
  };


  Object.keys(
    tables
  ).forEach(function(key) {

    try {

      var resolved =
        resolveDatabaseTableKey_211_(
          key
        );

      result.tables[key] =
        resolved;

    } catch (error) {

      result.success = false;

      result.tables[key] =
        'ERROR: ' +
        error.message;
    }

  });


  return result;
}


/**
 * ============================================================
 * TEST — BLANK TABLE KEY PROTECTION
 * ============================================================
 */

function testDatabaseBlankTableKeyProtection() {

  var testValues = [
    null,
    undefined,
    '',
    '   '
  ];

  var results = [];

  testValues.forEach(function(value) {

    try {

      resolveDatabaseTableKey_211_(
        value
      );

      results.push({

        value: value,

        success: false,

        error:
          'Expected validation error was not thrown.'
      });

    } catch (error) {

      results.push({

        value: value,

        success: true,

        error:
          error.message
      });
    }

  });


  return {

    success:
      results.every(function(item) {
        return item.success;
      }),

    results:
      results
  };
}


/**
 * ============================================================
 * ADVANCED CONTRACT TESTS — v4.3.5
 * ============================================================
 */

function testDatabaseAdvancedConfiguration() {
  return {
    success: true,
    version: DATABASE_CONFIG.VERSION,
    headerRow: DATABASE_CONFIG.HEADER_ROW,
    dataStartRow: DATABASE_CONFIG.DATA_START_ROW,
    idHeader: DATABASE_CONFIG.ID_HEADER,
    statusHeader: DATABASE_CONFIG.STATUS_HEADER,
    lockTimeoutMs: DATABASE_CONFIG.LOCK_TIMEOUT_MS,
    maxPageSize: DATABASE_CONFIG.MAX_PAGE_SIZE,
    serverAuthEnforced: DATABASE_CONFIG.ENFORCE_SERVER_AUTH
  };
}

function testDatabaseAdvancedTableResolution() {
  var tables = getDatabaseConfiguredTables_211_();
  var failures = [];
  Object.keys(tables).forEach(function(key) {
    try {
      var resolved = resolveDatabaseTableKey_211_(key);
      if (resolved !== key) failures.push(key + ' -> ' + resolved);
    } catch (error) {
      failures.push(key + ': ' + databaseSafeErrorMessage_435_(error));
    }
  });
  return { success: failures.length === 0, checked: Object.keys(tables).length, failures: failures };
}

function testDatabaseAdvancedSafetyContracts() {
  var checks = [];
  checks.push({name:'blankTableRejected', pass:false});
  try { resolveDatabaseTableKey_211_(''); } catch (error) { checks[0].pass = true; }
  checks.push({name:'lockHelperExists', pass:typeof withDatabaseLock_435_ === 'function'});
  checks.push({name:'paginationExists', pass:typeof getRecordsPage === 'function'});
  checks.push({name:'createWrapperExists', pass:typeof createRecord === 'function'});
  checks.push({name:'updateWrapperExists', pass:typeof updateRecord === 'function'});
  checks.push({name:'deleteWrapperExists', pass:typeof deleteRecord === 'function'});
  checks.push({name:'appendWrapperExists', pass:typeof appendDatabaseRow === 'function'});
  return {success: checks.every(function(c){return c.pass;}), checks: checks};
}

function testDatabaseAdvanced435() {
  var results = [];
  try { results.push({test:'configuration', result:testDatabaseAdvancedConfiguration()}); } catch (e) { results.push({test:'configuration', result:{success:false,error:databaseSafeErrorMessage_435_(e)}}); }
  try { results.push({test:'tableResolution', result:testDatabaseAdvancedTableResolution()}); } catch (e) { results.push({test:'tableResolution', result:{success:false,error:databaseSafeErrorMessage_435_(e)}}); }
  try { results.push({test:'safetyContracts', result:testDatabaseAdvancedSafetyContracts()}); } catch (e) { results.push({test:'safetyContracts', result:{success:false,error:databaseSafeErrorMessage_435_(e)}}); }
  var success = results.every(function(item){return item.result && item.result.success !== false;});
  return {success:success, version:DATABASE_CONFIG.VERSION, results:results, status:success ? 'PASS_WITH_RUNTIME_DATABASE_VALIDATION_PENDING' : 'FAIL'};
}

/**
 * ============================================================
 * TEST — DATABASE MODULE HEALTH
 * ============================================================
 */

function testDatabaseModuleHealth() {

  return databaseHealthCheck();
}