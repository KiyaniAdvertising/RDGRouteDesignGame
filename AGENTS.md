

# RDG Universal RouteDesign Game
# AGENTS.md — Master Development Rules

## 1. PROJECT IDENTITY

Project:
RD Route Design / RDG Universal Multi-Platform System

Main identities:
- RD = Parent / Main RD Software
- RDA = RD Route Design ACC
- RDG = RD Route Design Games
- RDH = RD Route Design Hardware

Public display:
- RD Route Design
- Powered by Kiyani Advertising Trader

Contact:
- Nasir Ali Kiyani

This is an EXISTING project.
DO NOT restart, redesign, simplify, or recreate the architecture from zero.

---

## 2. PRIMARY DEVELOPMENT PRINCIPLE

Always inspect the existing source before changing anything.

Required order:

1. Inspect existing file.
2. Identify its current version and public functions.
3. Check dependencies.
4. Check duplicate declarations.
5. Check authority ownership.
6. Propose the smallest safe change.
7. Apply only the required change.
8. Run static validation.
9. Run runtime validation where possible.
10. Report exactly what changed.
11. Never claim runtime PASS from static analysis alone.

Static PASS != Runtime PASS.

---

## 3. SOURCE OF TRUTH

The existing project source is the primary authority.

Do NOT fabricate missing historical code.

If an older version is required:
- search existing project files;
- search Library/source archives when available;
- identify the exact version;
- preserve verified public functions.

If the exact historical implementation cannot be found:
STOP and report that it is unavailable.

Do not invent replacement code and call it historical.

---

## 4. ARCHITECTURE

Current target architecture:

Google Apps Script + Google Sheets
        ↓
Universal RDG Server/API/Security
        ↓
RDG Game Modules
        ↓
Web / Firebase Hosting / Offline HTML
        ↓
Future Android / Desktop / API / Local Server

Firebase Hosting is a FRONTEND/HOSTING layer.

Firebase must NOT automatically replace:
- Google Apps Script
- Google Sheets
- RDGServer
- Database.gs
- Wallet/Economy authorities

Unless a separate migration is explicitly approved.

---

## 5. CORE AUTHORITIES

### Database.gs
Authority for:
- Google Sheets CRUD
- record creation
- record updates
- record reads
- record deletion
- database-level operations

Do not duplicate database authority elsewhere.

### RDGServer.gs
Authority for:
- server/API boundary
- request routing
- security boundary
- server-side game/business API

Do not create another competing RDG server.

### Audit.gs
Authority for:
- audit writing

### AuditLogs.gs
Authority for:
- audit log access
- secure/read-only audit functionality

### RDEconomyCurrency.gs
Authority for:
- gaming currency/economy

Do not create separate per-game currency authorities.

### CurrencyRates.gs
Authority for:
- canonical currency/rate definitions

Do not invent or rename canonical currencies.

### GameStation.gs
Authority for:
- central game orchestration

GameStation does NOT replace:
- GameMatchmaking.gs
- GameRooms.gs
- GameEngine.gs
- individual game modules
- wallet/economy modules

---

## 6. UNIVERSAL SYSTEM RULE

The following must remain shared/universal:

- Authentication
- User
- Session
- Company
- Role
- Permission
- Wallet
- Economy
- Currency
- RDGServer/API
- Backup
- Audit

Do NOT create duplicate versions inside individual games.

Example:

CORRECT:

Player
  ↓
Universal Auth
  ↓
GameStation
  ↓
GameMatchmaking
  ↓
GameRoom
  ↓
GameEngine
  ↓
Game
  ↓
Universal Economy

INCORRECT:

Game
  ↓
Own Auth
  ↓
Own Wallet
  ↓
Own Currency
  ↓
Own Database

---

## 7. GAME300

Game300 currently represents the universal game catalogue.

Important distinction:

ACTIVE != LINKED != PLAYABLE

Current recorded setup:

- Total games: 300
- Active: 300
- Linked: 3
- Playable: 3
- Inactive: 0
- Unlinked: 297
- Unplayable: 297

Current linked/playable games include:
- Ludo
- Snake
- Carrom

Do not automatically mark all 300 games playable.

A game must have its required implementation and integration before becoming PLAYABLE.

---

## 8. GAME ENGINE

GameEngine authority:

Sheet:
GameEngine

Table:
GAME_ENGINE

ID:
GEN

Session statuses:

- WAITING
- READY
- RUNNING
- PAUSED
- COMPLETED
- CANCELLED
- FAILED

Maximum state size:

45000

Lock duration:

15000 ms

Do not change these values without inspecting dependencies and documenting the reason.

---

## 9. GAME STATION

GameStation is the central orchestration layer.

Version:
1.0.0

Runtime marker:

RD_GAME_STATION_RUNTIME_1.0.0

Known verification hash:

a59c44c278440ae05121ff9d5bfcd89efd131ebfe2fc014f7abe52ae1a6f004d

Important constants:

MAX_ROOM_SLOTS = 12

Levels:
1–12

Invite modes:

- PLAYER_SELF_INVITE
- SYSTEM_INVITE
- IN_ROOM_JOIN

Fallback:

- LEVEL_FALLBACK
- ROBOT_AUTO

Participants:

- HUMAN
- ROBOT
- AUTO

Default game currency:

COIN

Known game profiles:

- 2048
- LUDO
- SNAKE
- CARROM

---

## 10. GAME CAPACITY

Ludo:
2–12 players

Snake:
up to 12 players

Carrom:
2–4 players

Do not silently change capacity rules.

---

## 11. UNIVERSAL RDG FEATURES

Future/current games should use universal RDG services where applicable:

- In-game voice
- Global live voice rooms
- Chat
- VIP functionality
- Video calls where applicable
- Tournaments
- Invitations
- Level-based access
- VIP-based access
- Robot/auto participation
- Game rewards
- Game transactions
- Gaming revenue

Do not duplicate these systems inside each game.

---

## 12. ECONOMY

Canonical historical currency names must be preserved.

Known names include:

- MasterDiamond
- MasterSton
- MasterCoin
- MasterCrown
- MasterSilver

Currency family reference:

- BlackGold
- Silver
- WhiteGold
- Ston
- RadGold
- Crown
- GreenGold
- Coin
- Gold
- Diamond

Do not change "Ston" spelling.

Do not invent replacement currency names.

CurrencyRates reference:
Version 4.3.7

Rate formula reference:
position × 2%

Range:
2–60

Signup credits:
once per account ID

All monetary/game economy operations must maintain:
- precision
- idempotency
- locking
- transaction integrity
- ledger consistency

---

## 13. MONEY / WALLET SAFETY

Never directly modify wallet balances without the canonical economy/transaction authority.

Every money-related operation should consider:

- transaction ID
- idempotency
- duplicate prevention
- locking
- audit
- currency
- amount precision
- source
- destination
- status
- failure handling

Never create a shortcut such as:

wallet.balance += amount

unless it is part of the verified canonical transaction implementation.

---

## 14. GAME POWER ITEMS

Game items such as:

- Bomb
- Attack
- Shield
- Boost
- other power items

must have:

- price
- canonical currency
- purchase limits
- ownership tracking
- quantity tracking
- transaction record

Do not hard-code economy logic separately inside each game.

---

## 15. CHATROOMS

ChatRooms authority:

Table:
CHAT_ROOMS

Header row:
A3

Room types:

- TEXT
- VOICE

Privacy:

- PUBLIC
- PRIVATE

Statuses:

- ACTIVE
- INACTIVE
- CLOSED
- BANNED

Existing public labels:

- User Tayp
- Chatting Work
- Chatting Live Global

Validation requirements:

- owner user
- company
- duplicate room name per company
- private password handling
- VOICE requires Voice Enabled

---

## 16. RDG CLIENT FILE NAMES

Canonical Apps Script client names:

- RDGGame
- RDGScript
- RDGStyle
- RDGServer
- RDGConfig
- RDGUtils

Do NOT create:

- RDGScript.js
- RDGStyle.js
- RDGConfig.js

Apps Script HTML/GS naming conventions must remain compatible with the existing project.

---

## 17. FIREBASE HOSTING

Firebase Hosting is currently intended as the web/static hosting layer.

Known Firebase project:

Project:
RDG Universal RouteDesign Gmae

Project ID:

qualified-day-399213

Hosting site:

qualified-day-399213-f0373

Hosting domains:

qualified-day-399213-f0373.web.app
qualified-day-399213-f0373.firebaseapp.com

Do not create another Firebase project unless explicitly requested.

Do not replace the existing backend merely because Firebase Hosting is being used.

---

## 18. FIREBASE FREE-FIRST REQUIREMENT

The project should use free-tier services wherever technically possible.

Do not intentionally introduce paid services.

Before introducing a service that may incur charges:

1. identify the service;
2. explain why it is required;
3. identify its free-tier limitations;
4. identify possible billing;
5. obtain explicit approval.

Never silently create paid infrastructure.

---

## 19. FIREBASE FRONTEND / APPS SCRIPT BACKEND

Target architecture:

Firebase Hosting
        ↓
RDG Web Frontend
        ↓
HTTP/API bridge
        ↓
Google Apps Script Web App
        ↓
RDGServer
        ↓
apiRequest()
        ↓
Database / Game / Economy authorities

Do not duplicate RDGServer inside Firebase.

Do not move backend logic into browser JavaScript.

Never expose secrets or server-side credentials in frontend code.

---

## 20. GAS HTML COMPATIBILITY

Existing GAS HTML may use:

google.script.run

Example:

serverCall()
    ↓
google.script.run
    ↓
rdgApi(action,payload)

This works inside Apps Script HTML runtime.

It does NOT automatically work on Firebase Hosting.

Therefore:

Do not simply copy a GAS HTML file to Firebase and claim it is production-ready.

A Firebase-compatible bridge must be established before removing/replacing google.script.run.

---

## 21. API AUTHORITY

Existing RDGServer contains:

rdgApi(action, payload)

and:

apiRequest(request)

These are important existing API functions.

Before creating any new HTTP API:

1. inspect current rdgApi;
2. inspect apiRequest;
3. inspect current doGet;
4. inspect doPost if present;
5. inspect ContentService usage;
6. inspect authentication;
7. inspect CORS behavior;
8. inspect deployment settings;
9. preserve existing public functions.

Do not create a competing API endpoint without architectural approval.

---

## 22. LEGACY API FILES

Files such as API.js or other historical API implementations must be treated as legacy/reference until verified.

Never merge them automatically into RDGServer.

Before using legacy code:

- compare architecture;
- compare public functions;
- compare authentication;
- compare routing;
- compare response format;
- identify duplicate doGet/doPost;
- identify duplicate API dispatchers.

One canonical HTTP/API authority must be established.

---

## 23. DUPLICATE DECLARATIONS

Duplicate declarations are a critical issue.

Known historical example:

WTX_TABLE_KEY_

Before deleting anything:

1. search the complete project;
2. identify all declarations;
3. identify which file/version is canonical;
4. check references;
5. remove only confirmed duplicate source;
6. re-run syntax checks;
7. run Apps Script runtime tests.

Never delete based on filename alone.

---

## 24. DO NOT FABRICATE FIXES

If an error reports:

Identifier already declared

or similar:

Do not immediately rewrite the entire file.

First:

- locate every declaration;
- determine whether the duplicate is inside the same file or across Apps Script files;
- identify the canonical declaration;
- preserve dependent functions.

---

## 25. VERSION CONTROL

Every meaningful source change should preserve:

- file name
- version
- change reason
- date
- runtime marker where applicable
- verification result

Do not overwrite verified source blindly.

Before large changes create an archive/backup.

---

## 26. BACKUP POLICY

Maintain multiple recovery layers:

1. Local master project
2. Version-controlled repository
3. Archived ZIP snapshot

GitHub is NOT the only backup.

Firebase Hosting is NOT a source-code backup.

A deployment is NOT a backup.

Never delete the previous verified source before a new version has been validated.

---

## 27. AGENT SAFETY RULE

The coding agent must operate conservatively.

Before modifying files:

- inspect;
- explain;
- propose;
- wait for approval when the change is architectural or destructive.

For small, explicitly requested edits, apply only the requested edit.

Never:

- delete whole modules without approval;
- rename canonical files casually;
- recreate the project;
- replace working architecture with a new framework;
- create duplicate authorities;
- invent missing source;
- silently upgrade dependencies.

---

## 28. ONE FILE AT A TIME

When providing manual code to the user:

Use this format:

# FILE: filename

## Version

## Where to paste

## Complete code

## Verification

Do not send multiple large files at once unless explicitly requested.

---

## 29. TESTING

Testing must distinguish:

### Static
- syntax
- duplicate declarations
- references
- structure
- imports/dependencies

### Runtime
- Apps Script execution
- Google Sheets access
- authentication
- locks
- database writes
- API responses
- game sessions
- economy transactions

Static PASS must never be reported as Runtime PASS.

---

## 30. PRODUCTION READINESS

A module is NOT production-ready merely because:

- code looks correct;
- Node syntax passes;
- HTML loads;
- Firebase deploy succeeds.

Production validation must include relevant runtime/security checks.

---

## 31. CURRENT DEPLOYMENT STRATEGY

Current goal:

Make RDG games available through the web while continuing backend development.

Target:

Firebase Hosting
+
existing Apps Script backend
+
existing RDGServer
+
Google Sheets database

Do not migrate backend unless explicitly approved.

---

## 32. EARNING / REVENUE

Revenue functionality may be added later.

Separate:

RDG Gaming Revenue

from:

RD Main Business Profit

Do not mix accounting authorities.

Any future monetization must:

- preserve free-first development;
- use explicit approval;
- maintain transaction records;
- maintain audit records;
- preserve economy authority;
- avoid hidden paid services.

---

## 33. CURRENT PROJECT STATUS

Known status:

Game300Setup:
- Total 300
- Active 300
- Linked 3
- Playable 3
- Inactive 0
- Unlinked 297
- Unplayable 297

Known runtime blocker from previous work:

WalletTransactions duplicate declaration issue was reported.

The extracted workspace must still be checked against the actual Apps Script project before claiming the issue is fixed.

---

## 34. CURRENT IMMEDIATE TASK

Current deployment investigation:

1. Verify RDGServer HTTP entry point.
2. Verify current doGet.
3. Verify whether doPost exists.
4. Verify ContentService.
5. Verify API authentication.
6. Verify CORS requirements.
7. Verify existing rdgApi/apiRequest flow.
8. Design minimal Firebase bridge.
9. Test bridge.
10. Deploy frontend.
11. Test live game.
12. Only then consider production hardening.

No architecture rewrite.

---

## 35. AGENT RESPONSE STYLE

When working with the user:

- Use simple Urdu/Hinglish when appropriate.
- Give one practical action at a time.
- Do not overwhelm with many commands.
- Explain unexpected terminal output calmly.
- Always preserve the existing project context.
- Never say "start from zero."
- Never claim a file was changed unless it was actually changed.
- Never claim a test passed unless it actually ran.

Preferred interaction:

"اب صرف یہ ایک command چلائیں۔"

Then wait for the result.

---

## 36. GOLDEN RULE

PRESERVE.
INSPECT.
VERIFY.
CHANGE MINIMALLY.
TEST.
BACKUP.
THEN DEPLOY.

Never sacrifice the existing RDG architecture merely to make a deployment appear to work.