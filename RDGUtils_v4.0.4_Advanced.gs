/**
 * RDGUtils.gs
 * RD Route Design ACC — Universal Multi-Platform System
 * Utility, Validation, Security, Currency & Data Helper Layer
 *
 * IMPORTANT:
 * - This is the ORIGINAL Google Apps Script server-side .gs file.
 * - Do not rename it to .js.
 * - Client-side JavaScript remains inside RDGScript.html.
 * - This file is designed to be compatible with RDGConfig.gs and RDGServer.gs.
 */

var RDG_UTILS_VERSION = '2.0.0';

/* =========================================================
 * CORE / TYPE HELPERS
 * ========================================================= */

function rdgIsDefined(value) {
  return typeof value !== 'undefined';
}

function rdgIsNull(value) {
  return value === null;
}

function rdgIsNil(value) {
  return value === null || typeof value === 'undefined';
}

function rdgIsPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  var proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function rdgIsObject(value) {
  return value !== null && typeof value === 'object';
}

function rdgIsArray(value) {
  return Array.isArray(value);
}

function rdgTypeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  return typeof value;
}

/* =========================================================
 * DATE / TIME
 * ========================================================= */

function rdgNow() {
  return new Date();
}

function rdgNowIso() {
  return new Date().toISOString();
}

function rdgToday() {
  var d = new Date();
  return Utilities.formatDate(
    d,
    rdgGetConfigValue('app.timezone', Session.getScriptTimeZone() || 'Asia/Karachi'),
    'yyyy-MM-dd'
  );
}

function rdgFormatDate(dateValue, pattern, timezone) {
  var date = rdgToDate(dateValue);
  if (!date) return '';
  pattern = pattern || 'yyyy-MM-dd HH:mm:ss';
  timezone = timezone || rdgGetConfigValue(
    'app.timezone',
    Session.getScriptTimeZone() || 'Asia/Karachi'
  );
  return Utilities.formatDate(date, timezone, pattern);
}

function rdgIsValidDate(value) {
  var d = rdgToDate(value);
  return !!d;
}

function rdgToDate(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return new Date(value.getTime());
  if (typeof value === 'number' && isFinite(value)) {
    var dn = new Date(value);
    return isNaN(dn.getTime()) ? null : dn;
  }
  if (typeof value === 'string' && value.trim()) {
    var ds = new Date(value);
    return isNaN(ds.getTime()) ? null : ds;
  }
  return null;
}

function rdgStartOfDay(dateValue) {
  var d = rdgToDate(dateValue) || new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function rdgEndOfDay(dateValue) {
  var d = rdgToDate(dateValue) || new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/* =========================================================
 * STRING / NORMALIZATION
 * ========================================================= */

function rdgSafeString(value, fallback) {
  if (value === null || typeof value === 'undefined') {
    return fallback || '';
  }
  return String(value);
}

function rdgTrim(value, fallback) {
  var s = rdgSafeString(value, '');
  s = s.trim();
  return s || (fallback || '');
}

function rdgNormalizeEmail(value) {
  return rdgTrim(value).toLowerCase();
}

function rdgNormalizeMobile(value) {
  var s = rdgTrim(value);
  if (!s) return '';
  return s.replace(/[^\d+]/g, '');
}

function rdgNormalizeCode(value) {
  return rdgTrim(value).toUpperCase().replace(/\s+/g, '_');
}

function rdgSlugify(value) {
  return rdgTrim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function rdgMask(value, visibleStart, visibleEnd, maskChar) {
  var s = rdgSafeString(value);
  if (!s) return '';
  visibleStart = Math.max(0, Number(visibleStart) || 0);
  visibleEnd = Math.max(0, Number(visibleEnd) || 0);
  maskChar = maskChar || '*';
  if (visibleStart + visibleEnd >= s.length) return s;
  return s.substring(0, visibleStart) +
    new Array(s.length - visibleStart - visibleEnd + 1).join(maskChar) +
    (visibleEnd ? s.substring(s.length - visibleEnd) : '');
}

function rdgIsBlank(value) {
  return value === null ||
    typeof value === 'undefined' ||
    (typeof value === 'string' && value.trim() === '');
}

function rdgIsEmpty(value) {
  if (rdgIsBlank(value)) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (rdgIsPlainObject(value)) return Object.keys(value).length === 0;
  return false;
}

/* =========================================================
 * NUMBER / DECIMAL / MONEY
 * ========================================================= */

function rdgToNumber(value, fallback) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return typeof fallback === 'undefined' ? 0 : fallback;
  }
  if (typeof value === 'number') {
    return isFinite(value) ? value : (typeof fallback === 'undefined' ? 0 : fallback);
  }
  var n = Number(String(value).replace(/,/g, '').trim());
  return isFinite(n) ? n : (typeof fallback === 'undefined' ? 0 : fallback);
}

function rdgRound(value, decimals) {
  decimals = Math.max(0, Number(decimals) || 0);
  var factor = Math.pow(10, decimals);
  return Math.round((rdgToNumber(value) + Number.EPSILON) * factor) / factor;
}

function rdgFloor(value, decimals) {
  decimals = Math.max(0, Number(decimals) || 0);
  var factor = Math.pow(10, decimals);
  return Math.floor(rdgToNumber(value) * factor) / factor;
}

function rdgCeil(value, decimals) {
  decimals = Math.max(0, Number(decimals) || 0);
  var factor = Math.pow(10, decimals);
  return Math.ceil(rdgToNumber(value) * factor) / factor;
}

function rdgClamp(value, min, max) {
  value = rdgToNumber(value);
  min = rdgToNumber(min);
  max = rdgToNumber(max);
  if (min > max) {
    var t = min; min = max; max = t;
  }
  return Math.min(Math.max(value, min), max);
}

function rdgIsFiniteNumber(value) {
  return typeof value === 'number' && isFinite(value);
}

function rdgMoney(value, decimals) {
  decimals = typeof decimals === 'number' ? decimals : 2;
  return rdgRound(value, decimals);
}

function rdgPercent(value, decimals) {
  decimals = typeof decimals === 'number' ? decimals : 2;
  return rdgRound(value, decimals);
}

function rdgApplyPercent(value, percent, decimals) {
  return rdgRound(
    rdgToNumber(value) * (1 + rdgToNumber(percent) / 100),
    typeof decimals === 'number' ? decimals : 8
  );
}

function rdgCalculatePercentage(value, percent, decimals) {
  return rdgRound(
    rdgToNumber(value) * rdgToNumber(percent) / 100,
    typeof decimals === 'number' ? decimals : 8
  );
}

/* =========================================================
 * BOOLEAN / ARRAYS
 * ========================================================= */

function rdgToBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    var s = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on', 'active'].indexOf(s) >= 0) return true;
    if (['false', '0', 'no', 'n', 'off', 'inactive'].indexOf(s) >= 0) return false;
  }
  return typeof fallback === 'undefined' ? false : fallback;
}

function rdgEnsureArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || typeof value === 'undefined' || value === '') return [];
  return [value];
}

function rdgUnique(array, keyFn) {
  var list = rdgEnsureArray(array);
  var seen = {};
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var key = keyFn ? keyFn(list[i], i) : JSON.stringify(list[i]);
    key = String(key);
    if (!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      out.push(list[i]);
    }
  }
  return out;
}

function rdgChunk(array, size) {
  array = rdgEnsureArray(array);
  size = Math.max(1, Math.floor(rdgToNumber(size, 1)));
  var out = [];
  for (var i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

function rdgArrayContains(array, value) {
  return rdgEnsureArray(array).indexOf(value) !== -1;
}

/* =========================================================
 * OBJECT / CLONE / MERGE
 * ========================================================= */

function rdgDeepClone(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) {
    return value.map(function(item) { return rdgDeepClone(item); });
  }
  if (rdgIsPlainObject(value)) {
    var out = {};
    Object.keys(value).forEach(function(key) {
      out[key] = rdgDeepClone(value[key]);
    });
    return out;
  }
  return value;
}

function rdgHas(object, path) {
  if (!rdgIsObject(object) || !path) return false;
  var parts = String(path).split('.');
  var cur = object;
  for (var i = 0; i < parts.length; i++) {
    if (cur === null || typeof cur === 'undefined' ||
        !Object.prototype.hasOwnProperty.call(Object(cur), parts[i])) {
      return false;
    }
    cur = cur[parts[i]];
  }
  return true;
}

function rdgPick(object, keys) {
  var out = {};
  if (!rdgIsObject(object)) return out;
  rdgEnsureArray(keys).forEach(function(key) {
    if (Object.prototype.hasOwnProperty.call(object, key)) out[key] = object[key];
  });
  return out;
}

function rdgOmit(object, keys) {
  var out = rdgDeepClone(object || {});
  rdgEnsureArray(keys).forEach(function(key) {
    delete out[key];
  });
  return out;
}

function rdgDeepMerge(target) {
  var out = rdgIsPlainObject(target) ? rdgDeepClone(target) : {};
  for (var a = 1; a < arguments.length; a++) {
    var source = arguments[a];
    if (!rdgIsPlainObject(source)) continue;
    Object.keys(source).forEach(function(key) {
      var sv = source[key];
      if (rdgIsPlainObject(sv) && rdgIsPlainObject(out[key])) {
        out[key] = rdgDeepMerge(out[key], sv);
      } else {
        out[key] = rdgDeepClone(sv);
      }
    });
  }
  return out;
}

/* =========================================================
 * JSON
 * ========================================================= */

function safeJsonParse(value, fallback) {
  if (rdgIsNil(value) || value === '') {
    return typeof fallback === 'undefined' ? null : fallback;
  }
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return typeof fallback === 'undefined' ? null : fallback;
  }
}

function safeJsonStringify(value, fallback) {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return typeof fallback === 'undefined' ? '' : fallback;
  }
}

function rdgParseJsonObject(value, fallback) {
  var parsed = safeJsonParse(value, null);
  return rdgIsPlainObject(parsed)
    ? parsed
    : (rdgIsPlainObject(fallback) ? fallback : {});
}

function rdgParseJsonArray(value, fallback) {
  var parsed = safeJsonParse(value, null);
  return Array.isArray(parsed)
    ? parsed
    : (Array.isArray(fallback) ? fallback : []);
}

/* =========================================================
 * NESTED PATH UTILITIES
 * setNested MUTATES the supplied root for compatibility with
 * RDGServer.gs. rdgSetNestedClone() provides immutable behavior.
 * ========================================================= */

function getNested(object, path, defaultValue) {
  if (!path) return object;
  var parts = Array.isArray(path) ? path : String(path).split('.');
  var cur = object;
  for (var i = 0; i < parts.length; i++) {
    if (cur === null || typeof cur === 'undefined') return defaultValue;
    cur = cur[parts[i]];
  }
  return typeof cur === 'undefined' ? defaultValue : cur;
}

function setNested(object, path, value) {
  if (!rdgIsObject(object)) {
    throw new Error('setNested(): root object is required.');
  }
  var parts = Array.isArray(path) ? path : String(path).split('.');
  if (!parts.length || !String(parts[0])) {
    throw new Error('setNested(): path is required.');
  }

  var cur = object;
  for (var i = 0; i < parts.length - 1; i++) {
    var key = parts[i];
    if (!rdgIsObject(cur[key])) cur[key] = {};
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
  return object;
}

function rdgSetNestedClone(object, path, value) {
  var out = rdgDeepClone(object || {});
  return setNested(out, path, value);
}

function deleteNested(object, path) {
  if (!rdgIsObject(object)) return object;
  var parts = Array.isArray(path) ? path : String(path).split('.');
  if (!parts.length) return object;
  var cur = object;
  for (var i = 0; i < parts.length - 1; i++) {
    if (!rdgIsObject(cur[parts[i]])) return object;
    cur = cur[parts[i]];
  }
  delete cur[parts[parts.length - 1]];
  return object;
}

function rdgDeleteNestedClone(object, path) {
  return deleteNested(rdgDeepClone(object || {}), path);
}

function updateNestedFields(object, updates) {
  var out = rdgDeepClone(object || {});
  if (!rdgIsPlainObject(updates)) return out;
  Object.keys(updates).forEach(function(path) {
    setNested(out, path, updates[path]);
  });
  return out;
}

function rdgUpdateNestedFields(object, updates) {
  return updateNestedFields(object, updates);
}

/* =========================================================
 * JS-SPLICE STYLE ARRAY INDEXING
 * ========================================================= */

function rdgNormalizeInsertIndex(length, index) {
  length = Math.max(0, Math.floor(rdgToNumber(length, 0)));
  index = Math.trunc(rdgToNumber(index, length));

  if (index < 0) {
    index = length + index;
    if (index < 0) index = 0;
  }
  if (index > length) index = length;
  return index;
}

function rdgNormalizeExistingIndex(length, index) {
  length = Math.max(0, Math.floor(rdgToNumber(length, 0)));
  if (!length) return -1;

  index = Math.trunc(rdgToNumber(index, 0));
  if (index < 0) index = length + index;
  return index >= 0 && index < length ? index : -1;
}

function rdgInsertArrayItem(array, index, item) {
  if (!Array.isArray(array)) throw new Error('rdgInsertArrayItem(): array required.');
  var i = rdgNormalizeInsertIndex(array.length, index);
  array.splice(i, 0, item);
  return array;
}

function rdgInsertBeforeLast(array, item) {
  return rdgInsertArrayItem(array, -1, item);
}

function rdgInsertBeforeSecondLast(array, item) {
  return rdgInsertArrayItem(array, -2, item);
}

function rdgInsertBeforeThirdLast(array, item) {
  return rdgInsertArrayItem(array, -3, item);
}

function rdgInsertAtBeginning(array, item) {
  return rdgInsertArrayItem(array, 0, item);
}

function rdgInsertAtEnd(array, item) {
  return rdgInsertArrayItem(array, array.length, item);
}

/* =========================================================
 * STATUS / RECORD NORMALIZATION
 * ========================================================= */

function rdgNormalizeStatus(value, fallback) {
  var s = rdgNormalizeCode(value);
  return s || rdgNormalizeCode(
    fallback || rdgGetConfigValue('settings.defaultStatus', 'ACTIVE')
  );
}

function rdgRemoveUndefined(object) {
  if (Array.isArray(object)) {
    return object.map(rdgRemoveUndefined);
  }
  if (rdgIsPlainObject(object)) {
    var out = {};
    Object.keys(object).forEach(function(key) {
      if (typeof object[key] !== 'undefined') {
        out[key] = rdgRemoveUndefined(object[key]);
      }
    });
    return out;
  }
  return object;
}

function rdgNormalizeObject(object) {
  if (!rdgIsPlainObject(object)) return {};
  return rdgRemoveUndefined(rdgDeepClone(object));
}

/* =========================================================
 * ID UTILITIES
 * ========================================================= */

function rdgRandomToken(length) {
  length = Math.max(4, Math.floor(rdgToNumber(length, 8)));
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var out = '';
  for (var i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function rdgUuid() {
  return Utilities.getUuid();
}

function rdgShortUuid() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 12).toUpperCase();
}

function rdgBuildId(prefix, length) {
  prefix = rdgNormalizeCode(prefix);
  if (!prefix) throw new Error('rdgBuildId(): prefix is required.');
  return prefix + '-' + rdgRandomToken(length || 8);
}

function rdgIdPrefix(id) {
  var s = rdgSafeString(id);
  var m = s.match(/^([A-Z0-9_]+)-/i);
  return m ? m[1].toUpperCase() : '';
}

function rdgIsValidId(id, prefix) {
  var s = rdgSafeString(id);
  if (!/^[A-Z0-9_]+-[A-Z0-9]+$/i.test(s)) return false;
  if (prefix && rdgIdPrefix(s) !== rdgNormalizeCode(prefix)) return false;
  return true;
}

/* =========================================================
 * CURRENCY — NORMAL + MASTER
 * ========================================================= */

var RDG_NORMAL_CURRENCIES = ['COIN', 'DIAMOND', 'SILVER'];
var RDG_MASTER_CURRENCIES = ['MASTER_COIN', 'MASTER_DIAMOND', 'MASTER_SILVER'];

function rdgNormalizeCurrencyCode(code) {
  return rdgNormalizeCode(code);
}

function rdgIsNormalCurrency(code) {
  return RDG_NORMAL_CURRENCIES.indexOf(rdgNormalizeCurrencyCode(code)) !== -1;
}

function rdgIsMasterCurrency(code) {
  return RDG_MASTER_CURRENCIES.indexOf(rdgNormalizeCurrencyCode(code)) !== -1;
}

function rdgIsSupportedCurrency(code) {
  return rdgIsNormalCurrency(code) || rdgIsMasterCurrency(code);
}

function rdgGetMasterCurrencyRate(masterCurrency) {
  var code = rdgNormalizeCurrencyCode(masterCurrency);
  var rates = rdgGetConfigValue('currency.masterCurrencyRates', null);

  if (!rates) rates = rdgGetConfigValue('wallet.masterCurrencyRates', null);
  if (!rates) rates = rdgGetConfigValue('masterCurrencyRates', null);

  var item = rates && rates[code];
  if (!item) {
    var defaults = {
      MASTER_SILVER: {currency: 'SILVER', unitsPerMaster: 1000},
      MASTER_COIN: {currency: 'COIN', unitsPerMaster: 2000},
      MASTER_DIAMOND: {currency: 'DIAMOND', unitsPerMaster: 3000}
    };
    item = defaults[code];
  }

  return item || null;
}

function rdgMasterToNormal(masterCurrency, quantity) {
  var rate = rdgGetMasterCurrencyRate(masterCurrency);
  if (!rate) throw new Error('Unsupported master currency: ' + masterCurrency);
  return rdgToNumber(quantity) * rdgToNumber(rate.unitsPerMaster);
}

function rdgNormalToMaster(normalCurrency, quantity) {
  var code = rdgNormalizeCurrencyCode(normalCurrency);
  var master = {
    SILVER: 'MASTER_SILVER',
    COIN: 'MASTER_COIN',
    DIAMOND: 'MASTER_DIAMOND'
  }[code];

  if (!master) throw new Error('Unsupported normal currency: ' + normalCurrency);

  var rate = rdgGetMasterCurrencyRate(master);
  return rdgToNumber(quantity) / rdgToNumber(rate.unitsPerMaster);
}

function rdgGetCurrencyFamily(code) {
  code = rdgNormalizeCurrencyCode(code);
  if (rdgIsMasterCurrency(code)) return 'MASTER';
  if (rdgIsNormalCurrency(code)) return 'NORMAL';
  return 'UNKNOWN';
}

function rdgValidateCurrencyAmount(currencyCode, amount) {
  var code = rdgNormalizeCurrencyCode(currencyCode);
  var n = rdgToNumber(amount, NaN);

  if (!rdgIsSupportedCurrency(code)) {
    return rdgError('Unsupported currency: ' + code, 'INVALID_CURRENCY');
  }
  if (!isFinite(n) || n <= 0) {
    return rdgError('Currency amount must be greater than zero.', 'INVALID_AMOUNT');
  }

  return rdgSuccess({
    currency: code,
    family: rdgGetCurrencyFamily(code),
    amount: n
  });
}

/* =========================================================
 * MARKET PRICING / MASTER CURRENCY FORMULAS
 *
 * Formula:
 *   Master Price = Market Anchor Price × (1 + Premium % / 100)
 *
 * Anchors are intentionally configuration-driven. No live FX rate
 * is hard-coded here.
 * ========================================================= */

function rdgGetMarketPricingConfig() {
  return rdgGetConfigValue('marketPricing', {
    enabled: true,
    premiumPercent: 10,
    anchors: {
      MASTER_DIAMOND: 'HIGHEST',
      MASTER_COIN: 'CENTER',
      MASTER_SILVER: 'LOWEST'
    },
    marketRates: {}
  });
}

function rdgGetMarketRateAnchors() {
  var cfg = rdgGetMarketPricingConfig();
  return cfg.marketRates || cfg.marketRateAnchors || {};
}

function rdgGetAnchorRate(anchorName, rates) {
  rates = rates || rdgGetMarketRateAnchors();
  var key = rdgNormalizeCode(anchorName);

  var direct = rates[key];
  if (rdgIsPlainObject(direct) && typeof direct.rate !== 'undefined') {
    return rdgToNumber(direct.rate, NaN);
  }
  if (typeof direct === 'number') return direct;

  var list = [];
  Object.keys(rates).forEach(function(k) {
    var item = rates[k];
    var rate = rdgIsPlainObject(item) ? item.rate : item;
    rate = rdgToNumber(rate, NaN);
    if (isFinite(rate) && rate > 0) list.push(rate);
  });

  if (!list.length) return NaN;

  list.sort(function(a, b) { return a - b; });

  if (key === 'LOWEST' || key === 'MIN') return list[0];
  if (key === 'HIGHEST' || key === 'MAX') return list[list.length - 1];

  if (key === 'CENTER' || key === 'MIDDLE' || key === 'MEDIAN') {
    var mid = Math.floor(list.length / 2);
    return list.length % 2
      ? list[mid]
      : (list[mid - 1] + list[mid]) / 2;
  }

  return NaN;
}

function rdgCalculateMasterUnitPrice(masterCurrency, options) {
  options = rdgIsPlainObject(options) ? options : {};
  var code = rdgNormalizeCurrencyCode(masterCurrency);
  var cfg = rdgGetMarketPricingConfig();

  if (!rdgIsMasterCurrency(code)) {
    throw new Error('Master currency required: ' + code);
  }

  var anchors = cfg.anchors || {};
  var anchorName = options.anchor ||
    anchors[code] ||
    code;

  var rates = options.marketRates || cfg.marketRates || {};
  var marketRate = rdgToNumber(
    typeof options.marketRate !== 'undefined'
      ? options.marketRate
      : rdgGetAnchorRate(anchorName, rates),
    NaN
  );

  if (!isFinite(marketRate) || marketRate <= 0) {
    throw new Error(
      'A valid market rate is required for ' + code +
      ' using anchor ' + anchorName + '.'
    );
  }

  var premium = typeof options.premiumPercent !== 'undefined'
    ? rdgToNumber(options.premiumPercent)
    : rdgToNumber(cfg.premiumPercent, 10);

  var finalRate = marketRate * (1 + premium / 100);

  return {
    masterCurrency: code,
    anchor: rdgNormalizeCode(anchorName),
    marketRate: rdgRound(marketRate, 12),
    premiumPercent: rdgRound(premium, 4),
    premiumAmount: rdgRound(finalRate - marketRate, 12),
    masterUnitPrice: rdgRound(finalRate, 12),
    formula: 'marketRate * (1 + premiumPercent / 100)',
    capturedAt: rdgNowIso()
  };
}

function rdgCalculateMasterPrices(options) {
  options = rdgIsPlainObject(options) ? options : {};
  var out = {};
  RDG_MASTER_CURRENCIES.forEach(function(code) {
    try {
      out[code] = rdgCalculateMasterUnitPrice(code, options);
    } catch (e) {
      out[code] = {
        masterCurrency: code,
        error: rdgErrorMessage(e)
      };
    }
  });
  return out;
}

function rdgCalculateTradingRate(masterCurrency, normalCurrency, options) {
  var masterCode = rdgNormalizeCurrencyCode(masterCurrency);
  var normalCode = rdgNormalizeCurrencyCode(normalCurrency);

  var mapping = rdgGetMasterCurrencyRate(masterCode);
  if (!mapping || mapping.currency !== normalCode) {
    throw new Error(
      'Master/normal currency pair mismatch: ' +
      masterCode + ' -> ' + normalCode
    );
  }

  var price = rdgCalculateMasterUnitPrice(masterCode, options);
  var units = rdgToNumber(mapping.unitsPerMaster);

  return {
    masterCurrency: masterCode,
    normalCurrency: normalCode,
    masterUnitPrice: price.masterUnitPrice,
    unitsPerMaster: units,
    normalUnitPrice: rdgRound(price.masterUnitPrice / units, 12),
    formula:
      'masterUnitPrice / unitsPerMaster',
    pricingSnapshot: price
  };
}

/* =========================================================
 * PAGINATION / FILTER HELPERS
 * ========================================================= */

function rdgPaginate(items, page, pageSize) {
  items = rdgEnsureArray(items);
  page = Math.max(1, Math.floor(rdgToNumber(page, 1)));
  pageSize = Math.max(1, Math.floor(rdgToNumber(pageSize, 25)));

  var total = items.length;
  var totalPages = total ? Math.ceil(total / pageSize) : 0;
  var start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: page,
    pageSize: pageSize,
    total: total,
    totalPages: totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1 && totalPages > 0
  };
}

function rdgPaginationOptions(options) {
  options = rdgIsPlainObject(options) ? options : {};
  return {
    page: Math.max(1, Math.floor(rdgToNumber(options.page, 1))),
    pageSize: Math.max(
      1,
      Math.min(
        Math.floor(rdgToNumber(
          options.pageSize,
          rdgGetConfigValue('settings.pageSize', 25)
        )),
        Math.floor(rdgGetConfigValue('settings.maxPageSize', 100))
      )
    )
  };
}

function rdgSortRecords(records, field, direction) {
  var list = rdgEnsureArray(records).slice();
  direction = String(direction || 'asc').toLowerCase() === 'desc' ? -1 : 1;

  return list.sort(function(a, b) {
    var av = getNested(a, field, '');
    var bv = getNested(b, field, '');

    if (av instanceof Date) av = av.getTime();
    if (bv instanceof Date) bv = bv.getTime();

    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();

    if (av < bv) return -1 * direction;
    if (av > bv) return 1 * direction;
    return 0;
  });
}

/* =========================================================
 * VALIDATION
 * ========================================================= */

function rdgAssert(condition, message, code) {
  if (!condition) {
    var error = new Error(message || 'Assertion failed.');
    error.code = code || 'ASSERTION_FAILED';
    throw error;
  }
  return true;
}

function rdgRequire(value, fieldName) {
  if (rdgIsBlank(value)) {
    var error = new Error((fieldName || 'Field') + ' is required.');
    error.code = 'REQUIRED_FIELD';
    throw error;
  }
  return value;
}

function rdgIsValidEmail(email) {
  email = rdgNormalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function rdgIsValidMobile(mobile) {
  mobile = rdgNormalizeMobile(mobile);
  return /^\+?\d{7,15}$/.test(mobile);
}

function rdgValidateRequiredFields(data, fields) {
  var missing = [];
  rdgEnsureArray(fields).forEach(function(field) {
    if (rdgIsBlank(getNested(data, field, null))) missing.push(field);
  });

  return {
    valid: missing.length === 0,
    missing: missing
  };
}

/* =========================================================
 * SECURITY / HASH
 * ========================================================= */

function rdgSha256Hex(value) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    rdgSafeString(value),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(byte) {
    var v = byte < 0 ? byte + 256 : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function rdgHmacSha256Hex(value, secret) {
  var bytes = Utilities.computeHmacSha256Signature(
    rdgSafeString(value),
    rdgSafeString(secret),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(byte) {
    var v = byte < 0 ? byte + 256 : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function rdgConstantTimeEqual(a, b) {
  a = rdgSafeString(a);
  b = rdgSafeString(b);
  if (a.length !== b.length) return false;

  var result = 0;
  for (var i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/* =========================================================
 * RESPONSE / ERROR HELPERS
 * ========================================================= */

function rdgSuccess(data, message, meta) {
  return {
    success: true,
    ok: true,
    data: typeof data === 'undefined' ? null : data,
    message: message || 'Success.',
    meta: meta || {},
    timestamp: rdgNowIso()
  };
}

function rdgError(message, code, details, meta) {
  return {
    success: false,
    ok: false,
    data: null,
    message: message || 'An error occurred.',
    code: code || 'RDG_ERROR',
    details: details || null,
    meta: meta || {},
    timestamp: rdgNowIso()
  };
}

function rdgErrorObject(error, code) {
  return rdgError(
    rdgErrorMessage(error),
    code || (error && error.code) || 'RDG_ERROR'
  );
}

function rdgErrorMessage(error) {
  if (error === null || typeof error === 'undefined') return 'Unknown error.';
  if (typeof error === 'string') return error;
  if (error.message) return String(error.message);
  return String(error);
}

function safeServerError(error) {
  console.error(rdgErrorMessage(error));
  return rdgErrorObject(error, 'SERVER_ERROR');
}

/* =========================================================
 * CONFIG
 * ========================================================= */

function rdgGetConfigValue(path, fallback) {
  try {
    if (typeof getConfigValue_ === 'function') {
      return getConfigValue_(path, fallback);
    }

    if (typeof RDG_CONFIG !== 'undefined' && RDG_CONFIG) {
      return getNested(RDG_CONFIG, path, fallback);
    }
  } catch (e) {
    console.warn('rdgGetConfigValue failed: ' + rdgErrorMessage(e));
  }
  return fallback;
}

/* =========================================================
 * DIAGNOSTICS / TESTS
 * ========================================================= */

function rdgUtilsInfo() {
  return {
    module: 'RDGUtils',
    version: RDG_UTILS_VERSION,
    normalCurrencies: RDG_NORMAL_CURRENCIES.slice(),
    masterCurrencies: RDG_MASTER_CURRENCIES.slice(),
    timezone: rdgGetConfigValue('app.timezone', 'Asia/Karachi'),
    timestamp: rdgNowIso()
  };
}

function testRDGUtils() {
  var sample = {
    user: {
      profile: {
        name: 'RDG Test'
      },
      items: [
        {id: 1},
        {id: 2},
        {id: 3}
      ]
    }
  };

  var checks = [];

  checks.push({
    name: 'nested read',
    pass: getNested(sample, 'user.profile.name') === 'RDG Test'
  });

  setNested(sample, 'user.profile.status', 'ACTIVE');
  checks.push({
    name: 'nested write',
    pass: getNested(sample, 'user.profile.status') === 'ACTIVE'
  });

  rdgInsertArrayItem(sample.user.items, -1, {id: 99});
  checks.push({
    name: 'negative insert before last',
    pass: sample.user.items[2].id === 99
  });

  checks.push({
    name: 'master silver conversion',
    pass: rdgMasterToNormal('MASTER_SILVER', 1) === 1000
  });

  checks.push({
    name: 'master coin conversion',
    pass: rdgMasterToNormal('MASTER_COIN', 1) === 2000
  });

  checks.push({
    name: 'master diamond conversion',
    pass: rdgMasterToNormal('MASTER_DIAMOND', 1) === 3000
  });

  checks.push({
    name: 'email validation',
    pass: rdgIsValidEmail('test@example.com')
  });

  checks.push({
    name: 'hash',
    pass: rdgSha256Hex('RDG').length === 64
  });

  return {
    success: checks.every(function(item) { return item.pass; }),
    version: RDG_UTILS_VERSION,
    checks: checks,
    timestamp: rdgNowIso()
  };
}
