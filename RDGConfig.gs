/**
 * ================================================================
 * RD ROUTE DESIGN ACC
 * UNIVERSAL MULTI-PLATFORM SYSTEM
 * ================================================================
 *
 * File:
 *   RDGConfig.gs
 *
 * Version:
 *   4.2.0
 *
 * Purpose:
 *   Central production configuration for the RDG system.
 *
 * Compatible With:
 *   RDGServer.gs v4.2.0+
 *   AuditLogs.gs v2.0.0+
 *
 * DATABASE LAYOUT
 * ---------------
 * A1 = Current Sheet Name
 * A2 = Reserved
 * B2 = Main Sheet clickable link/button
 * A3 = Headers
 * A4+ = Database Data
 *
 * ================================================================
 */


/**
 * ================================================================
 * CENTRAL CONFIGURATION
 * ================================================================
 */

const RDG_CONFIG = {

  /**
   * ==============================================================
   * APPLICATION
   * ==============================================================
   */

  APP: {

    NAME:
      'RD Route Design ACC',

    SHORT_NAME:
      'RDG',

    VERSION:
      '4.2.0',

    CONFIG_VERSION:
      '4.2.0',

    ENVIRONMENT:
      'PRODUCTION',

    TIMEZONE:
      Session.getScriptTimeZone() ||
      'Asia/Karachi',

    COMPANY_NAME:
      'Kiyani Advertising Trader',

    BRAND_NAME:
      'RD Route Design',

    WEBSITE:
      'https://KiyaniAdvertising.twinesite.com',

    EMAIL:
      'routedesign2026@gmail.com',

    WHATSAPP: [
      '+923235105281',
      '+923118843611'
    ]

  },


  /**
   * ==============================================================
   * WEB APPLICATION
   * ==============================================================
   */

  WEB: {

    MAIN_PAGE:
      'RDGGame',

    MAIN_SHEET_NAME:
      'Main Sheet',

    MAIN_SHEET_LABEL:
      'Main Sheet',

    ALLOW_IFRAME:
      true,

    TITLE:
      'RD Route Design ACC — Universal Multi-Platform System',

    DESCRIPTION:
      'RD Route Design ACC powered by Kiyani Advertising Trader',

    NAVIGATION_ENABLED:
      true,

    NAVIGATION_BUTTONS_ENABLED:
      true,

    NAVIGATION_LINK_BY_NAME:
      true,

    OPEN_SHEET_IN_NEW_TAB:
      false

  },


  /**
   * ==============================================================
   * DATABASE
   * ==============================================================
   *
   * LOCKED DATABASE LAYOUT
   *
   * Row 1 = Sheet Name
   * Row 2 = Main Sheet Navigation
   * Row 3 = Headers
   * Row 4+ = Data
   */

  DATABASE: {

    SPREADSHEET_ID:
      '1Vh9SNScBNEWROHbe4fQt2yKfP41VHh3CFf3nbVCMH0E',

    TITLE_ROW:
      1,

    RESERVED_ROW:
      2,

    MAIN_SHEET_ROW:
      2,

    HEADER_ROW:
      3,

    DATA_START_ROW:
      4,

    TITLE_COLUMN:
      1,

    MAIN_SHEET_COLUMN:
      2,

    MAIN_SHEET_URL:
      '',

    MAIN_SPREADSHEET_URL:
      '',

    MAIN_FOLDER_ID:
      '',

    MAIN_SHEET_NAME:
      'Main Sheet',

    MAIN_SHEET_LABEL:
      'Main Sheet',

    AUTO_CREATE_SHEETS:
      true,

    AUTO_CREATE_NAVIGATION:
      true,

    AUTO_CREATE_MAIN_LINK:
      true,

    CASE_SENSITIVE_HEADERS:
      false,

    TRIM_HEADERS:
      true,

    DATE_FORMAT:
      'yyyy-MM-dd',

    DATETIME_FORMAT:
      'yyyy-MM-dd HH:mm:ss',

    NULL_VALUE:
      '',

    DEFAULT_SHEET_NAME:
      'RDGConfig'

  },


  /**
   * ==============================================================
   * SHEETS
   * ==============================================================
   */

  SHEETS: {

    CONFIG:
      'RDGConfig',

    USERS:
      'RDGUsers',

    COMPANIES:
      'RDGCompanies',

    USER_COMPANIES:
      'RDGUserCompanies',

    SESSIONS:
      'RDGSessions',

    ROLES:
      'RDGRoles',

    PERMISSIONS:
      'RDGPermissions',

    GAMES:
      'RDGGames',

    DASHBOARD:
      'RDGDashboard',

    ROUTES:
      'RDGRoutes',

    ROUTE_POINTS:
      'RDGRoutePoints',

    CUSTOMERS:
      'RDGCustomers',

    VEHICLES:
      'RDGVehicles',

    DRIVERS:
      'RDGDrivers',

    ORDERS:
      'RDGOrders',

    INVOICES:
      'RDGInvoices',

    PAYMENTS:
      'RDGPayments',

    EXPENSES:
      'RDGExpenses',

    PRODUCTS:
      'RDGProducts',

    INVENTORY:
      'RDGInventory',

    AUDIT_LOG:
      'RDGAuditLog',

    /*
     * Compatibility alias used by AuditLogs.gs.
     */
    AUDIT_LOGS:
      'RDGAuditLog',

    NOTIFICATIONS:
      'RDGNotifications'

  },


  /**
   * ==============================================================
   * ROLES
   * ==============================================================
   */

  ROLES: {

    SUPER_ADMIN:
      'SUPER_ADMIN',

    ADMIN:
      'ADMIN',

    MANAGER:
      'MANAGER',

    ACCOUNTANT:
      'ACCOUNTANT',

    DISPATCHER:
      'DISPATCHER',

    SALES:
      'SALES',

    DRIVER:
      'DRIVER',

    STAFF:
      'STAFF',

    USER:
      'USER'

  },


  /**
   * ==============================================================
   * USER STATUS
   * ==============================================================
   */

  USER_STATUS: {

    ACTIVE:
      'ACTIVE',

    INACTIVE:
      'INACTIVE',

    PENDING:
      'PENDING',

    SUSPENDED:
      'SUSPENDED',

    BLOCKED:
      'BLOCKED',

    DELETED:
      'DELETED'

  },


  /**
   * ==============================================================
   * AUTHENTICATION
   * ==============================================================
   */

  AUTH: {

    SESSION_DURATION_MINUTES:
      1440,

    SESSION_DURATION_SECONDS:
      86400,

    REMEMBER_ME_DAYS:
      30,

    MAX_LOGIN_ATTEMPTS:
      5,

    LOCKOUT_MINUTES:
      15,

    PASSWORD_MIN_LENGTH:
      8,

    PASSWORD_MAX_LENGTH:
      200,

    REQUIRE_PASSWORD:
      true,

    ALLOW_EMAIL_LOGIN:
      true,

    ALLOW_PHONE_LOGIN:
      true,

    ALLOW_GOOGLE_LOGIN:
      true,

    ALLOW_FACEBOOK_LOGIN:
      true,

    REQUIRE_EMAIL_VERIFICATION:
      false,

    REQUIRE_PHONE_VERIFICATION:
      false,

    CASE_INSENSITIVE_EMAIL:
      true,

    NORMALIZE_PHONE:
      true

  },


  /**
   * ==============================================================
   * LOGIN TYPES
   * ==============================================================
   */

  LOGIN_TYPES: {

    EMAIL:
      'email',

    PHONE:
      'phone',

    GOOGLE:
      'google',

    FACEBOOK:
      'facebook'

  },


  /**
   * ==============================================================
   * AUTH PROVIDERS
   * ==============================================================
   */

  AUTH_PROVIDERS: {

    LOCAL:
      'local',

    EMAIL:
      'email',

    PHONE:
      'phone',

    GOOGLE:
      'google',

    FACEBOOK:
      'facebook'

  },


  /**
   * ==============================================================
   * COMPANY / MULTI-COMPANY
   * ==============================================================
   */

  COMPANY: {

    REQUIRE_COMPANY_SELECTION:
      true,

    ALLOW_MULTI_COMPANY:
      true,

    DEFAULT_COMPANY_ID:
      '',

    DEFAULT_COMPANY_CODE:
      '',

    DEFAULT_COMPANY_NAME:
      'Kiyani Advertising Trader',

    ENABLE_COMPANY_ISOLATION:
      true,

    ALLOW_CROSS_COMPANY:
      false,

    ALLOW_UNASSIGNED_RECORDS:
      false,

    REQUIRE_COMPANY_FOR_PROTECTED_DATA:
      true,

    COMPANY_FIELD_NAMES: [

      'CompanyID',

      'Company ID',

      'companyId',

      'company_id',

      'CompanyID'

    ]

  },


  /**
   * ==============================================================
   * API
   * ==============================================================
   */

  API: {

    PRIMARY_METHOD:
      'rdgApi',

    COMPATIBILITY_METHODS:
      [],

    VERSION:
      '4.2.0',

    MIN_SUPPORTED_VERSION:
      '4.0.0',

    ACTIONS: {

      PING:
        'ping',

      PING_SERVER:
        'pingRDGServer',

      BOOTSTRAP:
        'bootstrap',

      LOGIN:
        'login',

      SIGNUP:
        'signup',

      PHONE_LOGIN:
        'phoneLogin',

      GOOGLE_LOGIN:
        'googleLogin',

      FACEBOOK_LOGIN:
        'facebookLogin',

      LOGOUT:
        'logout',

      GET_SESSION:
        'getSession',

      SESSION:
        'session',

      GET_USER:
        'getUser',

      SET_COMPANY_CONTEXT:
        'setCompanyContext',

      GET_NAVIGATION:
        'getNavigation',

      NAVIGATION:
        'navigation',

      DASHBOARD:
        'dashboard',

      GAMES:
        'games',

      ROUTES:
        'routes',

      CUSTOMERS:
        'customers',

      VEHICLES:
        'vehicles',

      DRIVERS:
        'drivers',

      ORDERS:
        'orders',

      INVOICES:
        'invoices',

      PAYMENTS:
        'payments',

      EXPENSES:
        'expenses',

      PRODUCTS:
        'products',

      INVENTORY:
        'inventory',

      NOTIFICATIONS:
        'notifications',

      HEALTH:
        'health',

      DIAGNOSTIC:
        'diagnostic',

      BATCH:
        'batch'

    }

  },


  /**
   * ==============================================================
   * API GROUPS
   * ==============================================================
   */

  API_GROUPS: {

    PUBLIC: [

      'ping',

      'pingRDGServer',

      'bootstrap',

      'login',

      'signup',

      'phoneLogin',

      'googleLogin',

      'facebookLogin'

    ],

    AUTHENTICATED: [

      'logout',

      'getSession',

      'session',

      'getUser',

      'setCompanyContext',

      'getNavigation',

      'navigation',

      'dashboard',

      'games',

      'routes',

      'customers',

      'vehicles',

      'drivers',

      'orders',

      'invoices',

      'payments',

      'expenses',

      'products',

      'inventory',

      'notifications',

      'health',

      'diagnostic',

      'batch'

    ]

  },


  /**
   * ==============================================================
   * SECURITY — PRODUCTION
   * ==============================================================
   */

  SECURITY: {

    ENABLE_SESSION_VALIDATION:
      true,

    ENABLE_AUDIT_LOG:
      true,

    ENABLE_RATE_LIMITING:
      true,

    ENABLE_INPUT_VALIDATION:
      true,

    ENABLE_OUTPUT_SANITIZATION:
      true,

    ENABLE_CSRF_PROTECTION:
      true,

    REQUIRE_AUTH_FOR_PROTECTED_API:
      true,

    REQUIRE_AUTHENTICATION:
      true,

    /*
     * RDGServer v4.2.0 permission engine.
     *
     * false = compatibility mode.
     * true  = enforce role/user permissions.
     */
    PERMISSION_ENFORCEMENT_ENABLED:
      false,

    permissionEnforcementEnabled:
      false,

    /*
     * System identity.
     *
     * These values are configuration identities only.
     * They are NOT passwords or authentication secrets.
     */
    SYSTEM_USER_ID:
      'RDSYSTEM',

    SYSTEM_ROLE:
      'SYSTEM',

    systemUserId:
      'RDSYSTEM',

    systemRole:
      'SYSTEM',

    /*
     * Cross-company operations are server-controlled
     * and cannot be enabled by a client request.
     */
    ALLOW_CROSS_COMPANY:
      false,

    ALLOW_SYSTEM_OPERATION_FROM_CLIENT:
      false,

    ALLOW_HARD_DELETE_FROM_CLIENT:
      false,

    ALLOW_SKIP_AUDIT_FROM_CLIENT:
      false,

    /*
     * Password security.
     */
    HASH_ALGORITHM:
      'SHA-256',

    HMAC_ALGORITHM:
      'HMAC-SHA256',

    TOKEN_LENGTH:
      64,

    TOKEN_BYTES:
      32,

    TOKEN_ENCODING:
      'HEX',

    USE_RANDOM_SESSION_TOKENS:
      true,

    HASH_PASSWORDS:
      true,

    NEVER_STORE_PLAIN_PASSWORD:
      true,

    NEVER_STORE_PLAIN_SESSION_TOKEN:
      true,

    PASSWORD_HASH_ITERATIONS:
      1,

    /*
     * Security response policy.
     */
    HIDE_INTERNAL_ERRORS:
      true,

    SANITIZE_ERROR_MESSAGES:
      true,

    CONSTANT_TIME_SECRET_COMPARE:
      true

  },


  /**
   * ==============================================================
   * PERMISSIONS
   * ==============================================================
   *
   * Used by RDGServer.gs v4.2.0.
   *
   * Permission syntax:
   *
   *   *
   *   READ
   *   CREATE
   *   UPDATE
   *   DELETE
   *   READ:users
   *   UPDATE:users
   *   READ:AUDIT_LOGS
   *   AUDIT_READ
   *
   */

  PERMISSIONS: {

    WILDCARD:
      '*',

    READ:
      'READ',

    CREATE:
      'CREATE',

    UPDATE:
      'UPDATE',

    DELETE:
      'DELETE',

    AUDIT_READ:
      'AUDIT_READ',

    READ_AUDIT_LOGS:
      'READ:AUDIT_LOGS',

    LIST_AUDIT_LOGS:
      'LIST:AUDIT_LOGS',

    FIND_AUDIT_LOGS:
      'FIND:AUDIT_LOGS',

    READ_USERS:
      'READ:users',

    CREATE_USERS:
      'CREATE:users',

    UPDATE_USERS:
      'UPDATE:users',

    DELETE_USERS:
      'DELETE:users',

    READ_COMPANIES:
      'READ:companies',

    CREATE_COMPANIES:
      'CREATE:companies',

    UPDATE_COMPANIES:
      'UPDATE:companies',

    READ_GAMES:
      'READ:games',

    CREATE_GAMES:
      'CREATE:games',

    UPDATE_GAMES:
      'UPDATE:games',

    READ_ROUTES:
      'READ:routes',

    CREATE_ROUTES:
      'CREATE:routes',

    UPDATE_ROUTES:
      'UPDATE:routes',

    READ_CUSTOMERS:
      'READ:customers',

    CREATE_CUSTOMERS:
      'CREATE:customers',

    UPDATE_CUSTOMERS:
      'UPDATE:customers'

  },


  /**
   * ==============================================================
   * ROLE PERMISSIONS
   * ==============================================================
   *
   * Permission enforcement is disabled by default for
   * backward compatibility.
   *
   * Once enabled, these become the baseline role permissions.
   */

  ROLE_PERMISSIONS: {

    SUPER_ADMIN: [

      '*'

    ],

    ADMIN: [

      'READ',

      'CREATE',

      'UPDATE',

      'DELETE',

      'READ:AUDIT_LOGS',

      'LIST:AUDIT_LOGS',

      'FIND:AUDIT_LOGS',

      'AUDIT_READ'

    ],

    MANAGER: [

      'READ',

      'CREATE',

      'UPDATE',

      'READ:AUDIT_LOGS',

      'LIST:AUDIT_LOGS',

      'FIND:AUDIT_LOGS'

    ],

    ACCOUNTANT: [

      'READ',

      'CREATE',

      'UPDATE',

      'READ:AUDIT_LOGS'

    ],

    DISPATCHER: [

      'READ',

      'CREATE',

      'UPDATE'

    ],

    SALES: [

      'READ',

      'CREATE',

      'UPDATE'

    ],

    DRIVER: [

      'READ'

    ],

    STAFF: [

      'READ',

      'CREATE',

      'UPDATE'

    ],

    USER: [

      'READ'

    ]

  },


  /**
   * ==============================================================
   * USER-SPECIFIC PERMISSION SOURCE
   * ==============================================================
   */

  USER_PERMISSIONS: {

    ENABLED:
      true,

    FIELD:
      'permissions',

    SECURITY_FIELD:
      'security.permissions',

    ALLOW_WILDCARD:
      true

  },


  /**
   * ==============================================================
   * AUDIT
   * ==============================================================
   */

  AUDIT: {

    ENABLED:
      true,

    TABLE_KEY:
      'AUDIT_LOGS',

    SHEET_NAME:
      'RDGAuditLog',

    IMMUTABLE:
      true,

    ALLOW_APPLICATION_DELETE:
      false,

    ALLOW_APPLICATION_UPDATE:
      false,

    ALLOW_HARD_DELETE:
      false,

    LOG_LOGIN:
      true,

    LOG_LOGOUT:
      true,

    LOG_SIGNUP:
      true,

    LOG_CREATE:
      true,

    LOG_UPDATE:
      true,

    LOG_DELETE:
      true,

    LOG_PERMISSION_CHANGE:
      true,

    LOG_COMPANY_CHANGE:
      true,

    LOG_FAILED_LOGIN:
      true,

    LOG_SESSION_FAILURE:
      true,

    LOG_SECURITY_EVENTS:
      true,

    LOG_API_REQUESTS:
      true,

    LOG_API_ERRORS:
      true,

    LOG_BATCH_OPERATIONS:
      true,

    /*
     * Audit read controls.
     */
    REQUIRE_AUTH_FOR_READ:
      true,

    REQUIRE_PERMISSION_FOR_READ:
      true,

    READ_PERMISSION:
      'READ:AUDIT_LOGS',

    AUDIT_READ_PERMISSION:
      'AUDIT_READ',

    LIST_PERMISSION:
      'LIST:AUDIT_LOGS',

    FIND_PERMISSION:
      'FIND:AUDIT_LOGS',

    DEFAULT_LIMIT:
      100,

    MAX_LIMIT:
      1000,

    MAX_SCAN_RECORDS:
      50000,

    ENABLE_PAGINATION:
      true,

    ENABLE_COMPANY_ISOLATION:
      true,

    INCLUDE_UNASSIGNED_FOR_SYSTEM_ONLY:
      true

  },


  /**
   * ==============================================================
   * DASHBOARD
   * ==============================================================
   */

  DASHBOARD: {

    CACHE_SECONDS:
      60,

    MAX_RECENT_RECORDS:
      20,

    LOAD_GAMES:
      true,

    LOAD_ROUTES:
      true,

    LOAD_CUSTOMERS:
      true,

    LOAD_ORDERS:
      true,

    LOAD_INVOICES:
      true,

    LOAD_PAYMENTS:
      true,

    LOAD_EXPENSES:
      true

  },


  /**
   * ==============================================================
   * PAGINATION
   * ==============================================================
   */

  PAGINATION: {

    DEFAULT_PAGE_SIZE:
      25,

    MAX_PAGE_SIZE:
      100,

    DEFAULT_PAGE:
      1,

    MAX_PAGE:
      100000

  },


  /**
   * ==============================================================
   * BATCH
   * ==============================================================
   *
   * Used by RDGServer.gs v4.2.0 BATCH action.
   */

  BATCH: {

    ENABLED:
      true,

    DEFAULT_SIZE:
      50,

    MAX_SIZE:
      100,

    ALLOW_NESTED_BATCH:
      false,

    STOP_ON_ERROR:
      false,

    REQUIRE_AUTH:
      true,

    AUDIT_BATCH:
      true

  },


  /**
   * ==============================================================
   * API LIMITS
   * ==============================================================
   */

  API_LIMITS: {

    MAX_REQUEST_SIZE:
      500000,

    MAX_RESPONSE_SIZE:
      1000000,

    MAX_BATCH_SIZE:
      100,

    MAX_ROWS_PER_REQUEST:
      500,

    MAX_SEARCH_LENGTH:
      100,

    MAX_FILTER_FIELDS:
      50,

    MAX_SORT_FIELDS:
      10

  },


  /**
   * ==============================================================
   * CACHE
   * ==============================================================
   */

  CACHE: {

    ENABLED:
      true,

    CONFIG_SECONDS:
      3600,

    USER_SECONDS:
      300,

    COMPANY_SECONDS:
      300,

    DASHBOARD_SECONDS:
      60,

    GAMES_SECONDS:
      300,

    PERMISSION_SECONDS:
      300,

    SESSION_SECONDS:
      300

  },


  /**
   * ==============================================================
   * LOCK
   * ==============================================================
   */

  LOCK: {

    WAIT_MILLISECONDS:
      10000,

    ENABLE_SCRIPT_LOCK:
      true,

    ENABLE_USER_LOCK:
      false,

    ENABLE_DOCUMENT_LOCK:
      false

  },


  /**
   * ==============================================================
   * RESPONSE
   * ==============================================================
   */

  RESPONSE: {

    SUCCESS_FIELD:
      'success',

    DATA_FIELD:
      'data',

    MESSAGE_FIELD:
      'message',

    ERROR_FIELD:
      'error',

    CODE_FIELD:
      'code',

    REQUEST_ID_FIELD:
      'requestId',

    VERSION_FIELD:
      'version',

    TIMESTAMP_FIELD:
      'timestamp'

  },


  /**
   * ==============================================================
   * ERROR CODES
   * ==============================================================
   */

  ERRORS: {

    UNKNOWN:
      'RDG_UNKNOWN_ERROR',

    INVALID_REQUEST:
      'RDG_INVALID_REQUEST',

    UNAUTHORIZED:
      'RDG_UNAUTHORIZED',

    AUTH_REQUIRED:
      'RDG_AUTH_REQUIRED',

    AUTH_INVALID:
      'RDG_AUTH_INVALID',

    FORBIDDEN:
      'RDG_FORBIDDEN',

    PERMISSION_DENIED:
      'RDG_PERMISSION_DENIED',

    USER_NOT_FOUND:
      'RDG_USER_NOT_FOUND',

    INVALID_CREDENTIALS:
      'RDG_INVALID_CREDENTIALS',

    USER_EXISTS:
      'RDG_USER_EXISTS',

    EMAIL_EXISTS:
      'RDG_EMAIL_EXISTS',

    PHONE_EXISTS:
      'RDG_PHONE_EXISTS',

    SESSION_NOT_FOUND:
      'RDG_SESSION_NOT_FOUND',

    SESSION_EXPIRED:
      'RDG_SESSION_EXPIRED',

    INVALID_SESSION:
      'RDG_INVALID_SESSION',

    SESSION_REVOKED:
      'RDG_SESSION_REVOKED',

    COMPANY_REQUIRED:
      'RDG_COMPANY_REQUIRED',

    COMPANY_NOT_FOUND:
      'RDG_COMPANY_NOT_FOUND',

    COMPANY_ACCESS_DENIED:
      'RDG_COMPANY_ACCESS_DENIED',

    DATABASE_ERROR:
      'RDG_DATABASE_ERROR',

    SHEET_NOT_FOUND:
      'RDG_SHEET_NOT_FOUND',

    HEADER_ERROR:
      'RDG_HEADER_ERROR',

    VALIDATION_ERROR:
      'RDG_VALIDATION_ERROR',

    RATE_LIMITED:
      'RDG_RATE_LIMITED',

    CSRF_ERROR:
      'RDG_CSRF_ERROR',

    METHOD_NOT_ALLOWED:
      'RDG_METHOD_NOT_ALLOWED',

    BATCH_ERROR:
      'RDG_BATCH_ERROR',

    AUDIT_PERMISSION_DENIED:
      'RDG_AUDIT_PERMISSION_DENIED',

    AUDIT_IMMUTABLE:
      'RDG_AUDIT_IMMUTABLE',

    COMPANY_CONTEXT_REQUIRED:
      'RDG_COMPANY_CONTEXT_REQUIRED'

  },


  /**
   * ==============================================================
   * ROUTE STATUS
   * ==============================================================
   */

  ROUTE_STATUS: {

    DRAFT:
      'DRAFT',

    PLANNED:
      'PLANNED',

    ACTIVE:
      'ACTIVE',

    COMPLETED:
      'COMPLETED',

    CANCELLED:
      'CANCELLED',

    ARCHIVED:
      'ARCHIVED'

  },


  /**
   * ==============================================================
   * ORDER STATUS
   * ==============================================================
   */

  ORDER_STATUS: {

    DRAFT:
      'DRAFT',

    CONFIRMED:
      'CONFIRMED',

    PROCESSING:
      'PROCESSING',

    DISPATCHED:
      'DISPATCHED',

    DELIVERED:
      'DELIVERED',

    CANCELLED:
      'CANCELLED'

  },


  /**
   * ==============================================================
   * PAYMENT STATUS
   * ==============================================================
   */

  PAYMENT_STATUS: {

    UNPAID:
      'UNPAID',

    PARTIAL:
      'PARTIAL',

    PAID:
      'PAID',

    REFUNDED:
      'REFUNDED',

    CANCELLED:
      'CANCELLED'

  },


  /**
   * ==============================================================
   * CURRENCY SYSTEM
   * ==============================================================
   */

  CURRENCY: {

    ENABLED:
      true,

    DEFAULT_CURRENCY:
      'COIN',

    BASE_CURRENCIES: {

      SILVER:
        'SILVER',

      CROWN:
        'CROWN',

      COIN:
        'COIN',

      STONE:
        'STONE',

      DIAMOND:
        'DIAMOND'

    },

    SPECIAL_CURRENCIES: {

      SUPER_CROWN:
        'SUPER_CROWN',

      SUPER_STONE:
        'SUPER_STONE'

    },

    MASTER_CURRENCIES: {

      MASTER_SILVER:
        'MASTER_SILVER',

      MASTER_COIN:
        'MASTER_COIN',

      MASTER_DIAMOND:
        'MASTER_DIAMOND'

    },

    NAMES: {

      SILVER:
        'Silver',

      MASTER_SILVER:
        'Master Silver',

      CROWN:
        'Crown',

      SUPER_CROWN:
        'Super Crown',

      COIN:
        'Coin',

      MASTER_COIN:
        'Master Coin',

      STONE:
        'Stone',

      SUPER_STONE:
        'Super Stone',

      DIAMOND:
        'Diamond',

      MASTER_DIAMOND:
        'Master Diamond'

    },

    VALUE_ORDER: [

      'SILVER',

      'SUPER_CROWN',

      'COIN',

      'SUPER_STONE',

      'DIAMOND'

    ],

    VALUE: {

      SILVER:
        1,

      SUPER_CROWN:
        2,

      COIN:
        3,

      SUPER_STONE:
        4,

      DIAMOND:
        5

    },

    TYPE: {

      SILVER:
        'BASE',

      MASTER_SILVER:
        'MASTER',

      CROWN:
        'BASE',

      SUPER_CROWN:
        'SUPER',

      COIN:
        'BASE',

      MASTER_COIN:
        'MASTER',

      STONE:
        'BASE',

      SUPER_STONE:
        'SUPER',

      DIAMOND:
        'BASE',

      MASTER_DIAMOND:
        'MASTER'

    }

  },


  /**
   * ==============================================================
   * LIMITS
   * ==============================================================
   */

  LIMITS: {

    MAX_STRING_LENGTH:
      500,

    MAX_DESCRIPTION_LENGTH:
      2000,

    MAX_ROWS_PER_REQUEST:
      500,

    MAX_BATCH_SIZE:
      100,

    MAX_SEARCH_LENGTH:
      100,

    MAX_PAGE_SIZE:
      100,

    MAX_HEADER_LENGTH:
      100,

    MAX_SHEET_NAME_LENGTH:
      100,

    MAX_FILTER_FIELDS:
      50,

    MAX_NESTED_DEPTH:
      8,

    MAX_AUDIT_SCAN:
      50000

  }

};


/**
 * ================================================================
 * RDG DATABASE HEADERS
 * ================================================================
 */

const RDG_HEADERS = {

  RDGUsers: [

    'UserID',
    'Name',
    'Email',
    'Phone',
    'PasswordHash',
    'Role',
    'Status',
    'AuthProvider',
    'GoogleID',
    'FacebookID',
    'EmailVerified',
    'PhoneVerified',
    'LastLogin',
    'LoginAttempts',
    'LockedUntil',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGCompanies: [

    'CompanyID',
    'CompanyCode',
    'CompanyName',
    'OwnerUserID',
    'Email',
    'Phone',
    'Address',
    'Status',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGUserCompanies: [

    'ID',
    'UserID',
    'CompanyID',
    'Role',
    'Status',
    'IsDefault',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGSessions: [

    'SessionID',
    'UserID',
    'CompanyID',
    'TokenHash',
    'CreatedAt',
    'ExpiresAt',
    'LastActivity',
    'IPAddress',
    'UserAgent',
    'Status'

  ],


  RDGRoles: [

    'RoleID',
    'RoleCode',
    'RoleName',
    'Description',
    'Status',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGPermissions: [

    'PermissionID',
    'PermissionCode',
    'PermissionName',
    'Module',
    'Action',
    'Description',
    'Status'

  ],


  RDGGames: [

    'GameID',
    'GameCode',
    'GameName',
    'Description',
    'Status',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGRoutes: [

    'RouteID',
    'RouteCode',
    'CompanyID',
    'RouteName',
    'DriverID',
    'VehicleID',
    'RouteDate',
    'Status',
    'StartLocation',
    'EndLocation',
    'Distance',
    'Notes',
    'CreatedBy',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGRoutePoints: [

    'PointID',
    'RouteID',
    'SequenceNo',
    'Latitude',
    'Longitude',
    'LocationName',
    'CustomerID',
    'Status',
    'VisitedAt',
    'Notes'

  ],


  RDGCustomers: [

    'CustomerID',
    'CompanyID',
    'CustomerCode',
    'CustomerName',
    'ContactPerson',
    'Phone',
    'Email',
    'Address',
    'City',
    'Latitude',
    'Longitude',
    'Status',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGVehicles: [

    'VehicleID',
    'CompanyID',
    'VehicleNumber',
    'RegistrationNumber',
    'VehicleType',
    'DriverID',
    'Status',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGDrivers: [

    'DriverID',
    'CompanyID',
    'UserID',
    'DriverName',
    'Phone',
    'LicenseNumber',
    'Status',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGOrders: [

    'OrderID',
    'CompanyID',
    'CustomerID',
    'OrderNumber',
    'OrderDate',
    'DeliveryDate',
    'Status',
    'TotalAmount',
    'PaidAmount',
    'BalanceAmount',
    'CreatedBy',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGInvoices: [

    'InvoiceID',
    'CompanyID',
    'CustomerID',
    'OrderID',
    'InvoiceNumber',
    'InvoiceDate',
    'DueDate',
    'TotalAmount',
    'PaidAmount',
    'BalanceAmount',
    'Status',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGPayments: [

    'PaymentID',
    'CompanyID',
    'CustomerID',
    'InvoiceID',
    'PaymentDate',
    'Amount',
    'PaymentMethod',
    'Reference',
    'Notes',
    'CreatedBy',
    'CreatedAt'

  ],


  RDGExpenses: [

    'ExpenseID',
    'CompanyID',
    'ExpenseDate',
    'Category',
    'Description',
    'Amount',
    'PaymentMethod',
    'Reference',
    'CreatedBy',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGProducts: [

    'ProductID',
    'CompanyID',
    'ProductCode',
    'ProductName',
    'Category',
    'Unit',
    'PurchasePrice',
    'SalePrice',
    'Status',
    'CreatedAt',
    'UpdatedAt'

  ],


  RDGInventory: [

    'InventoryID',
    'CompanyID',
    'ProductID',
    'Quantity',
    'MinimumQuantity',
    'Location',
    'LastUpdated'

  ],


  RDGAuditLog: [

    'LogID',
    'Timestamp',
    'UserID',
    'CompanyID',
    'Action',
    'Module',
    'RecordID',
    'Description',
    'IPAddress',
    'Status'

  ],


  RDGNotifications: [

    'NotificationID',
    'UserID',
    'CompanyID',
    'Title',
    'Message',
    'Type',
    'IsRead',
    'CreatedAt',
    'ReadAt'

  ]

};


/**
 * ================================================================
 * APP_CONFIG COMPATIBILITY ALIAS
 * ================================================================
 *
 * RDGServer.gs v4.2.0 and older modules may reference APP_CONFIG.
 *
 * Keep this alias so we do not need to rewrite every existing
 * server/database function.
 *
 * ================================================================
 */

var APP_CONFIG = RDG_CONFIG;


/**
 * ================================================================
 * CONFIG ACCESS HELPERS
 * ================================================================
 */


/**
 * Get nested configuration value.
 *
 * Example:
 *
 * getConfigValue_(
 *   'security.permissionEnforcementEnabled',
 *   false
 * );
 */
function getConfigValue_(
  path,
  defaultValue
) {

  try {

    const parts =
      String(path || '')
        .split('.')
        .filter(
          function(part) {
            return part !== '';
          }
        );

    let current =
      RDG_CONFIG;

    for (
      let i = 0;
      i < parts.length;
      i++
    ) {

      if (
        current === null ||
        current === undefined ||
        !Object.prototype.hasOwnProperty
          .call(
            current,
            parts[i]
          )
      ) {

        return defaultValue;

      }

      current =
        current[parts[i]];

    }

    return (
      current === undefined
        ? defaultValue
        : current
    );

  } catch (error) {

    return defaultValue;

  }

}


/**
 * ================================================================
 * PERMISSION CONFIG HELPERS
 * ================================================================
 */


/**
 * Return role permissions.
 */
function getRolePermissions_(
  role
) {

  role =
    String(
      role || ''
    )
    .trim()
    .toUpperCase();

  const permissions =
    RDG_CONFIG.ROLE_PERMISSIONS[
      role
    ];

  if (
    !Array.isArray(permissions)
  ) {

    return [];

  }

  return permissions.slice();

}


/**
 * Return whether centralized permission enforcement is enabled.
 */
function isPermissionEnforcementEnabled_() {

  return (
    RDG_CONFIG.SECURITY &&
    RDG_CONFIG.SECURITY
      .PERMISSION_ENFORCEMENT_ENABLED === true
  );

}


/**
 * ================================================================
 * CONFIG HEALTH
 * ================================================================
 */

function rdgConfigHealthCheck() {

  const errors = [];

  try {

    if (
      !RDG_CONFIG.APP
    ) {

      errors.push(
        'APP configuration missing.'
      );

    }

    if (
      !RDG_CONFIG.DATABASE
    ) {

      errors.push(
        'DATABASE configuration missing.'
      );

    }

    if (
      !RDG_CONFIG.SHEETS
    ) {

      errors.push(
        'SHEETS configuration missing.'
      );

    }

    if (
      !RDG_HEADERS
    ) {

      errors.push(
        'RDG_HEADERS missing.'
      );

    }

    if (
      RDG_CONFIG.BATCH.MAX_SIZE >
      RDG_CONFIG.LIMITS.MAX_BATCH_SIZE
    ) {

      errors.push(
        'BATCH.MAX_SIZE exceeds LIMITS.MAX_BATCH_SIZE.'
      );

    }

    if (
      RDG_CONFIG.AUDIT.MAX_LIMIT >
      RDG_CONFIG.LIMITS.MAX_AUDIT_SCAN
    ) {

      errors.push(
        'Audit limit configuration is inconsistent.'
      );

    }

  } catch (error) {

    errors.push(
      error.message
    );

  }

  return {

    success:
      errors.length === 0,

    healthy:
      errors.length === 0,

    version:
      RDG_CONFIG.APP.VERSION,

    environment:
      RDG_CONFIG.APP.ENVIRONMENT,

    permissionEnforcement:
      isPermissionEnforcementEnabled_(),

    companyIsolation:
      RDG_CONFIG.COMPANY
        .ENABLE_COMPANY_ISOLATION,

    auditImmutable:
      RDG_CONFIG.AUDIT
        .IMMUTABLE,

    batchEnabled:
      RDG_CONFIG.BATCH
        .ENABLED,

    errors:
      errors,

    timestamp:
      new Date().toISOString()

  };

}


/**
 * ================================================================
 * CONFIG DIAGNOSTICS
 * ================================================================
 */

function rdgConfigDiagnostics() {

  return {

    success:
      true,

    module:
      'RDG_CONFIG',

    version:
      RDG_CONFIG.APP.VERSION,

    environment:
      RDG_CONFIG.APP.ENVIRONMENT,

    database: {

      headerRow:
        RDG_CONFIG.DATABASE.HEADER_ROW,

      dataStartRow:
        RDG_CONFIG.DATABASE.DATA_START_ROW,

      mainSheet:
        RDG_CONFIG.DATABASE.MAIN_SHEET_NAME

    },

    security: {

      authentication:
        RDG_CONFIG.SECURITY
          .REQUIRE_AUTHENTICATION,

      permissions:
        isPermissionEnforcementEnabled_(),

      companyIsolation:
        RDG_CONFIG.COMPANY
          .ENABLE_COMPANY_ISOLATION,

      csrf:
        RDG_CONFIG.SECURITY
          .ENABLE_CSRF_PROTECTION,

      rateLimiting:
        RDG_CONFIG.SECURITY
          .ENABLE_RATE_LIMITING

    },

    audit: {

      enabled:
        RDG_CONFIG.AUDIT.ENABLED,

      immutable:
        RDG_CONFIG.AUDIT.IMMUTABLE,

      readPermission:
        RDG_CONFIG.AUDIT
          .READ_PERMISSION,

      maxLimit:
        RDG_CONFIG.AUDIT
          .MAX_LIMIT

    },

    api: {

      version:
        RDG_CONFIG.API.VERSION,

      batch:
        RDG_CONFIG.BATCH.ENABLED,

      maxBatch:
        RDG_CONFIG.BATCH.MAX_SIZE

    }

  };

}