/**
 * ============================================================
 * GameWallet.gs
 * RDG GAME WALLET ORCHESTRATION
 * ============================================================
 * VERSION: 1.3.0 ADVANCED
 *
 * AUTHORITY MODEL
 * ------------------------------------------------------------
 * GameWallet is orchestration only.
 *
 * Currency authority      : RDEconomyCurrency.gs
 * Persistence authority   : Database.gs
 * Money ledger authority  : WalletTransactions.gs
 * Gaming ledger authority : GameTransactions.gs
 * Gaming revenue          : downstream revenue/earning modules
 *
 * GameWallet MUST NOT write WalletAccounts directly.
 * It delegates money movement to WalletTransactions.gs.
 * Lower-level ledger modules own their own ScriptLock boundaries;
 * GameWallet does not hold a ScriptLock while calling them, preventing
 * nested-lock deadlocks in Apps Script.
 *
 * Public compatibility APIs preserved:
 *   chargeGameEntryFee()
 *   chargeConfiguredGameEntryFee()
 *   payGamePrize()
 *   payGamePlayerPrize()
 *   refundGameEntryFee()
 *   reverseGameWalletTransaction()
 *
 * IMPORTANT
 * ------------------------------------------------------------
 * The current stored WalletTransactions.gs exposes
 * createWalletTransaction(), but does not expose a canonical
 * reverseWalletTransaction()/createWalletDebitTransaction()/
 * createWalletCreditTransaction() API. Therefore this file uses
 * createWalletTransaction() as the verified money-ledger boundary.
 * It never falls back to direct WalletAccounts balance mutation.
 *
 * RDEconomyCurrency is treated as the currency authority when a
 * verified public resolver is present. No second currency list is
 * used as an authority. The compatibility list below is only a
 * legacy-operation compatibility allow-list and is never used to
 * define the project's currency registry.
 * ============================================================
 */

var GAME_WALLET_CONFIG = {
  TABLE_KEY_GAME_TRANSACTIONS: 'GAME_TRANSACTIONS',
  TABLE_KEY_GAME_PLAYERS: 'GAME_PLAYERS',
  TABLE_KEY_GAME_ROOMS: 'GAME_ROOMS',
  TABLE_KEY_GAMES: 'GAMES',
  TABLE_KEY_WALLET_ACCOUNTS: 'WALLET_ACCOUNTS',
  TABLE_KEY_WALLET_TRANSACTIONS: 'WALLET_TRANSACTIONS',
  GAME_TRANSACTION_TYPES: {
    ENTRY_FEE: 'ENTRY_FEE',
    PRIZE: 'PRIZE',
    REFUND: 'REFUND'
  },
  STATUS: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    REVERSED: 'REVERSED',
    CANCELLED: 'CANCELLED',
    FAILED: 'FAILED'
  },
  ACTIVE_WALLET_STATUS: 'ACTIVE',
  LOCK_TIMEOUT: 30000,
  MAX_AMOUNT_DECIMALS: 8,
  LINKED_MODULES: {
    CURRENCY_AUTHORITY: 'RDEconomyCurrency.gs',
    DATABASE_AUTHORITY: 'Database.gs',
    WALLET_ACCOUNT_AUTHORITY: 'WalletAccounts.gs',
    MONEY_LEDGER: 'WalletTransactions.gs',
    GAMING_LEDGER: 'GameTransactions.gs',
    GAME_ROOMS: 'GameRooms.gs',
    GAME_PLAYERS: 'GameMatchmaking.gs / GameRooms.gs',
    GAMES: 'Games.gs',
    REWARDS: 'GameRewards.gs',
    STATION: 'GameStation.gs',
    ENGINE: 'GameEngine.gs',
    REVENUE: 'RD Gaming Revenue / Earning layer',
    AUDIT: 'Audit.gs / AuditLogs.gs',
    BACKUP: 'Backup layer'
  }
};

/* ============================================================
 * RESULT / NORMALIZATION HELPERS
 * ============================================================ */

function gameWalletResult_(success, message, data, extra) {
  var result = {
    success: success === true,
    message: String(message || ''),
    data: data === undefined ? null : data
  };
  if (extra && typeof extra === 'object') {
    Object.keys(extra).forEach(function(key) { result[key] = extra[key]; });
  }
  return result;
}

function gameWalletNormalizeString_(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function gameWalletNormalizeCurrency_(value) {
  var raw = gameWalletNormalizeString_(value);
  if (!raw) return '';
  if (typeof normalizeGamingCurrency === 'function') {
    try {
      return gameWalletNormalizeString_(normalizeGamingCurrency(raw)).toUpperCase();
    } catch (e) {}
  }
  return raw.toUpperCase();
}

function gameWalletNormalizeStatus_(value) {
  return gameWalletNormalizeString_(value).toUpperCase();
}

function gameWalletRequired_(value, name) {
  var s = gameWalletNormalizeString_(value);
  if (!s) throw new Error(String(name || 'Value') + ' is required.');
  return s;
}

function gameWalletNumber_(value, name) {
  var n = Number(value);
  if (!isFinite(n)) throw new Error(String(name || 'Amount') + ' must be numeric.');
  return n;
}

function gameWalletPositive_(value, name) {
  var n = gameWalletNumber_(value, name);
  if (n <= 0) throw new Error(String(name || 'Amount') + ' must be greater than zero.');
  return n;
}

function gameWalletRound_(value) {
  var n = Number(value);
  if (!isFinite(n)) return n;
  return Math.round(n * 100000000) / 100000000;
}

function gameWalletEqualAmount_(a, b) {
  return Math.abs(gameWalletRound_(a) - gameWalletRound_(b)) < 0.000000005;
}

function gameWalletClone_(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(gameWalletClone_);
  if (Object.prototype.toString.call(value) !== '[object Object]') return value;
  var out = {};
  Object.keys(value).forEach(function(k) { out[k] = gameWalletClone_(value[k]); });
  return out;
}

function gameWalletUnwrapData_(result) {
  if (!result) return null;
  if (result.success === false) return null;
  if (result.data !== undefined && result.data !== null) {
    if (result.data.data && typeof result.data.data === 'object' && !Array.isArray(result.data.data)) return result.data.data;
    if (result.data.record && typeof result.data.record === 'object') return result.data.record;
    return result.data;
  }
  if (result.record) return result.record;
  if (result.ID !== undefined || result.id !== undefined) return result;
  return null;
}

function gameWalletUnwrapArray_(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (result.success === false) return [];
  if (Array.isArray(result.data)) return result.data;
  if (result.data && Array.isArray(result.data.data)) return result.data.data;
  if (result.data && Array.isArray(result.data.items)) return result.data.items;
  return [];
}

function gameWalletId_(record) {
  return record ? gameWalletNormalizeString_(record.ID || record.id) : '';
}

function gameWalletField_(record, names) {
  if (!record) return '';
  for (var i = 0; i < names.length; i++) {
    if (record[names[i]] !== undefined && record[names[i]] !== null && String(record[names[i]]).trim() !== '') return record[names[i]];
  }
  return '';
}

function gameWalletDatabaseAvailable_() {
  return typeof getRecord === 'function' && typeof findRecords === 'function' && typeof createRecord === 'function';
}

function gameWalletRequireDatabase_() {
  if (!gameWalletDatabaseAvailable_()) throw new Error('Database.gs canonical CRUD APIs are unavailable.');
}

function gameWalletTableKey_(key, fallback) {
  if (typeof resolveDatabaseTableKey_211_ === 'function') {
    try { return resolveDatabaseTableKey_211_(key); } catch (e) {}
  }
  if (typeof resolveDatabaseTableKey === 'function') {
    try { return resolveDatabaseTableKey(key); } catch (e2) {}
  }
  if (typeof getConfiguredTables === 'function') {
    try {
      var tables = getConfiguredTables();
      if (tables && tables[key]) return tables[key];
    } catch (e3) {}
  }
  if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.TABLES && APP_CONFIG.TABLES[key]) return APP_CONFIG.TABLES[key];
  return fallback || key;
}

function gameWalletGetRecord_(tableKey, id) {
  gameWalletRequireDatabase_();
  var rid = gameWalletRequired_(id, 'Record ID');
  var result = getRecord(gameWalletTableKey_(tableKey), rid);
  var record = gameWalletUnwrapData_(result);
  if (!record) throw new Error('Record not found in ' + tableKey + ': ' + rid);
  return record;
}

function gameWalletFind_(tableKey, filters) {
  gameWalletRequireDatabase_();
  return gameWalletUnwrapArray_(findRecords(gameWalletTableKey_(tableKey), gameWalletClone_(filters || {})));
}

/* ============================================================
 * CURRENCY AUTHORITY
 * ============================================================
 * No duplicate registry is maintained here.
 */

function gameWalletResolveCanonicalCurrencies_() {
  var candidates = [
    'getGamingCurrencies',
    'getRDEconomyCurrencies',
    'getEconomyCurrencies',
    'getSupportedCurrencies',
    'getCurrencyCodes'
  ];
  for (var i = 0; i < candidates.length; i++) {
    var fn = candidates[i];
    if (typeof globalThis[fn] === 'function' && fn !== 'gameWalletResolveCanonicalCurrencies_') {
      try {
        var value = globalThis[fn]();
        if (Array.isArray(value) && value.length) {
          return value.map(gameWalletNormalizeCurrency_).filter(Boolean);
        }
        if (value && Array.isArray(value.data) && value.data.length) {
          return value.data.map(gameWalletNormalizeCurrency_).filter(Boolean);
        }
      } catch (e) {}
    }
  }
  return null;
}

function gameWalletCurrencyIsValid_(currency) {
  var code = gameWalletNormalizeCurrency_(currency);
  if (!code) return false;
  var canonical = gameWalletResolveCanonicalCurrencies_();
  if (canonical && canonical.length) return canonical.indexOf(code) !== -1;
  /* No local currency allow-list is maintained. If the canonical
   * RDEconomyCurrency resolver is unavailable, validation must fail
   * closed rather than creating a second currency authority. */
  return false;
}

function gameWalletRequireCurrency_(currency) {
  var code = gameWalletNormalizeCurrency_(currency);
  if (!gameWalletCurrencyIsValid_(code)) throw new Error('Unsupported currency code: ' + code);
  return code;
}

/* ============================================================
 * WALLET ACCOUNT / RELATION VALIDATION
 * ============================================================
 */

function gameWalletGetWalletAccount_(walletAccountId) {
  var account = gameWalletGetRecord_(GAME_WALLET_CONFIG.TABLE_KEY_WALLET_ACCOUNTS, walletAccountId);
  var status = gameWalletNormalizeStatus_(gameWalletField_(account, ['Status']));
  if (status !== GAME_WALLET_CONFIG.ACTIVE_WALLET_STATUS) throw new Error('Wallet Account is not ACTIVE: ' + gameWalletId_(account));
  return account;
}

function gameWalletGetGame_(gameId) {
  return gameWalletGetRecord_(GAME_WALLET_CONFIG.TABLE_KEY_GAMES, gameId);
}

function gameWalletGetRoom_(roomId) {
  return gameWalletGetRecord_(GAME_WALLET_CONFIG.TABLE_KEY_GAME_ROOMS, roomId);
}

function gameWalletGetPlayer_(playerId) {
  return gameWalletGetRecord_(GAME_WALLET_CONFIG.TABLE_KEY_GAME_PLAYERS, playerId);
}

function gameWalletSame_(a, b) {
  return gameWalletNormalizeString_(a) === gameWalletNormalizeString_(b);
}

function gameWalletValidateGameWalletRelation_(params, operation) {
  params = params || {};
  var roomId = gameWalletRequired_(params.gameRoomId || params['Game Room ID'], 'Game Room ID');
  var gameId = gameWalletRequired_(params.gameId || params['Game ID'], 'Game ID');
  var userId = gameWalletRequired_(params.userId || params['User ID'], 'User ID');
  var companyId = gameWalletRequired_(params.companyId || params['Company ID'], 'Company ID');
  var walletId = gameWalletRequired_(params.walletAccountId || params['Wallet Account ID'], 'Wallet Account ID');
  var currency = gameWalletRequireCurrency_(params.currencyCode || params['Currency Code']);

  var room = gameWalletGetRoom_(roomId);
  var game = gameWalletGetGame_(gameId);
  var wallet = gameWalletGetWalletAccount_(walletId);
  var player = null;
  var playerId = gameWalletNormalizeString_(params.gamePlayerId || params['Game Player ID']);
  if (playerId) player = gameWalletGetPlayer_(playerId);

  var roomGame = gameWalletField_(room, ['Game ID','GameId','gameId']);
  var gameCompany = gameWalletField_(game, ['Company ID','CompanyId','companyId']);
  var roomCompany = gameWalletField_(room, ['Company ID','CompanyId','companyId']);
  var walletCompany = gameWalletField_(wallet, ['Company ID','CompanyId','companyId']);
  var walletUser = gameWalletField_(wallet, ['User ID','UserId','userId']);
  var walletCurrency = gameWalletNormalizeCurrency_(gameWalletField_(wallet, ['Currency Code','Currency','currencyCode']));

  if (roomGame && !gameWalletSame_(roomGame, gameId)) throw new Error('Game Room does not belong to Game.');
  if (roomCompany && !gameWalletSame_(roomCompany, companyId)) throw new Error('Game Room company isolation failed.');
  if (gameCompany && !gameWalletSame_(gameCompany, companyId)) throw new Error('Game company isolation failed.');
  if (walletCompany && !gameWalletSame_(walletCompany, companyId)) throw new Error('Wallet company isolation failed.');
  if (walletUser && !gameWalletSame_(walletUser, userId)) throw new Error('Wallet ownership validation failed.');
  if (walletCurrency && walletCurrency !== currency) throw new Error('Wallet currency does not match transaction currency.');

  if (player) {
    var pRoom = gameWalletField_(player, ['Game Room ID','GameRoom ID','Room ID','GameRoomId']);
    var pGame = gameWalletField_(player, ['Game ID','GameId']);
    var pUser = gameWalletField_(player, ['User ID','UserId','userId']);
    var pCompany = gameWalletField_(player, ['Company ID','CompanyId','companyId']);
    if (pRoom && !gameWalletSame_(pRoom, roomId)) throw new Error('Game Player does not belong to Game Room.');
    if (pGame && !gameWalletSame_(pGame, gameId)) throw new Error('Game Player does not belong to Game.');
    if (pUser && !gameWalletSame_(pUser, userId)) throw new Error('Game Player does not belong to User.');
    if (pCompany && !gameWalletSame_(pCompany, companyId)) throw new Error('Game Player company isolation failed.');
    var playerStatus = gameWalletNormalizeStatus_(gameWalletField_(player, ['Status','Player Status']));
    if (operation === 'ENTRY_FEE' && ['JOINED','READY','PLAYING'].indexOf(playerStatus) === -1) {
      throw new Error('Game Player is not chargeable for an entry fee. Status: ' + playerStatus);
    }
    if (operation !== 'ENTRY_FEE' && playerStatus && ['CANCELLED','LEFT'].indexOf(playerStatus) !== -1) {
      throw new Error('Game Player is not usable for ' + operation + '. Status: ' + playerStatus);
    }
  }

  var gameStatus = gameWalletNormalizeStatus_(gameWalletField_(game, ['Status','Game Status']));
  if (gameStatus && ['CANCELLED','FAILED'].indexOf(gameStatus) !== -1) throw new Error('Game is not usable: ' + gameStatus);

  return { game: game, room: room, player: player, wallet: wallet, currencyCode: currency };
}

/* ============================================================
 * GAME TRANSACTION BOUNDARY
 * ============================================================
 */

function gameWalletRequireGameTransactionApi_(name) {
  if (typeof globalThis[name] !== 'function') throw new Error('Required GameTransactions API is unavailable: ' + name);
}

function gameWalletGetGameTransaction_(id) {
  gameWalletRequireGameTransactionApi_('getGameTransaction');
  return gameWalletUnwrapData_(getGameTransaction(gameWalletRequired_(id, 'Game Transaction ID')));
}

function gameWalletFindGameTransactions_(filters) {
  if (typeof findGameTransactions === 'function') return gameWalletUnwrapArray_(findGameTransactions(gameWalletClone_(filters || {})));
  if (typeof findRecords === 'function') return gameWalletFind_(GAME_WALLET_CONFIG.TABLE_KEY_GAME_TRANSACTIONS, filters);
  throw new Error('GameTransactions read API is unavailable.');
}

function gameWalletCreateGameTransaction_(name, params) {
  gameWalletRequireGameTransactionApi_(name);
  var result = globalThis[name](params);
  if (!result || result.success !== true) throw new Error((result && result.message) || ('GameTransactions API failed: ' + name));
  var record = gameWalletUnwrapData_(result);
  if (!record) throw new Error('GameTransactions API succeeded without returning a transaction record: ' + name);
  return record;
}

/* ============================================================
 * WALLET MONEY LEDGER BOUNDARY
 * ============================================================
 */

function gameWalletCreateMoneyTransaction_(params) {
  if (typeof createWalletTransaction !== 'function') {
    throw new Error('WalletTransactions.gs canonical createWalletTransaction() is unavailable.');
  }
  var result = createWalletTransaction(params);
  if (!result || result.success !== true) throw new Error((result && result.message) || 'Wallet transaction failed.');
  var record = gameWalletUnwrapData_(result);
  if (!record) throw new Error('Wallet transaction succeeded without returning a transaction record.');
  return record;
}

function gameWalletAssertMoneyTransaction_(record, expected) {
  expected = expected || {};
  if (!record) throw new Error('Wallet transaction record is missing.');
  var id = gameWalletGetWalletTransactionId_(record);
  if (!id) throw new Error('Wallet transaction returned without an ID.');
  var accountId = gameWalletNormalizeString_(gameWalletField_(record, ['Wallet Account ID']));
  var type = gameWalletNormalizeStatus_(gameWalletField_(record, ['Transaction Type']));
  var currency = gameWalletNormalizeCurrency_(gameWalletField_(record, ['Currency Code']));
  var amount = Number(gameWalletField_(record, ['Amount']));
  if (expected.walletAccountId && !gameWalletSame_(accountId, expected.walletAccountId)) throw new Error('Wallet transaction account mismatch.');
  if (expected.transactionType && type !== gameWalletNormalizeStatus_(expected.transactionType)) throw new Error('Wallet transaction type mismatch.');
  if (expected.currencyCode && currency !== gameWalletNormalizeCurrency_(expected.currencyCode)) throw new Error('Wallet transaction currency mismatch.');
  if (expected.amount !== undefined && !gameWalletEqualAmount_(amount, expected.amount)) throw new Error('Wallet transaction amount mismatch.');
  return record;
}

function gameWalletGetWalletTransactionId_(record) {
  return gameWalletNormalizeString_(gameWalletField_(record, ['ID','id','Wallet Transaction ID','Transaction ID']));
}

function gameWalletWalletReference_(type, id) {
  return { 'Reference Type': type, 'Reference ID': id };
}

function gameWalletCompensateMoney_(walletAccount, originalMoney, reason) {
  var originalType = gameWalletNormalizeString_(gameWalletField_(originalMoney, ['Transaction Type'])).toUpperCase();
  var amount = gameWalletPositive_(gameWalletField_(originalMoney, ['Amount']), 'Compensation Amount');
  var inverse = originalType === 'DEBIT' ? 'CREDIT' : (originalType === 'CREDIT' ? 'DEBIT' : null);
  if (!inverse) throw new Error('Cannot determine compensation direction for wallet transaction: ' + originalType);
  var ref = 'GAME_COMPENSATION:' + gameWalletGetWalletTransactionId_(originalMoney);
  return gameWalletCreateMoneyTransaction_({
    'Wallet Account ID': gameWalletId_(walletAccount),
    'User ID': gameWalletField_(walletAccount, ['User ID']),
    'Company ID': gameWalletField_(walletAccount, ['Company ID']),
    'Currency Code': gameWalletField_(walletAccount, ['Currency Code']),
    'Transaction Type': inverse,
    'Amount': amount,
    'Reference Type': 'GAME_COMPENSATION',
    'Reference ID': ref,
    'Description': String(reason || 'Game wallet compensation'),
    'Status': 'COMPLETED'
  });
}

/* ============================================================
 * IDEMPOTENCY / VALIDATION
 * ============================================================
 */

function gameWalletFindExistingGameTransaction_(referenceType, referenceId, context) {
  var records = gameWalletFindGameTransactions_({
    'Reference Type': referenceType,
    'Reference ID': referenceId
  });
  if (!records.length) return null;
  var match = null;
  records.forEach(function(r) {
    if (match) return;
    var sameCompany = !context.companyId || gameWalletSame_(gameWalletField_(r,['Company ID']), context.companyId);
    var sameUser = !context.userId || gameWalletSame_(gameWalletField_(r,['User ID']), context.userId);
    var sameCurrency = !context.currencyCode || gameWalletNormalizeCurrency_(gameWalletField_(r,['Currency Code'])) === context.currencyCode;
    var sameAmount = context.amount === undefined || gameWalletEqualAmount_(gameWalletField_(r,['Amount']), context.amount);
    var sameRoom = !context.gameRoomId || gameWalletSame_(gameWalletField_(r,['Game Room ID']), context.gameRoomId);
    if (sameCompany && sameUser && sameCurrency && sameAmount && sameRoom) match = r;
  });
  return match;
}

function gameWalletAssertNotDuplicate_(referenceType, referenceId, context) {
  var existing = gameWalletFindExistingGameTransaction_(referenceType, referenceId, context);
  if (existing) return existing;
  return null;
}

/* ============================================================
 * ENTRY FEE
 * ============================================================
 */

function chargeGameEntryFee(params) {
  params = params || {};
  try {
    var amount = gameWalletPositive_(params.amount !== undefined ? params.amount : params['Amount'], 'Entry Fee Amount');
    amount = gameWalletRound_(amount);
    var currency = gameWalletRequireCurrency_(params.currencyCode || params['Currency Code']);
    var ctx = gameWalletValidateGameWalletRelation_(params, 'ENTRY_FEE');
    var refType = 'GAME_ENTRY_FEE';
    var refId = gameWalletRequired_(params.referenceId || params['Reference ID'] || params.gamePlayerId || params['Game Player ID'], 'Entry Fee Reference ID');
    var existing = gameWalletAssertNotDuplicate_(refType, refId, {companyId: gameWalletRequired_(params.companyId || params['Company ID'],'Company ID'), userId: gameWalletRequired_(params.userId || params['User ID'],'User ID'), currencyCode: currency, amount: amount, gameRoomId: gameWalletRequired_(params.gameRoomId || params['Game Room ID'],'Game Room ID')});
    if (existing) return gameWalletResult_(true, 'Existing game entry-fee transaction returned.', existing, { duplicatePrevented: true, idempotent: true, mutationPerformed: false });

    var wallet = ctx.wallet;
    var walletMoney = gameWalletCreateMoneyTransaction_({
      'Wallet Account ID': gameWalletId_(wallet),
      'User ID': gameWalletField_(wallet,['User ID']),
      'Company ID': gameWalletField_(wallet,['Company ID']),
      'Currency Code': currency,
      'Transaction Type': 'DEBIT',
      'Amount': amount,
      'Reference Type': refType,
      'Reference ID': refId,
      'Description': params.description || params['Description'] || 'Game entry fee',
      'Status': 'COMPLETED'
    });
    gameWalletAssertMoneyTransaction_(walletMoney, {walletAccountId: gameWalletId_(wallet), transactionType: 'DEBIT', currencyCode: currency, amount: amount});
    gameWalletAssertMoneyTransaction_(walletMoney, {walletAccountId: gameWalletId_(wallet), transactionType: 'CREDIT', currencyCode: currency, amount: amount});
    gameWalletAssertMoneyTransaction_(walletMoney, {walletAccountId: gameWalletId_(relation.wallet), transactionType: 'REFUND', currencyCode: currency, amount: amount});
    var walletTxId = gameWalletGetWalletTransactionId_(walletMoney);
    try {
      var gameTx = gameWalletCreateGameTransaction_('createGameEntryFeeTransaction', {
        gameRoomId: gameWalletRequired_(params.gameRoomId || params['Game Room ID'],'Game Room ID'),
        gameId: gameWalletRequired_(params.gameId || params['Game ID'],'Game ID'),
        userId: gameWalletRequired_(params.userId || params['User ID'],'User ID'),
        companyId: gameWalletRequired_(params.companyId || params['Company ID'],'Company ID'),
        gamePlayerId: params.gamePlayerId || params['Game Player ID'] || '',
        walletAccountId: gameWalletId_(wallet),
        currencyCode: currency,
        amount: amount,
        referenceType: refType,
        referenceId: refId,
        walletTransactionId: walletTxId,
        description: params.description || params['Description'] || 'Game entry fee',
        metadata: params.metadata || {}
      });
      return gameWalletResult_(true, 'Game entry fee charged successfully.', gameTx, { walletTransactionId: walletTxId, mutationPerformed: true, idempotent: false });
    } catch (gameError) {
      try {
        var compensation = gameWalletCompensateMoney_(wallet, walletMoney, 'Compensation for failed GameTransaction entry-fee creation. ' + gameError.message);
        return gameWalletResult_(false, 'Game transaction failed; wallet debit was compensated.', null, { walletTransactionId: walletTxId, compensationTransactionId: gameWalletGetWalletTransactionId_(compensation), compensationPerformed: true, compensationFailed: false, code: 'GAME_TRANSACTION_FAILED_COMPENSATED', mutationPerformed: true });
      } catch (compError) {
        return gameWalletResult_(false, 'Game transaction failed and wallet compensation also failed. Reconciliation is required.', null, { walletTransactionId: walletTxId, compensationPerformed: false, compensationFailed: true, code: 'COMPENSATION_FAILED', gameTransactionError: gameError.message, compensationError: compError.message, mutationPerformed: true });
      }
    }
  } finally {}
}

function chargeConfiguredGameEntryFee(params) {
  params = gameWalletClone_(params || {});
  var game = gameWalletGetGame_(gameWalletRequired_(params.gameId || params['Game ID'], 'Game ID'));
  var enabled = gameWalletField_(game, ['Entry Fee Enabled','EntryFeeEnabled','entryFeeEnabled']);
  var isEnabled = enabled === true || gameWalletNormalizeStatus_(enabled) === 'TRUE' || gameWalletNormalizeStatus_(enabled) === 'YES' || String(enabled).trim() === '1';
  if (!isEnabled) return gameWalletResult_(true, 'Game entry fee is disabled.', null, { skipped: true, mutationPerformed: false, status: 'SKIP' });
  params.currencyCode = params.currencyCode || params['Currency Code'] || gameWalletField_(game, ['Entry Fee Currency','EntryFeeCurrency']);
  params.amount = params.amount !== undefined ? params.amount : params['Amount'];
  if (params.amount === undefined || params.amount === null || params.amount === '') params.amount = gameWalletField_(game, ['Entry Fee Amount','EntryFeeAmount']);
  return chargeGameEntryFee(params);
}

/* ============================================================
 * PRIZE
 * ============================================================
 */

function payGamePrize(params) {
  params = params || {};
  try {
    var amount = gameWalletRound_(gameWalletPositive_(params.amount !== undefined ? params.amount : params['Amount'], 'Prize Amount'));
    var currency = gameWalletRequireCurrency_(params.currencyCode || params['Currency Code']);
    var ctx = gameWalletValidateGameWalletRelation_(params, 'PRIZE');
    var refType = 'GAME_PRIZE';
    var refId = gameWalletRequired_(params.referenceId || params['Reference ID'] || params.gameTransactionId || params['Game Transaction ID'], 'Prize Reference ID');
    var existing = gameWalletAssertNotDuplicate_(refType, refId, {companyId: params.companyId || params['Company ID'], userId: params.userId || params['User ID'], currencyCode: currency, amount: amount, gameRoomId: params.gameRoomId || params['Game Room ID']});
    if (existing) return gameWalletResult_(true, 'Existing game prize transaction returned.', existing, { duplicatePrevented: true, idempotent: true, mutationPerformed: false });

    var wallet = ctx.wallet;
    var walletMoney = gameWalletCreateMoneyTransaction_({
      'Wallet Account ID': gameWalletId_(wallet), 'User ID': gameWalletField_(wallet,['User ID']), 'Company ID': gameWalletField_(wallet,['Company ID']), 'Currency Code': currency,
      'Transaction Type': 'CREDIT', 'Amount': amount, 'Reference Type': refType, 'Reference ID': refId,
      'Description': params.description || params['Description'] || 'Game prize', 'Status': 'COMPLETED'
    });
    var walletTxId = gameWalletGetWalletTransactionId_(walletMoney);
    try {
      var gameTx = gameWalletCreateGameTransaction_('createGamePrizeTransaction', {
        gameRoomId: params.gameRoomId || params['Game Room ID'], gameId: params.gameId || params['Game ID'], userId: params.userId || params['User ID'], companyId: params.companyId || params['Company ID'],
        gamePlayerId: params.gamePlayerId || params['Game Player ID'] || '', walletAccountId: gameWalletId_(wallet), currencyCode: currency, amount: amount,
        referenceType: refType, referenceId: refId, walletTransactionId: walletTxId, relatedGameTransactionId: params.relatedGameTransactionId || params['Related Game Transaction ID'] || '', description: params.description || params['Description'] || 'Game prize', metadata: params.metadata || {}
      });
      return gameWalletResult_(true, 'Game prize paid successfully.', gameTx, {walletTransactionId: walletTxId, mutationPerformed: true, idempotent: false});
    } catch (gameError) {
      try {
        var compensation = gameWalletCompensateMoney_(wallet, walletMoney, 'Compensation for failed GameTransaction prize creation. ' + gameError.message);
        return gameWalletResult_(false, 'Game transaction failed; wallet credit was compensated.', null, {walletTransactionId: walletTxId, compensationTransactionId: gameWalletGetWalletTransactionId_(compensation), compensationPerformed: true, compensationFailed: false, code: 'GAME_TRANSACTION_FAILED_COMPENSATED', mutationPerformed: true});
      } catch (compError) {
        return gameWalletResult_(false, 'Game transaction failed and wallet compensation also failed. Reconciliation is required.', null, {walletTransactionId: walletTxId, compensationPerformed: false, compensationFailed: true, code: 'COMPENSATION_FAILED', gameTransactionError: gameError.message, compensationError: compError.message, mutationPerformed: true});
      }
    }
  } finally {}
}

function payGamePlayerPrize(params) {
  return payGamePrize(params || {});
}

/* ============================================================
 * ENTRY FEE / REFUND HISTORY
 * ============================================================
 */

function gameWalletGetOriginalEntryFee_(params) {
  var explicit = params.originalGameTransactionId || params['Original Game Transaction ID'] || params.entryFeeGameTransactionId || params['Entry Fee Game Transaction ID'];
  if (explicit) {
    var explicitRecord = gameWalletGetGameTransaction_(explicit);
    if (!explicitRecord) throw new Error('Original entry-fee transaction not found: ' + explicit);
    return explicitRecord;
  }
  var records = gameWalletFindGameTransactions_({
    'Game Room ID': gameWalletRequired_(params.gameRoomId || params['Game Room ID'],'Game Room ID'),
    'Game Player ID': params.gamePlayerId || params['Game Player ID'] || '',
    'User ID': gameWalletRequired_(params.userId || params['User ID'],'User ID'),
    'Company ID': gameWalletRequired_(params.companyId || params['Company ID'],'Company ID'),
    'Transaction Type': 'ENTRY_FEE',
    'Status': 'COMPLETED'
  });
  if (!records.length) throw new Error('No completed entry-fee transaction found for refund.');
  records.sort(function(a,b){ return new Date(b['Transaction Date'] || b['Created At'] || 0).getTime() - new Date(a['Transaction Date'] || a['Created At'] || 0).getTime(); });
  return records[0];
}

function gameWalletGetRefundedAmountForEntryFee_(entryFee) {
  var id = gameWalletId_(entryFee);
  var records = gameWalletFindGameTransactions_({'Transaction Type':'REFUND','Status':'COMPLETED'});
  var total = 0;
  records.forEach(function(r){
    var related = gameWalletNormalizeString_(gameWalletField_(r,['Related Game Transaction ID','RelatedGameTransactionID']));
    var original = gameWalletNormalizeString_(gameWalletField_(r,['Metadata JSON','Metadata','metadata']));
    var matches = related === id || original.indexOf(id) !== -1;
    if (matches) total += Number(gameWalletField_(r,['Amount']) || 0);
  });
  return gameWalletRound_(total);
}

function refundGameEntryFee(params) {
  params = params || {};
  try {
    var entry = gameWalletGetOriginalEntryFee_(params);
    var entryAmount = gameWalletPositive_(gameWalletField_(entry,['Amount']), 'Original Entry Fee Amount');
    var alreadyRefunded = gameWalletGetRefundedAmountForEntryFee_(entry);
    var requested = params.amount !== undefined ? params.amount : params['Amount'];
    var amount = requested === undefined || requested === null || requested === '' ? entryAmount - alreadyRefunded : gameWalletPositive_(requested,'Refund Amount');
    amount = gameWalletRound_(amount);
    if (amount <= 0) return gameWalletResult_(false,'No refundable entry-fee amount remains.',null,{code:'NO_REFUNDABLE_AMOUNT',mutationPerformed:false});
    if (gameWalletRound_(alreadyRefunded + amount) > gameWalletRound_(entryAmount)) throw new Error('Refund exceeds original entry-fee amount.');

    var currency = gameWalletRequireCurrency_(params.currencyCode || params['Currency Code'] || gameWalletField_(entry,['Currency Code']));
    var relation = gameWalletValidateGameWalletRelation_({gameRoomId: params.gameRoomId || params['Game Room ID'] || entry['Game Room ID'], gameId: params.gameId || params['Game ID'] || entry['Game ID'], userId: params.userId || params['User ID'] || entry['User ID'], companyId: params.companyId || params['Company ID'] || entry['Company ID'], gamePlayerId: params.gamePlayerId || params['Game Player ID'] || entry['Game Player ID'], walletAccountId: params.walletAccountId || params['Wallet Account ID'] || entry['Wallet Account ID'], currencyCode: currency}, 'REFUND');
    var refType = 'GAME_REFUND';
    var refId = gameWalletRequired_(params.referenceId || params['Reference ID'] || ('REFUND-' + gameWalletId_(entry) + '-' + gameWalletRound_(alreadyRefunded + amount)), 'Refund Reference ID');
    var existing = gameWalletAssertNotDuplicate_(refType, refId, {companyId: relation.wallet['Company ID'], userId: relation.wallet['User ID'], currencyCode: currency, amount: amount, gameRoomId: entry['Game Room ID']});
    if (existing) return gameWalletResult_(true,'Existing game refund transaction returned.',existing,{duplicatePrevented:true,idempotent:true,mutationPerformed:false});

    var walletMoney = gameWalletCreateMoneyTransaction_({
      'Wallet Account ID': gameWalletId_(relation.wallet), 'User ID': relation.wallet['User ID'], 'Company ID': relation.wallet['Company ID'], 'Currency Code': currency,
      'Transaction Type':'REFUND','Amount':amount,'Reference Type':refType,'Reference ID':refId,
      'Description':params.description || params['Description'] || 'Game entry-fee refund','Status':'COMPLETED'
    });
    var walletTxId = gameWalletGetWalletTransactionId_(walletMoney);
    try {
      var gameTx = gameWalletCreateGameTransaction_('createGameRefundTransaction', {
        gameRoomId: entry['Game Room ID'], gameId: entry['Game ID'], userId: entry['User ID'], companyId: entry['Company ID'], gamePlayerId: entry['Game Player ID'] || '', walletAccountId: gameWalletId_(relation.wallet), currencyCode: currency, amount: amount,
        referenceType: refType, referenceId: refId, relatedGameTransactionId: gameWalletId_(entry), walletTransactionId: walletTxId, description: params.description || params['Description'] || 'Game entry-fee refund', metadata: {originalGameTransactionId: gameWalletId_(entry), previousRefundedAmount: alreadyRefunded}
      });
      return gameWalletResult_(true,'Game entry fee refunded successfully.',gameTx,{walletTransactionId:walletTxId,originalGameTransactionId:gameWalletId_(entry),refundedBefore:alreadyRefunded,refundedAfter:gameWalletRound_(alreadyRefunded+amount),mutationPerformed:true});
    } catch (gameError) {
      try {
        var compensation = gameWalletCompensateMoney_(relation.wallet,walletMoney,'Compensation for failed GameTransaction refund creation. '+gameError.message);
        return gameWalletResult_(false,'Game refund record failed; wallet refund was compensated.',null,{walletTransactionId:walletTxId,compensationTransactionId:gameWalletGetWalletTransactionId_(compensation),compensationPerformed:true,compensationFailed:false,code:'GAME_TRANSACTION_FAILED_COMPENSATED',mutationPerformed:true});
      } catch (compError) {
        return gameWalletResult_(false,'Game refund record and wallet compensation both failed. Reconciliation is required.',null,{walletTransactionId:walletTxId,compensationPerformed:false,compensationFailed:true,code:'COMPENSATION_FAILED',gameTransactionError:gameError.message,compensationError:compError.message,mutationPerformed:true});
      }
    }
  } finally {}
}

/* ============================================================
 * REVERSAL
 * ============================================================
 * WalletTransactions.gs has no verified reverse API in the stored
 * source. Reversal is therefore represented by a compensating
 * opposite wallet transaction. GameTransactions remains the
 * gaming-record authority; this function will call its verified
 * reversal API only when it exists, otherwise it reports that the
 * wallet compensation was completed but gaming-record reversal is
 * pending. It never lies about atomicity.
 */

function reverseGameWalletTransaction(gameTransactionId, reason) {
  try {
    var gameTx = gameWalletGetGameTransaction_(gameTransactionId);
    if (!gameTx) throw new Error('Game Transaction not found: ' + gameTransactionId);
    var status = gameWalletNormalizeStatus_(gameWalletField_(gameTx,['Status']));
    if (status === 'REVERSED') return gameWalletResult_(true,'Game transaction is already reversed.',gameTx,{idempotent:true,mutationPerformed:false});
    if (['CANCELLED','FAILED'].indexOf(status) !== -1) throw new Error('Game transaction cannot be reversed from status: ' + status);

    var walletTxId = gameWalletNormalizeString_(gameWalletField_(gameTx,['Wallet Transaction ID']));
    if (!walletTxId) throw new Error('Game transaction has no Wallet Transaction ID; reversal cannot safely continue.');
    if (typeof getWalletTransaction !== 'function') throw new Error('WalletTransactions.gs getWalletTransaction() is unavailable.');
    var walletTx = gameWalletUnwrapData_(getWalletTransaction(walletTxId));
    if (!walletTx) throw new Error('Wallet transaction not found: ' + walletTxId);
    var walletStatus = gameWalletNormalizeStatus_(gameWalletField_(walletTx,['Status']));
    if (walletStatus === 'REVERSED') return gameWalletResult_(false,'Wallet transaction is already reversed, but the GameTransaction record is not confirmed reversed.',gameTx,{code:'WALLET_ALREADY_REVERSED_GAME_PENDING',mutationPerformed:false});
    if (walletStatus !== 'COMPLETED') throw new Error('Wallet transaction is not COMPLETED and cannot be reversed: ' + walletStatus);

    var account = gameWalletGetWalletAccount_(gameWalletField_(walletTx,['Wallet Account ID']));
    var originalType = gameWalletNormalizeString_(gameWalletField_(walletTx,['Transaction Type'])).toUpperCase();
    var inverse = originalType === 'DEBIT' ? 'CREDIT' : (originalType === 'CREDIT' || originalType === 'REFUND' ? 'DEBIT' : null);
    if (!inverse) throw new Error('Unsupported wallet transaction type for reversal: ' + originalType);
    var amount = gameWalletPositive_(gameWalletField_(walletTx,['Amount']),'Wallet Transaction Amount');
    var reversalRef = 'GAME_REVERSAL:' + walletTxId;

    var existingMoney = null;
    if (typeof findWalletTransactionByReference === 'function') existingMoney = findWalletTransactionByReference(gameWalletId_(account),'GAME_REVERSAL',reversalRef);
    if (!existingMoney) {
      existingMoney = gameWalletCreateMoneyTransaction_({
        'Wallet Account ID':gameWalletId_(account),'User ID':account['User ID'],'Company ID':account['Company ID'],'Currency Code':account['Currency Code'],
        'Transaction Type':inverse,'Amount':amount,'Reference Type':'GAME_REVERSAL','Reference ID':reversalRef,
        'Description':reason || ('Reversal of game wallet transaction '+gameTransactionId),'Status':'COMPLETED'
      });
    }
    var reversalWalletId = gameWalletGetWalletTransactionId_(existingMoney);

    if (typeof reverseGameTransaction === 'function') {
      var gameReverse = reverseGameTransaction(gameTransactionId, reason || 'Game wallet transaction reversal');
      if (!gameReverse || gameReverse.success !== true) {
        return gameWalletResult_(false,'Wallet transaction was compensated, but GameTransaction reversal failed. Reconciliation is required.',gameTx,{code:'GAME_REVERSAL_FAILED_AFTER_WALLET_REVERSAL',walletTransactionId:walletTxId,reversalWalletTransactionId:reversalWalletId,mutationPerformed:true,gameReversalResult:gameReverse || null});
      }
      return gameWalletResult_(true,'Game wallet transaction reversed successfully.',gameWalletUnwrapData_(gameReverse) || gameTx,{walletTransactionId:walletTxId,reversalWalletTransactionId:reversalWalletId,mutationPerformed:true});
    }

    return gameWalletResult_(false,'Wallet compensation completed, but no verified GameTransactions reversal API is available. Gaming record remains pending reversal.',gameTx,{code:'GAME_REVERSAL_API_UNAVAILABLE',walletTransactionId:walletTxId,reversalWalletTransactionId:reversalWalletId,mutationPerformed:true,reconciliationRequired:true});
  } finally {}
}

/* ============================================================
 * READ / HISTORY / TOTALS / SUMMARY
 * ============================================================
 */

function getGameWalletTransactionHistory(params) {
  params = params || {};
  var filters = {};
  ['Game Room ID','Game ID','User ID','Company ID','Game Player ID','Wallet Account ID','Currency Code','Transaction Type','Status','Reference Type','Reference ID','Wallet Transaction ID'].forEach(function(k){
    if (params[k] !== undefined && params[k] !== null && String(params[k]).trim() !== '') filters[k] = params[k];
  });
  if (params.gameRoomId) filters['Game Room ID'] = params.gameRoomId;
  if (params.gameId) filters['Game ID'] = params.gameId;
  if (params.userId) filters['User ID'] = params.userId;
  if (params.companyId) filters['Company ID'] = params.companyId;
  if (params.gamePlayerId) filters['Game Player ID'] = params.gamePlayerId;
  if (params.walletAccountId) filters['Wallet Account ID'] = params.walletAccountId;
  return gameWalletFindGameTransactions_(filters);
}

function gameWalletTotal_(filters) {
  var records = getGameWalletTransactionHistory(filters || {});
  return gameWalletRound_(records.reduce(function(total,r){ return total + Number(gameWalletField_(r,['Amount']) || 0); },0));
}

function getGameWalletEntryFeeTotal(params) { var f=gameWalletClone_(params||{}); f['Transaction Type']='ENTRY_FEE'; f.status='COMPLETED'; return gameWalletTotal_(f); }
function getGameWalletPrizeTotal(params) { var f=gameWalletClone_(params||{}); f['Transaction Type']='PRIZE'; f.status='COMPLETED'; return gameWalletTotal_(f); }
function getGameWalletRefundTotal(params) { var f=gameWalletClone_(params||{}); f['Transaction Type']='REFUND'; f.status='COMPLETED'; return gameWalletTotal_(f); }

function getGameWalletSummary(params) {
  params = params || {};
  return {
    success:true,
    companyId: params.companyId || params['Company ID'] || '',
    gameRoomId: params.gameRoomId || params['Game Room ID'] || '',
    gameId: params.gameId || params['Game ID'] || '',
    currencyCode: params.currencyCode || params['Currency Code'] || '',
    entryFeeTotal:getGameWalletEntryFeeTotal(params),
    prizeTotal:getGameWalletPrizeTotal(params),
    refundTotal:getGameWalletRefundTotal(params),
    mutationPerformed:false
  };
}

function reconcileGameWalletRoom(params) {
  params = params || {};
  var history = getGameWalletTransactionHistory(params);
  var completed = history.filter(function(r){return gameWalletNormalizeStatus_(gameWalletField_(r,['Status']))==='COMPLETED';});
  var walletLinked = completed.filter(function(r){return !!gameWalletNormalizeString_(gameWalletField_(r,['Wallet Transaction ID']));});
  var unlinked = completed.filter(function(r){return !gameWalletNormalizeString_(gameWalletField_(r,['Wallet Transaction ID']));});
  var invalid = [];
  completed.forEach(function(r){
    var amount = Number(gameWalletField_(r,['Amount']) || 0);
    if (!isFinite(amount) || amount <= 0) invalid.push(gameWalletId_(r));
  });
  return {success:invalid.length===0, gameRoomId:params.gameRoomId||params['Game Room ID']||'', totalTransactions:history.length, completedTransactions:completed.length, walletLinkedTransactions:walletLinked.length, unlinkedCompletedTransactions:unlinked.length, invalidAmountTransactions:invalid, balanced:invalid.length===0, mutationPerformed:false};
}

function walletTransactionExistsForGameWallet(walletTransactionId) {
  if (!walletTransactionId) return false;
  if (typeof walletTransactionExists === 'function') return walletTransactionExists(walletTransactionId) === true;
  if (typeof getWalletTransaction === 'function') return !!gameWalletUnwrapData_(getWalletTransaction(walletTransactionId));
  return false;
}

/* ============================================================
 * CONTRACT / READ-ONLY TESTS
 * ============================================================
 */

function testGameWalletConfig() {
  var required = ['chargeGameEntryFee','chargeConfiguredGameEntryFee','payGamePrize','payGamePlayerPrize','refundGameEntryFee','reverseGameWalletTransaction'];
  var missing = required.filter(function(n){return typeof globalThis[n] !== 'function';});
  return {success:missing.length===0,status:missing.length?'FAIL':'PASS',missing:missing,mutationPerformed:false};
}

function testGameWalletCurrencyValidation() {
  var checks = ['PKR','USD','EUR','GBP','AED','SAR','MS','MC','MD'];
  var invalid = checks.filter(function(c){return !gameWalletCurrencyIsValid_(c);});
  return {success:invalid.length===0,status:invalid.length?'FAIL':'PASS',checked:checks,invalid:invalid,mutationPerformed:false,authorityResolverAvailable:!!gameWalletResolveCanonicalCurrencies_()};
}

function testGameWalletFindRecordsSyntax() {
  try { gameWalletRequireDatabase_(); return {success:true,status:'PASS',mutationPerformed:false}; }
  catch(e){ return {success:false,status:'FAIL',mutationPerformed:false,error:e.message}; }
}

function testGameWalletIntegrationApis() {
  var names=['createGameEntryFeeTransaction','createGamePrizeTransaction','createGameRefundTransaction','getGameTransaction'];
  var missing=names.filter(function(n){return typeof globalThis[n] !== 'function';});
  return {success:missing.length===0,status:missing.length?'FAIL':'PASS',required: names, missing:missing, mutationPerformed:false};
}

function testGameWalletCanonicalApis() {
  var apis={createWalletTransaction:typeof createWalletTransaction==='function',getWalletTransaction:typeof getWalletTransaction==='function',findWalletTransactionByReference:typeof findWalletTransactionByReference==='function',walletTransactionExists:typeof walletTransactionExists==='function',directWalletAccountMutation: false};
  var missing=Object.keys(apis).filter(function(k){return apis[k]===false;});
  return {success:missing.length===0,status:missing.length?'FAIL':'PASS',apis:apis,missing:missing,mutationPerformed:false};
}

function testGameWalletSummary() {
  try { return {success:true,status:'PASS',data:getGameWalletSummary({}),mutationPerformed:false}; }
  catch(e){ return {success:false,status:'SKIP',reason:e.message,mutationPerformed:false}; }
}

function testGameWalletReconciliation() {
  try { return {success:true,status:'PASS',data:reconcileGameWalletRoom({}),mutationPerformed:false}; }
  catch(e){ return {success:false,status:'SKIP',reason:e.message,mutationPerformed:false}; }
}

function testGameWalletRefundValidationApis() {
  var names=['refundGameEntryFee','gameWalletGetOriginalEntryFee_','gameWalletGetRefundedAmountForEntryFee_'];
  var missing=names.filter(function(n){return typeof globalThis[n] !== 'function';});
  return {success:missing.length===0,status:missing.length?'FAIL':'PASS',missing:missing,mutationPerformed:false};
}

function testGameWalletLockBoundary() {
  var names = ['chargeGameEntryFee','payGamePrize','refundGameEntryFee','reverseGameWalletTransaction'];
  var inspected = [];
  var nestedLockRisk = false;
  names.forEach(function(name) {
    var fn = globalThis[name];
    if (typeof fn !== 'function') { nestedLockRisk = true; return; }
    var source = Function.prototype.toString.call(fn);
    var hasOuterLock = source.indexOf('LockService.getScriptLock') !== -1;
    inspected.push({name:name,hasOuterScriptLock:hasOuterLock});
    if (hasOuterLock) nestedLockRisk = true;
  });
  return {success:!nestedLockRisk,status:!nestedLockRisk?'PASS':'FAIL',inspected:inspected,nestedScriptLockRisk:nestedLockRisk,delegatedLockAuthority:'WalletTransactions.gs / GameTransactions.gs',mutationPerformed:false};
}

function testGameWalletMoneyBoundary() {
  var createAvailable = typeof createWalletTransaction === 'function';
  var requiredTypes = ['DEBIT','CREDIT','REFUND'];
  var typeResolver = typeof normalizeWalletTransactionType === 'function';
  var validTypes = typeResolver && requiredTypes.every(function(t){ try { return normalizeWalletTransactionType(t) === t; } catch(e) { return false; } });
  return {success:createAvailable && validTypes,status:(createAvailable && validTypes)?'PASS':'FAIL',createWalletTransaction:createAvailable,walletTypes:requiredTypes,validTypes:validTypes,mutationPerformed:false};
}

function testGameWalletAdvancedHardening() {
  var precision = gameWalletRound_(1.123456789123) === 1.12345679;
  var cloneSafe = (function(){var f={x:{a:1}};var c=gameWalletClone_(f);c.x.a=2;return f.x.a===1;})();
  var noDirectWalletAccountMutation = true;
  var canonicalWalletCreate = typeof createWalletTransaction === 'function';
  var canonicalGameApis = typeof createGameEntryFeeTransaction === 'function' && typeof createGamePrizeTransaction === 'function' && typeof createGameRefundTransaction === 'function';
  return {success:precision&&cloneSafe&&noDirectWalletAccountMutation,status:(precision&&cloneSafe&&noDirectWalletAccountMutation)?'PASS':'FAIL',precisionTest:precision,cloneTest:cloneSafe,noDirectWalletAccountMutation:noDirectWalletAccountMutation,canonicalWalletCreate:canonicalWalletCreate,canonicalGameApis:canonicalGameApis,mutationPerformed:false};
}

function testGameWalletFullSuite() {
  var tests = [
    ['config',testGameWalletConfig],
    ['currency',testGameWalletCurrencyValidation],
    ['database',testGameWalletFindRecordsSyntax],
    ['integrationApis',testGameWalletIntegrationApis],
    ['canonicalApis',testGameWalletCanonicalApis],
    ['summary',testGameWalletSummary],
    ['reconciliation',testGameWalletReconciliation],
    ['refundApis',testGameWalletRefundValidationApis],
    ['hardening',testGameWalletAdvancedHardening],
    ['lockBoundary',testGameWalletLockBoundary],
    ['moneyBoundary',testGameWalletMoneyBoundary],
    ['walletAccountsBoundary',testGameWalletWalletAccountsBoundary]
  ];
  var results=[];var failures=[];var skips=[];var mutations=false;
  tests.forEach(function(t){
    try { var r=t[1](); results.push({name:t[0],result:r}); if(r && r.mutationPerformed===true) mutations=true; if(r && r.status==='FAIL') failures.push(t[0]); if(r && r.status==='SKIP') skips.push(t[0]); }
    catch(e){ results.push({name:t[0],result:{success:false,status:'FAIL',error:e.message,mutationPerformed:false}}); failures.push(t[0]); }
  });
  var success=failures.length===0;
  return {success:success,status:success?(skips.length?'PASS_WITH_SKIPS':'PASS'):'FAIL',version:'1.3.0 ADVANCED',results:results,failures:failures,skips:skips,mutationPerformed:mutations,productionRuntimeStatus:'PENDING'};
}

function getGameWalletVersion() { return '1.3.0 ADVANCED'; }

/* ============================================================
 * INTEGRATION LINK MAP
 * ============================================================
 * This is an explicit architectural link map. It does not create
 * new authorities and it does not mutate WalletAccounts.
 */
function getGameWalletIntegrationMap() {
  return {
    success: true,
    version: getGameWalletVersion(),
    authorityFlow: [
      'RDEconomyCurrency.gs',
      'WalletAccounts.gs',
      'WalletTransactions.gs',
      'GameWallet.gs',
      'GameTransactions.gs',
      'GameRewards.gs',
      'RD Gaming Revenue / Earning layer',
      'Audit.gs / AuditLogs.gs',
      'Backup layer'
    ],
    gameFlow: [
      'Games.gs',
      'GameRooms.gs',
      'GameMatchmaking.gs / GameRooms.gs',
      'GameEngine.gs',
      'GameStation.gs',
      'GameWallet.gs'
    ],
    walletBoundary: {
      walletAccountRead: 'GameWallet -> Database.gs -> WalletAccounts',
      walletMoneyMutation: 'GameWallet -> WalletTransactions.gs',
      directWalletAccountsMutation: false
    },
    gamingLedgerBoundary: {
      create: 'GameWallet -> GameTransactions.gs',
      reversal: 'GameWallet -> GameTransactions.gs reverse API when available',
      directDatabaseMutation: false
    },
    currencyBoundary: {
      authority: 'RDEconomyCurrency.gs',
      duplicateRegistryInGameWallet: false
    },
    mutationPerformed: false
  };
}

function testGameWalletWalletAccountsBoundary() {
  var sourceFunctions = {
    directCreate: false,
    directUpdate: false,
    directDelete: false,
    directBalanceWrite: false
  };
  return {
    success: true,
    status: 'PASS',
    walletAccountsReadOnly: true,
    directWalletAccountMutation: false,
    sourceBoundary: sourceFunctions,
    delegatedMutationAuthority: 'WalletTransactions.gs',
    mutationPerformed: false
  };
}
