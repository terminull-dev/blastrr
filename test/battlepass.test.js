const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { selectWeightedReward, validatePackRewardPool } = require('../battlePassRewards');

const databaseJs = fs.readFileSync('database.js', 'utf8');
const serverJs = fs.readFileSync('server.js', 'utf8');
const appHtml = fs.readFileSync('public/app.html', 'utf8');
const appJs = fs.readFileSync('public/js/app.js', 'utf8');
const appCss = fs.readFileSync('public/css/app.css', 'utf8');
const homeHtml = fs.readFileSync('public/index.html', 'utf8');

test('BlastrrPass seeds twelve levels and keeps earning XP after level 12', () => {
  assert.match(databaseJs, /level <= 12/);
  assert.match(databaseJs, /level \* 10000/);
  assert.match(serverJs, /Math\.min\(12, Math\.floor\(Math\.max\(0, Number\(xp\) \|\| 0\) \/ 10000\)\)/);
  assert.match(serverJs, /xp = xp \+ \?/);
  assert.match(appHtml, /id="battlepass-level-list"/);
  assert.match(appJs, /max level/);
});

test('battle pass task rewards are period-limited and built-in trading tasks are supported', () => {
  assert.match(databaseJs, /'GREEN_DAY', 'GREEN_WEEK', 'TRADE_DAY', 'WITHDRAWAL'/);
  assert.match(databaseJs, /is_builtin INTEGER NOT NULL DEFAULT 0/);
  assert.match(databaseJs, /UNIQUE\(wallet_address, task_id, cadence, period_key\)/);
  assert.match(serverJs, /task\.task_type === 'TRADE_DAY'/);
  assert.match(databaseJs, /'Journal your day'.*'JOURNAL_DAY', 'DAILY', 100, 10/);
  assert.match(databaseJs, /'Journal five days'.*'JOURNAL_WEEK', 'WEEKLY', 500, 50/);
  assert.match(databaseJs, /'JOURNAL_DAY', 'JOURNAL_WEEK'/);
  assert.match(databaseJs, /'Journal every day this month'.*'JOURNAL_MONTH', 'MONTHLY', 1000, 100/);
  assert.match(serverJs, /task\.task_type === 'JOURNAL_DAY' \|\| task\.task_type === 'JOURNAL_WEEK' \|\| task\.task_type === 'JOURNAL_MONTH'/);
  assert.match(serverJs, /COUNT\(DISTINCT j\.day\)/);
  assert.match(serverJs, /task\.task_type === 'JOURNAL_DAY' \? 1[\s\S]*?task\.task_type === 'JOURNAL_WEEK' \? 5/);
  assert.match(serverJs, /new Date\(Date\.UTC\(year, month, 0\)\)\.getUTCDate\(\)/);
  assert.match(serverJs, /task\.progress_target = target/);
  assert.match(serverJs, /task\.task_type === 'JOURNAL_WEEK' && task\.cadence !== 'WEEKLY'/);
  assert.match(serverJs, /task\.task_type === 'JOURNAL_MONTH' && task\.cadence !== 'MONTHLY'/);
  assert.match(appJs, /battlepass-journal-progress/);
  assert.match(appJs, /journal days/);
  assert.match(appJs, /await loadBattlePass\(\)/);
  assert.match(databaseJs, /'Paid withdrawal'.*'WITHDRAWAL', 'DAILY'/);
  assert.match(serverJs, /task\.task_type === 'GREEN_DAY' \? 1 : 7/);
  assert.match(serverJs, /date\(COALESCE\(w\.paid_at, w\.created_at\)\)/);
  assert.match(serverJs, /date\(COALESCE\(rw\.paid_at, rw\.created_at\)\)/);
  assert.match(serverJs, /app\.post\('\/api\/battlepass\/tasks\/claim', sensitiveLimiter, requireWalletSession/);
});

test('purchase missions are grouped separately and can be claimed once per new paid plan account', () => {
  assert.match(databaseJs, /'PURCHASE_ANY', 'PURCHASE_PLAN'/);
  assert.match(databaseJs, /cadence TEXT NOT NULL CHECK\(cadence IN \('DAILY', 'WEEKLY', 'MONTHLY', 'ONCE'\)\)/);
  assert.match(serverJs, /function syncBattlePassPlanTasks/);
  assert.match(serverJs, /WITH RECURSIVE purchase_units/);
  assert.match(serverJs, /p\.chain_id > 0 AND p\.amount_usdt > 0/);
  assert.match(serverJs, /p\.created_at >= \?/);
  assert.match(serverJs, /c\.period_key = u\.tx_hash \|\| ':' \|\| u\.unit_index/);
  assert.match(serverJs, /purchase_units_claimed: purchases\.length/);
  assert.match(appHtml, /id="battlepass-purchases-tasks"/);
  assert.match(appJs, /PURCHASE_ANY', 'PURCHASE_PLAN/);
  assert.match(appJs, /Claim first 100 of \$\{purchaseClaimCount\}/);
});

test('platform reviews award a one-time automatic BlastrrPass reward', () => {
  assert.match(databaseJs, /'PLATFORM_REVIEW'/);
  assert.match(databaseJs, /'ONCE'/);
  assert.match(databaseJs, /'Review the platform'.*'PLATFORM_REVIEW', 'ONCE', 200, 200/);
  assert.match(serverJs, /e\.event_type = 'PLATFORM_REVIEW'[\s\S]*?LOWER\(e\.wallet_address\) = LOWER\(\?\)/);
  assert.match(serverJs, /INSERT OR IGNORE INTO battlepass_events[\s\S]*?'PLATFORM_REVIEW'/);
  assert.match(serverJs, /UPDATE battlepass_users[\s\S]*?xp = xp \+ \?, points = points \+ \?/);
  assert.match(serverJs, /task_type = 'PLATFORM_REVIEW' AND is_builtin = 1 AND active = 1/);
  assert.match(serverJs, /task\.task_type === 'PLATFORM_REVIEW'[\s\S]*?task\.eligible = false/);
  assert.match(appJs, /Automatically applied when you submit a review/);
  assert.match(appJs, /task\.task_type === 'PLATFORM_REVIEW'[\s\S]*?'Earned once'/);
  assert.match(appJs, /data-review-task/);
  assert.match(appJs, /switchProfileSection\('profile-reviews-panel'\)/);
  assert.match(appHtml, /id="battlepass-once-tasks"/);
  assert.match(appHtml, /One-time missions/);
});

test('admin can configure standard discounts, level titles, plan awards, and custom tasks', () => {
  assert.match(appHtml, /id="admin-battlepass-settings-form"/);
  assert.match(appHtml, /id="admin-battlepass-level-titles"/);
  assert.match(appHtml, /id="admin-battlepass-plan-rewards"/);
  assert.match(appHtml, /id="admin-battlepass-task-form"/);
  assert.match(serverJs, /app\.post\('\/api\/admin\/battlepass\/settings', sensitiveLimiter, requireTradeSignature, requireAdminWallet/);
  assert.match(serverJs, /app\.post\('\/api\/admin\/battlepass\/levels\/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet/);
  assert.match(serverJs, /app\.post\('\/api\/admin\/battlepass\/plan-rewards\/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet/);
  assert.match(serverJs, /app\.post\('\/api\/admin\/battlepass\/tasks\/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet/);
  assert.match(serverJs, /WHERE id = \? AND is_builtin = 1/);
});

test('level titles unlock by XP and can be claimed without spending points', () => {
  const titleClaimRoute = serverJs.slice(
    serverJs.indexOf("app.post('/api/battlepass/titles/claim'"),
    serverJs.indexOf("app.get('/api/auth/role'")
  );
  assert.match(databaseJs, /title TEXT NOT NULL/);
  assert.match(databaseJs, /PRIMARY KEY\(wallet_address, level\)/);
  assert.match(databaseJs, /'Rookie', 'Apprentice', 'Adept'/);
  assert.match(titleClaimRoute, /battlepass_level_titles/);
  assert.match(titleClaimRoute, /xp_required/);
  assert.doesNotMatch(titleClaimRoute, /points_cost|points = points -|battlepass_reward_codes/);
  assert.doesNotMatch(appJs, /points_cost/);
  assert.match(appHtml, /data-battlepass-tab="titles"/);
  assert.match(appJs, /Claim these titles for free; your points are not spent\./);
  assert.match(appJs, /data-level-title/);
});

test('admin level title editors use full-width rows with usable responsive controls', () => {
  assert.match(appCss, /\.battlepass-admin-level-grid \{ grid-template-columns: minmax\(0, 1fr\); \}/);
  assert.match(appCss, /\.battlepass-admin-level-grid \.battlepass-admin-row \{[\s\S]*?grid-template-columns: minmax\(180px, 1\.5fr\) minmax\(180px, 1fr\) auto/);
  assert.match(appCss, /\.battlepass-admin-level-grid \.battlepass-admin-row \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
  assert.match(appCss, /\.battlepass-admin-level-grid \.battlepass-admin-row > strong,[\s\S]*?\.battlepass-admin-level-grid \.battlepass-admin-row > button \{ grid-column: 1 \/ -1; \}/);
  assert.match(appJs, /data-save-level-title/);
});

test('checkout shows full prices until a code is explicitly applied', () => {
  assert.match(serverJs, /WHERE code = \? AND LOWER\(wallet_address\) = LOWER\(\?\) AND redeemed_at IS NULL/);
  assert.match(serverJs, /app\.post\('\/api\/accounts\/purchase', sensitiveLimiter, requireWalletSession/);
  assert.match(serverJs, /const totalDiscountPct = packCertificate[\s\S]*?promoCode \? Math\.min\(100, standardDiscountPct \+ bonusDiscountPct\) : 0/);
  assert.match(serverJs, /Math\.round\(Number\(plan\.base_price_usdt\) \* \(100 - totalDiscountPct\)\) \/ 100/);
  assert.match(serverJs, /xp_awarded: isFreeRedemption \? 0 : xpAward/);
  assert.match(serverJs, /const totalPrice = Math\.round\(finalPrice \* quantity \* 100\) \/ 100/);
  assert.match(serverJs, /if \(isFreeRedemption && quantity > 1\)/);
  assert.match(serverJs, /paid_amount, commission_earned, commission_pct, level\)[\s\S]*?totalPrice/);
  assert.match(databaseJs, /quantity INTEGER NOT NULL DEFAULT 1/);
  assert.match(appJs, /const discountPct = activePromoDetails && planEligible \? Number\(activePromoDetails\.discount_pct\) : 0/);
  assert.doesNotMatch(appJs, /promoInput\.value = refCode;\s*applyPromo\(\)/);
  assert.match(appJs, /type="number" min="1" max="10" step="1" value="1"/);
  assert.match(appJs, /toLocaleString\(undefined, \{ minimumFractionDigits: 2, maximumFractionDigits: 2 \}\)/);
  assert.match(appJs, /compactBattlePassXp/);
});

test('pack odds are exact and weighted rewards respect configured boundaries', () => {
  const pool = [
    { reward_id: 1, odds: 25, max_drops: 0 },
    { reward_id: 2, odds: 75, max_drops: 3 }
  ];
  assert.deepEqual(validatePackRewardPool(pool), { valid: true, total: 100, error: null });
  assert.equal(selectWeightedReward(pool, 0), pool[0]);
  assert.equal(selectWeightedReward(pool, 24.99), pool[0]);
  assert.equal(selectWeightedReward(pool, 25), pool[1]);
  assert.equal(validatePackRewardPool([{ ...pool[0], odds: 99 }]).valid, false);
  assert.throws(() => selectWeightedReward(pool, 100), RangeError);
});

test('pack openings spend points once, respect global caps, and issue wallet-bound single-use certificates', () => {
  const openRoute = serverJs.slice(
    serverJs.indexOf("app.post('/api/battlepass/packs/open'"),
    serverJs.indexOf("app.get('/api/battlepass/profile'")
  );
  const insertCallbackStart = openRoute.indexOf('insertOpeningErr => {');
  const completionCallStart = openRoute.indexOf('completeBattlePassPackOpening({');
  const insertCallbackPrefix = openRoute.slice(insertCallbackStart, completionCallStart);
  const purchaseRoute = serverJs.slice(
    serverJs.indexOf("app.post('/api/accounts/purchase'"),
    serverJs.indexOf("// --- SECURE WITHDRAWAL REQUEST ENDPOINT")
  );
  assert.match(databaseJs, /UNIQUE\(wallet_address, request_key\)/);
  assert.match(openRoute, /BEGIN IMMEDIATE/);
  assert.match(openRoute, /points = points - \?/);
  assert.match(openRoute, /battlepass_discount_certificates/);
  assert.ok(insertCallbackStart >= 0);
  assert.ok(completionCallStart > insertCallbackStart);
  assert.match(insertCallbackPrefix, /^insertOpeningErr => \{\s*if \(insertOpeningErr\) return rollback\([\s\S]*?;\s*$/);
  assert.match(openRoute, /completeBattlePassPackOpening\(\{[\s\S]*?reward: selectedReward,[\s\S]*?quantity/);
  assert.match(openRoute, /WHERE o\.pack_id = pr\.pack_id AND o\.reward_id = pr\.reward_id/);
  assert.match(openRoute, /UPDATE battlepass_packs SET active = 0/);
  assert.match(purchaseRoute, /UPDATE battlepass_discount_certificates[\s\S]*?LOWER\(wallet_address\) = LOWER\(\?\) AND redeemed_at IS NULL/);
  assert.match(purchaseRoute, /eligible_plan_id IS NULL OR eligible_plan_id = \?/);
  assert.match(appHtml, /data-battlepass-tab="shop"/);
  assert.match(appHtml, /data-battlepass-tab="vault"/);
  assert.match(appJs, /role="status">Out of stock/);
  assert.match(serverJs, /FROM admin_notifications n WHERE n\.event_type = 'REWARD_PACK_OUT_OF_STOCK'/);
  assert.match(appJs, /case 'REWARD_PACK_OUT_OF_STOCK'/);
});

test('pack opening reports non-JSON responses and keeps the API response contract', () => {
  const openRoute = serverJs.slice(
    serverJs.indexOf("app.post('/api/battlepass/packs/open'"),
    serverJs.indexOf("app.get('/api/battlepass/profile'")
  );
  const apiErrorHandler = serverJs.slice(
    serverJs.indexOf("app.use('/api', (err, req, res, next)"),
    serverJs.indexOf("app.use('/api', (req, res)")
  );
  const apiFallback = serverJs.slice(serverJs.indexOf("app.use('/api', (req, res)"));

  assert.match(appJs, /readApiJson\(response, '\/api\/battlepass\/packs\/open'\)/);
  assert.match(openRoute, /res\.json\(\{\s*success: true/);
  assert.match(openRoute, /res\.status\(\d+\)\.json\(\{\s*error:/);
  assert.match(apiErrorHandler, /res\.status\(500\)\.json\(\{ error:/);
  assert.match(apiFallback, /res\.status\(404\)\.json\(\{ error:/);
  assert.ok(serverJs.indexOf("app.post('/api/battlepass/packs/open'") < serverJs.indexOf("app.use('/api'"));
});

test('reward shop seeds the nine tiers with account rewards from the active plan catalog', () => {
  for (const tier of ['Paper', 'Wood', 'Copper', 'Bronze', 'Iron', 'Steel', 'Titanium', 'Silver', 'Gold']) {
    assert.ok(serverJs.includes(`name: '${tier}'`), `missing ${tier} pack seed`);
  }
  assert.match(serverJs, /SELECT id, name FROM plans WHERE active = 1 ORDER BY id/);
  assert.match(serverJs, /const name = `Account reward: \$\{plan\.name\}`/);
  assert.match(serverJs, /Reward odds must total exactly 100%/);
});

test('leaderboards and public profile cards include BlastrrPass level and XP', () => {
  assert.equal((serverJs.match(/AS battlepass_xp/g) || []).length, 5);
  assert.equal((serverJs.match(/b\.profile_image_url, COALESCE\(b\.xp/g) || []).length, 3);
  assert.match(appJs, /<small>Battle Pass rank<\/small>/);
  assert.match(appJs, /<small>XP earned<\/small>/);
  assert.match(appHtml, /id="profile-battlepass-avatar"/);
  assert.match(serverJs, /AS battlepass_title/);
  assert.match(appJs, /row\.battlepass_title/);
  assert.match(appJs, /message\.battlepass_title/);
  assert.match(appJs, /profile\.title/);
  assert.match(appJs, /const battlePassRank = battlePassLevel \? `Level \$\{battlePassLevel\}` : 'Unranked'/);
  assert.match(appJs, /class="battlepass-avatar-wrap leaderboard-avatar"/);
  assert.match(appJs, /row\.profile_image_url, row\.username/);
  assert.match(appJs, /setBattlePassAvatar\(document\.getElementById\('profile-battlepass-avatar'\), battlePassProfile\.profile_image_url, username\)/);
  assert.match(appJs, /loadPublicBattlePassProfile/);
  assert.match(appJs, /platform\.twitter\.com\/widgets\.js/);
  assert.match(homeHtml, /const displayedPrice = plan => Number\(plan\.base_price_usdt\)/);
});

test('BlastrrPass dashboard presents missions, titles, leaderboard, and profile sections', () => {
  assert.match(appHtml, /class="battlepass-mission-board"/);
  assert.match(appHtml, /data-battlepass-tab="missions"/);
  assert.match(appHtml, /data-battlepass-tab="titles"/);
  assert.match(appHtml, /data-battlepass-tab="leaderboard"/);
  assert.match(appHtml, /data-battlepass-tab="profile"/);
  assert.match(appHtml, /id="battlepass-claim-all"/);
  assert.match(appHtml, /id="battlepass-level-segments"/);
  assert.match(appJs, /function claimAllBattlePassTitles/);
  assert.match(appJs, /function selectBattlePassTab/);
  assert.match(appJs, /class="battlepass-task dashboard-tile battlepass-reward-item"/);
  assert.doesNotMatch(appJs, /data-use-reward|battlepass-reward-code/);
  assert.match(appJs, /const defaultImageUrl = '\/favicon\.png'/);
});

test('Blastrr logo is used as the site favicon', () => {
  assert.match(appHtml, /href="\/favicon\.png"/);
  assert.match(homeHtml, /href="\/favicon\.png"/);
  assert.equal(fs.existsSync('public/favicon.png'), true);
});

test('battle pass profile images are verified as loadable direct image URLs before saving', () => {
  assert.match(appHtml, /Google Images search\/result page links are not image URLs/);
  assert.match(appJs, /function validateBattlePassImageUrl\(imageUrl\)/);
  assert.match(appJs, /if \(imageUrl\) await validateBattlePassImageUrl\(imageUrl\)/);
  assert.match(appJs, /Open the image itself and copy its direct image address/);
  assert.doesNotMatch(appJs, /image\.referrerPolicy = 'no-referrer'/);
});

test('homepage plan cards use Battle Pass task and reward styling with all configured account rules', () => {
  assert.match(homeHtml, /class="plan battlepass-plan-card/);
  assert.match(homeHtml, /plan-purchase-reward-label/);
  assert.match(homeHtml, /plan-task-list/);
  assert.match(homeHtml, /STRAIGHT TO FUNDED/);
  assert.match(homeHtml, /Profit consistency<\/span><strong>\$\{p\.max_single_day_profit_pct\}%/);
  assert.match(homeHtml, /\["Profit consistency",p=>`\$\{p\.max_single_day_profit_pct\}% max single-day profit`\]/);
  assert.match(homeHtml, /Trading availability<\/span><strong>24\/7\/365<\/strong>/);
  assert.match(homeHtml, /\["Trading availability",\(\)=>"24\/7\/365"\]/);
});

test('terminal buy-plan cards show funded status, purchase reward styling, and all account rules', () => {
  assert.match(appJs, /class="card dashboard-tile purchase-plan-card/);
  assert.match(appJs, /purchase-plan-status/);
  assert.match(appJs, /purchase-plan-market-hours/);
  assert.match(appJs, /STRAIGHT TO FUNDED/);
  assert.match(appJs, /purchase-plan-reward/);
  assert.match(appJs, /Profit consistency<\/span><strong>\$\{Number\(plan\.max_single_day_profit_pct\)\}% max single-day profit/);
  assert.match(appJs, /Trading availability<\/span><strong>24\/7\/365/);
});

test('dashboard and admin use black surfaces with subdued neutral nav borders', () => {
  assert.match(appCss, /--surface-glass:\s*rgba\(10,\s*11,\s*12,\s*0\.94\)/);
  assert.match(appCss, /body:not\(\.auth-locked\) \{ background: #050607; \}/);
  assert.match(appCss, /border-color: rgba\(180, 190, 200, 0\.26\);[\s\S]*?box-shadow: 0 0 6px rgba\(180, 190, 200, 0\.09\)/);
  assert.match(appCss, /\.nav-tab:hover, \.nav-tab:focus-visible/);
  assert.match(appCss, /\.nav-tab\.active/);
  assert.match(appCss, /button:not\(\.nav-tab\):not\(\.admin-section-tab\)/);
  assert.match(appCss, /\.admin-section-tab:hover, \.admin-section-tab:focus-visible, \.admin-section-tab\.active/);
});
