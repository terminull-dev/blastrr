const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const databaseJs = fs.readFileSync('database.js', 'utf8');
const serverJs = fs.readFileSync('server.js', 'utf8');
const appHtml = fs.readFileSync('public/app.html', 'utf8');
const appJs = fs.readFileSync('public/js/app.js', 'utf8');
const appCss = fs.readFileSync('public/css/app.css', 'utf8');

test('copy-trading groups persist unique account assignments and linked positions', () => {
  assert.match(databaseJs, /CREATE TABLE IF NOT EXISTS trade_copy_groups/);
  assert.match(databaseJs, /CREATE TABLE IF NOT EXISTS trade_copy_group_members/);
  assert.match(databaseJs, /account_id TEXT NOT NULL PRIMARY KEY/);
  assert.match(databaseJs, /CREATE TABLE IF NOT EXISTS trade_copy_leader_trades/);
  assert.match(databaseJs, /CREATE TABLE IF NOT EXISTS trade_copy_links/);
  assert.match(serverJs, /app\.get\('\/api\/trade-copy\/groups', requireWalletSession/);
  assert.match(serverJs, /app\.post\('\/api\/trade-copy\/groups', sensitiveLimiter, requireWalletSession, walletActionLimiter, requireWalletNotSoftLockedForNewCopyActions, requireUserNotSuspended/);
  assert.match(serverJs, /Permanently locked accounts cannot be added to copy-trading groups/);
  assert.match(serverJs, /An account is already assigned to another copy-trading group/);
  assert.match(serverJs, /app\.post\('\/api\/trade-copy\/groups\/:groupId\/active'/);
  assert.match(serverJs, /app\.delete\('\/api\/trade-copy\/groups\/:groupId'/);
});

test('permanent account locks remove the account from copy groups and pause leader groups', () => {
  assert.match(serverJs, /function lockAccount\(accountId, breach, callback\)[\s\S]*?if \(!lock\.permanent\) return callback\(null, lock\)[\s\S]*?UPDATE trade_copy_groups SET active = 0[\s\S]*?DELETE FROM trade_copy_group_members WHERE account_id = \?/);
  assert.match(serverJs, /Choose an available leader before activating this group/);
  assert.match(appJs, /LEADER LOCKED · GROUP PAUSED/);
  assert.match(appJs, /permanently locked leader was removed/);
});

test('leader trades copy independently sized orders and linked exits', () => {
  assert.match(serverJs, /const ratio = Number\(follower\.size_pct\) \/ 100/);
  assert.match(serverJs, /size_usd: followerMargin \* order\.leverage/);
  assert.match(serverJs, /executeTradeForAccount\(follower\.account_id, followerOrder/);
  assert.match(serverJs, /INSERT INTO trade_copy_leader_trades/);
  assert.match(serverJs, /INSERT INTO trade_copy_links/);
  assert.match(serverJs, /function closeOutstandingCopyTrades/);
  assert.match(serverJs, /closeOutstandingCopyTrades\(req\.walletAddress/);
});

test('copy-trading emergency flatten closes tracked trades across paused or deleted groups', () => {
  assert.match(serverJs, /app\.post\('\/api\/trade-copy\/flatten', sensitiveLimiter, requireWalletSession/);
  assert.match(serverJs, /UPDATE trade_copy_groups SET active = 0/);
  assert.match(serverJs, /waitForTradeExecutions\(wallet/);
  assert.match(serverJs, /copyFlatteningWallets\.add\(wallet\)/);
  assert.match(serverJs, /EXISTS \(SELECT 1 FROM trade_copy_leader_trades/);
  assert.match(serverJs, /EXISTS \(SELECT 1 FROM trade_copy_links/);
  assert.match(serverJs, /t\.status IN \('OPEN', 'PENDING'\)/);
  assert.match(appHtml, /id="copy-flatten-all"/);
  assert.match(appJs, /Emergency stop: pause all copy groups and close every open or pending copy-trading position/);
  assert.match(appJs, /walletFetch\('\/api\/trade-copy\/flatten'/);
  assert.match(appJs, /Paused all copy groups/);
});

test('copy-trading page includes the group wizard and can be put under maintenance', () => {
  assert.match(appHtml, /id="copyTradingView"/);
  assert.match(appHtml, /class="battlepass-page-heading app-page-heading copy-trading-page-heading"/);
  assert.match(appHtml, /id="copy-group-wizard"/);
  assert.match(appHtml, /id="copy-account-overview"/);
  assert.match(appHtml, /data-maintenance-page="copytrading"/);
  assert.match(appHtml, /value="copytrading"> Copy Trading/);
  assert.match(serverJs, /'copytrading'/);
  assert.match(databaseJs, /'copytrading'/);
  assert.match(appJs, /copyTradingView: 'copytrading'/);
  assert.match(appJs, /data-copy-size/);
  assert.match(appCss, /\.copy-trading-flatten/);
  assert.match(appCss, /\.copy-trading-page-heading\s*\{[^}]*flex-direction:\s*column/);
  assert.match(appCss, /\.copy-overview-account\.is-permanently-locked[^}]*border-color:\s*rgba\(248, 113, 113/);
  assert.match(appJs, /function isPermanentlyLockedCopyAccount\(account\)/);
  assert.match(appJs, /!isPermanentlyLockedCopyAccount\(account\)/);
  assert.match(appHtml, /id="copy-hide-permanent" type="checkbox" checked onchange="togglePermanentlyLockedCopyAccounts\(this\.checked\)"/);
  assert.match(appHtml, /Hide permanently locked accounts/);
  assert.match(appJs, /function togglePermanentlyLockedCopyAccounts\(checked\)/);
  assert.match(appJs, /visibleAccounts = userAccounts\.filter\(account =>[\s\S]*?hidePermanentlyLockedCopyAccounts/);
  assert.match(appJs, /No accounts to show\. Turn off “Hide permanently locked accounts”/);
});

test('account and copy-trading views show API-backed goal and risk progress', () => {
  assert.match(serverJs, /const totalProfit = account\.current_equity - account\.initial_balance;/);
  assert.match(serverJs, /const profitTargetPercent = initialBalance > 0 && profitTarget > 0/);
  assert.match(serverJs, /profitTargetPercent: profitTargetPercent\.toFixed\(1\)/);
  assert.match(appJs, /percentage: metrics\.profitTargetPercent/);
  assert.match(serverJs, /profitProgress: profitProgress\.toFixed\(1\)[\s\S]*?currentProfit: totalProfit[\s\S]*?ddProgress: ddProgress\.toFixed\(1\)[\s\S]*?maxAllowedDD,[\s\S]*?currentDD,[\s\S]*?dllProgress: dllProgress\.toFixed\(1\)[\s\S]*?maxAllowedDLL,[\s\S]*?currentDLL/);
  assert.match(appJs, /function renderAccountProgressStats\(metrics, \{ compact = false \} = \{\}\)/);
  assert.match(appJs, /!Number\.isFinite\(percentage\)[\s\S]*?target <= 0/);
  assert.match(appJs, /role="progressbar" aria-label="\$\{stat\.label\} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="\$\{progress\}"/);
  assert.doesNotMatch(appJs, /account-progress-donut|account-progress-visuals/);
  assert.match(appJs, /accountProgressMetrics\.set\(String\(acc\.id\), m\)/);
  assert.match(appJs, /renderAccountProgressStats\(m\)/);
  assert.match(appJs, /renderAccountProgressStats\(accountProgressMetrics\.get\(String\(account\.id\)\), \{ compact: true \}\)/);
  assert.match(appJs, /copy-group-account-progress[\s\S]*?renderAccountProgressStats\(accountProgressMetrics\.get\(String\(account\.id\)\), \{ compact: true \}\)/);
  assert.match(appJs, /<div class="copy-overview-heading">[\s\S]*?class="copy-overview-balance"/);
  assert.match(appJs, /async function loadUserAccounts\(wallet, waitForPortfolio = false\)[\s\S]*?if \(waitForPortfolio\) await portfolioRender/);
  assert.match(appJs, /async function loadCopyTradingPage\(\)[\s\S]*?await loadUserAccounts\(connectedWallet, true\)/);
  assert.doesNotMatch(appCss, /account-progress-donut|conic-gradient\(var\(--progress-color/);
  assert.match(appCss, /\.account-progress-profit \.account-progress i \{ background: linear-gradient/);
  assert.match(appCss, /\.copy-overview-progress, \.copy-group-account-progress/);
  assert.match(appCss, /\.copy-overview-assignment \{ padding: 3px 7px/);
});
