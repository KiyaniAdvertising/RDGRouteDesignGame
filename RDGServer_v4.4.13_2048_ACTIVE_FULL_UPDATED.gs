/**
 * RDGServer.gs
 * RD Route Design ACC — Universal Multi-Platform System
 * Universal Server / CRUD / Security / Audit / Nested Data / API Layer
 *
 * Version: 3.0.0
 * NOTE: This is the ORIGINAL Apps Script .gs source file.
 */

var RDG_SERVER_VERSION = '4.4.13';
var RDG_SERVER_RUNTIME_MARKER_412 = 'RDG_SERVER_RUNTIME_4.4.13';


/* =========================================================
 * CORE RDG UTILITY COMPATIBILITY — v4.4.12
 * =========================================================
 * RDGUtils.gs remains the preferred authority. These uniquely named
 * adapters prevent RDGServer from crashing when utility globals are not
 * loaded in the active Apps Script runtime.
 */
function rdgSafeString_412(value) {
  if (typeof rdgSafeString === 'function') return rdgSafeString(value);
  if (value === null || typeof value === 'undefined') return '';
  return String(value);
}
function rdgIsPlainObject_412(value) {
  if (typeof rdgIsPlainObject === 'function') return rdgIsPlainObject(value);
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function rdgDeepClone_412(value) {
  if (typeof rdgDeepClone === 'function') return rdgDeepClone(value);
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(rdgDeepClone_412);
  var out = {};
  Object.keys(value).forEach(function(k) { out[k] = rdgDeepClone_412(value[k]); });
  return out;
}
function rdgEnsureArray_412(value) {
  if (typeof rdgEnsureArray === 'function') return rdgEnsureArray(value);
  return Array.isArray(value) ? value : (value === null || typeof value === 'undefined' ? [] : [value]);
}
function rdgToNumber_412(value, fallback) {
  if (typeof rdgToNumber === 'function') return rdgToNumber(value, fallback);
  var n = Number(value);
  return isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
}
function rdgNormalizeCode_412(value) {
  if (typeof rdgNormalizeCode === 'function') return rdgNormalizeCode(value);
  return rdgSafeString(value).trim().toUpperCase();
}
function rdgNormalizeObject_412(value) {
  if (typeof rdgNormalizeObject === 'function') return rdgNormalizeObject(value);
  return rdgIsPlainObject(value) ? rdgDeepClone_412(value) : {};
}
function rdgPaginate_412(items, page, pageSize) {
  if (typeof rdgPaginate === 'function') return rdgPaginate(items, page, pageSize);
  items = rdgEnsureArray_412(items);
  page = Math.max(1, Math.floor(rdgToNumber_412(page, 1)));
  pageSize = Math.max(1, Math.floor(rdgToNumber_412(pageSize, 25)));
  var total = items.length, totalPages = total ? Math.ceil(total / pageSize) : 0;
  var start = (page - 1) * pageSize;
  return {items: items.slice(start, start + pageSize), page: page, pageSize: pageSize,
    total: total, totalPages: totalPages, hasNext: page < totalPages,
    hasPrevious: page > 1 && totalPages > 0};
}
function rdgSortRecords_412(records, field, direction) {
  if (typeof rdgSortRecords === 'function') return rdgSortRecords(records, field, direction);
  var list = rdgEnsureArray_412(records).slice();
  var dir = rdgSafeString_412(direction || 'asc').toLowerCase() === 'desc' ? -1 : 1;
  list.sort(function(a,b) {
    var av = a && typeof a === 'object' ? a[field] : a;
    var bv = b && typeof b === 'object' ? b[field] : b;
    if (av === bv) return 0;
    if (av === null || typeof av === 'undefined') return -1 * dir;
    if (bv === null || typeof bv === 'undefined') return 1 * dir;
    return String(av).localeCompare(String(bv), undefined, {numeric:true, sensitivity:'base'}) * dir;
  });
  return list;
}
function rdgValidateRequiredFields_412(data, fields) {
  if (typeof rdgValidateRequiredFields === 'function') return rdgValidateRequiredFields(data, fields);
  data = rdgIsPlainObject_412(data) ? data : {};
  fields = rdgEnsureArray_412(fields);
  var missing = fields.filter(function(f) { return rdgSafeString(data[f]).trim() === ''; });
  return {valid: missing.length === 0, missing: missing};
}
function rdgGetConfigValue_412(path, fallback) {
  if (typeof rdgGetConfigValue === 'function') return rdgGetConfigValue(path, fallback);
  var cur = (typeof APP_CONFIG !== 'undefined') ? APP_CONFIG : null;
  if (!cur) return fallback;
  rdgEnsureArray_412(rdgSafeString_412(path).split('.')).forEach(function(part) {
    if (cur !== null && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur, part)) cur = cur[part];
    else cur = undefined;
  });
  return cur === undefined ? fallback : cur;
}
function rdgBuildId_412(prefix, length) {
  if (typeof rdgBuildId === 'function') return rdgBuildId(prefix, length);
  var pfx = rdgSafeString_412(prefix || 'RDG').replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
  var len = Math.max(4, Math.floor(rdgToNumber_412(length, 8)));
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '';
  for (var i=0;i<len;i++) out += chars.charAt(Math.floor(Math.random()*chars.length));
  return pfx + '-' + out;
}
function rdgNormalizeExistingIndex_412(length, index) {
  if (typeof rdgNormalizeExistingIndex === 'function') return rdgNormalizeExistingIndex(length,index);
  var n = Math.max(0, Math.floor(rdgToNumber_412(length,0)));
  if (!n) return -1;
  var i = Math.trunc(rdgToNumber_412(index,0));
  if (i < 0) i = n + i;
  return i >= 0 && i < n ? i : -1;
}

/* =========================================================
 * TIME HELPER — LOCAL SAFE FALLBACK
 * ========================================================= */
function rdgNowIso() {
  return new Date().toISOString();
}

/* =========================================================
 * CORE UTILITY COMPATIBILITY — v4.4.11
 * ========================================================= */
function rdgSafeString_411(value) {
  if (typeof rdgSafeString === 'function') return rdgSafeString(value);
  if (value === null || typeof value === 'undefined') return '';
  return String(value);
}

function rdgNormalizeExistingIndex_411(length, index) {
  var n = Number(length);
  if (!isFinite(n)) n = 0;
  n = Math.max(0, Math.floor(n));
  if (!n) return -1;

  var i = Number(index);
  if (!isFinite(i)) i = 0;
  i = Math.trunc(i);
  if (i < 0) i = n + i;
  return i >= 0 && i < n ? i : -1;
}

/* =========================================================
 * IDENTITY NORMALIZATION — LOCAL SAFE FALLBACK
 * ========================================================= */
function rdgNormalizeEmail_448(value) {
  if (typeof rdgNormalizeEmail === 'function') {
    return rdgNormalizeEmail(value);
  }
  return String(value === null || typeof value === 'undefined' ? '' : value)
    .trim()
    .toLowerCase();
}

/* =========================================================
 * RESPONSE HELPERS — LOCAL SAFE FALLBACK
 * =========================================================
 * RDGServer may be deployed with or without a shared response
 * helper module. These uniquely named internal helpers prevent
 * direct dependency on a global rdgSuccess_()/rdgError_() function.
 */

function rdgInsertArrayItem(array, index, item) {
  if (!Array.isArray(array)) {
    throw new Error('rdgInsertArrayItem(): array is required.');
  }

  var length = array.length;
  var normalizedIndex = Number(index);

  if (!isFinite(normalizedIndex)) {
    normalizedIndex = length;
  } else {
    normalizedIndex = Math.trunc(normalizedIndex);
    if (normalizedIndex < 0) normalizedIndex = Math.max(0, length + normalizedIndex);
    if (normalizedIndex > length) normalizedIndex = length;
  }

  array.splice(normalizedIndex, 0, item);
  return array;
}

function rdgSuccess_(data, message, meta) {
  if (typeof rdgSuccess === 'function') {
    return rdgSuccess(data, message, meta);
  }

  var result = {
    success: true,
    data: data
  };

  if (message !== undefined && message !== null && message !== '') {
    result.message = message;
  }

  if (meta !== undefined && meta !== null) {
    result.meta = meta;
  }

  return result;
}

function rdgError_(errorOrMessage, code, meta) {
  if (typeof rdgError === 'function') {
    return rdgError(errorOrMessage, code, meta);
  }

  var message = '';
  if (errorOrMessage instanceof Error) {
    message = errorOrMessage.message || String(errorOrMessage);
  } else if (errorOrMessage !== undefined && errorOrMessage !== null) {
    message = String(errorOrMessage);
  } else {
    message = 'Unknown RDG server error.';
  }

  var result = {
    success: false,
    error: message
  };

  if (code !== undefined && code !== null && code !== '') {
    result.code = code;
  }

  if (meta !== undefined && meta !== null) {
    result.meta = meta;
  }

  return result;
}


function testRDGServerResponseHelpers445() {
  var success = rdgSuccess_({ok: true}, 'helper test');
  var failure = rdgError_('expected failure', 'TEST_ERROR');

  var result = {
    version: RDG_SERVER_VERSION,
    successHelper: !!success && success.success === true,
    errorHelper: !!failure && failure.success === false,
    errorCode: failure && failure.code === 'TEST_ERROR'
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}


function testRDGArrayInsertDependency449() {
  var sample = [{id: 1}, {id: 2}, {id: 3}];
  rdgInsertArrayItem(sample, -1, {id: 99});
  var first = sample.length === 4 && sample[2].id === 99 && sample[3].id === 3;
  rdgInsertArrayItem(sample, -2, {id: 88});
  var second = sample.length === 5 && sample[2].id === 88 && sample[3].id === 99;
  var result = {version: RDG_SERVER_VERSION, insertArrayItem: true, negativeIndexRules: first && second, pass: first && second};
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/* =========================================================
 * WEB APP
 * ========================================================= */

function doGet(e) {
  try {
    var template = HtmlService.createTemplateFromFile('RDGGame');
    template.appConfig = getPublicConfig_();

    return template.evaluate()
      .setTitle(getConfigValue_('app.name', 'RD Route Design ACC'))
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return HtmlService.createHtmlOutput(
      '<h2>RDG Server Error</h2><pre>' +
      escapeHtml_(rdgErrorMessage_447(error)) +
      '</pre>'
    );
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* =========================================================
 * INITIALIZATION
 * ========================================================= */

function initializeSystem() {
  return withScriptLock_(function() {
    var tables = getConfiguredTables_();
    var created = [];
    var existing = [];

    tables.forEach(function(tableKey) {
      var sheet = getSheet_(tableKey);
      ensureTableHeaders_(sheet, tableKey);

      if (sheet.getLastRow() <= 1) {
        created.push(tableKey);
      } else {
        existing.push(tableKey);
      }
    });

    return rdgSuccess_({
      initialized: true,
      tableCount: tables.length,
      createdOrReady: created,
      existing: existing,
      spreadsheetId: getDatabaseSpreadsheet_().getId()
    }, 'RDG database initialized.');
  });
}

function getSystemBootstrap() {
  return rdgSuccess_({
    app: getPublicConfig_(),
    serverVersion: RDG_SERVER_VERSION,
    database: {
      spreadsheetId: getDatabaseSpreadsheet_().getId()
    },
    tables: getConfiguredTables_(),
    serverTime: rdgNowIso()
  });
}

/* =========================================================
 * UNIVERSAL CRUD
 * ========================================================= */

function createRecord(tableName, recordData, options) {
  if (rdgIsBlank_447(tableName)) {
    throw new Error(
      'createRecord(): tableName is required. ' +
      'Example: createRecord("users", data, options).'
    );
  }
  if (!rdgIsPlainObject_412(recordData)) {
    throw new Error('createRecord(): recordData must be an object.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};

  return withScriptLock_(function() {
    var tableKey = resolveTableKey_(tableName);
    var record = rdgNormalizeObject_412(recordData);
    var context = getRequestContext_();

    record = applyCompanyContext_(record, options, context);

    if (rdgIsBlank_447(record.id)) {
      record.id = generateRecordId_(tableKey);
    }

    var now = new Date();
    if (!record.createdAt) record.createdAt = now;
    record.updatedAt = now;

    if (rdgIsBlank_447(record.status)) {
      record.status = getSystemDefaultStatus_();
    }

    if (rdgIsBlank_447(record.createdBy)) {
      record.createdBy = context.userId;
    }
    record.updatedBy = context.userId;

    validateRecord_(tableKey, record, {operation: 'create'});

    var sheet = getSheet_(tableKey);
    ensureTableHeaders_(sheet, tableKey);

    if (findRecordById_(tableKey, record.id)) {
      throw new Error('Duplicate record ID: ' + record.id);
    }

    var headers = getHeaders_(sheet);
    sheet.appendRow(recordToRow_(tableKey, record, headers));

    var created = findRecordById_(tableKey, record.id);
    var finalRecord = created ? created.record : record;

    auditRecord_('CREATE', tableKey, record.id, null, finalRecord, options);

    return finalRecord;
  });
}

function getRecord(tableName, recordId, options) {
  if (rdgIsBlank_447(tableName)) throw new Error('getRecord(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('getRecord(): recordId is required.');

  options = rdgIsPlainObject_412(options) ? options : {};

  var tableKey = resolveTableKey_(tableName);
  var found = findRecordById_(tableKey, recordId);

  if (!found) return null;
  if (!options.includeDeleted && found.record.deletedAt) return null;

  var context = getRequestContext_();
  if (!canAccessRecord_(found.record, context, options)) {
    throw new Error('Unauthorized record access.');
  }

  return found.record;
}

function getAllRecords(tableName, options) {
  if (rdgIsBlank_447(tableName)) {
    throw new Error('getAllRecords(): tableName is required.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  var tableKey = resolveTableKey_(tableName);
  var records = readAllRecords_(tableKey);
  var context = getRequestContext_();

  records = records.filter(function(record) {
    if (!options.includeDeleted && record.deletedAt) return false;
    if (!options.includeInactive &&
        String(record.status || '').toUpperCase() === 'INACTIVE') return false;
    return canAccessRecord_(record, context, options);
  });

  if (options.sortBy) {
    records = rdgSortRecords_412(records, options.sortBy, options.sortDirection);
  }

  if (options.page || options.pageSize) {
    return rdgPaginate(records, options.page, options.pageSize);
  }

  return records;
}

function findRecords(tableName, filters, options) {
  if (rdgIsBlank_447(tableName)) {
    throw new Error('findRecords(): tableName is required.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  filters = rdgIsPlainObject_412(filters) ? filters : {};

  var tableKey = resolveTableKey_(tableName);
  var records = readAllRecords_(tableKey);
  var context = getRequestContext_();

  records = records.filter(function(record) {
    if (!options.includeDeleted && record.deletedAt) return false;
    if (!options.includeInactive &&
        String(record.status || '').toUpperCase() === 'INACTIVE') return false;
    if (!canAccessRecord_(record, context, options)) return false;
    return matchesFilters_(record, filters);
  });

  if (options.sortBy) {
    records = rdgSortRecords_412(records, options.sortBy, options.sortDirection);
  }

  if (options.page || options.pageSize) {
    return rdgPaginate(records, options.page, options.pageSize);
  }

  return records;
}

function updateRecord(tableName, recordId, changes, options) {
  if (rdgIsBlank_447(tableName)) throw new Error('updateRecord(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('updateRecord(): recordId is required.');
  if (!rdgIsPlainObject_412(changes)) throw new Error('updateRecord(): changes must be an object.');

  options = rdgIsPlainObject_412(options) ? options : {};

  return withScriptLock_(function() {
    var tableKey = resolveTableKey_(tableName);
    var found = findRecordById_(tableKey, recordId);

    if (!found) throw new Error('Record not found: ' + recordId);

    var context = getRequestContext_();
    if (!canAccessRecord_(found.record, context, options)) {
      throw new Error('Unauthorized record update.');
    }

    var before = rdgDeepClone_412(found.record);
    var updated = rdgDeepClone_412(found.record);

    if (options.replace === true) {
      updated = rdgNormalizeObject_412(changes);
      updated.id = found.record.id;
      if (!updated.createdAt) updated.createdAt = found.record.createdAt;
      if (!updated.createdBy) updated.createdBy = found.record.createdBy;
    } else {
      Object.keys(changes).forEach(function(key) {
        if (key.indexOf('.') !== -1) {
          setNested(updated, key, changes[key]);
        } else {
          updated[key] = rdgDeepClone_412(changes[key]);
        }
      });
    }

    updated.updatedAt = new Date();
    updated.updatedBy = context.userId;

    var currentVersion = rdgToNumber_412(found.record.version, 0);
    if (options.expectedVersion !== null &&
        typeof options.expectedVersion !== 'undefined' &&
        currentVersion !== rdgToNumber_412(options.expectedVersion)) {
      throw new Error('Version conflict. Record was changed by another operation.');
    }
    updated.version = currentVersion + 1;

    updated = applyCompanyContext_(updated, options, context);
    validateRecord_(tableKey, updated, {operation: 'update'});

    var sheet = getSheet_(tableKey);
    var headers = getHeaders_(sheet);
    sheet.getRange(found.rowNumber, 1, 1, headers.length)
      .setValues([recordToRow_(tableKey, updated, headers)]);

    auditRecord_('UPDATE', tableKey, recordId, before, updated, options);

    return updated;
  });
}

function deleteRecord(tableName, recordId, options) {
  if (rdgIsBlank_447(tableName)) throw new Error('deleteRecord(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('deleteRecord(): recordId is required.');

  options = rdgIsPlainObject_412(options) ? options : {};

  return withScriptLock_(function() {
    var tableKey = resolveTableKey_(tableName);
    var found = findRecordById_(tableKey, recordId);

    if (!found) throw new Error('Record not found: ' + recordId);

    var context = getRequestContext_();
    if (!canAccessRecord_(found.record, context, options)) {
      throw new Error('Unauthorized record deletion.');
    }

    var before = rdgDeepClone_412(found.record);
    var sheet = getSheet_(tableKey);
    var headers = getHeaders_(sheet);

    if (rdgGetConfigValue_412('settings.softDelete', true) !== false &&
        options.hardDelete !== true) {
      var deleted = rdgDeepClone_412(found.record);
      deleted.deletedAt = new Date();
      deleted.deletedBy = context.userId;
      deleted.status = 'DELETED';
      deleted.updatedAt = new Date();
      deleted.updatedBy = context.userId;
      deleted.version = rdgToNumber_412(deleted.version, 0) + 1;

      sheet.getRange(found.rowNumber, 1, 1, headers.length)
        .setValues([recordToRow_(tableKey, deleted, headers)]);

      auditRecord_('SOFT_DELETE', tableKey, recordId, before, deleted, options);
      return deleted;
    }

    if (rdgGetConfigValue_412('security.preventHardDelete', true) !== false &&
        options.allowHardDelete !== true) {
      throw new Error('Hard delete is disabled by security policy.');
    }

    sheet.deleteRow(found.rowNumber);
    auditRecord_('HARD_DELETE', tableKey, recordId, before, null, options);

    return {
      id: recordId,
      deleted: true,
      hardDelete: true
    };
  });
}

/* =========================================================
 * DATABASE / SHEET LAYER
 * ========================================================= */

function getDatabaseSpreadsheet_() {
  var configuredId = getConfigValue_('database.spreadsheetId', '');

  if (!configuredId) {
    configuredId = PropertiesService.getScriptProperties()
      .getProperty('RDG_DATABASE_SPREADSHEET_ID');
  }

  if (configuredId) {
    return SpreadsheetApp.openById(configuredId);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  throw new Error(
    'RDG database spreadsheet is not configured. ' +
    'Set database.spreadsheetId or RDG_DATABASE_SPREADSHEET_ID.'
  );
}

function getSheet_(tableName) {
  var tableKey = resolveTableKey_(tableName);
  var spreadsheet = getDatabaseSpreadsheet_();
  var sheetName = getConfiguredTableName_(tableKey);
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    if (rdgGetConfigValue_412('settings.automaticSheetCreation', true) === false) {
      throw new Error('Sheet not found: ' + sheetName);
    }
    sheet = spreadsheet.insertSheet(sheetName);
  }

  return sheet;
}

function createTable_(tableKey) {
  var sheet = getSheet_(tableKey);
  ensureTableHeaders_(sheet, tableKey);
  return sheet;
}

function ensureTableHeaders_(sheet, tableKey) {
  var headers = getTableHeaders_(tableKey);
  if (!headers.length) throw new Error('No schema headers configured for: ' + tableKey);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }

  var current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length))
    .getValues()[0]
    .slice(0, headers.length);

  var needsUpdate = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(current[i] || '') !== String(headers[i])) {
      needsUpdate = true;
      break;
    }
  }

  if (needsUpdate) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function getHeaders_(sheet) {
  if (sheet.getLastColumn() === 0) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function(value) { return String(value || '').trim(); })
    .filter(function(value) { return value !== ''; });
}

function getTableHeaders_(tableKey) {
  var schema = getTableConfigSchema_(tableKey);
  return schema && Array.isArray(schema.headers) ? schema.headers : [];
}

function readAllRecords_(tableKey) {
  var sheet = getSheet_(tableKey);
  ensureTableHeaders_(sheet, tableKey);

  var headers = getHeaders_(sheet);
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  return values.map(function(row, index) {
    return rowToRecord_(tableKey, row, headers, index + 2);
  }).filter(function(record) {
    return record !== null;
  });
}

function rowToRecord_(tableKey, row, headers, rowNumber) {
  var record = {};

  headers.forEach(function(header, index) {
    var value = row[index];

    if (isJsonField_(tableKey, header)) {
      if (value === '' || value === null) {
        value = {};
      } else {
        var parsed = safeJsonParse(value, value);
        value = parsed;
      }
    }

    record[header] = value;
  });

  if (rowNumber) record._rowNumber = rowNumber;
  return record;
}

function recordToRow_(tableKey, record, headers) {
  return headers.map(function(header) {
    var value = getNested(record, header, '');

    if (isJsonField_(tableKey, header)) {
      if (value === null || typeof value === 'undefined' || value === '') return '';
      return safeJsonStringify(value, '');
    }

    if (value instanceof Date) return value;
    if (rdgIsPlainObject_412(value) || Array.isArray(value)) {
      return safeJsonStringify(value, '');
    }

    return value;
  });
}

function findRecordById_(tableKey, recordId) {
  var sheet = getSheet_(tableKey);
  ensureTableHeaders_(sheet, tableKey);

  var headers = getHeaders_(sheet);
  var idIndex = headers.indexOf('id');
  if (idIndex === -1) throw new Error('Schema must contain id field: ' + tableKey);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  var ids = sheet.getRange(2, idIndex + 1, lastRow - 1, 1).getValues();

  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(recordId)) {
      return {
        rowNumber: i + 2,
        record: rowToRecord_(
          tableKey,
          sheet.getRange(i + 2, 1, 1, headers.length).getValues()[0],
          headers,
          i + 2
        )
      };
    }
  }

  return null;
}

/* =========================================================
 * FILTER ENGINE
 * ========================================================= */

function matchesFilters_(record, filters) {
  return Object.keys(filters).every(function(field) {
    var expected = filters[field];
    var actual = getFieldValue_(record, field);

    if (rdgIsPlainObject_412(expected)) {
      return Object.keys(expected).every(function(operator) {
        return compareFilter_(actual, operator, expected[operator]);
      });
    }

    return compareFilter_(actual, '$eq', expected);
  });
}

function compareFilter_(actual, operator, expected) {
  var op = String(operator || '$eq').toLowerCase();

  switch (op) {
    case '$eq':
      return actual === expected || String(actual) === String(expected);
    case '$ne':
      return !(actual === expected || String(actual) === String(expected));
    case '$in':
      return rdgEnsureArray(expected).some(function(item) {
        return actual === item || String(actual) === String(item);
      });
    case '$nin':
      return !compareFilter_(actual, '$in', expected);
    case '$contains':
      return String(actual || '').toLowerCase()
        .indexOf(String(expected || '').toLowerCase()) !== -1;
    case '$startswith':
      return String(actual || '').toLowerCase()
        .indexOf(String(expected || '').toLowerCase()) === 0;
    case '$endswith':
      var a = String(actual || '').toLowerCase();
      var e = String(expected || '').toLowerCase();
      return a.slice(-e.length) === e;
    case '$gt':
      return actual > expected;
    case '$gte':
      return actual >= expected;
    case '$lt':
      return actual < expected;
    case '$lte':
      return actual <= expected;
    default:
      throw new Error('Unsupported filter operator: ' + operator);
  }
}

function getFieldValue_(record, field) {
  if (String(field).indexOf('.') !== -1) {
    return getNested(record, field, null);
  }
  return record[field];
}

/* =========================================================
 * CONFIG / SCHEMA RESOLUTION
 * ========================================================= */

function getConfiguredTables_() {
  var tables = getConfigValue_('tables', {});
  var out = [];

  Object.keys(tables || {}).forEach(function(group) {
    var groupTables = tables[group];
    if (!rdgIsPlainObject_412(groupTables)) return;

    Object.keys(groupTables).forEach(function(tableKey) {
      if (out.indexOf(tableKey) === -1) out.push(tableKey);
    });
  });

  return out;
}

function resolveTableKey_(tableName) {
  var input = rdgSafeString_411(tableName).trim().toLowerCase();
  var tables = getConfigValue_('tables', {});

  var found = null;

  Object.keys(tables || {}).some(function(group) {
    var groupTables = tables[group];
    if (!rdgIsPlainObject_412(groupTables)) return false;

    return Object.keys(groupTables).some(function(key) {
      var cfg = groupTables[key];
      var configuredName = rdgIsPlainObject_412(cfg) ? cfg.name : cfg;

      if (key.toLowerCase() === input ||
          String(configuredName || '').toLowerCase() === input) {
        found = key;
        return true;
      }
      return false;
    });
  });

  if (!found) throw new Error('Unknown RDG table: ' + tableName);
  return found;
}

function getConfiguredTableName_(tableKey) {
  var cfg = getTableConfig_(tableKey);
  if (rdgIsPlainObject_412(cfg) && cfg.name) return cfg.name;
  return tableKey;
}

function getConfiguredIdPrefix_(tableKey) {
  var cfg = getTableConfig_(tableKey);
  if (rdgIsPlainObject_412(cfg) && cfg.idPrefix) return cfg.idPrefix;
  return 'RDG';
}

function getTableConfig_(tableKey) {
  var tables = getConfigValue_('tables', {});

  for (var group in tables) {
    if (!Object.prototype.hasOwnProperty.call(tables, group)) continue;
    if (tables[group] && tables[group][tableKey]) return tables[group][tableKey];
  }

  throw new Error('Table configuration not found: ' + tableKey);
}

function getTableConfigSchema_(tableKey) {
  var cfg = getTableConfig_(tableKey);
  if (cfg && cfg.schema) return cfg.schema;
  return cfg;
}

/*
 * getConfigValue_() is intentionally NOT redefined here.
 * RDGConfig.gs owns the centralized configuration accessor.
 */
/* =========================================================
 * CONFIG COMPATIBILITY
 * ========================================================= */

function getPublicConfig_() {
  return {
    app: {
      name: getConfigValue_('app.name', 'RD Route Design ACC'),
      shortName: getConfigValue_('app.shortName', 'RDG'),
      version: getConfigValue_('app.version', '1.0.0'),
      timezone: getConfigValue_('app.timezone', 'Asia/Karachi')
    },
    gaming: getConfigValue_('gaming', {}),
    wallet: getConfigValue_('wallet', {}),
    userSystem: getConfigValue_('userSystem', {})
  };
}

function isJsonField_(tableKey, field) {
  var configured = getConfigValue_('database.jsonFields', []);
  if (Array.isArray(configured) && configured.indexOf(field) !== -1) return true;

  var schema = getTableConfigSchema_(tableKey);
  if (schema && schema.jsonFields &&
      schema.jsonFields.indexOf(field) !== -1) return true;

  var defaults = [
    'metadata', 'settings', 'preferences', 'attributes',
    'productAttributes', 'attachments', 'uiConfig',
    'beforeState', 'afterState', 'data', 'permissions',
    'rules', 'pricing', 'address', 'contactInfo',
    'walletBalances', 'gameSettings', 'profile',
    'verification', 'accountInfo'
  ];

  return defaults.indexOf(field) !== -1;
}

/* =========================================================
 * ID / RECORD VALIDATION
 * ========================================================= */

function generateRecordId_(tableKey) {
  return rdgBuildId(getConfiguredIdPrefix_(tableKey), 8);
}

function validateRecord_(tableKey, record, options) {
  var schema = getTableConfigSchema_(tableKey);
  if (!schema) return true;

  var required = schema.required || [];
  var check = rdgValidateRequiredFields_412(record, required);

  if (!check.valid) {
    throw new Error(
      'Validation failed for ' + tableKey +
      '. Missing: ' + check.missing.join(', ')
    );
  }

  if (record.id && !rdgIsValidId(record.id, getConfiguredIdPrefix_(tableKey))) {
    throw new Error('Invalid ID format for ' + tableKey + ': ' + record.id);
  }

  if (schema.fields) {
    Object.keys(schema.fields).forEach(function(field) {
      var type = schema.fields[field];
      var value = record[field];

      if (rdgIsBlank_447(value)) return;

      if (typeof type === 'string') {
        validateFieldType_(field, value, type);
      } else if (rdgIsPlainObject_412(type) && type.type) {
        validateFieldType_(field, value, type.type);
      }
    });
  }

  return true;
}

function validateFieldType_(field, value, type) {
  var t = String(type).toLowerCase();

  if (t === 'string' && typeof value !== 'string') {
    throw new Error(field + ' must be a string.');
  }
  if (t === 'number' && !isFinite(rdgToNumber_412(value, NaN))) {
    throw new Error(field + ' must be a number.');
  }
  if (t === 'boolean' && typeof value !== 'boolean') {
    throw new Error(field + ' must be boolean.');
  }
  if (t === 'array' && !Array.isArray(value)) {
    throw new Error(field + ' must be an array.');
  }
  if (t === 'object' && !rdgIsPlainObject_412(value)) {
    throw new Error(field + ' must be an object.');
  }
  if (t === 'date' && !rdgIsValidDate(value)) {
    throw new Error(field + ' must be a valid date.');
  }
}

/* =========================================================
 * REQUEST CONTEXT / COMPANY ISOLATION
 * ========================================================= */

function getRequestContext_() {
  var email = '';

  try {
    email = Session.getActiveUser().getEmail() || '';
  } catch (e) {}

  var props = PropertiesService.getScriptProperties();

  return {
    userEmail: rdgNormalizeEmail_448(email),
    userId: props.getProperty('RDG_SYSTEM_USER_ID') || 'RDSYSTEM',
    companyId: props.getProperty('RDG_DEFAULT_COMPANY_ID') || '',
    timestamp: new Date()
  };
}

function applyCompanyContext_(record, options, context) {
  record = rdgDeepClone_412(record);

  var isolationEnabled = rdgGetConfigValue_412(
    'security.companyIsolation',
    true
  );

  if (!isolationEnabled) return record;

  var suppliedCompany = record.companyId || options.companyId || '';
  var contextCompany = context.companyId || '';

  if (!suppliedCompany && contextCompany) {
    record.companyId = contextCompany;
  }

  if (suppliedCompany && contextCompany &&
      suppliedCompany !== contextCompany &&
      !canCrossCompany_(options, context)) {
    throw new Error('Cross-company operation is not authorized.');
  }

  return record;
}

function canAccessRecord_(record, context, options) {
  if (options && options.systemOperation === true) return true;

  if (!rdgGetConfigValue_412('security.companyIsolation', true)) return true;

  var contextCompany = context.companyId || '';
  if (!contextCompany) return true;

  if (!record.companyId) return true;

  return String(record.companyId) === String(contextCompany);
}

function canCrossCompany_(options, context) {
  return !!(
    options &&
    options.systemOperation === true &&
    options.allowCrossCompany === true
  );
}

function getSystemDefaultStatus_() {
  return rdgGetConfigValue('settings.defaultStatus', 'ACTIVE');
}

/* =========================================================
 * AUDIT
 * ========================================================= */

function auditRecord_(action, tableKey, recordId, beforeState, afterState, options) {
  if (rdgGetConfigValue_412('settings.auditEnabled', true) === false) return;

  try {
    var context = getRequestContext_();
    var auditTable = 'auditLogs';

    if (getConfiguredTables_().indexOf(auditTable) === -1) return;

    var data = {
      action: action,
      table: tableKey,
      recordId: recordId,
      userId: context.userId,
      userEmail: context.userEmail,
      companyId: context.companyId,
      timestamp: new Date(),
      beforeState: beforeState || {},
      afterState: afterState || {},
      metadata: {
        serverVersion: RDG_SERVER_VERSION,
        options: options || {}
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    createRecord(
      auditTable,
      data,
      {
        systemOperation: true,
        allowCrossCompany: true,
        skipAudit: true
      }
    );
  } catch (error) {
    console.error('RDG audit failure: ' + rdgErrorMessage_447(error));
  }
}

/* =========================================================
 * LOCKING / TRANSACTION SAFETY
 * ========================================================= */

function withScriptLock_(callback) {
  var lock = LockService.getScriptLock();
  var timeout = rdgToNumber_412(
    getConfigValue_('database.lockTimeoutMs', 30000),
    30000
  );

  if (!lock.tryLock(timeout)) {
    throw new Error('RDG database is busy. Please retry.');
  }

  try {
    return callback();
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}



/* ================================================================
 * CANONICAL PERMISSION ENGINE — RDGServer v4.4.13
 * ================================================================ */

function hasServerPermission_(
  user,
  operation,
  tableKey
) {

  if (!user) {
    return false;
  }

  var systemUserId =
    getConfigValue_(
      'security.systemUserId',
      'RDSYSTEM'
    );

  var systemRole =
    getConfigValue_(
      'security.systemRole',
      'SYSTEM'
    );

  var userId =
    getServerUserId_(user);

  var role =
    getServerUserRole_(user);

  if (
    String(userId) ===
      String(systemUserId) ||
    String(role || '').toUpperCase() ===
      String(systemRole).toUpperCase()
  ) {
    return true;
  }


  var op =
    String(operation || '')
      .trim()
      .toUpperCase();

  var table =
    String(tableKey || '')
      .trim()
      .toLowerCase();


  var candidates = [];

  /*
   * Wildcard.
   */
  candidates.push('*');


  /*
   * Exact operation.
   */
  if (op) {
    candidates.push(op);
  }


  /*
   * Operation:table.
   */
  if (
    op &&
    table
  ) {

    candidates.push(
      op + ':' + table
    );
  }


  /*
   * GET/LIST/FIND can use READ.
   */
  if (
    op === 'GET' ||
    op === 'LIST' ||
    op === 'FIND'
  ) {

    candidates.push(
      'READ'
    );

    if (table) {

      candidates.push(
        'READ:' + table
      );
    }
  }


  /*
   * Read direct permissions.
   */
  var direct =
    getUserPermissions_(
      user
    );

  if (
    permissionListContains_(
      direct,
      candidates
    )
  ) {

    return true;
  }


  /*
   * Role permissions.
   */
  var permissions =
    getConfigValue_(
      'security.permissions',
      {}
    );

  var rolePermissions = null;

  if (
    permissions &&
    typeof permissions === 'object'
  ) {

    rolePermissions =
      permissions[role];

    if (!rolePermissions) {

      /*
       * Case-insensitive role lookup.
       */
      var roleKey =
        Object.keys(
          permissions
        ).find(function(key) {

          return String(key)
            .toLowerCase() ===
            String(role || '')
              .toLowerCase();

        });

      if (roleKey) {

        rolePermissions =
          permissions[roleKey];
      }
    }
  }

  if (
    permissionListContains_(
      rolePermissions,
      candidates
    )
  ) {

    return true;
  }


  return false;
}

function permissionListContains_(
  permissions,
  candidates
) {

  if (!permissions) {
    return false;
  }

  var list = [];

  if (
    Array.isArray(permissions)
  ) {

    list =
      permissions.slice();

  } else if (
    typeof permissions === 'string'
  ) {

    list =
      permissions
        .split(',')
        .map(function(item) {
          return item.trim();
        });

  } else if (
    typeof permissions === 'object'
  ) {

    Object.keys(
      permissions
    ).forEach(function(key) {

      if (
        permissions[key] === true ||
        permissions[key] === 1 ||
        permissions[key] === 'true'
      ) {

        list.push(key);
      }
    });
  }

  var normalized =
    list.map(function(item) {

      if (
        typeof item === 'object' &&
        item
      ) {

        return String(
          item.permission ||
          item.name ||
          item.code ||
          item.key ||
          ''
        ).toUpperCase();
      }

      return String(item)
        .trim()
        .toUpperCase();
    });


  for (
    var i = 0;
    i < candidates.length;
    i++
  ) {

    var target =
      String(
        candidates[i]
      ).toUpperCase();

    if (
      normalized.indexOf(
        target
      ) !== -1
    ) {

      return true;
    }
  }

  return false;
}

function getUserPermissions_(
  user
) {

  if (!user) {
    return [];
  }


  var permissions =
    user.permissions;


  if (
    Array.isArray(
      permissions
    )
  ) {

    return permissions;
  }


  if (
    typeof permissions ===
      'string'
  ) {

    return permissions
      .split(',')
      .map(
        function(item) {
          return item.trim();
        }
      );
  }


  if (
    permissions &&
    typeof permissions ===
      'object'
  ) {

    return permissions;
  }


  return [];
}

function getServerUserId_(
  user
) {

  if (!user) {
    return null;
  }


  var fields = [
    'userId',
    'userID',
    'User ID',
    'id',
    'ID',
    'uid'
  ];


  for (
    var i = 0;
    i < fields.length;
    i++
  ) {

    if (
      user[
        fields[i]
      ] !== undefined &&
      user[
        fields[i]
      ] !== null &&
      String(
        user[
          fields[i]
        ]
      ) !== ''
    ) {

      return String(
        user[
          fields[i]
        ]
      );
    }
  }


  return null;
}

function getServerUserRole_(
  user
) {

  if (!user) {
    return null;
  }


  var fields = [
    'role',
    'Role',
    'userRole',
    'roleName',
    'systemRole'
  ];


  for (
    var i = 0;
    i < fields.length;
    i++
  ) {

    if (
      user[
        fields[i]
      ] !== undefined &&
      user[
        fields[i]
      ] !== null &&
      String(
        user[
          fields[i]
        ]
      ) !== ''
    ) {

      return String(
        user[
          fields[i]
        ]
      );
    }
  }


  return null;
}

/* =========================================================
 * NESTED JSON BUSINESS API
 * ========================================================= */

function getNestedField(tableName, recordId, path, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('getNestedField(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('getNestedField(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('getNestedField(): path is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var record = getRecord(tableName, recordId, options || {});
  if (!record) return null;

  return getNested(record, path, null);
}

function setNestedField(tableName, recordId, path, value, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('setNestedField(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('setNestedField(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('setNestedField(): path is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var changes = {};
  changes[path] = value;
  return updateRecord(tableName, recordId, changes, options || {});
}

function updateNestedFields(tableName, recordId, updates, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('updateNestedFields(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('updateNestedFields(): recordId is required.');
  if (!rdgIsPlainObject_412(updates) || Object.keys(updates).length === 0) throw new Error('updateNestedFields(): updates must be a non-empty object.');
  options = rdgIsPlainObject_412(options) ? options : {};

  return updateRecord(tableName, recordId, updates, options || {});
}

function getRequiredNestedArray_(record, path) {
  var array = getNested(record, path, null);
  if (!Array.isArray(array)) {
    throw new Error('Nested field must be an array: ' + path);
  }
  return array;
}

function addNestedArrayItem(tableName, recordId, path, item, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('addNestedArrayItem(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('addNestedArrayItem(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('addNestedArrayItem(): path is required.');
  if (typeof item === 'undefined') throw new Error('addNestedArrayItem(): item is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var record = getRecord(tableName, recordId, options || {});
  if (!record) throw new Error('Record not found: ' + recordId);

  var array = getRequiredNestedArray_(record, path);
  array.push(rdgDeepClone_412(item));

  var changes = {};
  changes[path] = array;
  return updateRecord(tableName, recordId, changes, options || {});
}

function insertNestedArrayItem(tableName, recordId, path, index, item, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('insertNestedArrayItem(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('insertNestedArrayItem(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('insertNestedArrayItem(): path is required.');
  if (typeof index === 'undefined' || index === null) throw new Error('insertNestedArrayItem(): index is required.');
  if (typeof item === 'undefined') throw new Error('insertNestedArrayItem(): item is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var record = getRecord(tableName, recordId, options || {});
  if (!record) throw new Error('Record not found: ' + recordId);

  var array = getRequiredNestedArray_(record, path);
  rdgInsertArrayItem(array, index, rdgDeepClone_412(item));

  var changes = {};
  changes[path] = array;
  return updateRecord(tableName, recordId, changes, options || {});
}

function removeNestedArrayItem(tableName, recordId, path, index, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('removeNestedArrayItem(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('removeNestedArrayItem(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('removeNestedArrayItem(): path is required.');
  if (typeof index === 'undefined' || index === null) throw new Error('removeNestedArrayItem(): index is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var record = getRecord(tableName, recordId, options || {});
  if (!record) throw new Error('Record not found: ' + recordId);

  var array = getRequiredNestedArray_(record, path);
  var normalized = rdgNormalizeExistingIndex_411(array.length, index);

  if (normalized < 0) {
    throw new Error('Nested array index out of range.');
  }

  array.splice(normalized, 1);

  var changes = {};
  changes[path] = array;
  return updateRecord(tableName, recordId, changes, options || {});
}

function updateNestedArrayItem(tableName, recordId, path, index, item, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('updateNestedArrayItem(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('updateNestedArrayItem(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('updateNestedArrayItem(): path is required.');
  if (typeof index === 'undefined' || index === null) throw new Error('updateNestedArrayItem(): index is required.');
  if (typeof item === 'undefined') throw new Error('updateNestedArrayItem(): item is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var record = getRecord(tableName, recordId, options || {});
  if (!record) throw new Error('Record not found: ' + recordId);

  var array = getRequiredNestedArray_(record, path);
  var normalized = rdgNormalizeExistingIndex_411(array.length, index);

  if (normalized < 0) {
    throw new Error('Nested array index out of range.');
  }

  array[normalized] = rdgDeepClone_412(item);

  var changes = {};
  changes[path] = array;
  return updateRecord(tableName, recordId, changes, options || {});
}

/* =========================================================
 * API FACADE
 * ========================================================= */

function apiRequest(request) {
  try {
    request = rdgIsPlainObject_412(request) ? request : {};

    var action = rdgNormalizeCode_412(request.action || 'bootstrap');

    switch (action) {
      case 'PING':
        return rdgSuccess_({
          pong: true,
          serverVersion: RDG_SERVER_VERSION,
          serverTime: rdgNowIso()
        });

      case 'BOOTSTRAP':
        return getSystemBootstrap();

      case 'CREATE':
        return rdgSuccess_(createRecord(
          request.table,
          request.data,
          request.options
        ));

      case 'GET':
        return rdgSuccess_(getRecord(
          request.table,
          request.id,
          request.options
        ));

      case 'LIST':
        return rdgSuccess_(getAllRecords(
          request.table,
          request.options
        ));

      case 'FIND':
        return rdgSuccess_(findRecords(
          request.table,
          request.filters,
          request.options
        ));

      case 'UPDATE':
        return rdgSuccess_(updateRecord(
          request.table,
          request.id,
          request.changes,
          request.options
        ));

      case 'DELETE':
        return rdgSuccess_(deleteRecord(
          request.table,
          request.id,
          request.options
        ));

      case 'JOIN_ROOM':
        return rdgSuccess_(rdgJoinRoomApi_(request), 'Player joined room successfully.');

      case 'CREATE_ROOM_AUTO_JOIN':
        return rdgSuccess_(rdgCreateRoomAutoJoin_(request), 'Room created and player joined successfully.');

      case 'NESTED_GET':
        return rdgSuccess_(getNestedField(
          request.table,
          request.id,
          request.path,
          request.options
        ));

      case 'NESTED_SET':
        return rdgSuccess_(setNestedField(
          request.table,
          request.id,
          request.path,
          request.value,
          request.options
        ));

      default:
        return rdgError_(
          'Unsupported API action: ' + action,
          'UNSUPPORTED_ACTION'
        );
    }
  } catch (error) {
    return safeServerError(error);
  }
}


/**
 * Universal client facade.
 * Supports rdgApi('ACTION', payload) and rdgApi({action: 'ACTION', ...}).
 * The existing apiRequest() remains the internal object-based dispatcher.
 */
// ============================================================
// RDG SERVER v4.4.7 COMPATIBILITY HELPERS
// Safe local adapters: use shared RDG utility functions when available.
// ============================================================
function rdgIsBlank_447(value) {
  if (typeof rdgIsBlank === 'function') return rdgIsBlank(value);
  return value === null || typeof value === 'undefined' ||
    (typeof value === 'string' && value.trim() === '');
}

function rdgErrorMessage_447(error) {
  if (typeof rdgErrorMessage === 'function') return rdgErrorMessage(error);
  if (error === null || typeof error === 'undefined') return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error && error.message) return String(error.message);
  try { return String(error); } catch (e) { return 'Unknown error'; }
}

function rdgApi(action, payload) {
  var request;

  if (rdgIsPlainObject_412(action)) {
    request = rdgDeepClone_412(action);
  } else {
    request = rdgIsPlainObject_412(payload) ? rdgDeepClone_412(payload) : {};
    request.action = action;
  }

  return apiRequest(request);
}

function rdgResolveAuthenticatedUserId_() {
  var candidates = [];

  try {
    if (typeof getCurrentServerUser_ === 'function') {
      var serverUser = getCurrentServerUser_();
      if (serverUser && serverUser.id) candidates.push(String(serverUser.id));
    }
  } catch (ignore1) {}

  try {
    if (typeof getCurrentUser === 'function') {
      var currentUser = getCurrentUser();
      if (currentUser && currentUser.id) candidates.push(String(currentUser.id));
    }
  } catch (ignore2) {}

  try {
    var email = Session.getActiveUser().getEmail();
    if (email) {
      var matches = findRecords('users', {email: String(email).trim()}, {
        includeDeleted: false,
        includeInactive: true,
        systemOperation: true,
        allowCrossCompany: true
      });
      if (Array.isArray(matches) && matches.length && matches[0].id) {
        candidates.push(String(matches[0].id));
      }
    }
  } catch (ignore3) {}

  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i] && candidates[i] !== 'RDSYSTEM') return candidates[i];
  }

  throw new Error('Authenticated RDG user could not be resolved.');
}

function rdgJoinRoomApi_(request) {
  request = rdgIsPlainObject_412(request) ? request : {};
  var roomId = request.roomId || request.id;
  if (rdgIsBlank_447(roomId)) throw new Error('JOIN_ROOM requires roomId.');

  var userId = rdgResolveAuthenticatedUserId_();
  var playerData = rdgIsPlainObject_412(request.playerData)
    ? rdgDeepClone_412(request.playerData)
    : {};

  delete playerData.userId;
  delete playerData.playerNumber;
  delete playerData.status;
  delete playerData.roomId;

  var result = joinRDGGameRoom(
    roomId,
    userId,
    playerData,
    rdgIsPlainObject_412(request.options) ? request.options : {}
  );

  return {
    roomId: roomId,
    userId: userId,
    player: result,
    playerNumber: result && result.playerNumber ? result.playerNumber : null,
    status: result && result.status ? result.status : 'JOINED'
  };
}

function rdgCreateRoomAutoJoin_(request) {
  request = rdgIsPlainObject_412(request) ? request : {};
  var roomData = rdgIsPlainObject_412(request.roomData)
    ? rdgDeepClone_412(request.roomData)
    : rdgIsPlainObject_412(request.data)
      ? rdgDeepClone_412(request.data)
      : {};

  var options = rdgIsPlainObject_412(request.options) ? request.options : {};
  var createdRoom = createRDGGameRoom(roomData, options);
  var room = createdRoom && createdRoom.data ? createdRoom.data : createdRoom;
  var roomId = room && (room.id || room.ID);

  if (rdgIsBlank_447(roomId)) {
    throw new Error('Room was created but no room ID was returned.');
  }

  var joined = rdgJoinRoomApi_({
    roomId: roomId,
    playerData: request.playerData || {},
    options: options
  });

  return {
    room: room,
    roomId: roomId,
    player: joined.player,
    playerNumber: joined.playerNumber,
    status: joined.status
  };
}

/* =========================================================
 * GOOGLE LOGIN / USER FOUNDATION
 * ========================================================= */

function startGoogleLogin() {
  try {
    var context = getRequestContext_();
    var email = rdgNormalizeEmail_448(context.userEmail || '');

    if (!email) {
      return rdgError_(
        'Google account email could not be detected. ' +
        'Please deploy the web app with Google account access.',
        'GOOGLE_AUTH_REQUIRED'
      );
    }

    if (!rdgIsValidEmail(email)) {
      return rdgError_(
        'A valid Google email address is required.',
        'INVALID_GOOGLE_EMAIL'
      );
    }

    var existing = findRecords(
      'users',
      {email: email},
      {includeInactive: true, includeDeleted: false, systemOperation: true}
    );

    if (existing && existing.length) {
      var user = existing[0];

      if (!user.verification || !rdgIsPlainObject_412(user.verification)) {
        user.verification = {};
      }

      user.verification.emailVerified = true;
      user.verification.providerVerified = true;
      user.verification.provider = 'GOOGLE';
      user.verification.verifiedAt = new Date();

      updateRecord(
        'users',
        user.id,
        {verification: user.verification},
        {systemOperation: true, allowCrossCompany: true}
      );

      return rdgSuccess_(user, 'Welcome back.');
    }

    var username = email.split('@')[0]
      .replace(/[^a-zA-Z0-9._-]/g, '');

    if (!username) username = 'RDG User';

    var userData = {
      name: username,
      email: email,
      loginProvider: 'GOOGLE',
      status: 'ACTIVE',
      verification: {
        emailVerified: true,
        providerVerified: true,
        provider: 'GOOGLE',
        verifiedAt: new Date()
      },
      metadata: {
        firstLogin: true,
        authProvider: 'GOOGLE'
      }
    };

    var created = createRecord(
      'users',
      userData,
      {systemOperation: true, allowCrossCompany: true}
    );

    return rdgSuccess_(created, 'Google account created successfully.');
  } catch (error) {
    console.error('startGoogleLogin failed: ' + rdgErrorMessage_447(error));
    return rdgError_(rdgErrorMessage_447(error), 'GOOGLE_LOGIN_ERROR');
  }
}

function testStartGoogleLogin() {
  var result = startGoogleLogin();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/* =========================================================
 * HEALTH / DIAGNOSTICS
 * ========================================================= */

function databaseHealthCheck() {
  var result = {
    healthy: true,
    timestamp: rdgNowIso(),
    serverVersion: RDG_SERVER_VERSION,
    spreadsheetId: '',
    tables: []
  };

  try {
    var ss = getDatabaseSpreadsheet_();
    result.spreadsheetId = ss.getId();

    getConfiguredTables_().forEach(function(tableKey) {
      try {
        var sheet = getSheet_(tableKey);
        ensureTableHeaders_(sheet, tableKey);
        result.tables.push({
          table: tableKey,
          sheet: sheet.getName(),
          rows: Math.max(0, sheet.getLastRow() - 1),
          columns: sheet.getLastColumn(),
          healthy: true
        });
      } catch (e) {
        result.healthy = false;
        result.tables.push({
          table: tableKey,
          healthy: false,
          error: rdgErrorMessage_447(e)
        });
      }
    });

    return rdgSuccess_(result);
  } catch (error) {
    result.healthy = false;
    result.error = rdgErrorMessage_447(error);
    return rdgError_(result.error, 'DATABASE_HEALTH_ERROR', result);
  }
}

function pingServer() {
  return rdgSuccess_({
    pong: true,
    serverVersion: RDG_SERVER_VERSION,
    serverTime: rdgNowIso()
  }, 'RDG server is online.');
}

function getServerTime() {
  return rdgNowIso();
}

function getRDGServerDiagnostics() {
  return rdgSuccess_({
    serverVersion: RDG_SERVER_VERSION,
    configVersion: typeof RDG_CONFIG_VERSION !== 'undefined'
      ? RDG_CONFIG_VERSION
      : 'unknown',
    utilsVersion: typeof RDG_UTILS_VERSION !== 'undefined'
      ? RDG_UTILS_VERSION
      : 'unknown',
    database: databaseHealthCheck(),
    bootstrap: getSystemBootstrap()
  });
}

/* =========================================================
 * RDG GAME ENGINE FOUNDATION
 * ========================================================= */

/**
 * Returns the built-in game definition.
 * RDG is the Games domain only; each game controls its own capacity.
 */
function getRDGGameDefinition(gameType) {
  if (rdgIsBlank_447(gameType)) {
    throw new Error('getRDGGameDefinition(): gameType is required.');
  }

  var code = rdgSafeString_411(gameType).trim().toUpperCase();
  var definitions = {
    LUDO: {
      code: 'LUDO',
      name: 'RDG Ludo',
      minPlayers: 2,
      maxPlayers: 12,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: true,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    },
    SNAKE: {
      code: 'SNAKE',
      name: 'RDG Snake',
      minPlayers: 1,
      maxPlayers: 12,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: false,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    },
    CARROM: {
      code: 'CARROM',
      name: 'RDG Carrom',
      minPlayers: 2,
      maxPlayers: 4,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: true,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    },
    2048: {
      code: '2048',
      name: 'RDG 2048',
      minPlayers: 1,
      maxPlayers: 1,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: false,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    },
    SPIRAL: {
      code: 'SPIRAL',
      name: 'RDG Spiral',
      minPlayers: 1,
      maxPlayers: null,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: true,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    },
    THREE_PATTI: {
      code: 'THREE_PATTI',
      name: 'RDG Three Patti',
      minPlayers: 2,
      maxPlayers: null,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: false,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    }
  };

  return definitions[code] || {
    code: code,
    name: code,
    minPlayers: 1,
    maxPlayers: null,
    capacityMode: 'GAME_DEFINED',
    teamsSupported: true,
    currencies: ['COIN', 'DIAMOND', 'SILVER'],
    status: 'FUTURE'
  };
}

/** Validate a requested room capacity against its game definition. */
function validateRDGGameCapacity(gameType, maxPlayers) {
  var definition = getRDGGameDefinition(gameType);
  var requested = rdgToNumber_412(maxPlayers, NaN);

  if (!rdgIsFiniteNumber(requested) || requested < definition.minPlayers) {
    throw new Error(
      'Invalid player capacity for ' + definition.code +
      '. Minimum players: ' + definition.minPlayers + '.'
    );
  }

  if (definition.maxPlayers !== null && requested > definition.maxPlayers) {
    throw new Error(
      'Invalid player capacity for ' + definition.code +
      '. Maximum players: ' + definition.maxPlayers + '.'
    );
  }

  return {
    valid: true,
    gameType: definition.code,
    minPlayers: definition.minPlayers,
    maxPlayers: definition.maxPlayers,
    requestedPlayers: requested,
    capacityMode: definition.capacityMode
  };
}

/**
 * Creates a game room through Universal CRUD.
 * No direct Sheet writes are performed here.
 */
function createRDGGameRoom(roomData, options) {
  if (!rdgIsPlainObject_412(roomData)) {
    throw new Error('createRDGGameRoom(): roomData must be an object.');
  }
  if (rdgIsBlank_447(roomData.gameType)) {
    throw new Error('createRDGGameRoom(): gameType is required.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  var definition = getRDGGameDefinition(roomData.gameType);

  var capacity = roomData.maxPlayers;
  if (rdgIsBlank_447(capacity)) {
    capacity = definition.maxPlayers !== null ? definition.maxPlayers : null;
  }
  if (capacity === null) {
    throw new Error(
      'createRDGGameRoom(): maxPlayers is required for unlimited-capacity games.'
    );
  }

  validateRDGGameCapacity(definition.code, capacity);

  var data = rdgDeepClone_412(roomData);
  data.gameType = definition.code;
  data.maxPlayers = rdgToNumber_412(capacity, capacity);
  data.gameSettings = rdgIsPlainObject_412(data.gameSettings)
    ? data.gameSettings
    : {};
  data.gameSettings.capacityMode = definition.capacityMode;
  data.gameSettings.minPlayers = definition.minPlayers;
  data.gameSettings.supportedCurrencies = definition.currencies;

  if (rdgIsBlank_447(data.status)) data.status = 'WAITING';
  if (rdgIsBlank_447(data.roomType)) data.roomType = 'PUBLIC';

  return createRecord('gameRooms', data, options);
}

/**
 * Adds a player through Universal CRUD after validating room capacity.
 */
function joinRDGGameRoom(roomId, userId, playerData, options) {
  if (rdgIsBlank_447(roomId)) throw new Error('joinRDGGameRoom(): roomId is required.');
  if (rdgIsBlank_447(userId)) throw new Error('joinRDGGameRoom(): userId is required.');

  options = rdgIsPlainObject_412(options) ? options : {};
  playerData = rdgIsPlainObject_412(playerData) ? rdgDeepClone_412(playerData) : {};

  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  if (String(room.status || '').toUpperCase() !== 'WAITING') {
    throw new Error('Game room is not accepting new players.');
  }

  var definition = getRDGGameDefinition(room.gameType);
  var players = findRecords('gamePlayers', {roomId: roomId}, options);
  var activePlayers = players.filter(function(player) {
    var status = String(player.status || '').toUpperCase();
    return status !== 'LEFT' && status !== 'REMOVED' && status !== 'CANCELLED';
  });

  var maxPlayers = rdgToNumber_412(room.maxPlayers, definition.maxPlayers);
  if (maxPlayers !== null && activePlayers.length >= maxPlayers) {
    throw new Error('Game room is full. Maximum players: ' + maxPlayers + '.');
  }

  var duplicate = activePlayers.some(function(player) {
    return String(player.userId) === String(userId);
  });
  if (duplicate) throw new Error('User is already in this game room.');

  playerData.roomId = roomId;
  playerData.userId = userId;
  playerData.companyId = room.companyId || playerData.companyId;
  playerData.gameSettings = rdgIsPlainObject_412(playerData.gameSettings)
    ? playerData.gameSettings
    : {};
  playerData.playerNumber = activePlayers.length + 1;
  playerData.status = 'JOINED';
  playerData.joinedAt = new Date();

  return createRecord('gamePlayers', playerData, options);
}

/** Leave a game room using a soft status update. */
function leaveRDGGameRoom(playerId, options) {
  if (rdgIsBlank_447(playerId)) throw new Error('leaveRDGGameRoom(): playerId is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  return updateRecord('gamePlayers', playerId, {
    status: 'LEFT',
    leftAt: new Date()
  }, options);
}

/* =========================================================
 * TESTS
 * ========================================================= */

/**
 * SAFE local nested-array tests.
 * No Google Sheet/database mutation.
 */
function testRDGNestedArrays() {

  var sample = {
    items: [
      {id: 1},
      {id: 2},
      {id: 3}
    ]
  };

  rdgInsertArrayItem(sample.items, -1, {id: 99});
  var insertPassed = sample.items.length === 4 && sample.items[2].id === 99 && sample.items[3].id === 3;

  rdgInsertArrayItem(sample.items, -2, {id: 88});
  var negativeInsertPassed = sample.items.length === 5 && sample.items[2].id === 88 && sample.items[3].id === 99;

  var updateIndex = rdgNormalizeExistingIndex_412(sample.items.length, -1);
  sample.items[updateIndex] = {id: 77};
  var negativeUpdatePassed = sample.items.length === 5 && sample.items[sample.items.length - 1].id === 77;

  var removeIndex = rdgNormalizeExistingIndex_412(sample.items.length, -2);
  sample.items.splice(removeIndex, 1);
  var negativeRemovePassed = sample.items.length === 4 && sample.items[3].id === 77;

  return {
    success: insertPassed && negativeInsertPassed && negativeUpdatePassed && negativeRemovePassed,
    checks: {
      insertBeforeLast: insertPassed,
      negativeInsert: negativeInsertPassed,
      negativeUpdate: negativeUpdatePassed,
      negativeRemove: negativeRemovePassed
    },
    items: sample.items
  };
}

/** SAFE nested object-path tests. */
function testRDGNestedPaths() {

  var sample = {
    profile: {
      name: 'RDG Test',
      settings: {theme: 'dark'}
    }
  };

  var readPassed = getNested(sample, 'profile.settings.theme', null) === 'dark';

  setNested(sample, 'profile.settings.notifications', true);
  var writePassed = getNested(sample, 'profile.settings.notifications', null) === true;

  var defaultPassed = getNested(sample, 'profile.missing.value', 'DEFAULT') === 'DEFAULT';

  return {
    success: readPassed && writePassed && defaultPassed,
    checks: {
      nestedRead: readPassed,
      nestedWrite: writePassed,
      missingPathDefault: defaultPassed
    },
    sample: sample
  };
}

/**
 * Ensures parameterized nested business functions reject missing
 * arguments BEFORE attempting database access.
 */
function testRDGNestedParameterValidation() {

  var results = {};

  function expectError(name, callback, expected) {
    try {
      callback();
      results[name] = {pass: false, message: 'Expected validation error was not thrown.'};
    } catch (error) {
      var message = error && error.message ? String(error.message) : String(error || '');
      results[name] = {pass: message === expected, message: message};
    }
  }

  expectError('getNestedField', function() { getNestedField(); }, 'getNestedField(): tableName is required.');
  expectError('setNestedField', function() { setNestedField(); }, 'setNestedField(): tableName is required.');
  expectError('updateNestedFields', function() { updateNestedFields(); }, 'updateNestedFields(): tableName is required.');
  expectError('addNestedArrayItem', function() { addNestedArrayItem(); }, 'addNestedArrayItem(): tableName is required.');
  expectError('insertNestedArrayItem', function() { insertNestedArrayItem(); }, 'insertNestedArrayItem(): tableName is required.');
  expectError('removeNestedArrayItem', function() { removeNestedArrayItem(); }, 'removeNestedArrayItem(): tableName is required.');
  expectError('updateNestedArrayItem', function() { updateNestedArrayItem(); }, 'updateNestedArrayItem(): tableName is required.');

  var success = Object.keys(results).every(function(key) { return results[key].pass === true; });
  return {success: success, checks: results};
}

/** Full safe nested suite; no production DB mutation. */
function testRDGNestedBusinessSuite() {

  var paths = testRDGNestedPaths();
  var arrays = testRDGNestedArrays();
  var validation = testRDGNestedParameterValidation();

  return {
    success: paths.success && arrays.success && validation.success,
    suite: 'RDG Nested Business API — SAFE / NO DATABASE MUTATION',
    tests: {
      nestedPaths: paths,
      nestedArrays: arrays,
      parameterValidation: validation
    },
    timestamp: rdgNowIso()
  };
}

function testRDGServer() {

  var nested = testRDGNestedBusinessSuite();
  var verification = verifyRDGServer();
  var ping = pingServer();

  return {
    success: nested.success && verification.success && !!(ping && ping.success),
    serverVersion: RDG_SERVER_VERSION,
    ping: ping,
    nested: nested,
    verification: verification,
    time: getServerTime()
  };
}

function verifyRDGServer() {

  var checks = [];

  checks.push({name: 'server version', pass: !!RDG_SERVER_VERSION});
  checks.push({
    name: 'utils available',
    pass: typeof rdgSuccess === 'function' && typeof rdgError === 'function'
  });
  checks.push({name: 'config available', pass: typeof RDG_CONFIG !== 'undefined'});
  checks.push({
    name: 'nested utilities',
    pass: typeof getNested === 'function' && typeof setNested === 'function'
  });
  checks.push({
    name: 'nested array utilities',
    pass: typeof rdgInsertArrayItem === 'function' && typeof rdgNormalizeExistingIndex === 'function'
  });
  checks.push({name: 'database resolver', pass: typeof getDatabaseSpreadsheet_ === 'function'});
  checks.push({
    name: 'nested business functions',
    pass:
      typeof getNestedField === 'function' &&
      typeof setNestedField === 'function' &&
      typeof updateNestedFields === 'function' &&
      typeof addNestedArrayItem === 'function' &&
      typeof insertNestedArrayItem === 'function' &&
      typeof updateNestedArrayItem === 'function' &&
      typeof removeNestedArrayItem === 'function'
  });

  return {
    success: checks.every(function(item) { return item.pass; }),
    version: RDG_SERVER_VERSION,
    checks: checks,
    timestamp: rdgNowIso()
  };
}

function testRDGServerCompatibility411() {
  var result = {
    serverVersion: typeof RDG_SERVER_VERSION !== 'undefined' ? String(RDG_SERVER_VERSION) : 'MISSING',
    safeStringFallback: typeof rdgSafeString_411 === 'function',
    existingIndexFallback: typeof rdgNormalizeExistingIndex_411 === 'function',
    nestedArrayNormalization: rdgNormalizeExistingIndex_411(3, -1) === 2 && rdgNormalizeExistingIndex_411(3, -4) === -1,
    htmlEscapeDependency: typeof escapeHtml_ === 'function'
  };
  result.pass = result.serverVersion === '4.4.11' &&
    result.safeStringFallback && result.existingIndexFallback &&
    result.nestedArrayNormalization && result.htmlEscapeDependency;
  Logger.log('RDG SERVER COMPATIBILITY 4.4.11');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testRDGServerRuntimeAvailability444() {
  var result = {
    serverVersion: typeof RDG_SERVER_VERSION !== 'undefined' ? String(RDG_SERVER_VERSION) : 'MISSING',
    rdgApi: typeof rdgApi === 'function',
    apiRequest: typeof apiRequest === 'function',
    createRecord: typeof createRecord === 'function',
    getRecord: typeof getRecord === 'function',
    findRecords: typeof findRecords === 'function',
    updateRecord: typeof updateRecord === 'function',
    deleteRecord: typeof deleteRecord === 'function',
    createRDGGameRoom: typeof createRDGGameRoom === 'function',
    joinRDGGameRoom: typeof joinRDGGameRoom === 'function',
    gameRoomsAuthority: typeof createRDGGameRoom === 'function' && typeof joinRDGGameRoom === 'function'
  };
  Logger.log('========================================');
  Logger.log('RDG SERVER RUNTIME DIAGNOSTIC 4.4.4');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log('========================================');
  return result;
}

/* =========================================================
 * HTML ESCAPE
 * ========================================================= */

function escapeHtml_(value) {
  return rdgSafeString_411(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =========================================================
 * RDG GAME ENGINE — SESSION / TEAM / ACTION FOUNDATION
 * Version 3.2.0
 *
 * Compatibility design:
 * - Uses existing gameRooms, gamePlayers and gameTransactions tables.
 * - Session state is anchored by gameRooms.sessionId.
 * - Team definitions are stored in gameRooms.gameSettings.teams.
 * - Player team membership is stored on gamePlayers.teamId/teamNumber/role.
 * - Game actions are immutable transaction records in gameTransactions.
 * - No direct Sheet writes are performed.
 *
 * This layer can later migrate to dedicated gameSessions/gameTeams tables
 * without changing the public engine contract.
 * ========================================================= */

// Version remains controlled by the canonical declaration above.


function rdgRequireGameType_(gameType, functionName) {
  if (rdgIsBlank_447(gameType)) {
    throw new Error(functionName + '(): gameType is required.');
  }
  return getRDGGameDefinition(gameType);
}

function rdgNormalizeGameSessionId_(value) {
  if (!rdgIsBlank_447(value)) return rdgSafeString_411(value).trim();
  return rdgBuildId('RDGSES', 8);
}

function rdgGetActiveGamePlayers_(roomId, options) {
  var players = findRecords('gamePlayers', {roomId: roomId}, options || {});
  return players.filter(function(player) {
    var status = String(player.status || '').toUpperCase();
    return status !== 'LEFT' && status !== 'REMOVED' &&
      status !== 'CANCELLED' && status !== 'DISCONNECTED';
  });
}

function rdgGetRoomTeams_(room) {
  var settings = rdgIsPlainObject_412(room.gameSettings) ? room.gameSettings : {};
  var teams = Array.isArray(settings.teams) ? settings.teams : [];
  return rdgDeepClone(teams);
}

function rdgSaveRoomGameSettings_(roomId, settings, options) {
  return updateRecord('gameRooms', roomId, {
    gameSettings: rdgIsPlainObject_412(settings) ? settings : {},
    updatedAt: new Date()
  }, options || {});
}

/** Start a new game session for an existing WAITING room. */
function startRDGGameSession(roomId, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('startRDGGameSession(): roomId is required.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  var status = String(room.status || '').toUpperCase();
  if (status !== 'WAITING' && status !== 'PAUSED') {
    throw new Error('Game room cannot start from status: ' + status + '.');
  }

  var definition = rdgRequireGameType_(room.gameType, 'startRDGGameSession');
  var players = rdgGetActiveGamePlayers_(roomId, options);
  var minimum = definition.minPlayers || 1;

  if (players.length < minimum) {
    throw new Error(
      'Not enough players to start ' + definition.code +
      '. Minimum players: ' + minimum + '.'
    );
  }

  var sessionId = rdgNormalizeGameSessionId_(room.sessionId);
  var settings = rdgIsPlainObject_412(room.gameSettings)
    ? rdgDeepClone_412(room.gameSettings)
    : {};

  settings.sessionId = sessionId;
  settings.sessionStatus = 'RUNNING';
  settings.startedAt = new Date();
  settings.gameCode = definition.code;

  var updatedRoom = updateRecord('gameRooms', roomId, {
    status: 'RUNNING',
    sessionId: sessionId,
    startedAt: new Date(),
    gameSettings: settings
  }, options);

  players.forEach(function(player) {
    updateRecord('gamePlayers', player.id, {
      sessionId: sessionId,
      status: 'PLAYING'
    }, options);
  });

  return {
    success: true,
    sessionId: sessionId,
    room: updatedRoom,
    playerCount: players.length,
    gameType: definition.code,
    status: 'RUNNING'
  };
}

/** Pause a running session without deleting any state. */
function pauseRDGGameSession(roomId, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('pauseRDGGameSession(): roomId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};

  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);
  if (String(room.status || '').toUpperCase() !== 'RUNNING') {
    throw new Error('Only RUNNING game rooms can be paused.');
  }

  var settings = rdgIsPlainObject_412(room.gameSettings)
    ? rdgDeepClone_412(room.gameSettings) : {};
  settings.sessionStatus = 'PAUSED';
  settings.pausedAt = new Date();

  return updateRecord('gameRooms', roomId, {
    status: 'PAUSED',
    gameSettings: settings
  }, options);
}

/** Resume a paused session. */
function resumeRDGGameSession(roomId, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('resumeRDGGameSession(): roomId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};

  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);
  if (String(room.status || '').toUpperCase() !== 'PAUSED') {
    throw new Error('Only PAUSED game rooms can be resumed.');
  }

  var settings = rdgIsPlainObject_412(room.gameSettings)
    ? rdgDeepClone_412(room.gameSettings) : {};
  settings.sessionStatus = 'RUNNING';
  settings.resumedAt = new Date();

  return updateRecord('gameRooms', roomId, {
    status: 'RUNNING',
    gameSettings: settings
  }, options);
}

/** Finish a session and freeze player participation. */
function finishRDGGameSession(roomId, resultData, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('finishRDGGameSession(): roomId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};
  resultData = rdgIsPlainObject_412(resultData) ? rdgDeepClone_412(resultData) : {};

  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  var status = String(room.status || '').toUpperCase();
  if (status !== 'RUNNING' && status !== 'PAUSED') {
    throw new Error('Game room cannot finish from status: ' + status + '.');
  }

  var settings = rdgIsPlainObject_412(room.gameSettings)
    ? rdgDeepClone_412(room.gameSettings) : {};
  settings.sessionStatus = 'FINISHED';
  settings.endedAt = new Date();
  settings.result = resultData;

  var updatedRoom = updateRecord('gameRooms', roomId, {
    status: 'FINISHED',
    endedAt: new Date(),
    gameSettings: settings
  }, options);

  var players = rdgGetActiveGamePlayers_(roomId, options);
  players.forEach(function(player) {
    updateRecord('gamePlayers', player.id, {
      status: 'FINISHED',
      leftAt: new Date()
    }, options);
  });

  return {
    success: true,
    sessionId: room.sessionId || null,
    room: updatedRoom,
    playerCount: players.length,
    result: resultData
  };
}

/** Create a team definition inside the room's gameSettings.teams array. */
function createRDGGameTeam(roomId, teamData, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('createRDGGameTeam(): roomId is required.');
  }
  if (!rdgIsPlainObject_412(teamData)) {
    throw new Error('createRDGGameTeam(): teamData must be an object.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  var teams = rdgGetRoomTeams_(room);
  var teamNumber = rdgToNumber_412(teamData.teamNumber, teams.length + 1);
  var duplicate = teams.some(function(team) {
    return String(team.teamNumber) === String(teamNumber) ||
      (!rdgIsBlank_447(team.code) && !rdgIsBlank_447(teamData.code) &&
       String(team.code).toUpperCase() === String(teamData.code).toUpperCase());
  });
  if (duplicate) throw new Error('Duplicate team number/code.');

  var team = rdgDeepClone_412(teamData);
  team.id = rdgIsBlank_447(team.id) ? rdgBuildId_412('RDGTEAM', 8) : team.id;
  team.roomId = roomId;
  team.sessionId = room.sessionId || null;
  team.teamNumber = teamNumber;
  team.status = team.status || 'ACTIVE';
  team.score = rdgToNumber_412(team.score, 0);
  team.players = [];
  team.createdAt = new Date();

  teams.push(team);

  var settings = rdgIsPlainObject_412(room.gameSettings)
    ? rdgDeepClone_412(room.gameSettings) : {};
  settings.teams = teams;
  settings.teamMode = settings.teamMode || 'CUSTOM';

  rdgSaveRoomGameSettings_(roomId, settings, options);
  return team;
}

/** Assign an existing room player to a room team. */
function assignRDGPlayerToTeam(playerId, teamId, options) {
  if (rdgIsBlank_447(playerId)) {
    throw new Error('assignRDGPlayerToTeam(): playerId is required.');
  }
  if (rdgIsBlank_447(teamId)) {
    throw new Error('assignRDGPlayerToTeam(): teamId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};

  var player = getRecord('gamePlayers', playerId, options);
  if (!player) throw new Error('Game player not found: ' + playerId);

  var room = getRecord('gameRooms', player.roomId, options);
  if (!room) throw new Error('Game room not found: ' + player.roomId);

  var teams = rdgGetRoomTeams_(room);
  var team = teams.filter(function(item) {
    return String(item.id) === String(teamId);
  })[0];
  if (!team) throw new Error('Game team not found: ' + teamId);

  var maxPlayers = rdgToNumber_412(team.maxPlayers, null);
  if (maxPlayers !== null) {
    var teamPlayers = rdgGetActiveGamePlayers_(player.roomId, options).filter(function(item) {
      return String(item.teamId) === String(teamId) && String(item.id) !== String(playerId);
    });
    if (teamPlayers.length >= maxPlayers) {
      throw new Error('Game team is full. Maximum players: ' + maxPlayers + '.');
    }
  }

  return updateRecord('gamePlayers', playerId, {
    teamId: team.id,
    teamNumber: team.teamNumber,
    role: player.role || 'PLAYER'
  }, options);
}

/**
 * Record a validated game action.
 * This function records the action/result; it does not award wallet value.
 * Rewards must be calculated by a separate server-side settlement layer.
 */
function recordRDGGameAction(roomId, userId, actionData, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('recordRDGGameAction(): roomId is required.');
  }
  if (rdgIsBlank_447(userId)) {
    throw new Error('recordRDGGameAction(): userId is required.');
  }
  if (!rdgIsPlainObject_412(actionData)) {
    throw new Error('recordRDGGameAction(): actionData must be an object.');
  }
  if (rdgIsBlank_447(actionData.actionType)) {
    throw new Error('recordRDGGameAction(): actionType is required.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  var status = String(room.status || '').toUpperCase();
  if (status !== 'RUNNING') {
    throw new Error('Game actions are allowed only while the room is RUNNING.');
  }

  var player = findRecords('gamePlayers', {
    roomId: roomId,
    userId: userId
  }, options).filter(function(item) {
    var s = String(item.status || '').toUpperCase();
    return s !== 'LEFT' && s !== 'REMOVED' && s !== 'CANCELLED';
  })[0];

  if (!player) throw new Error('Active game player not found for user: ' + userId);

  var payload = rdgDeepClone_412(actionData);
  var scoreDelta = rdgToNumber_412(payload.scoreDelta, 0);
  var transaction = {
    id: rdgBuildId_412('RDGTXN', 8),
    companyId: room.companyId || player.companyId || null,
    roomId: roomId,
    userId: userId,
    sessionId: room.sessionId || player.sessionId || null,
    status: 'RECORDED',
    transactionType: 'GAME_ACTION',
    currency: payload.currency || null,
    amount: rdgToNumber_412(payload.amount, 0),
    referenceId: payload.referenceId || null,
    data: {
      actionType: payload.actionType,
      actionId: payload.actionId || rdgBuildId_412('RDGACT', 8),
      scoreDelta: scoreDelta,
      targetUserId: payload.targetUserId || null,
      targetId: payload.targetId || null,
      result: payload.result || null,
      metadata: payload.metadata || {}
    },
    createdAt: new Date()
  };

  return createRecord('gameTransactions', transaction, options);
}

/** Update player score from a server-validated action. */
function applyRDGScoreDelta(playerId, scoreDelta, options) {
  if (rdgIsBlank_447(playerId)) {
    throw new Error('applyRDGScoreDelta(): playerId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};
  var delta = rdgToNumber_412(scoreDelta, NaN);
  if (!rdgIsFiniteNumber(delta)) {
    throw new Error('applyRDGScoreDelta(): scoreDelta must be numeric.');
  }

  var player = getRecord('gamePlayers', playerId, options);
  if (!player) throw new Error('Game player not found: ' + playerId);

  var current = rdgToNumber_412(player.score, 0);
  var nextScore = current + delta;

  return updateRecord('gamePlayers', playerId, {
    score: nextScore
  }, options);
}

/** Get a compact server-side game state snapshot. */
function getRDGGameState(roomId, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('getRDGGameState(): roomId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};

  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  var players = rdgGetActiveGamePlayers_(roomId, options);
  var teams = rdgGetRoomTeams_(room);

  return {
    success: true,
    room: room,
    session: {
      id: room.sessionId || null,
      status: rdgIsPlainObject_412(room.gameSettings)
        ? room.gameSettings.sessionStatus || null
        : null
    },
    players: players,
    teams: teams,
    playerCount: players.length,
    timestamp: rdgNowIso()
  };
}

/* =========================================================
 * SAFE GAME ENGINE TESTS — NO DATABASE MUTATION
 * ========================================================= */

function testRDGGameEnginePure() {
  var capacity = [
    validateRDGGameCapacity('LUDO', 12),
    validateRDGGameCapacity('SNAKE', 12),
    validateRDGGameCapacity('CARROM', 4)
  ];

  var passed = capacity.every(function(item) { return item.valid; });
  var overflowCaught = false;
  try {
    validateRDGGameCapacity('CARROM', 5);
  } catch (e) {
    overflowCaught = true;
  }

  var unlimited = getRDGGameDefinition('THREE_PATTI');
  var unlimitedPassed = unlimited.maxPlayers === null &&
    unlimited.capacityMode === 'GAME_DEFINED';

  return {
    success: passed && overflowCaught && unlimitedPassed,
    checks: {
      ludo12: capacity[0].valid,
      snake12: capacity[1].valid,
      carrom4: capacity[2].valid,
      carromOverflowRejected: overflowCaught,
      threePattiUnlimited: unlimitedPassed
    },
    timestamp: rdgNowIso()
  };
}

function verifyRDGGameEngine() {
  var checks = [
    {name: 'game definition', pass: typeof getRDGGameDefinition === 'function'},
    {name: 'room creation', pass: typeof createRDGGameRoom === 'function'},
    {name: 'room join', pass: typeof joinRDGGameRoom === 'function'},
    {name: 'session start', pass: typeof startRDGGameSession === 'function'},
    {name: 'session finish', pass: typeof finishRDGGameSession === 'function'},
    {name: 'team creation', pass: typeof createRDGGameTeam === 'function'},
    {name: 'team assignment', pass: typeof assignRDGPlayerToTeam === 'function'},
    {name: 'game action', pass: typeof recordRDGGameAction === 'function'},
    {name: 'score engine', pass: typeof applyRDGScoreDelta === 'function'},
    {name: 'state snapshot', pass: typeof getRDGGameState === 'function'},
    {name: 'pure test suite', pass: typeof testRDGGameEnginePure === 'function'}
  ];

  return {
    success: checks.every(function(item) { return item.pass; }),
    version: RDG_SERVER_VERSION,
    checks: checks,
    timestamp: rdgNowIso()
  };
}


function testRDGServerCompatibility410() {
  return {
    serverVersion: (typeof RDG_SERVER_VERSION !== 'undefined') ? RDG_SERVER_VERSION : null,
    rdgIsBlankAdapter: typeof rdgIsBlank_447 === 'function',
    rdgErrorMessageAdapter: typeof rdgErrorMessage_447 === 'function',
    rdgApi: typeof rdgApi === 'function',
    apiRequest: typeof apiRequest === 'function',
    databaseHealthCheck: typeof databaseHealthCheck === 'function',
    gameEngineTest: typeof testRDGGameEnginePure === 'function'
  };
}


/* =========================================================
 * RDG SERVER COMPATIBILITY TEST 4.4.8
 * ========================================================= */
function testRDGServerCompatibility448() {
  var result = {
    serverVersion: RDG_SERVER_VERSION,
    rdgNormalizeEmailGlobal: typeof rdgNormalizeEmail === 'function',
    rdgNormalizeEmailFallback: typeof rdgNormalizeEmail_448 === 'function',
    rdgErrorMessageFallback: typeof rdgErrorMessage_447 === 'function',
    rdgSuccessFallback: typeof rdgSuccess_447 === 'function',
    rdgErrorFallback: typeof rdgError_447 === 'function'
  };
  console.log('RDG SERVER COMPATIBILITY 4.4.10');
  console.log(JSON.stringify(result, null, 2));
  return result;
}


/* =========================================================
 * v4.4.12 RUNTIME DEPENDENCY DIAGNOSTIC
 * ========================================================= */
function testRDGServerUtilityRuntime412() {
  var result = {
    marker: RDG_SERVER_RUNTIME_MARKER_412,
    version: RDG_SERVER_VERSION,
    bareUtilities: {
      rdgSafeString: typeof rdgSafeString === 'function',
      rdgIsPlainObject: typeof rdgIsPlainObject === 'function',
      rdgDeepClone: typeof rdgDeepClone === 'function',
      rdgEnsureArray: typeof rdgEnsureArray === 'function',
      rdgToNumber: typeof rdgToNumber === 'function',
      rdgNormalizeCode: typeof rdgNormalizeCode === 'function',
      rdgNormalizeObject: typeof rdgNormalizeObject === 'function',
      rdgPaginate: typeof rdgPaginate === 'function',
      rdgSortRecords: typeof rdgSortRecords === 'function',
      rdgValidateRequiredFields: typeof rdgValidateRequiredFields === 'function',
      rdgGetConfigValue: typeof rdgGetConfigValue === 'function',
      rdgBuildId: typeof rdgBuildId === 'function',
      rdgNormalizeExistingIndex: typeof rdgNormalizeExistingIndex === 'function'
    },
    adapters: {
      rdgSafeString: typeof rdgSafeString_412 === 'function',
      rdgIsPlainObject: typeof rdgIsPlainObject_412 === 'function',
      rdgDeepClone: typeof rdgDeepClone_412 === 'function',
      rdgEnsureArray: typeof rdgEnsureArray_412 === 'function',
      rdgToNumber: typeof rdgToNumber_412 === 'function',
      rdgNormalizeCode: typeof rdgNormalizeCode_412 === 'function',
      rdgNormalizeObject: typeof rdgNormalizeObject_412 === 'function',
      rdgPaginate: typeof rdgPaginate_412 === 'function',
      rdgSortRecords: typeof rdgSortRecords_412 === 'function',
      rdgValidateRequiredFields: typeof rdgValidateRequiredFields_412 === 'function',
      rdgGetConfigValue: typeof rdgGetConfigValue_412 === 'function',
      rdgBuildId: typeof rdgBuildId_412 === 'function',
      rdgNormalizeExistingIndex: typeof rdgNormalizeExistingIndex_412 === 'function'
    }
  };
  result.pass = Object.keys(result.adapters).every(function(k){ return result.adapters[k] === true; });
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}function testRDGPermissionRuntimeDiagnosis() {
  var user = {
    id: 'U001',
    role: 'MODERATOR',
    authenticated: true,
    permissions: ['GET', 'LIST', 'UPDATE:users']
  };

  var directPermissions = getUserPermissions_(user);
  var result = {
    serverVersion: typeof RDG_SERVER_VERSION !== 'undefined' ? String(RDG_SERVER_VERSION) : 'UNDEFINED',
    runtimeMarker: typeof RDG_SERVER_RUNTIME_MARKER_412 !== 'undefined' ? String(RDG_SERVER_RUNTIME_MARKER_412) : 'MISSING',
    permissionFunction: typeof hasServerPermission_,
    permissionHelper: typeof permissionListContains_,
    userPermissionHelper: typeof getUserPermissions_,
    directPermissions: directPermissions,
    directUpdatePermission: typeof hasServerPermission_ === 'function' ? hasServerPermission_(user, 'UPDATE', 'users') : false,
    directGetPermission: typeof hasServerPermission_ === 'function' ? hasServerPermission_(user, 'GET', 'users') : false,
    directDeletePermission: typeof hasServerPermission_ === 'function' ? hasServerPermission_(user, 'DELETE', 'users') : false,
    expectedUpdate: true,
    expectedGet: true,
    expectedDelete: false
  };
  result.pass = result.permissionFunction === 'function' && result.permissionHelper === 'function' && result.userPermissionHelper === 'function' && result.directUpdatePermission === true && result.directGetPermission === true && result.directDeletePermission === false;
  result.runtimeIdentityPass = result.serverVersion === '4.4.13' && result.runtimeMarker === 'RDG_SERVER_RUNTIME_4.4.13';
  result.overallPass = result.pass && result.runtimeIdentityPass;
  Logger.log('========================================');
  Logger.log('RDG PERMISSION RUNTIME DIAGNOSIS');
  Logger.log('========================================');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log(result.overallPass ? 'RDG PERMISSION DIAGNOSIS: PASS' : 'RDG PERMISSION DIAGNOSIS: REVIEW');
  return result;
}
function rdgIsPlainObject_412(value) {
  if (typeof rdgIsPlainObject === 'function') return rdgIsPlainObject(value);
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function rdgDeepClone_412(value) {
  if (typeof rdgDeepClone === 'function') return rdgDeepClone(value);
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(rdgDeepClone_412);
  var out = {};
  Object.keys(value).forEach(function(k) { out[k] = rdgDeepClone_412(value[k]); });
  return out;
}
function rdgEnsureArray_412(value) {
  if (typeof rdgEnsureArray === 'function') return rdgEnsureArray(value);
  return Array.isArray(value) ? value : (value === null || typeof value === 'undefined' ? [] : [value]);
}
function rdgToNumber_412(value, fallback) {
  if (typeof rdgToNumber === 'function') return rdgToNumber(value, fallback);
  var n = Number(value);
  return isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
}
function rdgNormalizeCode_412(value) {
  if (typeof rdgNormalizeCode === 'function') return rdgNormalizeCode(value);
  return rdgSafeString(value).trim().toUpperCase();
}
function rdgNormalizeObject_412(value) {
  if (typeof rdgNormalizeObject === 'function') return rdgNormalizeObject(value);
  return rdgIsPlainObject(value) ? rdgDeepClone_412(value) : {};
}
function rdgPaginate_412(items, page, pageSize) {
  if (typeof rdgPaginate === 'function') return rdgPaginate(items, page, pageSize);
  items = rdgEnsureArray_412(items);
  page = Math.max(1, Math.floor(rdgToNumber_412(page, 1)));
  pageSize = Math.max(1, Math.floor(rdgToNumber_412(pageSize, 25)));
  var total = items.length, totalPages = total ? Math.ceil(total / pageSize) : 0;
  var start = (page - 1) * pageSize;
  return {items: items.slice(start, start + pageSize), page: page, pageSize: pageSize,
    total: total, totalPages: totalPages, hasNext: page < totalPages,
    hasPrevious: page > 1 && totalPages > 0};
}
function rdgSortRecords_412(records, field, direction) {
  if (typeof rdgSortRecords === 'function') return rdgSortRecords(records, field, direction);
  var list = rdgEnsureArray_412(records).slice();
  var dir = rdgSafeString_412(direction || 'asc').toLowerCase() === 'desc' ? -1 : 1;
  list.sort(function(a,b) {
    var av = a && typeof a === 'object' ? a[field] : a;
    var bv = b && typeof b === 'object' ? b[field] : b;
    if (av === bv) return 0;
    if (av === null || typeof av === 'undefined') return -1 * dir;
    if (bv === null || typeof bv === 'undefined') return 1 * dir;
    return String(av).localeCompare(String(bv), undefined, {numeric:true, sensitivity:'base'}) * dir;
  });
  return list;
}
function rdgValidateRequiredFields_412(data, fields) {
  if (typeof rdgValidateRequiredFields === 'function') return rdgValidateRequiredFields(data, fields);
  data = rdgIsPlainObject_412(data) ? data : {};
  fields = rdgEnsureArray_412(fields);
  var missing = fields.filter(function(f) { return rdgSafeString(data[f]).trim() === ''; });
  return {valid: missing.length === 0, missing: missing};
}
function rdgGetConfigValue_412(path, fallback) {
  if (typeof rdgGetConfigValue === 'function') return rdgGetConfigValue(path, fallback);
  var cur = (typeof APP_CONFIG !== 'undefined') ? APP_CONFIG : null;
  if (!cur) return fallback;
  rdgEnsureArray_412(rdgSafeString_412(path).split('.')).forEach(function(part) {
    if (cur !== null && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur, part)) cur = cur[part];
    else cur = undefined;
  });
  return cur === undefined ? fallback : cur;
}
function rdgBuildId_412(prefix, length) {
  if (typeof rdgBuildId === 'function') return rdgBuildId(prefix, length);
  var pfx = rdgSafeString_412(prefix || 'RDG').replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
  var len = Math.max(4, Math.floor(rdgToNumber_412(length, 8)));
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '';
  for (var i=0;i<len;i++) out += chars.charAt(Math.floor(Math.random()*chars.length));
  return pfx + '-' + out;
}
function rdgNormalizeExistingIndex_412(length, index) {
  if (typeof rdgNormalizeExistingIndex === 'function') return rdgNormalizeExistingIndex(length,index);
  var n = Math.max(0, Math.floor(rdgToNumber_412(length,0)));
  if (!n) return -1;
  var i = Math.trunc(rdgToNumber_412(index,0));
  if (i < 0) i = n + i;
  return i >= 0 && i < n ? i : -1;
}

/* =========================================================
 * TIME HELPER — LOCAL SAFE FALLBACK
 * ========================================================= */
function rdgNowIso() {
  return new Date().toISOString();
}

/* =========================================================
 * CORE UTILITY COMPATIBILITY — v4.4.11
 * ========================================================= */
function rdgSafeString_411(value) {
  if (typeof rdgSafeString === 'function') return rdgSafeString(value);
  if (value === null || typeof value === 'undefined') return '';
  return String(value);
}

function rdgNormalizeExistingIndex_411(length, index) {
  var n = Number(length);
  if (!isFinite(n)) n = 0;
  n = Math.max(0, Math.floor(n));
  if (!n) return -1;

  var i = Number(index);
  if (!isFinite(i)) i = 0;
  i = Math.trunc(i);
  if (i < 0) i = n + i;
  return i >= 0 && i < n ? i : -1;
}

/* =========================================================
 * IDENTITY NORMALIZATION — LOCAL SAFE FALLBACK
 * ========================================================= */
function rdgNormalizeEmail_448(value) {
  if (typeof rdgNormalizeEmail === 'function') {
    return rdgNormalizeEmail(value);
  }
  return String(value === null || typeof value === 'undefined' ? '' : value)
    .trim()
    .toLowerCase();
}

/* =========================================================
 * RESPONSE HELPERS — LOCAL SAFE FALLBACK
 * =========================================================
 * RDGServer may be deployed with or without a shared response
 * helper module. These uniquely named internal helpers prevent
 * direct dependency on a global rdgSuccess_()/rdgError_() function.
 */

function rdgInsertArrayItem(array, index, item) {
  if (!Array.isArray(array)) {
    throw new Error('rdgInsertArrayItem(): array is required.');
  }

  var length = array.length;
  var normalizedIndex = Number(index);

  if (!isFinite(normalizedIndex)) {
    normalizedIndex = length;
  } else {
    normalizedIndex = Math.trunc(normalizedIndex);
    if (normalizedIndex < 0) normalizedIndex = Math.max(0, length + normalizedIndex);
    if (normalizedIndex > length) normalizedIndex = length;
  }

  array.splice(normalizedIndex, 0, item);
  return array;
}

function rdgSuccess_(data, message, meta) {
  if (typeof rdgSuccess === 'function') {
    return rdgSuccess(data, message, meta);
  }

  var result = {
    success: true,
    data: data
  };

  if (message !== undefined && message !== null && message !== '') {
    result.message = message;
  }

  if (meta !== undefined && meta !== null) {
    result.meta = meta;
  }

  return result;
}

function rdgError_(errorOrMessage, code, meta) {
  if (typeof rdgError === 'function') {
    return rdgError(errorOrMessage, code, meta);
  }

  var message = '';
  if (errorOrMessage instanceof Error) {
    message = errorOrMessage.message || String(errorOrMessage);
  } else if (errorOrMessage !== undefined && errorOrMessage !== null) {
    message = String(errorOrMessage);
  } else {
    message = 'Unknown RDG server error.';
  }

  var result = {
    success: false,
    error: message
  };

  if (code !== undefined && code !== null && code !== '') {
    result.code = code;
  }

  if (meta !== undefined && meta !== null) {
    result.meta = meta;
  }

  return result;
}


function testRDGServerResponseHelpers445() {
  var success = rdgSuccess_({ok: true}, 'helper test');
  var failure = rdgError_('expected failure', 'TEST_ERROR');

  var result = {
    version: RDG_SERVER_VERSION,
    successHelper: !!success && success.success === true,
    errorHelper: !!failure && failure.success === false,
    errorCode: failure && failure.code === 'TEST_ERROR'
  };

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}


function testRDGArrayInsertDependency449() {
  var sample = [{id: 1}, {id: 2}, {id: 3}];
  rdgInsertArrayItem(sample, -1, {id: 99});
  var first = sample.length === 4 && sample[2].id === 99 && sample[3].id === 3;
  rdgInsertArrayItem(sample, -2, {id: 88});
  var second = sample.length === 5 && sample[2].id === 88 && sample[3].id === 99;
  var result = {version: RDG_SERVER_VERSION, insertArrayItem: true, negativeIndexRules: first && second, pass: first && second};
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/* =========================================================
 * WEB APP
 * ========================================================= */

function doGet(e) {
  try {
    var template = HtmlService.createTemplateFromFile('RDGGame');
    template.appConfig = getPublicConfig_();

    return template.evaluate()
      .setTitle(getConfigValue_('app.name', 'RD Route Design ACC'))
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return HtmlService.createHtmlOutput(
      '<h2>RDG Server Error</h2><pre>' +
      escapeHtml_(rdgErrorMessage_447(error)) +
      '</pre>'
    );
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* =========================================================
 * INITIALIZATION
 * ========================================================= */

function initializeSystem() {
  return withScriptLock_(function() {
    var tables = getConfiguredTables_();
    var created = [];
    var existing = [];

    tables.forEach(function(tableKey) {
      var sheet = getSheet_(tableKey);
      ensureTableHeaders_(sheet, tableKey);

      if (sheet.getLastRow() <= 1) {
        created.push(tableKey);
      } else {
        existing.push(tableKey);
      }
    });

    return rdgSuccess_({
      initialized: true,
      tableCount: tables.length,
      createdOrReady: created,
      existing: existing,
      spreadsheetId: getDatabaseSpreadsheet_().getId()
    }, 'RDG database initialized.');
  });
}

function getSystemBootstrap() {
  return rdgSuccess_({
    app: getPublicConfig_(),
    serverVersion: RDG_SERVER_VERSION,
    database: {
      spreadsheetId: getDatabaseSpreadsheet_().getId()
    },
    tables: getConfiguredTables_(),
    serverTime: rdgNowIso()
  });
}

/* =========================================================
 * UNIVERSAL CRUD
 * ========================================================= */

function createRecord(tableName, recordData, options) {
  if (rdgIsBlank_447(tableName)) {
    throw new Error(
      'createRecord(): tableName is required. ' +
      'Example: createRecord("users", data, options).'
    );
  }
  if (!rdgIsPlainObject_412(recordData)) {
    throw new Error('createRecord(): recordData must be an object.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};

  return withScriptLock_(function() {
    var tableKey = resolveTableKey_(tableName);
    var record = rdgNormalizeObject_412(recordData);
    var context = getRequestContext_();

    record = applyCompanyContext_(record, options, context);

    if (rdgIsBlank_447(record.id)) {
      record.id = generateRecordId_(tableKey);
    }

    var now = new Date();
    if (!record.createdAt) record.createdAt = now;
    record.updatedAt = now;

    if (rdgIsBlank_447(record.status)) {
      record.status = getSystemDefaultStatus_();
    }

    if (rdgIsBlank_447(record.createdBy)) {
      record.createdBy = context.userId;
    }
    record.updatedBy = context.userId;

    validateRecord_(tableKey, record, {operation: 'create'});

    var sheet = getSheet_(tableKey);
    ensureTableHeaders_(sheet, tableKey);

    if (findRecordById_(tableKey, record.id)) {
      throw new Error('Duplicate record ID: ' + record.id);
    }

    var headers = getHeaders_(sheet);
    sheet.appendRow(recordToRow_(tableKey, record, headers));

    var created = findRecordById_(tableKey, record.id);
    var finalRecord = created ? created.record : record;

    auditRecord_('CREATE', tableKey, record.id, null, finalRecord, options);

    return finalRecord;
  });
}

function getRecord(tableName, recordId, options) {
  if (rdgIsBlank_447(tableName)) throw new Error('getRecord(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('getRecord(): recordId is required.');

  options = rdgIsPlainObject_412(options) ? options : {};

  var tableKey = resolveTableKey_(tableName);
  var found = findRecordById_(tableKey, recordId);

  if (!found) return null;
  if (!options.includeDeleted && found.record.deletedAt) return null;

  var context = getRequestContext_();
  if (!canAccessRecord_(found.record, context, options)) {
    throw new Error('Unauthorized record access.');
  }

  return found.record;
}

function getAllRecords(tableName, options) {
  if (rdgIsBlank_447(tableName)) {
    throw new Error('getAllRecords(): tableName is required.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  var tableKey = resolveTableKey_(tableName);
  var records = readAllRecords_(tableKey);
  var context = getRequestContext_();

  records = records.filter(function(record) {
    if (!options.includeDeleted && record.deletedAt) return false;
    if (!options.includeInactive &&
        String(record.status || '').toUpperCase() === 'INACTIVE') return false;
    return canAccessRecord_(record, context, options);
  });

  if (options.sortBy) {
    records = rdgSortRecords_412(records, options.sortBy, options.sortDirection);
  }

  if (options.page || options.pageSize) {
    return rdgPaginate(records, options.page, options.pageSize);
  }

  return records;
}

function findRecords(tableName, filters, options) {
  if (rdgIsBlank_447(tableName)) {
    throw new Error('findRecords(): tableName is required.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  filters = rdgIsPlainObject_412(filters) ? filters : {};

  var tableKey = resolveTableKey_(tableName);
  var records = readAllRecords_(tableKey);
  var context = getRequestContext_();

  records = records.filter(function(record) {
    if (!options.includeDeleted && record.deletedAt) return false;
    if (!options.includeInactive &&
        String(record.status || '').toUpperCase() === 'INACTIVE') return false;
    if (!canAccessRecord_(record, context, options)) return false;
    return matchesFilters_(record, filters);
  });

  if (options.sortBy) {
    records = rdgSortRecords_412(records, options.sortBy, options.sortDirection);
  }

  if (options.page || options.pageSize) {
    return rdgPaginate(records, options.page, options.pageSize);
  }

  return records;
}

function updateRecord(tableName, recordId, changes, options) {
  if (rdgIsBlank_447(tableName)) throw new Error('updateRecord(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('updateRecord(): recordId is required.');
  if (!rdgIsPlainObject_412(changes)) throw new Error('updateRecord(): changes must be an object.');

  options = rdgIsPlainObject_412(options) ? options : {};

  return withScriptLock_(function() {
    var tableKey = resolveTableKey_(tableName);
    var found = findRecordById_(tableKey, recordId);

    if (!found) throw new Error('Record not found: ' + recordId);

    var context = getRequestContext_();
    if (!canAccessRecord_(found.record, context, options)) {
      throw new Error('Unauthorized record update.');
    }

    var before = rdgDeepClone_412(found.record);
    var updated = rdgDeepClone_412(found.record);

    if (options.replace === true) {
      updated = rdgNormalizeObject_412(changes);
      updated.id = found.record.id;
      if (!updated.createdAt) updated.createdAt = found.record.createdAt;
      if (!updated.createdBy) updated.createdBy = found.record.createdBy;
    } else {
      Object.keys(changes).forEach(function(key) {
        if (key.indexOf('.') !== -1) {
          setNested(updated, key, changes[key]);
        } else {
          updated[key] = rdgDeepClone_412(changes[key]);
        }
      });
    }

    updated.updatedAt = new Date();
    updated.updatedBy = context.userId;

    var currentVersion = rdgToNumber_412(found.record.version, 0);
    if (options.expectedVersion !== null &&
        typeof options.expectedVersion !== 'undefined' &&
        currentVersion !== rdgToNumber_412(options.expectedVersion)) {
      throw new Error('Version conflict. Record was changed by another operation.');
    }
    updated.version = currentVersion + 1;

    updated = applyCompanyContext_(updated, options, context);
    validateRecord_(tableKey, updated, {operation: 'update'});

    var sheet = getSheet_(tableKey);
    var headers = getHeaders_(sheet);
    sheet.getRange(found.rowNumber, 1, 1, headers.length)
      .setValues([recordToRow_(tableKey, updated, headers)]);

    auditRecord_('UPDATE', tableKey, recordId, before, updated, options);

    return updated;
  });
}

function deleteRecord(tableName, recordId, options) {
  if (rdgIsBlank_447(tableName)) throw new Error('deleteRecord(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('deleteRecord(): recordId is required.');

  options = rdgIsPlainObject_412(options) ? options : {};

  return withScriptLock_(function() {
    var tableKey = resolveTableKey_(tableName);
    var found = findRecordById_(tableKey, recordId);

    if (!found) throw new Error('Record not found: ' + recordId);

    var context = getRequestContext_();
    if (!canAccessRecord_(found.record, context, options)) {
      throw new Error('Unauthorized record deletion.');
    }

    var before = rdgDeepClone_412(found.record);
    var sheet = getSheet_(tableKey);
    var headers = getHeaders_(sheet);

    if (rdgGetConfigValue_412('settings.softDelete', true) !== false &&
        options.hardDelete !== true) {
      var deleted = rdgDeepClone_412(found.record);
      deleted.deletedAt = new Date();
      deleted.deletedBy = context.userId;
      deleted.status = 'DELETED';
      deleted.updatedAt = new Date();
      deleted.updatedBy = context.userId;
      deleted.version = rdgToNumber_412(deleted.version, 0) + 1;

      sheet.getRange(found.rowNumber, 1, 1, headers.length)
        .setValues([recordToRow_(tableKey, deleted, headers)]);

      auditRecord_('SOFT_DELETE', tableKey, recordId, before, deleted, options);
      return deleted;
    }

    if (rdgGetConfigValue_412('security.preventHardDelete', true) !== false &&
        options.allowHardDelete !== true) {
      throw new Error('Hard delete is disabled by security policy.');
    }

    sheet.deleteRow(found.rowNumber);
    auditRecord_('HARD_DELETE', tableKey, recordId, before, null, options);

    return {
      id: recordId,
      deleted: true,
      hardDelete: true
    };
  });
}

/* =========================================================
 * DATABASE / SHEET LAYER
 * ========================================================= */

function getDatabaseSpreadsheet_() {
  var configuredId = getConfigValue_('database.spreadsheetId', '');

  if (!configuredId) {
    configuredId = PropertiesService.getScriptProperties()
      .getProperty('RDG_DATABASE_SPREADSHEET_ID');
  }

  if (configuredId) {
    return SpreadsheetApp.openById(configuredId);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  throw new Error(
    'RDG database spreadsheet is not configured. ' +
    'Set database.spreadsheetId or RDG_DATABASE_SPREADSHEET_ID.'
  );
}

function getSheet_(tableName) {
  var tableKey = resolveTableKey_(tableName);
  var spreadsheet = getDatabaseSpreadsheet_();
  var sheetName = getConfiguredTableName_(tableKey);
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    if (rdgGetConfigValue_412('settings.automaticSheetCreation', true) === false) {
      throw new Error('Sheet not found: ' + sheetName);
    }
    sheet = spreadsheet.insertSheet(sheetName);
  }

  return sheet;
}

function createTable_(tableKey) {
  var sheet = getSheet_(tableKey);
  ensureTableHeaders_(sheet, tableKey);
  return sheet;
}

function ensureTableHeaders_(sheet, tableKey) {
  var headers = getTableHeaders_(tableKey);
  if (!headers.length) throw new Error('No schema headers configured for: ' + tableKey);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }

  var current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length))
    .getValues()[0]
    .slice(0, headers.length);

  var needsUpdate = false;
  for (var i = 0; i < headers.length; i++) {
    if (String(current[i] || '') !== String(headers[i])) {
      needsUpdate = true;
      break;
    }
  }

  if (needsUpdate) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function getHeaders_(sheet) {
  if (sheet.getLastColumn() === 0) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function(value) { return String(value || '').trim(); })
    .filter(function(value) { return value !== ''; });
}

function getTableHeaders_(tableKey) {
  var schema = getTableConfigSchema_(tableKey);
  return schema && Array.isArray(schema.headers) ? schema.headers : [];
}

function readAllRecords_(tableKey) {
  var sheet = getSheet_(tableKey);
  ensureTableHeaders_(sheet, tableKey);

  var headers = getHeaders_(sheet);
  var lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  return values.map(function(row, index) {
    return rowToRecord_(tableKey, row, headers, index + 2);
  }).filter(function(record) {
    return record !== null;
  });
}

function rowToRecord_(tableKey, row, headers, rowNumber) {
  var record = {};

  headers.forEach(function(header, index) {
    var value = row[index];

    if (isJsonField_(tableKey, header)) {
      if (value === '' || value === null) {
        value = {};
      } else {
        var parsed = safeJsonParse(value, value);
        value = parsed;
      }
    }

    record[header] = value;
  });

  if (rowNumber) record._rowNumber = rowNumber;
  return record;
}

function recordToRow_(tableKey, record, headers) {
  return headers.map(function(header) {
    var value = getNested(record, header, '');

    if (isJsonField_(tableKey, header)) {
      if (value === null || typeof value === 'undefined' || value === '') return '';
      return safeJsonStringify(value, '');
    }

    if (value instanceof Date) return value;
    if (rdgIsPlainObject_412(value) || Array.isArray(value)) {
      return safeJsonStringify(value, '');
    }

    return value;
  });
}

function findRecordById_(tableKey, recordId) {
  var sheet = getSheet_(tableKey);
  ensureTableHeaders_(sheet, tableKey);

  var headers = getHeaders_(sheet);
  var idIndex = headers.indexOf('id');
  if (idIndex === -1) throw new Error('Schema must contain id field: ' + tableKey);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  var ids = sheet.getRange(2, idIndex + 1, lastRow - 1, 1).getValues();

  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(recordId)) {
      return {
        rowNumber: i + 2,
        record: rowToRecord_(
          tableKey,
          sheet.getRange(i + 2, 1, 1, headers.length).getValues()[0],
          headers,
          i + 2
        )
      };
    }
  }

  return null;
}

/* =========================================================
 * FILTER ENGINE
 * ========================================================= */

function matchesFilters_(record, filters) {
  return Object.keys(filters).every(function(field) {
    var expected = filters[field];
    var actual = getFieldValue_(record, field);

    if (rdgIsPlainObject_412(expected)) {
      return Object.keys(expected).every(function(operator) {
        return compareFilter_(actual, operator, expected[operator]);
      });
    }

    return compareFilter_(actual, '$eq', expected);
  });
}

function compareFilter_(actual, operator, expected) {
  var op = String(operator || '$eq').toLowerCase();

  switch (op) {
    case '$eq':
      return actual === expected || String(actual) === String(expected);
    case '$ne':
      return !(actual === expected || String(actual) === String(expected));
    case '$in':
      return rdgEnsureArray(expected).some(function(item) {
        return actual === item || String(actual) === String(item);
      });
    case '$nin':
      return !compareFilter_(actual, '$in', expected);
    case '$contains':
      return String(actual || '').toLowerCase()
        .indexOf(String(expected || '').toLowerCase()) !== -1;
    case '$startswith':
      return String(actual || '').toLowerCase()
        .indexOf(String(expected || '').toLowerCase()) === 0;
    case '$endswith':
      var a = String(actual || '').toLowerCase();
      var e = String(expected || '').toLowerCase();
      return a.slice(-e.length) === e;
    case '$gt':
      return actual > expected;
    case '$gte':
      return actual >= expected;
    case '$lt':
      return actual < expected;
    case '$lte':
      return actual <= expected;
    default:
      throw new Error('Unsupported filter operator: ' + operator);
  }
}

function getFieldValue_(record, field) {
  if (String(field).indexOf('.') !== -1) {
    return getNested(record, field, null);
  }
  return record[field];
}

/* =========================================================
 * CONFIG / SCHEMA RESOLUTION
 * ========================================================= */

function getConfiguredTables_() {
  var tables = getConfigValue_('tables', {});
  var out = [];

  Object.keys(tables || {}).forEach(function(group) {
    var groupTables = tables[group];
    if (!rdgIsPlainObject_412(groupTables)) return;

    Object.keys(groupTables).forEach(function(tableKey) {
      if (out.indexOf(tableKey) === -1) out.push(tableKey);
    });
  });

  return out;
}

function resolveTableKey_(tableName) {
  var input = rdgSafeString_411(tableName).trim().toLowerCase();
  var tables = getConfigValue_('tables', {});

  var found = null;

  Object.keys(tables || {}).some(function(group) {
    var groupTables = tables[group];
    if (!rdgIsPlainObject_412(groupTables)) return false;

    return Object.keys(groupTables).some(function(key) {
      var cfg = groupTables[key];
      var configuredName = rdgIsPlainObject_412(cfg) ? cfg.name : cfg;

      if (key.toLowerCase() === input ||
          String(configuredName || '').toLowerCase() === input) {
        found = key;
        return true;
      }
      return false;
    });
  });

  if (!found) throw new Error('Unknown RDG table: ' + tableName);
  return found;
}

function getConfiguredTableName_(tableKey) {
  var cfg = getTableConfig_(tableKey);
  if (rdgIsPlainObject_412(cfg) && cfg.name) return cfg.name;
  return tableKey;
}

function getConfiguredIdPrefix_(tableKey) {
  var cfg = getTableConfig_(tableKey);
  if (rdgIsPlainObject_412(cfg) && cfg.idPrefix) return cfg.idPrefix;
  return 'RDG';
}

function getTableConfig_(tableKey) {
  var tables = getConfigValue_('tables', {});

  for (var group in tables) {
    if (!Object.prototype.hasOwnProperty.call(tables, group)) continue;
    if (tables[group] && tables[group][tableKey]) return tables[group][tableKey];
  }

  throw new Error('Table configuration not found: ' + tableKey);
}

function getTableConfigSchema_(tableKey) {
  var cfg = getTableConfig_(tableKey);
  if (cfg && cfg.schema) return cfg.schema;
  return cfg;
}

/*
 * getConfigValue_() is intentionally NOT redefined here.
 * RDGConfig.gs owns the centralized configuration accessor.
 */
/* =========================================================
 * CONFIG COMPATIBILITY
 * ========================================================= */

function getPublicConfig_() {
  return {
    app: {
      name: getConfigValue_('app.name', 'RD Route Design ACC'),
      shortName: getConfigValue_('app.shortName', 'RDG'),
      version: getConfigValue_('app.version', '1.0.0'),
      timezone: getConfigValue_('app.timezone', 'Asia/Karachi')
    },
    gaming: getConfigValue_('gaming', {}),
    wallet: getConfigValue_('wallet', {}),
    userSystem: getConfigValue_('userSystem', {})
  };
}

function isJsonField_(tableKey, field) {
  var configured = getConfigValue_('database.jsonFields', []);
  if (Array.isArray(configured) && configured.indexOf(field) !== -1) return true;

  var schema = getTableConfigSchema_(tableKey);
  if (schema && schema.jsonFields &&
      schema.jsonFields.indexOf(field) !== -1) return true;

  var defaults = [
    'metadata', 'settings', 'preferences', 'attributes',
    'productAttributes', 'attachments', 'uiConfig',
    'beforeState', 'afterState', 'data', 'permissions',
    'rules', 'pricing', 'address', 'contactInfo',
    'walletBalances', 'gameSettings', 'profile',
    'verification', 'accountInfo'
  ];

  return defaults.indexOf(field) !== -1;
}

/* =========================================================
 * ID / RECORD VALIDATION
 * ========================================================= */

function generateRecordId_(tableKey) {
  return rdgBuildId(getConfiguredIdPrefix_(tableKey), 8);
}

function validateRecord_(tableKey, record, options) {
  var schema = getTableConfigSchema_(tableKey);
  if (!schema) return true;

  var required = schema.required || [];
  var check = rdgValidateRequiredFields_412(record, required);

  if (!check.valid) {
    throw new Error(
      'Validation failed for ' + tableKey +
      '. Missing: ' + check.missing.join(', ')
    );
  }

  if (record.id && !rdgIsValidId(record.id, getConfiguredIdPrefix_(tableKey))) {
    throw new Error('Invalid ID format for ' + tableKey + ': ' + record.id);
  }

  if (schema.fields) {
    Object.keys(schema.fields).forEach(function(field) {
      var type = schema.fields[field];
      var value = record[field];

      if (rdgIsBlank_447(value)) return;

      if (typeof type === 'string') {
        validateFieldType_(field, value, type);
      } else if (rdgIsPlainObject_412(type) && type.type) {
        validateFieldType_(field, value, type.type);
      }
    });
  }

  return true;
}

function validateFieldType_(field, value, type) {
  var t = String(type).toLowerCase();

  if (t === 'string' && typeof value !== 'string') {
    throw new Error(field + ' must be a string.');
  }
  if (t === 'number' && !isFinite(rdgToNumber_412(value, NaN))) {
    throw new Error(field + ' must be a number.');
  }
  if (t === 'boolean' && typeof value !== 'boolean') {
    throw new Error(field + ' must be boolean.');
  }
  if (t === 'array' && !Array.isArray(value)) {
    throw new Error(field + ' must be an array.');
  }
  if (t === 'object' && !rdgIsPlainObject_412(value)) {
    throw new Error(field + ' must be an object.');
  }
  if (t === 'date' && !rdgIsValidDate(value)) {
    throw new Error(field + ' must be a valid date.');
  }
}

/* =========================================================
 * REQUEST CONTEXT / COMPANY ISOLATION
 * ========================================================= */

function getRequestContext_() {
  var email = '';

  try {
    email = Session.getActiveUser().getEmail() || '';
  } catch (e) {}

  var props = PropertiesService.getScriptProperties();

  return {
    userEmail: rdgNormalizeEmail_448(email),
    userId: props.getProperty('RDG_SYSTEM_USER_ID') || 'RDSYSTEM',
    companyId: props.getProperty('RDG_DEFAULT_COMPANY_ID') || '',
    timestamp: new Date()
  };
}

function applyCompanyContext_(record, options, context) {
  record = rdgDeepClone_412(record);

  var isolationEnabled = rdgGetConfigValue_412(
    'security.companyIsolation',
    true
  );

  if (!isolationEnabled) return record;

  var suppliedCompany = record.companyId || options.companyId || '';
  var contextCompany = context.companyId || '';

  if (!suppliedCompany && contextCompany) {
    record.companyId = contextCompany;
  }

  if (suppliedCompany && contextCompany &&
      suppliedCompany !== contextCompany &&
      !canCrossCompany_(options, context)) {
    throw new Error('Cross-company operation is not authorized.');
  }

  return record;
}

function canAccessRecord_(record, context, options) {
  if (options && options.systemOperation === true) return true;

  if (!rdgGetConfigValue_412('security.companyIsolation', true)) return true;

  var contextCompany = context.companyId || '';
  if (!contextCompany) return true;

  if (!record.companyId) return true;

  return String(record.companyId) === String(contextCompany);
}

function canCrossCompany_(options, context) {
  return !!(
    options &&
    options.systemOperation === true &&
    options.allowCrossCompany === true
  );
}

function getSystemDefaultStatus_() {
  return rdgGetConfigValue('settings.defaultStatus', 'ACTIVE');
}

/* =========================================================
 * AUDIT
 * ========================================================= */

function auditRecord_(action, tableKey, recordId, beforeState, afterState, options) {
  if (rdgGetConfigValue_412('settings.auditEnabled', true) === false) return;

  try {
    var context = getRequestContext_();
    var auditTable = 'auditLogs';

    if (getConfiguredTables_().indexOf(auditTable) === -1) return;

    var data = {
      action: action,
      table: tableKey,
      recordId: recordId,
      userId: context.userId,
      userEmail: context.userEmail,
      companyId: context.companyId,
      timestamp: new Date(),
      beforeState: beforeState || {},
      afterState: afterState || {},
      metadata: {
        serverVersion: RDG_SERVER_VERSION,
        options: options || {}
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    createRecord(
      auditTable,
      data,
      {
        systemOperation: true,
        allowCrossCompany: true,
        skipAudit: true
      }
    );
  } catch (error) {
    console.error('RDG audit failure: ' + rdgErrorMessage_447(error));
  }
}

/* =========================================================
 * LOCKING / TRANSACTION SAFETY
 * ========================================================= */

function withScriptLock_(callback) {
  var lock = LockService.getScriptLock();
  var timeout = rdgToNumber_412(
    getConfigValue_('database.lockTimeoutMs', 30000),
    30000
  );

  if (!lock.tryLock(timeout)) {
    throw new Error('RDG database is busy. Please retry.');
  }

  try {
    return callback();
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}



/* ================================================================
 * CANONICAL PERMISSION ENGINE — RDGServer v4.4.13
 * ================================================================ */

function hasServerPermission_(
  user,
  operation,
  tableKey
) {

  if (!user) {
    return false;
  }

  var systemUserId =
    getConfigValue_(
      'security.systemUserId',
      'RDSYSTEM'
    );

  var systemRole =
    getConfigValue_(
      'security.systemRole',
      'SYSTEM'
    );

  var userId =
    getServerUserId_(user);

  var role =
    getServerUserRole_(user);

  if (
    String(userId) ===
      String(systemUserId) ||
    String(role || '').toUpperCase() ===
      String(systemRole).toUpperCase()
  ) {
    return true;
  }


  var op =
    String(operation || '')
      .trim()
      .toUpperCase();

  var table =
    String(tableKey || '')
      .trim()
      .toLowerCase();


  var candidates = [];

  /*
   * Wildcard.
   */
  candidates.push('*');


  /*
   * Exact operation.
   */
  if (op) {
    candidates.push(op);
  }


  /*
   * Operation:table.
   */
  if (
    op &&
    table
  ) {

    candidates.push(
      op + ':' + table
    );
  }


  /*
   * GET/LIST/FIND can use READ.
   */
  if (
    op === 'GET' ||
    op === 'LIST' ||
    op === 'FIND'
  ) {

    candidates.push(
      'READ'
    );

    if (table) {

      candidates.push(
        'READ:' + table
      );
    }
  }


  /*
   * Read direct permissions.
   */
  var direct =
    getUserPermissions_(
      user
    );

  if (
    permissionListContains_(
      direct,
      candidates
    )
  ) {

    return true;
  }


  /*
   * Role permissions.
   */
  var permissions =
    getConfigValue_(
      'security.permissions',
      {}
    );

  var rolePermissions = null;

  if (
    permissions &&
    typeof permissions === 'object'
  ) {

    rolePermissions =
      permissions[role];

    if (!rolePermissions) {

      /*
       * Case-insensitive role lookup.
       */
      var roleKey =
        Object.keys(
          permissions
        ).find(function(key) {

          return String(key)
            .toLowerCase() ===
            String(role || '')
              .toLowerCase();

        });

      if (roleKey) {

        rolePermissions =
          permissions[roleKey];
      }
    }
  }

  if (
    permissionListContains_(
      rolePermissions,
      candidates
    )
  ) {

    return true;
  }


  return false;
}

function permissionListContains_(
  permissions,
  candidates
) {

  if (!permissions) {
    return false;
  }

  var list = [];

  if (
    Array.isArray(permissions)
  ) {

    list =
      permissions.slice();

  } else if (
    typeof permissions === 'string'
  ) {

    list =
      permissions
        .split(',')
        .map(function(item) {
          return item.trim();
        });

  } else if (
    typeof permissions === 'object'
  ) {

    Object.keys(
      permissions
    ).forEach(function(key) {

      if (
        permissions[key] === true ||
        permissions[key] === 1 ||
        permissions[key] === 'true'
      ) {

        list.push(key);
      }
    });
  }

  var normalized =
    list.map(function(item) {

      if (
        typeof item === 'object' &&
        item
      ) {

        return String(
          item.permission ||
          item.name ||
          item.code ||
          item.key ||
          ''
        ).toUpperCase();
      }

      return String(item)
        .trim()
        .toUpperCase();
    });


  for (
    var i = 0;
    i < candidates.length;
    i++
  ) {

    var target =
      String(
        candidates[i]
      ).toUpperCase();

    if (
      normalized.indexOf(
        target
      ) !== -1
    ) {

      return true;
    }
  }

  return false;
}

function getUserPermissions_(
  user
) {

  if (!user) {
    return [];
  }


  var permissions =
    user.permissions;


  if (
    Array.isArray(
      permissions
    )
  ) {

    return permissions;
  }


  if (
    typeof permissions ===
      'string'
  ) {

    return permissions
      .split(',')
      .map(
        function(item) {
          return item.trim();
        }
      );
  }


  if (
    permissions &&
    typeof permissions ===
      'object'
  ) {

    return permissions;
  }


  return [];
}

function getServerUserId_(
  user
) {

  if (!user) {
    return null;
  }


  var fields = [
    'userId',
    'userID',
    'User ID',
    'id',
    'ID',
    'uid'
  ];


  for (
    var i = 0;
    i < fields.length;
    i++
  ) {

    if (
      user[
        fields[i]
      ] !== undefined &&
      user[
        fields[i]
      ] !== null &&
      String(
        user[
          fields[i]
        ]
      ) !== ''
    ) {

      return String(
        user[
          fields[i]
        ]
      );
    }
  }


  return null;
}

function getServerUserRole_(
  user
) {

  if (!user) {
    return null;
  }


  var fields = [
    'role',
    'Role',
    'userRole',
    'roleName',
    'systemRole'
  ];


  for (
    var i = 0;
    i < fields.length;
    i++
  ) {

    if (
      user[
        fields[i]
      ] !== undefined &&
      user[
        fields[i]
      ] !== null &&
      String(
        user[
          fields[i]
        ]
      ) !== ''
    ) {

      return String(
        user[
          fields[i]
        ]
      );
    }
  }


  return null;
}

/* =========================================================
 * NESTED JSON BUSINESS API
 * ========================================================= */

function getNestedField(tableName, recordId, path, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('getNestedField(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('getNestedField(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('getNestedField(): path is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var record = getRecord(tableName, recordId, options || {});
  if (!record) return null;

  return getNested(record, path, null);
}

function setNestedField(tableName, recordId, path, value, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('setNestedField(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('setNestedField(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('setNestedField(): path is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var changes = {};
  changes[path] = value;
  return updateRecord(tableName, recordId, changes, options || {});
}

function updateNestedFields(tableName, recordId, updates, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('updateNestedFields(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('updateNestedFields(): recordId is required.');
  if (!rdgIsPlainObject_412(updates) || Object.keys(updates).length === 0) throw new Error('updateNestedFields(): updates must be a non-empty object.');
  options = rdgIsPlainObject_412(options) ? options : {};

  return updateRecord(tableName, recordId, updates, options || {});
}

function getRequiredNestedArray_(record, path) {
  var array = getNested(record, path, null);
  if (!Array.isArray(array)) {
    throw new Error('Nested field must be an array: ' + path);
  }
  return array;
}

function addNestedArrayItem(tableName, recordId, path, item, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('addNestedArrayItem(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('addNestedArrayItem(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('addNestedArrayItem(): path is required.');
  if (typeof item === 'undefined') throw new Error('addNestedArrayItem(): item is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var record = getRecord(tableName, recordId, options || {});
  if (!record) throw new Error('Record not found: ' + recordId);

  var array = getRequiredNestedArray_(record, path);
  array.push(rdgDeepClone_412(item));

  var changes = {};
  changes[path] = array;
  return updateRecord(tableName, recordId, changes, options || {});
}

function insertNestedArrayItem(tableName, recordId, path, index, item, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('insertNestedArrayItem(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('insertNestedArrayItem(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('insertNestedArrayItem(): path is required.');
  if (typeof index === 'undefined' || index === null) throw new Error('insertNestedArrayItem(): index is required.');
  if (typeof item === 'undefined') throw new Error('insertNestedArrayItem(): item is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var record = getRecord(tableName, recordId, options || {});
  if (!record) throw new Error('Record not found: ' + recordId);

  var array = getRequiredNestedArray_(record, path);
  rdgInsertArrayItem(array, index, rdgDeepClone_412(item));

  var changes = {};
  changes[path] = array;
  return updateRecord(tableName, recordId, changes, options || {});
}

function removeNestedArrayItem(tableName, recordId, path, index, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('removeNestedArrayItem(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('removeNestedArrayItem(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('removeNestedArrayItem(): path is required.');
  if (typeof index === 'undefined' || index === null) throw new Error('removeNestedArrayItem(): index is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var record = getRecord(tableName, recordId, options || {});
  if (!record) throw new Error('Record not found: ' + recordId);

  var array = getRequiredNestedArray_(record, path);
  var normalized = rdgNormalizeExistingIndex_411(array.length, index);

  if (normalized < 0) {
    throw new Error('Nested array index out of range.');
  }

  array.splice(normalized, 1);

  var changes = {};
  changes[path] = array;
  return updateRecord(tableName, recordId, changes, options || {});
}

function updateNestedArrayItem(tableName, recordId, path, index, item, options) {

  if (rdgIsBlank_447(tableName)) throw new Error('updateNestedArrayItem(): tableName is required.');
  if (rdgIsBlank_447(recordId)) throw new Error('updateNestedArrayItem(): recordId is required.');
  if (rdgIsBlank_447(path)) throw new Error('updateNestedArrayItem(): path is required.');
  if (typeof index === 'undefined' || index === null) throw new Error('updateNestedArrayItem(): index is required.');
  if (typeof item === 'undefined') throw new Error('updateNestedArrayItem(): item is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  var record = getRecord(tableName, recordId, options || {});
  if (!record) throw new Error('Record not found: ' + recordId);

  var array = getRequiredNestedArray_(record, path);
  var normalized = rdgNormalizeExistingIndex_411(array.length, index);

  if (normalized < 0) {
    throw new Error('Nested array index out of range.');
  }

  array[normalized] = rdgDeepClone_412(item);

  var changes = {};
  changes[path] = array;
  return updateRecord(tableName, recordId, changes, options || {});
}

/* =========================================================
 * API FACADE
 * ========================================================= */

function apiRequest(request) {
  try {
    request = rdgIsPlainObject_412(request) ? request : {};

    var action = rdgNormalizeCode_412(request.action || 'bootstrap');

    switch (action) {
      case 'PING':
        return rdgSuccess_({
          pong: true,
          serverVersion: RDG_SERVER_VERSION,
          serverTime: rdgNowIso()
        });

      case 'BOOTSTRAP':
        return getSystemBootstrap();

      case 'CREATE':
        return rdgSuccess_(createRecord(
          request.table,
          request.data,
          request.options
        ));

      case 'GET':
        return rdgSuccess_(getRecord(
          request.table,
          request.id,
          request.options
        ));

      case 'LIST':
        return rdgSuccess_(getAllRecords(
          request.table,
          request.options
        ));

      case 'FIND':
        return rdgSuccess_(findRecords(
          request.table,
          request.filters,
          request.options
        ));

      case 'UPDATE':
        return rdgSuccess_(updateRecord(
          request.table,
          request.id,
          request.changes,
          request.options
        ));

      case 'DELETE':
        return rdgSuccess_(deleteRecord(
          request.table,
          request.id,
          request.options
        ));

      case 'JOIN_ROOM':
        return rdgSuccess_(rdgJoinRoomApi_(request), 'Player joined room successfully.');

      case 'CREATE_ROOM_AUTO_JOIN':
        return rdgSuccess_(rdgCreateRoomAutoJoin_(request), 'Room created and player joined successfully.');

      case 'NESTED_GET':
        return rdgSuccess_(getNestedField(
          request.table,
          request.id,
          request.path,
          request.options
        ));

      case 'NESTED_SET':
        return rdgSuccess_(setNestedField(
          request.table,
          request.id,
          request.path,
          request.value,
          request.options
        ));

      default:
        return rdgError_(
          'Unsupported API action: ' + action,
          'UNSUPPORTED_ACTION'
        );
    }
  } catch (error) {
    return safeServerError(error);
  }
}


/**
 * Universal client facade.
 * Supports rdgApi('ACTION', payload) and rdgApi({action: 'ACTION', ...}).
 * The existing apiRequest() remains the internal object-based dispatcher.
 */
// ============================================================
// RDG SERVER v4.4.7 COMPATIBILITY HELPERS
// Safe local adapters: use shared RDG utility functions when available.
// ============================================================
function rdgIsBlank_447(value) {
  if (typeof rdgIsBlank === 'function') return rdgIsBlank(value);
  return value === null || typeof value === 'undefined' ||
    (typeof value === 'string' && value.trim() === '');
}

function rdgErrorMessage_447(error) {
  if (typeof rdgErrorMessage === 'function') return rdgErrorMessage(error);
  if (error === null || typeof error === 'undefined') return 'Unknown error';
  if (typeof error === 'string') return error;
  if (error && error.message) return String(error.message);
  try { return String(error); } catch (e) { return 'Unknown error'; }
}

function rdgApi(action, payload) {
  var request;

  if (rdgIsPlainObject_412(action)) {
    request = rdgDeepClone_412(action);
  } else {
    request = rdgIsPlainObject_412(payload) ? rdgDeepClone_412(payload) : {};
    request.action = action;
  }

  return apiRequest(request);
}

function rdgResolveAuthenticatedUserId_() {
  var candidates = [];

  try {
    if (typeof getCurrentServerUser_ === 'function') {
      var serverUser = getCurrentServerUser_();
      if (serverUser && serverUser.id) candidates.push(String(serverUser.id));
    }
  } catch (ignore1) {}

  try {
    if (typeof getCurrentUser === 'function') {
      var currentUser = getCurrentUser();
      if (currentUser && currentUser.id) candidates.push(String(currentUser.id));
    }
  } catch (ignore2) {}

  try {
    var email = Session.getActiveUser().getEmail();
    if (email) {
      var matches = findRecords('users', {email: String(email).trim()}, {
        includeDeleted: false,
        includeInactive: true,
        systemOperation: true,
        allowCrossCompany: true
      });
      if (Array.isArray(matches) && matches.length && matches[0].id) {
        candidates.push(String(matches[0].id));
      }
    }
  } catch (ignore3) {}

  for (var i = 0; i < candidates.length; i++) {
    if (candidates[i] && candidates[i] !== 'RDSYSTEM') return candidates[i];
  }

  throw new Error('Authenticated RDG user could not be resolved.');
}

function rdgJoinRoomApi_(request) {
  request = rdgIsPlainObject_412(request) ? request : {};
  var roomId = request.roomId || request.id;
  if (rdgIsBlank_447(roomId)) throw new Error('JOIN_ROOM requires roomId.');

  var userId = rdgResolveAuthenticatedUserId_();
  var playerData = rdgIsPlainObject_412(request.playerData)
    ? rdgDeepClone_412(request.playerData)
    : {};

  delete playerData.userId;
  delete playerData.playerNumber;
  delete playerData.status;
  delete playerData.roomId;

  var result = joinRDGGameRoom(
    roomId,
    userId,
    playerData,
    rdgIsPlainObject_412(request.options) ? request.options : {}
  );

  return {
    roomId: roomId,
    userId: userId,
    player: result,
    playerNumber: result && result.playerNumber ? result.playerNumber : null,
    status: result && result.status ? result.status : 'JOINED'
  };
}

function rdgCreateRoomAutoJoin_(request) {
  request = rdgIsPlainObject_412(request) ? request : {};
  var roomData = rdgIsPlainObject_412(request.roomData)
    ? rdgDeepClone_412(request.roomData)
    : rdgIsPlainObject_412(request.data)
      ? rdgDeepClone_412(request.data)
      : {};

  var options = rdgIsPlainObject_412(request.options) ? request.options : {};
  var createdRoom = createRDGGameRoom(roomData, options);
  var room = createdRoom && createdRoom.data ? createdRoom.data : createdRoom;
  var roomId = room && (room.id || room.ID);

  if (rdgIsBlank_447(roomId)) {
    throw new Error('Room was created but no room ID was returned.');
  }

  var joined = rdgJoinRoomApi_({
    roomId: roomId,
    playerData: request.playerData || {},
    options: options
  });

  return {
    room: room,
    roomId: roomId,
    player: joined.player,
    playerNumber: joined.playerNumber,
    status: joined.status
  };
}

/* =========================================================
 * GOOGLE LOGIN / USER FOUNDATION
 * ========================================================= */

function startGoogleLogin() {
  try {
    var context = getRequestContext_();
    var email = rdgNormalizeEmail_448(context.userEmail || '');

    if (!email) {
      return rdgError_(
        'Google account email could not be detected. ' +
        'Please deploy the web app with Google account access.',
        'GOOGLE_AUTH_REQUIRED'
      );
    }

    if (!rdgIsValidEmail(email)) {
      return rdgError_(
        'A valid Google email address is required.',
        'INVALID_GOOGLE_EMAIL'
      );
    }

    var existing = findRecords(
      'users',
      {email: email},
      {includeInactive: true, includeDeleted: false, systemOperation: true}
    );

    if (existing && existing.length) {
      var user = existing[0];

      if (!user.verification || !rdgIsPlainObject_412(user.verification)) {
        user.verification = {};
      }

      user.verification.emailVerified = true;
      user.verification.providerVerified = true;
      user.verification.provider = 'GOOGLE';
      user.verification.verifiedAt = new Date();

      updateRecord(
        'users',
        user.id,
        {verification: user.verification},
        {systemOperation: true, allowCrossCompany: true}
      );

      return rdgSuccess_(user, 'Welcome back.');
    }

    var username = email.split('@')[0]
      .replace(/[^a-zA-Z0-9._-]/g, '');

    if (!username) username = 'RDG User';

    var userData = {
      name: username,
      email: email,
      loginProvider: 'GOOGLE',
      status: 'ACTIVE',
      verification: {
        emailVerified: true,
        providerVerified: true,
        provider: 'GOOGLE',
        verifiedAt: new Date()
      },
      metadata: {
        firstLogin: true,
        authProvider: 'GOOGLE'
      }
    };

    var created = createRecord(
      'users',
      userData,
      {systemOperation: true, allowCrossCompany: true}
    );

    return rdgSuccess_(created, 'Google account created successfully.');
  } catch (error) {
    console.error('startGoogleLogin failed: ' + rdgErrorMessage_447(error));
    return rdgError_(rdgErrorMessage_447(error), 'GOOGLE_LOGIN_ERROR');
  }
}

function testStartGoogleLogin() {
  var result = startGoogleLogin();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/* =========================================================
 * HEALTH / DIAGNOSTICS
 * ========================================================= */

function databaseHealthCheck() {
  var result = {
    healthy: true,
    timestamp: rdgNowIso(),
    serverVersion: RDG_SERVER_VERSION,
    spreadsheetId: '',
    tables: []
  };

  try {
    var ss = getDatabaseSpreadsheet_();
    result.spreadsheetId = ss.getId();

    getConfiguredTables_().forEach(function(tableKey) {
      try {
        var sheet = getSheet_(tableKey);
        ensureTableHeaders_(sheet, tableKey);
        result.tables.push({
          table: tableKey,
          sheet: sheet.getName(),
          rows: Math.max(0, sheet.getLastRow() - 1),
          columns: sheet.getLastColumn(),
          healthy: true
        });
      } catch (e) {
        result.healthy = false;
        result.tables.push({
          table: tableKey,
          healthy: false,
          error: rdgErrorMessage_447(e)
        });
      }
    });

    return rdgSuccess_(result);
  } catch (error) {
    result.healthy = false;
    result.error = rdgErrorMessage_447(error);
    return rdgError_(result.error, 'DATABASE_HEALTH_ERROR', result);
  }
}

function pingServer() {
  return rdgSuccess_({
    pong: true,
    serverVersion: RDG_SERVER_VERSION,
    serverTime: rdgNowIso()
  }, 'RDG server is online.');
}

function getServerTime() {
  return rdgNowIso();
}

function getRDGServerDiagnostics() {
  return rdgSuccess_({
    serverVersion: RDG_SERVER_VERSION,
    configVersion: typeof RDG_CONFIG_VERSION !== 'undefined'
      ? RDG_CONFIG_VERSION
      : 'unknown',
    utilsVersion: typeof RDG_UTILS_VERSION !== 'undefined'
      ? RDG_UTILS_VERSION
      : 'unknown',
    database: databaseHealthCheck(),
    bootstrap: getSystemBootstrap()
  });
}

/* =========================================================
 * RDG GAME ENGINE FOUNDATION
 * ========================================================= */

/**
 * Returns the built-in game definition.
 * RDG is the Games domain only; each game controls its own capacity.
 */
function getRDGGameDefinition(gameType) {
  if (rdgIsBlank_447(gameType)) {
    throw new Error('getRDGGameDefinition(): gameType is required.');
  }

  var code = rdgSafeString_411(gameType).trim().toUpperCase();
  var definitions = {
    LUDO: {
      code: 'LUDO',
      name: 'RDG Ludo',
      minPlayers: 2,
      maxPlayers: 12,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: true,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    },
    SNAKE: {
      code: 'SNAKE',
      name: 'RDG Snake',
      minPlayers: 1,
      maxPlayers: 12,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: false,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    },
    CARROM: {
      code: 'CARROM',
      name: 'RDG Carrom',
      minPlayers: 2,
      maxPlayers: 4,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: true,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    },
    SPIRAL: {
      code: 'SPIRAL',
      name: 'RDG Spiral',
      minPlayers: 1,
      maxPlayers: null,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: true,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    },
    THREE_PATTI: {
      code: 'THREE_PATTI',
      name: 'RDG Three Patti',
      minPlayers: 2,
      maxPlayers: null,
      capacityMode: 'GAME_DEFINED',
      teamsSupported: false,
      currencies: ['COIN', 'DIAMOND', 'SILVER'],
      status: 'ACTIVE'
    }
  };

  return definitions[code] || {
    code: code,
    name: code,
    minPlayers: 1,
    maxPlayers: null,
    capacityMode: 'GAME_DEFINED',
    teamsSupported: true,
    currencies: ['COIN', 'DIAMOND', 'SILVER'],
    status: 'FUTURE'
  };
}

/** Validate a requested room capacity against its game definition. */
function validateRDGGameCapacity(gameType, maxPlayers) {
  var definition = getRDGGameDefinition(gameType);
  var requested = rdgToNumber_412(maxPlayers, NaN);

  if (!rdgIsFiniteNumber(requested) || requested < definition.minPlayers) {
    throw new Error(
      'Invalid player capacity for ' + definition.code +
      '. Minimum players: ' + definition.minPlayers + '.'
    );
  }

  if (definition.maxPlayers !== null && requested > definition.maxPlayers) {
    throw new Error(
      'Invalid player capacity for ' + definition.code +
      '. Maximum players: ' + definition.maxPlayers + '.'
    );
  }

  return {
    valid: true,
    gameType: definition.code,
    minPlayers: definition.minPlayers,
    maxPlayers: definition.maxPlayers,
    requestedPlayers: requested,
    capacityMode: definition.capacityMode
  };
}

/**
 * Creates a game room through Universal CRUD.
 * No direct Sheet writes are performed here.
 */
function createRDGGameRoom(roomData, options) {
  if (!rdgIsPlainObject_412(roomData)) {
    throw new Error('createRDGGameRoom(): roomData must be an object.');
  }
  if (rdgIsBlank_447(roomData.gameType)) {
    throw new Error('createRDGGameRoom(): gameType is required.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  var definition = getRDGGameDefinition(roomData.gameType);

  var capacity = roomData.maxPlayers;
  if (rdgIsBlank_447(capacity)) {
    capacity = definition.maxPlayers !== null ? definition.maxPlayers : null;
  }
  if (capacity === null) {
    throw new Error(
      'createRDGGameRoom(): maxPlayers is required for unlimited-capacity games.'
    );
  }

  validateRDGGameCapacity(definition.code, capacity);

  var data = rdgDeepClone_412(roomData);
  data.gameType = definition.code;
  data.maxPlayers = rdgToNumber_412(capacity, capacity);
  data.gameSettings = rdgIsPlainObject_412(data.gameSettings)
    ? data.gameSettings
    : {};
  data.gameSettings.capacityMode = definition.capacityMode;
  data.gameSettings.minPlayers = definition.minPlayers;
  data.gameSettings.supportedCurrencies = definition.currencies;

  if (rdgIsBlank_447(data.status)) data.status = 'WAITING';
  if (rdgIsBlank_447(data.roomType)) data.roomType = 'PUBLIC';

  return createRecord('gameRooms', data, options);
}

/**
 * Adds a player through Universal CRUD after validating room capacity.
 */
function joinRDGGameRoom(roomId, userId, playerData, options) {
  if (rdgIsBlank_447(roomId)) throw new Error('joinRDGGameRoom(): roomId is required.');
  if (rdgIsBlank_447(userId)) throw new Error('joinRDGGameRoom(): userId is required.');

  options = rdgIsPlainObject_412(options) ? options : {};
  playerData = rdgIsPlainObject_412(playerData) ? rdgDeepClone_412(playerData) : {};

  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  if (String(room.status || '').toUpperCase() !== 'WAITING') {
    throw new Error('Game room is not accepting new players.');
  }

  var definition = getRDGGameDefinition(room.gameType);
  var players = findRecords('gamePlayers', {roomId: roomId}, options);
  var activePlayers = players.filter(function(player) {
    var status = String(player.status || '').toUpperCase();
    return status !== 'LEFT' && status !== 'REMOVED' && status !== 'CANCELLED';
  });

  var maxPlayers = rdgToNumber_412(room.maxPlayers, definition.maxPlayers);
  if (maxPlayers !== null && activePlayers.length >= maxPlayers) {
    throw new Error('Game room is full. Maximum players: ' + maxPlayers + '.');
  }

  var duplicate = activePlayers.some(function(player) {
    return String(player.userId) === String(userId);
  });
  if (duplicate) throw new Error('User is already in this game room.');

  playerData.roomId = roomId;
  playerData.userId = userId;
  playerData.companyId = room.companyId || playerData.companyId;
  playerData.gameSettings = rdgIsPlainObject_412(playerData.gameSettings)
    ? playerData.gameSettings
    : {};
  playerData.playerNumber = activePlayers.length + 1;
  playerData.status = 'JOINED';
  playerData.joinedAt = new Date();

  return createRecord('gamePlayers', playerData, options);
}

/** Leave a game room using a soft status update. */
function leaveRDGGameRoom(playerId, options) {
  if (rdgIsBlank_447(playerId)) throw new Error('leaveRDGGameRoom(): playerId is required.');
  options = rdgIsPlainObject_412(options) ? options : {};

  return updateRecord('gamePlayers', playerId, {
    status: 'LEFT',
    leftAt: new Date()
  }, options);
}

/* =========================================================
 * TESTS
 * ========================================================= */

/**
 * SAFE local nested-array tests.
 * No Google Sheet/database mutation.
 */
function testRDGServer() {

  var nested = testRDGNestedBusinessSuite();
  var verification = verifyRDGServer();
  var ping = pingServer();

  return {
    success: nested.success && verification.success && !!(ping && ping.success),
    serverVersion: RDG_SERVER_VERSION,
    ping: ping,
    nested: nested,
    verification: verification,
    time: getServerTime()
  };
}

function verifyRDGServer() {

  var checks = [];

  checks.push({name: 'server version', pass: !!RDG_SERVER_VERSION});
  checks.push({
    name: 'utils available',
    pass: typeof rdgSuccess === 'function' && typeof rdgError === 'function'
  });
  checks.push({name: 'config available', pass: typeof RDG_CONFIG !== 'undefined'});
  checks.push({
    name: 'nested utilities',
    pass: typeof getNested === 'function' && typeof setNested === 'function'
  });
  checks.push({
    name: 'nested array utilities',
    pass: typeof rdgInsertArrayItem === 'function' && typeof rdgNormalizeExistingIndex === 'function'
  });
  checks.push({name: 'database resolver', pass: typeof getDatabaseSpreadsheet_ === 'function'});
  checks.push({
    name: 'nested business functions',
    pass:
      typeof getNestedField === 'function' &&
      typeof setNestedField === 'function' &&
      typeof updateNestedFields === 'function' &&
      typeof addNestedArrayItem === 'function' &&
      typeof insertNestedArrayItem === 'function' &&
      typeof updateNestedArrayItem === 'function' &&
      typeof removeNestedArrayItem === 'function'
  });

  return {
    success: checks.every(function(item) { return item.pass; }),
    version: RDG_SERVER_VERSION,
    checks: checks,
    timestamp: rdgNowIso()
  };
}

function testRDGServerCompatibility411() {
  var result = {
    serverVersion: typeof RDG_SERVER_VERSION !== 'undefined' ? String(RDG_SERVER_VERSION) : 'MISSING',
    safeStringFallback: typeof rdgSafeString_411 === 'function',
    existingIndexFallback: typeof rdgNormalizeExistingIndex_411 === 'function',
    nestedArrayNormalization: rdgNormalizeExistingIndex_411(3, -1) === 2 && rdgNormalizeExistingIndex_411(3, -4) === -1,
    htmlEscapeDependency: typeof escapeHtml_ === 'function'
  };
  result.pass = result.serverVersion === '4.4.11' &&
    result.safeStringFallback && result.existingIndexFallback &&
    result.nestedArrayNormalization && result.htmlEscapeDependency;
  Logger.log('RDG SERVER COMPATIBILITY 4.4.11');
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testRDGServerRuntimeAvailability444() {
  var result = {
    serverVersion: typeof RDG_SERVER_VERSION !== 'undefined' ? String(RDG_SERVER_VERSION) : 'MISSING',
    rdgApi: typeof rdgApi === 'function',
    apiRequest: typeof apiRequest === 'function',
    createRecord: typeof createRecord === 'function',
    getRecord: typeof getRecord === 'function',
    findRecords: typeof findRecords === 'function',
    updateRecord: typeof updateRecord === 'function',
    deleteRecord: typeof deleteRecord === 'function',
    createRDGGameRoom: typeof createRDGGameRoom === 'function',
    joinRDGGameRoom: typeof joinRDGGameRoom === 'function',
    gameRoomsAuthority: typeof createRDGGameRoom === 'function' && typeof joinRDGGameRoom === 'function'
  };
  Logger.log('========================================');
  Logger.log('RDG SERVER RUNTIME DIAGNOSTIC 4.4.4');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log('========================================');
  return result;
}

/* =========================================================
 * HTML ESCAPE
 * ========================================================= */

function escapeHtml_(value) {
  return rdgSafeString_411(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* =========================================================
 * RDG GAME ENGINE — SESSION / TEAM / ACTION FOUNDATION
 * Version 3.2.0
 *
 * Compatibility design:
 * - Uses existing gameRooms, gamePlayers and gameTransactions tables.
 * - Session state is anchored by gameRooms.sessionId.
 * - Team definitions are stored in gameRooms.gameSettings.teams.
 * - Player team membership is stored on gamePlayers.teamId/teamNumber/role.
 * - Game actions are immutable transaction records in gameTransactions.
 * - No direct Sheet writes are performed.
 *
 * This layer can later migrate to dedicated gameSessions/gameTeams tables
 * without changing the public engine contract.
 * ========================================================= */

// Version remains controlled by the canonical declaration above.


function rdgRequireGameType_(gameType, functionName) {
  if (rdgIsBlank_447(gameType)) {
    throw new Error(functionName + '(): gameType is required.');
  }
  return getRDGGameDefinition(gameType);
}

function rdgNormalizeGameSessionId_(value) {
  if (!rdgIsBlank_447(value)) return rdgSafeString_411(value).trim();
  return rdgBuildId('RDGSES', 8);
}

function rdgGetActiveGamePlayers_(roomId, options) {
  var players = findRecords('gamePlayers', {roomId: roomId}, options || {});
  return players.filter(function(player) {
    var status = String(player.status || '').toUpperCase();
    return status !== 'LEFT' && status !== 'REMOVED' &&
      status !== 'CANCELLED' && status !== 'DISCONNECTED';
  });
}

function rdgGetRoomTeams_(room) {
  var settings = rdgIsPlainObject_412(room.gameSettings) ? room.gameSettings : {};
  var teams = Array.isArray(settings.teams) ? settings.teams : [];
  return rdgDeepClone(teams);
}

function rdgSaveRoomGameSettings_(roomId, settings, options) {
  return updateRecord('gameRooms', roomId, {
    gameSettings: rdgIsPlainObject_412(settings) ? settings : {},
    updatedAt: new Date()
  }, options || {});
}

/** Start a new game session for an existing WAITING room. */
function startRDGGameSession(roomId, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('startRDGGameSession(): roomId is required.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  var status = String(room.status || '').toUpperCase();
  if (status !== 'WAITING' && status !== 'PAUSED') {
    throw new Error('Game room cannot start from status: ' + status + '.');
  }

  var definition = rdgRequireGameType_(room.gameType, 'startRDGGameSession');
  var players = rdgGetActiveGamePlayers_(roomId, options);
  var minimum = definition.minPlayers || 1;

  if (players.length < minimum) {
    throw new Error(
      'Not enough players to start ' + definition.code +
      '. Minimum players: ' + minimum + '.'
    );
  }

  var sessionId = rdgNormalizeGameSessionId_(room.sessionId);
  var settings = rdgIsPlainObject_412(room.gameSettings)
    ? rdgDeepClone_412(room.gameSettings)
    : {};

  settings.sessionId = sessionId;
  settings.sessionStatus = 'RUNNING';
  settings.startedAt = new Date();
  settings.gameCode = definition.code;

  var updatedRoom = updateRecord('gameRooms', roomId, {
    status: 'RUNNING',
    sessionId: sessionId,
    startedAt: new Date(),
    gameSettings: settings
  }, options);

  players.forEach(function(player) {
    updateRecord('gamePlayers', player.id, {
      sessionId: sessionId,
      status: 'PLAYING'
    }, options);
  });

  return {
    success: true,
    sessionId: sessionId,
    room: updatedRoom,
    playerCount: players.length,
    gameType: definition.code,
    status: 'RUNNING'
  };
}

/** Pause a running session without deleting any state. */
function pauseRDGGameSession(roomId, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('pauseRDGGameSession(): roomId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};

  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);
  if (String(room.status || '').toUpperCase() !== 'RUNNING') {
    throw new Error('Only RUNNING game rooms can be paused.');
  }

  var settings = rdgIsPlainObject_412(room.gameSettings)
    ? rdgDeepClone_412(room.gameSettings) : {};
  settings.sessionStatus = 'PAUSED';
  settings.pausedAt = new Date();

  return updateRecord('gameRooms', roomId, {
    status: 'PAUSED',
    gameSettings: settings
  }, options);
}

/** Resume a paused session. */
function resumeRDGGameSession(roomId, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('resumeRDGGameSession(): roomId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};

  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);
  if (String(room.status || '').toUpperCase() !== 'PAUSED') {
    throw new Error('Only PAUSED game rooms can be resumed.');
  }

  var settings = rdgIsPlainObject_412(room.gameSettings)
    ? rdgDeepClone_412(room.gameSettings) : {};
  settings.sessionStatus = 'RUNNING';
  settings.resumedAt = new Date();

  return updateRecord('gameRooms', roomId, {
    status: 'RUNNING',
    gameSettings: settings
  }, options);
}

/** Finish a session and freeze player participation. */
function finishRDGGameSession(roomId, resultData, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('finishRDGGameSession(): roomId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};
  resultData = rdgIsPlainObject_412(resultData) ? rdgDeepClone_412(resultData) : {};

  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  var status = String(room.status || '').toUpperCase();
  if (status !== 'RUNNING' && status !== 'PAUSED') {
    throw new Error('Game room cannot finish from status: ' + status + '.');
  }

  var settings = rdgIsPlainObject_412(room.gameSettings)
    ? rdgDeepClone_412(room.gameSettings) : {};
  settings.sessionStatus = 'FINISHED';
  settings.endedAt = new Date();
  settings.result = resultData;

  var updatedRoom = updateRecord('gameRooms', roomId, {
    status: 'FINISHED',
    endedAt: new Date(),
    gameSettings: settings
  }, options);

  var players = rdgGetActiveGamePlayers_(roomId, options);
  players.forEach(function(player) {
    updateRecord('gamePlayers', player.id, {
      status: 'FINISHED',
      leftAt: new Date()
    }, options);
  });

  return {
    success: true,
    sessionId: room.sessionId || null,
    room: updatedRoom,
    playerCount: players.length,
    result: resultData
  };
}

/** Create a team definition inside the room's gameSettings.teams array. */
function createRDGGameTeam(roomId, teamData, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('createRDGGameTeam(): roomId is required.');
  }
  if (!rdgIsPlainObject_412(teamData)) {
    throw new Error('createRDGGameTeam(): teamData must be an object.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  var teams = rdgGetRoomTeams_(room);
  var teamNumber = rdgToNumber_412(teamData.teamNumber, teams.length + 1);
  var duplicate = teams.some(function(team) {
    return String(team.teamNumber) === String(teamNumber) ||
      (!rdgIsBlank_447(team.code) && !rdgIsBlank_447(teamData.code) &&
       String(team.code).toUpperCase() === String(teamData.code).toUpperCase());
  });
  if (duplicate) throw new Error('Duplicate team number/code.');

  var team = rdgDeepClone_412(teamData);
  team.id = rdgIsBlank_447(team.id) ? rdgBuildId_412('RDGTEAM', 8) : team.id;
  team.roomId = roomId;
  team.sessionId = room.sessionId || null;
  team.teamNumber = teamNumber;
  team.status = team.status || 'ACTIVE';
  team.score = rdgToNumber_412(team.score, 0);
  team.players = [];
  team.createdAt = new Date();

  teams.push(team);

  var settings = rdgIsPlainObject_412(room.gameSettings)
    ? rdgDeepClone_412(room.gameSettings) : {};
  settings.teams = teams;
  settings.teamMode = settings.teamMode || 'CUSTOM';

  rdgSaveRoomGameSettings_(roomId, settings, options);
  return team;
}

/** Assign an existing room player to a room team. */
function assignRDGPlayerToTeam(playerId, teamId, options) {
  if (rdgIsBlank_447(playerId)) {
    throw new Error('assignRDGPlayerToTeam(): playerId is required.');
  }
  if (rdgIsBlank_447(teamId)) {
    throw new Error('assignRDGPlayerToTeam(): teamId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};

  var player = getRecord('gamePlayers', playerId, options);
  if (!player) throw new Error('Game player not found: ' + playerId);

  var room = getRecord('gameRooms', player.roomId, options);
  if (!room) throw new Error('Game room not found: ' + player.roomId);

  var teams = rdgGetRoomTeams_(room);
  var team = teams.filter(function(item) {
    return String(item.id) === String(teamId);
  })[0];
  if (!team) throw new Error('Game team not found: ' + teamId);

  var maxPlayers = rdgToNumber_412(team.maxPlayers, null);
  if (maxPlayers !== null) {
    var teamPlayers = rdgGetActiveGamePlayers_(player.roomId, options).filter(function(item) {
      return String(item.teamId) === String(teamId) && String(item.id) !== String(playerId);
    });
    if (teamPlayers.length >= maxPlayers) {
      throw new Error('Game team is full. Maximum players: ' + maxPlayers + '.');
    }
  }

  return updateRecord('gamePlayers', playerId, {
    teamId: team.id,
    teamNumber: team.teamNumber,
    role: player.role || 'PLAYER'
  }, options);
}

/**
 * Record a validated game action.
 * This function records the action/result; it does not award wallet value.
 * Rewards must be calculated by a separate server-side settlement layer.
 */
function recordRDGGameAction(roomId, userId, actionData, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('recordRDGGameAction(): roomId is required.');
  }
  if (rdgIsBlank_447(userId)) {
    throw new Error('recordRDGGameAction(): userId is required.');
  }
  if (!rdgIsPlainObject_412(actionData)) {
    throw new Error('recordRDGGameAction(): actionData must be an object.');
  }
  if (rdgIsBlank_447(actionData.actionType)) {
    throw new Error('recordRDGGameAction(): actionType is required.');
  }

  options = rdgIsPlainObject_412(options) ? options : {};
  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  var status = String(room.status || '').toUpperCase();
  if (status !== 'RUNNING') {
    throw new Error('Game actions are allowed only while the room is RUNNING.');
  }

  var player = findRecords('gamePlayers', {
    roomId: roomId,
    userId: userId
  }, options).filter(function(item) {
    var s = String(item.status || '').toUpperCase();
    return s !== 'LEFT' && s !== 'REMOVED' && s !== 'CANCELLED';
  })[0];

  if (!player) throw new Error('Active game player not found for user: ' + userId);

  var payload = rdgDeepClone_412(actionData);
  var scoreDelta = rdgToNumber_412(payload.scoreDelta, 0);
  var transaction = {
    id: rdgBuildId_412('RDGTXN', 8),
    companyId: room.companyId || player.companyId || null,
    roomId: roomId,
    userId: userId,
    sessionId: room.sessionId || player.sessionId || null,
    status: 'RECORDED',
    transactionType: 'GAME_ACTION',
    currency: payload.currency || null,
    amount: rdgToNumber_412(payload.amount, 0),
    referenceId: payload.referenceId || null,
    data: {
      actionType: payload.actionType,
      actionId: payload.actionId || rdgBuildId_412('RDGACT', 8),
      scoreDelta: scoreDelta,
      targetUserId: payload.targetUserId || null,
      targetId: payload.targetId || null,
      result: payload.result || null,
      metadata: payload.metadata || {}
    },
    createdAt: new Date()
  };

  return createRecord('gameTransactions', transaction, options);
}

/** Update player score from a server-validated action. */
function applyRDGScoreDelta(playerId, scoreDelta, options) {
  if (rdgIsBlank_447(playerId)) {
    throw new Error('applyRDGScoreDelta(): playerId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};
  var delta = rdgToNumber_412(scoreDelta, NaN);
  if (!rdgIsFiniteNumber(delta)) {
    throw new Error('applyRDGScoreDelta(): scoreDelta must be numeric.');
  }

  var player = getRecord('gamePlayers', playerId, options);
  if (!player) throw new Error('Game player not found: ' + playerId);

  var current = rdgToNumber_412(player.score, 0);
  var nextScore = current + delta;

  return updateRecord('gamePlayers', playerId, {
    score: nextScore
  }, options);
}

/** Get a compact server-side game state snapshot. */
function getRDGGameState(roomId, options) {
  if (rdgIsBlank_447(roomId)) {
    throw new Error('getRDGGameState(): roomId is required.');
  }
  options = rdgIsPlainObject_412(options) ? options : {};

  var room = getRecord('gameRooms', roomId, options);
  if (!room) throw new Error('Game room not found: ' + roomId);

  var players = rdgGetActiveGamePlayers_(roomId, options);
  var teams = rdgGetRoomTeams_(room);

  return {
    success: true,
    room: room,
    session: {
      id: room.sessionId || null,
      status: rdgIsPlainObject_412(room.gameSettings)
        ? room.gameSettings.sessionStatus || null
        : null
    },
    players: players,
    teams: teams,
    playerCount: players.length,
    timestamp: rdgNowIso()
  };
}

/* =========================================================
 * SAFE GAME ENGINE TESTS — NO DATABASE MUTATION
 * ========================================================= */

function testRDGGameEnginePure() {
  var capacity = [
    validateRDGGameCapacity('LUDO', 12),
    validateRDGGameCapacity('SNAKE', 12),
    validateRDGGameCapacity('CARROM', 4)
  ];

  var passed = capacity.every(function(item) { return item.valid; });
  var overflowCaught = false;
  try {
    validateRDGGameCapacity('CARROM', 5);
  } catch (e) {
    overflowCaught = true;
  }

  var unlimited = getRDGGameDefinition('THREE_PATTI');
  var unlimitedPassed = unlimited.maxPlayers === null &&
    unlimited.capacityMode === 'GAME_DEFINED';

  return {
    success: passed && overflowCaught && unlimitedPassed,
    checks: {
      ludo12: capacity[0].valid,
      snake12: capacity[1].valid,
      carrom4: capacity[2].valid,
      carromOverflowRejected: overflowCaught,
      threePattiUnlimited: unlimitedPassed
    },
    timestamp: rdgNowIso()
  };
}

function verifyRDGGameEngine() {
  var checks = [
    {name: 'game definition', pass: typeof getRDGGameDefinition === 'function'},
    {name: 'room creation', pass: typeof createRDGGameRoom === 'function'},
    {name: 'room join', pass: typeof joinRDGGameRoom === 'function'},
    {name: 'session start', pass: typeof startRDGGameSession === 'function'},
    {name: 'session finish', pass: typeof finishRDGGameSession === 'function'},
    {name: 'team creation', pass: typeof createRDGGameTeam === 'function'},
    {name: 'team assignment', pass: typeof assignRDGPlayerToTeam === 'function'},
    {name: 'game action', pass: typeof recordRDGGameAction === 'function'},
    {name: 'score engine', pass: typeof applyRDGScoreDelta === 'function'},
    {name: 'state snapshot', pass: typeof getRDGGameState === 'function'},
    {name: 'pure test suite', pass: typeof testRDGGameEnginePure === 'function'}
  ];

  return {
    success: checks.every(function(item) { return item.pass; }),
    version: RDG_SERVER_VERSION,
    checks: checks,
    timestamp: rdgNowIso()
  };
}


function testRDGServerCompatibility410() {
  return {
    serverVersion: (typeof RDG_SERVER_VERSION !== 'undefined') ? RDG_SERVER_VERSION : null,
    rdgIsBlankAdapter: typeof rdgIsBlank_447 === 'function',
    rdgErrorMessageAdapter: typeof rdgErrorMessage_447 === 'function',
    rdgApi: typeof rdgApi === 'function',
    apiRequest: typeof apiRequest === 'function',
    databaseHealthCheck: typeof databaseHealthCheck === 'function',
    gameEngineTest: typeof testRDGGameEnginePure === 'function'
  };
}


/* =========================================================
 * RDG SERVER COMPATIBILITY TEST 4.4.8
 * ========================================================= */
function testRDGServerCompatibility448() {
  var result = {
    serverVersion: RDG_SERVER_VERSION,
    rdgNormalizeEmailGlobal: typeof rdgNormalizeEmail === 'function',
    rdgNormalizeEmailFallback: typeof rdgNormalizeEmail_448 === 'function',
    rdgErrorMessageFallback: typeof rdgErrorMessage_447 === 'function',
    rdgSuccessFallback: typeof rdgSuccess_447 === 'function',
    rdgErrorFallback: typeof rdgError_447 === 'function'
  };
  console.log('RDG SERVER COMPATIBILITY 4.4.10');
  console.log(JSON.stringify(result, null, 2));
  return result;
}


/* =========================================================
 * v4.4.12 RUNTIME DEPENDENCY DIAGNOSTIC
 * ========================================================= */
function testRDGServerUtilityRuntime412() {
  var result = {
    marker: RDG_SERVER_RUNTIME_MARKER_412,
    version: RDG_SERVER_VERSION,
    bareUtilities: {
      rdgSafeString: typeof rdgSafeString === 'function',
      rdgIsPlainObject: typeof rdgIsPlainObject === 'function',
      rdgDeepClone: typeof rdgDeepClone === 'function',
      rdgEnsureArray: typeof rdgEnsureArray === 'function',
      rdgToNumber: typeof rdgToNumber === 'function',
      rdgNormalizeCode: typeof rdgNormalizeCode === 'function',
      rdgNormalizeObject: typeof rdgNormalizeObject === 'function',
      rdgPaginate: typeof rdgPaginate === 'function',
      rdgSortRecords: typeof rdgSortRecords === 'function',
      rdgValidateRequiredFields: typeof rdgValidateRequiredFields === 'function',
      rdgGetConfigValue: typeof rdgGetConfigValue === 'function',
      rdgBuildId: typeof rdgBuildId === 'function',
      rdgNormalizeExistingIndex: typeof rdgNormalizeExistingIndex === 'function'
    },
    adapters: {
      rdgSafeString: typeof rdgSafeString_412 === 'function',
      rdgIsPlainObject: typeof rdgIsPlainObject_412 === 'function',
      rdgDeepClone: typeof rdgDeepClone_412 === 'function',
      rdgEnsureArray: typeof rdgEnsureArray_412 === 'function',
      rdgToNumber: typeof rdgToNumber_412 === 'function',
      rdgNormalizeCode: typeof rdgNormalizeCode_412 === 'function',
      rdgNormalizeObject: typeof rdgNormalizeObject_412 === 'function',
      rdgPaginate: typeof rdgPaginate_412 === 'function',
      rdgSortRecords: typeof rdgSortRecords_412 === 'function',
      rdgValidateRequiredFields: typeof rdgValidateRequiredFields_412 === 'function',
      rdgGetConfigValue: typeof rdgGetConfigValue_412 === 'function',
      rdgBuildId: typeof rdgBuildId_412 === 'function',
      rdgNormalizeExistingIndex: typeof rdgNormalizeExistingIndex_412 === 'function'
    }
  };
  result.pass = Object.keys(result.adapters).every(function(k){ return result.adapters[k] === true; });
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}


function testRDGServerCombinedDiagnostics413() {
  var nested = testRDGNestedBusinessSuite();
  var permission = testRDGPermissionRuntimeDiagnosis();
  var runtime = {
    serverVersion: typeof RDG_SERVER_VERSION !== 'undefined' ? String(RDG_SERVER_VERSION) : 'MISSING',
    runtimeMarker: typeof RDG_SERVER_RUNTIME_MARKER_412 !== 'undefined' ? String(RDG_SERVER_RUNTIME_MARKER_412) : 'MISSING',
    rdgApi: typeof rdgApi === 'function',
    apiRequest: typeof apiRequest === 'function',
    createRecord: typeof createRecord === 'function',
    getRecord: typeof getRecord === 'function',
    findRecords: typeof findRecords === 'function',
    updateRecord: typeof updateRecord === 'function',
    deleteRecord: typeof deleteRecord === 'function',
    createRDGGameRoom: typeof createRDGGameRoom === 'function',
    joinRDGGameRoom: typeof joinRDGGameRoom === 'function'
  };
  runtime.identityPass = runtime.serverVersion === '4.4.13' && runtime.runtimeMarker === 'RDG_SERVER_RUNTIME_4.4.13';
  runtime.authorityPass = runtime.rdgApi && runtime.apiRequest && runtime.createRecord && runtime.getRecord && runtime.findRecords && runtime.updateRecord && runtime.deleteRecord && runtime.createRDGGameRoom && runtime.joinRDGGameRoom;
  var result = {success: nested.success && permission.overallPass && runtime.identityPass && runtime.authorityPass, serverVersion: runtime.serverVersion, nested: nested, permission: permission, runtime: runtime, timestamp: rdgNowIso()};
  Logger.log('========================================');
  Logger.log('RDG SERVER COMBINED DIAGNOSTICS 4.4.13');
  Logger.log('========================================');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log(result.success ? 'RDG COMBINED DIAGNOSTICS: PASS' : 'RDG COMBINED DIAGNOSTICS: REVIEW');
  return result;
}
