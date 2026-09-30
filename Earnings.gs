/**
 * ================================================================
 * RD-UMPS / RDG
 * Earnings.gs
 * Version: 4.4.0 Advanced+
 * Phase: Phase 4 — Universal Wallet / Gaming Economy
 * ================================================================
 *
 * PURPOSE
 * -------
 * Earnings ledger for:
 *   GAME
 *   CHAT
 *   SALE
 *   COMMISSION
 *   BONUS
 *   INCENTIVE
 *   SALARY
 *   REFERRAL
 *   REWARD
 *   PROMOTIONAL
 *   OTHER
 *
 * IMPORTANT CURRENCY MODEL
 * ------------------------
 *
 * Master currencies are PRIMARY gaming money:
 *
 *   MasterDiamond
 *   MasterSton
 *   MasterCoin
 *   MasterCrown
 *   MasterSilver
 *
 * User can purchase Master Currency with real money.
 *
 * Super currencies:
 *
 *   SuperDiamond
 *   SuperSton
 *   SuperCoin
 *   SuperCrown
 *   SuperSilver
 *
 * Standard gaming currencies:
 *
 *   Diamond
 *   Ston
 *   Coin
 *   Crown
 *   Silver
 *
 * Currency names are intentionally case-sensitive and MUST NOT
 * be silently converted to MD / MC / MS / etc.
 *
 * This file does NOT itself perform external payment settlement.
 * Payment/Recharges/WalletTransactions remain responsible for
 * financial settlement.
 *
 * ================================================================
 */


/* ================================================================
 * CONFIG
 * ================================================================ */

const RDG_EARNINGS_CONFIG = Object.freeze({

  VERSION: '4.4.0',
  MODULE: 'EARNINGS',
  PHASE: 'PHASE_4_UNIVERSAL_WALLET',

  RUNTIME_MARKER: 'RDG_EARNINGS_RUNTIME_4.4.0',

  TABLE_KEY: 'EARNINGS',

  TABLE_ALIASES: Object.freeze([
    'EARNINGS',
    'Earnings',
    'Earning',
    'RDGEarnings',
    'RDGEarning'
  ]),

  HEADER_ROW: 3,
  DATA_START_ROW: 4,

  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MAX_SCAN: 5000,

  LOCK_TIMEOUT_MS: 30000,

  REFERENCE_TYPE: 'EARNING',

  STATUSES: Object.freeze([
    'PENDING',
    'APPROVED',
    'PAID',
    'REJECTED',
    'CANCELLED',
    'REVERSED'
  ]),

  EARNING_TYPES: Object.freeze([
    'SALE',
    'COMMISSION',
    'BONUS',
    'INCENTIVE',
    'SALARY',
    'GAME',
    'CHAT',
    'REFERRAL',
    'REWARD',
    'PROMOTIONAL',
    'OTHER'
  ]),

  /*
   * IMPORTANT
   *
   * These are the canonical gaming currency names.
   */
  GAMING_CURRENCY_AUTHORITY: 'RDEconomyCurrency.gs',
  EXPECTED_GAMING_CURRENCY_COUNT: 30,

  /*
   * Fiat currencies remain available for external settlement
   * and accounting/payment modules.
   *
   * They are NOT gaming currencies.
   */
  FIAT_CURRENCIES: Object.freeze([
    'PKR',
    'USD',
    'EUR',
    'GBP',
    'AED',
    'SAR'
  ]),

  SYSTEM_USERS: Object.freeze([
    'SYSTEM',
    'RDSYSTEM',
    'RDGSYSTEM',
    'RD-UMPS-SYSTEM'
  ]),

  PROTECTED_FIELDS: Object.freeze([
    'ID',
    'Wallet Account ID',
    'User ID',
    'Company ID',
    'Currency Code',
    'Created At',
    'Updated At'
  ]),

  HEADERS: Object.freeze([
    'ID',
    'Wallet Account ID',
    'User ID',
    'Company ID',
    'Currency Code',
    'Base Amount',
    'Earning Percentage',
    'Amount',
    'Earning Type',
    'Earning Title',
    'Source',
    'Reference Type',
    'Reference ID',
    'Description',
    'Status',
    'Earning Date',
    'Wallet Transaction ID',
    'Approved At',
    'Approval Note',
    'Paid At',
    'Payment Note',
    'Reversal Wallet Transaction ID',
    'Reversed At',
    'Reversal Reason',
    'Rejection Reason',
    'Rejected At',
    'Cancellation Reason',
    'Cancelled At',
    'Metadata JSON',
    'Created At',
    'Updated At'
  ])
});


/* ================================================================
 * CURRENCY REGISTRY BRIDGE
 * ================================================================
 *
 * RDEconomyCurrency.gs is the single gaming-currency authority.
 * Earnings.gs consumes that authority and never defines a second
 * gaming-currency registry.
 *
 * Supported central adapters (depending on installed baseline):
 *   rdgGetSupportedCurrencies()
 *   getAllGamingCurrencies()
 *   getGamingCurrencies()
 *
 * RDGUtils/RDEconomy may return strings or metadata objects. This
 * bridge normalizes both shapes without changing the canonical names.
 * ================================================================ */

function rdgEarningCentralCurrencyRecords_() {

  var candidates = [
    'rdgGetSupportedCurrencies',
    'getAllGamingCurrencies',
    'getGamingCurrencies'
  ];

  for (var i = 0; i < candidates.length; i++) {
    var name = candidates[i];
    try {
      if (typeof globalThis[name] === 'function') {
        var value = globalThis[name]();
        if (Array.isArray(value) && value.length) {
          return JSON.parse(JSON.stringify(value));
        }
      }
    } catch (ignore) {}
  }

  throw new Error(
    'RDEconomyCurrency registry is unavailable. Earnings.gs will not create a local currency registry.'
  );
}

function rdgEarningCurrencyCode_(item) {
  if (typeof item === 'string') return String(item).trim();
  if (item && typeof item === 'object') {
    return String(
      item.code ||
      item.currencyCode ||
      item.name ||
      item.id ||
      ''
    ).trim();
  }
  return '';
}

function rdgEarningCurrencyName_(item) {
  if (typeof item === 'string') return String(item).trim();
  if (item && typeof item === 'object') {
    return String(
      item.name ||
      item.code ||
      item.currencyCode ||
      item.id ||
      ''
    ).trim();
  }
  return '';
}

function rdgEarningCurrencyTier_(item) {
  if (!item || typeof item !== 'object') return '';
  return String(
    item.tier ||
    item.group ||
    item.level ||
    ''
  ).trim().toUpperCase();
}

function rdgEarningCurrencyRecord_(currencyCode) {

  var code = String(currencyCode || '').trim();
  if (!code) throw new Error('Currency Code is required.');

  var records = rdgEarningCentralCurrencyRecords_();
  var wanted = code.toUpperCase();

  for (var i = 0; i < records.length; i++) {
    var item = records[i];
    var itemCode = rdgEarningCurrencyCode_(item);
    if (itemCode.toUpperCase() === wanted) {
      if (typeof item === 'string') {
        return {
          code: itemCode,
          name: itemCode,
          family: '',
          tier: '',
          type: 'GAMING'
        };
      }
      return Object.assign({}, item, {
        code: itemCode,
        name: rdgEarningCurrencyName_(item),
        tier: rdgEarningCurrencyTier_(item) || item.tier || ''
      });
    }
  }

  var fiat = ['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];
  for (var f = 0; f < fiat.length; f++) {
    if (fiat[f] === wanted) {
      return {
        code: fiat[f],
        name: fiat[f],
        family: 'FIAT',
        tier: 'FIAT',
        type: 'FIAT',
        monetary: true,
        purchasable: false,
        transferable: true,
        spendable: true
      };
    }
  }

  throw new Error('Unsupported currency: ' + code);
}

/* ================================================================
 * PUBLIC CURRENCY COMPATIBILITY HELPERS
 * ================================================================ */

function getGamingCurrency(currencyCode) {
  return rdgEarningCurrencyRecord_(currencyCode);
}

function isValidGamingCurrency(currencyCode) {
  try {
    var c = rdgEarningCurrencyRecord_(currencyCode);
    return c.type !== 'FIAT';
  } catch (ignore) {
    return false;
  }
}

function isMasterCurrency(currencyCode) {
  return rdgEarningCurrencyRecord_(currencyCode).tier === 'MASTER';
}

function isSuperCurrency(currencyCode) {
  return rdgEarningCurrencyRecord_(currencyCode).tier === 'SUPER';
}

function isStandardGamingCurrency(currencyCode) {
  return rdgEarningCurrencyRecord_(currencyCode).tier === 'STANDARD';
}

function isFiatCurrency(currencyCode) {
  return rdgEarningCurrencyRecord_(currencyCode).tier === 'FIAT';
}

function getGamingCurrencyList() {
  return rdgEarningCentralCurrencyRecords_().map(function(item) {
    return rdgEarningCurrencyName_(item);
  }).filter(function(item) {
    return !!item;
  });
}

function getMasterCurrencyList() {
  return rdgEarningCentralCurrencyRecords_().filter(function(item) {
    return rdgEarningCurrencyTier_(item) === 'MASTER';
  }).map(rdgEarningCurrencyName_).filter(function(item) {
    return !!item;
  });
}

function getSuperCurrencyList() {
  return rdgEarningCentralCurrencyRecords_().filter(function(item) {
    return rdgEarningCurrencyTier_(item) === 'SUPER';
  }).map(rdgEarningCurrencyName_).filter(function(item) {
    return !!item;
  });
}

function getStandardGamingCurrencyList() {
  return rdgEarningCentralCurrencyRecords_().filter(function(item) {
    return rdgEarningCurrencyTier_(item) === 'STANDARD';
  }).map(rdgEarningCurrencyName_).filter(function(item) {
    return !!item;
  });
}

function getGamingCurrencyRegistry() {
  return rdgEarningCentralCurrencyRecords_();
}

function rdgCurrencyHelper(currencyCode) {
  return {
    success: true,
    version: RDG_EARNINGS_CONFIG.VERSION,
    currency: getGamingCurrency(currencyCode),
    authority: RDG_EARNINGS_CONFIG.GAMING_CURRENCY_AUTHORITY
  };
}

function normalizeLegacyGamingCurrency(currencyCode) {
  var code = String(currencyCode || '').trim();
  var upper = code.toUpperCase();

  var legacyMap = {
    MD: 'MasterDiamond',
    MS: 'MasterSilver',
    MC: 'MasterCoin',
    DIAMOND: 'Diamond',
    STON: 'Ston',
    COIN: 'Coin',
    CROWN: 'Crown',
    SILVER: 'Silver'
  };

  if (upper === 'STONE') {
    throw new Error(
      'STONE is not a canonical currency name. Use Ston.'
    );
  }

  return legacyMap[upper] || code;
}

/* ================================================================
 * INTERNAL HELPERS
 * ================================================================ */

function rdgEarningSafeError_(error, fallback) {

  try {

    if (error && error.message) {
      return String(error.message).substring(0, 500);
    }

  } catch (ignore) {}

  return fallback || 'Earnings operation failed.';
}


function rdgEarningRoundMoney_(value) {

  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error('Invalid monetary amount.');
  }

  return Math.round((number + Number.EPSILON) * 100) / 100;
}


function rdgEarningNormalizeStatus_(status) {

  const value = String(status || 'PENDING')
    .trim()
    .toUpperCase();

  if (!RDG_EARNINGS_CONFIG.STATUSES.includes(value)) {
    throw new Error('Invalid earning status: ' + value);
  }

  return value;
}


function rdgEarningNormalizeType_(type) {

  const value = String(type || 'OTHER')
    .trim()
    .toUpperCase();

  if (!RDG_EARNINGS_CONFIG.EARNING_TYPES.includes(value)) {
    throw new Error('Invalid earning type: ' + value);
  }

  return value;
}


function rdgEarningNormalizeCurrency_(currencyCode) {

  const currency = getGamingCurrency(currencyCode);

  return currency.code;
}


function rdgEarningNormalizeAmount_(amount) {

  const value = rdgEarningRoundMoney_(amount);

  if (value <= 0) {
    throw new Error('Earning amount must be greater than zero.');
  }

  return value;
}


function rdgEarningNormalizePercentage_(percentage) {

  const value = Number(
    percentage === undefined || percentage === null
      ? 0
      : percentage
  );

  if (!Number.isFinite(value)) {
    throw new Error('Invalid earning percentage.');
  }

  if (value < 0 || value > 100) {
    throw new Error(
      'Earning percentage must be between 0 and 100.'
    );
  }

  return rdgEarningRoundMoney_(value);
}


function rdgEarningGetConfig_() {

  if (typeof APP_CONFIG !== 'undefined') {
    return APP_CONFIG;
  }

  if (typeof RDG_CONFIG !== 'undefined') {
    return RDG_CONFIG;
  }

  return null;
}


function rdgEarningGetTableName_() {

  const config = rdgEarningGetConfig_();

  if (config &&
      config.TABLES &&
      config.TABLES[RDG_EARNINGS_CONFIG.TABLE_KEY]) {

    return config.TABLES[RDG_EARNINGS_CONFIG.TABLE_KEY];
  }

  if (config &&
      config.SHEETS &&
      config.SHEETS[RDG_EARNINGS_CONFIG.TABLE_KEY]) {

    return config.SHEETS[RDG_EARNINGS_CONFIG.TABLE_KEY];
  }

  return 'Earnings';
}


function rdgEarningCurrentUser_() {

  try {

    if (typeof getCurrentServerUser_ === 'function') {

      const user = getCurrentServerUser_();

      if (user) return user;
    }

  } catch (ignore) {}

  try {

    if (typeof getCurrentRDGUser === 'function') {

      const user = getCurrentRDGUser();

      if (user) return user;
    }

  } catch (ignore) {}

  try {

    if (typeof getAuthenticatedUser === 'function') {

      const user = getAuthenticatedUser();

      if (user) return user;
    }

  } catch (ignore) {}

  return null;
}


function rdgEarningIsSystemUser_(user) {

  if (!user) return false;

  const id = String(
    user.userId ||
    user.id ||
    user.ID ||
    ''
  ).trim();

  const role = String(
    user.role ||
    user.roleId ||
    ''
  ).trim().toUpperCase();

  return (
    RDG_EARNINGS_CONFIG.SYSTEM_USERS.includes(id) ||
    role === 'SYSTEM'
  );
}


function rdgEarningAuthorize_(
  operation,
  record,
  options
) {

  options = options || {};

  if (typeof authorizeServerOperation_ === 'function') {

    return authorizeServerOperation_(
      operation,
      record || null,
      options
    );
  }

  /*
   * Development compatibility fallback.
   *
   * Financial production deployment should use RDGServer.
   */
  const user = rdgEarningCurrentUser_();

  if (!user && !options.systemOperation) {

    throw new Error(
      'RDGServer authorization is required.'
    );
  }

  return true;
}


function rdgEarningCompanyContext_(options) {

  options = options || {};

  const user = rdgEarningCurrentUser_();

  if (rdgEarningIsSystemUser_(user)) {

    return String(
      options.companyId ||
      user.companyId ||
      user.activeCompanyId ||
      ''
    ).trim();
  }

  if (!user) {
    throw new Error('Authenticated user is required.');
  }

  const userCompany = String(
    user.companyId ||
    user.activeCompanyId ||
    ''
  ).trim();

  if (
    options.companyId &&
    userCompany &&
    String(options.companyId) !== userCompany
  ) {

    throw new Error(
      'Company context mismatch.'
    );
  }

  if (userCompany) {
    return userCompany;
  }

  if (options.allowExplicitCompany === true &&
      options.companyId) {

    return String(options.companyId).trim();
  }

  throw new Error(
    'Active company context is required.'
  );
}


function rdgEarningUserId_() {

  const user = rdgEarningCurrentUser_();

  if (!user) {
    throw new Error('Authenticated user is required.');
  }

  return String(
    user.userId ||
    user.id ||
    user.ID ||
    ''
  ).trim();
}


function rdgEarningLock_() {

  const lock = LockService.getScriptLock();

  if (!lock.tryLock(RDG_EARNINGS_CONFIG.LOCK_TIMEOUT_MS)) {

    throw new Error(
      'Earnings service is busy. Please retry.'
    );
  }

  return lock;
}


function rdgEarningAudit_(
  action,
  beforeState,
  afterState
) {

  try {

    if (typeof createAuditLog === 'function') {

      return createAuditLog(
        action,
        RDG_EARNINGS_CONFIG.TABLE_KEY,
        afterState && afterState.ID,
        beforeState || null,
        afterState || null
      );
    }

  } catch (error) {

    console.warn(
      'Earnings audit warning:',
      rdgEarningSafeError_(error)
    );
  }

  return null;
}


function rdgEarningGetRecord_(id) {

  const table = rdgEarningGetTableName_();

  if (typeof serverGet_ === 'function') {

    return serverGet_(
      RDG_EARNINGS_CONFIG.TABLE_KEY,
      id
    );
  }

  if (typeof getRecord === 'function') {

    return getRecord(table, id);
  }

  throw new Error(
    'Earnings database service is unavailable.'
  );
}


function rdgEarningCreateRecord_(data) {

  const table = rdgEarningGetTableName_();

  if (typeof serverCreate_ === 'function') {

    return serverCreate_(
      RDG_EARNINGS_CONFIG.TABLE_KEY,
      data
    );
  }

  if (typeof createRecord === 'function') {

    return createRecord(table, data);
  }

  throw new Error(
    'Earnings database service is unavailable.'
  );
}


function rdgEarningUpdateRecord_(id, data) {

  const table = rdgEarningGetTableName_();

  if (typeof serverUpdate_ === 'function') {

    return serverUpdate_(
      RDG_EARNINGS_CONFIG.TABLE_KEY,
      id,
      data
    );
  }

  if (typeof updateRecord === 'function') {

    return updateRecord(table, id, data);
  }

  throw new Error(
    'Earnings database service is unavailable.'
  );
}


function rdgEarningList_(options) {

  options = options || {};

  if (typeof serverList_ === 'function') {

    return serverList_(
      RDG_EARNINGS_CONFIG.TABLE_KEY,
      options
    );
  }

  if (typeof getAllRecords === 'function') {

    return getAllRecords(
      rdgEarningGetTableName_()
    );
  }

  throw new Error(
    'Earnings list service is unavailable.'
  );
}


function rdgEarningUnwrap_(result) {

  if (!result) return null;

  if (result.success !== undefined &&
      result.data !== undefined) {

    return result.data;
  }

  if (result.data !== undefined &&
      result.record !== undefined) {

    return result.record;
  }

  if (result.record !== undefined) {
    return result.record;
  }

  return result;
}


/* ================================================================
 * WALLET HELPERS
 * ================================================================ */

function rdgEarningGetWalletAccount_(walletAccountId) {

  if (!walletAccountId) {
    throw new Error(
      'Wallet Account ID is required.'
    );
  }

  if (typeof getWalletAccount === 'function') {

    const result = getWalletAccount(
      walletAccountId
    );

    return rdgEarningUnwrap_(result);
  }

  if (typeof getRecord === 'function') {

    const config = rdgEarningGetConfig_();

    const table =
      config &&
      config.TABLES &&
      config.TABLES.WALLET_ACCOUNTS
        ? config.TABLES.WALLET_ACCOUNTS
        : 'WalletAccounts';

    return getRecord(
      table,
      walletAccountId
    );
  }

  throw new Error(
    'WalletAccounts service is unavailable.'
  );
}


function rdgEarningValidateWallet_(
  walletAccount,
  userId,
  companyId,
  currency
) {

  if (!walletAccount) {

    throw new Error(
      'Wallet account not found.'
    );
  }

  const status = String(
    walletAccount.Status ||
    walletAccount.status ||
    'ACTIVE'
  ).toUpperCase();

  if (status !== 'ACTIVE') {

    throw new Error(
      'Wallet account is not active.'
    );
  }

  const walletUser = String(
    walletAccount['User ID'] ||
    walletAccount.userId ||
    walletAccount.UserId ||
    ''
  );

  const walletCompany = String(
    walletAccount['Company ID'] ||
    walletAccount.companyId ||
    walletAccount.CompanyId ||
    ''
  );

  const walletCurrency = String(
    walletAccount['Currency Code'] ||
    walletAccount.currencyCode ||
    walletAccount.currency ||
    ''
  );

  if (walletUser !== String(userId)) {

    throw new Error(
      'Wallet account does not belong to the authenticated user.'
    );
  }

  if (
    companyId &&
    walletCompany &&
    walletCompany !== String(companyId)
  ) {

    throw new Error(
      'Wallet account company mismatch.'
    );
  }

  if (walletCurrency !== String(currency)) {

    throw new Error(
      'Wallet currency mismatch.'
    );
  }

  return true;
}


/* ================================================================
 * EARNING CALCULATION
 * ================================================================ */

function calculateEarningAmount(
  baseAmount,
  percentage
) {

  const base = rdgEarningRoundMoney_(baseAmount);
  const rate = rdgEarningNormalizePercentage_(percentage);

  if (base <= 0) {
    throw new Error(
      'Base amount must be greater than zero.'
    );
  }

  return rdgEarningRoundMoney_(
    base * rate / 100
  );
}


/* ================================================================
 * CREATE
 * ================================================================ */

function createEarning(data, options) {

  data = data || {};
  options = options || {};

  rdgEarningAuthorize_(
    'CREATE',
    data,
    options
  );

  const lock = rdgEarningLock_();

  try {

    const userId = rdgEarningUserId_();

    const companyId =
      rdgEarningCompanyContext_(options);

    const walletAccountId = String(
      data['Wallet Account ID'] ||
      data.walletAccountId ||
      ''
    ).trim();

    const currency = rdgEarningNormalizeCurrency_(
      data['Currency Code'] ||
      data.currencyCode
    );

    const earningType =
      rdgEarningNormalizeType_(
        data['Earning Type'] ||
        data.earningType
      );

    const referenceType = String(
      data['Reference Type'] ||
      data.referenceType ||
      RDG_EARNINGS_CONFIG.REFERENCE_TYPE
    ).trim().toUpperCase();

    const referenceId = String(
      data['Reference ID'] ||
      data.referenceId ||
      ''
    ).trim();

    if (!walletAccountId) {

      throw new Error(
        'Wallet Account ID is required.'
      );
    }

    if (!referenceId) {

      throw new Error(
        'Reference ID is required for idempotent earnings.'
      );
    }

    /*
     * Wallet must belong to authenticated user/company.
     */
    const walletAccount =
      rdgEarningGetWalletAccount_(
        walletAccountId
      );

    rdgEarningValidateWallet_(
      walletAccount,
      userId,
      companyId,
      currency
    );

    /*
     * Reference uniqueness.
     */
    const existing = findEarnings({
      referenceType: referenceType,
      referenceId: referenceId,
      companyId: companyId,
      _skipCreateAuth: true
    });

    if (
      existing &&
      existing.success &&
      existing.data &&
      existing.data.length
    ) {

      return {
        success: true,
        idempotent: true,
        data: existing.data[0]
      };
    }

    let amount;

    const baseAmount =
      data['Base Amount'] !== undefined
        ? data['Base Amount']
        : data.baseAmount;

    const percentage =
      data['Earning Percentage'] !== undefined
        ? data['Earning Percentage']
        : data.earningPercentage;

    if (
      baseAmount !== undefined &&
      baseAmount !== null &&
      Number(baseAmount) > 0
    ) {

      const normalizedBase =
        rdgEarningRoundMoney_(baseAmount);

      const normalizedPercentage =
        rdgEarningNormalizePercentage_(
          percentage || 0
        );

      amount =
        normalizedPercentage > 0
          ? calculateEarningAmount(
              normalizedBase,
              normalizedPercentage
            )
          : normalizedBase;

      data['Base Amount'] = normalizedBase;
      data['Earning Percentage'] =
        normalizedPercentage;

    } else {

      amount = rdgEarningNormalizeAmount_(
        data.Amount !== undefined
          ? data.Amount
          : data.amount
      );

      data['Base Amount'] = amount;
      data['Earning Percentage'] = 0;
    }

    const now = new Date();

    const id =
      typeof generateTableId === 'function'
        ? generateTableId(
            RDG_EARNINGS_CONFIG.TABLE_KEY
          )
        : Utilities.getUuid();

    const record = {

      ID: id,

      'Wallet Account ID':
        walletAccountId,

      'User ID':
        userId,

      'Company ID':
        companyId,

      'Currency Code':
        currency,

      'Base Amount':
        data['Base Amount'],

      'Earning Percentage':
        data['Earning Percentage'],

      Amount:
        amount,

      'Earning Type':
        earningType,

      'Earning Title':
        String(
          data['Earning Title'] ||
          data.earningTitle ||
          ''
        ).trim(),

      Source:
        String(
          data.Source ||
          data.source ||
          ''
        ).trim(),

      'Reference Type':
        referenceType,

      'Reference ID':
        referenceId,

      Description:
        String(
          data.Description ||
          data.description ||
          ''
        ).trim(),

      Status:
        'PENDING',

      'Earning Date':
        data['Earning Date'] ||
        data.earningDate ||
        now,

      'Wallet Transaction ID':
        '',

      'Approved At':
        '',

      'Approval Note':
        '',

      'Paid At':
        '',

      'Payment Note':
        '',

      'Reversal Wallet Transaction ID':
        '',

      'Reversed At':
        '',

      'Reversal Reason':
        '',

      'Rejection Reason':
        '',

      'Rejected At':
        '',

      'Cancellation Reason':
        '',

      'Cancelled At':
        '',

      'Metadata JSON':
        data['Metadata JSON'] ||
        data.metadataJson ||
        '',

      'Created At':
        now,

      'Updated At':
        now
    };

    const result =
      rdgEarningCreateRecord_(record);

    const created =
      rdgEarningUnwrap_(result) || record;

    rdgEarningAudit_(
      'CREATE',
      null,
      created
    );

    return {
      success: true,
      data: created
    };

  } finally {

    lock.releaseLock();
  }
}


/* ================================================================
 * PERCENTAGE CREATE
 * ================================================================ */

function createEarningFromPercentage(
  data,
  baseAmount,
  percentage,
  options
) {

  data = Object.assign({}, data || {});

  data['Base Amount'] = baseAmount;
  data['Earning Percentage'] = percentage;

  return createEarning(
    data,
    options || {}
  );
}


/* ================================================================
 * APPROVE
 * ================================================================ */

function approveEarning(
  earningId,
  note,
  options
) {

  options = options || {};

  const lock = rdgEarningLock_();

  try {

    const current =
      rdgEarningUnwrap_(
        rdgEarningGetRecord_(earningId)
      );

    if (!current) {

      throw new Error(
        'Earning not found.'
      );
    }

    rdgEarningAuthorize_(
      'UPDATE',
      current,
      options
    );

    const companyId =
      rdgEarningCompanyContext_(options);

    if (
      String(current['Company ID']) !==
      String(companyId)
    ) {

      throw new Error(
        'Company access denied.'
      );
    }

    const status =
      rdgEarningNormalizeStatus_(
        current.Status
      );

    if (status !== 'PENDING') {

      if (status === 'APPROVED' ||
          status === 'PAID') {

        return {
          success: true,
          idempotent: true,
          data: current
        };
      }

      throw new Error(
        'Only PENDING earnings can be approved.'
      );
    }

    const updated = Object.assign(
      {},
      current,
      {
        Status: 'APPROVED',
        'Approved At': new Date(),
        'Approval Note': String(note || ''),
        'Updated At': new Date()
      }
    );

    const result =
      rdgEarningUpdateRecord_(
        earningId,
        updated
      );

    const record =
      rdgEarningUnwrap_(result) || updated;

    rdgEarningAudit_(
      'UPDATE',
      current,
      record
    );

    return {
      success: true,
      data: record
    };

  } finally {

    lock.releaseLock();
  }
}


/* ================================================================
 * PAY
 * ================================================================ */

function payEarning(
  earningId,
  paymentNote,
  options
) {

  options = options || {};

  const lock = rdgEarningLock_();

  try {

    const earning =
      rdgEarningUnwrap_(
        rdgEarningGetRecord_(earningId)
      );

    if (!earning) {

      throw new Error(
        'Earning not found.'
      );
    }

    rdgEarningAuthorize_(
      'UPDATE',
      earning,
      options
    );

    const companyId =
      rdgEarningCompanyContext_(options);

    if (
      String(earning['Company ID']) !==
      String(companyId)
    ) {

      throw new Error(
        'Company access denied.'
      );
    }

    const status =
      rdgEarningNormalizeStatus_(
        earning.Status
      );

    if (status === 'PAID') {

      return {
        success: true,
        idempotent: true,
        data: earning
      };
    }

    if (
      status !== 'APPROVED' &&
      status !== 'PENDING'
    ) {

      throw new Error(
        'Only PENDING or APPROVED earnings can be paid.'
      );
    }

    const currency =
      rdgEarningNormalizeCurrency_(
        earning['Currency Code']
      );

    const walletAccount =
      rdgEarningGetWalletAccount_(
        earning['Wallet Account ID']
      );

    rdgEarningValidateWallet_(
      walletAccount,
      earning['User ID'],
      companyId,
      currency
    );

    /*
     * Recover an existing WalletTransaction first.
     * This is the idempotency boundary.
     */
    let walletTransaction = null;

    if (
      typeof findWalletTransactions === 'function'
    ) {

      const existing =
        findWalletTransactions({
          'Reference Type':
            RDG_EARNINGS_CONFIG.REFERENCE_TYPE,
          'Reference ID':
            earning.ID
        });

      const rows =
        Array.isArray(existing)
          ? existing
          : (
              existing &&
              Array.isArray(existing.data)
                ? existing.data
                : []
            );

      walletTransaction =
        rows.find(function(tx) {

          return String(
            tx.Type ||
            tx['Transaction Type'] ||
            tx.type ||
            ''
          ).toUpperCase() === 'CREDIT' &&
          String(
            tx.Status ||
            tx.status ||
            ''
          ).toUpperCase() === 'COMPLETED';

        }) || null;
    }

    /*
     * Create WalletTransaction only when it does not exist.
     */
    if (!walletTransaction) {

      if (
        typeof createWalletTransaction !== 'function'
      ) {

        throw new Error(
          'WalletTransactions service is required for payment.'
        );
      }

      const txResult =
        createWalletTransaction({

          'Wallet Account ID':
            earning['Wallet Account ID'],

          'User ID':
            earning['User ID'],

          'Company ID':
            earning['Company ID'],

          'Currency Code':
            currency,

          Amount:
            rdgEarningNormalizeAmount_(
              earning.Amount
            ),

          Type:
            'CREDIT',

          Status:
            'COMPLETED',

          'Reference Type':
            RDG_EARNINGS_CONFIG.REFERENCE_TYPE,

          'Reference ID':
            earning.ID,

          Description:
            'Earning payment: ' +
            String(
              earning['Earning Title'] || ''
            ),

          'Created At':
            new Date(),

          'Updated At':
            new Date()
        });

      walletTransaction =
        rdgEarningUnwrap_(txResult);
    }

    if (!walletTransaction) {

      throw new Error(
        'Wallet transaction could not be created.'
      );
    }

    const updated = Object.assign(
      {},
      earning,
      {
        Status: 'PAID',

        'Wallet Transaction ID':
          walletTransaction.ID ||
          walletTransaction.id ||
          walletTransaction['ID'],

        'Paid At':
          new Date(),

        'Payment Note':
          String(paymentNote || ''),

        'Updated At':
          new Date()
      }
    );

    const result =
      rdgEarningUpdateRecord_(
        earningId,
        updated
      );

    const record =
      rdgEarningUnwrap_(result) || updated;

    rdgEarningAudit_(
      'UPDATE',
      earning,
      record
    );

    return {
      success: true,
      data: record,
      walletTransaction: walletTransaction
    };

  } finally {

    lock.releaseLock();
  }
}


/* ================================================================
 * REJECT
 * ================================================================ */

function rejectEarning(
  earningId,
  reason,
  options
) {

  options = options || {};

  const lock = rdgEarningLock_();

  try {

    const current =
      rdgEarningUnwrap_(
        rdgEarningGetRecord_(earningId)
      );

    if (!current) {
      throw new Error('Earning not found.');
    }

    rdgEarningAuthorize_(
      'UPDATE',
      current,
      options
    );

    const companyId =
      rdgEarningCompanyContext_(options);

    if (
      String(current['Company ID']) !==
      String(companyId)
    ) {

      throw new Error(
        'Company access denied.'
      );
    }

    if (
      String(current.Status).toUpperCase() ===
      'PAID'
    ) {

      throw new Error(
        'Paid earnings cannot be rejected.'
      );
    }

    const updated = Object.assign(
      {},
      current,
      {
        Status: 'REJECTED',
        'Rejection Reason':
          String(reason || ''),
        'Rejected At':
          new Date(),
        'Updated At':
          new Date()
      }
    );

    const result =
      rdgEarningUpdateRecord_(
        earningId,
        updated
      );

    const record =
      rdgEarningUnwrap_(result) || updated;

    rdgEarningAudit_(
      'UPDATE',
      current,
      record
    );

    return {
      success: true,
      data: record
    };

  } finally {

    lock.releaseLock();
  }
}


/* ================================================================
 * CANCEL
 * ================================================================ */

function cancelEarning(
  earningId,
  reason,
  options
) {

  options = options || {};

  const lock = rdgEarningLock_();

  try {

    const current =
      rdgEarningUnwrap_(
        rdgEarningGetRecord_(earningId)
      );

    if (!current) {
      throw new Error('Earning not found.');
    }

    rdgEarningAuthorize_(
      'UPDATE',
      current,
      options
    );

    const companyId =
      rdgEarningCompanyContext_(options);

    if (
      String(current['Company ID']) !==
      String(companyId)
    ) {

      throw new Error(
        'Company access denied.'
      );
    }

    const status =
      String(current.Status).toUpperCase();

    if (status === 'PAID') {

      throw new Error(
        'Paid earning must be reversed, not cancelled.'
      );
    }

    if (status === 'REVERSED') {

      throw new Error(
        'Reversed earning cannot be cancelled.'
      );
    }

    const updated = Object.assign(
      {},
      current,
      {
        Status: 'CANCELLED',

        'Cancellation Reason':
          String(reason || ''),

        'Cancelled At':
          new Date(),

        'Updated At':
          new Date()
      }
    );

    const result =
      rdgEarningUpdateRecord_(
        earningId,
        updated
      );

    const record =
      rdgEarningUnwrap_(result) || updated;

    rdgEarningAudit_(
      'UPDATE',
      current,
      record
    );

    return {
      success: true,
      data: record
    };

  } finally {

    lock.releaseLock();
  }
}


/* ================================================================
 * REVERSE
 * ================================================================ */

function reverseEarning(
  earningId,
  reason,
  options
) {

  options = options || {};

  const lock = rdgEarningLock_();

  try {

    const earning =
      rdgEarningUnwrap_(
        rdgEarningGetRecord_(earningId)
      );

    if (!earning) {
      throw new Error('Earning not found.');
    }

    rdgEarningAuthorize_(
      'UPDATE',
      earning,
      options
    );

    const companyId =
      rdgEarningCompanyContext_(options);

    if (
      String(earning['Company ID']) !==
      String(companyId)
    ) {

      throw new Error(
        'Company access denied.'
      );
    }

    if (
      String(earning.Status).toUpperCase() ===
      'REVERSED'
    ) {

      return {
        success: true,
        idempotent: true,
        data: earning
      };
    }

    if (
      String(earning.Status).toUpperCase() !==
      'PAID'
    ) {

      throw new Error(
        'Only PAID earnings can be reversed.'
      );
    }

    const transactionId =
      String(
        earning['Wallet Transaction ID'] || ''
      ).trim();

    if (!transactionId) {

      throw new Error(
        'Wallet transaction is missing; reconciliation required.'
      );
    }

    if (
      typeof reverseWalletTransaction !==
      'function'
    ) {

      throw new Error(
        'Wallet reversal service is unavailable.'
      );
    }

    const reversal =
      reverseWalletTransaction(
        transactionId,
        String(reason || 'Earning reversal')
      );

    const reversalRecord =
      rdgEarningUnwrap_(reversal);

    if (!reversalRecord) {

      throw new Error(
        'Wallet transaction reversal failed.'
      );
    }

    const updated = Object.assign(
      {},
      earning,
      {
        Status: 'REVERSED',

        'Reversal Wallet Transaction ID':
          reversalRecord.ID ||
          reversalRecord.id ||
          '',

        'Reversed At':
          new Date(),

        'Reversal Reason':
          String(reason || ''),

        'Updated At':
          new Date()
      }
    );

    const result =
      rdgEarningUpdateRecord_(
        earningId,
        updated
      );

    const record =
      rdgEarningUnwrap_(result) || updated;

    rdgEarningAudit_(
      'UPDATE',
      earning,
      record
    );

    return {
      success: true,
      data: record,
      reversal: reversalRecord
    };

  } finally {

    lock.releaseLock();
  }
}


/* ================================================================
 * READ
 * ================================================================ */

function getEarning(
  earningId,
  options
) {

  options = options || {};

  rdgEarningAuthorize_(
    'GET',
    null,
    options
  );

  const record =
    rdgEarningUnwrap_(
      rdgEarningGetRecord_(earningId)
    );

  if (!record) {
    return {
      success: false,
      data: null
    };
  }

  const companyId =
    rdgEarningCompanyContext_(options);

  if (
    !rdgEarningIsSystemUser_(
      rdgEarningCurrentUser_()
    ) &&
    String(record['Company ID']) !==
    String(companyId)
  ) {

    throw new Error(
      'Company access denied.'
    );
  }

  return {
    success: true,
    data: record
  };
}


/* ================================================================
 * LIST
 * ================================================================ */

function getAllEarnings(options) {

  options = options || {};

  rdgEarningAuthorize_(
    'LIST',
    null,
    options
  );

  const companyId =
    rdgEarningCompanyContext_(options);

  const pageSize = Math.min(
    Number(
      options.pageSize ||
      RDG_EARNINGS_CONFIG.DEFAULT_PAGE_SIZE
    ),
    RDG_EARNINGS_CONFIG.MAX_PAGE_SIZE
  );

  const page =
    Math.max(
      1,
      Number(options.page || 1)
    );

  let result;

  if (typeof serverList_ === 'function') {

    result =
      serverList_(
        RDG_EARNINGS_CONFIG.TABLE_KEY,
        {
          page: page,
          pageSize: pageSize,
          filters: {
            'Company ID': companyId
          },
          sortBy:
            options.sortBy || 'Created At',
          sortDirection:
            options.sortDirection || 'desc'
        }
      );

  } else {

    result =
      rdgEarningList_(
        options
      );
  }

  let rows =
    Array.isArray(result)
      ? result
      : (
          result &&
          Array.isArray(result.data)
            ? result.data
            : []
        );

  rows = rows.filter(function(row) {

    return String(
      row['Company ID'] || ''
    ) === String(companyId);

  });

  if (options.status) {

    const status =
      rdgEarningNormalizeStatus_(
        options.status
      );

    rows = rows.filter(function(row) {

      return String(row.Status || '')
        .toUpperCase() === status;

    });
  }

  if (options.currencyCode) {

    const currency =
      rdgEarningNormalizeCurrency_(
        options.currencyCode
      );

    rows = rows.filter(function(row) {

      return String(
        row['Currency Code'] || ''
      ) === currency;

    });
  }

  if (options.earningType) {

    const type =
      rdgEarningNormalizeType_(
        options.earningType
      );

    rows = rows.filter(function(row) {

      return String(
        row['Earning Type'] || ''
      ).toUpperCase() === type;

    });
  }

  return {
    success: true,
    data: rows,
    page: page,
    pageSize: pageSize,
    hasMore:
      result && result.hasMore !== undefined
        ? Boolean(result.hasMore)
        : rows.length >= pageSize
  };
}


/* ================================================================
 * FIND
 * ================================================================ */

function findEarnings(filters, options) {

  filters = filters || {};
  options = options || {};

  const companyId =
    rdgEarningCompanyContext_(
      options.companyId
        ? Object.assign({}, options, {
            companyId: options.companyId
          })
        : options
    );

  rdgEarningAuthorize_(
    'LIST',
    null,
    options
  );

  let result;

  if (typeof serverList_ === 'function') {

    const serverFilters = {
      'Company ID': companyId
    };

    if (
      filters.referenceType ||
      filters['Reference Type']
    ) {

      serverFilters['Reference Type'] =
        String(
          filters.referenceType ||
          filters['Reference Type']
        ).toUpperCase();
    }

    if (
      filters.referenceId ||
      filters['Reference ID']
    ) {

      serverFilters['Reference ID'] =
        String(
          filters.referenceId ||
          filters['Reference ID']
        );
    }

    if (
      filters.currencyCode ||
      filters['Currency Code']
    ) {

      serverFilters['Currency Code'] =
        rdgEarningNormalizeCurrency_(
          filters.currencyCode ||
          filters['Currency Code']
        );
    }

    result =
      serverList_(
        RDG_EARNINGS_CONFIG.TABLE_KEY,
        {
          page: 1,
          pageSize:
            Math.min(
              Number(
                options.pageSize ||
                RDG_EARNINGS_CONFIG.MAX_PAGE_SIZE
              ),
              RDG_EARNINGS_CONFIG.MAX_PAGE_SIZE
            ),
          filters: serverFilters
        }
      );

  } else {

    result =
      rdgEarningList_(
        Object.assign({}, filters, {
          'Company ID': companyId
        })
      );
  }

  let rows =
    Array.isArray(result)
      ? result
      : (
          result &&
          Array.isArray(result.data)
            ? result.data
            : []
        );

  rows = rows.filter(function(row) {

    if (
      String(row['Company ID'] || '') !==
      String(companyId)
    ) {
      return false;
    }

    if (
      filters.status &&
      String(row.Status || '').toUpperCase() !==
      String(filters.status).toUpperCase()
    ) {
      return false;
    }

    if (
      filters.earningType &&
      String(row['Earning Type'] || '').toUpperCase() !==
      String(filters.earningType).toUpperCase()
    ) {
      return false;
    }

    if (
      filters.walletAccountId &&
      String(row['Wallet Account ID'] || '') !==
      String(filters.walletAccountId)
    ) {
      return false;
    }

    if (
      filters.userId &&
      String(row['User ID'] || '') !==
      String(filters.userId)
    ) {
      return false;
    }

    return true;
  });

  return {
    success: true,
    data: rows
  };
}


/* ================================================================
 * FILTER HELPERS
 * ================================================================ */

function getEarningsByWalletAccount(
  walletAccountId,
  options
) {

  return findEarnings(
    {
      walletAccountId:
        walletAccountId
    },
    options || {}
  );
}


function getEarningsByUser(
  userId,
  options
) {

  options = options || {};

  /*
   * User cannot request another user's earnings unless
   * system/admin authorization is already granted.
   */
  rdgEarningAuthorize_(
    'LIST',
    null,
    options
  );

  return findEarnings(
    {
      userId: userId
    },
    options
  );
}


function getEarningsByCompany(
  companyId,
  options
) {

  options = Object.assign(
    {},
    options || {},
    {
      companyId: companyId
    }
  );

  return findEarnings(
    {},
    options
  );
}


function getEarningsByCurrency(
  currencyCode,
  options
) {

  return findEarnings(
    {
      currencyCode: currencyCode
    },
    options || {}
  );
}


function getEarningsByStatus(
  status,
  options
) {

  return findEarnings(
    {
      status: status
    },
    options || {}
  );
}


function getEarningsByType(
  earningType,
  options
) {

  return findEarnings(
    {
      earningType: earningType
    },
    options || {}
  );
}


function findEarningByReference(
  referenceType,
  referenceId,
  options
) {

  return findEarnings(
    {
      referenceType: referenceType,
      referenceId: referenceId
    },
    options || {}
  );
}


/* ================================================================
 * LATEST / COUNT / EXISTS
 * ================================================================ */

function getLatestEarning(options) {

  const result =
    getAllEarnings(
      Object.assign(
        {},
        options || {},
        {
          page: 1,
          pageSize: 1,
          sortBy: 'Created At',
          sortDirection: 'desc'
        }
      )
    );

  return {
    success: true,
    data:
      result.data &&
      result.data.length
        ? result.data[0]
        : null
  };
}


function countEarnings(options) {

  options = options || {};

  rdgEarningAuthorize_(
    'LIST',
    null,
    options
  );

  /*
   * Prefer server-side count if available.
   */
  if (typeof countRecords === 'function') {

    try {

      const table =
        rdgEarningGetTableName_();

      const result =
        countRecords(
          table,
          Object.assign(
            {},
            options.filters || {},
            {
              'Company ID':
                rdgEarningCompanyContext_(options)
            }
          )
        );

      if (Number.isFinite(Number(result))) {

        return {
          success: true,
          count: Number(result),
          exact: true
        };
      }

    } catch (ignore) {}
  }

  const result =
    getAllEarnings(
      Object.assign(
        {},
        options,
        {
          page: 1,
          pageSize:
            RDG_EARNINGS_CONFIG.MAX_PAGE_SIZE
        }
      )
    );

  return {
    success: true,
    count: result.data.length,
    exact: !result.hasMore
  };
}


function earningExists(
  earningId,
  options
) {

  const result =
    getEarning(
      earningId,
      options || {}
    );

  return Boolean(
    result &&
    result.success &&
    result.data
  );
}


/* ================================================================
 * CURRENCY-AWARE TOTALS
 * ================================================================ */

/**
 * Returns totals grouped by currency.
 *
 * IMPORTANT:
 * We NEVER add USD + PKR + MasterDiamond together.
 */
function getTotalEarningsByCompany(
  companyId,
  options
) {

  options = Object.assign(
    {},
    options || {},
    {
      companyId: companyId
    }
  );

  const result =
    getEarningsByCompany(
      companyId,
      options
    );

  const totals = {};
  const rows = result.data || [];

  rows.forEach(function(row) {

    const status =
      String(row.Status || '')
        .toUpperCase();

    if (
      status !== 'PAID' &&
      status !== 'APPROVED'
    ) {
      return;
    }

    const currency =
      String(
        row['Currency Code'] || ''
      );

    if (!currency) return;

    totals[currency] =
      rdgEarningRoundMoney_(
        Number(totals[currency] || 0) +
        Number(row.Amount || 0)
      );
  });

  return {
    success: true,
    companyId: companyId,
    totalsByCurrency: totals,
    exact:
      result.hasMore === false
  };
}


function getTotalEarningsByUser(
  userId,
  options
) {

  const result =
    getEarningsByUser(
      userId,
      options || {}
    );

  const totals = {};

  (result.data || []).forEach(function(row) {

    const status =
      String(row.Status || '')
        .toUpperCase();

    if (
      status !== 'PAID' &&
      status !== 'APPROVED'
    ) {
      return;
    }

    const currency =
      String(
        row['Currency Code'] || ''
      );

    if (!currency) return;

    totals[currency] =
      rdgEarningRoundMoney_(
        Number(totals[currency] || 0) +
        Number(row.Amount || 0)
      );
  });

  return {
    success: true,
    userId: userId,
    totalsByCurrency: totals,
    exact:
      result.hasMore === false
  };
}


function getTotalEarningsByWalletAccount(
  walletAccountId,
  options
) {

  const result =
    getEarningsByWalletAccount(
      walletAccountId,
      options || {}
    );

  const totals = {};

  (result.data || []).forEach(function(row) {

    const status =
      String(row.Status || '')
        .toUpperCase();

    if (
      status !== 'PAID' &&
      status !== 'APPROVED'
    ) {
      return;
    }

    const currency =
      String(
        row['Currency Code'] || ''
      );

    if (!currency) return;

    totals[currency] =
      rdgEarningRoundMoney_(
        Number(totals[currency] || 0) +
        Number(row.Amount || 0)
      );
  });

  return {
    success: true,
    walletAccountId: walletAccountId,
    totalsByCurrency: totals,
    exact:
      result.hasMore === false
  };
}


function getTotalEarningBaseAmountByCompany(
  companyId,
  options
) {

  options = Object.assign(
    {},
    options || {},
    {
      companyId: companyId
    }
  );

  const result =
    getEarningsByCompany(
      companyId,
      options
    );

  const totals = {};

  (result.data || []).forEach(function(row) {

    const currency =
      String(
        row['Currency Code'] || ''
      );

    if (!currency) return;

    totals[currency] =
      rdgEarningRoundMoney_(
        Number(totals[currency] || 0) +
        Number(row['Base Amount'] || 0)
      );
  });

  return {
    success: true,
    companyId: companyId,
    totalsByCurrency: totals,
    exact:
      result.hasMore === false
  };
}


/* ================================================================
 * DELETE = CANCEL
 * ================================================================ */

function deleteEarning(
  earningId,
  reason,
  options
) {

  return cancelEarning(
    earningId,
    reason || 'Deleted through legacy API',
    options || {}
  );
}


/* ================================================================
 * HEALTH
 * ================================================================ */

function earningsHealthCheck() {

  const checks = [];

  checks.push({
    name: 'version',
    success:
      RDG_EARNINGS_CONFIG.VERSION === '4.4.0'
  });

  checks.push({
    name: 'currencyRegistry',
    success:
      getGamingCurrencyList().length === RDG_EARNINGS_CONFIG.EXPECTED_GAMING_CURRENCY_COUNT
  });

  checks.push({
    name: 'masterCurrencies',
    success:
      getMasterCurrencyList().length === 5
  });

  checks.push({
    name: 'superCurrencies',
    success:
      getSuperCurrencyList().length === 5
  });

  checks.push({
    name: 'standardCurrencies',
    success:
      getStandardGamingCurrencyList().length === 5
  });

  checks.push({
    name: 'rdgServer',
    success:
      typeof authorizeServerOperation_ === 'function'
  });

  checks.push({
    name: 'walletService',
    success:
      typeof createWalletTransaction === 'function'
  });

  checks.push({
    name: 'audit',
    success:
      typeof createAuditLog === 'function'
  });

  return {
    success:
      checks.every(function(check) {
        return check.success;
      }),

    version:
      RDG_EARNINGS_CONFIG.VERSION,

    module:
      RDG_EARNINGS_CONFIG.MODULE,

    checks: checks
  };
}


/* ================================================================
 * INFO
 * ================================================================ */

function getEarningsInfo() {

  return {
    success: true,

    module:
      RDG_EARNINGS_CONFIG.MODULE,

    version:
      RDG_EARNINGS_CONFIG.VERSION,

    phase:
      RDG_EARNINGS_CONFIG.PHASE,

    tableKey:
      RDG_EARNINGS_CONFIG.TABLE_KEY,

    statuses:
      RDG_EARNINGS_CONFIG.STATUSES.slice(),

    earningTypes:
      RDG_EARNINGS_CONFIG.EARNING_TYPES.slice(),

    gamingCurrencies:
      getGamingCurrencyList(),

    masterCurrencies:
      getMasterCurrencyList(),

    superCurrencies:
      getSuperCurrencyList(),

    standardCurrencies:
      getStandardGamingCurrencyList(),

    fiatCurrencies:
      RDG_EARNINGS_CONFIG.FIAT_CURRENCIES.slice(),

    architecture: {

      masterCurrencyRole:
        'PRIMARY_GAMING_MONEY',

      purchaseFlow:
        'REAL_MONEY -> MASTER_CURRENCY',

      spendingFlow:
        'MASTER_CURRENCY -> GAMING_ECONOMY',

      earningFlow:
        'GAME/CHAT/SALE/REWARD -> EARNING -> WALLET',

      settlement:
        'WalletTransactions -> WalletAccounts'
    },

    physicalDelete:
      false,

    serverAuthorization:
      true,

    companyIsolation:
      true,

    currencyIsolation:
      true
  };
}


/* ================================================================
 * API
 * ================================================================ */

function earningsApi(action, payload) {

  payload = payload || {};

  switch (
    String(action || '')
      .trim()
      .toUpperCase()
  ) {

    case 'CREATE':
      return createEarning(
        payload.data || payload,
        payload.options || {}
      );

    case 'GET':
      return getEarning(
        payload.id,
        payload.options || {}
      );

    case 'LIST':
      return getAllEarnings(
        payload.options || payload
      );

    case 'APPROVE':
      return approveEarning(
        payload.id,
        payload.note,
        payload.options || {}
      );

    case 'PAY':
      return payEarning(
        payload.id,
        payload.note,
        payload.options || {}
      );

    case 'REJECT':
      return rejectEarning(
        payload.id,
        payload.reason,
        payload.options || {}
      );

    case 'CANCEL':
      return cancelEarning(
        payload.id,
        payload.reason,
        payload.options || {}
      );

    case 'REVERSE':
      return reverseEarning(
        payload.id,
        payload.reason,
        payload.options || {}
      );

    case 'CURRENCIES':
      return {
        success: true,
        gaming:
          getGamingCurrencyList(),
        master:
          getMasterCurrencyList(),
        super:
          getSuperCurrencyList(),
        standard:
          getStandardGamingCurrencyList(),
        fiat:
          RDG_EARNINGS_CONFIG.FIAT_CURRENCIES.slice()
      };

    case 'CURRENCY':
      return rdgCurrencyHelper(
        payload.currencyCode
      );

    case 'HEALTH':
      return earningsHealthCheck();

    case 'INFO':
      return getEarningsInfo();

    default:
      throw new Error(
        'Unsupported Earnings API action: ' +
        action
      );
  }
}


/* ================================================================
 * COMPATIBILITY
 * ================================================================ */

function getEarningInfo() {
  return getEarningsInfo();
}


/* ================================================================
 * CONTRACT TESTS
 * ================================================================ */

function testEarningsCurrencyRegistryContract() {

  var expected = [
    'BlackGold',
    'SuperBlackGold',
    'MasterBlackGold',
    'Silver',
    'SuperSilver',
    'MasterSilver',
    'WhiteGold',
    'SuperWhiteGold',
    'MasterWhiteGold',
    'Ston',
    'SuperSton',
    'MasterSton',
    'RadGold',
    'SuperRedGold',
    'MasterRedGold',
    'Crown',
    'SuperCrown',
    'MasterCrown',
    'GreenGold',
    'SuperGreenGold',
    'MasterGreenGold',
    'Coin',
    'SuperCoin',
    'MasterCoin',
    'Gold',
    'SuperGold',
    'MasterGold',
    'Diamond',
    'SuperDiamond',
    'MasterDiamond'
  ];

  var actual = getGamingCurrencyList();
  var same = JSON.stringify(expected) === JSON.stringify(actual);

  if (!same) {
    throw new Error(
      'Gaming currency registry mismatch. Expected canonical 30-currency order.'
    );
  }

  return {
    success: true,
    count: actual.length,
    currencies: actual,
    authority: RDG_EARNINGS_CONFIG.GAMING_CURRENCY_AUTHORITY
  };
}


function testEarningsCurrencyRateContract() {

  if (typeof rdgGetGamingCurrencyRatePercent !== 'function') {
    throw new Error(
      'RDEconomyCurrency/RDGUtils rate authority is unavailable.'
    );
  }

  var blackGold = rdgGetGamingCurrencyRatePercent('BLACKGOLD');
  var masterDiamond = rdgGetGamingCurrencyRatePercent('MASTERDIAMOND');
  var formula = typeof rdgGetCurrencyRateFormula === 'function'
    ? rdgGetCurrencyRateFormula()
    : '';

  if (blackGold !== 2) {
    throw new Error('BlackGold rate must be 2%.');
  }

  if (masterDiamond !== 60) {
    throw new Error('MasterDiamond rate must be 60%.');
  }

  if (formula !== 'Currency Position × 2%') {
    throw new Error('Canonical currency rate formula mismatch.');
  }

  return {
    success: true,
    blackGold: blackGold,
    masterDiamond: masterDiamond,
    formula: formula
  };
}


function testEarningsMasterCurrencyContract() {

  const master =
    getMasterCurrencyList();

  if (master.length !== 10) {

    throw new Error(
      'Master currency count must be 10.'
    );
  }

  master.forEach(function(currency) {

    if (!isMasterCurrency(currency)) {

      throw new Error(
        'Invalid Master currency: ' +
        currency
      );
    }

  });

  return {
    success: true,
    currencies: master
  };
}


function testEarningsCurrencyTierContract() {

  if (
    !isMasterCurrency('MasterDiamond')
  ) {
    throw new Error(
      'MasterDiamond must be MASTER.'
    );
  }

  if (
    !isSuperCurrency('SuperDiamond')
  ) {
    throw new Error(
      'SuperDiamond must be SUPER.'
    );
  }

  if (
    !isStandardGamingCurrency('Diamond')
  ) {
    throw new Error(
      'Diamond must be STANDARD.'
    );
  }

  if (
    !isFiatCurrency('PKR')
  ) {
    throw new Error(
      'PKR must be FIAT.'
    );
  }

  return {
    success: true
  };
}


function testEarningsLegacyCurrencyContract() {

  if (
    normalizeLegacyGamingCurrency('MD') !==
    'MasterDiamond'
  ) {
    throw new Error('Legacy MD mapping failed.');
  }

  if (
    normalizeLegacyGamingCurrency('MC') !==
    'MasterCoin'
  ) {
    throw new Error('Legacy MC mapping failed.');
  }

  if (
    normalizeLegacyGamingCurrency('MS') !==
    'MasterSilver'
  ) {
    throw new Error('Legacy MS mapping failed.');
  }

  var rejected = false;
  try {
    normalizeLegacyGamingCurrency('STONE');
  } catch (error) {
    rejected = true;
  }

  if (!rejected) {
    throw new Error('STONE alias must be rejected; canonical spelling is Ston.');
  }

  return {
    success: true,
    stoneAliasRejected: true
  };
}


function testEarningsCalculationContract() {

  const amount =
    calculateEarningAmount(
      1000,
      10
    );

  if (amount !== 100) {

    throw new Error(
      'Earning percentage calculation failed.'
    );
  }

  return {
    success: true,
    amount: amount
  };
}


function testEarningsMoneyContract() {

  const amount =
    rdgEarningRoundMoney_(10.555);

  if (amount !== 10.56) {

    throw new Error(
      'Money rounding contract failed.'
    );
  }

  return {
    success: true,
    amount: amount
  };
}


function testEarningsApiContract() {

  const info =
    earningsApi('INFO');

  if (
    !info ||
    info.version !== '4.4.0'
  ) {

    throw new Error(
      'Earnings INFO API contract failed.'
    );
  }

  return {
    success: true
  };
}


function testEarnings() {

  const tests = [
    testEarningsCurrencyRegistryContract,
    testEarningsMasterCurrencyContract,
    testEarningsCurrencyTierContract,
    testEarningsCurrencyRateContract,
    testEarningsLegacyCurrencyContract,
    testEarningsCalculationContract,
    testEarningsMoneyContract,
    testEarningsApiContract
  ];

  const results = [];

  tests.forEach(function(test) {

    try {

      results.push({
        name: test.name,
        success: true,
        result: test()
      });

    } catch (error) {

      results.push({
        name: test.name,
        success: false,
        error:
          rdgEarningSafeError_(error)
      });
    }

  });

  return {
    success:
      results.every(function(item) {
        return item.success;
      }),

    version:
      RDG_EARNINGS_CONFIG.VERSION,

    total:
      results.length,

    passed:
      results.filter(function(item) {
        return item.success;
      }).length,

    failed:
      results.filter(function(item) {
        return !item.success;
      }).length,

    results: results
  };
}


/* ================================================================
 * OPTIONAL RUNTIME READ TEST
 * ================================================================ */

function testEarningsRuntimeRead(options) {

  options = options || {};

  const result =
    getAllEarnings(
      Object.assign(
        {},
        options,
        {
          page: 1,
          pageSize: 1
        }
      )
    );

  return {
    success: true,
    runtime: true,
    rows:
      result.data
        ? result.data.length
        : 0
  };
}


/* ================================================================
 * MASTER RUNTIME DIAGNOSTIC
 * ================================================================ */

function testEarningsRuntimeVisible(options) {

  options = options || {};

  var contract = testEarnings();
  var health;
  var read = null;
  var errors = [];

  try {
    health = earningsHealthCheck();
  } catch (error) {
    health = {
      success: false,
      error: rdgEarningSafeError_(error)
    };
    errors.push(health.error);
  }

  if (options.read === true) {
    try {
      read = testEarningsRuntimeRead(options);
    } catch (error2) {
      read = {
        success: false,
        error: rdgEarningSafeError_(error2)
      };
      errors.push(read.error);
    }
  }

  var rateTest = null;
  try {
    rateTest = testEarningsCurrencyRateContract();
  } catch (error3) {
    rateTest = {
      success: false,
      error: rdgEarningSafeError_(error3)
    };
    errors.push(rateTest.error);
  }

  var result = {
    success:
      contract.success === true &&
      health.success === true &&
      rateTest.success === true &&
      errors.length === 0,
    passed:
      contract.success === true &&
      health.success === true &&
      rateTest.success === true &&
      errors.length === 0,
    version: RDG_EARNINGS_CONFIG.VERSION,
    runtimeMarker: RDG_EARNINGS_CONFIG.RUNTIME_MARKER,
    authority: 'Earnings.gs',
    gamingCurrencyAuthority: RDG_EARNINGS_CONFIG.GAMING_CURRENCY_AUTHORITY,
    contract: contract,
    health: health,
    rateContract: rateTest,
    runtimeRead: read,
    errors: errors
  };

  if (result.passed) {
    Logger.log('=== RDG EARNINGS MASTER RUNTIME PASS ===');
  } else {
    Logger.log('=== RDG EARNINGS MASTER RUNTIME FAIL ===');
  }

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}


/* ================================================================
 * END
 * ================================================================ */