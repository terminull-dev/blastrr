const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const appHtml = fs.readFileSync('public/app.html', 'utf8');
const appJs = fs.readFileSync('public/js/app.js', 'utf8');
const appCss = fs.readFileSync('public/css/app.css', 'utf8');
const packArtworkDirectory = 'public/images/battlepass/packs';
const packArtworkSpritePath = `${packArtworkDirectory}/reward-pack-sprite.svg`;
const landingHtml = fs.readFileSync('public/index.html', 'utf8');
const databaseJs = fs.readFileSync('database.js', 'utf8');
const serverJs = fs.readFileSync('server.js', 'utf8');
const marketDataProvidersJs = fs.readFileSync('marketDataProviders.js', 'utf8');
const faqHtml = fs.readFileSync('public/faq.html', 'utf8');
const faqJs = fs.readFileSync('public/js/faq.js', 'utf8');
const faqCss = fs.readFileSync('public/css/faq.css', 'utf8');
const faqSections = JSON.parse(fs.readFileSync('public/faq-data.json', 'utf8'));
const docsHtml = fs.readFileSync('public/docs.html', 'utf8');
const docsJs = fs.readFileSync('public/js/docs.js', 'utf8');
const docsCss = fs.readFileSync('public/css/docs.css', 'utf8');
const docsSections = JSON.parse(fs.readFileSync('public/docs-data.json', 'utf8'));

test('searchable public FAQ is linked from the homepage and terminal navigation', () => {
  assert.match(landingHtml, /<a href="faq\.html">FAQ<\/a>/);
  assert.match(appHtml, /<a class="nav-tab"[^>]*href="faq\.html">FAQ<\/a>/);
  assert.match(faqHtml, /<title>FAQ &amp; Knowledge Base \| Blastrr<\/title>/);
  assert.match(faqHtml, /<a href="\/docs\.html">Docs<\/a>/);
  assert.match(faqHtml, /<input id="faq-search" type="search"/);
  assert.match(faqHtml, /id="faq-results" class="faq-results" role="status"/);
  assert.match(faqHtml, /id="faq-content" class="faq-content"/);
  assert.match(faqJs, /normalize\(`\$\{section\.title\} \$\{item\.question\} \$\{item\.answer\}`\)/);
  assert.match(faqJs, /terms\.every\(term => searchableText\.includes\(term\)\)/);
  assert.match(faqJs, /function formatAnswer\(value\)/);
  assert.match(faqJs, /content\.replaceChildren\(\)/);
  assert.match(faqCss, /\.faq-search-row input:focus/);
  assert.equal(faqSections.length, 8);
  assert.equal(faqSections.reduce((count, section) => count + section.items.length, 0), 38);
  const faqQuestions = faqSections.flatMap(section => section.items.map(item => item.question));
  assert.ok(faqQuestions.includes('What account plans are available?'));
  assert.ok(faqQuestions.includes('Does the app support limit, stop-limit, or pending entry orders?'));
  assert.ok(faqQuestions.includes('Can I claim a free account with a code?'));
  assert.ok(faqQuestions.includes('What should I do if the market ticker or prices stop updating?'));
  const faqCopy = JSON.stringify(faqSections);
  assert.doesNotMatch(faqCopy, /email\/password authentication as well as|Forex Majors|testnet environment|funding rates update every 8 hours|80\/20 profit split|2-minute KYC\/AML|24\/7 via the live chat widget/i);
});

test('profile tools are organized into accessible section tabs', () => {
  const profileViewStart = appHtml.indexOf('<section id="profileView"');
  const profileViewEnd = appHtml.indexOf('<!-- 5. BUY PLANS VIEW -->', profileViewStart);
  const profileHtml = appHtml.slice(profileViewStart, profileViewEnd);
  const toolIds = ['referrals', 'promo', 'creator', 'support', 'reviews'];
  assert.match(profileHtml, /class="admin-section-tabs profile-section-tabs dashboard-section-tabs app-section-tabs" role="tablist" aria-label="Profile tools"/);
  for (const id of toolIds) {
    assert.match(profileHtml, new RegExp(`id="profile-${id}-tab"[^>]*role="tab"`));
    assert.match(profileHtml, new RegExp(`id="profile-${id}-panel"[^>]*role="tabpanel"`));
    assert.match(profileHtml, new RegExp(`aria-controls="profile-${id}-panel"`));
    assert.match(profileHtml, new RegExp(`aria-labelledby="profile-${id}-tab"`));
  }
  assert.match(appJs, /function switchProfileSection\(panelId\)/);
  assert.match(profileHtml, /switchProfileSection\('profile-support-panel'\)/);
  assert.match(appCss, /\.profile-section-panel\[hidden\] \{ display: none !important; \}/);
});

test('trade entry shows the selected account balance and balance percentage shortcuts', () => {
  const accountSelect = appHtml.indexOf('id="active-account-select"');
  const balanceField = appHtml.indexOf('id="selected-account-balance-value"');
  const entryAmount = appHtml.indexOf('id="order-size-usd"');
  assert.ok(accountSelect >= 0 && balanceField > accountSelect && entryAmount > balanceField);
  assert.match(appHtml, /id="available-bal-label"/);
  assert.match(appHtml, /id="available-bal-detail"/);
  for (const percentage of [25, 50, 100]) {
    assert.match(appHtml, new RegExp(`setOrderSizeFromBalance\\(${percentage}\\)`));
  }
  assert.match(appJs, /function setOrderSizeFromBalance\(percentage\)/);
  assert.match(appJs, /Math\.floor\(balance \* percentage\) \/ 100/);
  assert.match(appJs, /updateAvailableBalanceLabel\(marginInput\)/);
  assert.match(appJs, /const remainingBalance = hasEstimate \? balance - estimatedMargin : balance/);
  assert.match(appCss, /\.selected-account-balance \{ display: flex/);
  assert.match(appCss, /\.balance-shortcut:disabled/);
});

test('documentation hub is searchable, structured, and linked from the main entry points', () => {
  assert.match(landingHtml, /<a href="docs\.html">Docs<\/a>/);
  assert.match(appHtml, /<a class="nav-tab"[^>]*href="docs\.html">Docs<\/a>/);
  assert.match(docsHtml, /<title>Documentation \| Blastrr<\/title>/);
  assert.match(docsHtml, /id="docs-search" type="search"/);
  assert.match(docsHtml, /id="docs-nav" class="docs-nav"/);
  assert.match(docsJs, /normalize\(`\$\{page\.title\} \$\{page\.summary \|\| ''\} \$\{getGroupText\(group\)\}`\)/);
  assert.match(docsJs, /terms\.every\(term => searchableText\.includes\(term\)\)/);
  assert.match(docsJs, /textContent = value/);
  assert.match(docsJs, /function renderTable\(table\)/);
  assert.match(docsJs, /window\.addEventListener\('hashchange'/);
  assert.match(docsCss, /\.docs-layout \{ display: grid; grid-template-columns:/);
  assert.equal(docsSections.length, 8);
  assert.equal(docsSections.reduce((count, page) => count + page.groups.length, 0), 27);
  assert.ok(docsSections.some(page => page.title === 'Trading Markets'));
  assert.ok(docsSections.some(page => page.title === 'Trade Entry & Controls'));
  assert.ok(docsSections.some(page => page.title === 'Account Plans & Risk Rules'));
  const docsCopy = JSON.stringify(docsSections);
  assert.doesNotMatch(docsCopy, /forex|commodities|cross.margin|funding rate|open interest|faucet|testnet|time in force|reduce.only|perpetual|futures|trailing drawdown|temporary leverage limits/i);
  const marketTable = docsSections.find(page => page.id === 'trading-markets').groups.find(group => group.title === 'Configured Binance Spot Pairs').table;
  const marketPairs = JSON.parse(fs.readFileSync('public/config/markets.json', 'utf8'))
    .filter(market => market.enabled !== false && market.source === 'BINANCE_SPOT')
    .map(market => market.pair.replace(/USDT$/, '/USDT'));
  assert.deepEqual(marketTable.rows.map(row => row[1]), marketPairs);
  const planTable = docsSections.find(page => page.id === 'account-plans').groups.find(group => group.title === 'Current Plan Parameters').table;
  const plans = JSON.parse(fs.readFileSync('config/plans.json', 'utf8'));
  assert.deepEqual(planTable.rows.map(row => row[1]), plans.map(plan => `$${Number(plan.simulated_capital).toLocaleString('en-US')}`));
  assert.ok(planTable.rows.every(row => row[3].startsWith('5%') && row[4].startsWith('10%') && row[5] === '40%'));
});

test('trading terminal displays spot stats and puts account selection first in trade inputs', () => {
  const tickerStart = appHtml.indexOf('<div class="market-price-ticker"');
  const mainEnd = appHtml.indexOf('</main>');
  const lastViewEnd = appHtml.lastIndexOf('</section>', mainEnd);
  assert.ok(tickerStart > lastViewEnd && tickerStart < mainEnd);
  assert.match(appHtml, /id="market-ticker-track" class="market-ticker-track"/);
  assert.match(appJs, /function initializeMarketPriceTicker\(\)/);
  assert.match(appJs, /market\.source === 'BINANCE_SPOT'/);
  assert.match(appJs, /new EventSource/);
  assert.match(appJs, /\/api\/market-data\/stream/);
  assert.match(appJs, /applyMarketDataQuote\(JSON\.parse\(event\.data\)\)/);
  const liveQuoteHandler = appJs.slice(appJs.indexOf('function applyMarketDataQuote'), appJs.indexOf('function startPricePolling'));
  assert.match(liveQuoteHandler, /updateLiveMarketChart\(market\.pair, price, publishTime\)/);
  assert.match(appJs, /update\.priceChangePercent/);
  const marketBarStart = appHtml.indexOf('<div class="chart-market-bar"');
  const accountSelect = appHtml.indexOf('id="active-account-select"');
  const chartFrame = appHtml.indexOf('id="tradingview-widget-container"');
  const orderCard = appHtml.indexOf('<div class="card order-card">');
  const orderTitle = appHtml.indexOf('Order Execution', orderCard);
  const accountLabel = appHtml.indexOf('Select your account', orderTitle);
  const firstTradeControl = appHtml.indexOf('id="order-symbol"', accountSelect);
  assert.ok(marketBarStart >= 0 && accountSelect > chartFrame);
  assert.ok(accountLabel >= 0 && accountLabel < accountSelect && accountSelect < firstTradeControl);
  assert.match(appHtml, /<label for="active-account-select">Select your account<\/label>/);
  for (const id of [
    'chart-mid-price', 'chart-bid-ask', 'chart-change-24h',
    'chart-high-24h', 'chart-low-24h', 'chart-volume-24h'
  ]) assert.match(appHtml, new RegExp(`id="${id}"`));
  assert.match(appJs, /function renderChartMarketStats\(ticker\)/);
  assert.match(appJs, /api\.binance\.com\/api\/v3\/ticker\/24hr/);
  assert.match(appJs, /ticker\.highPrice/);
  assert.match(appJs, /ticker\.lowPrice/);
  assert.match(appJs, /ticker\.quoteVolume/);
  assert.match(appJs, /volumeCard\.hidden = isForex/);
  assert.doesNotMatch(appJs, /quoteUpdates24h|Quote samples/);
  assert.match(appJs, /function updateMarketTabTitle\(price, pair\)/);
  assert.match(appJs, /updateMarketTabTitle\(price, pair\)/);
  assert.match(appJs, /document\.title = `\$\$\{price\.toLocaleString/);
  assert.doesNotMatch(appJs, /chart-index-price|chart-funding-rate|chart-open-interest/);
  assert.match(appCss, /\.chart-market-bar/);
  assert.match(appCss, /\.market-price-ticker \{[^}]*position: fixed[^}]*bottom: 0/);
  assert.match(appCss, /\.order-metric > strong \{[^}]*font-size: 14px[^}]*white-space: nowrap/);
});

test('admin can toggle maintenance for each public page and set an outage message', () => {
  assert.match(databaseJs, /CREATE TABLE IF NOT EXISTS site_maintenance/);
  assert.match(databaseJs, /'home', 'trade', 'accounts', 'copytrading', 'leaderboard', 'blastrrpass', 'profile', 'plans', 'faq', 'docs'/);
  assert.match(serverJs, /app\.get\('\/api\/maintenance\/status'/);
  assert.match(serverJs, /app\.post\('\/api\/admin\/maintenance\/load', sensitiveLimiter, requireTradeSignature, requireAdminWallet/);
  assert.match(serverJs, /app\.post\('\/api\/admin\/maintenance\/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet/);
  assert.match(appHtml, /id="admin-maintenance-pages"/);
  assert.match(appHtml, /id="admin-maintenance-message"/);
  assert.match(appHtml, /id="maintenanceView"/);
  assert.match(appJs, /function loadAdminMaintenanceSettings\(\)/);
  assert.match(appJs, /function saveAdminMaintenanceSettings\(button\)/);
  assert.match(appJs, /function renderMaintenanceView\(pageId\)/);
  assert.match(appJs, /admin-maintenance-panel/);
  assert.match(fs.readFileSync('public/js/maintenance-page.js', 'utf8'), /message\.textContent = data\.outage_message/);
  assert.match(fs.readFileSync('public/faq.html', 'utf8'), /data-maintenance-page="faq"/);
  assert.match(fs.readFileSync('public/docs.html', 'utf8'), /data-maintenance-page="docs"/);
  assert.match(fs.readFileSync('public/index.html', 'utf8'), /data-maintenance-page="home"/);
});

test('trading terminal HTML loads its external stylesheet and application script', () => {
  assert.match(appHtml, /href="\/css\/app\.css\?v=20261120-account-dashboard"/);
  assert.match(appHtml, /src="\/js\/app\.js\?v=20261120-account-dashboard" defer/);
  assert.doesNotMatch(appHtml, /<style[\s>]/i);
  assert.doesNotMatch(appHtml, /<script>\s*[\s\S]*?\bfunction\s/m);
  assert.match(appHtml, /id="nav-menu"/);
  assert.match(appHtml, /id="wallet-menu-trigger"[^>]*aria-haspopup="true"/);
  assert.match(appHtml, /id="wallet-menu-accounts"/);
  assert.match(appHtml, /onclick="closeWalletMenu\(\); connectNewWallet\(\)">＋ Add account/);
  assert.match(appHtml, /onclick="closeWalletMenu\(\); disconnectWallet\(\)">Log out/);
  assert.match(appHtml, /data-order-type="MARKET"/);
  assert.match(appHtml, /data-order-type="LIMIT"/);
  assert.match(appHtml, /id="order-type" value="MARKET"/);
  assert.match(appHtml, /id="trade-list-title"/);
  assert.match(appHtml, /id="order-buy-button"/);
  assert.match(appHtml, /id="order-sell-button"/);
  assert.match(appJs, /buyButton\.textContent = isLimit \? 'Place Buy Limit' : 'Execute Buy \/ Long'/);
  assert.match(appJs, /sellButton\.textContent = isLimit \? 'Place Sell Limit' : 'Execute Sell \/ Short'/);
  assert.match(appJs, /trade\.status === \(isLimitMode \? 'PENDING' : 'OPEN'\)/);
  assert.match(appJs, /trade\.symbol === selectedSymbol && trade\.status === \(isLimitMode \? 'PENDING' : 'OPEN'\)/);
  assert.match(appHtml, /id="order-symbol"/);
  assert.doesNotMatch(appHtml, /\p{Extended_Pictographic}/u);
  assert.match(appHtml, /class="hamburger-glyph"/);
});

test('trading terminal keeps market status and chart controls on one line without a redundant title', () => {
  assert.match(appHtml, /<div class="chart-heading-group">[\s\S]*?id="chart-pair-label"[\s\S]*?class="market-hours-status" aria-label="Crypto markets trade 24\/7\/365"/);
  assert.doesNotMatch(appHtml, /id="chart-title"|Live Market Chart/);
  assert.match(appHtml, /24\/7 TRADING LIVE/);
  assert.match(appHtml, /id="chart-pair-label" class="chart-pair-label"/);
  assert.doesNotMatch(appHtml, /Open trades: entry, SL &amp; TP levels/);
  assert.match(appHtml, /class="chart-controls" aria-label="Chart controls"/);
  assert.match(appJs, /selectedMarketLabel\.split\(\/\\s\+\/\)\[0\]\.replace\(\/\\\/USDT\$\/i, '\/USD'\)/);
  assert.match(appCss, /\.chart-card-heading\s*\{[^}]*display:\s*flex/);
  assert.match(appCss, /\.chart-heading-group\s*\{[^}]*display:\s*flex/);
  assert.match(appCss, /\.chart-controls\s*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/);
  assert.match(appCss, /#chart-indicator-select\s*\{[^}]*width:\s*148px/);
  assert.match(appCss, /\.market-hours-status\s*\{[^}]*border-radius:\s*999px/);
  assert.doesNotMatch(appHtml, /<aside class="market-hours-status"/);
});

test('trading terminal refresh keeps market data and order controls visually distinct', () => {
  assert.match(appCss, /#tradeView \.chart-market-bar\s*\{[^}]*display:\s*grid/);
  assert.match(appCss, /#tradeView \.chart-market-stat:first-child > strong/);
  assert.match(appCss, /#tradeView \.order-mode-tab\.is-active/);
  assert.match(appCss, /#tradeView \.order-card input:not\(\[type="checkbox"\]\):focus-visible/);
});

test('dashboard groups account destinations and uses a shared transaction table', () => {
  const dashboardNav = appHtml.slice(appHtml.indexOf('<summary class="nav-tab nav-dropdown-trigger">Dashboard'), appHtml.indexOf('</details>', appHtml.indexOf('<summary class="nav-tab nav-dropdown-trigger">Dashboard')));
  for (const section of ['portfolio', 'withdrawals', 'payments', 'profile']) {
    assert.match(dashboardNav, new RegExp(`data-dashboard-section="${section}"`));
  }
  assert.match(appHtml, /data-dashboard-section="payments"[^>]*>Transactions<\/button>/);
  assert.match(appHtml, /id="accounts-view-title">Your accounts<\/h1>/);
  assert.match(appHtml, /class="account-main-tabs dashboard-section-tabs app-section-tabs"/);
  assert.match(appHtml, /class="admin-section-tabs profile-section-tabs dashboard-section-tabs app-section-tabs"/);
  assert.match(appJs, /function switchDashboardSection\(section\)/);
  assert.match(appJs, /const sectionCopy = \{[\s\S]*?withdrawals: \['ACCOUNT PAYOUTS', 'Withdrawals'/);
  assert.match(appJs, /function renderAccountFinanceTable\(headers, rows\)/);
  assert.match(appJs, /renderAccountFinanceTable\(\s*\['Account', 'Requested', 'Your share', 'Destination', 'Requested on', 'Status', 'Transaction ID'\]/);
  assert.match(appJs, /renderAccountFinanceTable\(\s*\['Purchase', 'Total paid', 'Payment asset', 'Network', 'Purchased on', 'Status', 'Transaction ID'\]/);
  assert.match(appCss, /\.dashboard-section-tabs > button\[aria-selected="true"\]/);
  assert.match(appCss, /\.account-finance-table \{ min-width: 900px; font-size: 12px; \}/);
});

test('all section tablists share accessible purple active and focus styling', () => {
  const tablists = appHtml.match(/class="[^"]*\bapp-section-tabs\b[^"]*" role="tablist"/g) || [];
  assert.equal(tablists.length, 4);
  for (const viewId of ['accountsView', 'profileView', 'supportStaffView', 'adminView']) {
    const viewStart = appHtml.indexOf(`<section id="${viewId}"`);
    const viewEnd = appHtml.indexOf('</section>', viewStart);
    assert.ok(viewStart >= 0 && viewEnd > viewStart, `${viewId} should exist`);
    assert.match(appHtml.slice(viewStart, viewEnd), /app-section-tabs/);
  }
  assert.match(appCss, /\.view-panel \.app-section-tabs > button\[role="tab"\]\[aria-selected="true"\]/);
  assert.match(appCss, /\.view-panel \.app-section-tabs > button\[role="tab"\]\.active/);
  assert.match(appCss, /\.view-panel \.app-section-tabs > button\[role="tab"\]:focus-visible/);
  assert.match(appCss, /\.admin-console \.admin-section-tab\.active/);
  assert.doesNotMatch(appCss, /#profileView \.dashboard-section-tabs > button/);
  assert.match(appCss, /button:not\(\.nav-tab\):not\(\.admin-section-tab\):not\(\.account-main-tab\):focus-visible/);
});

test('Battle Pass pack cards render the SVG sprite and preserve shop and vault interactions', () => {
  const artworkStart = appJs.indexOf("const BATTLE_PASS_PACK_SPRITE = '/images/battlepass/packs/reward-pack-sprite.svg';");
  const rendererStart = appJs.indexOf('function renderBattlePassShop()', artworkStart);
  const rendererEnd = appJs.indexOf('function renderBattlePassVault()', rendererStart);
  assert.ok(artworkStart >= 0 && rendererStart > artworkStart && rendererEnd > rendererStart);
  const artworkSource = appJs.slice(artworkStart, rendererStart);
  const rendererSource = appJs.slice(rendererStart, rendererEnd);
  const spriteSource = fs.readFileSync(packArtworkSpritePath, 'utf8');
  assert.deepEqual(fs.readdirSync(packArtworkDirectory).filter(file => file.endsWith('.png')), []);
  const tierNames = ['Paper', 'Wood', 'Copper', 'Bronze', 'Iron', 'Steel', 'Titanium', 'Silver', 'Gold'];
  const spritePositions = ['100 70', '590 70', '1080 70', '100 670', '590 670', '1080 670', '100 1270', '590 1270', '1080 1270'];
  for (const [index, name] of tierNames.entries()) {
    const tier = name.toLowerCase();
    assert.match(spriteSource, new RegExp(`<g id="${tier}-pack" transform="translate\\(${spritePositions[index]}\\)">`));
    assert.match(artworkSource, new RegExp(`${tier}: \\{ symbol: '${tier}-pack', viewBox: '${spritePositions[index]} 320 460'`));
  }
  assert.match(appJs, /BATTLE_PASS_PACK_SPRITE = '\/images\/battlepass\/packs\/reward-pack-sprite\.svg'/);
  assert.match(appCss, /\.battlepass-pack-layout \{ display: grid; gap:/);
  assert.match(appCss, /\.battlepass-pack-selector \{[^}]*display: flex;[^}]*overflow-x: auto;/);
  assert.match(appCss, /\.battlepass-pack-detail \{[^}]*grid-template-columns: minmax\(250px, 0\.8fr\) minmax\(0, 1\.2fr\);/);
  assert.match(appCss, /\.battlepass-pack-art \{ display: block; width: 100%; height: 100%;/);
  assert.match(appCss, /\.battlepass-pack-odds ul \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(appCss, /\.battlepass-promotional-pack-card \{ display: grid; grid-template-columns: minmax\(0, 1fr\); justify-items: center;/);

  const shop = { innerHTML: '', onclick: null, querySelector: () => ({ focus() {} }) };
  const points = { textContent: '' };
  const reveal = { replaceChildren() {} };
  const elements = {
    'battlepass-pack-shop': shop,
    'battlepass-shop-points': points,
    'battlepass-pack-reveal': reveal
  };
  let openedButton = null;
  const packs = tierNames.map((name, index) => ({
    id: index + 1,
    name,
    points_cost: name === 'Gold' ? 2000 : 100,
    out_of_stock: name === 'Wood',
    rewards: name === 'Paper' ? [{ name: 'Trading account', odds: 10 }] : [],
    odds_total: name === 'Paper' ? 100 : 0
  }));
  packs.push({ id: 10, name: 'Unknown Tier', points_cost: 2000, out_of_stock: false, rewards: [], odds_total: 0 });
  const sandbox = {
    battlePassPacks: packs,
    battlePassProfile: { points: 1000 },
    lastPackReveal: null,
    battlePassSelectedPackId: null,
    document: { getElementById: id => elements[id] || null },
    escapeHTML: value => String(value),
    openBattlePassPack: button => { openedButton = button; }
  };
  vm.runInNewContext(`${artworkSource}\n${rendererSource}\nrenderBattlePassShop();`, sandbox);

  for (const name of tierNames) {
    assert.ok(shop.innerHTML.includes(`<use href="/images/battlepass/packs/reward-pack-sprite.svg#${name.toLowerCase()}-pack"></use>`), `${name} should render from the sprite`);
  }
  assert.ok(shop.innerHTML.includes('<span class="battlepass-pack-fallback-mark" aria-hidden="true">✦</span><strong>Unknown Tier</strong>'));
  assert.ok(shop.innerHTML.includes('Trading account'));
  assert.ok(shop.innerHTML.includes('10%'));
  assert.ok(shop.innerHTML.includes('Balance: 1,000 points'));
  assert.ok(shop.innerHTML.includes('data-open-pack="1"'));
  assert.ok(shop.innerHTML.includes('aria-pressed="true" data-select-pack="1"'));
  const clickedButton = { disabled: false };
  shop.onclick({ target: { closest: selector => selector === '[data-open-pack]' ? clickedButton : null } });
  assert.equal(openedButton, clickedButton);
  const selectedPackButton = { dataset: { selectPack: '2' } };
  shop.onclick({ target: { closest: selector => selector === '[data-select-pack]' ? selectedPackButton : null } });
  assert.equal(sandbox.battlePassSelectedPackId, 2);
  assert.ok(shop.innerHTML.includes('<h3>Wood Pack</h3>'));
  assert.ok(shop.innerHTML.includes('Out of stock'));
  const unaffordablePackButton = { dataset: { selectPack: '9' } };
  shop.onclick({ target: { closest: selector => selector === '[data-select-pack]' ? unaffordablePackButton : null } });
  assert.equal(sandbox.battlePassSelectedPackId, 9);
  assert.ok(shop.innerHTML.includes('disabled>Not enough points</button>'));
  const openHandlerStart = appJs.indexOf('async function openBattlePassPack(button)');
  const openHandlerEnd = appJs.indexOf('async function useBattlePassCertificate(', openHandlerStart);
  assert.match(appJs.slice(openHandlerStart, openHandlerEnd), /walletFetch\('\/api\/battlepass\/packs\/open'/);

  const vaultRendererStart = appJs.indexOf('function renderBattlePassVault()');
  const vaultRendererEnd = appJs.indexOf('async function openBattlePassPack(', vaultRendererStart);
  const vault = { innerHTML: '', onclick: null };
  const certificates = { innerHTML: '', onclick: null };
  const rewards = { innerHTML: '' };
  const vaultElements = {
    'battlepass-vault-promotional-packs': vault,
    'battlepass-vault-certificates': certificates,
    'battlepass-vault-rewards': rewards
  };
  let openedPromotionalPack = null;
  const vaultSandbox = {
    battlePassVault: {
      promotional_packs: [{ id: 'bpg_123', pack_name: 'Gold', created_at: '2026-01-01T00:00:00Z' }],
      rewards: [],
      certificates: []
    },
    document: { getElementById: id => vaultElements[id] || null },
    escapeHTML: value => String(value),
    openBattlePassPromotionalPack: button => { openedPromotionalPack = button; }
  };
  vm.runInNewContext(`${artworkSource}\n${appJs.slice(vaultRendererStart, vaultRendererEnd)}\nrenderBattlePassVault();`, vaultSandbox);
  assert.ok(vault.innerHTML.includes('<use href="/images/battlepass/packs/reward-pack-sprite.svg#gold-pack"></use>'));
  assert.ok(vault.innerHTML.includes('data-open-promotional-pack="bpg_123"'));
  const promotionalButton = { disabled: false };
  vault.onclick({ target: { closest: selector => selector === '[data-open-promotional-pack]' ? promotionalButton : null } });
  assert.equal(openedPromotionalPack, promotionalButton);
});

test('workspace uses grouped navigation and shared homepage-inspired view and tile styling', () => {
  assert.match(appHtml, /<details class="nav-dropdown">[\s\S]*?Dashboard[\s\S]*?data-maintenance-page="accounts"[\s\S]*?data-maintenance-page="profile"/);
  assert.match(appHtml, /<details class="nav-dropdown">[\s\S]*?Trading[\s\S]*?data-maintenance-page="trade"[\s\S]*?data-maintenance-page="copytrading"/);
  assert.match(appHtml, /<summary class="nav-tab nav-dropdown-trigger">Community/);
  assert.match(appHtml, /<summary class="nav-tab nav-dropdown-trigger">Help/);
  assert.match(appJs, /dropdown\.classList\.toggle\('has-active', Boolean\(dropdown\.querySelector\('\.nav-tab\.active'\)\)\)/);
  assert.match(appHtml, /class="battlepass-page-heading app-page-heading"/);
  assert.match(appCss, /\.app-page-heading\s*\{[^}]*flex-direction:\s*column/);
  assert.match(appCss, /\.dashboard-tile,[\s\S]*?\.account-preview-stat\.dashboard-tile,[\s\S]*?\.battlepass-task\.dashboard-tile,[\s\S]*?\.purchase-plan-card\.dashboard-tile/);
  assert.match(appJs, /class="battlepass-task dashboard-tile"/);
  assert.match(appJs, /class="account-preview-stat dashboard-tile"/);
  assert.match(appJs, /class="card dashboard-tile purchase-plan-card/);
  assert.match(appCss, /\.plans-grid \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\); gap: 14px; \}/);
  assert.match(appCss, /\.plans-purchase-tools \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); align-items: start;/);
  assert.match(appCss, /@media \(max-width: 700px\)[\s\S]*?\.plans-grid \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); gap: 10px; \}[\s\S]*?\.plans-purchase-tools \{ grid-template-columns: minmax\(0, 1fr\); \}/);
});

test('trading terminal and homepage use the Blastrr logo image', () => {
  assert.match(appHtml, /<a class="logo" href="index\.html" aria-label="Blastrr home">[\s\S]*?<img class="brand-mark" src="\/favicon\.png" alt="" aria-hidden="true">[\s\S]*?<span>BLASTRR<\/span>/);
  assert.match(landingHtml, /<a class="brand" href="index\.html" aria-label="Blastrr home"><img class="brand-mark" src="\/favicon\.png" alt=""><span>BLASTRR<\/span><\/a>/);
  assert.match(landingHtml, /<a class="brand" href="index\.html"><img class="brand-mark" src="\/favicon\.png" alt=""><span>BLASTRR<\/span><\/a>/);
  assert.match(appCss, /\.logo\s*\{[^}]*font-size:\s*20px;[^}]*font-weight:\s*950;[^}]*letter-spacing:\s*0\.08em/);
  assert.match(appCss, /\.logo \.brand-mark\s*\{[^}]*object-fit:\s*cover/);
  assert.match(landingHtml, /\.brand-mark\{object-fit:cover;clip-path:none\}/);
});

test('homepage display font remains distinctive while the app uses the neutral documentation font', () => {
  assert.match(landingHtml, /fonts\.googleapis\.com\/css2\?family=Orbitron/);
  assert.match(landingHtml, /\.brand\{[^}]*font-family:"Orbitron"[^}]*font-style:italic/);
  assert.match(landingHtml, /\.hero h1\{font-family:"Orbitron"[^}]*font-style:italic/);
  assert.match(appCss, /\.logo > span, \.battlepass-page-heading h1 \{[\s\S]*?font-family: Inter/);
  assert.doesNotMatch(appHtml, /fonts\.googleapis\.com\/css2\?family=Orbitron/);
  assert.match(appCss, /body, button, input, select, textarea \{[\s\S]*?font-family: Inter/);
});

test('homepage navigation uses neutral outlines for hover and active states', () => {
  assert.match(landingHtml, /\.navlinks a:hover,\.navlinks a:focus-visible,\.navlinks a:active,\.navlinks a\[aria-current="page"\][\s\S]*?border-color:rgba\(180,190,200,\.32\);box-shadow:none/);
  assert.match(landingHtml, /button,input\[type="button"\],input\[type="submit"\],input\[type="reset"\],\.btn\{background:transparent!important;background-image:none!important;border:1px solid rgba\(180,190,200,\.2\)!important;color:#f8fafc!important;box-shadow:none!important/);
  assert.match(landingHtml, /button:hover:not\(:disabled\)[\s\S]*?border-color:rgba\(200,210,220,\.42\)!important;box-shadow:none!important/);
});

test('homepage focuses on crypto markets without promoting derivatives products', () => {
  assert.match(landingHtml, /20 major Binance crypto markets/);
  assert.match(landingHtml, /Crypto trading terminal/);
  assert.doesNotMatch(landingHtml, /perpetual|perps|CME|index contract/i);
  assert.match(landingHtml, /without the scheduled daily sessions and weekly closes typical of many FX and futures markets/);
});

test('terminal surfaces use a black glass theme with restrained neutral borders', () => {
  assert.match(appCss, /--surface-glass: rgba\(10, 11, 12, 0\.94\)/);
  assert.match(appCss, /backdrop-filter: blur\(20px\) saturate\(130%\)/);
  assert.match(appCss, /body:not\(\.auth-locked\) \{ background: #050607; \}/);
  assert.match(appCss, /border: 1px solid rgba\(180, 190, 200, 0\.2\) !important/);
  assert.match(appCss, /box-shadow: 0 0 8px rgba\(180, 190, 200, 0\.14\) !important/);
  assert.match(appCss, /header #nav-menu \{[\s\S]*?backdrop-filter: blur\(24px\) saturate\(145%\)/);
  assert.match(appCss, /\.hamburger-btn\.menu-open \.hamburger-glyph::before \{ transform: rotate\(45deg\); \}/);
  assert.match(appCss, /\.hamburger-btn\.menu-open \.hamburger-glyph::after \{ transform: rotate\(-45deg\); \}/);
  assert.match(appCss, /Neutral documentation-inspired theme shared by every terminal and admin view/);
  assert.match(appCss, /\.admin-section-tab:hover, \.admin-section-tab:focus-visible, \.admin-section-tab\.active \{[\s\S]*?rgba\(180, 190, 200, 0\.28\)/);
  assert.match(appCss, /\.admin-account-card, \.admin-creator-card, \.promo-code-card, \.support-ticket-card/);
  assert.match(appCss, /#wallet-menu \.wallet-menu-account:hover:not\(:disabled\)[\s\S]*?rgba\(200, 210, 220, 0\.38\)/);
});

test('trade entry uses metric cards, defaults to spot leverage, and scales the chart for screen size', () => {
  assert.match(appHtml, /id="order-leverage"[^>]*>[\s\S]*?<option value="1" selected>/);
  assert.match(appHtml, /class="order-metrics"/);
  assert.match(appHtml, /<span>Position notional<\/span>/);
  assert.match(appHtml, /id="order-liquidation-metric"[^>]*hidden/);
  assert.match(appJs, /liquidationMetric\.hidden = Number\(val\) <= 1/);
  assert.match(appJs, /orderMetrics\.classList\.toggle\('is-leveraged', Number\(val\) > 1\)/);
  assert.doesNotMatch(appHtml, /id="tradingview-widget-container"[^>]*style=/);
  assert.match(appCss, /\.live-market-chart-host \{[^}]*height: clamp\(/);
  assert.match(appCss, /main \{[^}]*max-width: 1920px/);
  assert.match(appJs, /liquidation-price-label/);
});

test('TradingView Lightweight Chart and order buttons use matching candle and brand colors', () => {
  assert.match(appJs, /liveMarketChart\.addCandlestickSeries/);
  assert.match(landingHtml, /\.c-up\{stroke:#72f0c3;fill:#72f0c3\}\.c-down\{stroke:#ff638e;fill:#ff638e\}/);
  assert.match(appJs, /up: '#72f0c3'/);
  assert.match(appJs, /down: '#ff638e'/);
  assert.match(appJs, /background: \{ color: LIVE_CHART_THEME\.background \}/);
  assert.match(appJs, /handleScroll: \{[\s\S]*?pressedMouseMove: true,[\s\S]*?horzTouchDrag: true,[\s\S]*?vertTouchDrag: true/);
  assert.match(appJs, /handleScale: \{[\s\S]*?axisPressedMouseMove: \{ time: true, price: true \},[\s\S]*?mouseWheel: true,[\s\S]*?pinch: true/);
  assert.match(appJs, /shiftVisibleRangeOnNewBar: false/);
  assert.match(appJs, /tickMarkFormatter: formatChartAxisTime/);
  assert.match(appJs, /function formatChartAxisTime\(time, tickMarkType\)/);
  assert.match(appJs, /timezoneLabel\.textContent = 'ET'/);
  assert.match(appHtml, /id="chart-drawing-toolbar"[\s\S]*?data-chart-drawing-tool="fib"[\s\S]*?data-chart-drawing-action="undo"[\s\S]*?data-chart-drawing-action="live"/);
  assert.match(appJs, /function setupLiveChartDrawings\(host, source, pair, timeframe\)/);
  assert.match(appJs, /blastrr\.chart-drawings\.v1:\$\{wallet\}:\$\{source\}:\$\{pair\}:\$\{timeframe\}/);
  assert.match(appCss, /\.live-market-chart-drawings \{[^}]*pointer-events: none/);
  assert.match(appJs, /upColor: LIVE_CHART_THEME\.up/);
  assert.match(appJs, /downColor: LIVE_CHART_THEME\.down/);
  assert.match(appJs, /borderVisible: true,[\s\S]*?borderUpColor: LIVE_CHART_THEME\.up,[\s\S]*?wickVisible: true,[\s\S]*?wickUpColor: LIVE_CHART_THEME\.up/);
  assert.match(appCss, /\.order-actions \.btn-buy\s*\{[^}]*#72f0c3/);
  assert.match(appCss, /\.order-actions \.btn-sell\s*\{[^}]*#ff638e/);
  assert.match(appCss, /\.order-actions button\.btn-buy:not\(\.nav-tab\):not\(\.admin-section-tab\)\s*\{[^}]*rgba\(114, 240, 195, 0\.2\)[^}]*color: #72f0c3[^}]*rgba\(114, 240, 195, 0\.08\)/);
  assert.match(appCss, /\.order-actions button\.btn-sell:not\(\.nav-tab\):not\(\.admin-section-tab\)\s*\{[^}]*rgba\(255, 99, 142, 0\.2\)[^}]*rgba\(255, 99, 142, 0\.08\)/);
  assert.match(appHtml, /id="chart-timeframe"[\s\S]*?<option value="1d">1d<\/option>/);
  assert.match(appHtml, /id="chart-indicator-select"/);
  assert.match(appHtml, /<option value="MACD">MACD<\/option>/);
  assert.match(appHtml, /<option value="VOLUME">Volume<\/option>/);
  assert.match(appHtml, /id="chart-active-indicators"/);
  assert.match(appHtml, /src="\/js\/chartIndicators\.js\?v=20261115-multi-account-checkout" defer/);
  assert.match(appJs, /granularity=\$\{timeframeConfig\.bitget\}/);
  assert.match(appJs, /interval=\$\{timeframeConfig\.binance\}/);
  assert.match(appJs, /function refreshChartIndicators\(\)/);
  assert.match(appJs, /chart\.addLineSeries/);
  assert.match(appJs, /liveMarketTimeframeSeconds/);
  assert.match(appJs, /function renderChartIndicatorPane/);
  assert.match(appJs, /function renderActiveChartIndicators/);
});

test('open positions show margin and notional separately and refresh PnL with live quotes', () => {
  assert.match(appHtml, /<th>Margin \/ Notional \(\$\)<\/th>/);
  assert.match(appJs, /const notional = Number\(trd\.units\) \* Number\(trd\.entry_price\)/);
  assert.match(appJs, /function updateDisplayedOpenTradePnls\(currentPrice\)/);
  assert.match(appJs, /updateDisplayedOpenTradePnls\(currentLivePrice\)/);
  assert.match(appJs, /setInterval\(\(\) => fetchPrice\(pair, type, source, generation\), 1000\)/);
});

test('mobile navigation has readable, touch-sized links and accessible expanded state', () => {
  assert.match(appHtml, /id="hamburger-icon"[^>]*aria-expanded="false"/);
  assert.match(appJs, /hamburger\.setAttribute\('aria-expanded', String\(isOpen\)\)/);
  assert.match(appCss, /header #nav-menu \.nav-tab \{[^}]*min-height: 50px[^}]*font-size: 16px/);
  assert.match(appCss, /header #nav-menu \.nav-tab \{[^}]*min-height: 54px[^}]*font-size: 16px/);
  assert.match(appCss, /max-height: calc\(100vh - 76px\)/);
  assert.match(appCss, /@media \(max-width: 700px\) \{[\s\S]*?header \{ flex-wrap: wrap; row-gap: 10px; gap: 10px; padding: 12px; \}[\s\S]*?\.header-actions \{ order: 2; flex: 1 0 100%;[\s\S]*?\.hamburger-btn \{ position: absolute; top: 12px; right: 12px;[\s\S]*?background: rgba\(6, 4, 10, 0\.99\)/);
  assert.match(appCss, /header #nav-menu \.nav-tab:not\(\.active\) \{ color: #e2e8f0; background: transparent; \}/);
  assert.match(appCss, /\.nav-tab:hover, \.nav-tab:focus-visible,[\s\S]*?box-shadow: 0 0 6px rgba\(180, 190, 200, 0\.09\)/);
  assert.match(appCss, /\.admin-section-tab:hover, \.admin-section-tab:focus-visible, \.admin-section-tab\.active \{[\s\S]*?box-shadow: 0 0 6px rgba\(180, 190, 200, 0\.08\)/);
  assert.match(appCss, /button:not\(\.nav-tab\):not\(\.admin-section-tab\)/);
});

test('terminal stays black and locked until a signed wallet session is established', () => {
  assert.match(appHtml, /<body class="auth-locked">[\s\S]*?<section id="wallet-login-gate"/);
  assert.match(appHtml, /<header hidden>/);
  assert.match(appHtml, /<main hidden>/);
  assert.match(appHtml, /onclick="connectWallet\(\)">Connect wallet &amp; sign in/);
  assert.match(appHtml, /id="disclaimer-gate"[^>]*hidden/);
  assert.match(appHtml, /id="disclaimer-scroll-area"/);
  assert.match(appHtml, /id="disclaimer-accept-terms" type="checkbox" disabled/);
  assert.match(appHtml, /id="disclaimer-simulated-funds" type="checkbox" disabled/);
  assert.match(appHtml, /id="disclaimer-remember" type="checkbox" checked/);
  assert.match(appHtml, /id="disclaimer-cancel-purchase"/);
  assert.match(appHtml, /Testimonials, feedback, or metrics/);
  assert.match(appHtml, /five minutes before or after/);
  assert.match(appHtml, /general minimum holding period of two minutes/);
  assert.match(appHtml, /not an automatic breach/);
  assert.match(appHtml, /built-in copy feature between accounts that you personally own and control/);
  assert.match(appHtml, /reward is not guaranteed/);
  assert.doesNotMatch(appHtml, /No Guarantee or Promise of Payment|Hindsight Bias/i);
  assert.match(appJs, /const DISCLAIMER_VERSION = '2026-11-17-v2'/);
  assert.match(serverJs, /const DISCLAIMER_VERSION = '2026-11-17-v2'/);
  assert.match(appCss, /body\.auth-locked[^}]*background:\s*#000/);
  assert.match(appJs, /if \(!dashboardAuthenticated \|\| !walletSessionToken \|\|[\s\S]*?lockDashboard\(\);[\s\S]*?return;/);
  assert.match(appJs, /await ensureWalletSession\(\);[\s\S]*?walletFetch\('\/api\/user\/disclaimer-consent'\)[\s\S]*?if \(consent\.accepted && consent\.version === DISCLAIMER_VERSION\)[\s\S]*?continueAfterDisclaimer\(\)/);
  assert.match(appJs, /const accountsLoaded = await loadUserAccounts\(connectedWallet\)[\s\S]*?if \(accountsLoaded && userAccounts\.length === 0\) switchView\('buyView'\)/);
  assert.match(appJs, /if \(!res\.ok\) throw new Error\('Unable to load wallet accounts\.'\)[\s\S]*?if \(!Array\.isArray\(data\.accounts\)\) throw new Error\('The wallet account list is unavailable\.'\)[\s\S]*?return true;[\s\S]*?return false;/);
  assert.match(appJs, /scrollArea\.scrollTop \+ scrollArea\.clientHeight >= scrollArea\.scrollHeight - 4/);
  assert.match(appJs, /accepted_terms: true,[\s\S]*?simulated_funds: true/);
  assert.match(appJs, /async function buyPlan\(planId, priceUsdt\)[\s\S]*?const quantity = Number\(document\.getElementById\(`plan-quantity-\$\{planId\}`\)/);
  assert.match(appJs, /requestPurchaseDisclaimer\(\)[\s\S]*?completePlanPurchase\(planId, amount, quantity\)/);
  assert.match(appJs, /walletSessionOwner !== owner \|\| walletSessionExpiresAt <= Date\.now\(\)/);
  assert.match(appJs, /async function completePlanPurchase\(planId, amount, quantity = 1\)[\s\S]*?Confirm purchase of \$\{quantity\} account[\s\S]*?toTokenUnits\(amount, chainConfig\.decimals\)/);
  assert.match(appJs, /updatePlanPurchaseTotal\(planId, unitPrice\)/);
  assert.match(appJs, /quantity < 1 \|\| quantity > 10/);
  assert.match(serverJs, /const quantity = Number\(req\.body\?\.quantity \?\? 1\)/);
  assert.match(serverJs, /verifyMultiChainPurchase\([\s\S]*?wallet_address, totalPrice, TREASURY_WALLET, paymentAsset\)/);
  assert.match(serverJs, /INSERT INTO purchases \([\s\S]*?payment_asset, payer_address/);
  assert.match(serverJs, /if \(req\.walletType !== 'SOLANA'[\s\S]*?paymentWallet, 'SOLANA'\) !== wallet_address/);
  assert.match(serverJs, /if \(req\.walletType !== 'EVM'\)[\s\S]*?EVM payments are available only to the active EVM wallet/);
  assert.match(serverJs, /account_ids: accountIds/);
  assert.match(appJs, /disclaimer_version: DISCLAIMER_VERSION,[\s\S]*?terms_accepted: true,[\s\S]*?simulated_funds_acknowledged: true/);
  assert.match(serverJs, /app\.get\('\/api\/user\/disclaimer-consent', requireWalletSession/);
  assert.match(serverJs, /app\.post\('\/api\/user\/disclaimer-consent', sensitiveLimiter, requireWalletSession/);
  assert.match(serverJs, /wallet_disclaimer_acceptances/);
  assert.match(serverJs, /req\.body\?\.disclaimer_version !== DISCLAIMER_VERSION[\s\S]*?req\.body\?\.terms_accepted !== true[\s\S]*?req\.body\?\.simulated_funds_acknowledged !== true/);
  assert.match(appJs, /if \(dashboardAuthenticated && \(!walletSessionToken \|\| walletSessionExpiresAt <= Date\.now\(\)\)\)/);
});

test('wallet switcher menu lists connected accounts before add and logout actions', () => {
  assert.match(appJs, /availableWallets\.forEach\(wallet => \{[\s\S]*?accounts\.append\(button\);[\s\S]*?function updateWalletUIState/);
  assert.match(appJs, /getConnectedWalletOwnerKey\(\)[\s\S]*?solana:\$\{connectedWallet\}/);
  assert.match(appJs, /async function switchToAvailableWallet\(wallet\)[\s\S]*?await onWalletSwitched\(wallet\.address, 'SOLANA', wallet\.provider\)/);
  assert.match(appJs, /function toggleWalletMenu\(\)/);
  assert.match(appJs, /function closeWalletMenu\(\)/);
  assert.match(appHtml, /id="wallet-menu-accounts"[\s\S]*?id="connect-new-btn"[\s\S]*?id="disconnect-btn"/);
  assert.match(appCss, /\.wallet-menu-panel\s*\{[^}]*position: absolute/);
  assert.match(appCss, /@media \(max-width: 700px\)[\s\S]*?\.wallet-menu-panel \{ position: fixed/);
  assert.match(appCss, /#wallet-menu \.wallet-menu-account,[\s\S]*?box-shadow: none !important/);
  assert.match(appCss, /#wallet-menu \.wallet-menu-account:hover:not\(:disabled\),[\s\S]*?#wallet-menu \.wallet-menu-account:active[\s\S]*?box-shadow: 0 0 12px/);
  assert.match(appCss, /#wallet-menu \.wallet-menu-logout:active[\s\S]*?box-shadow: 0 0 12px rgba\(248, 113, 113, 0\.2\)/);
});

test('wallet type selectors use consistent accessible dark dropdown styling', () => {
  for (const id of [
    'wallet-login-type',
    'wallet-login-solana-provider',
    'wallet-add-type',
    'wallet-add-solana-provider'
  ]) {
    assert.match(appHtml, new RegExp(`<select id="${id}" class="wallet-choice-select">`));
  }
  assert.match(appCss, /\.wallet-choice-select\s*\{[^}]*appearance: none;[^}]*border-radius: 11px/);
  assert.match(appCss, /\.wallet-choice-select:focus-visible\s*\{[^}]*outline: 2px solid/);
  assert.match(appCss, /\.wallet-choice-select option\s*\{[^}]*background: #101214/);
});

test('BlastrrPass content and reward fields wrap without mobile overflow', () => {
  assert.match(appCss, /\.battlepass-task-heading > strong \{[^}]*overflow-wrap: anywhere/);
  assert.match(appCss, /\.battlepass-task-copy p \{[^}]*overflow-wrap: anywhere/);
  assert.match(appCss, /\.battlepass-reward-code \{[^}]*max-width: 100%; overflow-wrap: anywhere/);
  assert.match(appCss, /\.battlepass-x-preview blockquote, \.battlepass-x-preview iframe \{[^}]*max-width: 100% !important/);
  assert.match(appCss, /\.admin-task-form \.form-group \{ flex-basis: 100%; min-width: 0; \}/);
  assert.match(appCss, /\.battlepass-admin-row \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
});

test('accounts, leaderboard, and profile use responsive Battle Pass-style cards', () => {
  assert.match(appHtml, /id="accountsView" class="view-panel workspace-view"/);
  assert.match(appHtml, /id="accounts-portfolio-container" class="account-card-list"/);
  assert.match(appHtml, /id="leaderboardView" class="view-panel workspace-view"/);
  assert.match(appHtml, /id="leaderboard-table-body" class="leaderboard-card-list"/);
  assert.match(appHtml, /id="profileView" class="view-panel workspace-view"/);
  assert.match(appHtml, /id="ref-transactions-list" class="profile-commission-list"/);
  assert.match(appJs, /class="battlepass-task leaderboard-card/);
  assert.match(appJs, /class="account-card"/);
  assert.match(appJs, /class="battlepass-task profile-commission-card"/);
  assert.match(appCss, /\.account-card\s*\{[^}]*border: 1px solid rgba\(203, 213, 225, 0\.095\)[^}]*background: rgba\(4, 3, 7, 0\.82\)/);
  assert.match(appCss, /\.leaderboard-card-list\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(appCss, /\.leaderboard-card \{ display: grid; grid-template-columns: minmax\(0, 1fr\) auto auto/);
  assert.match(appCss, /\.leaderboard-metric \{ display: flex; align-items: baseline;[^}]*white-space: nowrap/);
  assert.match(appCss, /\.leaderboard-player-card \{[^}]*width: min\(280px, calc\(100vw - 72px\)\)/);
  assert.match(appCss, /\.leaderboard-avatar-wrap:hover \.leaderboard-player-card, \.leaderboard-avatar-wrap:focus-within \.leaderboard-player-card/);
  assert.match(appCss, /@media \(max-width: 700px\)[\s\S]*?\.leaderboard-card \{ grid-template-columns: minmax\(0, 1fr\) auto/);
  assert.match(appCss, /\.battlepass-task\s*\{[\s\S]*?border: 1px solid var\(--surface-border\)[\s\S]*?background: rgba\(5, 7, 11, 0\.38\)/);
  assert.match(appJs, /<div class="leaderboard-metric">[\s\S]*?<small>\$\{metricLabel\}<\/small>/);
  const leaderboardStart = appHtml.indexOf('<section id="leaderboardView"');
  const leaderboardEnd = appHtml.indexOf('</section>', leaderboardStart);
  const leaderboardHtml = appHtml.slice(leaderboardStart, leaderboardEnd);
  assert.doesNotMatch(leaderboardHtml, /lb-search-input|filterLeaderboardTable|type="search"/);
  assert.match(appJs, /async function loadLeaderboard\(mode = 'DAILY'\)/);
  assert.doesNotMatch(appJs, /function filterLeaderboardTable|lb-search-input/);
});

test('homepage shows five users for every leaderboard category and hides during leaderboard maintenance', () => {
  const maintenanceJs = fs.readFileSync('public/js/maintenance-page.js', 'utf8');
  assert.match(landingHtml, /<section id="home-leaderboards" class="home-leaderboards" hidden/);
  for (const mode of ['DAILY', 'MONTHLY', 'PAYOUTS']) {
    assert.match(landingHtml, new RegExp(`mode:"${mode}",host:"home-lb-${mode.toLowerCase()}"`));
  }
  assert.match(landingHtml, /\/api\/leaderboard\?mode=\$\{category\.mode\}&limit=5/);
  assert.match(landingHtml, /data\.leaderboard\.slice\(0,5\)/);
  assert.match(landingHtml, /home-leaderboard-row/);
  assert.ok(landingHtml.includes('name.textContent=`@${row.username || "Trader"}`;'));
  assert.match(landingHtml, /@media\(max-width:720px\)[\s\S]*?\.home-leaderboard-grid\{grid-template-columns:1fr\}/);
  assert.match(maintenanceJs, /item\.page_id === 'leaderboard'/);
  assert.match(maintenanceJs, /homeLeaderboardSection\.hidden = Number\(page\?\.is_offline\) === 1 \|\|[\s\S]*?Number\(leaderboardPage\?\.is_offline\) === 1/);
});

test('homepage and terminal buttons use restrained neutral borders', () => {
  const terminalButtonRule = /button:not\(\.nav-tab\):not\(\.admin-section-tab\), input\[type="button"\], input\[type="submit"\], input\[type="reset"\], \.btn\s*\{[\s\S]*?background: transparent !important;[\s\S]*?border: 1px solid rgba\(180, 190, 200, 0\.2\) !important;[\s\S]*?box-shadow: 0 0 4px rgba\(180, 190, 200, 0\.06\) !important/;
  assert.match(appCss, terminalButtonRule);
  assert.match(appCss, /border-color: rgba\(200, 210, 220, 0\.48\) !important;[\s\S]*?box-shadow: 0 0 8px rgba\(180, 190, 200, 0\.14\) !important/);
  assert.match(appCss, /\.nav-tab \{[\s\S]*?background: transparent;[\s\S]*?border-color: transparent;/);
  assert.match(landingHtml, /button,input\[type="button"\],input\[type="submit"\],input\[type="reset"\],\.btn\{background:transparent!important;background-image:none!important;border:1px solid rgba\(180,190,200,\.2\)!important;color:#f8fafc!important;box-shadow:none!important/);
});

test('NullNet checkout uses the correct chain ID and matching wallet and verification RPC settings', () => {
  assert.match(appJs, /448000:\s*\{[\s\S]*?chainIdHex: "0x6d600"[\s\S]*?USDT: \{ address: "0x7ec3659A8225ED474D7c662126616aE08545C29b", decimals: 18 \}/);
  assert.match(serverJs, /448000:\s*\{[\s\S]*?chainIdHex: "0x6d600"[\s\S]*?rpcUrl: "https:\/\/rpc\.lunul\.org"[\s\S]*?USDT: \{ address: "0x7ec3659A8225ED474D7c662126616aE08545C29b", decimals: 18 \}/);
  assert.match(appJs, /const rawAmount = toTokenUnits\(amount, tokenConfig\.decimals\)/);
  assert.match(serverJs, /rawValue >= expectedRawValue/);
  assert.match(appJs, /method: 'wallet_addEthereumChain'/);
  assert.match(appJs, /const activeChainId = BigInt\(await provider\.request\(\{ method: 'eth_chainId' \}\)\)/);
});

test('BNB Smart Chain checkout uses BEP-20 USDT and is listed on the payment surfaces', () => {
  const bscUsdt = '0x55d398326f99059fF775485246999027B3197955';
  assert.match(appJs, /56:\s*\{[\s\S]*?name: "BNB Smart Chain"[\s\S]*?chainIdHex: "0x38"[\s\S]*?USDT: \{ address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 \}/);
  assert.match(serverJs, /56:\s*\{[\s\S]*?name: "BNB Smart Chain"[\s\S]*?chainIdHex: "0x38"[\s\S]*?rpcUrl: "https:\/\/bsc-dataseed\.binance\.org"[\s\S]*?USDT: \{ address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 \}/);
  assert.match(appHtml, /<option value="56">BNB Smart Chain \(BSC\)<\/option>/);
  assert.ok(landingHtml.includes('>BNB Smart Chain</b><small>BEP-20</small>'));
  assert.match(landingHtml, /Seven networks\./);
  assert.match(landingHtml, /USDC is available only on networks with the configured official token/);
  assert.equal((appJs.match(new RegExp(bscUsdt, 'g')) || []).length, 1);
});

test('purchase calldata encodes USDT amounts using each token decimal precision', () => {
  const helper = appJs.match(/function toTokenUnits\(amount, decimals\) \{[\s\S]*?\n        \}/);
  assert.ok(helper);
  const toUnits = new vm.Script(`${helper[0]}\ntoTokenUnits`).runInNewContext();
  assert.equal(toUnits('12.34', 18).toString(), '12340000000000000000');
  assert.equal(toUnits('12.34', 6).toString(), '12340000');
});

test('startup correction only adjusts untouched accounts with the old Whale capital', () => {
  assert.match(serverJs, /initial_balance = 250050 AND current_balance = 250050/);
  assert.match(serverJs, /current_equity = 250050 AND high_water_mark = 250050/);
  assert.match(serverJs, /NOT EXISTS \(SELECT 1 FROM trades WHERE trades\.account_id = accounts\.id\)/);
  assert.match(serverJs, /NOT EXISTS \(SELECT 1 FROM withdrawals WHERE withdrawals\.account_id = accounts\.id\)/);
});

test('live market PnL feeds server-side risk checks and active trade responses', () => {
  assert.match(serverJs, /function loadAccountWithLiveRisk/);
  assert.match(serverJs, /getLiveRiskBalance\(account, allTrades, pricesBySymbol, quoteRatesBySymbol\)/);
  assert.match(serverJs, /setInterval\(checkLiveRiskLimits, 5000\)/);
  assert.match(serverJs, /risk_balance: getRiskBalance\(liveAccount\)/);
  assert.match(serverJs, /getTradeMargin\(trade\) \+ pnl/);
  assert.match(serverJs, /WHERE id = \? AND status = \?/);
  assert.match(serverJs, /function unlockExpiredDllAccounts/);
  assert.match(serverJs, /a\.lock_reason IN \('DLL', 'MLL'\)/);
  assert.match(serverJs, /COALESCE\(permanent_lock, 0\) = 1 AND \? = 0/);
  assert.match(appJs, /acc\.lock_reason === 'MLL' \|\| Number\(acc\.permanent_lock\) === 1/);
  assert.match(appJs, /Number\.isFinite\(Number\(trd\.live_pnl\)\)/);
});

test('open trades use whole-dollar values and display submitted dollar SL/TP amounts', () => {
  assert.match(appJs, /const formatOpenTradeValue = value => Number\(value\)\.toLocaleString\(undefined, \{ maximumFractionDigits: 0 \}\)/);
  assert.match(appJs, /const stop = trd\.sl_tp_mode === 'amount' \? trd\.sl_amount : trd\.sl/);
  assert.match(appJs, /const target = trd\.sl_tp_mode === 'amount' \? trd\.tp_amount : trd\.tp/);
  assert.match(appJs, /SL: \$\{formatProtectionValue\(stop\)\} \/ TP: \$\{formatProtectionValue\(target\)\}/);
  assert.match(appJs, /pnl\.toLocaleString\(undefined, \{ maximumFractionDigits: 0 \}\)/);
  assert.match(appCss, /#open-trades-list \.open-trade-value \{ white-space: nowrap; \}/);
});

test('purple glow around workspace boxes and buttons is reduced to a faint accent', () => {
  assert.match(appCss, /:root \{ --home-card-line: rgba\(164, 119, 255, 0\.022\); \}/);
  assert.match(appCss, /\.nav-tab:hover,[\s\S]*?box-shadow: 0 0 1px rgba\(141, 77, 255, 0\.02\), inset 0 0 0\.7px rgba\(141, 77, 255, 0\.006\)/);
  assert.match(appCss, /\.wallet-login-button \{ box-shadow: 0 0 1\.6px rgba\(168, 85, 247, 0\.028\); \}/);
  assert.match(appCss, /\.purchase-plan-card\.dashboard-tile\.is-featured::before \{ opacity: 0\.1; \}/);
  assert.match(appCss, /box-shadow: 0 0 1\.2px rgba\(168, 85, 247, 0\.038\), inset 0 0 0\.8px rgba\(168, 85, 247, 0\.006\) !important/);
});

test('app and homepage remove purple borders from navigation, buttons, and main cards', () => {
  assert.match(appCss, /:root \{ --home-card-line: rgba\(180, 190, 200, 0\.1\); \}/);
  assert.match(appCss, /\.nav-tab:hover,[\s\S]*?border-color: rgba\(180, 190, 200, 0\.26\);[\s\S]*?box-shadow: none;/);
  assert.match(appCss, /\.admin-section-tab:hover,[\s\S]*?border-color: rgba\(180, 190, 200, 0\.28\);[\s\S]*?box-shadow: none;/);
  assert.match(appCss, /\.purchase-plan-card\.dashboard-tile\.is-featured \{ border-color: rgba\(180, 190, 200, 0\.16\); \}/);
  assert.match(landingHtml, /\.visual,\.launch-strip,\.plan\.featured,\.plan:hover,\.public-review-card\{border-color:rgba\(180,190,200,\.16\)\}/);
  assert.match(landingHtml, /\.eyebrow,\.chain-pill,\.ticker-icon,\.tag,\.mini-stat,\.bull,\.promo-code,\.network,\.metric,\.step,\.feature,\.faq-item,\.testimonial,\.cta-band\{border-color:rgba\(180,190,200,\.14\)\}/);
});

test('chart account selector excludes risk-locked accounts and clears when none are selectable', () => {
  assert.match(appJs, /function isRiskLockedAccount\(account\)/);
  assert.match(appJs, /const selectableAccounts = userAccounts\.filter\(isSelectableTradingAccount\)/);
  assert.match(appJs, /No Unlocked Accounts Available/);
  assert.match(appJs, /function isSelectableTradingAccount\(account\)/);
  assert.match(appJs, /isRiskLockedAccount\(account\)/);
});

test('market charts and prices use Binance and Bitget data with trade overlays', () => {
  assert.doesNotMatch(appJs, /api\.binance\.com\/api\/v3\/ticker\/24hr|api\.bitget\.com\/api\/v2\/mix\/market\/ticker/);
  assert.match(appJs, /connectMarketDataStream\(\)/);
  assert.match(serverJs, /app\.get\('\/api\/market-data\/stream'/);
  assert.match(marketDataProvidersJs, /https:\/\/api\.binance\.com\/api\/v3\/ticker\/price\?symbol=/);
  assert.match(marketDataProvidersJs, /https:\/\/api\.bitget\.com\/api\/v2\/mix\/market\/ticker\?productType=USDT-FUTURES&symbol=/);
  assert.match(appJs, /https:\/\/api\.bitget\.com\/api\/v2\/mix\/market\/candles\?productType=USDT-FUTURES/);
  assert.match(appJs, /https:\/\/api\.binance\.com\/api\/v3\/klines\?symbol=/);
  assert.match(appJs, /https:\/\/fapi\.binance\.com\/fapi\/v1\/klines\?symbol=/);
  assert.match(appJs, /function renderChartTradeOverlays\(trades\)/);
  assert.match(appJs, /liveMarketCandleSeries\.createPriceLine/);
  assert.match(appJs, /liveMarketCandleSeries\.setMarkers/);
  assert.doesNotMatch(appHtml, /Open trades: entry, SL &amp; TP levels/);
  assert.match(marketDataProvidersJs, /payload\.code !== '00000'/);
  assert.match(marketDataProvidersJs, /ticker\?\.symbol !== market\.pair/);
  assert.match(marketDataProvidersJs, /price = Number\(ticker\.markPrice/);
  assert.match(appJs, /function updateLiveMarketChart\(pair, priceValue, timestampValue\)/);
  assert.match(appJs, /liveMarketCandleSeries\.update/);
  assert.match(appJs, /initLiveMarketChart\(opt\.dataset\.pair, opt\.dataset\.source\)/);
  assert.match(appJs, /Charts by TradingView/);
  assert.match(appHtml, /lightweight-charts@4\.2\.3\/dist\/lightweight-charts\.standalone\.production\.js/);
  assert.doesNotMatch(appJs, /\/api\/market\/price/);
  assert.doesNotMatch(appJs, /api\.bybit\.com|api\.nasdaq\.com/);
  assert.match(serverJs, /getAuthoritativePrice\(market/);
  assert.match(serverJs, /getAuthoritativeQuote\(market/);
  assert.match(serverJs, /market\.source === 'BITGET_PERP' \? marketPrice \* 0\.0005 : 5/);
  assert.match(serverJs, /const legacyTradeMarkets = new Map/);
  assert.match(serverJs, /function getTradeMarket\(symbol\)/);
});

test('landing-page plans are loaded from the shared plans API', () => {
  assert.match(landingHtml, /fetch\("\/api\/plans"\)/);
  assert.doesNotMatch(landingHtml, /\{name:"Micro",capital:/);
  assert.match(landingHtml, /function renderPlans\(\)\{[\s\S]*?host\.querySelectorAll\("\.reveal"\)\.forEach\(element=>observer\.observe\(element\)\)/);
  assert.match(landingHtml, /if\(!plans\.length\)\{[\s\S]*?host\.textContent="Plans are temporarily unavailable/);
  const inlineScript = [...landingHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .find(script => script.trim());
  assert.ok(inlineScript);
  assert.doesNotThrow(() => new vm.Script(inlineScript));
});

test('landing navigation links to the unified terminal instead of legacy spot and futures pages', () => {
  assert.match(landingHtml, /const APP_URL = "app\.html"/);
  assert.match(landingHtml, /href="app\.html">Trade Terminal/);
  assert.doesNotMatch(landingHtml, /href="(?:spot|perps)\.html"/);
});

test('account cards expose expandable trade history and daily profit charts', () => {
  assert.match(appJs, /<details class="account-expanded"/);
  const accountCard = appJs.slice(appJs.indexOf('<article id="acc-card-${acc.id}"'), appJs.indexOf('</article>', appJs.indexOf('<article id="acc-card-${acc.id}"')));
  assert.match(accountCard, /class="account-card copy-account-card/);
  assert.ok(accountCard.indexOf('class="account-minimized-overview"') < accountCard.indexOf('<details class="account-expanded"'));
  assert.match(accountCard, /renderAccountsPortfolioMinimizedContent\(acc, copyAssignments\.get\(String\(acc\.id\)\), copyGroupsAvailable\)/);
  assert.match(appJs, /function renderAccountsPortfolioMinimizedContent\(account, assignment, copyGroupsAvailable\)/);
  assert.match(appJs, /assignment\?\.role === 'Follower'[\s\S]*?sizePct\.toLocaleString\(\)/);
  assert.ok(accountCard.indexOf('<details class="account-expanded"') < accountCard.indexOf('class="account-card-header"'));
  assert.match(accountCard, /<details class="account-expanded">[\s\S]*?<div class="account-expanded-content">[\s\S]*?<div id="account-performance-\$\{acc\.id\}"/);
  assert.match(appCss, /\.account-expanded-content \{ display: grid; gap: 14px;/);
  assert.match(appCss, /\.copy-overview-account \{ display: grid; gap: 10px;/);
  assert.match(appCss, /\.account-card\.copy-account-card \.account-minimized-overview \{ display: contents; \}/);
  assert.match(appCss, /\.account-card\.copy-account-card > \.account-expanded \{ flex: 1 0 100%; \}/);
  assert.match(appJs, /renderDailyProfitChart/);
  assert.match(appJs, /Daily profit by date/);
  assert.match(appJs, /function renderAccountOverviewContent\(account, assignment, copyGroupsAvailable\)/);
  assert.match(appJs, /walletFetch\(`\/api\/accounts\/details/);
  assert.match(appJs, /id="profit-target-\$\{acc\.id\}"/);
  assert.match(appJs, /Target: \$\$\{acc\.profit_target\.toLocaleString\(\)\}/);
  assert.match(appCss, /\.account-progress \{ display: block; width: 100%; height: 5px;/);
});

test('expanded accounts show a responsive daily trade calendar and save text-only journal entries', () => {
  assert.match(databaseJs, /CREATE TABLE IF NOT EXISTS account_trade_journals/);
  assert.match(databaseJs, /UNIQUE\(account_id, day\)/);
  assert.match(serverJs, /SELECT day, body, updated_at FROM account_trade_journals WHERE account_id = \? ORDER BY day/);
  assert.match(serverJs, /app\.put\('\/api\/accounts\/:accountId\/journal', sensitiveLimiter, requireWalletSession/);
  assert.match(serverJs, /account\.wallet_address\?\.toLowerCase\(\) !== req\.walletAddress/);
  assert.match(serverJs, /Journal entries must be text of 5,000 characters or fewer/);
  assert.match(serverJs, /day > new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/);
  assert.match(serverJs, /ON CONFLICT\(account_id, day\) DO UPDATE SET/);
  assert.match(appJs, /<section class="account-trade-calendar-section" aria-label="Trade calendar and journal">/);
  assert.match(appJs, /function renderAccountTradeCalendar\(card, account, trades, journalEntries\)/);
  assert.match(appJs, /trade\.status === 'CLOSED'/);
  assert.match(appJs, /totals\.profit > 0[\s\S]*?'is-winning'[\s\S]*?totals\.profit < 0[\s\S]*?'is-losing'[\s\S]*?'is-flat'/);
  assert.match(appJs, /data-calendar-day="\$\{day\}"/);
  assert.match(appJs, /function saveAccountJournalEntry\(accountId, button\)/);
  assert.match(appJs, /method: 'PUT'/);
  assert.match(appJs, /data\.entry\.body/);
  assert.match(appJs, /maxlength="5000"/);
  assert.match(appCss, /\.account-calendar-grid \{ display: grid; grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(appCss, /\.account-calendar-day\.is-winning/);
  assert.match(appCss, /\.account-calendar-day\.is-losing/);
  assert.match(appCss, /\.account-calendar-day\.is-flat/);
  assert.match(appCss, /@media \(max-width: 700px\)[\s\S]*?\.account-calendar-day \{ min-height: 69px/);
});

test('account performance summaries include active and soft DLL-locked accounts only', () => {
  const accountsStart = appHtml.indexOf('<section id="accountsView"');
  const accountsEnd = appHtml.indexOf('<section id="copyTradingView"', accountsStart);
  const accountsHtml = appHtml.slice(accountsStart, accountsEnd);
  assert.match(accountsHtml, /id="show-mll-accounts"[^>]*onchange="toggleMllAccounts\(this\.checked\)"/);
  assert.match(accountsHtml, /id="accounts-copy-trading-status"/);
  assert.match(accountsHtml, /Show MLL-failed accounts/);
  assert.match(appHtml, /Totals include active accounts and soft-locked DLL accounts; MLL-locked accounts are excluded/);
  assert.match(appJs, /function isActivePortfolioAccount\(account\)/);
  assert.match(appJs, /account\?\.status === 'ACTIVE'/);
  assert.match(appJs, /No active, unlocked accounts available to display/);
  assert.match(appJs, /function toggleMllAccounts\(show\)/);
  assert.match(appJs, /showPermanentlyLockedPortfolioAccounts && isMllAccount/);
  assert.match(appJs, /account\?\.status === 'FAILED'/);
  assert.match(appJs, /account\?\.status === 'MLL_FAILED'/);
  assert.match(appJs, /account\?\.status === 'CLOSED'/);
  assert.match(appJs, /displayedOpenTrades = \[\];[\s\S]*?renderChartTradeOverlays\(\[\]\)/);
  assert.match(serverJs, /liveAccount\.status === 'FAILED'/);
  assert.match(serverJs, /trades: failedAccount \? \[\] :/);
  assert.match(appJs, /async function loadTradeCopyGroups\(forceRefresh = false\)/);
  assert.match(appJs, /renderAccountOverviewContent\(account, assignment, copyGroupsAvailable\)/);
  assert.match(appJs, /class="copy-overview-balance"[\s\S]*?class="copy-overview-status"[\s\S]*?class="copy-overview-assignment"/);
  assert.match(serverJs, /const activeAccounts = allAccounts\.filter\(account =>[\s\S]*?account\.status === 'ACTIVE'/);
  assert.match(serverJs, /const dllLockedAccounts = allAccounts\.filter\(account =>[\s\S]*?account\.lockReason === 'DLL'/);
  assert.match(serverJs, /dllLockedAccountCount: dllLockedAccounts\.length/);
  assert.match(appJs, /\['DLL-locked accounts', Number\(metrics\.dllLockedAccountCount \|\| 0\)/);
  assert.match(appJs, /account\?\.lock_reason === 'DLL'/);
  assert.match(appJs, /account\?\.lock_reason === 'MLL'/);
});

test('payout UI shows the 90/10 split, admin trade review, and account freeze controls', () => {
  assert.match(appHtml, /You receive \(90%\)/);
  assert.match(appHtml, /Admin share \(10%\)/);
  assert.match(appJs, /data\.admin_share/);
  assert.match(appJs, /renderAdminTradeTable/);
  assert.match(appJs, /\/api\/admin\/accounts\/action/);
  assert.match(appJs, /withdrawalPending/);
  assert.match(appHtml, /admin-account-list/);
  assert.match(appHtml, /Gross \/ user net \/ admin share/);
});

test('admin UI reports non-JSON API responses with a server deployment hint', () => {
  assert.match(appJs, /readAdminApiResponse/);
  assert.match(appJs, /HTML page instead of API JSON/);
  assert.match(appJs, /Restart\/deploy the latest server code/);
});

test('trade actions reuse the signed wallet session and do not show modal success notifications', () => {
  assert.match(appJs, /walletFetch\('\/api\/trades\/execute'/);
  assert.match(appJs, /walletFetch\('\/api\/trades\/close'/);
  assert.doesNotMatch(appJs, /alert\(`Order executed at/);
  assert.doesNotMatch(appJs, /alert\(`Position closed/);
  assert.ok(serverJs.includes("app.post('/api/trades/execute', sensitiveLimiter, requireWalletSession"));
  assert.ok(serverJs.includes("app.post('/api/trades/close', sensitiveLimiter, requireWalletSession"));
});

test('Forex order execution can resolve quote-to-USD conversion outside the metrics function', () => {
  const helperStart = appJs.indexOf('function getClientForexQuoteToUsdRate(');
  const metricsStart = appJs.indexOf('function calculateMetrics() {');
  const executeStart = appJs.indexOf('async function executeTrade(side) {');
  const executeEnd = appJs.indexOf('async function closeTrade(', executeStart);
  assert.ok(helperStart >= 0 && helperStart < metricsStart);
  assert.match(appJs.slice(executeStart, executeEnd), /getClientForexQuoteToUsdRate\(selectedMarket\.quote_currency\)/);

  const helper = appJs.slice(helperStart, metricsStart);
  const getRate = new vm.Script(`${helper}\ngetClientForexQuoteToUsdRate`).runInNewContext({
    marketQuotesBySymbol: new Map([['FX:USDJPY', { price: 150 }]])
  });
  assert.equal(getRate('USD'), 1);
  assert.equal(getRate('JPY'), 1 / 150);
});

test('Forex leverage scales exposure and checks required margin, not notional', () => {
  assert.match(appJs, /sizeLabel\.textContent = isForex \? 'Base position size \(lots at 1x\)'/);
  assert.match(appJs, /const units = sizeInput \* leverage \* Number\(selectedMarket\.lot_units\)/);
  assert.match(appJs, /const forexLots = sizeInput \* leverage/);
  assert.match(appJs, /marginInput = notional \/ leverage/);
  assert.match(appJs, /const lotSize = isForex \? enteredSize \* leverage : null/);
  assert.match(appJs, /const sizeUsd = isForex \? marginUsed : enteredSize/);
  assert.match(appJs, /sizeUsd > activeAccount\.current_balance/);
  assert.match(serverJs, /if \(!isForex && requestedMargin > account\.current_balance\)/);
  assert.match(serverJs, /if \(margin > account\.current_balance\)/);
  assert.match(serverJs, /calculateForexMargin\(lotSize, executionPrice, leverage/);
});

test('browser application files contain no copied provider credentials', () => {
  assert.doesNotMatch(`${appHtml}\n${appJs}`, /alch_[A-Za-z0-9_-]+/);
});
