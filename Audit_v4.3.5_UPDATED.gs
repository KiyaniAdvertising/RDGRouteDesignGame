/*
 * Audit.gs
 * Universal Audit Log System
 * Version: 4.3.5
 * Module: UNIVERSAL_AUDIT
 * File No: 1
 *
 * Production rules:
 * - AUDIT_LOGS never audits itself.
 * - Audit writer uses direct append to avoid CRUD recursion.
 * - Existing header order is preserved; missing headers are appended.
 * - Sensitive values are redacted before persistence.
 * - Audit reads are authorization-aware when a compatible server/user
 *   security layer is available; unknown company scope is fail-closed.
 * - Legacy public APIs are preserved.
 */

const AUDIT_CONFIG = {
  VERSION: '4.3.5',
  MODULE: 'UNIVERSAL_AUDIT',
  TABLE_KEY: 'AUDIT_LOGS',
  HEADER_ROW: 3,
  DATA_START_ROW: 4,
  DEFAULT_USER_ID: 'SYSTEM',
  DEFAULT_SYSTEM_USER_ID: 'RDSYSTEM',
  DEFAULT_SYSTEM_ROLE: 'SYSTEM',
  ACTIONS: ['CREATE', 'UPDATE', 'DELETE'],
  RESULTS: ['SUCCESS', 'FAILED', 'SKIPPED', 'REJECTED'],
  SOURCES: ['DATABASE', 'SERVER', 'API', 'AUTH', 'ERP', 'WALLET', 'GAME', 'CHAT', 'SYSTEM', 'TEST', 'OTHER'],
  MAX_STATE_LENGTH: 42000,
  MAX_METADATA_LENGTH: 12000,
  MAX_STRING_LENGTH: 4000,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 25,
  MAX_SCAN_ROWS: 10000,
  LOCK_TIMEOUT_MS: 15000,
  IDEMPOTENCY_SCAN_LIMIT: 5000,
  AUTH_READ_REQUIRED: true,
  REDACTION_ENABLED: true,
  COMPANY_ISOLATION_ENABLED: true
};

const AUDIT_HEADERS = [
  'ID', 'Action', 'Table', 'Record ID', 'User ID', 'Timestamp',
  'Before State', 'After State', 'Created At', 'Updated At',
  'Company ID', 'Request ID', 'Operation ID', 'Source', 'Result',
  'Reason', 'Metadata JSON'
];

const AUDIT_SENSITIVE_KEYS_4334 = [
  'password', 'passwordhash', 'password_hash', 'passcode',
  'otp', 'otpcode', 'otp_code', 'otptoken', 'otp_token',
  'token', 'accesstoken', 'access_token', 'refreshtoken', 'refresh_token',
  'sessiontoken', 'session_token', 'authorization', 'auth', 'secret',
  'apikey', 'api_key', 'privatekey', 'private_key', 'clientsecret',
  'client_secret', 'credential', 'credentials', 'cardnumber', 'card_number',
  'cvv', 'cvc', 'pin', 'securitycode', 'security_code', 'walletsecret',
  'paymenttoken', 'payment_token'
];

function audit4334String_(value) {
  return String(value === null || value === undefined ? '' : value).trim();
}

function audit4334Upper_(value) {
  return audit4334String_(value).toUpperCase();
}

function audit4334Now_() {
  return new Date();
}

function audit4334HasFunction_(name) {
  try { return typeof globalThis[name] === 'function'; } catch (e) { return false; }
}

function audit4334SafeError_(error) {
  return audit4334String_(error && error.message ? error.message : error).substring(0, AUDIT_CONFIG.MAX_STRING_LENGTH);
}

function audit4334NormalizeAction_(action) {
  const value = audit4334Upper_(action);
  if (!value) throw new Error('Audit action is required.');
  if (AUDIT_CONFIG.ACTIONS.indexOf(value) === -1) throw new Error('Invalid audit action: ' + value);
  return value;
}

function audit4334NormalizeTable_(tableKey) {
  const value = audit4334Upper_(tableKey);
  if (!value) throw new Error('Audit table key is required.');
  return value;
}

function audit4334NormalizeUser_(userId) {
  return audit4334String_(userId) || AUDIT_CONFIG.DEFAULT_USER_ID;
}

function audit4334NormalizeOptional_(value, max) {
  return audit4334String_(value).substring(0, max || AUDIT_CONFIG.MAX_STRING_LENGTH);
}

function audit4334IsObject_(value) {
  return value !== null && typeof value === 'object';
}

function audit4334Key_(key) {
  return audit4334Upper_(key).replace(/[^A-Z0-9]/g, '');
}

function audit4334IsSensitiveKey_(key) {
  const normalized = audit4334Key_(key);
  return AUDIT_SENSITIVE_KEYS_4334.some(function(item) {
    return normalized === audit4334Key_(item);
  });
}

function audit4334RedactValue_(value, depth) {
  depth = depth || 0;
  if (depth > 12) return '[MAX_DEPTH]';
  if (value === null || value === undefined) return value;
  if (Object.prototype.toString.call(value) === '[object Date]') return value;
  if (typeof value === 'string') {
    return value.length > AUDIT_CONFIG.MAX_STRING_LENGTH
      ? value.substring(0, AUDIT_CONFIG.MAX_STRING_LENGTH) + '...[TRUNCATED]'
      : value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.slice(0, 200).map(function(item) {
      return audit4334RedactValue_(item, depth + 1);
    });
  }
  const out = {};
  Object.keys(value).slice(0, 300).forEach(function(key) {
    if (audit4334IsSensitiveKey_(key)) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = audit4334RedactValue_(value[key], depth + 1);
    }
  });
  return out;
}

function redactAuditSecrets_(value) {
  if (!AUDIT_CONFIG.REDACTION_ENABLED) return value;
  return audit4334RedactValue_(value, 0);
}

function sanitizeAuditState_(value) {
  return redactAuditSecrets_(value);
}

function audit4334Serialize_(value, maxLength) {
  if (value === null || value === undefined) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return value;
  const safe = sanitizeAuditState_(value);
  let json;
  try {
    json = audit4334IsObject_(safe) ? JSON.stringify(safe) : String(safe);
  } catch (e) {
    json = '[UNSERIALIZABLE]';
  }
  const limit = maxLength || AUDIT_CONFIG.MAX_STATE_LENGTH;
  if (json.length <= limit) return json;
  return JSON.stringify({
    truncated: true,
    originalLength: json.length,
    value: json.substring(0, Math.max(0, limit - 120)),
    marker: '[TRUNCATED]'
  });
}

function parseAuditData_(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch (e) { return value; }
}

function serializeAuditData_(data) {
  return audit4334Serialize_(data, AUDIT_CONFIG.MAX_STATE_LENGTH);
}

function normalizeAuditRecord_(log) {
  if (!log) return log;
  const record = Object.assign({}, log);
  ['Before State', 'After State'].forEach(function(key) {
    if (record[key] !== undefined) record[key] = parseAuditData_(record[key]);
  });
  if (record['Metadata JSON'] !== undefined) record['Metadata JSON'] = parseAuditData_(record['Metadata JSON']);
  return record;
}

function audit4334ResolveTableName_() {
  const candidates = [
    function() {
      if (typeof AUDIT_CONFIG === 'undefined') return null;
      return null;
    },
    function() {
      if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.TABLES) {
        return APP_CONFIG.TABLES[AUDIT_CONFIG.TABLE_KEY] || APP_CONFIG.TABLES.AUDIT_LOGS;
      }
      return null;
    },
    function() {
      if (typeof RDG_CONFIG !== 'undefined' && RDG_CONFIG.TABLES) {
        return RDG_CONFIG.TABLES[AUDIT_CONFIG.TABLE_KEY] || RDG_CONFIG.TABLES.AUDIT_LOGS;
      }
      return null;
    }
  ];
  for (let i = 0; i < candidates.length; i++) {
    try { const v = candidates[i](); if (v) return v; } catch (e) {}
  }
  return null;
}

function getAuditSheet_() {
  if (audit4334HasFunction_('getDatabaseSheet')) {
    const sheet = getDatabaseSheet(AUDIT_CONFIG.TABLE_KEY);
    if (sheet) return sheet;
    const physical = audit4334ResolveTableName_();
    if (physical) {
      try {
        const sheet2 = getDatabaseSheet(physical);
        if (sheet2) return sheet2;
      } catch (e) {}
    }
  }
  if (audit4334HasFunction_('rdgGetSpreadsheet')) {
    const ss = rdgGetSpreadsheet();
    const physicalName = audit4334ResolveTableName_() || AUDIT_CONFIG.TABLE_KEY;
    const s = ss && ss.getSheetByName(physicalName);
    if (s) return s;
  }
  if (audit4334HasFunction_('getDatabaseSpreadsheet')) {
    const ss2 = getDatabaseSpreadsheet();
    const physicalName2 = audit4334ResolveTableName_() || AUDIT_CONFIG.TABLE_KEY;
    const s2 = ss2 && ss2.getSheetByName(physicalName2);
    if (s2) return s2;
  }
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    const physicalName3 = audit4334ResolveTableName_() || AUDIT_CONFIG.TABLE_KEY;
    const s3 = active && active.getSheetByName(physicalName3);
    if (s3) return s3;
  } catch (e) {}
  throw new Error('AuditLogs sheet does not exist or database spreadsheet cannot be resolved.');
}

function getAuditHeaders_() {
  const sheet = getAuditSheet_();
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  if (lastColumn < 1) return [];
  return sheet.getRange(AUDIT_CONFIG.HEADER_ROW, 1, 1, lastColumn).getValues()[0].map(function(v) {
    return audit4334String_(v);
  });
}

function ensureAuditSchema() {
  const sheet = getAuditSheet_();
  const row = AUDIT_CONFIG.HEADER_ROW;
  let lastColumn = Math.max(sheet.getLastColumn(), AUDIT_HEADERS.length, 1);
  let headers = sheet.getRange(row, 1, 1, lastColumn).getValues()[0].map(function(v) { return audit4334String_(v); });
  while (headers.length && !headers[headers.length - 1]) headers.pop();
  const map = {};
  headers.forEach(function(h, i) { if (h) map[h] = i + 1; });
  AUDIT_HEADERS.forEach(function(header) {
    if (!map[header]) {
      const col = sheet.getLastColumn() + 1;
      sheet.getRange(row, col).setValue(header);
      map[header] = col;
    }
  });
  return { success: true, table: AUDIT_CONFIG.TABLE_KEY, version: AUDIT_CONFIG.VERSION, headerRow: row, headers: getAuditHeaders_() };
}

function audit4334GetCurrentUser_() {
  if (audit4334HasFunction_('getCurrentServerUser_')) {
    try { const u = getCurrentServerUser_(); if (u) return u; } catch (e) {}
  }
  if (audit4334HasFunction_('getCurrentUser')) {
    try { const u2 = getCurrentUser(); if (u2) return u2; } catch (e) {}
  }
  try {
    const email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
    return email ? { id: email, userId: email, email: email } : null;
  } catch (e) { return null; }
}

function audit4334UserId_(user) {
  if (!user) return '';
  return audit4334String_(user.id || user.userId || user.ID || user['User ID'] || user.email || user.Email);
}

function audit4334Role_(user) {
  if (!user) return '';
  return audit4334Upper_(user.role || user.Role || user.roleName || user['Role']);
}

function audit4334CompanyId_(user) {
  if (!user) return '';
  const candidates = [user.companyId, user.companyID, user['Company ID'], user.company, user.Company];
  for (let i = 0; i < candidates.length; i++) {
    const v = audit4334String_(candidates[i]);
    if (v) return v;
  }
  if (audit4334HasFunction_('getCurrentServerCompany_')) {
    try {
      const c = getCurrentServerCompany_();
      if (c) return audit4334String_(c.id || c.ID || c.companyId || c['Company ID']);
    } catch (e) {}
  }
  return '';
}

function audit4334IsSystemUser_(user) {
  if (!user) return false;
  const id = audit4334Upper_(audit4334UserId_(user));
  const role = audit4334Role_(user);
  return id === audit4334Upper_(AUDIT_CONFIG.DEFAULT_SYSTEM_USER_ID) ||
         role === audit4334Upper_(AUDIT_CONFIG.DEFAULT_SYSTEM_ROLE) ||
         role === 'SUPER_ADMIN' || role === 'SUPERADMIN';
}

function audit4334Permission_(user, permission) {
  if (!user) return false;
  if (audit4334IsSystemUser_(user)) return true;
  const wanted = audit4334Upper_(permission);
  const lists = [user.permissions, user.permission, user.Permissions, user['Permissions']];
  for (let i = 0; i < lists.length; i++) {
    const list = lists[i];
    if (!list) continue;
    const arr = Array.isArray(list) ? list : String(list).split(',');
    if (arr.some(function(p) {
      const x = audit4334Upper_(p);
      return x === '*' || x === wanted || x === 'AUDIT_READ' || x === 'READ:AUDIT_LOGS' || x === 'READ:AUDIT';
    })) return true;
  }
  if (audit4334HasFunction_('hasServerPermission_')) {
    try { if (hasServerPermission_(user, 'READ', AUDIT_CONFIG.TABLE_KEY)) return true; } catch (e) {}
  }
  const role = audit4334Role_(user);
  return ['ADMIN', 'AUDITOR', 'SYSTEM', 'SUPER_ADMIN', 'SUPERADMIN'].indexOf(role) !== -1;
}

function authorizeAuditRead_(options) {
  options = options || {};
  const user = audit4334GetCurrentUser_();
  if (!user) throw new Error('Permission denied: authenticated audit read is required.');
  if (!audit4334Permission_(user, 'AUDIT_READ')) throw new Error('Permission denied: audit read access is required.');
  return true;
}

function audit4334ExtractCompanyId_(record) {
  if (!record) return '';
  const direct = [record['Company ID'], record.companyId, record.companyID, record.Company, record.company];
  for (let i = 0; i < direct.length; i++) { const v = audit4334String_(direct[i]); if (v) return v; }
  const states = [record['After State'], record['Before State']];
  for (let j = 0; j < states.length; j++) {
    let state = states[j];
    if (typeof state === 'string') state = parseAuditData_(state);
    if (!state || typeof state !== 'object') continue;
    const vals = [state.companyId, state.companyID, state['Company ID'], state.company, state.Company];
    for (let k = 0; k < vals.length; k++) { const v2 = audit4334String_(vals[k]); if (v2) return v2; }
  }
  return '';
}

function audit4334RecordInCompany_(record, companyId) {
  const expected = audit4334String_(companyId);
  if (!expected) return false;
  return audit4334ExtractCompanyId_(record) === expected;
}

function getAuditCompanyScope_(user, options) {
  options = options || {};
  if (audit4334IsSystemUser_(user) && options.allCompanies === true) return { allCompanies: true, companyId: '' };
  const companyId = audit4334CompanyId_(user);
  if (!companyId && AUDIT_CONFIG.COMPANY_ISOLATION_ENABLED) return { allCompanies: false, companyId: '', unknown: true };
  return { allCompanies: false, companyId: companyId };
}

function audit4334FilterCompany_(rows, user, options) {
  const scope = getAuditCompanyScope_(user, options);
  if (scope.allCompanies) return rows;
  if (scope.unknown && AUDIT_CONFIG.COMPANY_ISOLATION_ENABLED) return [];
  if (!AUDIT_CONFIG.COMPANY_ISOLATION_ENABLED || !scope.companyId) return rows;
  return rows.filter(function(row) { return audit4334RecordInCompany_(row, scope.companyId); });
}

function audit4334SortNewest_(rows) {
  return rows.slice().sort(function(a, b) {
    const at = new Date(a.Timestamp || a['Created At'] || 0).getTime() || 0;
    const bt = new Date(b.Timestamp || b['Created At'] || 0).getTime() || 0;
    return bt - at;
  });
}

function audit4334Paginate_(rows, page, pageSize) {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.min(AUDIT_CONFIG.MAX_PAGE_SIZE, Math.max(1, Number(pageSize) || AUDIT_CONFIG.DEFAULT_PAGE_SIZE));
  const total = rows.length;
  const totalPages = total ? Math.ceil(total / size) : 0;
  const start = (p - 1) * size;
  return {
    data: rows.slice(start, start + size),
    pagination: { page: p, pageSize: size, total: total, totalPages: totalPages, hasNextPage: start + size < total, hasPreviousPage: p > 1 }
  };
}

function audit4334ReadAllRaw_() {
  const sheet = getAuditSheet_();
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < AUDIT_CONFIG.DATA_START_ROW || lastColumn < 1) return [];
  const count = Math.min(lastRow - AUDIT_CONFIG.HEADER_ROW, AUDIT_CONFIG.MAX_SCAN_ROWS);
  if (count <= 0) return [];
  const headers = getAuditHeaders_();
  const values = sheet.getRange(AUDIT_CONFIG.DATA_START_ROW, 1, count, lastColumn).getValues();
  return values.map(function(row) {
    const obj = {};
    headers.forEach(function(header, i) { if (header) obj[header] = row[i]; });
    return normalizeAuditRecord_(obj);
  });
}

function audit4334Read_(filters, options) {
  options = options || {};
  authorizeAuditRead_(options);
  const user = audit4334GetCurrentUser_();
  let rows = audit4334ReadAllRaw_();
  filters = filters || {};
  rows = rows.filter(function(row) {
    if (filters.action && audit4334Upper_(row.Action) !== audit4334Upper_(filters.action)) return false;
    if (filters.tableKey && audit4334Upper_(row.Table) !== audit4334Upper_(filters.tableKey)) return false;
    if (filters.recordId && audit4334String_(row['Record ID']) !== audit4334String_(filters.recordId)) return false;
    if (filters.userId && audit4334String_(row['User ID']) !== audit4334String_(filters.userId)) return false;
    if (filters.companyId && audit4334ExtractCompanyId_(row) !== audit4334String_(filters.companyId)) return false;
    if (filters.operationId && audit4334String_(row['Operation ID']) !== audit4334String_(filters.operationId)) return false;
    if (filters.requestId && audit4334String_(row['Request ID']) !== audit4334String_(filters.requestId)) return false;
    if (filters.source && audit4334Upper_(row.Source) !== audit4334Upper_(filters.source)) return false;
    return true;
  });
  rows = audit4334FilterCompany_(rows, user, options);
  rows = audit4334SortNewest_(rows);
  const paged = audit4334Paginate_(rows, options.page, options.pageSize);
  return { success: true, service: AUDIT_CONFIG.MODULE, version: AUDIT_CONFIG.VERSION, table: AUDIT_CONFIG.TABLE_KEY, data: paged.data, pagination: paged.pagination };
}

function audit4334WithLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(AUDIT_CONFIG.LOCK_TIMEOUT_MS);
  try { return fn(); } finally { lock.releaseLock(); }
}

function generateAuditEventId_() {
  if (audit4334HasFunction_('generateTableId')) {
    try { return generateTableId(AUDIT_CONFIG.TABLE_KEY); } catch (e) {}
  }
  return 'AUD-' + Utilities.getUuid().replace(/-/g, '').substring(0, 20).toUpperCase();
}

function audit4334FindById_(sheet, headers, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < AUDIT_CONFIG.DATA_START_ROW) return null;
  const idCol = headers.indexOf('ID') + 1;
  if (!idCol) return null;
  const count = Math.min(lastRow - AUDIT_CONFIG.HEADER_ROW, AUDIT_CONFIG.IDEMPOTENCY_SCAN_LIMIT);
  const values = sheet.getRange(AUDIT_CONFIG.DATA_START_ROW, idCol, count, 1).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (audit4334String_(values[i][0]) === audit4334String_(id)) {
      const rowNumber = AUDIT_CONFIG.DATA_START_ROW + i;
      const row = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
      const obj = {};
      headers.forEach(function(h, j) { if (h) obj[h] = row[j]; });
      return normalizeAuditRecord_(obj);
    }
  }
  return null;
}

function checkAuditIdempotency_(operationId, requestId) {
  const op = audit4334String_(operationId);
  const req = audit4334String_(requestId);
  if (!op && !req) return null;
  const rows = audit4334ReadAllRaw_();
  for (let i = 0; i < rows.length; i++) {
    if (op && audit4334String_(rows[i]['Operation ID']) === op) return rows[i];
    if (req && audit4334String_(rows[i]['Request ID']) === req) return rows[i];
  }
  return null;
}

function validateAuditEvent_(event) {
  if (!event || typeof event !== 'object') throw new Error('Audit event payload is required.');
  const action = audit4334NormalizeAction_(event.action);
  const tableKey = audit4334NormalizeTable_(event.tableKey);
  const recordId = audit4334String_(event.recordId);
  if (!recordId) throw new Error('Audit record ID is required.');
  return { action: action, tableKey: tableKey, recordId: recordId };
}

function audit4334Create_(event) {
  const valid = validateAuditEvent_(event);
  if (valid.tableKey === AUDIT_CONFIG.TABLE_KEY) return { success: true, skipped: true, table: AUDIT_CONFIG.TABLE_KEY, message: 'Audit logging skipped for AUDIT_LOGS table.' };
  const userId = audit4334NormalizeUser_(event.userId);
  const companyId = audit4334NormalizeOptional_(event.companyId);
  const requestId = audit4334NormalizeOptional_(event.requestId);
  const operationId = audit4334NormalizeOptional_(event.operationId);
  const source = audit4334Upper_(event.source || 'DATABASE');
  const result = audit4334Upper_(event.result || 'SUCCESS');
  const reason = audit4334NormalizeOptional_(event.reason);
  if (source && AUDIT_CONFIG.SOURCES.indexOf(source) === -1) throw new Error('Invalid audit source: ' + source);
  if (result && AUDIT_CONFIG.RESULTS.indexOf(result) === -1) throw new Error('Invalid audit result: ' + result);
  const metadata = event.metadata === undefined ? '' : audit4334Serialize_(event.metadata, AUDIT_CONFIG.MAX_METADATA_LENGTH);
  const now = audit4334Now_();
  const auditRecord = {
    ID: event.id || generateAuditEventId_(),
    Action: valid.action,
    Table: valid.tableKey,
    'Record ID': valid.recordId,
    'User ID': userId,
    Timestamp: now,
    'Before State': serializeAuditData_(event.beforeState),
    'After State': serializeAuditData_(event.afterState),
    'Created At': now,
    'Updated At': now,
    'Company ID': companyId,
    'Request ID': requestId,
    'Operation ID': operationId,
    Source: source || 'DATABASE',
    Result: result || 'SUCCESS',
    Reason: reason,
    'Metadata JSON': metadata
  };
  return auditRecord;
}

function createAuditLog(action, tableKey, recordId, userId, beforeState, afterState, options) {
  options = options || {};
  let event;
  try {
    event = {
      action: action,
      tableKey: tableKey,
      recordId: recordId,
      userId: userId,
      beforeState: beforeState,
      afterState: afterState,
      companyId: options.companyId || audit4334ExtractCompanyId_({ 'After State': afterState }) || audit4334ExtractCompanyId_({ 'Before State': beforeState }),
      requestId: options.requestId,
      operationId: options.operationId,
      source: options.source || 'DATABASE',
      result: options.result || 'SUCCESS',
      reason: options.reason,
      metadata: options.metadata
    };
    const normalized = audit4334NormalizeTable_(tableKey);
    if (normalized === AUDIT_CONFIG.TABLE_KEY) return { success: true, skipped: true, table: AUDIT_CONFIG.TABLE_KEY, message: 'Audit logging skipped for AUDIT_LOGS table.' };
  } catch (e) {
    Logger.log('Audit validation error: ' + audit4334SafeError_(e));
    return { success: false, table: AUDIT_CONFIG.TABLE_KEY, message: audit4334SafeError_(e) };
  }
  try {
    return audit4334WithLock_(function() {
      ensureAuditSchema();
      const sheet = getAuditSheet_();
      const headers = getAuditHeaders_();
      if (!headers.length) throw new Error('No headers found for AUDIT_LOGS table.');
      const existing = checkAuditIdempotency_(event.operationId, event.requestId);
      if (existing) return { success: true, idempotent: true, table: AUDIT_CONFIG.TABLE_KEY, data: existing };
      const record = audit4334Create_(event);
      const row = headers.map(function(header) { return record[header] !== undefined ? record[header] : ''; });
      sheet.appendRow(row);
      return { success: true, skipped: false, table: AUDIT_CONFIG.TABLE_KEY, version: AUDIT_CONFIG.VERSION, message: 'Audit log created successfully.', data: record };
    });
  } catch (error) {
    Logger.log('Audit Log Error: ' + audit4334SafeError_(error));
    return { success: false, table: AUDIT_CONFIG.TABLE_KEY, version: AUDIT_CONFIG.VERSION, message: audit4334SafeError_(error) };
  }
}

function getAuditLogs(options) {
  return audit4334Read_({}, options || {});
}

function getAuditLogsPage(page, pageSize, options) {
  options = Object.assign({}, options || {}, { page: page, pageSize: pageSize });
  return audit4334Read_({}, options);
}

function getRecordAuditLogs(tableKey, recordId, options) {
  options = Object.assign({}, options || {}, { page: 1, pageSize: AUDIT_CONFIG.MAX_PAGE_SIZE });
  return audit4334Read_({ tableKey: tableKey, recordId: recordId }, options);
}

function getUserAuditLogs(userId, options) {
  const id = audit4334String_(userId);
  if (!id) throw new Error('User ID is required.');
  options = Object.assign({}, options || {}, { page: 1, pageSize: AUDIT_CONFIG.MAX_PAGE_SIZE });
  return audit4334Read_({ userId: id }, options);
}

function getAllAuditLogs(options) {
  options = options || {};
  if (options.page || options.pageSize || options.filters) {
    return audit4334Read_(options.filters || {}, options);
  }
  return audit4334Read_({}, { page: 1, pageSize: AUDIT_CONFIG.MAX_PAGE_SIZE, allCompanies: options.allCompanies });
}

function countAuditLogs(options) {
  options = options || {};
  const result = audit4334Read_(options.filters || {}, Object.assign({}, options, { page: 1, pageSize: AUDIT_CONFIG.MAX_PAGE_SIZE }));
  return { success: true, count: result.pagination.total, table: AUDIT_CONFIG.TABLE_KEY };
}

function getAuditLogsByAction(action, options) {
  const normalized = audit4334NormalizeAction_(action);
  return audit4334Read_({ action: normalized }, options || {});
}

function getAuditLogsByTable(tableKey, options) {
  return audit4334Read_({ tableKey: tableKey }, options || {});
}

function getAuditHistory(tableKey, recordId, options) {
  return getRecordAuditLogs(tableKey, recordId, options || {});
}

function getLatestRecordAuditLog(tableKey, recordId, options) {
  const result = getRecordAuditLogs(tableKey, recordId, Object.assign({}, options || {}, { page: 1, pageSize: 1 }));
  return { success: result.success, table: AUDIT_CONFIG.TABLE_KEY, data: result.data && result.data.length ? result.data[0] : null, pagination: result.pagination };
}

function getAuditInfo() {
  return {
    success: true,
    module: AUDIT_CONFIG.MODULE,
    version: AUDIT_CONFIG.VERSION,
    table: AUDIT_CONFIG.TABLE_KEY,
    headerRow: AUDIT_CONFIG.HEADER_ROW,
    dataStartRow: AUDIT_CONFIG.DATA_START_ROW,
    headers: AUDIT_HEADERS.slice(),
    actions: AUDIT_CONFIG.ACTIONS.slice(),
    recursiveAudit: false,
    immutable: true,
    redactionEnabled: AUDIT_CONFIG.REDACTION_ENABLED,
    authorizationRequired: AUDIT_CONFIG.AUTH_READ_REQUIRED,
    companyIsolation: AUDIT_CONFIG.COMPANY_ISOLATION_ENABLED,
    pagination: true,
    idempotency: true
  };
}

function getAuditHealth() {
  try {
    const schema = ensureAuditSchema();
    const headers = schema.headers || [];
    const missing = AUDIT_HEADERS.filter(function(h) { return headers.indexOf(h) === -1; });
    let count = null;
    try {
      const sheet = getAuditSheet_();
      count = Math.max(0, sheet.getLastRow() - AUDIT_CONFIG.HEADER_ROW);
    } catch (e) {}
    return {
      success: missing.length === 0,
      module: AUDIT_CONFIG.MODULE,
      version: AUDIT_CONFIG.VERSION,
      table: AUDIT_CONFIG.TABLE_KEY,
      headerRow: AUDIT_CONFIG.HEADER_ROW,
      headerCount: headers.length,
      requiredHeaderCount: AUDIT_HEADERS.length,
      missingHeaders: missing,
      recordCount: count,
      dependencies: {
        databaseSheet: audit4334HasFunction_('getDatabaseSheet'),
        databaseCrud: audit4334HasFunction_('createRecord') && audit4334HasFunction_('findRecords'),
        idGenerator: audit4334HasFunction_('generateTableId'),
        serverAuthorization: audit4334HasFunction_('authorizeServerOperation_'),
        serverUser: audit4334HasFunction_('getCurrentServerUser_')
      }
    };
  } catch (error) {
    return { success: false, module: AUDIT_CONFIG.MODULE, version: AUDIT_CONFIG.VERSION, table: AUDIT_CONFIG.TABLE_KEY, message: audit4334SafeError_(error) };
  }
}

function getAuditStats(options) {
  const result = audit4334Read_(options && options.filters ? options.filters : {}, Object.assign({}, options || {}, { page: 1, pageSize: AUDIT_CONFIG.MAX_PAGE_SIZE }));
  const rows = result.data || [];
  const stats = { total: result.pagination.total, byAction: {}, byTable: {}, byResult: {}, bySource: {} };
  rows.forEach(function(r) {
    ['byAction', 'byTable', 'byResult', 'bySource'].forEach(function(group) {
      let key = '';
      if (group === 'byAction') key = audit4334Upper_(r.Action) || 'UNKNOWN';
      if (group === 'byTable') key = audit4334Upper_(r.Table) || 'UNKNOWN';
      if (group === 'byResult') key = audit4334Upper_(r.Result) || 'UNKNOWN';
      if (group === 'bySource') key = audit4334Upper_(r.Source) || 'UNKNOWN';
      stats[group][key] = (stats[group][key] || 0) + 1;
    });
  });
  return { success: true, table: AUDIT_CONFIG.TABLE_KEY, stats: stats, sampledRows: rows.length };
}

function getAuditDependencies() {
  return {
    success: true,
    version: AUDIT_CONFIG.VERSION,
    dependencies: {
      getDatabaseSheet: audit4334HasFunction_('getDatabaseSheet'),
      getDatabaseSpreadsheet: audit4334HasFunction_('getDatabaseSpreadsheet'),
      rdgGetSpreadsheet: audit4334HasFunction_('rdgGetSpreadsheet'),
      createRecord: audit4334HasFunction_('createRecord'),
      findRecords: audit4334HasFunction_('findRecords'),
      countRecords: audit4334HasFunction_('countRecords'),
      generateTableId: audit4334HasFunction_('generateTableId'),
      getCurrentServerUser_: audit4334HasFunction_('getCurrentServerUser_'),
      authorizeServerOperation_: audit4334HasFunction_('authorizeServerOperation_'),
      RDEconomyCurrency: audit4334HasFunction_('normalizeGamingCurrency')
    }
  };
}

function deleteAuditLog() {
  throw new Error('Audit logs are immutable and cannot be deleted.');
}

function updateAuditLog() {
  throw new Error('Audit logs are immutable and cannot be updated.');
}

function createAuditLogFromService() {
  throw new Error('AuditLogs service is read-only. Use Audit.gs createAuditLog() for the immutable audit writer.');
}

function testAuditSchema() {
  try { const r = ensureAuditSchema(); Logger.log(JSON.stringify(r, null, 2)); return r; }
  catch (e) { return { success: false, test: 'Schema', error: audit4334SafeError_(e) }; }
}

function testAuditInfo() {
  const r = getAuditInfo(); Logger.log(JSON.stringify(r, null, 2)); return r;
}

function testAuditHealth() {
  const r = getAuditHealth(); Logger.log(JSON.stringify(r, null, 2)); return r;
}

function testCreateAuditLog() {
  const referenceId = 'AUDIT-TEST-' + Utilities.getUuid().replace(/-/g, '').substring(0, 12).toUpperCase();
  const r = createAuditLog('CREATE', 'SYSTEM_TEST', referenceId, 'SYSTEM', null, { test: true, referenceId: referenceId, version: AUDIT_CONFIG.VERSION }, {
    source: 'TEST', reason: 'Audit module test', operationId: 'TEST-' + referenceId, metadata: { test: true }
  });
  Logger.log(JSON.stringify(r, null, 2)); return r;
}

function testGetAllAuditLogs() {
  const r = getAllAuditLogs({ allCompanies: true }); Logger.log(JSON.stringify(r, null, 2)); return r;
}

function testAuditRecursionProtection() {
  const r = createAuditLog('CREATE', 'AUDIT_LOGS', 'RECURSION-TEST', 'SYSTEM', null, { test: true });
  const out = { success: !!(r && r.success === true && r.skipped === true), test: 'Audit recursion protection', result: r };
  Logger.log(JSON.stringify(out, null, 2)); return out;
}

function testAuditSecurity() {
  const sample = { password: 'secret', OTP: '123456', token: 'abc', safe: 'ok', nested: { apiKey: 'hidden', name: 'test' } };
  const redacted = redactAuditSecrets_(sample);
  const passed = redacted.password === '[REDACTED]' && redacted.OTP === '[REDACTED]' && redacted.token === '[REDACTED]' && redacted.nested.apiKey === '[REDACTED]' && redacted.nested.name === 'test';
  return { success: passed, test: 'Audit secret redaction', redacted: redacted };
}

function testAuditRedaction() { return testAuditSecurity(); }

function testAuditPagination() {
  try {
    const r = audit4334Paginate_([1,2,3,4,5], 2, 2);
    return { success: r.pagination.page === 2 && r.data.length === 2 && r.pagination.hasPreviousPage && r.pagination.hasNextPage, test: 'Audit pagination', result: r };
  } catch (e) { return { success: false, test: 'Audit pagination', error: audit4334SafeError_(e) }; }
}

function testAuditIdempotency() {
  try {
    const r = createAuditLog('CREATE', 'SYSTEM_TEST', 'IDEMPOTENCY-' + Utilities.getUuid().substring(0, 8), 'SYSTEM', null, { test: true }, { source: 'TEST', operationId: 'IDEMPOTENCY-TEST-' + Utilities.getUuid() });
    return { success: !!(r && r.success), test: 'Audit idempotency contract', result: r };
  } catch (e) { return { success: false, test: 'Audit idempotency contract', error: audit4334SafeError_(e) }; }
}

function testAuditCompanyIsolation() {
  const rows = [{ 'Company ID': 'C1' }, { 'Company ID': 'C2' }, { 'Company ID': '' }];
  const filtered = rows.filter(function(r) { return audit4334RecordInCompany_(r, 'C1'); });
  return { success: filtered.length === 1, test: 'Audit company isolation', count: filtered.length };
}

function testAuditFullSuiteAdvanced4334() {
  const tests = [
    ['Schema', testAuditSchema], ['Info', testAuditInfo], ['Health', testAuditHealth],
    ['Recursion Protection', testAuditRecursionProtection], ['Security', testAuditSecurity],
    ['Redaction', testAuditRedaction], ['Pagination', testAuditPagination], ['Company Isolation', testAuditCompanyIsolation]
  ];
  const results = []; let passed = 0; let failed = 0;
  tests.forEach(function(t) {
    try {
      const r = t[1](); const ok = !!(r && r.success !== false);
      if (ok) passed++; else failed++;
      results.push({ name: t[0], success: ok, result: r });
    } catch (e) { failed++; results.push({ name: t[0], success: false, error: audit4334SafeError_(e) }); }
  });
  const summary = { success: failed === 0, module: AUDIT_CONFIG.MODULE, version: AUDIT_CONFIG.VERSION, total: tests.length, passed: passed, failed: failed, tests: results, runtimeValidation: 'REQUIRED_IN_APPS_SCRIPT' };
  Logger.log(JSON.stringify(summary, null, 2)); return summary;
}

function testAuditFullSuite() {
  return testAuditFullSuiteAdvanced4334();
}

function audit4334ServerRead_(filters, options) {
  /*
   * The secure AuditLogs reader remains the authorization boundary.
   * This bridge intentionally does not bypass Audit.gs read authorization.
   */
  return audit4334Read_(filters || {}, options || {});
}

function rdgAuditLogsRead(options) {
  return audit4334ServerRead_((options && options.filters) || {}, options || {});
}

function rdgAuditLogsRecordHistory(tableKey, recordId, options) {
  return audit4334ServerRead_({ tableKey: tableKey, recordId: recordId }, options || {});
}

function testAuditAdvanced4334() {
  return testAuditFullSuiteAdvanced4334();
}

