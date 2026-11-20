const express = require('express');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { ethers } = require('ethers');
const db = require('./database');
const defaultPlans = require('./config/plans.json');
const markets = require('./public/config/markets.json');
const forexMarkets = require('./public/config/forexMarkets.json');
const {
  USD_CONVERSION_SYMBOLS,
  calculateForexMargin,
  getQuoteToUsdRate,
  parseForexChartHistory,
  resolveForexStopTargetPrices
} = require('./forexRules');
const supportedMarkets = [...markets, ...forexMarkets];
const { CHAT_COOLDOWN_MS, moderateChatMessage } = require('./chatRules');
const {
  advanceRiskBaselines,
  calculateUnrealizedPnl,
  getActiveLock,
  getLiveRiskBalance,
  getMllFloor,
  getRiskBalance,
  getRiskBreach,
  getTradeMargin
} = require('./riskRules');
const { getProtectedPayoutBalance, getAvailableGrossWithdrawal, splitWithdrawal } = require('./payoutRules');
const { getTriggeredExitPrice, resolveStopTargetPrices } = require('./tradeRules');
const { isLimitOrderTriggered } = require('./limitOrderRules');
const { calculateTradePerformance } = require('./performanceRules');
const { MarketDataService } = require('./marketDataService');
const { createMarketDataProviders } = require('./marketDataProviders');
const { selectWeightedReward, validatePackRewardPool } = require('./battlePassRewards');
const { createBattlePassDiscountCertificates } = require('./battlePassCertificates');
const {
  SESSION_LIMIT_PER_IP,
  SESSION_IDLE_TIMEOUT_MS,
  hashSessionToken,
  createRateLimiter,
  registerWalletSession,
  getWalletSecurityStatus,
  markWalletSessionReauthenticated,
  clearWalletSecurityLock,
  cleanupExpiredWalletSessions
} = require('./ipSecurity');

const app = express();
const PORT = process.env.PORT || 4480;

const TREASURY_WALLET = '0x9c19edeba86b214db5b3d21da9416d5e5568365b';
const SOLANA_TREASURY_WALLET = 'A3AVrbzCYzqKEkBR7pDQGYgnAbmBF9qNMQDX84QpuRZx';
const SOLANA_TOKEN_ADDRESSES = {
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
};
const SOLANA_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const DISCLAIMER_VERSION = '2026-11-17-v2';
const MAINTENANCE_PAGE_IDS = ['home', 'trade', 'accounts', 'copytrading', 'leaderboard', 'blastrrpass', 'profile', 'plans', 'faq', 'docs'];

// --- SUPPORTED EVM CHAINS CONFIGURATION ---
const SUPPORTED_EVM_CHAINS = {
    1: {
        name: "Ethereum Mainnet",
        chainIdHex: "0x1",
        rpcUrl: process.env.ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com",
        tokens: {
            USDT: { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6 },
            USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 }
        }
    },
    8453: {
        name: "Base",
        chainIdHex: "0x2105",
        rpcUrl: process.env.BASE_RPC_URL || "https://mainnet.base.org",
        tokens: {
            USDT: { address: "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2", decimals: 6 },
            USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 }
        }
    },
    137: {
        name: "Polygon PoS",
        chainIdHex: "0x89",
        rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com",
        tokens: {
            USDT: { address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", decimals: 6 },
            USDC: { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 }
        }
    },
    43114: {
        name: "Avalanche C-Chain",
        chainIdHex: "0xa86a",
        rpcUrl: process.env.AVALANCHE_RPC_URL || "https://avalanche-c-chain-rpc.publicnode.com",
        tokens: {
            USDT: { address: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7", decimals: 6 },
            USDC: { address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 }
        }
    },
    56: {
        name: "BNB Smart Chain",
        chainIdHex: "0x38",
        rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org",
        tokens: {
            USDT: { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 }
        }
    },
    448000: {
        name: "NullNet Private EVM",
        chainIdHex: "0x6d600",
        rpcUrl: "https://rpc.lunul.org",
        tokens: {
            USDT: { address: "0x7ec3659A8225ED474D7c662126616aE08545C29b", decimals: 18 }
        }
    }
};

function isValidPayoutSelection(walletType, chainId, assetSymbol) {
    if (walletType === 'SOLANA') {
        return chainId === 101 && Boolean(SOLANA_TOKEN_ADDRESSES[assetSymbol]);
    }
    return walletType === 'EVM' &&
        chainId !== 101 &&
        Boolean(SUPPORTED_EVM_CHAINS[chainId]?.tokens?.[assetSymbol]);
}

// --- 1. PROXY TRUST CONFIGURATION ---
app.set('trust proxy', 'loopback');

app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. IP-BASED RATE LIMITER & BINANCE CACHE ---
const copyFlatteningWallets = new Set();
const inFlightTradeExecutions = new Map();
const tradeExecutionWaiters = new Map();
const inFlightAccountTradeRequests = new Set();

function trackTradeExecution(walletAddress, response) {
  inFlightTradeExecutions.set(walletAddress, (inFlightTradeExecutions.get(walletAddress) || 0) + 1);
  let completed = false;
  const release = () => {
    if (completed) return;
    completed = true;
    const remaining = Math.max(0, (inFlightTradeExecutions.get(walletAddress) || 1) - 1);
    if (remaining > 0) {
      inFlightTradeExecutions.set(walletAddress, remaining);
      return;
    }
    inFlightTradeExecutions.delete(walletAddress);
    const waiters = tradeExecutionWaiters.get(walletAddress) || [];
    tradeExecutionWaiters.delete(walletAddress);
    waiters.forEach(resolve => resolve());
  };
  response.once('finish', release);
  return release;
}

function waitForTradeExecutions(walletAddress, callback) {
  if (!inFlightTradeExecutions.has(walletAddress)) return callback();
  const waiters = tradeExecutionWaiters.get(walletAddress) || [];
  waiters.push(callback);
  tradeExecutionWaiters.set(walletAddress, waiters);
}

const sensitiveLimiter = createRateLimiter(30, 60000);
const challengeLimiter = createRateLimiter(10, 60000);
const walletSessionLimiter = createRateLimiter(10, 60000, req => `${req.ip || 'unknown'}:${req.walletAddress || 'unknown'}`);
const walletActionLimiter = createRateLimiter(30, 60000, req => req.walletAddress || 'unknown');
const chartLimiter = createRateLimiter(120, 60000, req => `${req.ip || 'unknown'}:${req.walletAddress || 'unknown'}`);
const publicActivityLimiter = createRateLimiter(60, 60000);

function initializeBattlePassPacks(callback = () => {}) {
  const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
  const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });
  const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
  const tiers = [
    { name: 'Paper', points: 100, xp: 500, rewardPoints: 100, discount: 91 },
    { name: 'Wood', points: 200, xp: 1000, rewardPoints: 200, discount: 92 },
    { name: 'Copper', points: 350, xp: 1500, rewardPoints: 300, discount: 93 },
    { name: 'Bronze', points: 550, xp: 2500, rewardPoints: 400, discount: 94 },
    { name: 'Iron', points: 800, xp: 3500, rewardPoints: 500, discount: 95 },
    { name: 'Steel', points: 1100, xp: 5000, rewardPoints: 650, discount: 96 },
    { name: 'Titanium', points: 1500, xp: 7000, rewardPoints: 800, discount: 97 },
    { name: 'Silver', points: 2000, xp: 10000, rewardPoints: 1000, discount: 97 },
    { name: 'Gold', points: 2600, xp: 15000, rewardPoints: 1500, discount: 98 }
  ];
  (async () => {
    const plans = await dbAll('SELECT id, name FROM plans WHERE active = 1 ORDER BY id');
    const accountOdds = 1;
    const pointsOdds = 56 - plans.length;
    if (pointsOdds <= 0) throw new Error('The active plan catalog is too large to seed balanced pack odds.');
    const accountRewards = [];
    for (const plan of plans) {
      const name = `Account reward: ${plan.name}`;
      await dbRun(
        `INSERT OR IGNORE INTO battlepass_rewards
         (name, description, reward_type, plan_id, quantity, active)
         VALUES (?, ?, 'ACCOUNT', ?, 1, 1)`,
        [name, `One ${plan.name} trading account, automatically allocated when this pack is opened.`, plan.id]
      );
      accountRewards.push(await dbGet('SELECT id FROM battlepass_rewards WHERE name = ?', [name]));
    }
    for (const tier of tiers) {
      const rewards = [
        {
          name: `${tier.discount}% account discount`,
          description: `${tier.discount}% off one account at checkout. The certificate is single-use and bound to the winning wallet.`,
          reward_type: 'DISCOUNT',
          discount_pct: tier.discount,
          xp_amount: 0,
          points_amount: 0,
          quantity: 1
        },
        {
          name: `${tier.name} XP bonus`,
          description: `Instantly add ${tier.xp.toLocaleString()} XP to your Battle Pass balance.`,
          reward_type: 'XP',
          discount_pct: null,
          xp_amount: tier.xp,
          points_amount: 0,
          quantity: 1
        },
        {
          name: `${tier.name} points bonus`,
          description: `Instantly add ${tier.rewardPoints.toLocaleString()} Battle Pass points to your balance.`,
          reward_type: 'POINTS',
          discount_pct: null,
          xp_amount: 0,
          points_amount: tier.rewardPoints,
          quantity: 1
        }
      ];
      for (const reward of rewards) {
        await dbRun(
          `INSERT OR IGNORE INTO battlepass_rewards
           (name, description, reward_type, discount_pct, xp_amount, points_amount, quantity, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            reward.name, reward.description, reward.reward_type, reward.discount_pct,
            reward.xp_amount, reward.points_amount, reward.quantity
          ]
        );
      }
      await dbRun(
        'INSERT OR IGNORE INTO battlepass_packs (name, points_cost, active) VALUES (?, ?, 1)',
        [tier.name, tier.points]
      );
      const pack = await dbGet('SELECT id FROM battlepass_packs WHERE name = ?', [tier.name]);
      const existingEntries = await dbGet('SELECT COUNT(*) AS count FROM battlepass_pack_rewards WHERE pack_id = ?', [pack.id]);
      if (Number(existingEntries?.count) > 0) continue;
      const discountReward = await dbGet('SELECT id FROM battlepass_rewards WHERE name = ?', [`${tier.discount}% account discount`]);
      const xpReward = await dbGet('SELECT id FROM battlepass_rewards WHERE name = ?', [`${tier.name} XP bonus`]);
      const pointsReward = await dbGet('SELECT id FROM battlepass_rewards WHERE name = ?', [`${tier.name} points bonus`]);
      for (const accountReward of accountRewards) {
        if (!accountReward) continue;
        await dbRun(
          'INSERT INTO battlepass_pack_rewards (pack_id, reward_id, odds, max_drops) VALUES (?, ?, ?, 0)',
          [pack.id, accountReward.id, accountOdds]
        );
      }
      await dbRun(
        'INSERT INTO battlepass_pack_rewards (pack_id, reward_id, odds, max_drops) VALUES (?, ?, 8, 100)',
        [pack.id, discountReward.id]
      );
      await dbRun(
        'INSERT INTO battlepass_pack_rewards (pack_id, reward_id, odds, max_drops) VALUES (?, ?, 36, 0)',
        [pack.id, xpReward.id]
      );
      await dbRun(
        'INSERT INTO battlepass_pack_rewards (pack_id, reward_id, odds, max_drops) VALUES (?, ?, ?, 0)',
        [pack.id, pointsReward.id, pointsOdds]
      );
    }
  })().then(() => callback(null)).catch(error => {
    console.error('Unable to initialize Battle Pass reward packs:', error.message);
    callback(error);
  });
}

function seedPlans() {
  db.run('UPDATE plans SET price_usdt = base_price_usdt', priceErr => {
    if (priceErr) console.error('Unable to reset plan prices to full price:', priceErr.message);
  });
  const initializeRewards = () => db.run(
    `INSERT OR IGNORE INTO battlepass_plan_rewards (plan_id, xp_reward, points_reward)
     SELECT id, 1000, 100 FROM plans WHERE active = 1`,
    rewardErr => {
      if (rewardErr) return console.error('Unable to initialize battle pass plan rewards:', rewardErr.message);
      syncBattlePassPlanTasks(taskErr => {
        if (taskErr) return console.error('Unable to initialize plan purchase tasks:', taskErr.message);
        initializeBattlePassPacks(packErr => {
          if (packErr) return;
          console.log(`Initialized missing plans and Battle Pass reward packs from config/plans.json.`);
        });
      }, true);
    }
  );
  const correctUntouchedWhaleAccounts = () => {
    const defaultWhalePlan = defaultPlans.find(plan => plan.name === 'Whale $250k');
    if (!defaultWhalePlan || defaultWhalePlan.simulated_capital !== 250000) {
      console.error('Unable to correct untouched Whale accounts because the configured capital is unexpected.');
      return initializeRewards();
    }
    db.get('SELECT id, simulated_capital FROM plans WHERE name = ? ORDER BY id LIMIT 1', [defaultWhalePlan.name], (lookupErr, whalePlan) => {
      if (lookupErr) {
        console.error('Unable to look up the Whale plan:', lookupErr.message);
        return;
      }
      if (!whalePlan || Number(whalePlan.simulated_capital) !== defaultWhalePlan.simulated_capital) {
        return initializeRewards();
      }
      db.run(
        `UPDATE accounts
         SET initial_balance = ?, current_balance = ?, current_equity = ?,
             high_water_mark = ?, daily_starting_balance = ?
         WHERE plan_id = ?
           AND status = 'ACTIVE' AND COALESCE(permanent_lock, 0) = 0
           AND lock_reason IS NULL AND COALESCE(admin_frozen, 0) = 0
           AND initial_balance = 250050 AND current_balance = 250050
           AND current_equity = 250050 AND high_water_mark = 250050
           AND daily_starting_balance = 250050
           AND NOT EXISTS (SELECT 1 FROM trades WHERE trades.account_id = accounts.id)
           AND NOT EXISTS (SELECT 1 FROM withdrawals WHERE withdrawals.account_id = accounts.id)`,
        [
          defaultWhalePlan.simulated_capital,
          defaultWhalePlan.simulated_capital,
          defaultWhalePlan.simulated_capital,
          defaultWhalePlan.simulated_capital,
          defaultWhalePlan.simulated_capital,
          whalePlan.id
        ],
        function(migrationErr) {
          if (migrationErr) return console.error('Unable to correct untouched Whale account balances:', migrationErr.message);
          if (this.changes) console.log(`Corrected ${this.changes} untouched Whale account balance(s) to $${defaultWhalePlan.simulated_capital}.`);
          initializeRewards();
        }
      );
    });
  };
  const finishPlanSeed = () => db.run(
    'UPDATE plan_seed_state SET seeded = 1 WHERE id = 1',
    seedErr => {
      if (seedErr) return console.error('Unable to mark the initial plan seed complete:', seedErr.message);
      correctUntouchedWhaleAccounts();
    }
  );
  const addMissingPlan = index => {
    if (index >= defaultPlans.length) return finishPlanSeed();
    const plan = defaultPlans[index];
    db.get('SELECT id FROM plans WHERE name = ? COLLATE NOCASE ORDER BY id LIMIT 1', [plan.name], (lookupErr, existing) => {
      if (lookupErr) return console.error('Unable to look up configured plan', lookupErr.message);
      if (existing) return addMissingPlan(index + 1);
      db.run(
        `INSERT INTO plans (name, base_price_usdt, price_usdt, simulated_capital, profit_target,
         max_drawdown_pct, daily_loss_pct, max_single_day_profit_pct, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          plan.name,
          plan.base_price_usdt,
          plan.price_usdt,
          plan.simulated_capital,
          plan.profit_target,
          plan.max_drawdown_pct,
          plan.daily_loss_pct,
          plan.max_single_day_profit_pct
        ],
        insertErr => {
          if (insertErr) return console.error(`Unable to seed plan ${plan.name}`, insertErr.message);
          addMissingPlan(index + 1);
        }
      );
    });
  };
  db.get('SELECT seeded FROM plan_seed_state WHERE id = 1', [], (stateErr, state) => {
    if (stateErr || !state) {
      console.error('Unable to load initial plan seed state:', stateErr?.message || 'Seed state is unavailable.');
      return;
    }
    if (Number(state.seeded) === 1) return correctUntouchedWhaleAccounts();
    addMissingPlan(0);
  });
}

setTimeout(seedPlans, 1000);

const tradeChallenges = new Map();
const WALLET_SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const LOGIN_IP_RETENTION_DAYS = 180;
setTimeout(cleanupExpiredLoginIpEvents, 5000);
setInterval(cleanupExpiredLoginIpEvents, 24 * 60 * 60 * 1000);
setTimeout(() => cleanupExpiredWalletSessions(db, err => {
  if (err) console.error('Unable to expire wallet sessions:', err.message);
}), 5000);
setInterval(() => cleanupExpiredWalletSessions(db, err => {
  if (err) console.error('Unable to expire wallet sessions:', err.message);
}), 60 * 1000);
const forexChartHistoryCache = new Map();
const marketPriceStreamClients = new Set();
const forexChartTimeframes = Object.freeze({
  '1m': { interval: '1m', range: '5d', barSeconds: 60 },
  '5m': { interval: '5m', range: '5d', barSeconds: 300 },
  '15m': { interval: '15m', range: '1mo', barSeconds: 900 },
  '1h': { interval: '1h', range: '1mo', barSeconds: 3600 },
  '4h': { interval: '1h', range: '3mo', barSeconds: 14400 },
  '1d': { interval: '1h', range: '1y', barSeconds: 86400 }
});
// Resolve retired symbols only for existing open trades; new orders use markets from markets.json.
const legacyTradeMarkets = new Map([
  ['BINANCE:BTCUSDT', { source: 'BINANCE_SPOT', pair: 'BTCUSDT' }],
  ['BINANCE:ETHUSDT', { source: 'BINANCE_SPOT', pair: 'ETHUSDT' }],
  ['BINANCE:SOLUSDT', { source: 'BINANCE_SPOT', pair: 'SOLUSDT' }],
  ['BINANCE:BTCUSDT.P', { source: 'BINANCE_PERP', pair: 'BTCUSDT' }],
  ['BINANCE:ETHUSDT.P', { source: 'BINANCE_PERP', pair: 'ETHUSDT' }],
  ['BINANCE:SOLUSDT.P', { source: 'BINANCE_PERP', pair: 'SOLUSDT' }],
  ['BYBIT:XAUUSDT.P', { source: 'BITGET_PERP', pair: 'XAUUSDT' }],
  ['BYBIT:XAGUSDT.P', { source: 'BITGET_PERP', pair: 'XAGUSDT' }],
  ['CAPITALCOM:US100', { source: 'BITGET_PERP', pair: 'NDX100USDT' }],
  ['TVC:USOIL', { source: 'SIMULATED', pair: 'CL', base: 72, amplitude: 0.8 }]
]);

const marketDataMarkets = [
  ...Array.from(legacyTradeMarkets, ([symbol, market]) => ({
    ...market,
    symbol,
    type: market.source === 'SIMULATED' ? 'CFD' : 'FUTURE'
  })),
  ...supportedMarkets
];
const marketDataService = new MarketDataService({
  markets: marketDataMarkets,
  providers: createMarketDataProviders(),
  onProviderError: ({ source, symbol, error }) => {
    console.warn(`Market data provider ${source}${symbol ? ` (${symbol})` : ''}:`, error.message);
  }
});

function broadcastMarketDataQuote(quote) {
  const message = `data: ${JSON.stringify(quote)}\n\n`;
  for (const client of marketPriceStreamClients) {
    if (client.res.destroyed || client.res.writableEnded) {
      clearInterval(client.heartbeat);
      marketPriceStreamClients.delete(client);
    } else if (client.filter(quote)) {
      client.res.write(message);
    }
  }
}

marketDataService.on('quote', broadcastMarketDataQuote);
marketDataService.start();

function getTradeMarket(symbol) {
  return supportedMarkets.find(item => item.symbol === symbol) || legacyTradeMarkets.get(symbol);
}

function getForexChartHistory(market, timeframe) {
  const config = forexChartTimeframes[timeframe];
  if (!config) return Promise.reject(new Error('Choose a supported Forex chart timeframe.'));
  const cacheKey = `${market.symbol}:${timeframe}`;
  const cached = forexChartHistoryCache.get(cacheKey);
  if (cached?.data && cached.expiresAt > Date.now()) return Promise.resolve(cached.data);
  if (cached?.promise) return cached.promise;

  const yahooSymbol = market.history_symbol || `${market.base_currency}${market.quote_currency}=X`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${config.range}&interval=${config.interval}`;
  const historyPromise = new Promise((resolve, reject) => {
    const request = https.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode !== 200) return reject(new Error(`Yahoo Finance returned HTTP ${response.statusCode}.`));
        try {
          const payload = JSON.parse(body);
          if (payload.chart?.error) {
            return reject(new Error(payload.chart.error.description || 'Yahoo Finance returned a chart error.'));
          }
          const history = parseForexChartHistory(payload, config.barSeconds);
          if (!market.history_symbol) return resolve(history);
          getAuthoritativeQuote(market, 72 * 60 * 60 * 1000).then(quote => {
            const latestClose = history.candles[history.candles.length - 1].close;
            const offset = quote.price - latestClose;
            const shiftPrice = value => value == null ? null : value + offset;
            resolve({
              candles: history.candles.map(candle => ({
                ...candle,
                open: shiftPrice(candle.open),
                high: shiftPrice(candle.high),
                low: shiftPrice(candle.low),
                close: shiftPrice(candle.close)
              })),
              stats: {
                ...history.stats,
                referencePrice: shiftPrice(history.stats.referencePrice),
                highPrice: shiftPrice(history.stats.highPrice),
                lowPrice: shiftPrice(history.stats.lowPrice)
              }
            });
          }).catch(reject);
        } catch (error) {
          reject(new Error(`Unable to parse Yahoo Finance Forex history: ${error.message}`));
        }
      });
    });
    request.on('timeout', () => request.destroy(new Error('Yahoo Finance chart request timed out.')));
    request.on('error', reject);
  });
  forexChartHistoryCache.set(cacheKey, { promise: historyPromise });
  historyPromise.then(data => {
    forexChartHistoryCache.set(cacheKey, { data, expiresAt: Date.now() + 60000 });
  }).catch(() => forexChartHistoryCache.delete(cacheKey));
  return historyPromise;
}

const FOREX_MAX_QUOTE_AGE_MS = 30000;
const CRYPTO_MAX_QUOTE_AGE_MS = 5000;

function getMarketQuoteMaxAgeMs(market) {
  return market?.asset_class === 'FOREX' ? FOREX_MAX_QUOTE_AGE_MS : CRYPTO_MAX_QUOTE_AGE_MS;
}

function getAuthoritativeQuote(market, maxAgeMs = getMarketQuoteMaxAgeMs(market)) {
  return Promise.resolve().then(() => marketDataService.getQuote(market.symbol, maxAgeMs));
}

function getAuthoritativePrice(market, maxAgeMs = getMarketQuoteMaxAgeMs(market)) {
  return getAuthoritativeQuote(market, maxAgeMs).then(quote => quote.price);
}

function getForexQuoteToUsdRate(market, pricesBySymbol) {
  if (market.asset_class !== 'FOREX') return 1;
  return getQuoteToUsdRate(market.quote_currency, pricesBySymbol);
}

function getLiveForexQuoteToUsdRate(market, maxAgeMs = getMarketQuoteMaxAgeMs(market)) {
  if (market.asset_class !== 'FOREX' || market.quote_currency === 'USD') return Promise.resolve(1);
  const symbol = USD_CONVERSION_SYMBOLS[market.quote_currency];
  const conversionMarket = getTradeMarket(symbol);
  if (!conversionMarket) return Promise.reject(new Error(`Forex conversion market is not configured for ${market.quote_currency}.`));
  return getAuthoritativePrice(conversionMarket, maxAgeMs)
    .then(price => getQuoteToUsdRate(market.quote_currency, new Map([[symbol, price]])));
}

function loadTradePrices(trades) {
  const requiredMarkets = new Map();
  for (const trade of trades) {
    const market = getTradeMarket(trade.symbol);
    if (!market) throw new Error(`Trade market is not configured: ${trade.symbol}`);
    requiredMarkets.set(market.symbol, market);
    if (market.asset_class === 'FOREX') {
      const conversionSymbol = USD_CONVERSION_SYMBOLS[market.quote_currency];
      if (conversionSymbol) {
        const conversionMarket = getTradeMarket(conversionSymbol);
        if (!conversionMarket) throw new Error(`Forex conversion market is not configured: ${conversionSymbol}`);
        requiredMarkets.set(conversionSymbol, conversionMarket);
      }
    }
  }
  return Promise.all([...requiredMarkets].map(async ([symbol, market]) => [symbol, await getAuthoritativePrice(market)]))
    .then(prices => new Map(prices));
}

function loadAccountWithLiveRisk(accountId, callback) {
  db.get(
    `SELECT a.*, p.name AS plan_name, p.profit_target, p.simulated_capital,
     p.max_drawdown_pct, p.daily_loss_pct,
     COALESCE((SELECT SUM(w.amount) FROM withdrawals w
       WHERE w.account_id = a.id AND w.status = 'PENDING'), 0) AS pending_withdrawal_amount
     FROM accounts a JOIN plans p ON a.plan_id = p.id WHERE a.id = ?`,
    [accountId],
    (accountErr, account) => {
      if (accountErr) return callback(accountErr);
      if (!account) return callback(new Error('Account not found.'));
      db.all(
        `SELECT * FROM trades WHERE account_id = ? AND status IN ('OPEN', 'PENDING')`,
        [accountId],
        (tradesErr, trades) => {
          if (tradesErr) return callback(tradesErr);
          const allTrades = trades || [];
          const openTrades = allTrades.filter(trade => trade.status === 'OPEN');
          const pendingOrders = allTrades.filter(trade => trade.status === 'PENDING');
          let pricesPromise;
          try {
            pricesPromise = loadTradePrices(allTrades);
          } catch (priceError) {
            return callback(priceError);
          }
          pricesPromise.then(pricesBySymbol => {
              const quoteRatesBySymbol = new Map();
              for (const trade of allTrades) {
                const market = getTradeMarket(trade.symbol);
                if (market.asset_class === 'FOREX') {
                  quoteRatesBySymbol.set(trade.symbol, getForexQuoteToUsdRate(market, pricesBySymbol));
                }
              }
              account.risk_balance = getLiveRiskBalance(account, allTrades, pricesBySymbol, quoteRatesBySymbol);
              account.open_trades = [...openTrades, ...pendingOrders].map(trade => {
                const currentPrice = pricesBySymbol.get(trade.symbol);
                const livePnl = trade.status === 'PENDING'
                  ? 0
                  : calculateUnrealizedPnl(trade, currentPrice, quoteRatesBySymbol.get(trade.symbol) ?? 1);
                return {
                  ...trade,
                  current_price: currentPrice,
                  live_pnl: livePnl
                };
              });
              callback(null, account);
            })
            .catch(callback);
        }
      );
    }
  );
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function decodeBase58(value) {
  if (typeof value !== 'string' || !value || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) return null;
  let decoded = 0n;
  for (const character of value) {
    const digit = BASE58_ALPHABET.indexOf(character);
    if (digit < 0) return null;
    decoded = decoded * 58n + BigInt(digit);
  }
  const bytes = [];
  while (decoded > 0n) {
    bytes.unshift(Number(decoded & 255n));
    decoded >>= 8n;
  }
  const leadingZeroes = value.match(/^1*/)[0].length;
  return Buffer.concat([Buffer.alloc(leadingZeroes), Buffer.from(bytes)]);
}

function getWalletType(wallet) {
  if (typeof wallet !== 'string') return null;
  if (ethers.isAddress(wallet)) return 'EVM';
  return decodeBase58(wallet)?.length === 32 ? 'SOLANA' : null;
}

function normalizeWalletAddress(wallet, walletType = getWalletType(wallet)) {
  if (walletType === 'EVM' && ethers.isAddress(wallet)) return wallet.toLowerCase();
  if (walletType === 'SOLANA' && decodeBase58(wallet)?.length === 32) return wallet;
  return null;
}

function verifyTradeSignature(wallet, walletType, message, signature) {
  if (walletType === 'EVM') return ethers.verifyMessage(message, signature).toLowerCase() === wallet;
  const publicKeyBytes = decodeBase58(wallet);
  const signatureBytes = Buffer.from(signature, 'base64');
  if (!publicKeyBytes || publicKeyBytes.length !== 32 || signatureBytes.length !== 64 ||
      signatureBytes.toString('base64') !== signature) return false;
  const publicKey = crypto.createPublicKey({
    key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), publicKeyBytes]),
    format: 'der',
    type: 'spki'
  });
  return crypto.verify(null, Buffer.from(message, 'utf8'), publicKey, signatureBytes);
}

function requireTradeSignature(req, res, next) {
  const { wallet_address: wallet, signature, challenge } = req.body;
  const walletType = req.body?.wallet_type || getWalletType(wallet);
  const normalizedWallet = normalizeWalletAddress(wallet, walletType);
  if (!normalizedWallet || typeof signature !== 'string' || typeof challenge !== 'string') {
    return res.status(401).json({ error: 'A signed wallet challenge is required.' });
  }

  const stored = tradeChallenges.get(challenge);
  tradeChallenges.delete(challenge);
  if (!stored || stored.walletAddress !== normalizedWallet || stored.walletType !== walletType || stored.expiresAt <= Date.now()) {
    return res.status(401).json({ error: 'Wallet challenge expired or already used.' });
  }

  try {
    if (!verifyTradeSignature(normalizedWallet, walletType, stored.message, signature)) {
      return res.status(401).json({ error: 'Wallet signature does not match.' });
    }
  } catch {
    return res.status(401).json({ error: 'Wallet signature is invalid.' });
  }
  req.walletAddress = normalizedWallet;
  req.walletType = walletType;
  guardSupportStaffAccess(normalizedWallet, req, res, next);
}

const SUPPORT_STAFF_ALLOWED_ROUTES = new Set([
  'POST /api/auth/wallet-session',
  'POST /api/auth/wallet-session/reauthorize',
  'GET /api/auth/role',
  'GET /api/user/security-status',
  'GET /api/user/disclaimer-consent',
  'POST /api/user/disclaimer-consent',
  'GET /api/staff/tickets',
  'POST /api/staff/tickets/action',
  'GET /api/staff/reviews',
  'POST /api/staff/reviews/action'
]);

function guardSupportStaffAccess(wallet, req, res, next) {
  const walletPredicate = getWalletType(wallet) === 'SOLANA'
    ? 's.wallet_address = ?'
    : 'LOWER(s.wallet_address) = LOWER(?)';
  db.get(
    `SELECT 1 FROM support_staff s
     WHERE ${walletPredicate} AND s.active = 1
       AND NOT EXISTS (SELECT 1 FROM admins a WHERE LOWER(a.wallet_address) = LOWER(s.wallet_address))`,
    [wallet],
    (err, staff) => {
      if (err) return res.status(500).json({ error: 'Unable to verify support staff access.' });
      if (staff && !SUPPORT_STAFF_ALLOWED_ROUTES.has(`${req.method} ${req.path}`)) {
        return res.status(403).json({ error: 'Support staff may only access support tickets and reviews.' });
      }
      next();
    }
  );
}

function requireWalletSession(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = /^Bearer ([a-f0-9]{64})$/.exec(authorization);
  if (!match) {
    return res.status(401).json({ error: 'A valid wallet session is required.' });
  }
  const tokenHash = hashSessionToken(match[1]);
  db.get(
    `SELECT wallet_address, ip_address, reauthenticated_at, last_seen_at FROM wallet_sessions
     WHERE token_hash = ? AND expires_at > ? AND last_seen_at > ? AND revoked_at IS NULL`,
    [tokenHash, Date.now(), Date.now() - SESSION_IDLE_TIMEOUT_MS],
    (err, session) => {
      if (err) return res.status(500).json({ error: 'Unable to verify wallet session.' });
      if (!session) return res.status(401).json({ error: 'A valid wallet session is required.' });
      const requestedWallet = req.body?.wallet_address || req.query.wallet;
      const sessionWalletType = getWalletType(session.wallet_address);
      if (requestedWallet && normalizeWalletAddress(requestedWallet) !==
          normalizeWalletAddress(session.wallet_address, sessionWalletType)) {
        return res.status(403).json({ error: 'Wallet session does not match the requested wallet.' });
      }
      db.run('UPDATE wallet_sessions SET last_seen_at = ? WHERE token_hash = ?', [Date.now(), tokenHash], touchErr => {
        if (touchErr) return res.status(500).json({ error: 'Unable to refresh wallet session.' });
        req.walletAddress = normalizeWalletAddress(session.wallet_address, sessionWalletType);
        req.walletType = sessionWalletType;
        req.walletSessionIp = session.ip_address;
        req.walletSessionTokenHash = tokenHash;
        req.walletSessionReauthenticatedAt = session.reauthenticated_at;
        req.walletSessionIdleMs = Math.max(0, Date.now() - Number(session.last_seen_at));
        guardSupportStaffAccess(req.walletAddress, req, res, next);
      });
    }
  );
}

function requireSupportStaff(req, res, next) {
  const walletPredicate = req.walletType === 'SOLANA'
    ? 'wallet_address = ?'
    : 'LOWER(wallet_address) = LOWER(?)';
  db.get(
    `SELECT role FROM support_staff
     WHERE ${walletPredicate} AND active = 1`,
    [req.walletAddress],
    (err, staff) => {
      if (err) return res.status(500).json({ error: 'Unable to verify support staff role.' });
      if (!staff || staff.role !== 'SUPPORT') {
        return res.status(403).json({ error: 'Support staff access required.' });
      }
      next();
    }
  );
}

function requireAdminSession(req, res, next) {
  const walletPredicate = req.walletType === 'SOLANA'
    ? 'wallet_address = ?'
    : 'LOWER(wallet_address) = LOWER(?)';
  db.get(
    `SELECT role FROM admins WHERE ${walletPredicate}`,
    [req.walletAddress],
    (err, admin) => {
      if (err) return res.status(500).json({ error: 'Unable to verify administrator role.' });
      if (!admin || !['SUPER_ADMIN', 'ADMIN'].includes(admin.role)) {
        return res.status(403).json({ error: 'Administrator access required.' });
      }
      req.adminWalletAddress = req.walletAddress;
      next();
    }
  );
}

function requireWalletNotSoftLocked(req, res, next) {
  getWalletSecurityStatus(db, req.walletAddress, req.walletSessionTokenHash, (err, status) => {
    if (err) return res.status(500).json({ error: 'Unable to verify wallet security status.' });
    if (!status.softLocked) return next();
    req.walletSecurityLock = status.lock;
    res.set('X-Wallet-Soft-Locked', 'true');
    if (status.reauthenticationRequired) res.set('X-Wallet-Reauthentication-Required', 'true');
    res.status(423).json({
      error: 'Trading and chart access are temporarily disabled for this wallet. Create a support ticket for review.',
      wallet_soft_locked: true,
      locked_at: status.lock.locked_at,
      reauthentication_required: status.reauthenticationRequired
    });
  });
}

function requireWalletNotSoftLockedForNewCopyActions(req, res, next) {
  if (req.body?.active !== true) return next();
  requireWalletNotSoftLocked(req, res, next);
}

function requireSameWalletReauthentication(req, res, next) {
  const sessionWallet = req.walletAddress;
  const sessionWalletType = req.walletType;
  requireTradeSignature(req, res, () => {
    const signedWallet = req.walletAddress;
    const signedWalletType = req.walletType;
    req.walletAddress = sessionWallet;
    req.walletType = sessionWalletType;
    if (signedWallet !== sessionWallet || signedWalletType !== sessionWalletType) {
      return res.status(403).json({ error: 'The signed wallet does not match this wallet session.' });
    }
    next();
  });
}

function requireUserNotSuspended(req, res, next) {
  const wallet = req.walletAddress || req.body?.wallet_address;
  if (!normalizeWalletAddress(wallet, req.walletType || getWalletType(wallet))) {
    return res.status(401).json({ error: 'A valid wallet session is required.' });
  }
  db.get(
    'SELECT admin_suspended, admin_suspend_reason FROM users WHERE LOWER(wallet_address) = LOWER(?)',
    [wallet],
    (err, user) => {
      if (err) return res.status(500).json({ error: 'Unable to verify user account access.' });
      if (Number(user?.admin_suspended) === 1) {
        return res.status(403).json({
          error: `This user account is suspended by an administrator${user.admin_suspend_reason ? `: ${user.admin_suspend_reason}` : '.'}`,
          user_suspended: true
        });
      }
      next();
    }
  );
}

function recordWalletLogin(wallet, ipAddress, callback) {
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return callback(beginErr);
      const rollback = err => db.run('ROLLBACK', () => callback(err));
      db.run(
        `DELETE FROM user_login_ip_events
         WHERE created_at < datetime('now', ?)`,
        [`-${LOGIN_IP_RETENTION_DAYS} days`],
        cleanupErr => {
          if (cleanupErr) return rollback(cleanupErr);
          db.get(
            `SELECT 1 FROM user_login_ip_events
             WHERE LOWER(wallet_address) = LOWER(?) AND ip_address = ? LIMIT 1`,
            [wallet, ipAddress],
            (lookupErr, previousLogin) => {
              if (lookupErr) return rollback(lookupErr);
              const isNewIp = previousLogin ? 0 : 1;
              db.get(
                `SELECT wallet_address FROM users WHERE LOWER(wallet_address) = LOWER(?) LIMIT 1`,
                [wallet],
                (identityErr, existingWallet) => {
                  if (identityErr) return rollback(identityErr);
                  if (existingWallet &&
                      normalizeWalletAddress(existingWallet.wallet_address) !== normalizeWalletAddress(wallet)) {
                    return rollback(Object.assign(
                      new Error('This Solana address conflicts with an existing wallet identity and cannot be registered.'),
                      { code: 'WALLET_IDENTITY_CONFLICT' }
                    ));
                  }
                  db.run(
                    'INSERT OR IGNORE INTO users (wallet_address) VALUES (?)',
                    [wallet],
                    userErr => {
                      if (userErr) return rollback(userErr);
                      db.run(
                        `INSERT INTO user_login_ip_events (wallet_address, ip_address, is_new_ip)
                         VALUES (?, ?, ?)`,
                        [wallet, ipAddress, isNewIp],
                        insertErr => {
                          if (insertErr) return rollback(insertErr);
                          db.run('COMMIT', commitErr => commitErr ? rollback(commitErr) : callback(null, { isNewIp }));
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
}

function cleanupExpiredLoginIpEvents() {
  db.run(
    `DELETE FROM user_login_ip_events WHERE created_at < datetime('now', ?)`,
    [`-${LOGIN_IP_RETENTION_DAYS} days`],
    err => {
      if (err) console.error('Unable to expire old login IP records:', err.message);
    }
  );
}

function lockAccount(accountId, breach, callback) {
  const status = breach.permanent ? 'PERMANENTLY_LOCKED' : 'LOCKED';
  const finish = lock => {
    if (!lock.permanent) return callback(null, lock);
    db.run(
      `UPDATE trade_copy_groups SET active = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id IN (
         SELECT group_id FROM trade_copy_group_members
         WHERE account_id = ? AND role = 'LEADER'
       )`,
      [accountId],
      deactivateErr => {
        if (deactivateErr) return callback(deactivateErr);
        db.run(
          'DELETE FROM trade_copy_group_members WHERE account_id = ?',
          [accountId],
          removeErr => removeErr ? callback(removeErr) : callback(null, lock)
        );
      }
    );
  };
  db.run(
    `UPDATE accounts SET status = ?, lock_reason = ?, locked_until = ?, permanent_lock = ?
     WHERE id = ? AND NOT (COALESCE(permanent_lock, 0) = 1 AND ? = 0)`,
    [status, breach.reason, breach.lockedUntil, breach.permanent ? 1 : 0, accountId, breach.permanent ? 1 : 0],
    function(updateErr) {
      if (updateErr) return callback(updateErr);
      if (this.changes > 0) return finish(breach);
      db.get(
        `SELECT lock_reason, locked_until, permanent_lock FROM accounts WHERE id = ?`,
        [accountId],
        (selectErr, row) => {
          if (selectErr) return callback(selectErr);
          if (!row) return callback(new Error('Account not found while applying risk lock.'));
          finish(getActiveLock(row) || breach);
        }
      );
    }
  );
}

function settleBreachWithinTransaction(account, breach, callback) {
  const openTrades = account.open_trades || [];
  const settleNext = (index) => {
    if (index >= openTrades.length) {
      return lockAccount(account.id, breach, (lockErr, appliedLock) => {
        if (lockErr) return callback(lockErr);
        account.status = appliedLock.permanent ? 'PERMANENTLY_LOCKED' : 'LOCKED';
        account.lock_reason = appliedLock.reason;
        account.locked_until = appliedLock.lockedUntil;
        account.permanent_lock = appliedLock.permanent ? 1 : 0;
        callback(null, appliedLock);
      });
    }

    const trade = openTrades[index];
    const isPending = trade.status === 'PENDING';
    if ((!isPending && (trade.current_price == null || !Number.isFinite(Number(trade.current_price)) ||
        Number(trade.current_price) <= 0)) || trade.live_pnl == null ||
        !Number.isFinite(Number(trade.live_pnl))) {
      return callback(new Error(`Cannot close breached account trade ${trade.id} without its live price.`));
    }
    const tradePnl = isPending ? 0 : Number(trade.live_pnl);
    const returnedMargin = getTradeMargin(trade) + tradePnl;
    db.run(
      `UPDATE trades SET status = 'CLOSED', pnl = ?, closed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = ?`,
      [tradePnl, trade.id, trade.status],
      function(updateErr) {
        if (updateErr) return callback(updateErr);
        if (this.changes === 0) return settleNext(index + 1);
        db.run(
          `UPDATE accounts
           SET current_balance = COALESCE(current_balance, 0) + ?,
               current_equity = COALESCE(current_equity, 0) + ?
           WHERE id = ?`,
          [returnedMargin, tradePnl, account.id],
          (balanceErr) => {
            if (balanceErr) return callback(balanceErr);
            settleNext(index + 1);
          }
        );
      }
    );
  };
  settleNext(0);
}

function applyRiskBreach(account, breach, callback) {
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', (beginErr) => {
      if (beginErr) return callback(beginErr);
      settleBreachWithinTransaction(account, breach, (settleErr) => {
        if (settleErr) return db.run('ROLLBACK', () => callback(settleErr));
        db.run('COMMIT', (commitErr) => {
          if (commitErr) return db.run('ROLLBACK', () => callback(commitErr));
          const appliedLock = account.lock_reason === 'MLL'
            ? { reason: 'MLL', permanent: true, lockedUntil: null }
            : breach;
          closeOutstandingCopyTrades(account.wallet_address, (copyErr, copyResults) => {
            if (copyErr) console.error('Unable to close copied positions after a risk lock:', copyErr.message);
            else {
              const failures = copyResults.filter(result => !result.success);
              if (failures.length) console.error('Some copied positions remained open after a leader risk lock:', failures);
            }
            callback(null, appliedLock);
          });
        });
      });
    });
  });
}

function refreshRiskBaselines(accountId, callback) {
  const today = new Date().toISOString().slice(0, 10);
  const selectAccount = (done) => loadAccountWithLiveRisk(accountId, done);
  selectAccount((initialErr, initialAccount) => {
    if (initialErr) return callback(initialErr);
    if (!initialAccount) return callback(new Error('Account not found.'));
    if (initialAccount.risk_day === today) return callback(null, initialAccount);

    db.serialize(() => {
      db.run('BEGIN IMMEDIATE', (beginErr) => {
        if (beginErr) return callback(beginErr);
        const rollback = (err) => db.run('ROLLBACK', () => callback(err));
        selectAccount((accountErr, account) => {
          if (accountErr) return rollback(accountErr);
          if (!account) return rollback(new Error('Account not found.'));
          if (account.risk_day === today) {
            return db.run('COMMIT', (commitErr) => commitErr ? callback(commitErr) : callback(null, account));
          }

          const baselines = advanceRiskBaselines(account, account, today);
          const updateAccount = () => db.run(
            `UPDATE accounts SET risk_day = ?, daily_starting_balance = ?, high_water_mark = ?
             WHERE id = ?`,
            [baselines.risk_day, baselines.daily_starting_balance, baselines.high_water_mark, accountId],
            function(updateErr) {
              if (updateErr) return rollback(updateErr);
              Object.assign(account, baselines);
              const breach = getRiskBreach(account, account);
              const commit = () => db.run('COMMIT', (commitErr) => {
                if (commitErr) return callback(commitErr);
                if (!breach) return callback(null, account);
                closeOutstandingCopyTrades(account.wallet_address, (copyErr, copyResults) => {
                  if (copyErr) console.error('Unable to close copied positions after risk rollover:', copyErr.message);
                  else {
                    const failures = copyResults.filter(result => !result.success);
                    if (failures.length) console.error('Some copied positions remained open after risk rollover:', failures);
                  }
                  callback(null, account);
                });
              });
              if (!breach) return commit();
              settleBreachWithinTransaction(account, breach, (lockErr) => {
                if (lockErr) return rollback(lockErr);
                commit();
              });
            }
          );

          if (!account.risk_day) return updateAccount();
          db.run(
            `INSERT OR REPLACE INTO daily_account_summaries
             (account_id, day, opening_balance, closing_balance, profit)
             VALUES (?, ?, ?, ?, ?)`,
            [
              accountId,
              account.risk_day,
              account.daily_starting_balance,
              getRiskBalance(account),
              getRiskBalance(account) - account.daily_starting_balance
            ],
            (summaryErr) => {
              if (summaryErr) return rollback(summaryErr);
              updateAccount();
            }
          );
        });
      });
    });
  });
}

let riskRolloverInProgress = false;
function rolloverAccountsAtUtcDay() {
  if (riskRolloverInProgress) return;
  riskRolloverInProgress = true;
  const today = new Date().toISOString().slice(0, 10);
  db.all(
    'SELECT id FROM accounts WHERE risk_day IS NULL OR risk_day < ? ORDER BY id',
    [today],
    (err, accounts) => {
      if (err) {
        riskRolloverInProgress = false;
        return console.error('Unable to find accounts for daily risk rollover:', err.message);
      }
      const processNext = (index) => {
        if (index >= accounts.length) {
          riskRolloverInProgress = false;
          return;
        }
        refreshRiskBaselines(accounts[index].id, (rolloverErr) => {
          if (rolloverErr) console.error(`Unable to roll risk baselines for account ${accounts[index].id}:`, rolloverErr.message);
          processNext(index + 1);
        });
      };
      processNext(0);
    }
  );
}

setTimeout(rolloverAccountsAtUtcDay, 5000);
setInterval(rolloverAccountsAtUtcDay, 60 * 1000);

let liveRiskCheckInProgress = false;
function checkLiveRiskLimits() {
  if (liveRiskCheckInProgress) return;
  liveRiskCheckInProgress = true;
  db.all(
    `SELECT DISTINCT a.id FROM accounts a
     JOIN trades t ON t.account_id = a.id AND t.status = 'OPEN'
     WHERE (a.status = 'ACTIVE' AND a.permanent_lock = 0)
        OR a.lock_reason IN ('DLL', 'MLL')
     ORDER BY a.id`,
    [],
    (err, accounts) => {
      if (err) {
        liveRiskCheckInProgress = false;
        return console.error('Unable to find accounts with open trades for live risk checks:', err.message);
      }
      const processNext = (index) => {
        if (index >= accounts.length) {
          liveRiskCheckInProgress = false;
          return;
        }
        const accountId = accounts[index].id;
        refreshRiskBaselines(accountId, (baselineErr, account) => {
          if (baselineErr) {
            console.error(`Unable to calculate live risk for account ${accountId}:`, baselineErr.message);
            return processNext(index + 1);
          }
          refreshAccountLock(account, (lockErr) => {
            if (lockErr) console.error(`Unable to apply live risk lock for account ${accountId}:`, lockErr.message);
            processNext(index + 1);
          });
        });
      };
      processNext(0);
    }
  );
}

setTimeout(checkLiveRiskLimits, 2000);
setInterval(checkLiveRiskLimits, 5000);

let pendingLimitOrdersCheckInProgress = false;
function settlePendingLimitOrder(tradeId, marketPrice, quoteToUsdRate, callback) {
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return callback(beginErr);
      const rollback = error => db.run('ROLLBACK', () => callback(error));
      db.get(
        `SELECT t.*, a.wallet_address, a.current_balance, a.status AS account_status,
         a.admin_frozen,
         COALESCE((SELECT SUM(w.amount) FROM withdrawals w
           WHERE w.account_id = a.id AND w.status = 'PENDING'), 0) AS pending_withdrawal_amount,
         COALESCE((SELECT u.admin_suspended FROM users u
           WHERE LOWER(u.wallet_address) = LOWER(a.wallet_address)), 0) AS admin_suspended
         FROM trades t JOIN accounts a ON a.id = t.account_id
         WHERE t.id = ? AND t.status = 'PENDING'`,
        [tradeId],
        (lookupErr, trade) => {
          if (lookupErr) return rollback(lookupErr);
          if (!trade) return db.run('COMMIT', callback);

          let reservedMargin;
          try {
            reservedMargin = getTradeMargin(trade);
          } catch (marginError) {
            return rollback(marginError);
          }
          const cancel = reason => {
            console.warn(`Canceling pending limit order ${trade.id}: ${reason}`);
            db.run(
              `UPDATE trades SET status = 'CLOSED', pnl = 0, closed_at = CURRENT_TIMESTAMP
               WHERE id = ? AND status = 'PENDING'`,
              [trade.id],
              function(cancelErr) {
                if (cancelErr) return rollback(cancelErr);
                if (this.changes !== 1) return db.run('COMMIT', callback);
                db.run(
                  `UPDATE accounts SET current_balance = COALESCE(current_balance, 0) + ?
                   WHERE id = ?`,
                  [reservedMargin, trade.account_id],
                  refundErr => {
                    if (refundErr) return rollback(refundErr);
                    db.run('COMMIT', callback);
                  }
                );
              }
            );
          };

          const market = getTradeMarket(trade.symbol);
          if (!market || market.enabled === false) return cancel('market is unavailable');
          if (!isLimitOrderTriggered(trade.side, trade.trigger_price, marketPrice)) {
            return db.run('COMMIT', callback);
          }
          if (trade.account_status !== 'ACTIVE' || Number(trade.admin_frozen) === 1 ||
              Number(trade.pending_withdrawal_amount) > 0 || Number(trade.admin_suspended) === 1) {
            return cancel('the account is not eligible to open new positions');
          }

          const executionPrice = Number(marketPrice);
          const leverage = Number(trade.leverage) || 1;
          let margin = reservedMargin;
          let units = Number(trade.units);
          try {
            if (market.asset_class === 'FOREX') {
              const forexSize = calculateForexMargin(
                Number(trade.lot_size),
                executionPrice,
                leverage,
                quoteToUsdRate,
                market.lot_units
              );
              margin = forexSize.marginUsd;
              units = forexSize.units;
            }
            resolveStopTargetPrices({
              executionPrice,
              units,
              side: trade.side,
              mode: 'price',
              sl: trade.sl,
              tp: trade.tp
            });
          } catch (fillError) {
            return cancel(`the market price moved past the order's protective levels (${fillError.message})`);
          }
          if (!Number.isFinite(margin) || margin <= 0 ||
              !Number.isFinite(units) || units <= 0) {
            return cancel('the filled position size is invalid');
          }

          const marginDelta = margin - reservedMargin;
          db.run(
            `UPDATE accounts SET current_balance = current_balance - ?
             WHERE id = ? AND current_balance >= ? AND status = 'ACTIVE' AND admin_frozen = 0
               AND NOT EXISTS (SELECT 1 FROM withdrawals WHERE account_id = ? AND status = 'PENDING')
               AND NOT EXISTS (SELECT 1 FROM users u WHERE LOWER(u.wallet_address) = LOWER(accounts.wallet_address)
                               AND COALESCE(u.admin_suspended, 0) = 1)`,
            [marginDelta, trade.account_id, Math.max(0, marginDelta), trade.account_id],
            function(balanceErr) {
              if (balanceErr) return rollback(balanceErr);
              if (this.changes !== 1) return cancel('the account cannot cover the required margin at the trigger price');
              db.run(
                `UPDATE trades SET status = 'OPEN', entry_price = ?, size_usd = ?, units = ?
                 WHERE id = ? AND status = 'PENDING'`,
                [executionPrice, margin, units, trade.id],
                function(fillErr) {
                  if (fillErr) return rollback(fillErr);
                  if (this.changes !== 1) return rollback(new Error('Pending order changed before activation.'));
                  db.run('COMMIT', callback);
                }
              );
            }
          );
        }
      );
    });
  });
}

function checkPendingLimitOrders() {
  if (pendingLimitOrdersCheckInProgress) return;
  pendingLimitOrdersCheckInProgress = true;
  db.all(
    `SELECT id, symbol, side, trigger_price FROM trades
     WHERE status = 'PENDING' AND order_type = 'LIMIT'
     ORDER BY created_at, id`,
    [],
    (err, orders) => {
      if (err) {
        pendingLimitOrdersCheckInProgress = false;
        return console.error('Unable to load pending limit orders:', err.message);
      }
      const marketsBySymbol = new Map();
      for (const order of orders || []) {
        const market = getTradeMarket(order.symbol);
        if (market) marketsBySymbol.set(order.symbol, market);
      }
      Promise.all([...marketsBySymbol].map(async ([symbol, market]) => {
        try {
          const maxQuoteAgeMs = getMarketQuoteMaxAgeMs(market);
          return [symbol, await getAuthoritativePrice(market, maxQuoteAgeMs)];
        } catch (priceError) {
          console.warn(`Unable to check pending ${symbol} limit orders:`, priceError.message);
          return [symbol, null];
        }
      })).then(async priceEntries => {
        const pricesBySymbol = new Map(priceEntries);
        for (const order of orders || []) {
          const market = marketsBySymbol.get(order.symbol);
          const marketPrice = pricesBySymbol.get(order.symbol);
          if (!market || !Number.isFinite(marketPrice) ||
              !isLimitOrderTriggered(order.side, order.trigger_price, marketPrice)) continue;
          try {
            const quoteToUsdRate = await getLiveForexQuoteToUsdRate(
              market,
              market.asset_class === 'FOREX' ? 30000 : 72 * 60 * 60 * 1000
            );
            await new Promise((resolve, reject) => {
              settlePendingLimitOrder(order.id, marketPrice, quoteToUsdRate, error => error ? reject(error) : resolve());
            });
          } catch (activationError) {
            console.error(`Unable to activate pending limit order ${order.id}:`, activationError.message);
          }
        }
      }).catch(processingError => {
        console.error('Unable to process pending limit orders:', processingError.message);
      }).finally(() => {
        pendingLimitOrdersCheckInProgress = false;
      });
    }
  );
}

setTimeout(checkPendingLimitOrders, 2000);
setInterval(checkPendingLimitOrders, 1000);

let dllUnlockSweepInProgress = false;
function unlockExpiredDllAccounts() {
  if (dllUnlockSweepInProgress) return;
  dllUnlockSweepInProgress = true;
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  db.all(
    `SELECT id FROM accounts
     WHERE lock_reason = 'DLL' AND permanent_lock = 0
       AND (locked_until <= ? OR risk_day < ? OR risk_day IS NULL)
     ORDER BY id`,
    [now, today],
    (err, accounts) => {
      if (err) {
        dllUnlockSweepInProgress = false;
        return console.error('Unable to find expired DLL account locks:', err.message);
      }
      const processNext = (index) => {
        if (index >= accounts.length) {
          dllUnlockSweepInProgress = false;
          return;
        }
        const accountId = accounts[index].id;
        refreshRiskBaselines(accountId, (baselineErr, account) => {
          if (baselineErr) {
            console.error(`Unable to refresh expired DLL account ${accountId}:`, baselineErr.message);
            return processNext(index + 1);
          }
          unlockExpiredAccount(account, (unlockErr, activeLock) => {
            if (unlockErr) console.error(`Unable to unlock expired DLL account ${accountId}:`, unlockErr.message);
            if (activeLock) {
              if (account.open_trades?.length) {
                return applyRiskBreach(account, activeLock, (closeErr) => {
                  if (closeErr) console.error(`Unable to close trades for locked account ${accountId}:`, closeErr.message);
                  processNext(index + 1);
                });
              }
              return processNext(index + 1);
            }
            refreshAccountLock(account, (riskErr) => {
              if (riskErr) console.error(`Unable to recheck account ${accountId} after DLL unlock:`, riskErr.message);
              processNext(index + 1);
            });
          });
        });
      };
      processNext(0);
    }
  );
}

setTimeout(unlockExpiredDllAccounts, 2000);
setInterval(unlockExpiredDllAccounts, 5000);

function unlockExpiredAccount(account, callback) {
  const lock = getActiveLock(account);
  if (lock) return callback(null, lock);
  if (account.lock_reason === 'DLL') {
    return db.run(
      `UPDATE accounts SET status = 'ACTIVE', daily_starting_balance = ?,
       lock_reason = NULL, locked_until = NULL
       WHERE id = ? AND permanent_lock = 0`,
      [getRiskBalance(account), account.id],
      (err) => {
        if (!err) {
          account.status = 'ACTIVE';
          account.daily_starting_balance = getRiskBalance(account);
          account.lock_reason = null;
          account.locked_until = null;
        }
        callback(err, null);
      }
    );
  }
  callback(null, null);
}

function refreshAccountLock(account, callback) {
  unlockExpiredAccount(account, (unlockErr, activeLock) => {
    if (unlockErr) return callback(unlockErr);
    if (activeLock) {
      if (!account.open_trades?.length) return callback(null, activeLock);
      return applyRiskBreach(account, activeLock, callback);
    }
    const breach = getRiskBreach(account, account);
    if (!breach) return callback(null, null);
    applyRiskBreach(account, breach, callback);
  });
}

function requireAdminWallet(req, res, next) {
  const wallet = req.walletAddress;
  if (!normalizeWalletAddress(wallet, req.walletType)) {
    return res.status(401).json({ error: 'A signed administrator wallet is required.' });
  }
  const walletPredicate = req.walletType === 'SOLANA'
    ? 'wallet_address = ?'
    : 'LOWER(wallet_address) = LOWER(?)';
  db.get(
    `SELECT role FROM admins WHERE ${walletPredicate}`,
    [wallet],
    (err, admin) => {
      if (err) return res.status(500).json({ error: 'Unable to verify administrator role.' });
      if (!admin || !['SUPER_ADMIN', 'ADMIN'].includes(admin.role)) {
        return res.status(403).json({ error: 'Administrator access required.' });
      }
      next();
    }
  );
}

function loadAdminUserSecurity(wallet, callback) {
  db.get(
    `SELECT wallet_address, username, admin_suspended, admin_suspend_reason,
            admin_suspended_by, admin_suspended_at
     FROM users WHERE LOWER(wallet_address) = LOWER(?)`,
    [wallet],
    (userErr, user) => {
      if (userErr) return callback(userErr);
      if (!user) return callback(new Error('User not found.'));
      db.all(
        `SELECT ip_address, is_new_ip, created_at
         FROM user_login_ip_events
         WHERE LOWER(wallet_address) = LOWER(?) AND created_at >= datetime('now', '-180 days')
         ORDER BY created_at DESC LIMIT 20`,
        [wallet],
        (loginErr, loginIps) => {
          if (loginErr) return callback(loginErr);
          db.all(
            `SELECT admin_wallet, action, reason, created_at
             FROM user_admin_actions WHERE LOWER(wallet_address) = LOWER(?)
             ORDER BY created_at DESC LIMIT 20`,
            [wallet],
            (actionErr, adminActions) => {
              if (actionErr) return callback(actionErr);
              callback(null, { user, login_ips: loginIps || [], admin_actions: adminActions || [] });
            }
          );
        }
      );
    }
  );
}

let battlePassPlanTasksReady = false;
function syncBattlePassPlanTasks(callback, force = false) {
  if (force) battlePassPlanTasksReady = false;
  if (battlePassPlanTasksReady) return callback(null);
  db.run(
    `INSERT INTO battlepass_tasks
     (title, description, task_type, cadence, plan_id, xp_reward, points_reward, active, is_builtin)
     SELECT 'Buy ' || p.name,
            'Complete a verified paid purchase of this plan. Claim a reward for each account bought.',
            'PURCHASE_PLAN', 'ONCE', p.id, 500, 50, 1, 1
     FROM plans p
     WHERE NOT EXISTS (
       SELECT 1 FROM battlepass_tasks t
       WHERE t.task_type = 'PURCHASE_PLAN' AND t.plan_id = p.id
     )`,
    insertErr => {
      if (insertErr) return callback(insertErr);
      db.run(
        `UPDATE battlepass_tasks
         SET title = 'Buy ' || (SELECT p.name FROM plans p WHERE p.id = battlepass_tasks.plan_id),
             description = 'Complete a verified paid purchase of this plan. Claim a reward for each account bought.'
         WHERE task_type = 'PURCHASE_PLAN' AND plan_id IS NOT NULL
           AND EXISTS (SELECT 1 FROM plans p WHERE p.id = battlepass_tasks.plan_id)`,
        updateErr => {
          if (!updateErr) battlePassPlanTasksReady = true;
          callback(updateErr);
        }
      );
    }
  );
}

function getBattlePassLevel(xp) {
  return Math.min(12, Math.floor(Math.max(0, Number(xp) || 0) / 10000));
}

function getBattlePassPeriodKey(cadence, date = new Date()) {
  if (cadence === 'ONCE') return 'ONCE';
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  if (cadence === 'DAILY') return `${year}-${month}-${day}`;
  if (cadence === 'MONTHLY') return `${year}-${month}`;
  const monday = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(monday.getUTCDate()).padStart(2, '0')}`;
}

function getBattlePassPeriodEnd(cadence, periodKey) {
  const [year, month, day] = periodKey.split('-').map(Number);
  const end = cadence === 'MONTHLY'
    ? new Date(Date.UTC(year, month, 1))
    : new Date(Date.UTC(year, month - 1, day + (cadence === 'WEEKLY' ? 7 : 1)));
  return end.toISOString().slice(0, 10);
}

function getBattlePassTaskPeriod(task, date = new Date()) {
  const claimPeriodKey = getBattlePassPeriodKey(task.cadence, date);
  if (task.task_type !== 'GREEN_DAY' && task.task_type !== 'GREEN_WEEK') {
    return { claimPeriodKey, activityPeriodKey: claimPeriodKey };
  }
  const activityStart = new Date(`${claimPeriodKey}T00:00:00.000Z`);
  activityStart.setUTCDate(activityStart.getUTCDate() - (task.task_type === 'GREEN_DAY' ? 1 : 7));
  const activityPeriodKey = activityStart.toISOString().slice(0, 10);
  return { claimPeriodKey, activityPeriodKey };
}

function getBattlePassPurchaseUnitQuery(task) {
  const planFilter = task.task_type === 'PURCHASE_PLAN' ? 'AND a.plan_id = ?' : '';
  return {
    sql: `WITH RECURSIVE purchase_units(tx_hash, unit_index, quantity, created_at) AS (
            SELECT p.tx_hash, 1, p.quantity, p.created_at
            FROM purchases p
            JOIN accounts a ON a.id = p.account_id AND a.wallet_address = p.wallet_address
            WHERE p.wallet_address = ?
              AND p.chain_id > 0 AND p.amount_usdt > 0
              AND p.created_at >= ?
              ${planFilter}
            UNION ALL
            SELECT tx_hash, unit_index + 1, quantity, created_at
            FROM purchase_units
            WHERE unit_index < quantity
          )`,
    params: task.task_type === 'PURCHASE_PLAN'
      ? [task.wallet_address, task.created_at, Number(task.plan_id)]
      : [task.wallet_address, task.created_at]
  };
}

function getBattlePassPurchaseTaskProgress(task, wallet, callback) {
  const purchaseQuery = getBattlePassPurchaseUnitQuery({ ...task, wallet_address: wallet });
  db.get(
    `${purchaseQuery.sql}
     SELECT COUNT(*) AS purchase_count,
            COALESCE(SUM(CASE WHEN c.id IS NULL THEN 1 ELSE 0 END), 0) AS eligible_count
     FROM purchase_units u
     LEFT JOIN battlepass_task_claims c
       ON c.task_id = ? AND c.wallet_address = ?
        AND c.cadence = 'ONCE'
        AND c.period_key = u.tx_hash || ':' || u.unit_index`,
    [...purchaseQuery.params, task.id, wallet],
    (err, row) => {
      if (err) return callback(new Error('Unable to verify purchase activity for this task.'));
      const purchaseCount = Number(row?.purchase_count || 0);
      const eligibleCount = Number(row?.eligible_count || 0);
      task.purchase_count = purchaseCount;
      task.eligible_purchase_count = eligibleCount;
      task.progress = purchaseCount - eligibleCount;
      task.progress_target = purchaseCount;
      task.claimed = purchaseCount > 0 && eligibleCount === 0;
      callback(null, eligibleCount > 0);
    }
  );
}

function getBattlePassPurchaseTaskReferences(task, wallet, callback) {
  const purchaseQuery = getBattlePassPurchaseUnitQuery({ ...task, wallet_address: wallet });
  db.all(
    `${purchaseQuery.sql}
     SELECT u.tx_hash || ':' || u.unit_index AS reference_id
     FROM purchase_units u
     WHERE NOT EXISTS (
       SELECT 1 FROM battlepass_task_claims c
       WHERE c.task_id = ? AND c.wallet_address = ?
         AND c.cadence = 'ONCE'
         AND c.period_key = u.tx_hash || ':' || u.unit_index
     )
     ORDER BY u.created_at, u.tx_hash, u.unit_index
     LIMIT 100`,
    [...purchaseQuery.params, task.id, wallet],
    callback
  );
}

function getBattlePassTaskEligibility(task, wallet, periodKey, callback) {
  if (task.task_type === 'SOCIAL_CLICK') return callback(null, true);
  if (task.task_type === 'PURCHASE_ANY' || task.task_type === 'PURCHASE_PLAN') {
    if (task.cadence !== 'ONCE' || (task.task_type === 'PURCHASE_PLAN' && !Number(task.plan_id))) {
      return callback(new Error('This purchase task has an invalid completion schedule.'));
    }
    return getBattlePassPurchaseTaskProgress(task, wallet, callback);
  }
  const periodEnd = getBattlePassPeriodEnd(task.cadence, periodKey);
  if (task.task_type === 'JOURNAL_DAY' || task.task_type === 'JOURNAL_WEEK' || task.task_type === 'JOURNAL_MONTH') {
    if ((task.task_type === 'JOURNAL_DAY' && task.cadence !== 'DAILY') ||
        (task.task_type === 'JOURNAL_WEEK' && task.cadence !== 'WEEKLY') ||
        (task.task_type === 'JOURNAL_MONTH' && task.cadence !== 'MONTHLY')) {
      return callback(new Error('This journal task has an invalid completion schedule.'));
    }
    const [year, month] = periodKey.split('-').map(Number);
    const target = task.task_type === 'JOURNAL_DAY' ? 1
      : task.task_type === 'JOURNAL_WEEK' ? 5
        : new Date(Date.UTC(year, month, 0)).getUTCDate();
    const activityStart = task.task_type === 'JOURNAL_MONTH' ? `${periodKey}-01` : periodKey;
    return db.get(
      `SELECT COUNT(DISTINCT j.day) AS completed
       FROM account_trade_journals j
       JOIN accounts a ON a.id = j.account_id
       WHERE LOWER(a.wallet_address) = LOWER(?)
         AND j.day >= ? AND j.day < ?`,
      [wallet, activityStart, periodEnd],
      (err, row) => {
        if (err) return callback(new Error('Unable to verify journal activity for this task.'));
        const completed = Math.min(target, Number(row?.completed || 0));
        task.progress = completed;
        task.progress_target = target;
        callback(null, completed >= target);
      }
    );
  }
  if (task.task_type === 'GREEN_DAY' || task.task_type === 'GREEN_WEEK') {
    const startComparison = task.task_type === 'GREEN_DAY' ? '= ?' : '>= ? AND d.day < ?';
    const params = task.task_type === 'GREEN_DAY'
      ? [wallet, periodKey]
      : [wallet, periodKey, periodEnd];
    return db.get(
      `SELECT COALESCE(SUM(d.profit), 0) AS profit
       FROM daily_account_summaries d
       JOIN accounts a ON a.id = d.account_id
       WHERE LOWER(a.wallet_address) = LOWER(?) AND d.day ${startComparison}`,
      params,
      (err, row) => err
        ? callback(new Error('Unable to verify trading activity for this task.'))
        : callback(null, Number(row?.profit || 0) > 0)
    );
  }
  if (task.task_type === 'WITHDRAWAL') {
    return db.get(
      `SELECT EXISTS(
         SELECT 1 FROM withdrawals w
         WHERE LOWER(w.wallet_address) = LOWER(?) AND w.status = 'PAID'
           AND date(COALESCE(w.paid_at, w.created_at)) >= date(?) AND date(COALESCE(w.paid_at, w.created_at)) < date(?)
         UNION ALL
         SELECT 1 FROM referral_withdrawals rw
         WHERE LOWER(rw.wallet_address) = LOWER(?) AND rw.status = 'PAID'
           AND date(COALESCE(rw.paid_at, rw.created_at)) >= date(?) AND date(COALESCE(rw.paid_at, rw.created_at)) < date(?)
       ) AS eligible`,
      [wallet, periodKey, periodEnd, wallet, periodKey, periodEnd],
      (err, row) => err
        ? callback(new Error('Unable to verify withdrawal activity for this task.'))
        : callback(null, Number(row?.eligible) === 1)
    );
  }
  if (task.task_type === 'TRADE_DAY') {
    return db.get(
      `SELECT EXISTS(
         SELECT 1 FROM trades t
         JOIN accounts a ON a.id = t.account_id
         WHERE LOWER(a.wallet_address) = LOWER(?) AND t.status = 'CLOSED'
           AND date(t.closed_at) >= date(?) AND date(t.closed_at) < date(?)
       ) AS eligible`,
      [wallet, periodKey, periodEnd],
      (err, row) => err
        ? callback(new Error('Unable to verify trading activity for this task.'))
        : callback(null, Number(row?.eligible) === 1)
    );
  }
  callback(new Error('This battle pass task has an unsupported task type.'));
}

// --- ON-CHAIN SECURE VERIFICATION FUNCTION ---
async function verifyMultiChainPurchase(txHash, chainId, expectedBuyerWallet, expectedAmount, treasuryWallet, assetSymbol) {
    const chainConfig = SUPPORTED_EVM_CHAINS[chainId];
    const tokenConfig = chainConfig?.tokens?.[assetSymbol];
    if (!tokenConfig) {
        return { success: false, error: "Unsupported blockchain network." };
    }

    try {
        const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!tx || !receipt || receipt.status !== 1) {
            return { success: false, error: "Transaction not found or failed on-chain." };
        }

        // SECURITY CHECK: Mempool Snipe Protection (tx.from must match buyer)
        if (tx.from.toLowerCase() !== expectedBuyerWallet.toLowerCase()) {
            return { success: false, error: "Security Alert: Transaction sender does not match connected wallet." };
        }

        // Verify ERC-20 Transfer Event logs
        const transferTopic = ethers.id("Transfer(address,address,uint256)");
        let validTransfer = false;

        for (const log of receipt.logs) {
            if (log.address.toLowerCase() === tokenConfig.address.toLowerCase() && log.topics[0] === transferTopic) {
                const recipient = ethers.getAddress('0x' + log.topics[2].slice(26));
                const rawValue = BigInt(log.data);
                const expectedRawValue = ethers.parseUnits(Number(expectedAmount).toFixed(2), tokenConfig.decimals);

                if (recipient.toLowerCase() === treasuryWallet.toLowerCase() && rawValue >= expectedRawValue) {
                    validTransfer = true;
                    break;
                }
            }
        }

        if (!validTransfer) {
            return { success: false, error: `Transaction logs do not show a valid ${assetSymbol} transfer to the treasury.` };
        }

        return { success: true };
    } catch (err) {
        console.error("Multi-chain verification error:", err);
        return { success: false, error: "On-chain verification lookup failed." };
    }
}

function solanaRpc(method, params) {
    const endpoint = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });
    return new Promise((resolve, reject) => {
        const request = https.request(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, response => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', chunk => {
                body += chunk;
                if (body.length > 2 * 1024 * 1024) request.destroy(new Error('Solana RPC response exceeded the size limit.'));
            });
            response.on('end', () => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    return reject(new Error(`Solana RPC returned HTTP ${response.statusCode}.`));
                }
                try {
                    const result = JSON.parse(body);
                    if (result.error) return reject(new Error(result.error.message || 'Solana RPC request failed.'));
                    resolve(result.result);
                } catch (error) {
                    reject(error);
                }
            });
        });
        request.setTimeout(15000, () => request.destroy(new Error('Solana RPC request timed out.')));
        request.on('error', reject);
        request.end(payload);
    });
}

async function verifySolanaPurchase(signature, paymentWallet, assetSymbol, expectedAmount) {
    const mint = SOLANA_TOKEN_ADDRESSES[assetSymbol];
    if (!mint || typeof paymentWallet !== 'string' || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(paymentWallet)) {
        return { success: false, error: 'A supported Solana payment wallet and token are required.' };
    }

    try {
        const transaction = await solanaRpc('getTransaction', [
            signature,
            { commitment: 'finalized', encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
        ]);
        if (!transaction || transaction.meta?.err || !transaction.slot) {
            return { success: false, error: 'Solana transaction is not finalized or it failed.' };
        }

        const accountKeys = transaction.transaction?.message?.accountKeys || [];
        const payerSigned = accountKeys.some(key =>
            key.pubkey === paymentWallet && key.signer === true
        );
        if (!payerSigned) {
            return { success: false, error: 'The Solana transaction was not signed by the selected payment wallet.' };
        }

        const expectedRawAmount = BigInt(`${Number(expectedAmount).toFixed(2).replace('.', '')}${'0'.repeat(4)}`);
        const transfers = transaction.transaction.message.instructions || [];
        for (const instruction of transfers) {
            const info = instruction.parsed?.info;
            if (instruction.programId !== SOLANA_TOKEN_PROGRAM_ID ||
                instruction.parsed?.type !== 'transferChecked' ||
                info?.authority !== paymentWallet ||
                info?.mint !== mint ||
                Number(info.tokenAmount?.decimals) !== 6 ||
                BigInt(info.tokenAmount?.amount || '0') < expectedRawAmount) {
                continue;
            }

            const destinationKeyIndex = accountKeys.findIndex(key => key.pubkey === info.destination);
            const destinationBalance = (transaction.meta.postTokenBalances || []).find(balance =>
                balance.accountIndex === destinationKeyIndex && balance.mint === mint
            );
            let destinationOwner = destinationBalance?.owner;
            if (!destinationOwner) {
                const destinationAccount = await solanaRpc('getAccountInfo', [
                    info.destination,
                    { encoding: 'jsonParsed', commitment: 'finalized' }
                ]);
                const parsedAccount = destinationAccount?.value?.data?.parsed?.info;
                if (parsedAccount?.mint === mint) destinationOwner = parsedAccount.owner;
            }
            if (destinationOwner === SOLANA_TREASURY_WALLET) return { success: true };
        }

        return { success: false, error: `Solana transaction does not show a valid ${assetSymbol} transfer to the treasury.` };
    } catch (error) {
        console.error('Solana purchase verification error:', error);
        return { success: false, error: 'Solana transaction verification lookup failed.' };
    }
}

// --- API ROUTES ---

app.post('/api/auth/trade-challenge', sensitiveLimiter, challengeLimiter, (req, res) => {
  const wallet = req.body?.wallet_address;
  const walletType = String(req.body?.wallet_type || getWalletType(wallet) || '').toUpperCase();
  const key = normalizeWalletAddress(wallet, walletType);
  if (!key) {
    return res.status(400).json({ error: 'A valid EVM or Solana wallet address is required.' });
  }

  const now = Date.now();
  for (const [challengeWallet, challenge] of tradeChallenges) {
    if (challenge.expiresAt <= now) tradeChallenges.delete(challengeWallet);
  }
  if (tradeChallenges.size >= 5000) {
    return res.status(503).json({ error: 'Wallet authorization is temporarily unavailable.' });
  }

  db.get(
    'SELECT wallet_address FROM users WHERE LOWER(wallet_address) = LOWER(?) LIMIT 1',
    [key],
    (lookupErr, existingWallet) => {
      if (lookupErr) return res.status(500).json({ error: 'Unable to verify wallet identity.' });
      if (existingWallet &&
          normalizeWalletAddress(existingWallet.wallet_address) !== key) {
        return res.status(409).json({ error: 'This Solana address conflicts with an existing wallet identity and cannot be registered.' });
      }

      const nonce = crypto.randomBytes(24).toString('hex');
      const expiresAt = Date.now() + 2 * 60 * 1000;
      const message = `Blastrr trade authorization\nWallet type: ${walletType}\nWallet: ${key}\nNonce: ${nonce}\nExpires: ${expiresAt}`;
      tradeChallenges.set(message, { message, walletAddress: key, walletType, expiresAt });
      res.json({ challenge: message });
    }
  );
});

app.post('/api/auth/wallet-session', sensitiveLimiter, requireTradeSignature, walletSessionLimiter, (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + WALLET_SESSION_DURATION_MS;
  const wallet = req.walletAddress;
  const walletType = req.walletType;
  const ipAddress = req.ip || 'unknown';
  recordWalletLogin(wallet, ipAddress, (loginErr, login) => {
    if (loginErr) {
      if (loginErr.code === 'WALLET_IDENTITY_CONFLICT') {
        return res.status(409).json({ error: loginErr.message });
      }
      console.error('Unable to record wallet login IP:', loginErr.message);
      return res.status(500).json({ error: 'Unable to record login security details.' });
    }
    registerWalletSession(db, { token, walletAddress: wallet, ipAddress, expiresAt }, (sessionErr, session) => {
      if (sessionErr) {
        if (sessionErr.code === 'SESSION_CAPACITY') {
          return res.status(503).json({ error: 'Wallet sessions are temporarily unavailable.' });
        }
        console.error('Unable to persist wallet session:', sessionErr.message);
        return res.status(500).json({ error: 'Unable to establish a wallet session.' });
      }
      if (session.softLocked) disconnectMarketDataStreams(wallet);
      res.json({
        token,
        expires_at: expiresAt,
        new_ip: login.isNewIp,
        wallet_soft_locked: session.softLocked
      });
    });
  });
});

app.post('/api/auth/wallet-session/reauthorize', sensitiveLimiter, requireWalletSession, requireSameWalletReauthentication, walletSessionLimiter, (req, res) => {
  markWalletSessionReauthenticated(db, req.walletSessionTokenHash, req.walletAddress, (err, status) => {
    if (err?.code === 'SESSION_INVALID') return res.status(401).json({ error: 'A valid wallet session is required.' });
    if (err) {
      console.error('Unable to reauthorize wallet session:', err.message);
      return res.status(500).json({ error: 'Unable to reauthorize wallet session.' });
    }
    if (status.softLocked) disconnectMarketDataStreams(req.walletAddress);
    res.json({
      wallet_soft_locked: status.softLocked,
      reauthentication_required: status.reauthenticationRequired,
      active_session_count: status.activeSessionCount || 0,
      reauthenticated_session_count: status.reauthenticatedSessionCount || 0
    });
  });
});

app.get('/api/user/security-status', requireWalletSession, (req, res) => {
  getWalletSecurityStatus(db, req.walletAddress, req.walletSessionTokenHash, (err, status) => {
    if (err) return res.status(500).json({ error: 'Unable to load wallet security status.' });
    if (status.softLocked) res.set('X-Wallet-Soft-Locked', 'true');
    res.json({
      wallet_soft_locked: status.softLocked,
      locked_at: status.lock?.locked_at || null,
      reauthentication_required: status.reauthenticationRequired,
      active_session_count: status.activeSessionCount || 0,
      reauthenticated_session_count: status.reauthenticatedSessionCount || 0
    });
  });
});

app.get('/api/user/disclaimer-consent', requireWalletSession, (req, res) => {
  db.get(
    'SELECT version FROM wallet_disclaimer_acceptances WHERE LOWER(wallet_address) = LOWER(?) AND version = ?',
    [req.walletAddress, DISCLAIMER_VERSION],
    (err, acceptance) => {
      if (err) return res.status(500).json({ error: 'Unable to load disclaimer acceptance.' });
      res.json({ accepted: Boolean(acceptance), version: DISCLAIMER_VERSION });
    }
  );
});

app.post('/api/user/disclaimer-consent', sensitiveLimiter, requireWalletSession, (req, res) => {
  if (req.body?.version !== DISCLAIMER_VERSION ||
      req.body?.accepted_terms !== true ||
      req.body?.simulated_funds !== true) {
    return res.status(400).json({ error: 'Confirm both required acknowledgements to continue.' });
  }
  db.run(
    `INSERT INTO wallet_disclaimer_acceptances (wallet_address, version)
     VALUES (?, ?)
     ON CONFLICT(wallet_address, version) DO UPDATE SET accepted_at = CURRENT_TIMESTAMP`,
    [req.walletAddress, DISCLAIMER_VERSION],
    (err) => {
      if (err) return res.status(500).json({ error: 'Unable to remember disclaimer acceptance.' });
      res.json({ success: true, version: DISCLAIMER_VERSION });
    }
  );
});

app.get('/api/plans', (req, res) => {
  db.get('SELECT standard_discount_pct FROM battlepass_settings WHERE id = 1', [], (settingsErr, settings) => {
    if (settingsErr) return res.status(500).json({ error: 'Unable to load current purchase discounts.' });
    const discountPct = Number(settings?.standard_discount_pct ?? 90);
    db.all("SELECT * FROM plans WHERE active = 1 ORDER BY id", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        plans: rows,
        standard_discount_pct: discountPct
      });
    });
  });
});

app.post('/api/admin/plans/list', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.get('SELECT standard_discount_pct FROM battlepass_settings WHERE id = 1', [], (settingsErr, settings) => {
    if (settingsErr) return res.status(500).json({ error: 'Unable to load the standard discount.' });
    const discountPct = Number(settings?.standard_discount_pct ?? 90);
    db.all('SELECT * FROM plans ORDER BY active DESC, id', [], (err, plans) => {
      if (err) return res.status(500).json({ error: 'Unable to load account plans.' });
      res.json({ plans: plans || [], standard_discount_pct: discountPct });
    });
  });
});

app.post('/api/admin/plans/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const planId = body.plan_id == null ? null : Number(body.plan_id);
  const active = body.active === true || body.active === 1 ? 1
    : body.active === false || body.active === 0 ? 0 : null;
  const fields = {
    base_price_usdt: Number(body.base_price_usdt),
    simulated_capital: Number(body.simulated_capital),
    profit_target: Number(body.profit_target),
    max_drawdown_pct: Number(body.max_drawdown_pct),
    daily_loss_pct: Number(body.daily_loss_pct),
    max_single_day_profit_pct: Number(body.max_single_day_profit_pct)
  };
  const values = Object.values(fields);
  if (name.length < 3 || name.length > 100 ||
      (planId !== null && (!Number.isInteger(planId) || planId < 1)) ||
      active === null ||
      values.some(value => !Number.isFinite(value)) ||
      fields.base_price_usdt <= 0 ||
      fields.simulated_capital <= 0 ||
      fields.profit_target < 0 ||
      fields.max_drawdown_pct < 0 || fields.max_drawdown_pct > 100 ||
      fields.daily_loss_pct < 0 || fields.daily_loss_pct > 100 ||
      fields.max_single_day_profit_pct < 0 || fields.max_single_day_profit_pct > 100) {
    return res.status(400).json({ error: 'Enter a plan name, valid prices and capital, and valid risk percentages from 0 to 100.' });
  }
  {
    const salePrice = fields.base_price_usdt;
    db.get(
      `SELECT id FROM plans WHERE name = ? COLLATE NOCASE AND (? IS NULL OR id != ?) LIMIT 1`,
      [name, planId, planId],
      (duplicateErr, duplicate) => {
        if (duplicateErr) return res.status(500).json({ error: 'Unable to check for duplicate plan names.' });
        if (duplicate) return res.status(409).json({ error: 'A plan with that name already exists.' });
        const valuesWithSalePrice = [
          fields.base_price_usdt,
          salePrice,
          fields.simulated_capital,
          fields.profit_target,
          fields.max_drawdown_pct,
          fields.daily_loss_pct,
          fields.max_single_day_profit_pct
        ];
        if (planId === null) {
          return db.run(
            `INSERT INTO plans (name, base_price_usdt, price_usdt, simulated_capital, profit_target,
             max_drawdown_pct, daily_loss_pct, max_single_day_profit_pct, active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, ...valuesWithSalePrice, active],
            function(insertErr) {
              if (insertErr) return res.status(500).json({ error: 'Unable to create the account plan.' });
              const insertedPlanId = this.lastID;
              db.run(
                'INSERT OR IGNORE INTO battlepass_plan_rewards (plan_id, xp_reward, points_reward) VALUES (?, 1000, 100)',
                [insertedPlanId],
                rewardErr => {
                  if (rewardErr) return res.status(500).json({ error: 'Plan was created but its battle pass rewards could not be initialized.' });
                  syncBattlePassPlanTasks(taskErr => {
                    if (taskErr) return res.status(500).json({ error: 'Plan was created but its battle pass purchase task could not be initialized.' });
                    res.status(201).json({ success: true, plan_id: insertedPlanId });
                  }, true);
                }
              );
            }
          );
        }
        db.run(
          `UPDATE plans SET name = ?, base_price_usdt = ?, price_usdt = ?, simulated_capital = ?,
           profit_target = ?, max_drawdown_pct = ?, daily_loss_pct = ?, max_single_day_profit_pct = ?, active = ?
           WHERE id = ?`,
          [name, ...valuesWithSalePrice, active, planId],
          function(updateErr) {
            if (updateErr) return res.status(500).json({ error: 'Unable to update the account plan.' });
            if (this.changes !== 1) return res.status(404).json({ error: 'Account plan not found.' });
            syncBattlePassPlanTasks(taskErr => {
              if (taskErr) return res.status(500).json({ error: 'Plan was updated but its battle pass purchase task could not be synchronized.' });
              res.json({ success: true, plan_id: planId });
            }, true);
          }
        );
      }
    );
  }
});

app.post('/api/admin/battlepass/load', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.get('SELECT standard_discount_pct FROM battlepass_settings WHERE id = 1', [], (settingsErr, settings) => {
    if (settingsErr || !settings) return res.status(500).json({ error: 'Unable to load battle pass settings.' });
    db.all(
      `SELECT l.level, l.xp_required, d.title FROM battlepass_levels l
       JOIN battlepass_level_definitions d ON d.level = l.level ORDER BY l.level`,
      [],
      (levelsErr, levels) => {
      if (levelsErr) return res.status(500).json({ error: 'Unable to load battle pass levels.' });
      db.all(
        `SELECT p.id AS plan_id, p.name, p.simulated_capital,
                COALESCE(r.xp_reward, 1000) AS xp_reward,
                COALESCE(r.points_reward, 100) AS points_reward
         FROM plans p LEFT JOIN battlepass_plan_rewards r ON r.plan_id = p.id
         WHERE p.active = 1 ORDER BY p.id`,
        [],
        (plansErr, plans) => {
          if (plansErr) return res.status(500).json({ error: 'Unable to load plan battle pass rewards.' });
          db.all('SELECT * FROM battlepass_tasks ORDER BY active DESC, cadence, id', [], (tasksErr, tasks) => {
            if (tasksErr) return res.status(500).json({ error: 'Unable to load battle pass tasks.' });
            res.json({ settings, levels: levels || [], plans: plans || [], tasks: tasks || [] });
          });
        }
      );
    });
  });
});

function insertBattlePassPackCapNotification(pack, reward, callback) {
  const maxDrops = Number(reward.max_drops);
  const eventKey = `reward-pack-cap:${pack.id}:${reward.id}:${maxDrops}`;
  const message = `${pack.name} pack is out of stock: ${reward.name} reached its global cap of ${maxDrops} drops.`;
  db.run(
    `INSERT OR IGNORE INTO admin_notifications (event_key, event_type, message, metadata_json)
     VALUES (?, 'REWARD_PACK_OUT_OF_STOCK', ?, ?)`,
    [eventKey, message, JSON.stringify({
      pack_id: Number(pack.id),
      reward_id: Number(reward.id),
      max_drops: maxDrops
    })],
    callback
  );
}

function disableCappedBattlePassPacks(callback) {
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return callback(beginErr);
      db.all(
        `SELECT p.id AS pack_id, p.name AS pack_name, r.id AS reward_id, r.name AS reward_name,
                pr.max_drops, COUNT(o.id) AS drops
         FROM battlepass_packs p
         JOIN battlepass_pack_rewards pr ON pr.pack_id = p.id
         JOIN battlepass_rewards r ON r.id = pr.reward_id
         LEFT JOIN battlepass_pack_openings o ON o.pack_id = p.id AND o.reward_id = r.id
         WHERE p.active = 1 AND pr.max_drops > 0
         GROUP BY p.id, r.id
         HAVING COUNT(o.id) >= pr.max_drops`,
        [],
        (lookupErr, cappedRows) => {
          if (lookupErr) return db.run('ROLLBACK', () => callback(lookupErr));
          const packIds = [...new Set((cappedRows || []).map(row => Number(row.pack_id)))];
          const disableNext = index => {
            if (index >= packIds.length) {
              return db.run('COMMIT', commitErr => {
                if (commitErr) return db.run('ROLLBACK', () => callback(commitErr));
                callback(null);
              });
            }
            const packId = packIds[index];
            const pack = { id: packId, name: cappedRows.find(row => Number(row.pack_id) === packId)?.pack_name || 'Pack' };
            const rewards = cappedRows.filter(row => Number(row.pack_id) === packId);
            db.run('UPDATE battlepass_packs SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [packId], updateErr => {
              if (updateErr) return db.run('ROLLBACK', () => callback(updateErr));
              const notifyNext = rewardIndex => {
                if (rewardIndex >= rewards.length) return disableNext(index + 1);
                const row = rewards[rewardIndex];
                insertBattlePassPackCapNotification(pack, {
                  id: Number(row.reward_id),
                  name: row.reward_name,
                  max_drops: Number(row.max_drops)
                }, notifyErr => notifyErr
                  ? db.run('ROLLBACK', () => callback(notifyErr))
                  : notifyNext(rewardIndex + 1));
              };
              notifyNext(0);
            });
          };
          disableNext(0);
        }
      );
    });
  });
}

app.post('/api/admin/battlepass/shop/load', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  disableCappedBattlePassPacks(capErr => {
    if (capErr) return res.status(500).json({ error: 'Unable to refresh capped reward packs.' });
    db.all(
      'SELECT id, name, active FROM plans ORDER BY active DESC, id',
      [],
      (plansErr, plans) => {
        if (plansErr) return res.status(500).json({ error: 'Unable to load account types for Battle Pass rewards.' });
        db.all(
          `SELECT r.*, p.name AS plan_name,
                  (SELECT COUNT(*) FROM battlepass_pack_openings o
                   WHERE o.reward_id = r.id) AS total_drops
           FROM battlepass_rewards r LEFT JOIN plans p ON p.id = r.plan_id
           ORDER BY r.active DESC, r.reward_type, r.name`,
          [],
          (rewardsErr, rewards) => {
            if (rewardsErr) return res.status(500).json({ error: 'Unable to load Battle Pass reward definitions.' });
            db.all(
              `SELECT p.id AS pack_id, p.name AS pack_name, p.points_cost, p.active AS pack_active,
                      pr.reward_id, pr.odds, pr.max_drops, r.name AS reward_name,
                      r.description AS reward_description, r.reward_type, r.plan_id,
                      r.discount_pct, r.xp_amount, r.points_amount, r.quantity, r.active AS reward_active,
                      pl.name AS plan_name,
                      (SELECT COUNT(*) FROM battlepass_pack_openings o
                       WHERE o.pack_id = p.id AND o.reward_id = r.id) AS drops
               FROM battlepass_packs p
               LEFT JOIN battlepass_pack_rewards pr ON pr.pack_id = p.id
               LEFT JOIN battlepass_rewards r ON r.id = pr.reward_id
               LEFT JOIN plans pl ON pl.id = r.plan_id
               ORDER BY p.id, r.reward_type, r.name`,
              [],
              (packsErr, rows) => {
                if (packsErr) return res.status(500).json({ error: 'Unable to load Battle Pass pack reward pools.' });
                const packsById = new Map();
                for (const row of rows || []) {
                  let pack = packsById.get(Number(row.pack_id));
                  if (!pack) {
                    pack = {
                      id: Number(row.pack_id),
                      name: row.pack_name,
                      points_cost: Number(row.points_cost),
                      active: Number(row.pack_active) === 1,
                      rewards: []
                    };
                    packsById.set(pack.id, pack);
                  }
                  if (row.reward_id == null) continue;
                  pack.rewards.push({
                    reward_id: Number(row.reward_id),
                    odds: Number(row.odds),
                    max_drops: Number(row.max_drops),
                    drops: Number(row.drops),
                    cap_reached: Number(row.max_drops) > 0 && Number(row.drops) >= Number(row.max_drops),
                    name: row.reward_name,
                    description: row.reward_description,
                    reward_type: row.reward_type,
                    plan_id: row.plan_id == null ? null : Number(row.plan_id),
                    plan_name: row.plan_name,
                    discount_pct: row.discount_pct == null ? null : Number(row.discount_pct),
                    xp_amount: Number(row.xp_amount),
                    points_amount: Number(row.points_amount),
                    quantity: Number(row.quantity),
                    active: Number(row.reward_active) === 1
                  });
                }
                res.json({ packs: [...packsById.values()], rewards: rewards || [], plans: plans || [] });
              }
            );
          }
        );
      }
    );
  });
});

app.post('/api/admin/battlepass/rewards/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const body = req.body || {};
  const rewardId = body.reward_id == null ? null : Number(body.reward_id);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const rewardType = typeof body.reward_type === 'string' ? body.reward_type.toUpperCase() : '';
  const planId = body.plan_id == null || body.plan_id === '' ? null : Number(body.plan_id);
  const discountPct = body.discount_pct == null || body.discount_pct === '' ? null : Number(body.discount_pct);
  const xpAmount = Number(body.xp_amount ?? 0);
  const pointsAmount = Number(body.points_amount ?? 0);
  const quantity = Number(body.quantity ?? 1);
  const active = body.active === true || body.active === 1 ? 1
    : body.active === false || body.active === 0 ? 0 : null;
  const validTypes = ['ACCOUNT', 'DISCOUNT', 'XP', 'POINTS'];
  if ((rewardId !== null && (!Number.isInteger(rewardId) || rewardId < 1)) ||
      name.length < 2 || name.length > 100 || description.length < 3 || description.length > 500 ||
      !validTypes.includes(rewardType) || active === null ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > 1000 ||
      !Number.isInteger(xpAmount) || xpAmount < 0 ||
      !Number.isInteger(pointsAmount) || pointsAmount < 0 ||
      (planId !== null && (!Number.isInteger(planId) || planId < 1)) ||
      (rewardType === 'ACCOUNT' && (!Number.isInteger(planId) || planId < 1)) ||
      (rewardType === 'DISCOUNT' && (!Number.isFinite(discountPct) || discountPct < 91 || discountPct > 98)) ||
      (rewardType === 'XP' && xpAmount < 1) ||
      (rewardType === 'POINTS' && pointsAmount < 1)) {
    return res.status(400).json({ error: 'Enter a reward name and description, a valid reward type, quantity, and its required account type, 91–98% discount, XP, or points amount.' });
  }
  const normalizedPlanId = rewardType === 'ACCOUNT' ? planId : rewardType === 'DISCOUNT' ? planId : null;
  const normalizedDiscount = rewardType === 'DISCOUNT' ? discountPct : null;
  db.get('SELECT id FROM plans WHERE id = ? AND active = 1', [normalizedPlanId], (planErr, plan) => {
    if (planErr) return res.status(500).json({ error: 'Unable to verify the reward account type.' });
    if (rewardType === 'ACCOUNT' && !plan) return res.status(400).json({ error: 'Choose an existing account type for the account reward.' });
    if (rewardType === 'DISCOUNT' && normalizedPlanId !== null && !plan) return res.status(400).json({ error: 'Choose an existing account type or leave it unrestricted.' });
    const values = [name, description, rewardType, normalizedPlanId, normalizedDiscount, xpAmount, pointsAmount, quantity, active];
    const sql = rewardId === null
      ? `INSERT INTO battlepass_rewards
         (name, description, reward_type, plan_id, discount_pct, xp_amount, points_amount, quantity, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `UPDATE battlepass_rewards SET name = ?, description = ?, reward_type = ?, plan_id = ?,
         discount_pct = ?, xp_amount = ?, points_amount = ?, quantity = ?, active = ?,
         updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    if (rewardId !== null) values.push(rewardId);
    db.run(sql, values, function(saveErr) {
      if (saveErr?.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ error: 'A reward with that name already exists, or the selected account type is invalid.' });
      if (saveErr) return res.status(500).json({ error: 'Unable to save the Battle Pass reward.' });
      if (rewardId !== null && this.changes !== 1) return res.status(404).json({ error: 'Battle Pass reward not found.' });
      res.json({ success: true, reward_id: rewardId || this.lastID });
    });
  });
});

app.post('/api/admin/battlepass/packs/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const body = req.body || {};
  const packId = body.pack_id == null ? null : Number(body.pack_id);
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const pointsCost = Number(body.points_cost);
  const active = body.active === true || body.active === 1 ? 1
    : body.active === false || body.active === 0 ? 0 : null;
  const entries = Array.isArray(body.rewards) ? body.rewards : [];
  const oddsValidation = validatePackRewardPool(entries);
  if ((packId !== null && (!Number.isInteger(packId) || packId < 1)) ||
      name.length < 2 || name.length > 60 || !Number.isInteger(pointsCost) || pointsCost < 0 ||
      active === null || !oddsValidation.valid) {
    return res.status(400).json({ error: oddsValidation.error || 'Enter a pack name, a nonnegative points cost, and its active state.' });
  }
  db.all(
    `SELECT id FROM battlepass_rewards
     WHERE active = 1 AND id IN (${entries.map(() => '?').join(',')})`,
    entries.map(entry => Number(entry.reward_id)),
    (rewardsErr, rewards) => {
      if (rewardsErr) return res.status(500).json({ error: 'Unable to verify the selected pack rewards.' });
      if ((rewards || []).length !== entries.length) {
        return res.status(400).json({ error: 'Every pack pool reward must be active. Update the reward catalog before saving this pack.' });
      }
      const savePack = () => db.serialize(() => {
        db.run('BEGIN IMMEDIATE', beginErr => {
          if (beginErr) return res.status(500).json({ error: 'Unable to start the pack update.' });
          const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
          const writeEntries = (id, index) => {
            if (index >= entries.length) {
              return db.run('COMMIT', commitErr => {
                if (commitErr) return rollback(500, 'Unable to commit the pack reward pool.');
                disableCappedBattlePassPacks(capErr => {
                  if (capErr) return res.status(500).json({ error: 'Pack saved, but capped packs could not be refreshed.' });
                  res.json({ success: true, pack_id: id });
                });
              });
            }
            const entry = entries[index];
            db.run(
              'INSERT INTO battlepass_pack_rewards (pack_id, reward_id, odds, max_drops) VALUES (?, ?, ?, ?)',
              [id, Number(entry.reward_id), Number(entry.odds), Number(entry.max_drops)],
              insertErr => insertErr
                ? rollback(500, 'Unable to save the pack reward pool.')
                : writeEntries(id, index + 1)
            );
          };
          const saveEntries = id => db.run(
            'DELETE FROM battlepass_pack_rewards WHERE pack_id = ?',
            [id],
            deleteErr => deleteErr ? rollback(500, 'Unable to replace the pack reward pool.') : writeEntries(id, 0)
          );
          if (packId === null) {
            db.run(
              'INSERT INTO battlepass_packs (name, points_cost, active) VALUES (?, ?, ?)',
              [name, pointsCost, active],
              function(insertErr) {
                if (insertErr?.code === 'SQLITE_CONSTRAINT') return rollback(409, 'A pack with that name already exists.');
                if (insertErr) return rollback(500, 'Unable to create the Battle Pass pack.');
                saveEntries(this.lastID);
              }
            );
          } else {
            db.run(
              `UPDATE battlepass_packs SET name = ?, points_cost = ?, active = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [name, pointsCost, active, packId],
              function(updateErr) {
                if (updateErr?.code === 'SQLITE_CONSTRAINT') return rollback(409, 'A pack with that name already exists.');
                if (updateErr) return rollback(500, 'Unable to update the Battle Pass pack.');
                if (this.changes !== 1) return rollback(404, 'Battle Pass pack not found.');
                saveEntries(packId);
              }
            );
          }
        });
      });
      if (packId === null) return savePack();
      db.get(
        'SELECT id, name FROM battlepass_packs WHERE id = ?',
        [packId],
        (packErr, existingPack) => {
          if (packErr) return res.status(500).json({ error: 'Unable to verify the Battle Pass pack.' });
          if (!existingPack) return res.status(404).json({ error: 'Battle Pass pack not found.' });
          const checkCappedReward = (index, callback) => {
            if (index >= entries.length) return callback(null);
            const entry = entries[index];
            if (Number(entry.max_drops) === 0) return checkCappedReward(index + 1, callback);
            db.get(
              `SELECT COUNT(*) AS drops, r.name FROM battlepass_pack_openings o
               JOIN battlepass_rewards r ON r.id = o.reward_id
               WHERE o.pack_id = ? AND o.reward_id = ?`,
              [packId, Number(entry.reward_id)],
              (countErr, count) => {
                if (countErr) return callback(countErr);
                if (Number(count?.drops) >= Number(entry.max_drops) && active === 1) {
                  return callback(new Error(`${count.name} has already reached its global drop cap. Increase the cap or leave this pack inactive.`));
                }
                checkCappedReward(index + 1, callback);
              }
            );
          };
          checkCappedReward(0, capErr => capErr
            ? res.status(capErr.message.includes('global drop cap') ? 400 : 500).json({ error: capErr.message })
            : savePack());
        }
      );
    }
  );
});

app.get('/api/battlepass', requireWalletSession, (req, res) => {
  const wallet = req.query.wallet;
  if (typeof wallet !== 'string' || normalizeWalletAddress(wallet) !== req.walletAddress) {
    return res.status(403).json({ error: 'Wallet session does not match the requested battle pass.' });
  }
  syncBattlePassPlanTasks(syncErr => {
    if (syncErr) return res.status(500).json({ error: 'Unable to prepare plan purchase tasks.' });
  db.run(
    'INSERT OR IGNORE INTO battlepass_users (wallet_address) VALUES (?)',
    [req.walletAddress],
    (insertErr) => {
      if (insertErr) return res.status(500).json({ error: 'Unable to prepare your battle pass profile.' });
      db.get(
        `SELECT b.wallet_address, b.xp, b.points, b.profile_image_url, u.username,
                (SELECT d.title FROM battlepass_level_titles t
                 JOIN battlepass_level_definitions d ON d.level = t.level
                 WHERE LOWER(t.wallet_address) = LOWER(b.wallet_address)
                 ORDER BY t.level DESC LIMIT 1) AS title
         FROM battlepass_users b LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(b.wallet_address)
         WHERE LOWER(b.wallet_address) = LOWER(?)`,
        [req.walletAddress],
        (profileErr, profile) => {
          if (profileErr || !profile) return res.status(500).json({ error: 'Unable to load your battle pass profile.' });
          const currentLevel = getBattlePassLevel(profile.xp);
          db.all(
            `SELECT l.*, d.title FROM battlepass_levels l
             JOIN battlepass_level_definitions d ON d.level = l.level ORDER BY l.level`,
            [],
            (levelsErr, levels) => {
            if (levelsErr) return res.status(500).json({ error: 'Unable to load battle pass levels.' });
            db.all(
              `SELECT t.level, d.title FROM battlepass_level_titles t
               JOIN battlepass_level_definitions d ON d.level = t.level
               WHERE LOWER(t.wallet_address) = LOWER(?)`,
              [req.walletAddress],
              (titleClaimsErr, titleClaims) => {
              if (titleClaimsErr) return res.status(500).json({ error: 'Unable to load your battle pass titles.' });
              const titleByLevel = new Map((titleClaims || []).map(claim => [Number(claim.level), claim.title]));
              db.all(
                `SELECT t.*,
                        (SELECT c.period_key FROM battlepass_task_claims c
                         WHERE c.task_id = t.id AND LOWER(c.wallet_address) = LOWER(?)
                           AND c.cadence = t.cadence
                         ORDER BY c.created_at DESC LIMIT 1) AS last_period_key,
                        EXISTS (SELECT 1 FROM battlepass_events e
                                WHERE e.event_type = 'PLATFORM_REVIEW'
                                  AND LOWER(e.wallet_address) = LOWER(?)) AS review_completed
                         FROM battlepass_tasks t
                         LEFT JOIN plans task_plan ON task_plan.id = t.plan_id
                         WHERE t.active = 1
                           AND (t.task_type != 'PURCHASE_PLAN' OR task_plan.active = 1
                             OR EXISTS (
                               SELECT 1 FROM purchases p
                               JOIN accounts a ON a.id = p.account_id AND a.wallet_address = p.wallet_address
                               WHERE p.wallet_address = ?
                                 AND a.plan_id = t.plan_id
                                 AND p.chain_id > 0 AND p.amount_usdt > 0
                                 AND p.created_at >= t.created_at
                             ))
                 ORDER BY CASE t.cadence WHEN 'DAILY' THEN 1 WHEN 'WEEKLY' THEN 2 WHEN 'MONTHLY' THEN 3 ELSE 4 END, t.id`,
                [req.walletAddress, req.walletAddress, req.walletAddress],
                (tasksErr, tasks) => {
                  if (tasksErr) return res.status(500).json({ error: 'Unable to load battle pass tasks.' });
                  for (const task of tasks || []) {
                    const taskPeriod = getBattlePassTaskPeriod(task);
                    task.claimed = ['PURCHASE_ANY', 'PURCHASE_PLAN'].includes(task.task_type)
                      ? false
                      : task.task_type === 'PLATFORM_REVIEW'
                        ? Number(task.review_completed) === 1
                        : task.last_period_key === taskPeriod.claimPeriodKey;
                    delete task.last_period_key;
                    delete task.review_completed;
                  }
                  const eligibleTasks = tasks || [];
                  let taskIndex = 0;
                  const checkTaskEligibility = () => {
                    if (taskIndex >= eligibleTasks.length) {
                      return res.json({
                        profile: {
                          ...profile,
                          xp: Number(profile.xp),
                          points: Number(profile.points),
                          title: profile.title || null,
                          level: currentLevel
                        },
                        levels: (levels || []).map(level => ({
                          ...level,
                          title_claimed: titleByLevel.has(Number(level.level)),
                          unlocked: currentLevel >= Number(level.level)
                        })),
                        tasks: eligibleTasks
                      });
                    }
                    const task = eligibleTasks[taskIndex++];
                    const period = getBattlePassTaskPeriod(task);
                    if (task.claimed) {
                      task.eligible = false;
                      if (['JOURNAL_DAY', 'JOURNAL_WEEK', 'JOURNAL_MONTH'].includes(task.task_type)) {
                        const period = getBattlePassTaskPeriod(task);
                        return getBattlePassTaskEligibility(task, req.walletAddress, period.activityPeriodKey, (eligibilityErr) => {
                          if (eligibilityErr) return res.status(500).json({ error: eligibilityErr.message });
                          checkTaskEligibility();
                        });
                      }
                      return checkTaskEligibility();
                    }
                    if (task.task_type === 'PURCHASE_ANY' || task.task_type === 'PURCHASE_PLAN') {
                      return getBattlePassTaskEligibility(task, req.walletAddress, period.activityPeriodKey, (eligibilityErr, eligible) => {
                        if (eligibilityErr) return res.status(500).json({ error: eligibilityErr.message });
                        task.eligible = eligible;
                        checkTaskEligibility();
                      });
                    }
                    if (task.task_type === 'PLATFORM_REVIEW') {
                      task.eligible = false;
                      return checkTaskEligibility();
                    }
                    getBattlePassTaskEligibility(task, req.walletAddress, period.activityPeriodKey, (eligibilityErr, eligible) => {
                      if (eligibilityErr) return res.status(500).json({ error: eligibilityErr.message });
                      task.eligible = eligible;
                      checkTaskEligibility();
                    });
                  };
                  checkTaskEligibility();
                }
              );
            });
          });
        }
      );
    }
  );
  });
});

app.get('/api/battlepass/packs', requireWalletSession, (req, res) => {
  disableCappedBattlePassPacks(capErr => {
    if (capErr) return res.status(500).json({ error: 'Unable to refresh reward pack availability.' });
    db.all(
      `SELECT p.id AS pack_id, p.name AS pack_name, p.points_cost, p.active AS pack_active,
              pr.reward_id, pr.odds, pr.max_drops, r.name AS reward_name,
              r.description AS reward_description, r.reward_type, r.plan_id,
              r.discount_pct, r.xp_amount, r.points_amount, r.quantity, r.active AS reward_active,
              pl.name AS plan_name, pl.active AS plan_active,
              (SELECT COUNT(*) FROM battlepass_pack_openings o
               WHERE o.pack_id = p.id AND o.reward_id = r.id) AS drops
       FROM battlepass_packs p
       LEFT JOIN battlepass_pack_rewards pr ON pr.pack_id = p.id
       LEFT JOIN battlepass_rewards r ON r.id = pr.reward_id
       LEFT JOIN plans pl ON pl.id = r.plan_id
       ORDER BY p.id, r.reward_type, r.name`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Unable to load Battle Pass packs.' });
        const packsById = new Map();
        for (const row of rows || []) {
          let pack = packsById.get(Number(row.pack_id));
          if (!pack) {
            pack = {
              id: Number(row.pack_id),
              name: row.pack_name,
              points_cost: Number(row.points_cost),
              active: Number(row.pack_active) === 1,
              rewards: []
            };
            packsById.set(pack.id, pack);
          }
          if (row.reward_id == null) continue;
          pack.rewards.push({
            id: Number(row.reward_id),
            name: row.reward_name,
            description: row.reward_description,
            reward_type: row.reward_type,
            plan_id: row.plan_id == null ? null : Number(row.plan_id),
            plan_name: row.plan_name,
            plan_active: Number(row.plan_active) === 1,
            discount_pct: row.discount_pct == null ? null : Number(row.discount_pct),
            xp_amount: Number(row.xp_amount),
            points_amount: Number(row.points_amount),
            quantity: Number(row.quantity),
            odds: Number(row.odds),
            max_drops: Number(row.max_drops),
            drops: Number(row.drops),
            cap_reached: Number(row.max_drops) > 0 && Number(row.drops) >= Number(row.max_drops),
            active: Number(row.reward_active) === 1
          });
        }
        const packs = [...packsById.values()].map(pack => {
          const validation = validatePackRewardPool(pack.rewards.map(reward => ({
            reward_id: reward.id,
            odds: reward.odds,
            max_drops: reward.max_drops
          })));
          const cappedReward = pack.rewards.find(reward => reward.cap_reached);
          const unavailableReward = pack.rewards.find(reward =>
            !reward.active || (reward.reward_type === 'ACCOUNT' && !reward.plan_active));
          pack.odds_total = validation.total;
          pack.out_of_stock = !pack.active || !validation.valid || Boolean(cappedReward) || Boolean(unavailableReward);
          pack.unavailable_reason = cappedReward
            ? `${cappedReward.name} has reached its drop cap.`
            : unavailableReward
              ? `${unavailableReward.name} is unavailable.`
              : !validation.valid ? validation.error : pack.active ? null : 'Out of stock.';
          return pack;
        });
        db.get(
          'SELECT points FROM battlepass_users WHERE LOWER(wallet_address) = LOWER(?)',
          [req.walletAddress],
          (balanceErr, profile) => {
            if (balanceErr) return res.status(500).json({ error: 'Unable to load your Battle Pass points.' });
            res.json({ packs, points: Number(profile?.points || 0) });
          }
        );
      }
    );
  });
});

app.get('/api/battlepass/vault', requireWalletSession, (req, res) => {
  db.all(
    `SELECT o.*, p.name AS pack_name, r.plan_id AS reward_plan_id,
            rp.name AS reward_plan_name,
            (SELECT COUNT(*) FROM battlepass_discount_certificates c WHERE c.opening_id = o.id) AS certificate_count
     FROM battlepass_pack_openings o
     JOIN battlepass_packs p ON p.id = o.pack_id
     JOIN battlepass_rewards r ON r.id = o.reward_id
     LEFT JOIN plans rp ON rp.id = r.plan_id
     WHERE LOWER(o.wallet_address) = LOWER(?)
     ORDER BY o.created_at DESC`,
    [req.walletAddress],
    (openingsErr, openings) => {
      if (openingsErr) return res.status(500).json({ error: 'Unable to load your reward vault.' });
      db.all(
        `SELECT c.code, c.opening_id, c.discount_pct, c.eligible_plan_id, c.redeemed_at,
                c.created_at, p.name AS eligible_plan_name, o.reward_name, o.reward_description
         FROM battlepass_discount_certificates c
         JOIN battlepass_pack_openings o ON o.id = c.opening_id
         LEFT JOIN plans p ON p.id = c.eligible_plan_id
         WHERE LOWER(c.wallet_address) = LOWER(?)
         ORDER BY c.created_at DESC`,
        [req.walletAddress],
        (certificatesErr, certificates) => {
          if (certificatesErr) return res.status(500).json({ error: 'Unable to load your discount certificates.' });
          const vault = (openings || []).map(opening => {
            let accountIds;
            try {
              accountIds = JSON.parse(opening.account_ids_json);
            } catch (parseErr) {
              console.error('Unable to decode Battle Pass account reward history:', parseErr.message);
              return null;
            }
            return {
              id: opening.id,
              pack_name: opening.pack_name,
              reward_name: opening.reward_name,
              reward_description: opening.reward_description,
              reward_type: opening.reward_type,
              quantity: Number(opening.quantity),
              xp_awarded: Number(opening.xp_awarded),
              points_awarded: Number(opening.points_awarded),
              account_ids: accountIds,
              account_plan_name: opening.reward_plan_name,
              certificate_count: Number(opening.certificate_count),
              points_spent: Number(opening.points_spent),
              created_at: opening.created_at
            };
          });
          if (vault.some(item => item === null)) return res.status(500).json({ error: 'Reward vault data could not be decoded.' });
          res.json({ rewards: vault, certificates: certificates || [] });
        }
      );
    }
  );
});

app.post('/api/battlepass/packs/open', sensitiveLimiter, requireWalletSession, requireUserNotSuspended, (req, res) => {
  const packId = Number(req.body?.pack_id);
  const requestKey = typeof req.body?.request_key === 'string' ? req.body.request_key : '';
  if (!Number.isInteger(packId) || packId < 1 ||
      !/^[a-zA-Z0-9_-]{16,80}$/.test(requestKey)) {
    return res.status(400).json({ error: 'Choose a valid pack and opening request.' });
  }
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start your pack opening.' });
      const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
      const commitError = (error, message) => {
        if (error) return rollback(500, message);
        res.status(409).json({ error: message });
      };
      db.get(
        `SELECT * FROM battlepass_pack_openings
         WHERE LOWER(wallet_address) = LOWER(?) AND request_key = ?`,
        [req.walletAddress, requestKey],
        (existingErr, existingOpening) => {
          if (existingErr) return rollback(500, 'Unable to check whether this pack was already opened.');
          if (existingOpening) {
            return db.all(
              'SELECT code, discount_pct, eligible_plan_id FROM battlepass_discount_certificates WHERE opening_id = ?',
              [existingOpening.id],
              (certErr, certificates) => {
                if (certErr) return rollback(500, 'Unable to load the previous pack result.');
                db.get(
                  'SELECT points FROM battlepass_users WHERE LOWER(wallet_address) = LOWER(?)',
                  [req.walletAddress],
                  (balanceErr, balance) => {
                    if (balanceErr) return rollback(500, 'Unable to load your points balance.');
                    let accountIds;
                    try {
                      accountIds = JSON.parse(existingOpening.account_ids_json);
                      if (!Array.isArray(accountIds)) throw new Error('Expected an account ID array.');
                    } catch (parseErr) {
                      console.error('Unable to decode a retried Battle Pass opening:', parseErr.message);
                      return rollback(500, 'The previous pack result could not be decoded.');
                    }
                    db.run('COMMIT', commitErr => {
                      if (commitErr) return res.status(500).json({ error: 'Unable to return the previous pack result.' });
                      res.json({
                        success: true,
                        already_opened: true,
                        opening: {
                          id: existingOpening.id,
                          pack_id: Number(existingOpening.pack_id),
                          reward_name: existingOpening.reward_name,
                          reward_description: existingOpening.reward_description,
                          reward_type: existingOpening.reward_type,
                          quantity: Number(existingOpening.quantity),
                          xp_awarded: Number(existingOpening.xp_awarded),
                          points_awarded: Number(existingOpening.points_awarded),
                          account_ids: accountIds,
                          points_spent: Number(existingOpening.points_spent)
                        },
                        certificates: certificates || [],
                        points: Number(balance?.points || 0)
                      });
                    });
                  }
                );
              }
            );
          }
          db.get(
            'SELECT * FROM battlepass_packs WHERE id = ?',
            [packId],
            (packErr, pack) => {
              if (packErr) return rollback(500, 'Unable to load this reward pack.');
              if (!pack) return rollback(404, 'Battle Pass pack not found.');
              db.all(
                `SELECT pr.reward_id, pr.odds, pr.max_drops, r.*, pl.active AS plan_active,
                        (SELECT COUNT(*) FROM battlepass_pack_openings o
                         WHERE o.pack_id = pr.pack_id AND o.reward_id = pr.reward_id) AS drops
                 FROM battlepass_pack_rewards pr
                 JOIN battlepass_rewards r ON r.id = pr.reward_id
                 LEFT JOIN plans pl ON pl.id = r.plan_id
                 WHERE pr.pack_id = ? ORDER BY pr.reward_id`,
                [packId],
                (poolErr, pool) => {
                  if (poolErr) return rollback(500, 'Unable to load this pack reward pool.');
                  const capped = (pool || []).filter(entry =>
                    Number(entry.max_drops) > 0 && Number(entry.drops) >= Number(entry.max_drops));
                  if (capped.length) {
                    db.run('UPDATE battlepass_packs SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [packId], updateErr => {
                      if (updateErr) return rollback(500, 'Unable to disable this capped reward pack.');
                      const notifyNext = index => {
                        if (index >= capped.length) {
                          return db.run('COMMIT', commitErr => commitError(commitErr, 'This pack is out of stock.'));
                        }
                        const entry = capped[index];
                        insertBattlePassPackCapNotification(pack, entry, notifyErr => notifyErr
                          ? rollback(500, 'Unable to notify administrators about the capped pack.')
                          : notifyNext(index + 1));
                      };
                      notifyNext(0);
                    });
                    return;
                  }
                  const oddsValidation = validatePackRewardPool(pool || []);
                  if (Number(pack.active) !== 1) return rollback(409, 'This pack is out of stock.');
                  if (!oddsValidation.valid) return rollback(409, 'This pack is unavailable because its reward pool is invalid.');
                  const unavailableReward = pool.find(entry =>
                    Number(entry.active) !== 1 || (entry.reward_type === 'ACCOUNT' && Number(entry.plan_active) !== 1));
                  if (unavailableReward) return rollback(409, `${unavailableReward.name} is currently unavailable. This pack cannot be opened.`);
                  db.get(
                    'SELECT points FROM battlepass_users WHERE LOWER(wallet_address) = LOWER(?)',
                    [req.walletAddress],
                    (balanceErr, balance) => {
                      if (balanceErr) return rollback(500, 'Unable to load your Battle Pass points.');
                      if (!balance || Number(balance.points) < Number(pack.points_cost)) {
                        return rollback(409, 'You do not have enough Battle Pass points for this pack.');
                      }
                      let selectedReward;
                      try {
                        selectedReward = selectWeightedReward(pool, crypto.randomInt(10000) / 100);
                      } catch (selectionErr) {
                        console.error('Unable to select a Battle Pass pack reward:', selectionErr.message);
                        return rollback(500, 'Unable to select a reward from this pack.');
                      }
                      db.run(
                        `UPDATE battlepass_users
                         SET points = points - ?, updated_at = CURRENT_TIMESTAMP
                         WHERE LOWER(wallet_address) = LOWER(?) AND points >= ?`,
                        [Number(pack.points_cost), req.walletAddress, Number(pack.points_cost)],
                        function(spendErr) {
                          if (spendErr) return rollback(500, 'Unable to spend your Battle Pass points.');
                          if (this.changes !== 1) return rollback(409, 'Your points balance changed. Refresh and try again.');
                          const openingId = `bpo_${crypto.randomBytes(12).toString('hex')}`;
                          const quantity = Number(selectedReward.quantity);
                          const accountIds = [];
                          const allocateAccount = (index, callback) => {
                            if (index >= quantity) return callback(null);
                            const accountId = `acc_${crypto.randomBytes(8).toString('hex')}`;
                            const initialBalance = Number(selectedReward.simulated_capital);
                            db.run(
                              `INSERT INTO accounts
                               (id, wallet_address, plan_id, initial_balance, current_balance,
                                current_equity, high_water_mark, daily_starting_balance, risk_day, status)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
                              [
                                accountId, req.walletAddress, Number(selectedReward.plan_id), initialBalance,
                                initialBalance, initialBalance, initialBalance, initialBalance,
                                new Date().toISOString().slice(0, 10)
                              ],
                              accountErr => {
                                if (accountErr) return callback(accountErr);
                                accountIds.push(accountId);
                                allocateAccount(index + 1, callback);
                              }
                            );
                          };
                          const accountPlan = callback => {
                            if (selectedReward.reward_type !== 'ACCOUNT') return callback(null);
                            db.get(
                              'SELECT simulated_capital FROM plans WHERE id = ? AND active = 1',
                              [selectedReward.plan_id],
                              (planErr, plan) => {
                                if (planErr) return callback(planErr);
                                if (!plan) return callback(new Error('The reward account type is no longer active.'));
                                selectedReward.simulated_capital = Number(plan.simulated_capital);
                                allocateAccount(0, callback);
                              }
                            );
                          };
                          accountPlan(accountErr => {
                            if (accountErr) return rollback(accountErr.message.includes('no longer active') ? 409 : 500,
                              accountErr.message.includes('no longer active') ? accountErr.message : 'Unable to allocate the account reward.');
                            const xpAwarded = selectedReward.reward_type === 'XP'
                              ? Number(selectedReward.xp_amount) * quantity : 0;
                            const pointsAwarded = selectedReward.reward_type === 'POINTS'
                              ? Number(selectedReward.points_amount) * quantity : 0;
                            const addBalance = callback => {
                              if (!xpAwarded && !pointsAwarded) return callback(null);
                              db.run(
                                `UPDATE battlepass_users
                                 SET xp = xp + ?, points = points + ?, updated_at = CURRENT_TIMESTAMP
                                 WHERE LOWER(wallet_address) = LOWER(?)`,
                                [xpAwarded, pointsAwarded, req.walletAddress],
                                balanceUpdateErr => callback(balanceUpdateErr)
                              );
                            };
                            db.run(
                              `INSERT INTO battlepass_pack_openings
                               (id, request_key, wallet_address, pack_id, reward_id, points_spent, reward_type,
                                reward_name, reward_description, quantity, xp_awarded, points_awarded, account_ids_json)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                              [
                                openingId, requestKey, req.walletAddress, packId, selectedReward.reward_id,
                                Number(pack.points_cost), selectedReward.reward_type, selectedReward.name,
                                selectedReward.description, quantity, xpAwarded, pointsAwarded,
                                JSON.stringify(accountIds)
                              ],
                              insertOpeningErr => {
                                if (insertOpeningErr) return rollback(500, 'Unable to save the pack reward to your vault.');
                                const insertRewardEvent = callback => {
                                  if (!xpAwarded && !pointsAwarded) return callback(null);
                                  db.run(
                                    `INSERT INTO battlepass_events
                                     (id, wallet_address, event_type, reference_id, xp, points)
                                     VALUES (?, ?, 'PACK_REWARD', ?, ?, ?)`,
                                    [`bpe_${crypto.randomBytes(10).toString('hex')}`, req.walletAddress, openingId, xpAwarded, pointsAwarded],
                                    callback
                                  );
                                };
                                const finishOpening = certificates => addBalance(balanceUpdateErr => {
                                  if (balanceUpdateErr) return rollback(500, 'Unable to apply your XP or points reward.');
                                  insertRewardEvent(eventErr => {
                                    if (eventErr) return rollback(500, 'Unable to record your reward history.');
                                      const capReached = Number(selectedReward.max_drops) > 0 &&
                                        Number(selectedReward.drops) + 1 >= Number(selectedReward.max_drops);
                                      const notifyCap = next => {
                                        if (!capReached) return next(null);
                                        db.run(
                                          'UPDATE battlepass_packs SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                                          [packId],
                                          updateErr => updateErr
                                            ? next(updateErr)
                                            : insertBattlePassPackCapNotification(pack, selectedReward, next)
                                        );
                                      };
                                      notifyCap(capErr => {
                                        if (capErr) return rollback(500, 'Unable to record the reward cap notification.');
                                        db.get(
                                          'SELECT points FROM battlepass_users WHERE LOWER(wallet_address) = LOWER(?)',
                                          [req.walletAddress],
                                          (finalBalanceErr, finalBalance) => {
                                            if (finalBalanceErr) return rollback(500, 'Unable to load your updated points balance.');
                                            db.run('COMMIT', commitErr => {
                                              if (commitErr) return res.status(500).json({ error: 'Unable to complete your pack opening.' });
                                              res.json({
                                                success: true,
                                                opening: {
                                                  id: openingId,
                                                  pack_id: packId,
                                                  reward_name: selectedReward.name,
                                                  reward_description: selectedReward.description,
                                                  reward_type: selectedReward.reward_type,
                                                  quantity,
                                                  xp_awarded: xpAwarded,
                                                  points_awarded: pointsAwarded,
                                                  account_ids: accountIds,
                                                  points_spent: Number(pack.points_cost)
                                                },
                                                certificates,
                                                points: Number(finalBalance?.points || 0),
                                                pack_out_of_stock: capReached
                                              });
                                            });
                                          }
                                        );
                                      });
                                    });
                                  });
                                });
                                createBattlePassDiscountCertificates({
                                  db,
                                  openingId,
                                  walletAddress: req.walletAddress,
                                  reward: selectedReward,
                                  quantity
                                }, (certificateErr, certificates) => {
                                  if (certificateErr) return rollback(500, 'Unable to create your discount certificate.');
                                  finishOpening(certificates);
                                });
                              }
                            );
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
  });
});

app.get('/api/battlepass/profile', (req, res) => {
  const username = typeof req.query.username === 'string' ? req.query.username.trim() : '';
  if (!/^[a-z0-9_]{3,24}$/i.test(username)) {
    return res.status(400).json({ error: 'A valid battle pass username is required.' });
  }
  db.get(
    `SELECT u.username, b.xp, b.profile_image_url,
            (SELECT d.title FROM battlepass_level_titles t
             JOIN battlepass_level_definitions d ON d.level = t.level
             WHERE LOWER(t.wallet_address) = LOWER(b.wallet_address)
             ORDER BY t.level DESC LIMIT 1) AS title
     FROM users u LEFT JOIN battlepass_users b ON LOWER(b.wallet_address) = LOWER(u.wallet_address)
     WHERE LOWER(u.username) = LOWER(?)`,
    [username],
    (err, profile) => {
      if (err) return res.status(500).json({ error: 'Unable to load this public battle pass profile.' });
      if (!profile) return res.status(404).json({ error: 'Battle pass profile not found.' });
      const xp = Number(profile.xp || 0);
      res.json({
        profile: {
          username: profile.username,
          xp,
            level: getBattlePassLevel(xp),
            profile_image_url: profile.profile_image_url,
            title: profile.title || null
          }
      });
    }
  );
});

app.post('/api/battlepass/profile', sensitiveLimiter, requireWalletSession, (req, res) => {
  const imageUrl = typeof req.body?.profile_image_url === 'string' ? req.body.profile_image_url.trim() : '';
  if (imageUrl.length > 2048) return res.status(400).json({ error: 'Profile image URL must be 2,048 characters or fewer.' });
  if (imageUrl) {
    try {
      const parsed = new URL(imageUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported profile image URL scheme.');
    } catch {
      return res.status(400).json({ error: 'Enter a valid HTTP or HTTPS profile image URL.' });
    }
  }
  db.run(
    `INSERT INTO battlepass_users (wallet_address, profile_image_url)
     VALUES (?, ?)
     ON CONFLICT(wallet_address) DO UPDATE SET profile_image_url = excluded.profile_image_url,
       updated_at = CURRENT_TIMESTAMP`,
    [req.walletAddress, imageUrl || null],
    (err) => {
      if (err) return res.status(500).json({ error: 'Unable to update your battle pass profile.' });
      res.json({ success: true, profile_image_url: imageUrl || null });
    }
  );
});

function claimBattlePassPurchaseTask(task, wallet, res) {
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start purchase task reward.' });
      const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
      getBattlePassPurchaseTaskReferences(task, wallet, (purchaseErr, purchases) => {
        if (purchaseErr) return rollback(500, 'Unable to verify unclaimed purchases.');
        if (!purchases?.length) return rollback(409, 'There are no new purchases to claim for this task.');
        const claimId = `bpt_${crypto.randomBytes(10).toString('hex')}`;
        let index = 0;
        const insertClaims = () => {
          if (index >= purchases.length) return applyRewards();
          const purchase = purchases[index++];
          db.run(
            `INSERT INTO battlepass_task_claims (id, wallet_address, task_id, cadence, period_key)
             VALUES (?, ?, ?, 'ONCE', ?)`,
            [`${claimId}_${index}`, wallet, task.id, purchase.reference_id],
            claimErr => {
              if (claimErr) {
                if (claimErr.code === 'SQLITE_CONSTRAINT') return rollback(409, 'A purchase reward was already claimed.');
                return rollback(500, 'Unable to record the purchase task reward.');
              }
              insertClaims();
            }
          );
        };
        const applyRewards = () => {
          const xpAwarded = Number(task.xp_reward) * purchases.length;
          const pointsAwarded = Number(task.points_reward) * purchases.length;
          db.run('INSERT OR IGNORE INTO battlepass_users (wallet_address) VALUES (?)', [wallet], userErr => {
            if (userErr) return rollback(500, 'Unable to load your battle pass balance.');
            db.run(
              `UPDATE battlepass_users SET xp = xp + ?, points = points + ?, updated_at = CURRENT_TIMESTAMP
               WHERE LOWER(wallet_address) = LOWER(?)`,
              [xpAwarded, pointsAwarded, wallet],
              balanceErr => {
                if (balanceErr) return rollback(500, 'Unable to add your purchase task reward.');
                db.run(
                  `INSERT INTO battlepass_events (id, wallet_address, event_type, reference_id, xp, points)
                   VALUES (?, ?, 'TASK', ?, ?, ?)`,
                  [`bpe_${crypto.randomBytes(10).toString('hex')}`, wallet, `${claimId}:${task.id}`, xpAwarded, pointsAwarded],
                  eventErr => {
                    if (eventErr) return rollback(500, 'Unable to record your purchase task reward history.');
                    db.run('COMMIT', commitErr => {
                      if (commitErr) return rollback(500, 'Unable to complete purchase task reward.');
                      res.json({
                        success: true,
                        xp_awarded: xpAwarded,
                        points_awarded: pointsAwarded,
                        purchase_units_claimed: purchases.length
                      });
                    });
                  }
                );
              }
            );
          });
        };
        insertClaims();
      });
    });
  });
}

app.post('/api/battlepass/tasks/claim', sensitiveLimiter, requireWalletSession, (req, res) => {
  const taskId = Number(req.body?.task_id);
  if (!Number.isInteger(taskId) || taskId <= 0) return res.status(400).json({ error: 'Choose a valid battle pass task.' });
  db.get('SELECT id, task_type, cadence, plan_id, created_at, xp_reward, points_reward FROM battlepass_tasks WHERE id = ? AND active = 1', [taskId], (taskErr, task) => {
    if (taskErr) return res.status(500).json({ error: 'Unable to load this battle pass task.' });
    if (!task) return res.status(404).json({ error: 'This battle pass task is no longer available.' });
    if ((task.task_type === 'GREEN_DAY' && task.cadence !== 'DAILY') ||
        (task.task_type === 'GREEN_WEEK' && task.cadence !== 'WEEKLY') ||
        (task.task_type === 'JOURNAL_DAY' && task.cadence !== 'DAILY') ||
        (task.task_type === 'JOURNAL_WEEK' && task.cadence !== 'WEEKLY') ||
        (task.task_type === 'JOURNAL_MONTH' && task.cadence !== 'MONTHLY') ||
        (['PURCHASE_ANY', 'PURCHASE_PLAN'].includes(task.task_type) && task.cadence !== 'ONCE')) {
      return res.status(409).json({ error: 'This task has an invalid completion schedule.' });
    }
    if (task.task_type === 'PURCHASE_ANY' || task.task_type === 'PURCHASE_PLAN') {
      return claimBattlePassPurchaseTask(task, req.walletAddress, res);
    }
    const taskPeriod = getBattlePassTaskPeriod(task);
    const periodKey = taskPeriod.claimPeriodKey;
    getBattlePassTaskEligibility(task, req.walletAddress, taskPeriod.activityPeriodKey, (eligibilityErr, eligible) => {
      if (eligibilityErr) return res.status(500).json({ error: eligibilityErr.message });
      if (!eligible) return res.status(409).json({ error: 'This task reward is not available yet.' });
    const claimId = `bpt_${crypto.randomBytes(10).toString('hex')}`;
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE', (beginErr) => {
        if (beginErr) return res.status(500).json({ error: 'Unable to start task reward.' });
        const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
        db.run(
          `INSERT INTO battlepass_task_claims (id, wallet_address, task_id, cadence, period_key)
           VALUES (?, ?, ?, ?, ?)`,
          [claimId, req.walletAddress, task.id, task.cadence, periodKey],
          (claimErr) => {
            if (claimErr) {
              if (claimErr.code === 'SQLITE_CONSTRAINT') return rollback(409, 'You have already earned this task reward for the current period.');
              return rollback(500, 'Unable to record this task reward.');
            }
            db.run('INSERT OR IGNORE INTO battlepass_users (wallet_address) VALUES (?)', [req.walletAddress], (userErr) => {
              if (userErr) return rollback(500, 'Unable to load your battle pass balance.');
              db.run(
                `UPDATE battlepass_users SET xp = xp + ?, points = points + ?, updated_at = CURRENT_TIMESTAMP
                 WHERE LOWER(wallet_address) = LOWER(?)`,
                [task.xp_reward, task.points_reward, req.walletAddress],
                (balanceErr) => {
                  if (balanceErr) return rollback(500, 'Unable to add your task reward.');
                  db.run(
                    `INSERT INTO battlepass_events (id, wallet_address, event_type, reference_id, xp, points)
                     VALUES (?, ?, 'TASK', ?, ?, ?)`,
                    [`bpe_${crypto.randomBytes(10).toString('hex')}`, req.walletAddress, `${req.walletAddress}:${task.id}:${periodKey}`, task.xp_reward, task.points_reward],
                    (eventErr) => {
                      if (eventErr) return rollback(500, 'Unable to record your task reward history.');
                      db.run('COMMIT', (commitErr) => {
                        if (commitErr) return rollback(500, 'Unable to complete task reward.');
                        res.json({
                          success: true,
                          xp_awarded: task.xp_reward,
                          points_awarded: task.points_reward,
                          period_key: periodKey
                        });
                      });
                    }
                  );
                }
              );
            });
          }
        );
      });
    });
    });
  });
});

app.post('/api/battlepass/titles/claim', sensitiveLimiter, requireWalletSession, (req, res) => {
  const level = Number(req.body?.level);
  if (!Number.isInteger(level) || level < 1 || level > 12) {
    return res.status(400).json({ error: 'Choose a valid battle pass level title.' });
  }
  db.get('SELECT xp FROM battlepass_users WHERE LOWER(wallet_address) = LOWER(?)', [req.walletAddress], (userErr, user) => {
    if (userErr) return res.status(500).json({ error: 'Unable to load your battle pass balance.' });
    if (!user) return res.status(404).json({ error: 'Battle pass profile not found.' });
    db.get(
      `SELECT l.level, l.xp_required, d.title FROM battlepass_levels l
       JOIN battlepass_level_definitions d ON d.level = l.level WHERE l.level = ?`,
      [level],
      (levelErr, reward) => {
      if (levelErr) return res.status(500).json({ error: 'Unable to load this level title.' });
      if (!reward) return res.status(404).json({ error: 'Battle pass level not found.' });
      if (Number(user.xp) < Number(reward.xp_required)) {
        return res.status(403).json({ error: 'Earn more XP to unlock this level title.' });
      }
      db.serialize(() => {
        db.run('BEGIN IMMEDIATE', (beginErr) => {
          if (beginErr) return res.status(500).json({ error: 'Unable to start level title claim.' });
          const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
          db.run(
            `INSERT INTO battlepass_level_titles (wallet_address, level)
             VALUES (?, ?)`,
            [req.walletAddress, level],
            (insertErr) => {
              if (insertErr) {
                if (insertErr.code === 'SQLITE_CONSTRAINT') return rollback(409, 'This level title has already been claimed.');
                return rollback(500, 'Unable to save your level title.');
              }
              db.run(
                `INSERT INTO battlepass_events (id, wallet_address, event_type, reference_id, xp, points)
                 VALUES (?, ?, 'LEVEL_TITLE', ?, 0, 0)`,
                [`bpe_${crypto.randomBytes(10).toString('hex')}`, req.walletAddress, `${req.walletAddress}:level-title:${level}`],
                (eventErr) => {
                  if (eventErr) return rollback(500, 'Unable to record your level title claim.');
                  db.run('COMMIT', (commitErr) => {
                    if (commitErr) return rollback(500, 'Unable to complete level title claim.');
                    res.json({ success: true, level, title: reward.title });
                  });
                }
              );
            }
          );
        });
      });
    });
  });
});

app.get('/api/auth/role', requireWalletSession, (req, res) => {
  const wallet = req.walletAddress;
  const adminWalletPredicate = req.walletType === 'SOLANA'
    ? 'wallet_address = ?'
    : 'LOWER(wallet_address) = LOWER(?)';
  db.get(`SELECT role FROM admins WHERE ${adminWalletPredicate}`, [wallet], (err, admin) => {
    if (err) return res.status(500).json({ error: 'Unable to load wallet roles.' });
    const staffWalletPredicate = req.walletType === 'SOLANA'
      ? 'wallet_address = ?'
      : 'LOWER(wallet_address) = LOWER(?)';
    db.get(
      `SELECT role FROM support_staff WHERE ${staffWalletPredicate} AND active = 1`,
      [wallet],
      (staffErr, staff) => {
        if (staffErr) return res.status(500).json({ error: 'Unable to load wallet roles.' });
        res.json({
          isAdmin: !!admin,
          isSupportStaff: !admin && staff?.role === 'SUPPORT'
        });
      }
    );
  });
});

app.get('/api/admin/operations/dashboard', requireWalletSession, requireAdminSession, (req, res) => {
  const activeCutoff = Date.now() - SESSION_IDLE_TIMEOUT_MS;
  db.get(
    `SELECT
       (SELECT COUNT(DISTINCT LOWER(wallet_address)) FROM users) AS all_time_wallets,
       (SELECT COUNT(DISTINCT LOWER(wallet_address)) FROM wallet_sessions
        WHERE expires_at > ? AND last_seen_at > ? AND revoked_at IS NULL) AS active_wallets`,
    [Date.now(), activeCutoff],
    (walletErr, wallets) => {
      if (walletErr) return res.status(500).json({ error: 'Unable to load wallet activity totals.' });
      db.get(
        `SELECT COUNT(CASE WHEN amount_usdt > 0
                                AND UPPER(COALESCE(payment_asset, 'USDT')) IN ('USDT', 'USDC')
                                AND substr(LOWER(tx_hash), 1, 5) NOT IN ('free_', 'pass_') THEN 1 END) AS verified_purchases,
                COALESCE(SUM(CASE WHEN amount_usdt > 0
                                  AND UPPER(COALESCE(payment_asset, 'USDT')) IN ('USDT', 'USDC')
                                  AND substr(LOWER(tx_hash), 1, 5) NOT IN ('free_', 'pass_')
                                  THEN amount_usdt ELSE 0 END), 0) AS sales_stablecoins_usd,
                COALESCE(SUM(CASE WHEN amount_usdt > 0 AND UPPER(COALESCE(payment_asset, 'USDT')) = 'USDT'
                                  AND substr(LOWER(tx_hash), 1, 5) NOT IN ('free_', 'pass_')
                                  THEN amount_usdt ELSE 0 END), 0) AS sales_usdt,
                COALESCE(SUM(CASE WHEN amount_usdt > 0 AND UPPER(COALESCE(payment_asset, 'USDT')) = 'USDC'
                                  AND substr(LOWER(tx_hash), 1, 5) NOT IN ('free_', 'pass_')
                                  THEN amount_usdt ELSE 0 END), 0) AS sales_usdc,
                COALESCE(SUM(CASE WHEN amount_usdt IS NULL
                                  AND UPPER(COALESCE(payment_asset, '')) != 'FREE'
                                  AND substr(LOWER(tx_hash), 1, 5) NOT IN ('free_', 'pass_')
                                  THEN 1 ELSE 0 END), 0) AS unpriced_legacy_purchases
         FROM purchases WHERE chain_id > 0`,
        [],
        (salesErr, sales) => {
          if (salesErr) return res.status(500).json({ error: 'Unable to load purchase totals.' });
          db.get(
            `SELECT COUNT(*) AS total_requests,
                    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
                    SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_count,
                    SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) AS paid_count,
                    COALESCE(SUM(CASE WHEN status = 'PENDING' AND payout_asset = 'USDT' THEN payout_amount ELSE 0 END), 0) AS pending_usdt,
                    COALESCE(SUM(CASE WHEN status = 'PENDING' AND payout_asset = 'USDC' THEN payout_amount ELSE 0 END), 0) AS pending_usdc,
                    COALESCE(SUM(CASE WHEN status = 'APPROVED' AND payout_asset = 'USDT' THEN payout_amount ELSE 0 END), 0) AS approved_usdt,
                    COALESCE(SUM(CASE WHEN status = 'APPROVED' AND payout_asset = 'USDC' THEN payout_amount ELSE 0 END), 0) AS approved_usdc,
                    COALESCE(SUM(CASE WHEN status = 'PAID' AND payout_asset = 'USDT' THEN payout_amount ELSE 0 END), 0) AS paid_usdt,
                    COALESCE(SUM(CASE WHEN status = 'PAID' AND payout_asset = 'USDC' THEN payout_amount ELSE 0 END), 0) AS paid_usdc
             FROM (
                       SELECT status, COALESCE(user_amount, ROUND(amount * 0.9, 2)) AS payout_amount,
                              COALESCE(payout_asset, 'USDT') AS payout_asset
               FROM withdrawals
               UNION ALL
                       SELECT status, amount AS payout_amount, COALESCE(payout_asset, 'USDT') AS payout_asset
                       FROM referral_withdrawals
             ) payouts`,
            [],
            (withdrawalErr, withdrawals) => {
              if (withdrawalErr) return res.status(500).json({ error: 'Unable to load withdrawal totals.' });
              db.get(
                `SELECT COUNT(*) AS pending_tickets FROM support_tickets WHERE status != 'CLOSED'`,
                [],
                (ticketErr, tickets) => {
                  if (ticketErr) return res.status(500).json({ error: 'Unable to load ticket totals.' });
                  db.get(
                    `SELECT COUNT(*) AS pending_reviews FROM user_reviews WHERE moderation_status = 'PENDING'`,
                    [],
                    (reviewErr, reviews) => {
                      if (reviewErr) return res.status(500).json({ error: 'Unable to load review totals.' });
                      db.all(
                        `SELECT 'purchase:' || p.tx_hash AS event_id, 'ACCOUNT_PURCHASE' AS event_type,
                                p.created_at AS occurred_at, p.wallet_address, COALESCE(u.username, '') AS username,
                                p.tx_hash, p.chain_id, COALESCE(p.amount_usdt, 0) AS amount_usdt,
                                COALESCE(p.payment_asset, 'USDT') AS payment_asset,
                                p.quantity, COALESCE(pl.name, 'Trading account') AS plan_name,
                                a.id AS account_id, NULL AS status, NULL AS withdrawal_type
                         FROM purchases p
                         LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(p.wallet_address)
                         LEFT JOIN accounts a ON a.id = p.account_id
                         LEFT JOIN plans pl ON pl.id = a.plan_id
                         WHERE p.chain_id > 0
                         UNION ALL
                         SELECT 'withdrawal:' || w.id || ':' || w.status AS event_id,
                                CASE w.status WHEN 'PAID' THEN 'PERFORMANCE_PAYOUT_PAID'
                                  WHEN 'APPROVED' THEN 'PERFORMANCE_PAYOUT_APPROVED'
                                  WHEN 'REJECTED' THEN 'PERFORMANCE_PAYOUT_REJECTED'
                                  ELSE 'PERFORMANCE_PAYOUT_REQUESTED' END AS event_type,
                                CASE WHEN w.status = 'PAID' THEN COALESCE(w.paid_at, w.created_at)
                                  WHEN w.status = 'APPROVED' THEN COALESCE(w.approved_at, w.created_at)
                                  ELSE w.created_at END AS occurred_at,
                                w.wallet_address, COALESCE(u.username, '') AS username,
                                w.payout_tx_hash AS tx_hash, w.payout_chain_id AS chain_id,
                                COALESCE(w.user_amount, ROUND(w.amount * 0.9, 2)) AS amount_usdt,
                                COALESCE(w.payout_asset, 'USDT') AS payment_asset,
                                1 AS quantity, COALESCE(pl.name, w.plan_name, 'Trading account') AS plan_name,
                                w.account_id, w.status, 'ACCOUNT' AS withdrawal_type
                         FROM withdrawals w
                         LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(w.wallet_address)
                         LEFT JOIN accounts a ON a.id = w.account_id
                         LEFT JOIN plans pl ON pl.id = a.plan_id
                         UNION ALL
                         SELECT 'referral-withdrawal:' || rw.id || ':' || rw.status AS event_id,
                                CASE rw.status WHEN 'PAID' THEN 'REFERRAL_PAYOUT_PAID'
                                  WHEN 'REJECTED' THEN 'REFERRAL_PAYOUT_REJECTED'
                                  ELSE 'REFERRAL_PAYOUT_REQUESTED' END AS event_type,
                                CASE WHEN rw.status = 'PAID' THEN COALESCE(rw.paid_at, rw.created_at) ELSE rw.created_at END AS occurred_at,
                                rw.wallet_address, COALESCE(u.username, '') AS username,
                                rw.payout_tx_hash AS tx_hash, rw.payout_chain_id AS chain_id, rw.amount AS amount_usdt,
                                COALESCE(rw.payout_asset, 'USDT') AS payment_asset,
                                1 AS quantity, 'Referral commission' AS plan_name,
                                NULL AS account_id, rw.status, 'COMMISSION' AS withdrawal_type
                         FROM referral_withdrawals rw
                         LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(rw.wallet_address)
                         UNION ALL
                         SELECT 'ticket:' || t.id || ':created' AS event_id, 'TICKET_OPENED' AS event_type,
                                t.created_at AS occurred_at, t.wallet_address, COALESCE(u.username, '') AS username,
                                NULL AS tx_hash, NULL AS chain_id, 0 AS amount_usdt, NULL AS payment_asset, 1 AS quantity,
                                t.subject AS plan_name, t.account_id, t.status, NULL AS withdrawal_type
                         FROM support_tickets t
                         LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(t.wallet_address)
                         UNION ALL
                         SELECT 'review:' || r.account_id || ':' || r.updated_at AS event_id,
                                'REVIEW_PENDING' AS event_type, r.updated_at AS occurred_at,
                                r.wallet_address, r.username, NULL AS tx_hash, NULL AS chain_id,
                                0 AS amount_usdt, NULL AS payment_asset, 1 AS quantity, 'Review awaiting moderation' AS plan_name,
                                r.account_id, r.moderation_status AS status, NULL AS withdrawal_type
                         FROM user_reviews r WHERE r.moderation_status = 'PENDING'
                         UNION ALL
                         SELECT 'admin-notification:' || n.event_key AS event_id,
                                n.event_type, n.created_at AS occurred_at,
                                '' AS wallet_address, '' AS username, NULL AS tx_hash, NULL AS chain_id,
                                0 AS amount_usdt, NULL AS payment_asset, 1 AS quantity,
                                n.message AS plan_name, NULL AS account_id, NULL AS status, NULL AS withdrawal_type
                         FROM admin_notifications n WHERE n.event_type = 'REWARD_PACK_OUT_OF_STOCK'
                         ORDER BY occurred_at DESC LIMIT 50`,
                        [],
                        (eventErr, events) => {
                          if (eventErr) return res.status(500).json({ error: 'Unable to load recent operations activity.' });
                          res.json({
                            metrics: {
                              active_wallets: Number(wallets?.active_wallets || 0),
                              all_time_wallets: Number(wallets?.all_time_wallets || 0),
                              verified_purchases: Number(sales?.verified_purchases || 0),
                              sales_stablecoins_usd: Number(sales?.sales_stablecoins_usd || 0),
                              sales_usdt: Number(sales?.sales_usdt || 0),
                              sales_usdc: Number(sales?.sales_usdc || 0),
                              unpriced_legacy_purchases: Number(sales?.unpriced_legacy_purchases || 0),
                              withdrawal_requests: Number(withdrawals?.total_requests || 0),
                              paid_withdrawals: Number(withdrawals?.paid_count || 0),
                              pending_withdrawals: Number(withdrawals?.pending_count || 0),
                              pending_withdrawal_usdt: Number(withdrawals?.pending_usdt || 0),
                              pending_withdrawal_usdc: Number(withdrawals?.pending_usdc || 0),
                              approved_withdrawals: Number(withdrawals?.approved_count || 0),
                              approved_withdrawal_usdt: Number(withdrawals?.approved_usdt || 0),
                              approved_withdrawal_usdc: Number(withdrawals?.approved_usdc || 0),
                              paid_withdrawal_usdt: Number(withdrawals?.paid_usdt || 0),
                              paid_withdrawal_usdc: Number(withdrawals?.paid_usdc || 0),
                              pending_tickets: Number(tickets?.pending_tickets || 0),
                              pending_reviews: Number(reviews?.pending_reviews || 0)
                            },
                            events: events || []
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

app.get('/api/public/activity', publicActivityLimiter, (req, res) => {
  res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  db.all(
    `SELECT event_type, occurred_at, plan_name
     FROM (
       SELECT 'ACCOUNT_PURCHASE' AS event_type, p.created_at AS occurred_at,
              COALESCE(pl.name, 'Trading account') AS plan_name
       FROM purchases p
       LEFT JOIN accounts a ON a.id = p.account_id
       LEFT JOIN plans pl ON pl.id = a.plan_id
       WHERE p.chain_id > 0 AND COALESCE(p.amount_usdt, 0) > 0
       UNION ALL
       SELECT 'PERFORMANCE_PAYOUT_PAID' AS event_type, COALESCE(w.paid_at, w.created_at) AS occurred_at,
              'Trading performance payout' AS plan_name
       FROM withdrawals w WHERE w.status = 'PAID'
       UNION ALL
       SELECT 'REFERRAL_PAYOUT_PAID' AS event_type, COALESCE(rw.paid_at, rw.created_at) AS occurred_at,
              'Referral bonus payout' AS plan_name
       FROM referral_withdrawals rw WHERE rw.status = 'PAID'
     )
     ORDER BY occurred_at DESC LIMIT 12`,
    [],
    (err, events) => {
      if (err) return res.status(500).json({ error: 'Unable to load recent platform activity.' });
      res.json({ events: events || [] });
    }
  );
});

app.get('/api/leaderboard', (req, res) => {
  const mode = req.query.mode || 'DAILY';
  const requestedLimit = req.query.limit == null ? 100 : Number(req.query.limit);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 100) {
    return res.status(400).json({ error: 'Leaderboard limit must be an integer from 1 to 100.' });
  }
  const limit = requestedLimit;
  let query = '';

  if (mode === 'DAILY') {
    query = `
      SELECT u.username, u.discount_code, u.wallet_address, b.profile_image_url, COALESCE(b.xp, 0) AS battlepass_xp,
        COALESCE((SELECT d.title FROM battlepass_level_titles t JOIN battlepass_level_definitions d ON d.level = t.level WHERE LOWER(t.wallet_address) = LOWER(u.wallet_address) ORDER BY t.level DESC LIMIT 1), '') AS battlepass_title,
        SUM(t.pnl) as metric_value
      FROM users u
      LEFT JOIN battlepass_users b ON LOWER(b.wallet_address) = LOWER(u.wallet_address)
      JOIN accounts a ON LOWER(u.wallet_address) = LOWER(a.wallet_address)
      JOIN trades t ON a.id = t.account_id
      WHERE t.status = 'CLOSED' AND u.username IS NOT NULL AND COALESCE(u.leaderboard_hidden, 0) = 0
        AND strftime('%Y-%m-%d', t.closed_at) = strftime('%Y-%m-%d', 'now')
        AND EXISTS (SELECT 1 FROM accounts positive_account WHERE LOWER(positive_account.wallet_address) = LOWER(u.wallet_address)
                    AND positive_account.status = 'ACTIVE' AND COALESCE(positive_account.current_balance, 0) > 0)
      GROUP BY u.wallet_address
      ORDER BY metric_value DESC
      LIMIT ${limit};
    `;
  } else if (mode === 'MONTHLY') {
    query = `
      SELECT u.username, u.discount_code, u.wallet_address, b.profile_image_url, COALESCE(b.xp, 0) AS battlepass_xp,
        COALESCE((SELECT d.title FROM battlepass_level_titles t JOIN battlepass_level_definitions d ON d.level = t.level WHERE LOWER(t.wallet_address) = LOWER(u.wallet_address) ORDER BY t.level DESC LIMIT 1), '') AS battlepass_title,
        SUM(t.pnl) as metric_value
      FROM users u
      LEFT JOIN battlepass_users b ON LOWER(b.wallet_address) = LOWER(u.wallet_address)
      JOIN accounts a ON LOWER(u.wallet_address) = LOWER(a.wallet_address)
      JOIN trades t ON a.id = t.account_id
      WHERE t.status = 'CLOSED' AND u.username IS NOT NULL AND COALESCE(u.leaderboard_hidden, 0) = 0
        AND strftime('%Y-%m', t.closed_at) = strftime('%Y-%m', 'now')
        AND EXISTS (SELECT 1 FROM accounts positive_account WHERE LOWER(positive_account.wallet_address) = LOWER(u.wallet_address)
                    AND positive_account.status = 'ACTIVE' AND COALESCE(positive_account.current_balance, 0) > 0)
      GROUP BY u.wallet_address
      ORDER BY metric_value DESC
      LIMIT ${limit};
    `;
  } else if (mode === 'PAYOUTS') {
    query = `
      SELECT u.username, u.discount_code, u.wallet_address, b.profile_image_url, COALESCE(b.xp, 0) AS battlepass_xp,
        COALESCE((SELECT d.title FROM battlepass_level_titles t JOIN battlepass_level_definitions d ON d.level = t.level WHERE LOWER(t.wallet_address) = LOWER(u.wallet_address) ORDER BY t.level DESC LIMIT 1), '') AS battlepass_title,
        SUM(w.amount) as metric_value
      FROM users u
      LEFT JOIN battlepass_users b ON LOWER(b.wallet_address) = LOWER(u.wallet_address)
      JOIN (
        SELECT wallet_address, amount FROM withdrawals WHERE status IN ('APPROVED', 'PAID')
        UNION ALL
        SELECT wallet_address, amount FROM referral_withdrawals WHERE status = 'PAID'
      ) w ON LOWER(u.wallet_address) = LOWER(w.wallet_address)
      WHERE u.username IS NOT NULL AND COALESCE(u.leaderboard_hidden, 0) = 0
        AND EXISTS (SELECT 1 FROM accounts positive_account WHERE LOWER(positive_account.wallet_address) = LOWER(u.wallet_address)
                    AND positive_account.status = 'ACTIVE' AND COALESCE(positive_account.current_balance, 0) > 0)
      GROUP BY u.wallet_address
      ORDER BY metric_value DESC
      LIMIT ${limit};
    `;
  } else {
    return res.status(400).json({ error: "Invalid leaderboard mode" });
  }

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ leaderboard: rows || [], mode });
  });
});

app.post('/api/user/leaderboard-preference', sensitiveLimiter, requireWalletSession, (req, res) => {
  if (typeof req.body?.hidden !== 'boolean') {
    return res.status(400).json({ error: 'Choose whether your profile should be excluded from leaderboard rankings.' });
  }
  db.run(
    'UPDATE users SET leaderboard_hidden = ? WHERE LOWER(wallet_address) = LOWER(?)',
    [req.body.hidden ? 1 : 0, req.walletAddress],
    function (err) {
      if (err) return res.status(500).json({ error: 'Unable to save your leaderboard preference.' });
      if (this.changes !== 1) return res.status(404).json({ error: 'Set up your profile before changing this preference.' });
      res.json({ success: true, leaderboard_hidden: req.body.hidden });
    }
  );
});

app.get('/api/maintenance/status', (req, res) => {
  db.all(
    'SELECT page_id, is_offline, outage_message FROM site_maintenance ORDER BY page_id',
    [],
    (err, pages) => {
      if (err) return res.status(500).json({ error: 'Unable to load site maintenance status.' });
      res.json({
        pages: pages || [],
        outage_message: pages?.find(page => page.outage_message)?.outage_message || ''
      });
    }
  );
});

app.post('/api/admin/maintenance/load', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.all(
    'SELECT page_id, is_offline, outage_message, updated_at FROM site_maintenance ORDER BY page_id',
    [],
    (err, pages) => {
      if (err) return res.status(500).json({ error: 'Unable to load maintenance settings.' });
      res.json({
        pages: pages || [],
        outage_message: pages?.find(page => page.outage_message)?.outage_message || ''
      });
    }
  );
});

app.post('/api/admin/maintenance/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const offlinePages = req.body?.offline_pages;
  const outageMessage = typeof req.body?.outage_message === 'string' ? req.body.outage_message.trim() : '';
  if (!Array.isArray(offlinePages) ||
      offlinePages.some(pageId => typeof pageId !== 'string' || !MAINTENANCE_PAGE_IDS.includes(pageId)) ||
      new Set(offlinePages).size !== offlinePages.length) {
    return res.status(400).json({ error: 'Choose valid pages to place under maintenance.' });
  }
  if (outageMessage.length > 1000 || (offlinePages.length > 0 && !outageMessage)) {
    return res.status(400).json({ error: 'Enter an outage message of up to 1,000 characters for selected pages.' });
  }

  const offlineSet = new Set(offlinePages);
  const wallet = req.walletAddress;
  const rollback = error => db.run('ROLLBACK', () => res.status(500).json({ error }));
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start maintenance settings update.' });
      let index = 0;
      const saveNextPage = () => {
        if (index >= MAINTENANCE_PAGE_IDS.length) {
          return db.run('COMMIT', commitErr => {
            if (commitErr) return rollback('Unable to save maintenance settings.');
            res.json({ success: true });
          });
        }
        const pageId = MAINTENANCE_PAGE_IDS[index++];
        db.run(
          `INSERT INTO site_maintenance (page_id, is_offline, outage_message, updated_by, updated_at)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(page_id) DO UPDATE SET
             is_offline = excluded.is_offline,
             outage_message = excluded.outage_message,
             updated_by = excluded.updated_by,
             updated_at = CURRENT_TIMESTAMP`,
          [pageId, offlineSet.has(pageId) ? 1 : 0, outageMessage, wallet],
          saveErr => saveErr
            ? rollback('Unable to save maintenance settings.')
            : saveNextPage()
        );
      };
      saveNextPage();
    });
  });
});

app.get('/api/user/profile', requireWalletSession, (req, res) => {
  const wallet = req.query.wallet;
  if (typeof wallet !== 'string' || normalizeWalletAddress(wallet) !== req.walletAddress) {
    return res.status(403).json({ error: 'Wallet session does not match the requested profile.' });
  }

  db.get(
    `SELECT u.*,
            COALESCE(u.level_one_pct_override, rs.level_one_pct, 2) AS effective_referral_pct,
            COALESCE(u.level_two_pct_override, rs.level_two_pct, 2) AS effective_level_two_pct
     FROM users u LEFT JOIN referral_settings rs ON rs.id = 1
     WHERE LOWER(u.wallet_address) = LOWER(?)`,
    [wallet],
    (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    
    db.all(
      `SELECT COUNT(DISTINCT CASE WHEN level = 1 THEN referee_wallet END) AS total_referrals,
              SUM(commission_earned) AS total_earned
       FROM referrals WHERE LOWER(referrer_wallet) = LOWER(?)`,
      [wallet], 
      (err2, stats) => {
        if (err2) return res.status(500).json({ error: 'Unable to load referral totals.' });
        db.all(
          `SELECT SUM(amount) as total_withdrawn FROM referral_withdrawals WHERE LOWER(wallet_address) = LOWER(?) AND status != 'REJECTED'`,
          [wallet],
          (err3, wdrStats) => {
            if (err3) return res.status(500).json({ error: 'Unable to load referral withdrawal totals.' });
            const totalEarned = stats[0]?.total_earned || 0;
            const totalWithdrawn = wdrStats[0]?.total_withdrawn || 0;
            db.get(
              'SELECT x_url, youtube_url, tiktok_url, instagram_url, twitch_url, discord_url, website_url, community_size, community_description, creator_motivation, status, created_at, updated_at, reviewed_at FROM creator_applications WHERE LOWER(wallet_address) = LOWER(?)',
              [wallet],
              (applicationErr, application) => {
                if (applicationErr) return res.status(500).json({ error: 'Unable to load creator application.' });
                res.json({
                  user: user || null,
                  application: application || null,
                  stats: {
                    total_referrals: stats[0]?.total_referrals || 0,
                    total_earned: totalEarned,
                    available_commission: Math.max(0, totalEarned - totalWithdrawn)
                  }
                });
              }
            );
          }
        );
      }
    );
    }
  );
});

app.get('/api/user/withdrawal-certificates', requireWalletSession, (req, res) => {
  db.all(
    `SELECT id, COALESCE(user_amount, ROUND(amount * 0.9, 2)) AS amount,
            paid_at, created_at
     FROM withdrawals
     WHERE LOWER(wallet_address) = LOWER(?) AND status = 'PAID'
     UNION ALL
     SELECT id, amount, paid_at, created_at
     FROM referral_withdrawals
     WHERE LOWER(wallet_address) = LOWER(?) AND status = 'PAID'
     ORDER BY paid_at DESC, created_at DESC`,
    [req.walletAddress, req.walletAddress],
    (err, certificates) => {
      if (err) return res.status(500).json({ error: 'Unable to load your withdrawal certificates.' });
      db.get(
        'SELECT username FROM users WHERE LOWER(wallet_address) = LOWER(?)',
        [req.walletAddress],
        (userErr, user) => {
          if (userErr) return res.status(500).json({ error: 'Unable to load your certificate profile.' });
          res.json({
            username: user?.username || 'Blastrr Trader',
            certificates: (certificates || []).map(certificate => ({
              ...certificate,
              amount: Number(certificate.amount || 0)
            }))
          });
        }
      );
    }
  );
});

app.post('/api/user/profile', sensitiveLimiter, requireTradeSignature, (req, res) => {
  const { wallet_address, username, discount_code } = req.body;
  if (typeof username !== 'string' || typeof discount_code !== 'string') {
    return res.status(400).json({ error: "Username and promo code are required." });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanCode = discount_code.trim().toUpperCase();
  if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername) || !/^[A-Z0-9_-]{4,20}$/.test(cleanCode)) {
    return res.status(400).json({ error: "Username must be 3-24 letters, numbers, or underscores; promo codes must be 4-20 letters, numbers, underscores, or hyphens." });
  }

  db.get(
    `SELECT * FROM users WHERE (LOWER(username) = ? OR UPPER(discount_code) = ?) AND LOWER(wallet_address) != LOWER(?)`,
    [cleanUsername, cleanCode, wallet_address],
    (err, existing) => {
      if (err) return res.status(500).json({ error: err.message });
      if (existing) {
        if (existing.username.toLowerCase() === cleanUsername) {
          return res.status(400).json({ error: "Username is already taken by another user." });
        }
        return res.status(400).json({ error: "Promo Code is already taken by another user." });
      }

      db.run(
        `INSERT INTO users (wallet_address, username, discount_code) 
         VALUES (?, ?, ?)
         ON CONFLICT(wallet_address) DO UPDATE SET 
         username = excluded.username, 
         discount_code = excluded.discount_code`,
        [wallet_address, cleanUsername, cleanCode],
        (err2) => {
          if (err2) return res.status(400).json({ error: "Failed to update profile." });
          res.json({ success: true, message: "Profile updated successfully." });
        }
      );
    }
  );
});

app.post('/api/user/creator-application', sensitiveLimiter, requireTradeSignature, (req, res) => {
  const wallet = req.walletAddress;
  const linkFields = ['x_url', 'youtube_url', 'tiktok_url', 'instagram_url', 'twitch_url', 'discord_url', 'website_url'];
  const links = {};
  for (const field of linkFields) {
    const value = typeof req.body[field] === 'string' ? req.body[field].trim() : '';
    if (value.length > 300) return res.status(400).json({ error: 'Social profile links must be 300 characters or fewer.' });
    if (value) {
      try {
        const parsed = new URL(value);
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('Invalid URL');
      } catch {
        return res.status(400).json({ error: 'Enter valid http or https links for social profiles.' });
      }
    }
    links[field] = value || null;
  }
  if (!linkFields.some(field => links[field])) {
    return res.status(400).json({ error: 'Add at least one social profile link.' });
  }

  const communitySize = typeof req.body.community_size === 'string' ? req.body.community_size.trim() : '';
  const communityDescription = typeof req.body.community_description === 'string' ? req.body.community_description.trim() : '';
  const creatorMotivation = typeof req.body.creator_motivation === 'string' ? req.body.creator_motivation.trim() : '';
  const allowedCommunitySizes = ['Just me', '1-100', '101-1,000', '1,001-10,000', '10,001-100,000', '100,000+'];
  if (!allowedCommunitySizes.includes(communitySize) ||
      communityDescription.length < 10 || communityDescription.length > 1000 ||
      creatorMotivation.length < 10 || creatorMotivation.length > 1000) {
    return res.status(400).json({ error: 'Choose a community size and answer both questions in 10 to 1,000 characters.' });
  }

  db.run(
    `INSERT INTO creator_applications
      (wallet_address, x_url, youtube_url, tiktok_url, instagram_url, twitch_url, discord_url, website_url,
       community_size, community_description, creator_motivation, status, updated_at, reviewed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP, NULL)
     ON CONFLICT(wallet_address) DO UPDATE SET
       x_url = excluded.x_url,
       youtube_url = excluded.youtube_url,
       tiktok_url = excluded.tiktok_url,
       instagram_url = excluded.instagram_url,
       twitch_url = excluded.twitch_url,
       discord_url = excluded.discord_url,
       website_url = excluded.website_url,
       community_size = excluded.community_size,
       community_description = excluded.community_description,
       creator_motivation = excluded.creator_motivation,
       status = 'PENDING',
       updated_at = CURRENT_TIMESTAMP,
       reviewed_at = NULL`,
    [wallet, ...linkFields.map(field => links[field]), communitySize, communityDescription, creatorMotivation],
    err => {
      if (err) return res.status(500).json({ error: 'Unable to save creator application.' });
      res.json({ success: true, status: 'PENDING' });
    }
  );
});

app.post('/api/admin/creator-applications/list', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.all(
    `SELECT ca.*, u.username, COALESCE(u.level_one_pct_override, rs.level_one_pct, 2) AS referral_pct
     FROM creator_applications ca
     LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(ca.wallet_address)
     LEFT JOIN referral_settings rs ON rs.id = 1
     ORDER BY CASE ca.status WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 ELSE 2 END,
              ca.updated_at DESC
     LIMIT 200`,
    [],
    (err, applications) => {
      if (err) return res.status(500).json({ error: 'Unable to load creator applications.' });
      res.json({ applications: applications || [] });
    }
  );
});

app.post('/api/admin/creator-applications/action', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const wallet = req.body?.user_wallet;
  const action = req.body?.action;
  const referralPct = Number(req.body?.referral_pct);
  if (typeof wallet !== 'string' || !normalizeWalletAddress(wallet) || !['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Choose a valid creator application and approval action.' });
  }
  if (action === 'APPROVE' && (!Number.isFinite(referralPct) || referralPct < 0 || referralPct > 100)) {
    return res.status(400).json({ error: 'Choose a referral bonus from 0% to 100%.' });
  }

  const normalizedPct = Math.round(referralPct * 100) / 100;
  const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start creator application review.' });
      db.get(
        'SELECT wallet_address FROM creator_applications WHERE LOWER(wallet_address) = LOWER(?)',
        [wallet],
        (findErr, application) => {
          if (findErr) return rollback(500, 'Unable to load creator application.');
          if (!application) return rollback(404, 'Creator application not found.');
          const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
          db.run(
            'UPDATE creator_applications SET status = ?, updated_at = CURRENT_TIMESTAMP, reviewed_at = CURRENT_TIMESTAMP WHERE LOWER(wallet_address) = LOWER(?)',
            [status, wallet],
            updateErr => {
              if (updateErr) return rollback(500, 'Unable to update creator application status.');
              const finish = () => db.run('COMMIT', commitErr => {
                if (commitErr) return rollback(500, 'Unable to save creator application review.');
                res.json({ success: true, status, referral_pct: action === 'APPROVE' ? normalizedPct : 2 });
              });
              const rate = action === 'APPROVE' ? normalizedPct : 2;
              if (action === 'REJECT') {
                return db.run(
                  'UPDATE users SET referral_pct = 2, level_one_pct_override = NULL WHERE LOWER(wallet_address) = LOWER(?)',
                  [application.wallet_address],
                  rateErr => rateErr
                    ? rollback(500, 'Unable to reset creator referral bonus.')
                    : finish()
                );
              }
              db.run(
                `INSERT INTO users (wallet_address, referral_pct, level_one_pct_override)
                 SELECT ?, ?, ? WHERE NOT EXISTS (
                   SELECT 1 FROM users WHERE LOWER(wallet_address) = LOWER(?)
                 )`,
                [application.wallet_address, rate, rate, application.wallet_address],
                insertErr => {
                  if (insertErr) return rollback(500, 'Unable to assign creator referral bonus.');
                  db.run(
                    'UPDATE users SET referral_pct = ?, level_one_pct_override = ? WHERE LOWER(wallet_address) = LOWER(?)',
                    [rate, rate, application.wallet_address],
                    rateErr => rateErr
                      ? rollback(500, 'Unable to assign creator referral bonus.')
                      : finish()
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});

app.post('/api/promo/claim', sensitiveLimiter, requireWalletSession, (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  if (!/^FREE-[A-F0-9]{20}$/.test(code)) {
    return res.status(400).json({ error: 'Enter a valid free account code.' });
  }

  const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', (beginErr) => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start code redemption.' });
      db.get(
        `SELECT c.plan_id, c.claimed_by, c.claimed_at, p.name AS plan_name,
                p.simulated_capital
         FROM promo_codes c JOIN plans p ON p.id = c.plan_id
         WHERE c.code = ?`,
        [code],
        (codeErr, promo) => {
          if (codeErr) return rollback(500, 'Unable to check this free account code.');
          if (!promo) return rollback(404, 'Free account code not found.');
          if (promo.claimed_at || promo.claimed_by) return rollback(409, 'This free account code has already been claimed.');

          db.get(
            'SELECT wallet_address FROM users WHERE LOWER(wallet_address) = LOWER(?)',
            [req.walletAddress],
            (userErr, user) => {
              if (userErr) return rollback(500, 'Unable to prepare your account.');
              const walletAddress = user?.wallet_address || req.walletAddress;
              const createAccount = () => {
                const accountId = `acc_${crypto.randomBytes(8).toString('hex')}`;
                db.run(
                  `UPDATE promo_codes SET claimed_by = ?, claimed_at = CURRENT_TIMESTAMP
                   WHERE code = ? AND claimed_at IS NULL AND claimed_by IS NULL`,
                  [walletAddress, code],
                  function(claimErr) {
                    if (claimErr) return rollback(500, 'Unable to claim this free account code.');
                    if (this.changes !== 1) return rollback(409, 'This free account code has already been claimed.');
                    db.run(
                      `INSERT INTO accounts (id, wallet_address, plan_id, initial_balance, current_balance,
                         current_equity, high_water_mark, daily_starting_balance, risk_day, status)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
                      [
                        accountId, walletAddress, promo.plan_id, promo.simulated_capital,
                        promo.simulated_capital, promo.simulated_capital, promo.simulated_capital,
                        promo.simulated_capital, new Date().toISOString().slice(0, 10)
                      ],
                      (accountErr) => {
                        if (accountErr) return rollback(500, 'Unable to provision the free account.');
                        db.run('COMMIT', (commitErr) => {
                          if (commitErr) return rollback(500, 'Unable to commit free account provisioning.');
                          res.json({
                            success: true,
                            account_id: accountId,
                            plan_name: promo.plan_name,
                            message: 'Free account provisioned successfully.'
                          });
                        });
                      }
                    );
                  }
                );
              };

              if (user) return createAccount();
              db.run(
                'INSERT INTO users (wallet_address) VALUES (?)',
                [walletAddress],
                (insertUserErr) => {
                  if (insertUserErr) return rollback(500, 'Unable to prepare your account.');
                  createAccount();
                }
              );
            }
          );
        }
      );
    });
  });
});

function attachTicketMessages(tickets, callback) {
  if (!tickets.length) return callback(null, tickets);
  const ids = tickets.map(ticket => ticket.id);
  const placeholders = ids.map(() => '?').join(',');
  db.all(
    `SELECT id, ticket_id, author_role, author_name, body, created_at
     FROM support_ticket_messages WHERE ticket_id IN (${placeholders})
     ORDER BY created_at, id`,
    ids,
    (err, messages) => {
      if (err) return callback(err);
      const grouped = new Map(tickets.map(ticket => [ticket.id, []]));
      for (const message of messages || []) grouped.get(message.ticket_id)?.push(message);
      for (const ticket of tickets) ticket.messages = grouped.get(ticket.id) || [];
      callback(null, tickets);
    }
  );
}

app.get('/api/user/tickets', requireWalletSession, (req, res) => {
  const wallet = req.query.wallet;
  if (typeof wallet !== 'string' || normalizeWalletAddress(wallet) !== req.walletAddress) {
    return res.status(403).json({ error: 'Wallet session does not match the requested support tickets.' });
  }
  db.all(
    `SELECT t.*, p.name AS plan_name
     FROM support_tickets t
     LEFT JOIN accounts a ON a.id = t.account_id
     LEFT JOIN plans p ON p.id = a.plan_id
     WHERE LOWER(t.wallet_address) = LOWER(?)
     ORDER BY t.updated_at DESC, t.created_at DESC LIMIT 100`,
    [wallet],
    (err, tickets) => {
      if (err) return res.status(500).json({ error: 'Unable to load support tickets.' });
      attachTicketMessages(tickets || [], (messagesErr, results) => {
        if (messagesErr) return res.status(500).json({ error: 'Unable to load ticket replies.' });
        res.json({ tickets: results });
      });
    }
  );
});

app.post('/api/user/tickets', sensitiveLimiter, requireWalletSession, (req, res) => {
  const accountId = typeof req.body?.account_id === 'string' && req.body.account_id ? req.body.account_id : null;
  const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (subject.length < 5 || subject.length > 120 || message.length < 10 || message.length > 5000) {
    return res.status(400).json({ error: 'Enter a subject (5–120 characters) and issue details (10–5,000 characters).' });
  }

  const createTicket = (username) => {
    const ticketId = `ticket_${crypto.randomBytes(8).toString('hex')}`;
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE', (beginErr) => {
        if (beginErr) return res.status(500).json({ error: 'Unable to start support ticket.' });
        const rollback = (error) => db.run('ROLLBACK', () => res.status(500).json({ error }));
        db.run(
          `INSERT INTO support_tickets (id, wallet_address, account_id, subject, status)
           VALUES (?, ?, ?, ?, 'OPEN')`,
          [ticketId, req.walletAddress, accountId, subject],
          (ticketErr) => {
            if (ticketErr) return rollback('Unable to create support ticket.');
            db.run(
              `INSERT INTO support_ticket_messages (ticket_id, author_role, author_name, body)
               VALUES (?, 'USER', ?, ?)`,
              [ticketId, username || `${req.walletAddress.slice(0, 6)}…${req.walletAddress.slice(-4)}`, message],
              (messageErr) => {
                if (messageErr) return rollback('Unable to save the initial ticket message.');
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) return rollback('Unable to commit support ticket.');
                  res.status(201).json({ success: true, ticket_id: ticketId });
                });
              }
            );
          }
        );
      });
    });
  };

  const verifyAccount = (done) => {
    if (!accountId) return done(null, null);
    db.get(
      `SELECT id FROM accounts WHERE id = ? AND LOWER(wallet_address) = LOWER(?)`,
      [accountId, req.walletAddress],
      (err, account) => {
        if (err) return res.status(500).json({ error: 'Unable to verify the selected account.' });
        if (!account) return res.status(403).json({ error: 'The selected account does not belong to this wallet.' });
        done(null, account);
      }
    );
  };
  verifyAccount(() => {
    db.get('SELECT username FROM users WHERE LOWER(wallet_address) = LOWER(?)', [req.walletAddress], (userErr, user) => {
      if (userErr) return res.status(500).json({ error: 'Unable to load profile for support ticket.' });
      createTicket(user?.username);
    });
  });
});

app.post('/api/user/tickets/:ticketId/reply', sensitiveLimiter, requireWalletSession, (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (message.length < 1 || message.length > 5000) {
    return res.status(400).json({ error: 'Ticket replies must be between 1 and 5,000 characters.' });
  }
  db.get(
    `SELECT t.id, t.status, u.username FROM support_tickets t
     LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(t.wallet_address)
     WHERE t.id = ? AND LOWER(t.wallet_address) = LOWER(?)`,
    [req.params.ticketId, req.walletAddress],
    (err, ticket) => {
      if (err) return res.status(500).json({ error: 'Unable to load support ticket.' });
      if (!ticket) return res.status(404).json({ error: 'Support ticket not found.' });
      if (ticket.status === 'CLOSED') return res.status(409).json({ error: 'Closed tickets cannot be replied to.' });
      db.serialize(() => {
        db.run('BEGIN IMMEDIATE', (beginErr) => {
          if (beginErr) return res.status(500).json({ error: 'Unable to start ticket reply.' });
          const rollback = (error) => db.run('ROLLBACK', () => res.status(500).json({ error }));
          db.run(
            `INSERT INTO support_ticket_messages (ticket_id, author_role, author_name, body)
             VALUES (?, 'USER', ?, ?)`,
            [ticket.id, ticket.username || `${req.walletAddress.slice(0, 6)}…${req.walletAddress.slice(-4)}`, message],
            (insertErr) => {
              if (insertErr) return rollback('Unable to save ticket reply.');
              db.run(
                `UPDATE support_tickets SET status = 'OPEN', updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND status != 'CLOSED'`,
                [ticket.id],
                function(updateErr) {
                  if (updateErr) return rollback('Unable to update ticket status.');
                  if (this.changes !== 1) {
                    return db.run('ROLLBACK', () => res.status(409).json({ error: 'Closed tickets cannot be replied to.' }));
                  }
                  db.run('COMMIT', (commitErr) => {
                    if (commitErr) return rollback('Unable to commit ticket reply.');
                    res.json({ success: true, status: 'OPEN' });
                  });
                }
              );
            }
          );
        });
      });
    }
  );
});

app.get('/api/user/review', requireWalletSession, (req, res) => {
  const wallet = req.query.wallet;
  if (typeof wallet !== 'string' || normalizeWalletAddress(wallet) !== req.walletAddress) {
    return res.status(403).json({ error: 'Wallet session does not match the requested review.' });
  }
  db.all(
    `SELECT a.id AS account_id, a.created_at AS account_created_at, p.name AS plan_name,
            r.username, r.rating, r.comment, r.published, r.created_at, r.updated_at
     FROM accounts a
    LEFT JOIN plans p ON p.id = a.plan_id
    LEFT JOIN user_reviews r ON r.account_id = a.id AND LOWER(r.wallet_address) = LOWER(a.wallet_address)
    WHERE LOWER(a.wallet_address) = LOWER(?)
    ORDER BY a.created_at, a.id`,
    [wallet],
    (err, accounts) => {
      if (err) return res.status(500).json({ error: 'Unable to load your eligible review accounts.' });
      res.json({ accounts: accounts || [] });
    }
  );
});

app.post('/api/user/reviews', sensitiveLimiter, requireWalletSession, (req, res) => {
  const accountId = typeof req.body?.account_id === 'string' ? req.body.account_id.trim() : '';
  const rating = Number(req.body?.rating);
  const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
  if (!accountId || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length < 10 || comment.length > 1500) {
    return res.status(400).json({ error: 'Select an account assigned to your wallet, choose 1–5 stars, and enter a review between 10 and 1,500 characters.' });
  }
  db.get('SELECT username FROM users WHERE LOWER(wallet_address) = LOWER(?)', [req.walletAddress], (err, user) => {
    if (err) return res.status(500).json({ error: 'Unable to load your profile.' });
    if (!user?.username) return res.status(400).json({ error: 'Create a profile username before submitting a review.' });
    db.get(
      `SELECT a.id FROM accounts a
       WHERE a.id = ? AND LOWER(a.wallet_address) = LOWER(?)`,
      [accountId, req.walletAddress],
      (accountErr, account) => {
        if (accountErr) return res.status(500).json({ error: 'Unable to verify account ownership.' });
        if (!account) return res.status(403).json({ error: 'Reviews are available only for accounts assigned to this wallet.' });
        db.get(
          `SELECT xp_reward, points_reward FROM battlepass_tasks
           WHERE task_type = 'PLATFORM_REVIEW' AND is_builtin = 1 AND active = 1`,
          [],
          (taskErr, task) => {
            if (taskErr) return res.status(500).json({ error: 'Unable to load the BlastrrPass review reward.' });
            if (!task) return res.status(503).json({ error: 'The BlastrrPass review reward is temporarily unavailable.' });
            db.serialize(() => {
              db.run('BEGIN IMMEDIATE', beginErr => {
                if (beginErr) return res.status(500).json({ error: 'Unable to start review submission.' });
                const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
                db.run(
                  `INSERT INTO user_reviews (account_id, wallet_address, username, rating, comment, published, moderation_status)
                   VALUES (?, ?, ?, ?, ?, 0, 'PENDING')
                   ON CONFLICT(account_id) DO UPDATE SET username = excluded.username,
                     rating = excluded.rating, comment = excluded.comment, published = 0,
                     moderation_status = 'PENDING', updated_at = CURRENT_TIMESTAMP
                   WHERE LOWER(user_reviews.wallet_address) = LOWER(excluded.wallet_address)`,
                  [accountId, req.walletAddress, user.username, rating, comment],
                  function(saveErr) {
                    if (saveErr) return rollback(500, 'Unable to save your review.');
                    if (this.changes !== 1) return rollback(403, 'This account review belongs to another wallet.');
                    db.run(
                      `INSERT OR IGNORE INTO battlepass_events
                       (id, wallet_address, event_type, reference_id, xp, points)
                       VALUES (?, ?, 'PLATFORM_REVIEW', ?, ?, ?)`,
                      [
                        `bpe_${crypto.randomBytes(10).toString('hex')}`,
                        req.walletAddress,
                        req.walletAddress,
                        task.xp_reward,
                        task.points_reward
                      ],
                      function(eventErr) {
                        if (eventErr) return rollback(500, 'Unable to record the BlastrrPass review reward.');
                        const rewardApplied = this.changes === 1;
                        const finish = () => db.run('COMMIT', commitErr => {
                          if (commitErr) return rollback(500, 'Unable to complete review submission.');
                          res.json({
                            success: true,
                            message: rewardApplied
                              ? `Review saved for admin review. Your one-time BlastrrPass reward of ${task.xp_reward} XP and ${task.points_reward} points was applied.`
                              : 'Review saved and sent to the admin team for review. Your one-time BlastrrPass reward was already earned.',
                            xp_awarded: rewardApplied ? Number(task.xp_reward) : 0,
                            points_awarded: rewardApplied ? Number(task.points_reward) : 0
                          });
                        });
                        if (!rewardApplied) return finish();
                        db.run(
                          `INSERT OR IGNORE INTO battlepass_users (wallet_address) VALUES (?)`,
                          [req.walletAddress],
                          insertErr => {
                            if (insertErr) return rollback(500, 'Unable to prepare your BlastrrPass balance.');
                            db.run(
                              `UPDATE battlepass_users
                               SET xp = xp + ?, points = points + ?, updated_at = CURRENT_TIMESTAMP
                               WHERE LOWER(wallet_address) = LOWER(?)`,
                              [task.xp_reward, task.points_reward, req.walletAddress],
                              balanceErr => {
                                if (balanceErr) return rollback(500, 'Unable to apply your BlastrrPass reward.');
                                finish();
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              });
            });
          }
        );
      }
    );
  });
});

app.get('/api/reviews', (req, res) => {
  db.all(
    `SELECT username, rating, comment, updated_at
     FROM user_reviews WHERE published = 1
     ORDER BY updated_at DESC LIMIT 12`,
    [],
    (err, reviews) => {
      if (err) return res.status(500).json({ error: 'Unable to load published reviews.' });
      res.json({ reviews: reviews || [] });
    }
  );
});

function loadAdminTickets(req, res) {
  const authorWalletMismatch = req.walletType === 'SOLANA'
    ? `COALESCE(last_message.author_wallet, '') != ?`
    : `COALESCE(last_message.author_wallet, '') != LOWER(?)`;
  const readWalletPredicate = req.walletType === 'SOLANA'
    ? 'read_state.admin_wallet = ?'
    : 'LOWER(read_state.admin_wallet) = LOWER(?)';
  db.all(
    `SELECT t.*, u.username, a.plan_id, p.name AS plan_name,
            last_message.id AS last_message_id,
            CASE WHEN COALESCE(last_message.id, 0) > COALESCE(read_state.last_read_message_id, 0)
              AND (last_message.author_role = 'USER'
                OR ${authorWalletMismatch})
              THEN 1 ELSE 0 END AS is_unread
     FROM support_tickets t
     LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(t.wallet_address)
     LEFT JOIN accounts a ON a.id = t.account_id
     LEFT JOIN plans p ON p.id = a.plan_id
     LEFT JOIN (
       SELECT ticket_id, MAX(id) AS latest_message_id
       FROM support_ticket_messages GROUP BY ticket_id
     ) latest ON latest.ticket_id = t.id
     LEFT JOIN support_ticket_messages last_message ON last_message.id = latest.latest_message_id
     LEFT JOIN support_ticket_admin_reads read_state
       ON read_state.ticket_id = t.id AND ${readWalletPredicate}
     ORDER BY is_unread DESC,
       CASE t.status WHEN 'OPEN' THEN 0 WHEN 'NEEDS_INFO' THEN 1 ELSE 2 END,
       t.updated_at DESC LIMIT 250`,
    [req.walletAddress, req.walletAddress],
    (err, tickets) => {
      if (err) return res.status(500).json({ error: 'Unable to load support tickets.' });
      attachTicketMessages(tickets || [], (messagesErr, results) => {
        if (messagesErr) return res.status(500).json({ error: 'Unable to load ticket replies.' });
        res.json({ tickets: results });
      });
    }
  );
}

app.get('/api/admin/tickets', requireWalletSession, requireAdminSession, loadAdminTickets);
app.post('/api/admin/tickets', sensitiveLimiter, requireTradeSignature, requireAdminWallet, loadAdminTickets);

app.post('/api/admin/tickets/read', requireWalletSession, requireAdminSession, (req, res) => {
  const ticketId = typeof req.body?.ticket_id === 'string' ? req.body.ticket_id : '';
  if (!ticketId) return res.status(400).json({ error: 'A support ticket is required.' });
  db.get('SELECT id FROM support_tickets WHERE id = ?', [ticketId], (ticketErr, ticket) => {
    if (ticketErr) return res.status(500).json({ error: 'Unable to load support ticket.' });
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found.' });
    db.get(
      'SELECT COALESCE(MAX(id), 0) AS last_read_message_id FROM support_ticket_messages WHERE ticket_id = ?',
      [ticket.id],
      (messageErr, row) => {
        if (messageErr) return res.status(500).json({ error: 'Unable to update ticket read state.' });
        db.run(
          `INSERT INTO support_ticket_admin_reads
           (ticket_id, admin_wallet, last_read_message_id, updated_at)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(ticket_id, admin_wallet) DO UPDATE SET
             last_read_message_id = excluded.last_read_message_id,
             updated_at = CURRENT_TIMESTAMP`,
          [ticket.id, req.walletType === 'SOLANA' ? req.walletAddress : req.walletAddress.toLowerCase(), row.last_read_message_id],
          saveErr => {
            if (saveErr) return res.status(500).json({ error: 'Unable to update ticket read state.' });
            res.json({ success: true, last_read_message_id: row.last_read_message_id });
          }
        );
      }
    );
  });
});

app.get('/api/staff/tickets', requireWalletSession, requireSupportStaff, (req, res) => {
  const staffWalletPredicate = req.walletType === 'SOLANA'
    ? 't.assigned_staff_wallet = ?'
    : 'LOWER(t.assigned_staff_wallet) = LOWER(?)';
  db.all(
    `SELECT t.*, u.username, a.plan_id, p.name AS plan_name
     FROM support_tickets t
     LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(t.wallet_address)
     LEFT JOIN accounts a ON a.id = t.account_id
     LEFT JOIN plans p ON p.id = a.plan_id
     WHERE t.status != 'CLOSED'
       AND (t.assigned_staff_wallet IS NULL OR ${staffWalletPredicate})
     ORDER BY CASE t.status WHEN 'OPEN' THEN 0 ELSE 1 END, t.updated_at DESC LIMIT 250`,
    [req.walletAddress],
    (err, tickets) => {
      if (err) return res.status(500).json({ error: 'Unable to load support tickets.' });
      attachTicketMessages(tickets || [], (messagesErr, results) => {
        if (messagesErr) return res.status(500).json({ error: 'Unable to load ticket replies.' });
        res.json({ tickets: results });
      });
    }
  );
});

app.post('/api/staff/tickets/accept', sensitiveLimiter, requireWalletSession, requireSupportStaff, (req, res) => {
  const ticketId = typeof req.body?.ticket_id === 'string' ? req.body.ticket_id : '';
  if (!ticketId) return res.status(400).json({ error: 'A support ticket is required.' });
  db.run(
    `UPDATE support_tickets
     SET assigned_staff_wallet = ?, assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND status != 'CLOSED' AND assigned_staff_wallet IS NULL`,
    [req.walletAddress, ticketId],
    function(acceptErr) {
      if (acceptErr) return res.status(500).json({ error: 'Unable to accept support ticket.' });
      if (this.changes === 1) return res.json({ success: true, assigned_staff_wallet: req.walletAddress });
      const staffWalletPredicate = req.walletType === 'SOLANA'
        ? 'assigned_staff_wallet = ?'
        : 'LOWER(assigned_staff_wallet) = LOWER(?)';
      db.get(
        `SELECT status, assigned_staff_wallet,
                CASE WHEN ${staffWalletPredicate} THEN 1 ELSE 0 END AS assigned_to_current_staff
         FROM support_tickets WHERE id = ?`,
        [req.walletAddress, ticketId],
        (ticketErr, ticket) => {
          if (ticketErr) return res.status(500).json({ error: 'Unable to verify ticket assignment.' });
          if (!ticket) return res.status(404).json({ error: 'Support ticket not found.' });
          if (ticket.status === 'CLOSED') return res.status(409).json({ error: 'This ticket is already closed.' });
          if (ticket.assigned_to_current_staff) {
            return res.json({ success: true, assigned_staff_wallet: ticket.assigned_staff_wallet });
          }
          res.status(409).json({ error: 'Another support agent has already accepted this ticket.' });
        }
      );
    }
  );
});

app.post('/api/staff/tickets/action', sensitiveLimiter, requireWalletSession, requireSupportStaff, (req, res) => {
  const ticketId = typeof req.body?.ticket_id === 'string' ? req.body.ticket_id : '';
  const action = req.body?.action;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!ticketId || !['REPLY', 'CLOSE'].includes(action) ||
      (action === 'REPLY' && (message.length < 1 || message.length > 5000)) ||
      (action === 'CLOSE' && message.length > 5000)) {
    return res.status(400).json({ error: 'A ticket, valid action, and reply within 5,000 characters are required.' });
  }
  db.get('SELECT id, status, assigned_staff_wallet FROM support_tickets WHERE id = ?', [ticketId], (err, ticket) => {
    if (err) return res.status(500).json({ error: 'Unable to load support ticket.' });
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found.' });
    if (ticket.status === 'CLOSED') return res.status(409).json({ error: 'This ticket is already closed.' });
    const assignedToCurrentStaff = req.walletType === 'SOLANA'
      ? ticket.assigned_staff_wallet === req.walletAddress
      : String(ticket.assigned_staff_wallet || '').toLowerCase() === String(req.walletAddress || '').toLowerCase();
    if (!assignedToCurrentStaff) {
      return res.status(409).json({ error: 'Accept this ticket before replying or closing it.' });
    }
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE', beginErr => {
        if (beginErr) return res.status(500).json({ error: 'Unable to start ticket update.' });
        const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
        const updateStatus = () => db.run(
          `UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status != 'CLOSED'`,
          [action === 'CLOSE' ? 'CLOSED' : 'NEEDS_INFO', ticket.id],
          function(updateErr) {
            if (updateErr) return rollback(500, 'Unable to update ticket status.');
            if (this.changes !== 1) return rollback(409, 'This ticket is already closed.');
            db.run('COMMIT', commitErr => {
              if (commitErr) return rollback(500, 'Unable to commit ticket update.');
              res.json({ success: true, status: action === 'CLOSE' ? 'CLOSED' : 'NEEDS_INFO' });
            });
          }
        );
        if (action === 'CLOSE') return updateStatus();
        db.run(
          `INSERT INTO support_ticket_messages
           (ticket_id, author_role, author_name, body, author_wallet)
           VALUES (?, 'ADMIN', 'Support Staff', ?, ?)`,
          [ticket.id, message, req.walletAddress],
          insertErr => insertErr
            ? rollback(500, 'Unable to save support reply.')
            : updateStatus()
        );
      });
    });
  });
});

app.get('/api/admin/support-staff', requireWalletSession, requireAdminSession, (req, res) => {
  db.all(
    `SELECT wallet_address, role, created_by, created_at, updated_by, updated_at
     FROM support_staff WHERE active = 1 ORDER BY created_at DESC`,
    [],
    (err, staff) => {
      if (err) return res.status(500).json({ error: 'Unable to load support staff.' });
      res.json({ staff: staff || [] });
    }
  );
});

app.post('/api/admin/support-staff/action', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const wallet = typeof req.body?.staff_wallet === 'string' ? req.body.staff_wallet.trim() : '';
  const normalizedWallet = normalizeWalletAddress(wallet);
  const action = req.body?.action;
  if (!normalizedWallet || !['ADD', 'REMOVE'].includes(action) ||
      (action === 'ADD' && req.body?.role !== 'SUPPORT')) {
    return res.status(400).json({ error: 'A valid wallet and the Support role are required.' });
  }
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start support staff update.' });
      const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
      const persistAudit = () => db.run(
        'INSERT INTO support_staff_events (wallet_address, admin_wallet, action) VALUES (?, ?, ?)',
        [normalizedWallet, req.walletAddress, action],
        auditErr => {
          if (auditErr) return rollback(500, 'Unable to record support staff audit event.');
          db.run('COMMIT', commitErr => {
            if (commitErr) return rollback(500, 'Unable to finish support staff update.');
            res.json({ success: true, active: action === 'ADD' });
          });
        }
      );
      if (action === 'ADD') {
        return db.run(
          `INSERT INTO support_staff (wallet_address, role, active, created_by, created_at, updated_by, updated_at)
           VALUES (?, 'SUPPORT', 1, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(wallet_address) DO UPDATE SET role = 'SUPPORT', active = 1,
             updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP`,
          [normalizedWallet, req.walletAddress, req.walletAddress],
          function(saveErr) {
            if (saveErr) return rollback(500, 'Unable to add support staff wallet.');
            persistAudit();
          }
        );
      }
      db.run(
        `UPDATE support_staff SET active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE ${getWalletType(normalizedWallet) === 'SOLANA' ? 'wallet_address = ?' : 'LOWER(wallet_address) = LOWER(?)'}
           AND active = 1`,
        [req.walletAddress, normalizedWallet],
        function(removeErr) {
          if (removeErr) return rollback(500, 'Unable to remove support staff wallet.');
          if (this.changes !== 1) return rollback(404, 'Active support staff wallet not found.');
          db.run(
            `UPDATE support_tickets SET assigned_staff_wallet = NULL, assigned_at = NULL,
               updated_at = CURRENT_TIMESTAMP
             WHERE ${getWalletType(normalizedWallet) === 'SOLANA' ? 'assigned_staff_wallet = ?' : 'LOWER(assigned_staff_wallet) = LOWER(?)'}
               AND status != 'CLOSED'`,
            [normalizedWallet],
            releaseErr => releaseErr
              ? rollback(500, 'Unable to release tickets assigned to the removed support wallet.')
              : persistAudit()
          );
        }
      );
    });
  });
});

app.post('/api/admin/tickets/action', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const ticketId = typeof req.body?.ticket_id === 'string' ? req.body.ticket_id : '';
  const action = req.body?.action;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!ticketId || !['REPLY', 'CLOSE'].includes(action) ||
      (action === 'REPLY' && (message.length < 1 || message.length > 5000)) ||
      (action === 'CLOSE' && message.length > 5000)) {
    return res.status(400).json({ error: 'A ticket, valid action, and reply within 5,000 characters are required.' });
  }
  db.get('SELECT id, status FROM support_tickets WHERE id = ?', [ticketId], (err, ticket) => {
    if (err) return res.status(500).json({ error: 'Unable to load support ticket.' });
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found.' });
    if (ticket.status === 'CLOSED') return res.status(409).json({ error: 'This ticket is already closed.' });
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE', (beginErr) => {
        if (beginErr) return res.status(500).json({ error: 'Unable to start ticket update.' });
        const rollback = (error) => db.run('ROLLBACK', () => res.status(500).json({ error }));
        const updateStatus = () => db.run(
          `UPDATE support_tickets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'CLOSED'`,
          [action === 'CLOSE' ? 'CLOSED' : 'NEEDS_INFO', ticket.id],
          function(updateErr) {
            if (updateErr) return rollback('Unable to update ticket status.');
            if (this.changes !== 1) {
              return db.run('ROLLBACK', () => res.status(409).json({ error: 'This ticket is already closed.' }));
            }
            db.run('COMMIT', (commitErr) => {
              if (commitErr) return rollback('Unable to commit ticket update.');
              res.json({ success: true, status: action === 'CLOSE' ? 'CLOSED' : 'NEEDS_INFO' });
            });
          }
        );
        if (!message) return updateStatus();
        db.run(
          `INSERT INTO support_ticket_messages
           (ticket_id, author_role, author_name, body, author_wallet)
           VALUES (?, 'ADMIN', 'Blastrr Support', ?, ?)`,
          [ticket.id, message, req.walletAddress],
          (insertErr) => insertErr ? rollback('Unable to save admin reply.') : updateStatus()
        );
      });
    });
  });
});

function loadAdminReviews(req, res) {
  db.all(
    `SELECT r.account_id, r.wallet_address, r.username, r.rating, r.comment, r.published, r.created_at, r.updated_at,
            p.name AS plan_name
     FROM user_reviews r
     LEFT JOIN accounts a ON a.id = r.account_id
     LEFT JOIN plans p ON p.id = a.plan_id
     ORDER BY r.published ASC, r.updated_at DESC LIMIT 300`,
    [],
    (err, reviews) => {
      if (err) return res.status(500).json({ error: 'Unable to load user reviews.' });
      res.json({ reviews: reviews || [] });
    }
  );
}

app.get('/api/admin/reviews', requireWalletSession, requireAdminSession, loadAdminReviews);
app.post('/api/admin/reviews', sensitiveLimiter, requireTradeSignature, requireAdminWallet, loadAdminReviews);

app.get('/api/staff/reviews', requireWalletSession, requireSupportStaff, (req, res) => {
  db.all(
    `SELECT r.account_id, r.wallet_address, r.username, r.rating, r.comment, r.created_at, r.updated_at,
            p.name AS plan_name
     FROM user_reviews r
     LEFT JOIN accounts a ON a.id = r.account_id
     LEFT JOIN plans p ON p.id = a.plan_id
     WHERE r.moderation_status = 'PENDING'
     ORDER BY r.updated_at ASC LIMIT 300`,
    [],
    (err, reviews) => {
      if (err) return res.status(500).json({ error: 'Unable to load pending reviews.' });
      res.json({ reviews: reviews || [] });
    }
  );
});

app.post('/api/staff/reviews/action', sensitiveLimiter, requireWalletSession, requireSupportStaff, (req, res) => {
  const accountId = typeof req.body?.review_account_id === 'string' ? req.body.review_account_id.trim() : '';
  const action = req.body?.action;
  if (!accountId || !['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'A review and approve or reject action are required.' });
  }
  const moderationStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start review moderation.' });
      const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
      db.run(
        `UPDATE user_reviews SET published = ?, moderation_status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE account_id = ? AND moderation_status = 'PENDING'`,
        [action === 'APPROVE' ? 1 : 0, moderationStatus, accountId],
        function(updateErr) {
          if (updateErr) return rollback(500, 'Unable to update review moderation.');
          if (this.changes !== 1) return rollback(404, 'Pending review not found.');
          db.run(
            'INSERT INTO review_moderation_actions (account_id, reviewer_wallet, action) VALUES (?, ?, ?)',
            [accountId, req.walletAddress, action === 'APPROVE' ? 'APPROVE' : 'REJECT'],
            auditErr => {
              if (auditErr) return rollback(500, 'Unable to record review moderation audit event.');
              db.run('COMMIT', commitErr => {
                if (commitErr) return rollback(500, 'Unable to finish review moderation.');
                res.json({ success: true, moderation_status: moderationStatus });
              });
            }
          );
        }
      );
    });
  });
});

app.post('/api/admin/reviews/action', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const accountId = req.body?.review_account_id;
  const action = req.body?.action;
  if (typeof accountId !== 'string' || !accountId.trim() || !['PUBLISH', 'HIDE'].includes(action)) {
    return res.status(400).json({ error: 'A valid review account and publish or hide action are required.' });
  }
  const moderationStatus = action === 'PUBLISH' ? 'APPROVED' : 'HIDDEN';
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start review moderation.' });
      const rollback = error => db.run('ROLLBACK', () => res.status(500).json({ error }));
      db.run(
        'UPDATE user_reviews SET published = ?, moderation_status = ?, updated_at = CURRENT_TIMESTAMP WHERE account_id = ?',
        [action === 'PUBLISH' ? 1 : 0, moderationStatus, accountId.trim()],
        function(updateErr) {
          if (updateErr) return rollback('Unable to update review publication.');
          if (this.changes !== 1) return db.run('ROLLBACK', () => res.status(404).json({ error: 'Review not found.' }));
          db.run(
            'INSERT INTO review_moderation_actions (account_id, reviewer_wallet, action) VALUES (?, ?, ?)',
            [accountId.trim(), req.walletAddress, action === 'PUBLISH' ? 'APPROVE' : 'HIDE'],
            auditErr => {
              if (auditErr) return rollback('Unable to record review moderation audit event.');
              db.run('COMMIT', commitErr => {
                if (commitErr) return rollback('Unable to finish review moderation.');
                res.json({ success: true, published: action === 'PUBLISH', moderation_status: moderationStatus });
              });
            }
          );
        }
      );
    });
  });
});

app.post('/api/admin/referrals/search', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  if (username.length < 2 || username.length > 24) {
    return res.status(400).json({ error: 'Enter at least 2 characters of a username to search.' });
  }
  db.all(
    `SELECT u.wallet_address, u.username,
            COALESCE(u.level_one_pct_override, s.level_one_pct, 2) AS referral_pct,
            COALESCE(u.level_two_pct_override, s.level_two_pct, 2) AS level_two_pct
     FROM users u
     LEFT JOIN referral_settings s ON s.id = 1
     WHERE u.username IS NOT NULL AND u.username LIKE ? COLLATE NOCASE
     ORDER BY u.username COLLATE NOCASE LIMIT 50`,
    [`%${username}%`],
    (err, users) => {
      if (err) return res.status(500).json({ error: 'Unable to search users.' });
      res.json({ users: users || [] });
    }
  );
});

app.post('/api/admin/referrals/commission', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const wallet = req.body?.user_wallet;
  const referralPct = Number(req.body?.referral_pct);
  const levelTwoPct = Number(req.body?.level_two_pct);
  if (typeof wallet !== 'string' || !normalizeWalletAddress(wallet) ||
      !Number.isFinite(referralPct) || referralPct < 0 || referralPct > 100 ||
      !Number.isFinite(levelTwoPct) || levelTwoPct < 0 || levelTwoPct > 100) {
    return res.status(400).json({ error: 'Choose a valid user wallet and level-1 and level-2 rates from 0 to 100%.' });
  }
  const normalizedPct = Math.round(referralPct * 100) / 100;
  const normalizedLevelTwoPct = Math.round(levelTwoPct * 100) / 100;
  db.run(
    `UPDATE users
     SET referral_pct = ?, level_one_pct_override = ?, level_two_pct_override = ?
     WHERE LOWER(wallet_address) = LOWER(?) AND username IS NOT NULL`,
    [normalizedPct, normalizedPct, normalizedLevelTwoPct, wallet],
    function(updateErr) {
      if (updateErr) return res.status(500).json({ error: 'Unable to update the creator commission rate.' });
      if (this.changes !== 1) return res.status(404).json({ error: 'User profile not found.' });
      res.json({ success: true, referral_pct: normalizedPct, level_two_pct: normalizedLevelTwoPct });
    }
  );
});

app.post('/api/admin/referrals/settings/load', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.get('SELECT level_one_pct, level_two_pct FROM referral_settings WHERE id = 1', [], (err, settings) => {
    if (err) return res.status(500).json({ error: 'Unable to load referral commission settings.' });
    res.json({
      level_one_pct: Number(settings?.level_one_pct ?? 2),
      level_two_pct: Number(settings?.level_two_pct ?? 2)
    });
  });
});

app.post('/api/admin/referrals/settings/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const levelOnePct = Number(req.body?.level_one_pct);
  const levelTwoPct = Number(req.body?.level_two_pct);
  if (!Number.isFinite(levelOnePct) || levelOnePct < 0 || levelOnePct > 100 ||
      !Number.isFinite(levelTwoPct) || levelTwoPct < 0 || levelTwoPct > 100) {
    return res.status(400).json({ error: 'Enter level-1 and level-2 commission rates from 0 to 100%.' });
  }
  const normalizedLevelOnePct = Math.round(levelOnePct * 100) / 100;
  const normalizedLevelTwoPct = Math.round(levelTwoPct * 100) / 100;
  db.run(
    `INSERT INTO referral_settings (id, level_one_pct, level_two_pct) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       level_one_pct = excluded.level_one_pct,
       level_two_pct = excluded.level_two_pct`,
    [normalizedLevelOnePct, normalizedLevelTwoPct],
    err => {
      if (err) return res.status(500).json({ error: 'Unable to save the referral commission rates.' });
      res.json({ success: true, level_one_pct: normalizedLevelOnePct, level_two_pct: normalizedLevelTwoPct });
    }
  );
});

app.post('/api/admin/promo-codes/list', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.all(
    `SELECT c.code, c.created_at, c.claimed_by, c.claimed_at, p.name AS plan_name
     FROM promo_codes c JOIN plans p ON p.id = c.plan_id
     ORDER BY c.created_at DESC LIMIT 100`,
    [],
    (err, codes) => {
      if (err) return res.status(500).json({ error: 'Unable to load free account codes.' });
      res.json({ codes: codes || [] });
    }
  );
});

app.post('/api/admin/promo-codes/create', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const planId = Number(req.body?.plan_id);
  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: 'Choose an account plan for this code.' });
  }
  db.get('SELECT id, name FROM plans WHERE id = ? AND active = 1', [planId], (planErr, plan) => {
    if (planErr) return res.status(500).json({ error: 'Unable to load the selected account plan.' });
    if (!plan) return res.status(404).json({ error: 'The selected account plan is not available.' });
    const code = `FREE-${crypto.randomBytes(10).toString('hex').toUpperCase()}`;
    db.run(
      'INSERT INTO promo_codes (code, plan_id, created_by) VALUES (?, ?, ?)',
      [code, plan.id, req.body.wallet_address.toLowerCase()],
      (insertErr) => {
        if (insertErr) return res.status(500).json({ error: 'Unable to generate a free account code.' });
        res.json({ success: true, code, plan_name: plan.name });
      }
    );
  });
});

app.post('/api/admin/battlepass/settings', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const discountPct = Number(req.body?.standard_discount_pct);
  if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
    return res.status(400).json({ error: 'The standard discount must be between 0 and 100%.' });
  }
  const normalizedDiscountPct = Math.round(discountPct * 100) / 100;
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start the standard discount update.' });
      const rollback = error => db.run('ROLLBACK', () => res.status(500).json({ error }));
      db.run(
        'UPDATE battlepass_settings SET standard_discount_pct = ? WHERE id = 1',
        [normalizedDiscountPct],
        function(updateErr) {
          if (updateErr) return rollback('Unable to update the standard discount.');
          if (this.changes !== 1) return rollback('Battle pass settings are unavailable.');
          db.run(
            'UPDATE plans SET price_usdt = base_price_usdt',
            [],
            priceErr => {
              if (priceErr) return rollback('Unable to synchronize plan sale prices.');
              db.run('COMMIT', commitErr => {
                if (commitErr) return rollback('Unable to commit the standard discount.');
                res.json({ success: true, standard_discount_pct: normalizedDiscountPct });
              });
            }
          );
        }
      );
    });
  });
});

app.post('/api/admin/battlepass/settings/get', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.get('SELECT standard_discount_pct FROM battlepass_settings WHERE id = 1', [], (err, settings) => {
    if (err || !settings) return res.status(500).json({ error: 'Unable to load battle pass settings.' });
    res.json({ settings });
  });
});

app.post('/api/admin/battlepass/levels/list', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.all(
    `SELECT l.level, l.xp_required, d.title FROM battlepass_levels l
     JOIN battlepass_level_definitions d ON d.level = l.level ORDER BY l.level`,
    [],
    (err, levels) => {
    if (err) return res.status(500).json({ error: 'Unable to load battle pass levels.' });
    res.json({ levels: levels || [] });
  });
});

app.post('/api/admin/battlepass/levels/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const level = Number(req.body?.level);
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!Number.isInteger(level) || level < 1 || level > 12 || title.length < 2 || title.length > 40) {
    return res.status(400).json({ error: 'Set a level from 1 to 12 and a title between 2 and 40 characters.' });
  }
  db.run(
    'UPDATE battlepass_level_definitions SET title = ? WHERE level = ?',
    [title, level],
    function(updateErr) {
      if (updateErr) return res.status(500).json({ error: 'Unable to update the level title.' });
      if (this.changes !== 1) return res.status(404).json({ error: 'Battle pass level not found.' });
      res.json({ success: true });
    }
  );
});

app.post('/api/admin/battlepass/plan-rewards/list', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.all(
    `SELECT p.id AS plan_id, p.name, p.simulated_capital,
            COALESCE(r.xp_reward, 1000) AS xp_reward,
            COALESCE(r.points_reward, 100) AS points_reward
     FROM plans p LEFT JOIN battlepass_plan_rewards r ON r.plan_id = p.id
     WHERE p.active = 1 ORDER BY p.id`,
    [],
    (err, plans) => {
      if (err) return res.status(500).json({ error: 'Unable to load plan battle pass rewards.' });
      res.json({ plans: plans || [] });
    }
  );
});

app.post('/api/admin/battlepass/plan-rewards/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const planId = Number(req.body?.plan_id);
  const xpReward = Number(req.body?.xp_reward);
  const pointsReward = Number(req.body?.points_reward);
  if (!Number.isInteger(planId) || planId <= 0 ||
      !Number.isSafeInteger(xpReward) || xpReward < 0 ||
      !Number.isSafeInteger(pointsReward) || pointsReward < 0) {
    return res.status(400).json({ error: 'Set a valid plan and non-negative XP and point rewards.' });
  }
  db.get('SELECT id FROM plans WHERE id = ? AND active = 1', [planId], (planErr, plan) => {
    if (planErr) return res.status(500).json({ error: 'Unable to load the selected plan.' });
    if (!plan) return res.status(404).json({ error: 'The selected plan is unavailable.' });
    db.run(
      `INSERT INTO battlepass_plan_rewards (plan_id, xp_reward, points_reward) VALUES (?, ?, ?)
       ON CONFLICT(plan_id) DO UPDATE SET xp_reward = excluded.xp_reward, points_reward = excluded.points_reward`,
      [planId, xpReward, pointsReward],
      (saveErr) => {
        if (saveErr) return res.status(500).json({ error: 'Unable to save plan battle pass rewards.' });
        res.json({ success: true });
      }
    );
  });
});

app.post('/api/admin/battlepass/tasks/list', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.all('SELECT * FROM battlepass_tasks ORDER BY active DESC, cadence, id', [], (err, tasks) => {
    if (err) return res.status(500).json({ error: 'Unable to load battle pass tasks.' });
    res.json({ tasks: tasks || [] });
  });
});

app.post('/api/admin/battlepass/tasks/rewards', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const taskId = Number(req.body?.task_id);
  const xpReward = Number(req.body?.xp_reward);
  const pointsReward = Number(req.body?.points_reward);
  if (!Number.isInteger(taskId) || taskId <= 0 ||
      !Number.isSafeInteger(xpReward) || xpReward < 0 ||
      !Number.isSafeInteger(pointsReward) || pointsReward < 0) {
    return res.status(400).json({ error: 'Set valid non-negative XP and point rewards for a built-in task.' });
  }
  db.run(
    'UPDATE battlepass_tasks SET xp_reward = ?, points_reward = ? WHERE id = ? AND is_builtin = 1',
    [xpReward, pointsReward, taskId],
    function(updateErr) {
      if (updateErr) return res.status(500).json({ error: 'Unable to update built-in task rewards.' });
      if (this.changes !== 1) return res.status(404).json({ error: 'Built-in battle pass task not found.' });
      res.json({ success: true });
    }
  );
});

app.post('/api/admin/battlepass/tasks/save', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const taskId = req.body?.task_id == null || req.body?.task_id === '' ? null : Number(req.body.task_id);
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
  const actionUrl = typeof req.body?.action_url === 'string' ? req.body.action_url.trim() : '';
  const taskType = req.body?.task_type;
  const cadence = req.body?.cadence;
  const xpReward = Number(req.body?.xp_reward);
  const pointsReward = Number(req.body?.points_reward);
  const active = req.body?.active === false ? 0 : 1;
  const validTypes = ['SOCIAL_CLICK', 'WITHDRAWAL'];
  const urlValid = (() => {
    try { return actionUrl.length <= 2048 && new URL(actionUrl).protocol === 'https:'; } catch { return false; }
  })();
  if ((taskId != null && (!Number.isInteger(taskId) || taskId <= 0)) ||
      title.length < 3 || title.length > 100 ||
      description.length < 3 || description.length > 500 ||
      !validTypes.includes(taskType) || !['DAILY', 'WEEKLY', 'MONTHLY'].includes(cadence) ||
      (taskType === 'SOCIAL_CLICK' && !urlValid) ||
      !Number.isSafeInteger(xpReward) || xpReward < 0 ||
      !Number.isSafeInteger(pointsReward) || pointsReward < 0) {
    return res.status(400).json({ error: 'Provide a valid task, cadence, action link (for social tasks), and non-negative XP and point rewards.' });
  }
  const values = [title, description, actionUrl || 'https://x.com/', taskType, cadence, xpReward, pointsReward, active];
  if (taskId == null) {
    return db.run(
      `INSERT INTO battlepass_tasks (title, description, action_url, task_type, cadence, xp_reward, points_reward, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      values,
      function(insertErr) {
        if (insertErr) return res.status(500).json({ error: 'Unable to create the battle pass task.' });
        res.json({ success: true, task_id: this.lastID });
      }
    );
  }
  db.get('SELECT is_builtin FROM battlepass_tasks WHERE id = ?', [taskId], (taskErr, task) => {
    if (taskErr) return res.status(500).json({ error: 'Unable to load the battle pass task.' });
    if (!task) return res.status(404).json({ error: 'Battle pass task not found.' });
    if (Number(task.is_builtin) === 1) {
      return res.status(400).json({ error: 'Built-in activity tasks only allow their XP and point rewards to be changed.' });
    }
    db.run(
      `UPDATE battlepass_tasks SET title = ?, description = ?, action_url = ?, task_type = ?,
         cadence = ?, xp_reward = ?, points_reward = ?, active = ? WHERE id = ? AND is_builtin = 0`,
      [...values, taskId],
      function(updateErr) {
        if (updateErr) return res.status(500).json({ error: 'Unable to update the battle pass task.' });
        if (this.changes !== 1) return res.status(404).json({ error: 'Battle pass task not found.' });
        res.json({ success: true, task_id: taskId });
      }
    );
  });
});

app.get('/api/user/referrals', requireWalletSession, (req, res) => {
  const wallet = req.query.wallet;
  if (normalizeWalletAddress(wallet, req.walletType) !== req.walletAddress) {
    return res.status(403).json({ error: 'Wallet session does not match the requested referrals.' });
  }

  db.all(
    `SELECT r.created_at, r.paid_amount, r.commission_earned, r.commission_pct, r.level AS referral_level,
            p.name AS plan_name, u.username AS buyer_username
     FROM referrals r
     JOIN plans p ON r.plan_id = p.id
     LEFT JOIN users u ON LOWER(r.referee_wallet) = LOWER(u.wallet_address)
     WHERE LOWER(r.referrer_wallet) = LOWER(?)
     ORDER BY r.created_at DESC`,
    [wallet],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      db.all(
        `SELECT wallet_address, username
         FROM users WHERE LOWER(referred_by) = LOWER(?)
         ORDER BY username COLLATE NOCASE, wallet_address`,
        [wallet],
        (refereesErr, referees) => {
          if (refereesErr) return res.status(500).json({ error: 'Unable to load your referees.' });
          db.get(
            `SELECT COALESCE(u.level_one_pct_override, s.level_one_pct, 2) AS level_one_pct,
                    COALESCE(u.level_two_pct_override, s.level_two_pct, 2) AS level_two_pct
             FROM referral_settings s
             LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(?)
             WHERE s.id = 1`,
            [wallet],
            (settingsErr, settings) => {
            if (settingsErr) return res.status(500).json({ error: 'Unable to load referral commission settings.' });
            res.json({
              referrals: rows || [],
              referees: referees || [],
              level_one_pct: Number(settings?.level_one_pct ?? 2),
              level_two_pct: Number(settings?.level_two_pct ?? 2)
            });
            }
          );
        }
      );
    }
  );
});

app.post('/api/referrals/withdraw', sensitiveLimiter, requireTradeSignature, (req, res) => {
  const { wallet_address, amount } = req.body;
  const amountValue = Math.round(Number(amount) * 100) / 100;
  const payoutChainId = Number(req.body?.payout_chain_id);
  const payoutAsset = typeof req.body?.payout_asset === 'string' ? req.body.payout_asset.toUpperCase() : '';
  if (normalizeWalletAddress(wallet_address, req.walletType) !== req.walletAddress ||
      !Number.isFinite(amountValue) || amountValue <= 0 ||
      !isValidPayoutSelection(req.walletType, payoutChainId, payoutAsset)) {
    return res.status(400).json({ error: "Invalid withdrawal parameters." });
  }

  const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', (beginErr) => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start commission withdrawal.' });
      db.get(
        `SELECT COALESCE(SUM(commission_earned), 0) AS total_earned
         FROM referrals WHERE LOWER(referrer_wallet) = LOWER(?)`,
        [wallet_address],
        (earnedErr, earnedRow) => {
          if (earnedErr) return rollback(500, 'Unable to calculate commission balance.');
          db.get(
            `SELECT COALESCE(SUM(amount), 0) AS total_withdrawn
             FROM referral_withdrawals WHERE LOWER(wallet_address) = LOWER(?) AND status != 'REJECTED'`,
            [wallet_address],
            (withdrawnErr, withdrawnRow) => {
              if (withdrawnErr) return rollback(500, 'Unable to check prior commission withdrawals.');
              const available = Number(earnedRow.total_earned) - Number(withdrawnRow.total_withdrawn);
              if (amountValue > available) {
                return rollback(400, `Requested amount ($${amountValue}) exceeds available commission balance ($${available.toFixed(2)}).`);
              }

              const withdrawalId = `refw_${crypto.randomBytes(7).toString('hex')}`;
              db.all(
                `SELECT id, commission_earned FROM referrals
                 WHERE LOWER(referrer_wallet) = LOWER(?) ORDER BY created_at, id`,
                [wallet_address],
                (referralErr, referrals) => {
                  if (referralErr) return rollback(500, 'Unable to allocate commission transactions.');
                  let previouslyConsumedCents = Math.max(0, Math.round(Number(withdrawnRow.total_withdrawn) * 100));
                  let remainingCents = Math.round(amountValue * 100);
                  const allocations = [];
                  for (const referral of referrals || []) {
                    const earnedCents = Math.max(0, Math.round(Number(referral.commission_earned || 0) * 100));
                    const consumedCents = Math.min(previouslyConsumedCents, earnedCents);
                    previouslyConsumedCents -= consumedCents;
                    const availableCents = earnedCents - consumedCents;
                    const allocatedCents = Math.min(availableCents, remainingCents);
                    if (allocatedCents > 0) {
                      allocations.push({ referralId: referral.id, amount: allocatedCents / 100 });
                      remainingCents -= allocatedCents;
                    }
                    if (remainingCents === 0) break;
                  }
                  if (remainingCents > 0) {
                    return rollback(409, 'Commission records no longer match the available withdrawal balance. Refresh and retry.');
                  }
                  db.run(
                    `INSERT INTO referral_withdrawals
                     (id, wallet_address, amount, status, payout_chain_id, payout_asset)
                     VALUES (?, ?, ?, 'PENDING', ?, ?)`,
                    [withdrawalId, wallet_address, amountValue, payoutChainId, payoutAsset],
                    insertErr => {
                      if (insertErr) return rollback(500, 'Unable to record commission withdrawal.');
                      const saveAllocation = index => {
                        if (index >= allocations.length) {
                          return db.run('COMMIT', commitErr => {
                            if (commitErr) return rollback(500, 'Unable to commit commission withdrawal.');
                            res.json({ success: true, message: 'Commission withdrawal requested successfully.' });
                          });
                        }
                        const allocation = allocations[index];
                        db.run(
                          `INSERT INTO referral_withdrawal_allocations (withdrawal_id, referral_id, amount)
                           VALUES (?, ?, ?)`,
                          [withdrawalId, allocation.referralId, allocation.amount],
                          allocationErr => allocationErr
                            ? rollback(500, 'Unable to record commission transaction allocation.')
                            : saveAllocation(index + 1)
                        );
                      };
                      saveAllocation(0);
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});

app.post('/api/promo/validate', sensitiveLimiter, requireWalletSession, (req, res) => {
  const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
  if (!code) return res.json({ valid: false });
  db.get('SELECT standard_discount_pct FROM battlepass_settings WHERE id = 1', [], (settingsErr, settings) => {
    if (settingsErr) return res.status(500).json({ error: 'Unable to load current purchase discounts.' });
    const standardDiscountPct = Number(settings?.standard_discount_pct ?? 90);
    db.get(
      `SELECT code, wallet_address, discount_pct, eligible_plan_id, redeemed_at
       FROM battlepass_discount_certificates WHERE UPPER(code) = ?`,
      [code],
      (certificateErr, certificate) => {
        if (certificateErr) return res.status(500).json({ error: 'Unable to validate the discount certificate.' });
        if (certificate) {
          if (certificate.wallet_address.toLowerCase() !== req.walletAddress.toLowerCase()) {
            return res.json({ valid: false, error: 'This discount certificate belongs to another wallet.' });
          }
          if (certificate.redeemed_at) return res.json({ valid: false, error: 'This discount certificate has already been used.' });
          if (certificate.eligible_plan_id != null && req.body?.plan_id != null &&
              Number(req.body.plan_id) !== Number(certificate.eligible_plan_id)) {
            return res.json({ valid: false, error: 'This certificate can only be used for its eligible account type.' });
          }
          return db.get(
            'SELECT name FROM plans WHERE id = ? AND active = 1',
            [certificate.eligible_plan_id],
            (planErr, eligiblePlan) => {
              if (planErr) return res.status(500).json({ error: 'Unable to verify the eligible account type.' });
              if (certificate.eligible_plan_id != null && !eligiblePlan) {
                return res.json({ valid: false, error: 'This certificate’s eligible account type is currently unavailable.' });
              }
              res.json({
                valid: true,
                type: 'PACK_DISCOUNT',
                discount_pct: Number(certificate.discount_pct),
                eligible_plan_id: certificate.eligible_plan_id == null ? null : Number(certificate.eligible_plan_id),
                eligible_plan_name: eligiblePlan?.name || null
              });
            }
          );
        }
        db.get('SELECT wallet_address FROM users WHERE UPPER(discount_code) = ?', [code], (userErr, user) => {
      if (userErr) return res.status(500).json({ error: 'Unable to validate the promo code.' });
      if (user) {
        return res.json({ valid: true, type: 'CREATOR', discount_pct: standardDiscountPct });
      }
      db.get(
        `SELECT discount_bonus_pct FROM battlepass_reward_codes
         WHERE UPPER(code) = ? AND redeemed_at IS NULL`,
        [code],
        (rewardErr, reward) => {
          if (rewardErr) return res.status(500).json({ error: 'Unable to validate the reward code.' });
          if (!reward) return res.json({ valid: false, error: 'Invalid or already-used promo code.' });
          res.json({
            valid: true,
            type: 'BATTLEPASS',
            discount_pct: Math.min(100, standardDiscountPct + Number(reward.discount_bonus_pct)),
            bonus_discount_pct: Number(reward.discount_bonus_pct)
          });
        }
      );
        });
      }
    );
  });
});

app.get('/api/accounts', requireWalletSession, (req, res) => {
  const wallet = req.query.wallet;
  if (typeof wallet !== 'string' || normalizeWalletAddress(wallet) !== req.walletAddress) {
    return res.status(403).json({ error: 'Wallet session does not match the requested accounts.' });
  }

  db.all(
    `SELECT a.*, p.name as plan_name, p.profit_target, p.max_drawdown_pct, p.daily_loss_pct, p.simulated_capital 
     FROM accounts a 
     JOIN plans p ON a.plan_id = p.id 
     WHERE LOWER(a.wallet_address) = LOWER(?)`,
    [wallet],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ accounts: rows || [] });
    }
  );
});

app.get('/api/withdrawals/availability', requireWalletSession, (req, res) => {
  const walletPredicate = req.walletType === 'SOLANA'
    ? 'a.wallet_address = ?'
    : 'LOWER(a.wallet_address) = LOWER(?)';
  const userWalletPredicate = req.walletType === 'SOLANA'
    ? 'u.wallet_address = a.wallet_address'
    : 'LOWER(u.wallet_address) = LOWER(a.wallet_address)';
  db.all(
    `SELECT a.id AS account_id, a.plan_id, a.initial_balance, a.current_balance,
            a.status, a.lock_reason, a.admin_frozen, a.permanent_lock,
            p.name AS plan_name, p.max_drawdown_pct,
            COALESCE(u.admin_suspended, 0) AS user_suspended,
            COALESCE(SUM(CASE WHEN w.status = 'PENDING' THEN w.amount ELSE 0 END), 0) AS pending_withdrawal_amount,
            COALESCE(SUM(CASE WHEN w.status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_withdrawal_count
     FROM accounts a
     JOIN plans p ON p.id = a.plan_id
     LEFT JOIN users u ON ${userWalletPredicate}
     LEFT JOIN withdrawals w ON w.account_id = a.id
     WHERE ${walletPredicate}
     GROUP BY a.id
     ORDER BY a.created_at DESC`,
    [req.walletAddress],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Unable to load withdrawal availability.' });
      let accounts;
      try {
        accounts = (rows || []).map(account => {
          const withdrawalFloor = getProtectedPayoutBalance(account.initial_balance, account.max_drawdown_pct);
          const pendingAmount = Number(account.pending_withdrawal_amount) || 0;
          const maxWithdrawable = getAvailableGrossWithdrawal(
            account.current_balance,
            withdrawalFloor,
            pendingAmount
          );
          const pending = Number(account.pending_withdrawal_count) > 0;
          let unavailableReason = '';
          if (Number(account.user_suspended) === 1) unavailableReason = 'User access is suspended.';
          else if (Number(account.admin_frozen) === 1) unavailableReason = 'This account is frozen by an administrator.';
          else if (account.status !== 'ACTIVE') unavailableReason = `Account status: ${account.status}.`;
          else if (pending) unavailableReason = 'A withdrawal is already awaiting review.';
          else if (maxWithdrawable <= 0) unavailableReason = 'No balance is currently available above the protected balance.';
          const balanceProgress = withdrawalFloor > 0
            ? Math.min(100, Math.max(0, (Number(account.current_balance || 0) / withdrawalFloor) * 100))
            : 100;
          return {
            account_id: account.account_id,
            plan_name: account.plan_name || 'Trading account',
            initial_balance: Number(account.initial_balance) || 0,
            current_balance: Number(account.current_balance) || 0,
            withdrawal_floor: withdrawalFloor,
            max_withdrawable: Math.max(0, maxWithdrawable),
            pending_withdrawal_amount: pendingAmount,
            pending_withdrawal: pending,
            status: account.status,
            lock_reason: account.lock_reason,
            balance_progress_pct: balanceProgress,
            can_withdraw: !unavailableReason,
            unavailable_reason: unavailableReason
          };
        });
      } catch (calculationError) {
        console.error('Unable to calculate account withdrawal availability:', calculationError.message);
        return res.status(500).json({ error: 'Unable to calculate account withdrawal availability.' });
      }
      res.json({ accounts });
    }
  );
});

app.get('/api/user/account-withdrawals', requireWalletSession, (req, res) => {
  const walletPredicate = req.walletType === 'SOLANA'
    ? 'w.wallet_address = ?'
    : 'LOWER(w.wallet_address) = LOWER(?)';
  const ownerPredicate = req.walletType === 'SOLANA'
    ? 'wallet_address = ?'
    : 'LOWER(wallet_address) = LOWER(?)';
  db.get(`SELECT username FROM users WHERE ${ownerPredicate}`, [req.walletAddress], (ownerErr, owner) => {
    if (ownerErr) return res.status(500).json({ error: 'Unable to load statement owner details.' });
    db.all(
      `SELECT w.id, w.account_id, COALESCE(w.plan_name, p.name, 'Trading account') AS plan_name,
              w.amount AS gross_amount, w.user_amount, w.admin_share, w.status,
              w.payout_chain_id, w.payout_asset, w.payout_tx_hash,
              w.created_at, w.approved_at, w.paid_at
       FROM withdrawals w
       LEFT JOIN accounts a ON a.id = w.account_id
       LEFT JOIN plans p ON p.id = a.plan_id
       WHERE ${walletPredicate} AND w.account_id IS NOT NULL
       ORDER BY w.created_at DESC`,
      [req.walletAddress],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Unable to load withdrawal history.' });
        res.json({
          statement_owner: { name: owner?.username || '', wallet_address: req.walletAddress },
          withdrawals: rows || []
        });
      }
    );
  });
});

app.get('/api/user/account-purchases', requireWalletSession, (req, res) => {
  const walletPredicate = req.walletType === 'SOLANA'
    ? 'p.wallet_address = ?'
    : 'LOWER(p.wallet_address) = LOWER(?)';
  const ownerPredicate = req.walletType === 'SOLANA'
    ? 'wallet_address = ?'
    : 'LOWER(wallet_address) = LOWER(?)';
  db.get(`SELECT username FROM users WHERE ${ownerPredicate}`, [req.walletAddress], (ownerErr, owner) => {
    if (ownerErr) return res.status(500).json({ error: 'Unable to load statement owner details.' });
    db.all(
      `SELECT p.tx_hash, p.chain_id, p.account_id, p.quantity,
              COALESCE(p.amount_usdt, 0) AS amount_usdt, p.payment_asset, p.created_at,
              COALESCE(pl.name, 'Trading account') AS plan_name
       FROM purchases p
       LEFT JOIN accounts a ON a.id = p.account_id
       LEFT JOIN plans pl ON pl.id = a.plan_id
       WHERE ${walletPredicate} AND p.chain_id > 0
       ORDER BY p.created_at DESC`,
      [req.walletAddress],
      (err, rows) => {
        if (err) return res.status(500).json({ error: 'Unable to load account purchase history.' });
        res.json({
          statement_owner: { name: owner?.username || '', wallet_address: req.walletAddress },
          purchases: rows || []
        });
      }
    );
  });
});

app.get('/api/accounts/performance', requireWalletSession, (req, res) => {
  db.all(
    `SELECT a.id AS account_id, p.name AS plan_name, a.initial_balance, a.current_balance,
            a.status, a.lock_reason, a.permanent_lock, a.admin_frozen,
            t.id AS trade_id, t.status AS trade_status, t.pnl AS trade_pnl
     FROM accounts a
     JOIN plans p ON p.id = a.plan_id
     LEFT JOIN trades t ON t.account_id = a.id
     WHERE LOWER(a.wallet_address) = LOWER(?)
     ORDER BY a.created_at, t.created_at`,
    [req.walletAddress],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Unable to load account performance.' });
      const accounts = new Map();
      for (const row of rows || []) {
        let account = accounts.get(row.account_id);
        if (!account) {
          account = {
            accountId: row.account_id,
            planName: row.plan_name || 'Trading account',
            initialBalance: Number(row.initial_balance || 0),
            currentBalance: Number(row.current_balance || 0),
            status: row.status,
            lockReason: row.lock_reason,
            permanentLock: Number(row.permanent_lock) === 1,
            adminFrozen: Number(row.admin_frozen) === 1,
            trades: []
          };
          accounts.set(row.account_id, account);
        }
        if (row.trade_id) account.trades.push({ status: row.trade_status, pnl: row.trade_pnl });
      }

      const allAccounts = [...accounts.values()];
      const activeAccounts = allAccounts.filter(account =>
        account.status === 'ACTIVE' &&
        !account.lockReason &&
        !account.permanentLock &&
        !account.adminFrozen
      );
      const dllLockedAccounts = allAccounts.filter(account =>
        account.status === 'LOCKED' &&
        account.lockReason === 'DLL' &&
        !account.permanentLock &&
        !account.adminFrozen
      );
      const includedAccounts = [...activeAccounts, ...dllLockedAccounts];
      const accountSummaries = activeAccounts.map(account => ({
        accountId: account.accountId,
        planName: account.planName,
        initialBalance: account.initialBalance,
        currentBalance: account.currentBalance,
        metrics: calculateTradePerformance(account.trades)
      }));
      const allTrades = includedAccounts.flatMap(account => account.trades);
      const includedInitialBalance = includedAccounts.reduce((total, account) => total + account.initialBalance, 0);
      const includedCurrentBalance = includedAccounts.reduce((total, account) => total + account.currentBalance, 0);
      res.json({
        overall: {
          ...calculateTradePerformance(allTrades),
          accountCount: includedAccounts.length,
          activeAccountCount: activeAccounts.length,
          dllLockedAccountCount: dllLockedAccounts.length,
          initialBalance: includedInitialBalance,
          currentBalance: includedCurrentBalance
        },
        accounts: accountSummaries
      });
    }
  );
});

app.get('/api/accounts/details', requireWalletSession, (req, res) => {
  const accountId = req.query.account_id;
  const wallet = req.query.wallet;
  if (!accountId || typeof wallet !== 'string' || normalizeWalletAddress(wallet) !== req.walletAddress) {
    return res.status(403).json({ error: 'Wallet session does not match the requested account.' });
  }

  db.get(
    `SELECT wallet_address FROM accounts WHERE id = ?`,
    [accountId],
    (err, account) => {
      if (err) return res.status(500).json({ error: 'Unable to load account.' });
      if (!account) return res.status(404).json({ error: "Account not found" });
      if (account.wallet_address.toLowerCase() !== wallet.toLowerCase()) {
        return res.status(403).json({ error: 'Wallet does not own this account.' });
      }

      refreshRiskBaselines(accountId, (baselineErr, refreshedAccount) => {
        if (baselineErr) return res.status(500).json({ error: 'Unable to update daily account baselines.' });
        account = refreshedAccount;
        refreshAccountLock(account, (unlockErr, activeLock) => {
        if (unlockErr) return res.status(500).json({ error: 'Unable to refresh account lock status.' });
        db.all(`SELECT * FROM trades WHERE account_id = ? ORDER BY created_at DESC`, [accountId], (err2, trades) => {
        if (err2) return res.status(500).json({ error: 'Unable to load account trades.' });
        const totalProfit = account.current_equity - account.initial_balance;
        const profitProgress = Math.min(100, Math.max(0, (totalProfit / account.profit_target) * 100));
        
        const maxAllowedDD = account.initial_balance * (account.max_drawdown_pct / 100);
        const mllFloor = getMllFloor(account, account);
        const riskBalance = getRiskBalance(account);
        const currentDD = Math.max(0, account.high_water_mark - riskBalance);
        const ddProgress = Math.min(100, Math.max(0, (currentDD / maxAllowedDD) * 100));

        const maxAllowedDLL = account.daily_starting_balance * (account.daily_loss_pct / 100);
        const currentDLL = Math.max(0, account.daily_starting_balance - riskBalance);
        const dllProgress = Math.min(100, Math.max(0, (currentDLL / maxAllowedDLL) * 100));
        const withdrawalFloor = getProtectedPayoutBalance(account.initial_balance, account.max_drawdown_pct);
        const withdrawableAmount = getAvailableGrossWithdrawal(
          account.current_balance,
          withdrawalFloor,
          Number(account.pending_withdrawal_amount || 0)
        );

        let consistencyScore = 100;
        if (trades && trades.length > 0) {
          const closedTrades = trades.filter(t => t.status === 'CLOSED');
          if (closedTrades.length > 0) {
            const profits = closedTrades.map(t => t.pnl);
            const maxWin = Math.max(...profits, 0);
            const totalPnLSum = profits.reduce((a, b) => a + b, 0);
            if (totalPnLSum > 0) {
              consistencyScore = Math.max(20, Math.round(100 - ((maxWin / totalPnLSum) * 50)));
            }
          }
        }

        db.all(
          `SELECT day, opening_balance, closing_balance, profit
           FROM daily_account_summaries WHERE account_id = ? ORDER BY day`,
          [accountId],
          (summaryErr, dailySummaries) => {
            if (summaryErr) return res.status(500).json({ error: 'Unable to load daily profit history.' });
            db.all(
              'SELECT day, body, updated_at FROM account_trade_journals WHERE account_id = ? ORDER BY day',
              [accountId],
              (journalErr, journalEntries) => {
                if (journalErr) return res.status(500).json({ error: 'Unable to load account trade journal entries.' });
                res.json({
                  account,
                  lock: activeLock,
                  metrics: {
                    profitProgress: profitProgress.toFixed(1),
                    profitTarget: account.profit_target,
                    currentProfit: totalProfit,
                    ddProgress: ddProgress.toFixed(1),
                    maxAllowedDD,
                    currentDD,
                    mllFloor,
                    dllProgress: dllProgress.toFixed(1),
                    maxAllowedDLL,
                    currentDLL,
                    withdrawalFloor,
                    pendingWithdrawalAmount: Number(account.pending_withdrawal_amount || 0),
                    withdrawableAmount,
                    withdrawalPending: Number(account.pending_withdrawal_amount || 0) > 0,
                    riskBalance,
                    consistencyScore
                  },
                  dailySummaries: dailySummaries || [],
                  journalEntries: journalEntries || [],
                  trades: trades || []
                });
              }
            );
          }
        );
        });
      });
      });
    }
  );
});

app.put('/api/accounts/:accountId/journal', sensitiveLimiter, requireWalletSession, (req, res) => {
  const { accountId } = req.params;
  const { day, body } = req.body || {};
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
      !Number.isFinite(Date.parse(`${day}T00:00:00.000Z`)) ||
      new Date(`${day}T00:00:00.000Z`).toISOString().slice(0, 10) !== day ||
      day > new Date().toISOString().slice(0, 10)) {
    return res.status(400).json({ error: 'Choose a valid calendar day that is not in the future.' });
  }
  if (typeof body !== 'string' || body.length > 5000) {
    return res.status(400).json({ error: 'Journal entries must be text of 5,000 characters or fewer.' });
  }
  const journalText = body.trim();
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(journalText)) {
    return res.status(400).json({ error: 'Journal entries cannot contain control characters.' });
  }

  db.get(
    'SELECT wallet_address FROM accounts WHERE id = ?',
    [accountId],
    (accountErr, account) => {
      if (accountErr) return res.status(500).json({ error: 'Unable to verify account ownership.' });
      if (!account || account.wallet_address?.toLowerCase() !== req.walletAddress) {
        return res.status(403).json({ error: 'You do not own this account.' });
      }

      if (!journalText) {
        return db.run(
          'DELETE FROM account_trade_journals WHERE account_id = ? AND day = ?',
          [accountId, day],
          function(deleteErr) {
            if (deleteErr) return res.status(500).json({ error: 'Unable to delete the journal entry.' });
            res.json({ entry: null, deleted: this.changes > 0 });
          }
        );
      }

      db.run(
        `INSERT INTO account_trade_journals (account_id, day, body, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(account_id, day) DO UPDATE SET
           body = excluded.body,
           updated_at = CURRENT_TIMESTAMP`,
        [accountId, day, journalText],
        (saveErr) => {
          if (saveErr) return res.status(500).json({ error: 'Unable to save the journal entry.' });
          db.get(
            'SELECT day, body, updated_at FROM account_trade_journals WHERE account_id = ? AND day = ?',
            [accountId, day],
            (entryErr, entry) => {
              if (entryErr) return res.status(500).json({ error: 'Unable to confirm the saved journal entry.' });
              res.json({ entry });
            }
          );
        }
      );
    }
  );
});

// --- SECURE PURCHASE ENDPOINT (WITH MULTI-CHAIN ON-CHAIN VERIFICATION) ---
function findUsedFinancialTransactionId(transactionId, callback) {
  const isEvmTransaction = /^0x[0-9a-f]{64}$/i.test(transactionId);
  const comparisonFor = column => isEvmTransaction
    ? `LOWER(${column}) = LOWER(?)`
    : `${column} = ?`;
  db.get(
    `SELECT EXISTS(SELECT 1 FROM purchases WHERE chain_id > 0 AND ${comparisonFor('tx_hash')})
         OR EXISTS(SELECT 1 FROM withdrawals WHERE payout_tx_hash IS NOT NULL AND ${comparisonFor('payout_tx_hash')})
         OR EXISTS(SELECT 1 FROM referral_withdrawals WHERE payout_tx_hash IS NOT NULL AND ${comparisonFor('payout_tx_hash')}) AS used`,
    [transactionId, transactionId, transactionId],
    (err, row) => callback(err, Boolean(row?.used))
  );
}

app.post('/api/accounts/purchase', sensitiveLimiter, requireWalletSession, requireUserNotSuspended, async (req, res) => {
  const { wallet_address, plan_id, tx_hash, chain_id } = req.body;
  const paymentAsset = typeof req.body?.payment_asset === 'string' ? req.body.payment_asset.toUpperCase() : 'USDT';
  const quantity = Number(req.body?.quantity ?? 1);
  const maxPurchaseQuantity = 10;
  const promoCode = typeof req.body?.promo_code === 'string' ? req.body.promo_code.trim().toUpperCase() : '';
  if (req.body?.disclaimer_version !== DISCLAIMER_VERSION ||
      req.body?.terms_accepted !== true ||
      req.body?.simulated_funds_acknowledged !== true) {
    return res.status(400).json({ error: 'Confirm the current disclaimers and simulated-funds acknowledgement before purchasing.' });
  }
  if (normalizeWalletAddress(wallet_address, req.walletType) !== req.walletAddress ||
      !Number.isInteger(Number(plan_id)) || Number(plan_id) <= 0 ||
      !Number.isInteger(quantity) || quantity < 1 || quantity > maxPurchaseQuantity ||
      (req.body?.promo_code != null && (typeof req.body.promo_code !== 'string' || req.body.promo_code.length > 32))) {
    return res.status(400).json({ error: `Provide a valid plan and a quantity from 1 to ${maxPurchaseQuantity}.` });
  }

  const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
  });
  try {
    const [plan, settings, referralSettings] = await Promise.all([
      dbGet('SELECT * FROM plans WHERE id = ? AND active = 1', [Number(plan_id)]),
      dbGet('SELECT standard_discount_pct FROM battlepass_settings WHERE id = 1'),
      dbGet('SELECT level_one_pct, level_two_pct FROM referral_settings WHERE id = 1')
    ]);
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });
    const standardDiscountPct = Math.max(0, Math.min(100, Number(settings?.standard_discount_pct ?? 90)));
    const levelOneCommissionPct = Math.max(0, Math.min(100, Number(referralSettings?.level_one_pct ?? 2)));
    const levelTwoCommissionPct = Math.max(0, Math.min(100, Number(referralSettings?.level_two_pct ?? 2)));
    let rewardCode = null;
    let packCertificate = null;
    let referrerWallet = null;
    let referralCommissionPct = 10;
    let bonusDiscountPct = 0;
    if (promoCode) {
      const [certificate, creator, coupon] = await Promise.all([
        dbGet(
          `SELECT code, wallet_address, discount_pct, eligible_plan_id, redeemed_at
           FROM battlepass_discount_certificates WHERE UPPER(code) = ?`,
          [promoCode]
        ),
        dbGet('SELECT wallet_address, level_one_pct_override FROM users WHERE UPPER(discount_code) = ?', [promoCode]),
        dbGet(
          `SELECT code, wallet_address, discount_bonus_pct FROM battlepass_reward_codes
           WHERE UPPER(code) = ? AND redeemed_at IS NULL`,
          [promoCode]
        )
      ]);
      if (certificate) {
        if (certificate.wallet_address.toLowerCase() !== wallet_address.toLowerCase()) {
          return res.status(403).json({ error: 'This discount certificate belongs to another wallet.' });
        }
        if (certificate.redeemed_at) return res.status(409).json({ error: 'This discount certificate has already been used.' });
        if (certificate.eligible_plan_id != null && Number(certificate.eligible_plan_id) !== Number(plan_id)) {
          return res.status(400).json({ error: 'This discount certificate can only be used for its eligible account type.' });
        }
        if (quantity !== 1) return res.status(400).json({ error: 'A discount certificate can only be used to buy one account.' });
        packCertificate = certificate;
      } else if (creator) {
        referrerWallet = creator.wallet_address;
        referralCommissionPct = Number(creator.level_one_pct_override ?? levelOneCommissionPct);
      } else if (coupon && coupon.wallet_address.toLowerCase() === wallet_address.toLowerCase()) {
        rewardCode = coupon;
        bonusDiscountPct = Number(coupon.discount_bonus_pct);
      } else {
        return res.status(400).json({ error: 'Invalid, used, or wallet-bound promo code.' });
      }
    }

    const totalDiscountPct = packCertificate
      ? Number(packCertificate.discount_pct)
      : promoCode ? Math.min(100, standardDiscountPct + bonusDiscountPct) : 0;
    const finalPrice = Math.round(Number(plan.base_price_usdt) * (100 - totalDiscountPct)) / 100;
    const totalPrice = Math.round(finalPrice * quantity * 100) / 100;
    const isFreeRedemption = finalPrice === 0;
    if (isFreeRedemption && quantity > 1) {
      return res.status(400).json({ error: 'Free or fully discounted purchases are limited to one account per checkout.' });
    }
    let normalizedTxHash;
    let purchaseChainId = 0;
    let payerAddress = null;
    if (!isFreeRedemption) {
      if (typeof tx_hash !== 'string' || !Number.isInteger(Number(chain_id)) ||
          !['USDT', 'USDC'].includes(paymentAsset)) {
        return res.status(400).json({ error: 'A valid payment transaction and network are required.' });
      }
      purchaseChainId = Number(chain_id);
      let verification;
      if (purchaseChainId === 101) {
        const paymentWallet = req.body?.payment_wallet_address;
        if (req.walletType !== 'SOLANA' ||
            normalizeWalletAddress(paymentWallet, 'SOLANA') !== wallet_address) {
          return res.status(403).json({ error: 'Solana payments are available only to the active Solana wallet.' });
        }
        if (!/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(tx_hash)) {
          return res.status(400).json({ error: 'A valid Solana transaction signature is required.' });
        }
        verification = await verifySolanaPurchase(tx_hash, paymentWallet, paymentAsset, totalPrice);
        payerAddress = paymentWallet;
      } else {
        if (req.walletType !== 'EVM') {
          return res.status(403).json({ error: 'EVM payments are available only to the active EVM wallet.' });
        }
        if (!/^0x[0-9a-fA-F]{64}$/.test(tx_hash)) {
          return res.status(400).json({ error: 'A valid EVM payment transaction is required.' });
        }
        verification = await verifyMultiChainPurchase(
          tx_hash, purchaseChainId, wallet_address, totalPrice, TREASURY_WALLET, paymentAsset
        );
        payerAddress = wallet_address;
      }
      if (!verification.success) return res.status(400).json({ error: verification.error });
      normalizedTxHash = purchaseChainId === 101 ? tx_hash : tx_hash.toLowerCase();
    } else {
      normalizedTxHash = rewardCode
        ? `pass_${rewardCode.code.toLowerCase()}`
        : `free_${crypto.randomBytes(16).toString('hex')}`;
    }
    const recordedPaymentAsset = isFreeRedemption ? 'FREE' : paymentAsset;

    db.run('INSERT OR IGNORE INTO users (wallet_address) VALUES (?)', [wallet_address], (userErr) => {
      if (userErr) return res.status(500).json({ error: 'Unable to prepare the purchasing account.' });
      db.get(
        `SELECT COALESCE(xp_reward, 1000) AS xp_reward, COALESCE(points_reward, 100) AS points_reward
         FROM battlepass_plan_rewards WHERE plan_id = ?`,
        [Number(plan_id)],
        (rewardErr, planReward) => {
          if (rewardErr) return res.status(500).json({ error: 'Unable to load plan battle pass rewards.' });
          const xpAward = Number(planReward?.xp_reward ?? 1000) * quantity;
          const pointsAward = Number(planReward?.points_reward ?? 100) * quantity;
          const accountIds = Array.from({ length: quantity }, () => `acc_${crypto.randomBytes(8).toString('hex')}`);
          const accountId = accountIds[0];
          db.serialize(() => {
            db.run('BEGIN IMMEDIATE', (beginErr) => {
              if (beginErr) return res.status(500).json({ error: 'Unable to start account provisioning.' });
              const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
              db.get(
                'SELECT admin_suspended, admin_suspend_reason FROM users WHERE LOWER(wallet_address) = LOWER(?)',
                [wallet_address],
                (userErr, user) => {
                  if (userErr) return rollback(500, 'Unable to verify user account access.');
                  if (Number(user?.admin_suspended) === 1) {
                    return rollback(403, `This user account is suspended by an administrator${user.admin_suspend_reason ? `: ${user.admin_suspend_reason}` : '.'}`);
                  }
                  db.run(
                    `INSERT INTO purchases (
                       tx_hash, chain_id, wallet_address, account_id, quantity, amount_usdt, payment_asset, payer_address
                     )
                     SELECT ?, ?, ?, ?, ?, ?, ?, ?
                     WHERE NOT EXISTS (
                       SELECT 1 FROM purchases
                       WHERE chain_id > 0
                         AND ${purchaseChainId === 101 ? 'tx_hash = ?' : 'LOWER(tx_hash) = LOWER(?)'}
                     )
                       AND NOT EXISTS (
                       SELECT 1 FROM withdrawals
                       WHERE payout_tx_hash IS NOT NULL
                         AND ${purchaseChainId === 101 ? 'payout_tx_hash = ?' : 'LOWER(payout_tx_hash) = LOWER(?)'}
                     )
                       AND NOT EXISTS (
                       SELECT 1 FROM referral_withdrawals
                       WHERE payout_tx_hash IS NOT NULL
                         AND ${purchaseChainId === 101 ? 'payout_tx_hash = ?' : 'LOWER(payout_tx_hash) = LOWER(?)'}
                     )`,
                    [
                      normalizedTxHash, purchaseChainId, wallet_address, accountId, quantity,
                      totalPrice, recordedPaymentAsset, payerAddress,
                      normalizedTxHash, normalizedTxHash, normalizedTxHash
                    ],
                    function(purchaseErr) {
                      if (purchaseErr) {
                        console.error('Unable to record verified purchase and payment amount:', purchaseErr.message);
                        const duplicatePurchase = /UNIQUE constraint failed: purchases\.tx_hash|PRIMARY KEY constraint failed/i
                          .test(purchaseErr.message || '');
                        return rollback(
                          duplicatePurchase ? 409 : 500,
                          duplicatePurchase
                            ? 'This transaction or discount code has already been used.'
                            : 'Unable to record the verified purchase amount.'
                        );
                      }
                      if (this.changes !== 1) return rollback(409, 'This transaction ID has already been used.');
                  const provisionAccounts = (index, onComplete) => {
                    if (index >= accountIds.length) return onComplete();
                    db.run(
                      `INSERT INTO accounts (id, wallet_address, plan_id, initial_balance, current_balance,
                         current_equity, high_water_mark, daily_starting_balance, risk_day, status)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
                      [
                        accountIds[index], wallet_address, Number(plan_id), plan.simulated_capital,
                        plan.simulated_capital, plan.simulated_capital, plan.simulated_capital,
                        plan.simulated_capital, new Date().toISOString().slice(0, 10)
                      ],
                      accountErr => accountErr
                        ? rollback(500, 'Unable to provision all purchased accounts.')
                        : provisionAccounts(index + 1, onComplete)
                    );
                  };
                  const completeProvisioning = () => provisionAccounts(0, () => {
                      const finishPurchase = () => db.run('COMMIT', (commitErr) => {
                        if (commitErr) return rollback(500, 'Unable to commit account provisioning.');
                        res.json({
                          success: true,
                          account_id: accountId,
                          account_ids: accountIds,
                          quantity,
                          xp_awarded: isFreeRedemption ? 0 : xpAward,
                          points_awarded: isFreeRedemption ? 0 : pointsAward,
                          message: isFreeRedemption
                            ? 'Free battle pass account provisioned successfully.'
                            : `${quantity} account${quantity === 1 ? '' : 's'} provisioned; payment verified successfully.`
                        });
                      });
                      const recordReferralCommissions = () => {
                        if (!referrerWallet || referrerWallet.toLowerCase() === wallet_address.toLowerCase()) {
                          return finishPurchase();
                        }
                        db.run(
                          `UPDATE users SET referred_by = ?
                           WHERE LOWER(wallet_address) = LOWER(?)
                             AND (referred_by IS NULL OR TRIM(referred_by) = '')`,
                          [referrerWallet, wallet_address],
                          attributionErr => {
                            if (attributionErr) return rollback(500, 'Unable to save referral attribution.');
                            db.run(
                              `INSERT INTO referrals
                               (referrer_wallet, referee_wallet, plan_id, paid_amount, commission_earned, commission_pct, level, purchase_tx_hash, purchase_chain_id)
                                VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
                              [
                                referrerWallet,
                                wallet_address,
                                Number(plan_id),
                                totalPrice,
                                totalPrice * referralCommissionPct / 100,
                                referralCommissionPct,
                                normalizedTxHash,
                                purchaseChainId
                              ],
                              referralErr => {
                                if (referralErr) return rollback(500, 'Unable to record the direct referral commission.');
                                db.get(
                                  'SELECT referred_by, level_two_pct_override FROM users WHERE LOWER(wallet_address) = LOWER(?)',
                                  [referrerWallet],
                                  (parentErr, parent) => {
                                    if (parentErr) return rollback(500, 'Unable to load level-2 referral attribution.');
                                    const secondLevelWallet = parent?.referred_by;
                                    const secondLevelCommissionPct = Number(parent?.level_two_pct_override ?? levelTwoCommissionPct);
                                    if (!secondLevelWallet ||
                                        secondLevelWallet.toLowerCase() === wallet_address.toLowerCase() ||
                                        secondLevelWallet.toLowerCase() === referrerWallet.toLowerCase()) {
                                      return finishPurchase();
                                    }
                                    db.run(
                                      `INSERT INTO referrals
                                       (referrer_wallet, referee_wallet, plan_id, paid_amount, commission_earned, commission_pct, level, purchase_tx_hash, purchase_chain_id)
                                       VALUES (?, ?, ?, ?, ?, ?, 2, ?, ?)`,
                                      [
                                        secondLevelWallet,
                                        wallet_address,
                                        Number(plan_id),
                                        totalPrice,
                                        totalPrice * secondLevelCommissionPct / 100,
                                        secondLevelCommissionPct,
                                        normalizedTxHash,
                                        purchaseChainId
                                      ],
                                      levelTwoErr => levelTwoErr
                                        ? rollback(500, 'Unable to record the level-2 referral commission.')
                                        : finishPurchase()
                                    );
                                  }
                                );
                              }
                            );
                          }
                        );
                      };
                      if (isFreeRedemption) return recordReferralCommissions();
                      db.run('INSERT OR IGNORE INTO battlepass_users (wallet_address) VALUES (?)', [wallet_address], (battlePassErr) => {
                        if (battlePassErr) return rollback(500, 'Unable to prepare battle pass purchase rewards.');
                        db.run(
                          `UPDATE battlepass_users SET xp = xp + ?, points = points + ?, updated_at = CURRENT_TIMESTAMP
                           WHERE LOWER(wallet_address) = LOWER(?)`,
                          [xpAward, pointsAward, wallet_address],
                          (balanceErr) => {
                            if (balanceErr) return rollback(500, 'Unable to apply battle pass purchase rewards.');
                            db.run(
                              `INSERT INTO battlepass_events (id, wallet_address, event_type, reference_id, xp, points)
                               VALUES (?, ?, 'PURCHASE', ?, ?, ?)`,
                              [`bpe_${crypto.randomBytes(10).toString('hex')}`, wallet_address, normalizedTxHash, xpAward, pointsAward],
                              (eventErr) => eventErr
                                ? rollback(500, 'Unable to record battle pass purchase rewards.')
                                : recordReferralCommissions()
                            );
                          }
                        );
                      });
                    });
                  if (packCertificate) {
                    return db.run(
                      `UPDATE battlepass_discount_certificates
                       SET redeemed_at = CURRENT_TIMESTAMP, purchase_tx_hash = ?
                       WHERE code = ? AND LOWER(wallet_address) = LOWER(?) AND redeemed_at IS NULL
                         AND (eligible_plan_id IS NULL OR eligible_plan_id = ?)`,
                      [normalizedTxHash, packCertificate.code, wallet_address, Number(plan_id)],
                      function(redeemErr) {
                        if (redeemErr) return rollback(500, 'Unable to redeem the discount certificate.');
                        if (this.changes !== 1) return rollback(409, 'This discount certificate has already been used or is not eligible for this account type.');
                        completeProvisioning();
                      }
                    );
                  }
                  if (!rewardCode) return completeProvisioning();
                  db.run(
                    `UPDATE battlepass_reward_codes SET redeemed_at = CURRENT_TIMESTAMP
                     WHERE code = ? AND LOWER(wallet_address) = LOWER(?) AND redeemed_at IS NULL`,
                    [rewardCode.code, wallet_address],
                    function(redeemErr) {
                      if (redeemErr) return rollback(500, 'Unable to redeem the battle pass discount code.');
                      if (this.changes !== 1) return rollback(409, 'This battle pass discount code has already been used.');
                      completeProvisioning();
                    }
                  );
                    }
                  );
                }
              );
            });
          });
        }
      );
    });
  } catch (error) {
    console.error('Unable to calculate purchase price:', error.message);
    return res.status(500).json({ error: 'Unable to calculate the current purchase price.' });
  }
});

// --- SECURE WITHDRAWAL REQUEST ENDPOINT ---
app.post('/api/withdrawals/request', sensitiveLimiter, requireTradeSignature, requireUserNotSuspended, (req, res) => {
    const { account_id, wallet_address, amount } = req.body;
    const amountValue = Math.round(Number(amount) * 100) / 100;
    const payoutChainId = Number(req.body?.payout_chain_id);
    const payoutAsset = typeof req.body?.payout_asset === 'string' ? req.body.payout_asset.toUpperCase() : '';
    const userIp = req.ip;

    if (normalizeWalletAddress(wallet_address, req.walletType) !== req.walletAddress ||
        !account_id || !Number.isFinite(amountValue) || amountValue <= 0 ||
        !isValidPayoutSelection(req.walletType, payoutChainId, payoutAsset)) {
        return res.status(400).json({ success: false, error: "Invalid request parameters." });
    }

    const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ success: false, error }));
    db.serialize(() => {
      db.run('BEGIN IMMEDIATE', (beginErr) => {
        if (beginErr) return res.status(500).json({ success: false, error: 'Unable to start withdrawal request.' });
        db.get(`
            SELECT a.*, p.name as plan_name, p.max_drawdown_pct,
                   COALESCE(u.admin_suspended, 0) AS user_suspended, u.admin_suspend_reason
            FROM accounts a 
            JOIN plans p ON a.plan_id = p.id 
            LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(a.wallet_address)
            WHERE a.id = ? AND LOWER(a.wallet_address) = LOWER(?)
        `, [account_id, wallet_address], (accountErr, account) => {
          if (accountErr) return rollback(500, 'Unable to load account.');
          if (!account) return rollback(404, 'Account not found or wallet mismatch.');
          if (Number(account.user_suspended) === 1) {
            return rollback(403, `This user account is suspended by an administrator${account.admin_suspend_reason ? `: ${account.admin_suspend_reason}` : '.'}`);
          }
          if (Number(account.admin_frozen) === 1) return rollback(403, 'This account is frozen by an administrator.');
          if (account.status !== 'ACTIVE') return rollback(400, 'Account is not active.');

          db.get(
            `SELECT COALESCE(SUM(amount), 0) AS pending_amount, COUNT(*) AS pending_count FROM withdrawals
             WHERE account_id = ? AND status = 'PENDING'`,
            [account_id],
            (sumErr, row) => {
              if (sumErr) return rollback(500, 'Unable to verify pending payouts.');
              if (Number(row.pending_count) > 0) {
                return rollback(409, 'A withdrawal is already awaiting admin review; trading remains frozen until it is resolved.');
              }
              const withdrawalFloor = getProtectedPayoutBalance(account.initial_balance, account.max_drawdown_pct);
              const pendingAmount = Number(row.pending_amount) || 0;
              const maxAllowableWithdrawal = getAvailableGrossWithdrawal(
                account.current_balance,
                withdrawalFloor,
                pendingAmount
              );
              if (amountValue > maxAllowableWithdrawal) {
                return rollback(400, `Withdrawal exceeds the amount above the protected account balance of $${withdrawalFloor.toLocaleString()}. Available to request: $${maxAllowableWithdrawal.toFixed(2)} USDT.`);
              }

              const withdrawalId = `WDR-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
              const { gross, userAmount, adminShare } = splitWithdrawal(amountValue);
              db.run(
                `INSERT INTO withdrawals
                 (id, account_id, wallet_address, type, plan_name, amount, user_amount, admin_share,
                  user_ip, payout_chain_id, payout_asset, status, funds_deducted, created_at)
                 VALUES (?, ?, ?, 'PROFIT_SPLIT', ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, datetime('now'))`,
                [
                  withdrawalId, account_id, wallet_address, account.plan_name, gross,
                  userAmount, adminShare, userIp, payoutChainId, payoutAsset
                ],
                (insertErr) => {
                  if (insertErr) return rollback(500, 'Unable to record withdrawal request.');
                  db.run('COMMIT', (commitErr) => {
                    if (commitErr) return rollback(500, 'Unable to complete withdrawal request.');
                    res.json({
                      success: true,
                      message: 'Withdrawal request submitted for admin review.',
                      gross_amount: gross,
                      user_amount: userAmount,
                      admin_share: adminShare,
                      protected_balance: withdrawalFloor
                    });
                  });
                }
              );
            }
          );
        });
      });
    });
});

function loadAdminWithdrawals(req, res) {
  db.all(
    `SELECT w.id, w.account_id, w.wallet_address, w.amount, w.status, w.created_at, w.approved_at,
     w.payout_tx_hash, w.funds_deducted,
     'ACCOUNT' as type, p.name as plan_name, w.user_ip, a.current_balance AS account_balance,
     a.initial_balance, a.high_water_mark, a.admin_frozen, a.admin_freeze_reason,
     COALESCE(u.username, '') AS username,
     p.max_drawdown_pct,
     COALESCE(w.user_amount, ROUND(w.amount * 0.9, 2)) AS user_amount,
     COALESCE(w.admin_share, ROUND(w.amount - ROUND(w.amount * 0.9, 2), 2)) AS admin_share,
     w.payout_chain_id, COALESCE(w.payout_asset, 'USDT') AS payout_asset
     FROM withdrawals w 
     JOIN accounts a ON w.account_id = a.id 
     JOIN plans p ON a.plan_id = p.id
     LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(w.wallet_address)
     UNION ALL
     SELECT id as id, NULL as account_id, wallet_address, amount, status, created_at,
      NULL AS approved_at, payout_tx_hash, NULL AS funds_deducted,
      'COMMISSION' as type, 'Referral Commission' as plan_name, NULL AS user_ip, NULL as account_balance,
      NULL AS initial_balance, NULL AS high_water_mark, NULL AS admin_frozen,
      NULL AS admin_freeze_reason,
      COALESCE((SELECT username FROM users WHERE LOWER(wallet_address) = LOWER(referral_withdrawals.wallet_address)), '') AS username,
      NULL AS max_drawdown_pct, amount AS user_amount, 0 AS admin_share,
      payout_chain_id, COALESCE(payout_asset, 'USDT') AS payout_asset
     FROM referral_withdrawals
     ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Unable to load withdrawal queue.' });
      const withdrawals = rows || [];
      const accountIds = [...new Set(withdrawals.filter(row => row.type === 'ACCOUNT').map(row => row.account_id))];
      db.all(
        `SELECT li.wallet_address, li.ip_address, MIN(li.created_at) AS first_seen, MAX(li.created_at) AS last_seen,
                COUNT(*) AS login_count
         FROM user_login_ip_events li
         WHERE li.created_at >= datetime('now', '-180 days')
           AND LOWER(li.wallet_address) IN (
             SELECT LOWER(wallet_address) FROM withdrawals WHERE wallet_address IS NOT NULL
             UNION SELECT LOWER(wallet_address) FROM referral_withdrawals WHERE wallet_address IS NOT NULL
           )
         GROUP BY LOWER(li.wallet_address), li.ip_address`,
        [],
        (ipErr, loginRows) => {
          if (ipErr) return res.status(500).json({ error: 'Unable to load payout login IP history.' });
          db.all(
            `SELECT a.id, a.wallet_address, a.plan_id, p.name AS plan_name, a.status, a.initial_balance,
                    a.current_balance, a.current_equity, a.created_at, a.admin_frozen
             FROM accounts a LEFT JOIN plans p ON p.id = a.plan_id
             WHERE LOWER(a.wallet_address) IN (
               SELECT LOWER(wallet_address) FROM withdrawals WHERE wallet_address IS NOT NULL
               UNION SELECT LOWER(wallet_address) FROM referral_withdrawals WHERE wallet_address IS NOT NULL
             )
             ORDER BY a.created_at DESC`,
            [],
            (accountErr, accountRows) => {
              if (accountErr) return res.status(500).json({ error: 'Unable to load payout account history.' });
              db.all(
                `SELECT t.id, t.account_id, t.symbol, t.side, t.entry_price, t.size_usd, t.pnl,
                        t.status, t.created_at, t.closed_at, t.order_type, t.trigger_price
                 FROM trades t
                 WHERE t.account_id IN (
                   SELECT a.id FROM accounts a
                   WHERE LOWER(a.wallet_address) IN (
                     SELECT LOWER(wallet_address) FROM withdrawals WHERE wallet_address IS NOT NULL
                     UNION SELECT LOWER(wallet_address) FROM referral_withdrawals WHERE wallet_address IS NOT NULL
                   )
                 )
                 ORDER BY t.created_at DESC`,
                [],
                (tradeErr, tradeRows) => {
                  if (tradeErr) return res.status(500).json({ error: 'Unable to load payout trade history.' });
                  db.all(
                    `WITH withdrawal_wallets AS (
                       SELECT LOWER(wallet_address) AS wallet_address FROM withdrawals WHERE wallet_address IS NOT NULL
                       UNION SELECT LOWER(wallet_address) FROM referral_withdrawals WHERE wallet_address IS NOT NULL
                     ),
                     target_ips AS (
                       SELECT DISTINCT ip_address FROM user_login_ip_events
                       WHERE created_at >= datetime('now', '-180 days')
                         AND LOWER(wallet_address) IN (SELECT wallet_address FROM withdrawal_wallets)
                     )
                     SELECT DISTINCT LOWER(li.wallet_address) AS wallet_address, li.ip_address,
                            COALESCE(u.username, '') AS username, a.id AS account_id,
                            p.name AS plan_name, a.status AS account_status
                     FROM user_login_ip_events li
                     JOIN target_ips ti ON ti.ip_address = li.ip_address
                     LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(li.wallet_address)
                     LEFT JOIN accounts a ON LOWER(a.wallet_address) = LOWER(li.wallet_address)
                     LEFT JOIN plans p ON p.id = a.plan_id
                     WHERE li.created_at >= datetime('now', '-180 days')
                     ORDER BY LOWER(li.wallet_address), li.ip_address, a.created_at DESC`,
                    [],
                    (relatedErr, relatedRows) => {
                      if (relatedErr) return res.status(500).json({ error: 'Unable to load wallets sharing payout login IPs.' });
                      db.all(
                        `SELECT r.referrer_wallet, r.referee_wallet, r.plan_id, r.paid_amount,
                                r.commission_earned, r.commission_pct, r.level, r.created_at,
                                r.purchase_tx_hash, r.purchase_chain_id, p.name AS plan_name,
                                purchase.account_id AS purchase_account_id,
                                purchase.amount_usdt AS purchase_amount_usdt,
                                purchase.quantity AS purchase_quantity
                         FROM referrals r LEFT JOIN plans p ON p.id = r.plan_id
                         LEFT JOIN purchases purchase ON purchase.tx_hash = r.purchase_tx_hash
                         WHERE LOWER(r.referrer_wallet) IN (
                           SELECT LOWER(wallet_address) FROM referral_withdrawals
                         )
                         ORDER BY r.created_at DESC`,
                        [],
                        (referralErr, referralRows) => {
                          if (referralErr) return res.status(500).json({ error: 'Unable to load referral payout provenance.' });
                          db.all(
                            `SELECT allocation.withdrawal_id, allocation.amount AS allocated_amount,
                                    r.referrer_wallet, r.referee_wallet, r.plan_id, r.paid_amount,
                                    r.commission_earned, r.commission_pct, r.level, r.created_at,
                                    r.purchase_tx_hash, r.purchase_chain_id, p.name AS plan_name,
                                    purchase.account_id AS purchase_account_id,
                                    purchase.amount_usdt AS purchase_amount_usdt,
                                    purchase.quantity AS purchase_quantity
                             FROM referral_withdrawal_allocations allocation
                             JOIN referrals r ON r.id = allocation.referral_id
                             LEFT JOIN plans p ON p.id = r.plan_id
                             LEFT JOIN purchases purchase ON purchase.tx_hash = r.purchase_tx_hash
                             ORDER BY allocation.withdrawal_id, r.created_at, r.id`,
                            [],
                            (allocationErr, allocationRows) => {
                              if (allocationErr) return res.status(500).json({ error: 'Unable to load referral payout allocations.' });
                              const keyWallet = value => String(value || '').toLowerCase();
                              const loginIps = new Map();
                              for (const row of loginRows || []) {
                                const key = keyWallet(row.wallet_address);
                                loginIps.set(key, [...(loginIps.get(key) || []), row]);
                              }
                              const accountsByWallet = new Map();
                              const accountsById = new Map();
                              for (const row of accountRows || []) {
                                const key = keyWallet(row.wallet_address);
                                accountsByWallet.set(key, [...(accountsByWallet.get(key) || []), { ...row, trades: [] }]);
                                accountsById.set(row.id, accountsByWallet.get(key)[accountsByWallet.get(key).length - 1]);
                              }
                              for (const trade of tradeRows || []) {
                                const account = accountsById.get(trade.account_id);
                                if (account) account.trades.push(trade);
                              }
                              const relatedByTarget = new Map();
                              for (const row of relatedRows || []) {
                                const relatedKey = `${keyWallet(row.wallet_address)}|${row.ip_address}`;
                                const related = relatedByTarget.get(relatedKey) || {
                                  wallet_address: row.wallet_address,
                                  username: row.username,
                                  ip_address: row.ip_address,
                                  accounts: []
                                };
                                if (row.account_id && !related.accounts.some(account => account.account_id === row.account_id)) {
                                  related.accounts.push({
                                    account_id: row.account_id,
                                    plan_name: row.plan_name,
                                    status: row.account_status
                                  });
                                }
                                relatedByTarget.set(relatedKey, related);
                              }
                              const referralsByWallet = new Map();
                              for (const row of referralRows || []) {
                                const key = keyWallet(row.referrer_wallet);
                                referralsByWallet.set(key, [...(referralsByWallet.get(key) || []), row]);
                              }
                              const referralsByWithdrawal = new Map();
                              for (const row of allocationRows || []) {
                                referralsByWithdrawal.set(
                                  row.withdrawal_id,
                                  [...(referralsByWithdrawal.get(row.withdrawal_id) || []), row]
                                );
                              }
                              const relatedWalletsByIp = new Map();
                              for (const related of relatedByTarget.values()) {
                                relatedWalletsByIp.set(
                                  related.ip_address,
                                  [...(relatedWalletsByIp.get(related.ip_address) || []), related]
                                );
                              }
                              res.json({
                                withdrawals: withdrawals.map(row => {
                                  const key = keyWallet(row.wallet_address);
                                  const ips = loginIps.get(key) || [];
                                  return {
                                    ...row,
                                    trades: row.type === 'ACCOUNT'
                                      ? (accountsById.get(row.account_id)?.trades || [])
                                      : [],
                                    login_ips: ips,
                                    accounts: accountsByWallet.get(key) || [],
                                    related_wallets: [...new Map(
                                      ips.flatMap(ip => relatedWalletsByIp.get(ip.ip_address) || [])
                                        .filter(related => keyWallet(related.wallet_address) !== key)
                                        .map(related => [`${keyWallet(related.wallet_address)}|${related.ip_address}`, related])
                                    ).values()],
                                    referral_transactions: row.type === 'COMMISSION'
                                      ? (referralsByWithdrawal.get(row.id) || referralsByWallet.get(key) || [])
                                      : [],
                                    referral_transactions_exact: row.type === 'COMMISSION' && referralsByWithdrawal.has(row.id)
                                  };
                                })
                              });
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

app.get('/api/admin/withdrawals', requireWalletSession, requireAdminSession, loadAdminWithdrawals);
app.post('/api/admin/withdrawals', sensitiveLimiter, requireTradeSignature, requireAdminWallet, loadAdminWithdrawals);

app.post('/api/admin/hedging-alerts', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  db.all(
    `SELECT h.id, h.wallet_address, COALESCE(u.username, '') AS username, h.symbol,
     h.attempted_account_id, h.attempted_side, h.conflicting_side, h.created_at,
     GROUP_CONCAT(DISTINCT CASE WHEN ha.account_id != h.attempted_account_id THEN ha.account_id END) AS conflicting_account_ids,
     COUNT(DISTINCT CASE WHEN a.admin_frozen = 1 THEN a.id END) AS frozen_account_count
     FROM hedging_alerts h
     LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(h.wallet_address)
     JOIN hedging_alert_accounts ha ON ha.alert_id = h.id
     JOIN accounts a ON a.id = ha.account_id
     GROUP BY h.id
     HAVING COUNT(DISTINCT CASE WHEN a.admin_frozen = 1 THEN a.id END) > 0
     ORDER BY h.created_at DESC LIMIT 100`,
    [],
    (err, alerts) => {
      if (err) return res.status(500).json({ error: 'Unable to load hedging alerts.' });
      res.json({ alerts: alerts || [] });
    }
  );
});

app.post('/api/admin/users/search', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
  if (query.length < 2 || query.length > 100 || !/^[a-z0-9_]+$/i.test(query)) {
    return res.status(400).json({ error: 'Enter at least 2 letters, numbers, or underscores to search by username or wallet.' });
  }
  db.all(
    `SELECT u.wallet_address, u.username, u.created_at,
            COALESCE(u.admin_suspended, 0) AS admin_suspended, u.admin_suspend_reason,
            (SELECT l.locked_at FROM wallet_security_locks l
             WHERE LOWER(l.wallet_address) = LOWER(u.wallet_address) AND l.cleared_at IS NULL
             ORDER BY l.id DESC LIMIT 1) AS security_locked_at,
            (SELECT i.ip_address FROM wallet_security_locks l
             JOIN ip_security_incidents i ON i.id = l.incident_id
             WHERE LOWER(l.wallet_address) = LOWER(u.wallet_address) AND l.cleared_at IS NULL
             ORDER BY l.id DESC LIMIT 1) AS security_lock_ip,
            (SELECT COUNT(*) FROM user_login_ip_events li
             WHERE LOWER(li.wallet_address) = LOWER(u.wallet_address) AND li.is_new_ip = 1
               AND li.created_at >= datetime('now', '-180 days')) AS new_ip_count,
            (SELECT COUNT(*) FROM accounts a WHERE LOWER(a.wallet_address) = LOWER(u.wallet_address)) AS account_count
     FROM users u
     WHERE instr(LOWER(COALESCE(u.username, '')), LOWER(?)) > 0
        OR instr(LOWER(u.wallet_address), LOWER(?)) > 0
     ORDER BY CASE WHEN LOWER(u.username) = LOWER(?) THEN 0 ELSE 1 END,
              u.username COLLATE NOCASE, u.wallet_address
     LIMIT 25`,
    [query, query, query],
    (err, users) => {
      if (err) return res.status(500).json({ error: 'Unable to search user profiles.' });
      res.json({ users: users || [] });
    }
  );
});

app.post('/api/admin/users/action', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const { user_wallet: wallet, action } = req.body;
  const normalizedWallet = normalizeWalletAddress(wallet);
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  if (!normalizedWallet ||
      !['SUSPEND', 'RESTORE', 'CLEAR_IP_SOFT_LOCK'].includes(action) ||
      (action === 'SUSPEND' && (!reason || reason.length > 500))) {
    return res.status(400).json({ error: 'Choose a valid user, action, and a suspension reason (up to 500 characters).' });
  }
  if (action === 'CLEAR_IP_SOFT_LOCK') {
    if (reason.length > 500) return res.status(400).json({ error: 'The review note must be 500 characters or fewer.' });
    return clearWalletSecurityLock(db, normalizedWallet, req.walletAddress, reason, (clearErr, result) => {
      if (clearErr) {
        console.error('Unable to clear wallet security lock:', clearErr.message);
        return res.status(500).json({ error: 'Unable to clear wallet security lock.' });
      }
      if (!result.cleared) return res.status(404).json({ error: 'No active IP security lock exists for this wallet.' });
      res.json({ success: true, message: 'Wallet security lock cleared after review.' });
    });
  }
  const suspended = action === 'SUSPEND' ? 1 : 0;
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', beginErr => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start user suspension update.' });
      const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
      db.run(
        `UPDATE users SET admin_suspended = ?, admin_suspend_reason = ?, admin_suspended_by = ?,
           admin_suspended_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END
         WHERE LOWER(wallet_address) = LOWER(?)`,
        [suspended, suspended ? reason : null, suspended ? req.body.wallet_address : null, suspended, normalizedWallet],
        function(updateErr) {
          if (updateErr) return rollback(500, 'Unable to update user suspension.');
          if (this.changes !== 1) return rollback(404, 'User not found.');
          db.run(
            `INSERT INTO user_admin_actions (wallet_address, admin_wallet, action, reason)
             VALUES (?, ?, ?, ?)`,
            [normalizedWallet, req.body.wallet_address.toLowerCase(), action, suspended ? reason : null],
            insertErr => {
              if (insertErr) return rollback(500, 'Unable to record the user suspension audit event.');
              db.run('COMMIT', commitErr => {
                if (commitErr) return rollback(500, 'Unable to commit user suspension update.');
                res.json({
                  success: true,
                  message: suspended
                    ? 'User suspended. Account purchases, new trades, and withdrawals are disabled; sign-in, viewing, and closing existing trades remain available.'
                    : 'User suspension removed. Per-account freezes and risk locks remain in effect.'
                });
              });
            }
          );
        }
      );
    });
  });
});

app.post('/api/admin/users/accounts', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const wallet = req.body?.user_wallet;
  const normalizedWallet = normalizeWalletAddress(wallet);
  if (!normalizedWallet) {
    return res.status(400).json({ error: 'Choose a valid user wallet.' });
  }
  loadAdminUserSecurity(normalizedWallet, (securityErr, security) => {
    if (securityErr) return res.status(securityErr.message === 'User not found.' ? 404 : 500).json({ error: "Unable to load this user's security details." });
    db.all(
      `SELECT a.id, a.wallet_address, a.plan_id, a.initial_balance, a.current_balance, a.current_equity,
       a.high_water_mark, a.daily_starting_balance, a.status, a.lock_reason, a.locked_until,
       a.permanent_lock, a.admin_frozen, a.admin_freeze_reason, a.created_at, p.name AS plan_name,
       p.max_drawdown_pct, p.daily_loss_pct,
       EXISTS(SELECT 1 FROM withdrawals w WHERE w.account_id = a.id AND w.status = 'PENDING') AS withdrawal_pending
       FROM accounts a JOIN plans p ON a.plan_id = p.id
       WHERE LOWER(a.wallet_address) = LOWER(?)
       ORDER BY CASE WHEN a.status = 'ACTIVE' THEN 0 ELSE 1 END, a.created_at DESC`,
      [wallet],
      (err, accounts) => {
        if (err) return res.status(500).json({ error: "Unable to load this user's accounts." });
        const rows = accounts || [];
        const loadNext = index => {
          if (index >= rows.length) {
            return db.all(
              `SELECT 'PURCHASE' AS transaction_type, p.created_at, NULL AS paid_at,
                      p.amount_usdt AS amount, NULL AS gross_amount, NULL AS admin_share,
                      COALESCE(p.payment_asset, 'USDT') AS asset, p.chain_id,
                      p.tx_hash AS transaction_id, p.tx_hash,
                      p.quantity, COALESCE(pl.name, 'Trading account') AS description,
                      CASE WHEN p.chain_id > 0 THEN 'VERIFIED' ELSE 'FREE' END AS status,
                      p.account_id
               FROM purchases p
               LEFT JOIN accounts a ON a.id = p.account_id
               LEFT JOIN plans pl ON pl.id = a.plan_id
               WHERE LOWER(p.wallet_address) = LOWER(?)
               UNION ALL
               SELECT 'ACCOUNT_WITHDRAWAL' AS transaction_type, w.created_at, w.paid_at,
                      COALESCE(w.user_amount, ROUND(w.amount * 0.9, 2)) AS amount,
                      w.amount AS gross_amount, w.admin_share,
                      COALESCE(w.payout_asset, 'USDT') AS asset, w.payout_chain_id AS chain_id,
                      w.id AS transaction_id, w.payout_tx_hash AS tx_hash, 1 AS quantity,
                      COALESCE(pl.name, w.plan_name, 'Trading account') AS description,
                      w.status, w.account_id
               FROM withdrawals w
               LEFT JOIN accounts a ON a.id = w.account_id
               LEFT JOIN plans pl ON pl.id = a.plan_id
               WHERE LOWER(w.wallet_address) = LOWER(?)
               UNION ALL
               SELECT 'REFERRAL_WITHDRAWAL' AS transaction_type, rw.created_at, rw.paid_at,
                      rw.amount AS amount, rw.amount AS gross_amount, 0 AS admin_share,
                      COALESCE(rw.payout_asset, 'USDT') AS asset, rw.payout_chain_id AS chain_id,
                      rw.id AS transaction_id, rw.payout_tx_hash AS tx_hash, 1 AS quantity, 'Referral commission' AS description,
                      rw.status, NULL AS account_id
               FROM referral_withdrawals rw
               WHERE LOWER(rw.wallet_address) = LOWER(?)
               ORDER BY created_at DESC`,
              [wallet, wallet, wallet],
              (transactionsErr, transactions) => {
                if (transactionsErr) return res.status(500).json({ error: "Unable to load this user's financial transactions." });
                res.json({ accounts: rows, financial_transactions: transactions || [], ...security });
              }
            );
          }
          const row = rows[index];
          loadAccountWithLiveRisk(row.id, (riskErr, liveAccount) => {
            if (riskErr) return res.status(503).json({ error: `Unable to calculate live risk for account ${row.id}.` });
            refreshAccountLock(liveAccount, (lockErr, lock) => {
              if (lockErr) return res.status(500).json({ error: `Unable to apply risk lock for account ${row.id}.` });
              Object.assign(row, {
                risk_balance: getRiskBalance(liveAccount),
                status: liveAccount.status,
                lock_reason: liveAccount.lock_reason,
                locked_until: liveAccount.locked_until,
                permanent_lock: liveAccount.permanent_lock,
                risk_lock: lock || getActiveLock(liveAccount),
                open_trades: liveAccount.open_trades
              });
              db.all(
                `SELECT id, symbol, side, entry_price, size_usd, pnl, status, created_at, closed_at
                 FROM trades WHERE account_id = ? ORDER BY created_at DESC`,
                [row.id],
                (tradeErr, trades) => {
                  if (tradeErr) return res.status(500).json({ error: 'Unable to load account trade review.' });
                  row.trades = trades || [];
                  loadNext(index + 1);
                }
              );
            });
          });
        };
        loadNext(0);
      }
      );
  });
});

app.post('/api/admin/accounts/action', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const { account_id, action } = req.body;
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  if (typeof account_id !== 'string' || !account_id || !['FREEZE', 'UNFREEZE'].includes(action) ||
      (action === 'FREEZE' && (!reason || reason.length > 500))) {
    return res.status(400).json({ error: 'Account, action, and a freeze reason (up to 500 characters) are required.' });
  }
  if (action === 'FREEZE') {
    return db.run(
      `UPDATE accounts SET admin_frozen = 1, admin_freeze_reason = ? WHERE id = ?`,
      [reason, account_id],
      function(err) {
        if (err) return res.status(500).json({ error: 'Unable to freeze account.' });
        if (this.changes !== 1) return res.status(404).json({ error: 'Account not found.' });
        res.json({ success: true, message: 'Account frozen. New trades and withdrawals are disabled.' });
      }
    );
  }
  db.run(
    `UPDATE accounts SET admin_frozen = 0, admin_freeze_reason = NULL WHERE id = ? AND admin_frozen = 1`,
    [account_id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Unable to unfreeze account.' });
      if (this.changes !== 1) return res.status(409).json({ error: 'Account is not currently frozen or was not found.' });
      res.json({ success: true, message: 'Administrator freeze removed. Any active risk lock remains in effect.' });
    }
  );
});

app.post('/api/admin/withdrawals/action', sensitiveLimiter, requireTradeSignature, requireAdminWallet, (req, res) => {
  const { withdrawal_id, action, type } = req.body;
  const requestedTxHash = typeof req.body?.payout_tx_hash === 'string' ? req.body.payout_tx_hash.trim() : '';
  const isCommission = type === 'COMMISSION';
  const validActions = isCommission ? ['REJECT', 'PAID'] : ['APPROVE', 'REJECT', 'PAID'];
  if (!withdrawal_id || !validActions.includes(action) || !['ACCOUNT', 'COMMISSION'].includes(type)) {
    return res.status(400).json({ error: "A valid withdrawal ID and action are required." });
  }
  if (action === 'PAID' && !requestedTxHash) {
    return res.status(400).json({ error: 'Enter the payout transaction ID before marking this withdrawal paid.' });
  }

  const tableName = isCommission ? 'referral_withdrawals' : 'withdrawals';
  db.serialize(() => {
    db.run('BEGIN IMMEDIATE', (beginErr) => {
      if (beginErr) return res.status(500).json({ error: 'Unable to start withdrawal update.' });
      db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [withdrawal_id], (err, wdr) => {
        const rollback = (status, error) => db.run('ROLLBACK', () => res.status(status).json({ error }));
        if (err) return rollback(500, 'Unable to load withdrawal request.');
        if (!wdr) return rollback(404, 'Withdrawal request not found.');
        if (action === 'APPROVE' && !wdr.account_id) {
          return rollback(409, 'This withdrawal is not linked to an account and cannot be approved.');
        }
        const expectedStatus = action === 'APPROVE'
          ? 'PENDING'
          : action === 'PAID' && !isCommission
            ? 'APPROVED'
            : action === 'PAID'
              ? 'PENDING'
              : null;
        const allowedForRejection = !isCommission && ['PENDING', 'APPROVED'].includes(wdr.status);
        if (expectedStatus && wdr.status !== expectedStatus) {
          return rollback(409, action === 'PAID' && !isCommission
            ? 'Approve this withdrawal before marking it paid.'
            : 'Request already processed.');
        }
        if (action === 'REJECT' && !(isCommission ? wdr.status === 'PENDING' : allowedForRejection)) {
          return rollback(409, 'Request already processed.');
        }

        let payoutTxHash = null;
        const nextStatus = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'PAID';
        const updateStatus = () => db.run(
          isCommission
            ? `UPDATE ${tableName} SET status = ?,
               paid_at = CASE WHEN ? = 'PAID' THEN CURRENT_TIMESTAMP ELSE paid_at END,
               payout_tx_hash = CASE WHEN ? = 'PAID' THEN ? ELSE payout_tx_hash END
               WHERE id = ? AND status = ?`
            : `UPDATE ${tableName} SET status = ?,
               approved_at = CASE WHEN ? = 'APPROVED' THEN CURRENT_TIMESTAMP ELSE approved_at END,
               paid_at = CASE WHEN ? = 'PAID' THEN CURRENT_TIMESTAMP ELSE paid_at END,
               payout_tx_hash = CASE WHEN ? = 'PAID' THEN ? ELSE payout_tx_hash END,
               funds_deducted = CASE WHEN ? = 'APPROVED' THEN 1 WHEN ? = 'REJECTED' THEN 0 ELSE funds_deducted END
               WHERE id = ? AND status = ?`,
          isCommission
            ? [nextStatus, nextStatus, nextStatus, payoutTxHash, withdrawal_id, wdr.status]
            : [nextStatus, nextStatus, nextStatus, nextStatus, payoutTxHash, nextStatus, nextStatus, withdrawal_id, wdr.status],
          function(updateErr) {
            if (updateErr) return rollback(updateErr.code === 'SQLITE_CONSTRAINT' ? 409 : 500,
              updateErr.code === 'SQLITE_CONSTRAINT' ? 'This transaction ID has already been used.' : 'Unable to update withdrawal status.');
            if (this.changes !== 1) return rollback(409, 'Request already processed.');
            db.run('COMMIT', (commitErr) => {
              if (commitErr) return rollback(500, 'Unable to commit withdrawal update.');
              const message = action === 'APPROVE'
                ? 'Withdrawal approved. The account balance was deducted and trading is available again; record the payout transaction when it is sent.'
                : action === 'PAID'
                  ? 'Withdrawal marked as paid.'
                  : 'Withdrawal rejected.';
              res.json({ success: true, message });
            });
          }
        );

        const processWithdrawal = () => {
          if (isCommission || !wdr.account_id || action === 'PAID') return updateStatus();
          if (action === 'REJECT') {
            if (Number(wdr.funds_deducted) !== 1) return updateStatus();
            const refundSql = wdr.status === 'APPROVED'
              ? `UPDATE accounts
                 SET current_balance = current_balance + ?,
                     current_equity = current_equity + ?,
                     daily_starting_balance = daily_starting_balance + ?
                 WHERE id = ?`
              : `UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?`;
            const refundParams = wdr.status === 'APPROVED'
              ? [wdr.amount, wdr.amount, wdr.amount, wdr.account_id]
              : [wdr.amount, wdr.account_id];
            return db.run(
              refundSql,
              refundParams,
              (refundErr) => {
                if (refundErr) return rollback(500, 'Unable to return previously reserved withdrawal funds.');
                updateStatus();
              }
            );
          }
          if (Number(wdr.funds_deducted) === 1) return updateStatus();
          db.get(
            `SELECT a.current_balance, a.current_equity, a.daily_starting_balance, a.admin_frozen,
             a.initial_balance, p.max_drawdown_pct
             FROM accounts a JOIN plans p ON a.plan_id = p.id WHERE a.id = ?`,
            [wdr.account_id],
            (accountErr, account) => {
              if (accountErr) return rollback(500, 'Unable to load account for withdrawal approval.');
              if (!account) return rollback(404, 'Withdrawal account not found.');
              if (Number(account.admin_frozen) === 1) return rollback(409, 'Unfreeze this account before approving the withdrawal.');
              const withdrawalFloor = getProtectedPayoutBalance(account.initial_balance, account.max_drawdown_pct);
              db.get(
                `SELECT COALESCE(SUM(amount), 0) AS other_pending FROM withdrawals
                 WHERE account_id = ? AND status = 'PENDING' AND id != ?`,
                [wdr.account_id, withdrawal_id],
                (pendingErr, pendingRow) => {
                  if (pendingErr) return rollback(500, 'Unable to check other pending withdrawals.');
                  if (account.current_balance - wdr.amount - Number(pendingRow.other_pending) < withdrawalFloor - 0.005) {
                    return rollback(409, `Approval would reduce account balance or remaining pending payouts below its protected $${withdrawalFloor.toFixed(2)} floor.`);
                  }
                  db.run(
                    `UPDATE accounts
                     SET current_balance = current_balance - ?,
                         current_equity = current_equity - ?,
                         daily_starting_balance = daily_starting_balance - ?
                     WHERE id = ? AND current_balance - ? >= ? AND admin_frozen = 0`,
                    [wdr.amount, wdr.amount, wdr.amount, wdr.account_id, wdr.amount, withdrawalFloor],
                    function(balanceErr) {
                      if (balanceErr) return rollback(500, 'Unable to deduct approved withdrawal.');
                      if (this.changes !== 1) return rollback(409, 'Account balance changed; refresh and retry.');
                      updateStatus();
                    }
                  );
                }
              );
            }
          );
        };

        if (action === 'REJECT' || action === 'APPROVE') return processWithdrawal();
        const payoutChainId = Number(wdr.payout_chain_id);
        const payoutAsset = String(wdr.payout_asset || 'USDT').toUpperCase();
        const isSolanaPayout = payoutChainId === 101;
        const isSupportedPayout = isSolanaPayout
          ? Boolean(SOLANA_TOKEN_ADDRESSES[payoutAsset])
          : Boolean(SUPPORTED_EVM_CHAINS[payoutChainId]?.tokens?.[payoutAsset]);
        const isValidSolanaHash = /^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(requestedTxHash);
        const isValidEvmHash = /^0x[0-9a-f]{64}$/i.test(requestedTxHash);
        if ((payoutChainId > 0 && !isSupportedPayout) ||
            (isSolanaPayout ? !isValidSolanaHash : payoutChainId > 0 ? !isValidEvmHash : !(isValidSolanaHash || isValidEvmHash))) {
          return rollback(400, 'Enter a valid transaction ID for the payout network and asset.');
        }
        payoutTxHash = isSolanaPayout || isValidSolanaHash ? requestedTxHash : requestedTxHash.toLowerCase();
        findUsedFinancialTransactionId(payoutTxHash, (transactionErr, alreadyUsed) => {
          if (transactionErr) return rollback(500, 'Unable to check whether this payout transaction was already recorded.');
          if (alreadyUsed) return rollback(409, 'This transaction ID has already been used.');
          processWithdrawal();
        });
      });
    });
  });
});

app.get('/api/trade-copy/groups', requireWalletSession, (req, res) => {
  db.all(
    `SELECT g.id, g.name, g.active, g.created_at, g.updated_at,
            m.account_id, m.role, m.size_pct, a.plan_id, a.initial_balance,
            a.current_balance, a.status, a.lock_reason, a.permanent_lock, a.admin_frozen,
            p.name AS plan_name
     FROM trade_copy_groups g
     JOIN trade_copy_group_members m ON m.group_id = g.id
     JOIN accounts a ON a.id = m.account_id
     LEFT JOIN plans p ON p.id = a.plan_id
     WHERE LOWER(g.wallet_address) = LOWER(?)
     ORDER BY g.created_at DESC, m.role, a.created_at`,
    [req.walletAddress],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Unable to load copy-trading groups.' });
      const groups = new Map();
      for (const row of rows || []) {
        let group = groups.get(row.id);
        if (!group) {
          group = {
            id: row.id,
            name: row.name,
            active: Number(row.active) === 1,
            created_at: row.created_at,
            updated_at: row.updated_at,
            leader: null,
            followers: []
          };
          groups.set(row.id, group);
        }
        const account = {
          id: row.account_id,
          plan_id: row.plan_id,
          plan_name: row.plan_name || 'Trading account',
          initial_balance: Number(row.initial_balance || 0),
          current_balance: Number(row.current_balance || 0),
          status: row.status,
          lock_reason: row.lock_reason,
          permanent_lock: Number(row.permanent_lock) === 1,
          admin_frozen: Number(row.admin_frozen) === 1,
          size_pct: Number(row.size_pct)
        };
        if (row.role === 'LEADER') group.leader = account;
        else group.followers.push(account);
      }
      res.json({ groups: [...groups.values()] });
    }
  );
});

app.post('/api/trade-copy/groups', sensitiveLimiter, requireWalletSession, walletActionLimiter, requireWalletNotSoftLockedForNewCopyActions, requireUserNotSuspended, (req, res) => {
  if (copyFlatteningWallets.has(req.walletAddress)) {
    return res.status(409).json({ error: 'Copy-trading emergency stop is in progress. Try again when it finishes.' });
  }
  const { group_id: groupId, name: rawName, leader_account_id: leaderAccountId, followers, active } = req.body || {};
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if ((groupId !== undefined && groupId !== null && typeof groupId !== 'string') ||
      (active !== undefined && typeof active !== 'boolean') ||
      !name || name.length > 60 || typeof leaderAccountId !== 'string' ||
      !Array.isArray(followers) || followers.length < 1) {
    return res.status(400).json({ error: 'Enter a group name, one leader, and at least one follower.' });
  }
  const followerIds = followers.map(follower => follower?.account_id);
  if (followerIds.some(id => typeof id !== 'string' || id === leaderAccountId) ||
      new Set(followerIds).size !== followerIds.length ||
      followers.some(follower => !Number.isFinite(Number(follower?.size_pct)) || Number(follower.size_pct) <= 0)) {
    return res.status(400).json({ error: 'Choose unique accounts and enter a positive copy size percentage for each follower.' });
  }

  const accountIds = [leaderAccountId, ...followerIds];
  const placeholders = accountIds.map(() => '?').join(', ');
  db.all(
    `SELECT id, status, lock_reason, permanent_lock FROM accounts
     WHERE LOWER(wallet_address) = LOWER(?) AND id IN (${placeholders})`,
    [req.walletAddress, ...accountIds],
    (accountsErr, accounts) => {
      if (accountsErr) return res.status(500).json({ error: 'Unable to verify selected accounts.' });
      if ((accounts || []).length !== accountIds.length) {
        return res.status(403).json({ error: 'Every selected account must belong to your connected wallet.' });
      }
      if (accounts.some(account =>
        account.status === 'PERMANENTLY_LOCKED' ||
        account.lock_reason === 'MLL' ||
        Number(account.permanent_lock) === 1
      )) {
        return res.status(403).json({ error: 'Permanently locked accounts cannot be added to copy-trading groups.' });
      }
      const persistGroup = (existingGroup) => {
        if (groupId && !existingGroup) return res.status(404).json({ error: 'Copy-trading group not found.' });
        const resolvedGroupId = groupId || `cpy_${crypto.randomBytes(10).toString('hex')}`;
        const isActive = active === undefined ? Number(existingGroup?.active || 0) : active === true;
        db.serialize(() => {
          db.run('BEGIN IMMEDIATE', beginErr => {
            if (beginErr) return res.status(500).json({ error: 'Unable to start group save.' });
            const fail = (status, message) => db.run('ROLLBACK', () => res.status(status).json({ error: message }));
            const saveGroup = groupErr => {
              if (groupErr) return fail(500, 'Unable to save copy-trading group.');
              db.run('DELETE FROM trade_copy_group_members WHERE group_id = ?', [resolvedGroupId], deleteErr => {
                if (deleteErr) return fail(500, 'Unable to update group accounts.');
                const members = [
                  { account_id: leaderAccountId, role: 'LEADER', size_pct: 100 },
                  ...followers.map(follower => ({
                    account_id: follower.account_id,
                    role: 'FOLLOWER',
                    size_pct: Number(follower.size_pct)
                  }))
                ];
                const addMember = index => {
                  if (index >= members.length) {
                    return db.run('COMMIT', commitErr => {
                      if (commitErr) return fail(500, 'Unable to finish saving the group.');
                      res.json({ success: true, group_id: resolvedGroupId });
                    });
                  }
                  const member = members[index];
                  db.run(
                    'INSERT INTO trade_copy_group_members (group_id, account_id, role, size_pct) VALUES (?, ?, ?, ?)',
                    [resolvedGroupId, member.account_id, member.role, member.size_pct],
                    insertErr => {
                      if (insertErr) {
                        const conflict = /UNIQUE constraint failed: trade_copy_group_members\.account_id/.test(insertErr.message);
                        return fail(conflict ? 409 : 500, conflict
                          ? 'An account is already assigned to another copy-trading group.'
                          : 'Unable to assign an account to the group.');
                      }
                      addMember(index + 1);
                    }
                  );
                };
                addMember(0);
              });
            };
            if (existingGroup) {
              return db.run(
                `UPDATE trade_copy_groups SET name = ?, active = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND LOWER(wallet_address) = LOWER(?)`,
                [name, isActive ? 1 : 0, resolvedGroupId, req.walletAddress],
                saveGroup
              );
            }
            db.run(
              `INSERT INTO trade_copy_groups (id, wallet_address, name, active)
               VALUES (?, ?, ?, ?)`,
              [resolvedGroupId, req.walletAddress, name, isActive ? 1 : 0],
              saveGroup
            );
          });
        });
      };
      if (!groupId) return persistGroup(null);
      db.get(
        'SELECT id, active FROM trade_copy_groups WHERE id = ? AND LOWER(wallet_address) = LOWER(?)',
        [groupId, req.walletAddress],
        (groupErr, group) => {
          if (groupErr) return res.status(500).json({ error: 'Unable to verify copy-trading group.' });
          persistGroup(group);
        }
      );
    }
  );
});

app.post('/api/trade-copy/groups/:groupId/active', sensitiveLimiter, requireWalletSession, walletActionLimiter, requireWalletNotSoftLockedForNewCopyActions, requireUserNotSuspended, (req, res) => {
  if (copyFlatteningWallets.has(req.walletAddress)) {
    return res.status(409).json({ error: 'Copy-trading emergency stop is in progress. Try again when it finishes.' });
  }
  const active = req.body?.active;
  if (typeof active !== 'boolean') return res.status(400).json({ error: 'Choose whether this copy-trading group is active.' });
  if (active) {
    return db.get(
      `SELECT a.status, a.lock_reason, a.permanent_lock, a.admin_frozen
       FROM trade_copy_group_members m
       JOIN trade_copy_groups g ON g.id = m.group_id
       JOIN accounts a ON a.id = m.account_id
       WHERE m.group_id = ? AND m.role = 'LEADER'
         AND LOWER(g.wallet_address) = LOWER(?)`,
      [req.params.groupId, req.walletAddress],
      (leaderErr, leader) => {
        if (leaderErr) return res.status(500).json({ error: 'Unable to verify the copy-trading leader.' });
        if (!leader || leader.status !== 'ACTIVE' || leader.lock_reason === 'MLL' ||
            Number(leader.permanent_lock) === 1 || Number(leader.admin_frozen) === 1) {
          return res.status(409).json({ error: 'Choose an available leader before activating this group.' });
        }
        updateCopyGroupActive(req, res, active);
      }
    );
  }
  updateCopyGroupActive(req, res, active);
});

function updateCopyGroupActive(req, res, active) {
  db.run(
    `UPDATE trade_copy_groups SET active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND LOWER(wallet_address) = LOWER(?)`,
    [active ? 1 : 0, req.params.groupId, req.walletAddress],
    function(err) {
      if (err) return res.status(500).json({ error: 'Unable to update group status.' });
      if (this.changes !== 1) return res.status(404).json({ error: 'Copy-trading group not found.' });
      res.json({ success: true, active });
    }
  );
}

app.delete('/api/trade-copy/groups/:groupId', sensitiveLimiter, requireWalletSession, requireUserNotSuspended, (req, res) => {
  db.get(
    'SELECT id FROM trade_copy_groups WHERE id = ? AND LOWER(wallet_address) = LOWER(?)',
    [req.params.groupId, req.walletAddress],
    (findErr, group) => {
      if (findErr) return res.status(500).json({ error: 'Unable to verify copy-trading group.' });
      if (!group) return res.status(404).json({ error: 'Copy-trading group not found.' });
      db.serialize(() => {
        db.run('BEGIN IMMEDIATE', beginErr => {
          if (beginErr) return res.status(500).json({ error: 'Unable to start group deletion.' });
          db.run('DELETE FROM trade_copy_group_members WHERE group_id = ?', [req.params.groupId], membersErr => {
            if (membersErr) return db.run('ROLLBACK', () => res.status(500).json({ error: 'Unable to clear group accounts.' }));
            db.run('DELETE FROM trade_copy_groups WHERE id = ?', [req.params.groupId], deleteErr => {
              if (deleteErr) return db.run('ROLLBACK', () => res.status(500).json({ error: 'Unable to delete copy-trading group.' }));
              db.run('COMMIT', commitErr => {
                if (commitErr) return db.run('ROLLBACK', () => res.status(500).json({ error: 'Unable to finish deleting the group.' }));
                res.json({ success: true });
              });
            });
          });
        });
      });
    }
  );
});

function executeTradeForAccount(accountId, order, walletAddress, callback) {
  const { symbol, side, size_usd, margin_used, leverage, order_type, trigger_price } = order;
  const orderType = String(order_type || 'MARKET').toUpperCase();
  const limitTriggerPrice = trigger_price == null ? null : Number(trigger_price);
  const market = getTradeMarket(symbol);
  const isForex = market?.asset_class === 'FOREX';
  const lotSize = isForex ? Number(order.lot_size) : null;
  if (!market || market.enabled === false) {
    return callback({ status: 400, error: 'The selected market is unavailable.' });
  }
  if (orderType === 'LIMIT' && (!Number.isFinite(limitTriggerPrice) || limitTriggerPrice <= 0)) {
    return callback({ status: 400, error: 'A valid limit trigger price is required.' });
  }
  if (isForex && (!Number.isFinite(lotSize) || lotSize <= 0)) {
    return callback({ status: 400, error: 'A valid forex lot size is required.' });
  }
  db.get(
    `SELECT a.*, p.max_drawdown_pct, p.daily_loss_pct,
     COALESCE((SELECT SUM(w.amount) FROM withdrawals w
       WHERE w.account_id = a.id AND w.status = 'PENDING'), 0) AS pending_withdrawal_amount
     FROM accounts a JOIN plans p ON a.plan_id = p.id WHERE a.id = ?`,
    [accountId],
    (err, account) => {
      if (err) return callback({ status: 500, error: 'Unable to load account.' });
      if (!account) return callback({ status: 404, error: 'Account not found.' });
      if (account.wallet_address.toLowerCase() !== walletAddress) {
        return callback({ status: 403, error: 'Wallet does not own this account.' });
      }

      refreshRiskBaselines(accountId, (baselineErr, refreshedAccount) => {
        if (baselineErr) return callback({ status: 500, error: 'Unable to update daily account baselines.' });
        account = refreshedAccount;
        unlockExpiredAccount(account, (unlockErr, activeLock) => {
          if (unlockErr) return callback({ status: 500, error: 'Unable to refresh account lock status.' });
          if (Number(account.admin_frozen) === 1) {
            return callback({ status: 403, error: `Account is frozen by an administrator${account.admin_freeze_reason ? `: ${account.admin_freeze_reason}` : '.'}` });
          }
          if (activeLock) {
            const message = activeLock.permanent
              ? 'Account permanently locked after exceeding the maximum loss limit (MLL).'
              : `Account locked for DLL breach until ${activeLock.lockedUntil}.`;
            return callback({ status: 403, error: message, lock: activeLock });
          }
          if (account.status !== 'ACTIVE') return callback({ status: 403, error: `Account is not active (${account.status}).` });
          if (Number(account.pending_withdrawal_amount) > 0) {
            return callback({ status: 403, error: 'Trading is temporarily frozen while a withdrawal awaits admin review.' });
          }
          const existingBreach = getRiskBreach(account, account);
          if (existingBreach) {
            return applyRiskBreach(account, existingBreach, (lockErr, appliedLock) => {
              if (lockErr) return callback({ status: 500, error: 'Unable to apply account risk lock.' });
              callback({
                status: 403,
                error: appliedLock.permanent
                  ? 'Account permanently locked after exceeding the maximum loss limit (MLL).'
                  : `Account locked for DLL breach until ${appliedLock.lockedUntil}.`,
                lock: appliedLock
              });
            });
          }

          const requestedMargin = Number(margin_used);
          if (!isForex && requestedMargin > account.current_balance) {
            return callback({ status: 400, error: `Insufficient available balance ($${account.current_balance.toFixed(2)} available).` });
          }
          const maxQuoteAgeMs = getMarketQuoteMaxAgeMs(market);
          Promise.all([
            getAuthoritativePrice(market, maxQuoteAgeMs),
            getLiveForexQuoteToUsdRate(market, maxQuoteAgeMs)
          ]).then(([marketPrice, quoteToUsdRate]) => {
            const slippage = isForex ? 0 : market.source === 'BITGET_PERP' ? marketPrice * 0.0005 : 5;
            const executionPrice = orderType === 'LIMIT'
              ? limitTriggerPrice
              : marketPrice + (side === 'BUY' ? slippage : -slippage);
            const forexSize = isForex
              ? calculateForexMargin(lotSize, executionPrice, leverage, quoteToUsdRate, market.lot_units)
              : null;
            const margin = isForex ? forexSize.marginUsd : requestedMargin;
            const units = isForex ? forexSize.units : Number(size_usd) / executionPrice;
            if (margin > account.current_balance) {
              return callback({ status: 400, error: `Insufficient available balance ($${account.current_balance.toFixed(2)} available).` });
            }
            let levels;
            try {
              levels = isForex
                ? resolveForexStopTargetPrices({
                    executionPrice,
                    units,
                    quoteToUsdRate,
                    pipSize: market.pip_size,
                    side,
                    mode: order.sl_tp_mode,
                    sl: order.sl,
                    tp: order.tp,
                    slAmount: order.sl_amount,
                    tpAmount: order.tp_amount
                  })
                : resolveStopTargetPrices({
                    executionPrice,
                    units,
                    side,
                    mode: order.sl_tp_mode,
                    sl: order.sl,
                    tp: order.tp,
                    slAmount: order.sl_amount,
                    tpAmount: order.tp_amount
                  });
            } catch (levelError) {
              return callback({ status: 400, error: levelError.message });
            }
            const { sl: stopLoss, tp: takeProfit } = levels;
            const tradeId = `trd_${crypto.randomBytes(8).toString('hex')}`;
            const tradeStatus = orderType === 'LIMIT' ? 'PENDING' : 'OPEN';
            db.serialize(() => {
              db.run('BEGIN IMMEDIATE', beginErr => {
                if (beginErr) return callback({ status: 500, error: 'Unable to reserve account balance.' });
                const rollback = (status, error) => db.run('ROLLBACK', () => callback({ status, error }));
                const freezeHedgingAccounts = conflictingTrades => {
                  const conflictingSide = side === 'BUY' ? 'SELL' : 'BUY';
                  const accountIds = [...new Set([accountId, ...conflictingTrades.map(trade => trade.account_id)])];
                  const reason = `Hedging detected on ${symbol}; review the admin alert and support ticket before unfreezing.`;
                  const freezeNext = index => {
                    if (index >= accountIds.length) {
                      return db.run(
                        `INSERT INTO hedging_alerts
                         (wallet_address, symbol, attempted_account_id, attempted_side, conflicting_side)
                         VALUES (?, ?, ?, ?, ?)`,
                        [walletAddress, symbol, accountId, side, conflictingSide],
                        function(alertErr) {
                          if (alertErr) return rollback(500, 'Unable to record the hedging alert.');
                          const alertId = this.lastID;
                          const alertAccounts = [
                            { account_id: accountId, trade_id: null, position_side: side },
                            ...conflictingTrades.map(trade => ({
                              account_id: trade.account_id,
                              trade_id: trade.trade_id,
                              position_side: trade.side
                            }))
                          ];
                          const insertNext = index => {
                            if (index >= alertAccounts.length) {
                              return db.run('COMMIT', commitErr => {
                                if (commitErr) return callback({ status: 500, error: 'Unable to commit hedging alert.' });
                                callback({
                                  status: 409,
                                  error: `Hedging is not allowed. An opposite ${conflictingSide} position in ${symbol} was found on another account. The involved accounts have been frozen and an admin alert was created.`,
                                  hedging_violation: true
                                });
                              });
                            }
                            const item = alertAccounts[index];
                            db.run(
                              `INSERT INTO hedging_alert_accounts (alert_id, account_id, trade_id, position_side)
                               VALUES (?, ?, ?, ?)`,
                              [alertId, item.account_id, item.trade_id, item.position_side],
                              insertErr => {
                                if (insertErr) return rollback(500, 'Unable to record hedging alert account details.');
                                insertNext(index + 1);
                              }
                            );
                          };
                          insertNext(0);
                        }
                      );
                    }
                    db.run(
                      `UPDATE accounts SET admin_frozen = 1,
                       admin_freeze_reason = CASE WHEN admin_frozen = 1 THEN admin_freeze_reason ELSE ? END
                       WHERE id = ? AND LOWER(wallet_address) = LOWER(?)`,
                      [reason, accountIds[index], walletAddress],
                      function(freezeErr) {
                        if (freezeErr) return rollback(500, 'Unable to freeze accounts involved in the hedge.');
                        if (this.changes !== 1) return rollback(409, 'An involved account changed during hedging review.');
                        freezeNext(index + 1);
                      }
                    );
                  };
                  freezeNext(0);
                };
                db.all(
                  `SELECT t.id AS trade_id, t.account_id, t.side
                   FROM trades t
                   JOIN accounts a ON a.id = t.account_id
                   WHERE LOWER(a.wallet_address) = LOWER(?) AND t.account_id != ?
                     AND t.symbol = ? AND t.side = ? AND t.status = 'OPEN'`,
                  [walletAddress, accountId, symbol, side === 'BUY' ? 'SELL' : 'BUY'],
                  (hedgeErr, conflictingTrades) => {
                    if (hedgeErr) return rollback(500, 'Unable to verify opposite open positions.');
                    if (conflictingTrades?.length) return freezeHedgingAccounts(conflictingTrades);
                    db.run(
                      `UPDATE accounts SET current_balance = current_balance - ?
                       WHERE id = ? AND current_balance >= ? AND status = 'ACTIVE' AND admin_frozen = 0
                       AND NOT EXISTS (SELECT 1 FROM withdrawals WHERE account_id = ? AND status = 'PENDING')
                       AND NOT EXISTS (SELECT 1 FROM users u WHERE LOWER(u.wallet_address) = LOWER(accounts.wallet_address)
                                       AND COALESCE(u.admin_suspended, 0) = 1)`,
                      [margin, accountId, margin, accountId],
                      function(updateErr) {
                        if (updateErr) {
                          return db.run('ROLLBACK', () => callback({ status: 500, error: 'Unable to reserve account balance.' }));
                        }
                        if (this.changes !== 1) {
                          return db.get(
                            'SELECT admin_suspend_reason FROM users WHERE LOWER(wallet_address) = LOWER(?) AND admin_suspended = 1',
                            [account.wallet_address],
                            (suspensionErr, suspendedUser) => db.run('ROLLBACK', () => {
                              if (suspensionErr) return callback({ status: 500, error: 'Unable to verify user account access.' });
                              if (suspendedUser) {
                                return callback({
                                  status: 403,
                                  error: `This user account is suspended by an administrator${suspendedUser.admin_suspend_reason ? `: ${suspendedUser.admin_suspend_reason}` : '.'}`,
                                  user_suspended: true
                                });
                              }
                              callback({ status: 409, error: 'Account balance or status changed. Refresh and retry.' });
                            })
                          );
                        }
                        db.run(
                          `INSERT INTO trades
                           (id, account_id, symbol, market_type, side, entry_price, order_type, trigger_price,
                            size_usd, units, lot_size, pip_size, sl, tp, status, leverage)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                          [tradeId, accountId, symbol, isForex ? 'FOREX' : 'CRYPTO', side, executionPrice, orderType, tradeStatus === 'PENDING' ? limitTriggerPrice : null, margin, units, lotSize, isForex ? market.pip_size : null, stopLoss, takeProfit, tradeStatus, leverage],
                          insertErr => {
                            if (insertErr) return db.run('ROLLBACK', () => callback({ status: 500, error: 'Unable to create trade.' }));
                            db.run('COMMIT', commitErr => {
                              if (commitErr) return callback({ status: 500, error: 'Unable to commit trade.' });
                              callback(null, { success: true, trade_id: tradeId, execution_price: executionPrice, trigger_price: tradeStatus === 'PENDING' ? limitTriggerPrice : null, sl: stopLoss, tp: takeProfit, order_type: orderType, status: tradeStatus, lot_size: lotSize, margin_used: margin });
                            });
                          }
                        );
                      }
                    );
                  }
                );
              });
            });
          }).catch(priceError => {
            console.error('Unable to obtain trade execution price:', priceError.message);
            callback({ status: 503, error: 'Unable to obtain a fresh market price. Please retry.' });
          });
        });
      });
    }
  );
}

app.post('/api/trades/execute', sensitiveLimiter, requireWalletSession, walletActionLimiter, requireWalletNotSoftLocked, requireUserNotSuspended, (req, res) => {
  const { account_id: accountId, symbol, side, price, size_usd: sizeUsd, margin_used: marginUsed, leverage, sl, tp } = req.body || {};
  const slTpMode = req.body?.sl_tp_mode || 'price';
  const slAmount = req.body?.sl_amount == null ? null : Number(req.body.sl_amount);
  const tpAmount = req.body?.tp_amount == null ? null : Number(req.body.tp_amount);
  const orderType = String(req.body?.order_type || '').toUpperCase();
  const triggerPrice = req.body?.trigger_price == null ? null : Number(req.body.trigger_price);
  const lotSize = req.body?.lot_size == null ? null : Number(req.body.lot_size);
  const market = supportedMarkets.find(item => item.symbol === symbol);
  const isForex = market?.asset_class === 'FOREX';
  const numericFields = isForex
    ? [price, sizeUsd, marginUsed, leverage, lotSize]
    : [price, sizeUsd, marginUsed, leverage];
  if (!accountId || !market || market.enabled === false || !['BUY', 'SELL'].includes(side) ||
      !['MARKET', 'LIMIT'].includes(orderType) ||
      !(isForex ? ['pips', 'amount'] : ['price', 'amount']).includes(slTpMode) ||
      numericFields.some(value => !Number.isFinite(Number(value)) || Number(value) <= 0) ||
      !Number.isInteger(Number(leverage)) || Number(leverage) > 50 ||
      (!isForex && Math.abs(Number(sizeUsd) - Number(marginUsed) * Number(leverage)) > 0.01) ||
      (orderType === 'LIMIT' && (!Number.isFinite(triggerPrice) || Number(triggerPrice) <= 0)) ||
      (sl != null && (!Number.isFinite(Number(sl)) || Number(sl) <= 0)) ||
      (tp != null && (!Number.isFinite(Number(tp)) || Number(tp) <= 0)) ||
      (slTpMode === 'amount' && (
        (slAmount != null && (!Number.isFinite(slAmount) || slAmount <= 0)) ||
        (tpAmount != null && (!Number.isFinite(tpAmount) || tpAmount <= 0))
      ))) return res.status(400).json({ error: 'Invalid trade parameters.' });
  if (copyFlatteningWallets.has(req.walletAddress)) {
    return res.status(409).json({ error: 'Copy-trading emergency stop is in progress. Wait before opening another trade.' });
  }
  const accountTradeRequestKey = `${req.walletAddress.toLowerCase()}:${accountId}`;
  if (inFlightAccountTradeRequests.has(accountTradeRequestKey)) {
    return res.status(409).json({ error: 'A trade request for this account is already processing. Wait for it to finish before submitting another.' });
  }
  inFlightAccountTradeRequests.add(accountTradeRequestKey);
  let accountTradeRequestReleased = false;
  const releaseAccountTradeRequest = () => {
    if (accountTradeRequestReleased) return;
    accountTradeRequestReleased = true;
    inFlightAccountTradeRequests.delete(accountTradeRequestKey);
  };
  res.once('finish', releaseAccountTradeRequest);
  res.once('close', releaseAccountTradeRequest);
  const releaseExecution = trackTradeExecution(req.walletAddress, res);
  const respond = (status, body) => {
    releaseExecution();
    return res.status(status).json(body);
  };

  const order = {
    symbol, side, size_usd: Number(sizeUsd), margin_used: Number(marginUsed), leverage: Number(leverage),
    lot_size: lotSize,
    order_type: orderType, trigger_price: orderType === 'LIMIT' ? triggerPrice : null,
    sl_tp_mode: slTpMode, sl: sl == null ? null : Number(sl), tp: tp == null ? null : Number(tp),
    sl_amount: slAmount, tp_amount: tpAmount
  };
  db.get(
    `SELECT g.id FROM trade_copy_groups g
     JOIN trade_copy_group_members m ON m.group_id = g.id
     WHERE m.account_id = ? AND m.role = 'LEADER' AND g.active = 1
       AND LOWER(g.wallet_address) = LOWER(?)`,
    [accountId, req.walletAddress],
    (groupErr, activeGroup) => {
      if (groupErr) return respond(500, { error: 'Unable to check active copy-trading group.' });
      executeTradeForAccount(accountId, order, req.walletAddress, (leaderErr, leaderTrade) => {
        if (leaderErr) return respond(leaderErr.status, {
          error: leaderErr.error,
          lock: leaderErr.lock,
          user_suspended: leaderErr.user_suspended,
          hedging_violation: leaderErr.hedging_violation
        });
        if (!activeGroup) return respond(200, leaderTrade);
        db.run(
          'INSERT INTO trade_copy_leader_trades (leader_trade_id, group_id) VALUES (?, ?)',
          [leaderTrade.trade_id, activeGroup.id],
          leaderMarkErr => {
            if (leaderMarkErr) {
              console.error('Unable to mark copy-trading leader trade:', leaderMarkErr.message);
              return respond(200, { ...leaderTrade, copy_error: 'Leader trade opened, but copy tracking could not be saved.' });
            }
            db.all(
              `SELECT m.account_id, m.size_pct FROM trade_copy_group_members m
               WHERE m.group_id = ? AND m.role = 'FOLLOWER' ORDER BY m.rowid`,
              [activeGroup.id],
              (followersErr, followers) => {
                if (followersErr) {
                  console.error('Unable to load copy-trading followers:', followersErr.message);
                  return respond(200, { ...leaderTrade, copy_error: 'Leader trade opened, but follower accounts could not be loaded.' });
                }
                const results = [];
                const copyNext = index => {
                  if (index >= followers.length) {
                    return respond(200, { ...leaderTrade, copy_group_id: activeGroup.id, copy_results: results });
                  }
                  const follower = followers[index];
                  const ratio = Number(follower.size_pct) / 100;
                  const followerMargin = order.margin_used * ratio;
                  const followerOrder = {
                    ...order,
                    margin_used: followerMargin,
                    size_usd: followerMargin * order.leverage,
                    ...(isForex ? { lot_size: order.lot_size * ratio } : {})
                  };
                  if (order.sl_tp_mode === 'amount') {
                    followerOrder.sl_amount = order.sl_amount == null ? null : order.sl_amount * ratio;
                    followerOrder.tp_amount = order.tp_amount == null ? null : order.tp_amount * ratio;
                  }
                  if (!Number.isFinite(followerOrder.margin_used) || !Number.isFinite(followerOrder.size_usd) ||
                      followerOrder.margin_used <= 0 || followerOrder.size_usd <= 0) {
                    results.push({ account_id: follower.account_id, success: false, error: 'Follower size percentage results in an invalid order size.' });
                    return copyNext(index + 1);
                  }
                  executeTradeForAccount(follower.account_id, followerOrder, req.walletAddress, (followerErr, followerTrade) => {
                    if (followerErr) {
                      results.push({
                        account_id: follower.account_id,
                        success: false,
                        error: followerErr.error,
                        hedging_violation: followerErr.hedging_violation
                      });
                      return copyNext(index + 1);
                    }
                    db.run(
                      `INSERT INTO trade_copy_links (leader_trade_id, follower_trade_id, group_id)
                       VALUES (?, ?, ?)`,
                      [leaderTrade.trade_id, followerTrade.trade_id, activeGroup.id],
                      linkErr => {
                        if (linkErr) {
                          console.error('Unable to link copied trade:', linkErr.message);
                          results.push({
                            account_id: follower.account_id,
                            success: false,
                            trade_id: followerTrade.trade_id,
                            error: 'Follower trade opened, but its copy link could not be saved.'
                          });
                        } else {
                          results.push({
                            account_id: follower.account_id,
                            success: true,
                            trade_id: followerTrade.trade_id,
                            execution_price: followerTrade.execution_price
                          });
                        }
                        copyNext(index + 1);
                      }
                    );
                  });
                };
                copyNext(0);
              }
            );
          }
        );
      });
    }
  );
});

function closeTradeForWallet(tradeId, walletAddress, callback, options = {}) {
  db.get(
    `SELECT t.*, a.wallet_address, a.current_equity, a.daily_starting_balance,
     a.status AS account_status, a.lock_reason, a.locked_until, a.permanent_lock
     FROM trades t JOIN accounts a ON a.id = t.account_id
     WHERE t.id = ? AND t.status IN ('OPEN', 'PENDING')`,
    [tradeId],
    (err, trade) => {
      if (err) return callback({ status: 500, error: 'Unable to load trade.' });
      if (!trade) return callback({ status: 404, error: 'Open trade not found.' });
      if (trade.wallet_address.toLowerCase() !== walletAddress) {
        return callback({ status: 403, error: 'Wallet does not own this trade.' });
      }

      refreshRiskBaselines(trade.account_id, (baselineErr, refreshedAccount) => {
      if (baselineErr) return callback({ status: 500, error: 'Unable to update daily account baselines.' });
      const account = {
        id: trade.account_id,
        current_equity: refreshedAccount.current_equity,
        risk_balance: refreshedAccount.risk_balance,
        daily_starting_balance: refreshedAccount.daily_starting_balance,
        status: refreshedAccount.status,
        lock_reason: refreshedAccount.lock_reason,
        locked_until: refreshedAccount.locked_until,
        permanent_lock: refreshedAccount.permanent_lock
      };
      unlockExpiredAccount(account, (unlockErr) => {
        if (unlockErr) return callback({ status: 500, error: 'Unable to refresh account lock status.' });
        const market = getTradeMarket(trade.symbol);
        if (!market) return callback({ status: 409, error: 'The trade market is no longer configured.' });
        const overridePrice = Number(options.exitPrice);
        const pricePromise = trade.status === 'PENDING'
          ? Promise.resolve(Number(trade.entry_price))
          : Number.isFinite(overridePrice) && overridePrice > 0
            ? Promise.resolve(overridePrice)
            : getAuthoritativePrice(market);
        const conversionPromise = trade.status === 'PENDING'
          ? Promise.resolve(1)
          : getLiveForexQuoteToUsdRate(market);
        Promise.all([pricePromise, conversionPromise]).then(([price, quoteToUsdRate]) => {
        const pnl = trade.status === 'PENDING'
          ? 0
          : calculateUnrealizedPnl(trade, price, quoteToUsdRate);
        const returnedMargin = getTradeMargin(trade) + pnl;
        db.serialize(() => {
          db.run('BEGIN IMMEDIATE');
          db.run(
            `UPDATE trades SET status = 'CLOSED', pnl = ?, closed_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = ?`,
            [pnl, tradeId, trade.status],
            function(updateErr) {
              if (updateErr || this.changes !== 1) {
                return db.run('ROLLBACK', () => callback({ status: 409, error: 'Trade was already closed.' }));
              }
              db.run(
                `UPDATE accounts SET current_balance = current_balance + ?, current_equity = current_equity + ?
                 WHERE id = ?`,
                [returnedMargin, pnl, trade.account_id],
                (balanceErr) => {
                  if (balanceErr) return db.run('ROLLBACK', () => callback({ status: 500, error: 'Unable to settle trade.' }));
                  loadAccountWithLiveRisk(trade.account_id, (accountErr, account) => {
                      if (accountErr || !account) return db.run('ROLLBACK', () => callback({ status: 500, error: 'Unable to verify account limits.' }));
                      const breach = getRiskBreach(account, account);
                      const activeLock = breach || getActiveLock(account);
                      const commit = (lock = null, riskBreachSettled = false) => db.run('COMMIT', (commitErr) => {
                        if (commitErr) return callback({ status: 500, error: 'Unable to commit trade settlement.' });
                        callback(null, {
                          success: true,
                          pnl,
                          lock,
                          trade_id: tradeId,
                          ...(riskBreachSettled ? { risk_breach_settled: true } : {})
                        });
                      });
                      if (!breach) return commit(activeLock);
                      settleBreachWithinTransaction(account, breach, (lockErr, appliedLock) => {
                        if (lockErr) return db.run('ROLLBACK', () => callback({ status: 500, error: 'Unable to apply account lock.' }));
                        commit({
                          reason: appliedLock.reason,
                          permanent: appliedLock.permanent,
                          lockedUntil: appliedLock.lockedUntil
                        }, true);
                      });
                    });
                }
              );
            }
          );
        });
        }).catch((priceError) => {
          console.error('Unable to obtain trade closing price:', priceError.message);
          callback({ status: 503, error: 'Unable to obtain a fresh market price. Please retry.' });
        });
      });
      });
    }
  );
}

function closeOutstandingCopyTrades(walletAddress, callback, options = {}) {
  db.all(
    `SELECT l.leader_trade_id, l.follower_trade_id, fa.id AS account_id
     FROM trade_copy_links l
     JOIN trades lt ON lt.id = l.leader_trade_id AND lt.status = 'CLOSED'
     JOIN accounts la ON la.id = lt.account_id AND LOWER(la.wallet_address) = LOWER(?)
     JOIN trades ft ON ft.id = l.follower_trade_id AND ft.status IN ('OPEN', 'PENDING')
     JOIN accounts fa ON fa.id = ft.account_id AND LOWER(fa.wallet_address) = LOWER(?)
     ORDER BY lt.closed_at, ft.created_at`,
    [walletAddress, walletAddress],
    (linksErr, links) => {
      if (linksErr) return callback(linksErr);
      const results = [];
      const closeNext = index => {
        if (index >= links.length) return callback(null, results);
        const linked = links[index];
        const exitPrice = String(linked.leader_trade_id) === String(options.leaderTradeId)
          ? options.exitPrice
          : null;
        closeTradeForWallet(linked.follower_trade_id, walletAddress, (closeErr, closedTrade) => {
          results.push(closeErr?.status === 404
            ? {
                leader_trade_id: linked.leader_trade_id,
                account_id: linked.account_id,
                trade_id: linked.follower_trade_id,
                success: true,
                already_closed: true
              }
            : closeErr
            ? {
                leader_trade_id: linked.leader_trade_id,
                account_id: linked.account_id,
                trade_id: linked.follower_trade_id,
                success: false,
                error: closeErr.error
              }
            : {
                leader_trade_id: linked.leader_trade_id,
                account_id: linked.account_id,
                trade_id: linked.follower_trade_id,
                success: true,
                pnl: closedTrade.pnl
              });
          closeNext(index + 1);
        }, { exitPrice });
      };
      closeNext(0);
    }
  );
}

const stopOrderChecksInProgress = new Set();
let stopOrderSweepInProgress = false;
function checkServerStopOrders() {
  if (stopOrderSweepInProgress) return;
  stopOrderSweepInProgress = true;
  db.all(
    `SELECT t.id, t.symbol, t.side, t.sl, t.tp, t.sl_tp_mode, a.wallet_address
     FROM trades t JOIN accounts a ON a.id = t.account_id
     WHERE t.status = 'OPEN' AND (t.sl IS NOT NULL OR t.tp IS NOT NULL)`,
    [],
    (err, trades) => {
      if (err) {
        stopOrderSweepInProgress = false;
        console.error('Unable to load open stop orders:', err.message);
        return;
      }
      const triggeredTrades = [];
      for (const trade of trades) {
        if (stopOrderChecksInProgress.has(trade.id)) continue;
        const market = getTradeMarket(trade.symbol);
        if (!market) continue;
        try {
          const price = marketDataService.getQuote(market.symbol, getMarketQuoteMaxAgeMs(market)).price;
          const exitPrice = getTriggeredExitPrice({ price, side: trade.side, sl: trade.sl, tp: trade.tp });
          if (exitPrice !== null) {
            triggeredTrades.push({
              ...trade,
              exitPrice: trade.sl_tp_mode === 'amount' ? exitPrice : null
            });
          }
        } catch {
          // A stale quote cannot safely trigger a stop; fresh execution prices are required to settle.
        }
      }

      const closeNext = index => {
        if (index >= triggeredTrades.length) {
          stopOrderSweepInProgress = false;
          return;
        }
        const trade = triggeredTrades[index];
        stopOrderChecksInProgress.add(trade.id);
        closeTradeForWallet(trade.id, trade.wallet_address.toLowerCase(), closeErr => {
          if (closeErr && closeErr.status !== 404) {
            console.error(`Unable to execute stop order for trade ${trade.id}:`, closeErr.error);
          }
          if (!closeErr) {
            closeOutstandingCopyTrades(trade.wallet_address, copyErr => {
              if (copyErr) console.error('Unable to close copied trades after stop execution:', copyErr.message);
              stopOrderChecksInProgress.delete(trade.id);
              closeNext(index + 1);
            }, { leaderTradeId: trade.id, exitPrice: trade.exitPrice });
          } else {
            stopOrderChecksInProgress.delete(trade.id);
            closeNext(index + 1);
          }
        }, { exitPrice: trade.exitPrice });
      };
      closeNext(0);
    }
  );
}

setTimeout(checkServerStopOrders, 2000);
setInterval(checkServerStopOrders, 1000);

app.post('/api/trades/close', sensitiveLimiter, requireWalletSession, (req, res) => {
  const tradeId = req.body?.trade_id;
  if (typeof tradeId !== 'string' || !tradeId) return res.status(400).json({ error: 'Trade ID is required.' });
  closeTradeForWallet(tradeId, req.walletAddress, (closeErr, closedTrade) => {
    if (closeErr) return res.status(closeErr.status).json({ error: closeErr.error });
    closeOutstandingCopyTrades(req.walletAddress, (linksErr, copyResults) => {
      if (linksErr) {
        console.error('Unable to close linked copy trades:', linksErr.message);
        return res.json({ ...closedTrade, copy_close_error: 'Trade closed, but copied follower positions could not be checked.' });
      }
      res.json({
        ...closedTrade,
        ...(copyResults.length ? { copy_close_results: copyResults } : {})
      });
    });
  });
});

app.post('/api/trade-copy/flatten', sensitiveLimiter, requireWalletSession, (req, res) => {
  const wallet = req.walletAddress;
  if (copyFlatteningWallets.has(wallet)) {
    return res.status(409).json({ error: 'A copy-trading emergency stop is already in progress.' });
  }
  copyFlatteningWallets.add(wallet);
  let flattenFinished = false;
  const releaseFlattening = () => {
    if (flattenFinished) return;
    flattenFinished = true;
    copyFlatteningWallets.delete(wallet);
  };
  res.once('finish', releaseFlattening);
  waitForTradeExecutions(wallet, () => {
    db.run(
      'UPDATE trade_copy_groups SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE LOWER(wallet_address) = LOWER(?)',
      [wallet],
      disableErr => {
        if (disableErr) {
          releaseFlattening();
          return res.status(500).json({ error: 'Unable to pause copy groups before flattening.' });
        }
        db.all(
    `SELECT DISTINCT t.id AS trade_id, a.id AS account_id
     FROM trades t
     JOIN accounts a ON a.id = t.account_id
     WHERE t.status IN ('OPEN', 'PENDING') AND LOWER(a.wallet_address) = LOWER(?)
       AND (EXISTS (SELECT 1 FROM trade_copy_leader_trades l WHERE l.leader_trade_id = t.id)
            OR EXISTS (SELECT 1 FROM trade_copy_links c WHERE c.follower_trade_id = t.id))
     ORDER BY a.created_at, t.created_at`,
    [wallet],
    (tradesErr, trades) => {
      if (tradesErr) {
        releaseFlattening();
        return res.status(500).json({ error: 'Unable to load open copy trades.' });
      }
      const results = [];
      const closeNext = index => {
        if (index >= trades.length) {
          const failed = results.filter(result => !result.success);
          releaseFlattening();
          return res.json({
            success: failed.length === 0,
            groups_deactivated: true,
            closed: results.length - failed.length,
            failed,
            results
          });
        }
        const trade = trades[index];
        closeTradeForWallet(trade.trade_id, wallet, (closeErr, closedTrade) => {
          if (closeErr?.status === 404) {
            results.push({ account_id: trade.account_id, trade_id: trade.trade_id, success: true, already_closed: true });
            return closeNext(index + 1);
          }
          if (closeErr) {
            results.push({ account_id: trade.account_id, trade_id: trade.trade_id, success: false, error: closeErr.error });
            return closeNext(index + 1);
          }
          closeOutstandingCopyTrades(wallet, (linksErr, copyResults) => {
            const failedCopies = (copyResults || []).filter(result => !result.success);
            results.push({
              account_id: trade.account_id, trade_id: trade.trade_id, success: true, pnl: closedTrade.pnl,
              ...(linksErr ? { warning: 'Trade closed, but linked follower positions could not be checked.' } : {}),
              ...(failedCopies.length ? { warning: 'Some linked follower positions remain open.' } : {})
            });
            closeNext(index + 1);
          });
        });
      };
      closeNext(0);
    }
        );
      }
    );
  });
});

function findEligibleChatAccount(walletAddress, callback) {
  db.all(
    'SELECT id FROM accounts WHERE LOWER(wallet_address) = LOWER(?) ORDER BY created_at, id',
    [walletAddress],
    (accountsErr, accounts) => {
      if (accountsErr) return callback(accountsErr);
      const checkNext = (index) => {
        if (index >= accounts.length) return callback(null, false);
        const accountId = accounts[index].id;
        refreshRiskBaselines(accountId, (baselineErr, account) => {
          if (baselineErr) return callback(baselineErr);
          refreshAccountLock(account, (lockErr) => {
            if (lockErr) return callback(lockErr);
            const eligible = account.status === 'ACTIVE' &&
              !account.lock_reason &&
              Number(account.permanent_lock) !== 1 &&
              Number(account.admin_frozen) !== 1 &&
              Number(account.pending_withdrawal_amount || 0) <= 0;
            if (eligible) return callback(null, true);
            checkNext(index + 1);
          });
        });
      };
      checkNext(0);
    }
  );
}

app.get('/api/chat/messages', (req, res) => {
  const symbol = req.query.symbol;
  const market = supportedMarkets.find(item => item.symbol === symbol && item.enabled !== false);
  if (!market) return res.status(400).json({ error: 'Select a configured market to view its chat.' });

  db.all(
    `SELECT c.id,
       COALESCE(NULLIF(u.username, ''), 'Trader') AS username,
     COALESCE(NULLIF(u.discount_code, ''), '') AS referral_code,
     COALESCE(b.xp, 0) AS battlepass_xp, COALESCE(b.points, 0) AS battlepass_points, b.profile_image_url,
     COALESCE((SELECT d.title FROM battlepass_level_titles t JOIN battlepass_level_definitions d ON d.level = t.level WHERE LOWER(t.wallet_address) = LOWER(c.wallet_address) ORDER BY t.level DESC LIMIT 1), 'BlastrrPass player') AS battlepass_title,
     COALESCE((SELECT SUM(w.amount) FROM withdrawals w WHERE LOWER(w.wallet_address) = LOWER(c.wallet_address) AND w.status IN ('APPROVED', 'PAID')), 0)
       + COALESCE((SELECT SUM(rw.amount) FROM referral_withdrawals rw WHERE LOWER(rw.wallet_address) = LOWER(c.wallet_address) AND rw.status = 'PAID'), 0) AS total_payouts,
     c.body, c.created_at
     FROM public_chat_messages c
     LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(c.wallet_address)
     LEFT JOIN battlepass_users b ON LOWER(b.wallet_address) = LOWER(c.wallet_address)
     WHERE c.market_symbol = ?
     ORDER BY c.id DESC
     LIMIT 100`,
    [market.symbol],
    (err, messages) => {
      if (err) return res.status(500).json({ error: 'Unable to load public chat.' });
      res.json({
        messages: (messages || []).reverse().map(message => ({
          ...message,
          battlepass_level: getBattlePassLevel(message.battlepass_xp)
        }))
      });
    }
  );
});

app.post('/api/chat/messages', sensitiveLimiter, requireWalletSession, requireUserNotSuspended, (req, res) => {
  const { symbol, message: rawMessage } = req.body || {};
  const market = supportedMarkets.find(item => item.symbol === symbol && item.enabled !== false);
  if (!market) return res.status(400).json({ error: 'Select a configured market before posting.' });
  const moderated = moderateChatMessage(rawMessage);
  if (!moderated.valid) return res.status(400).json({ error: moderated.error });

  findEligibleChatAccount(req.walletAddress, (eligibilityErr, eligible) => {
    if (eligibilityErr) {
      console.error('Unable to verify public chat account eligibility:', eligibilityErr.message);
      return res.status(503).json({ error: 'Unable to verify account eligibility. Please retry.' });
    }
    if (!eligible) {
      return res.status(403).json({ error: 'Posting requires an active, unlocked trading account with no admin freeze or pending withdrawal.' });
    }

    db.run(
      `INSERT INTO public_chat_messages (market_symbol, wallet_address, body)
       SELECT ?, ?, ?
       WHERE NOT EXISTS (
         SELECT 1 FROM public_chat_messages
         WHERE wallet_address = ?
           AND datetime(created_at) > datetime('now', ?)
       )`,
      [market.symbol, req.walletAddress, moderated.message, req.walletAddress, `-${CHAT_COOLDOWN_MS / 1000} seconds`],
      function(insertErr) {
        if (insertErr) {
          console.error('Unable to save public chat message:', insertErr.message);
          return res.status(500).json({ error: 'Unable to send your chat message.' });
        }
        if (this.changes === 0) {
          return db.get(
            `SELECT created_at FROM public_chat_messages
             WHERE wallet_address = ?
             ORDER BY id DESC LIMIT 1`,
            [req.walletAddress],
            (recentErr, recentMessage) => {
              if (recentErr) return res.status(500).json({ error: 'Unable to check the chat posting limit.' });
              const lastSentAt = recentMessage
                ? Date.parse(`${recentMessage.created_at.replace(' ', 'T')}Z`)
                : Date.now();
              const retryAfter = Math.max(1, Math.ceil((lastSentAt + CHAT_COOLDOWN_MS - Date.now()) / 1000));
              res.set('Retry-After', String(retryAfter));
              res.status(429).json({
                error: 'Slow mode is on: you can send one message per minute.',
                retry_after_seconds: retryAfter
              });
            }
          );
        }
        db.get(
          `SELECT c.id,
             COALESCE(NULLIF(u.username, ''), 'Trader') AS username,
             COALESCE(NULLIF(u.discount_code, ''), '') AS referral_code,
             COALESCE(b.xp, 0) AS battlepass_xp, COALESCE(b.points, 0) AS battlepass_points, b.profile_image_url,
             COALESCE((SELECT d.title FROM battlepass_level_titles t JOIN battlepass_level_definitions d ON d.level = t.level WHERE LOWER(t.wallet_address) = LOWER(c.wallet_address) ORDER BY t.level DESC LIMIT 1), 'BlastrrPass player') AS battlepass_title,
             COALESCE((SELECT SUM(w.amount) FROM withdrawals w WHERE LOWER(w.wallet_address) = LOWER(c.wallet_address) AND w.status IN ('APPROVED', 'PAID')), 0)
               + COALESCE((SELECT SUM(rw.amount) FROM referral_withdrawals rw WHERE LOWER(rw.wallet_address) = LOWER(c.wallet_address) AND rw.status = 'PAID'), 0) AS total_payouts,
             c.body, c.created_at
           FROM public_chat_messages c
           LEFT JOIN users u ON LOWER(u.wallet_address) = LOWER(c.wallet_address)
           LEFT JOIN battlepass_users b ON LOWER(b.wallet_address) = LOWER(c.wallet_address)
           WHERE c.id = ?`,
          [this.lastID],
          (messageErr, savedMessage) => {
            if (messageErr) return res.status(500).json({ error: 'Your chat message could not be confirmed.' });
            res.status(201).json({
              message: savedMessage && {
                ...savedMessage,
                battlepass_level: getBattlePassLevel(savedMessage.battlepass_xp)
              }
            });
          }
        );
      }
    );
  });
});

app.get('/api/trades/active', requireWalletSession, (req, res) => {
  const accountId = req.query.account_id;
  const wallet = req.query.wallet;
  if (!accountId || typeof wallet !== 'string' || normalizeWalletAddress(wallet) !== req.walletAddress) {
    return res.status(403).json({ error: 'Wallet session does not match the requested trades.' });
  }

  db.get("SELECT wallet_address FROM accounts WHERE id = ?", [accountId], (accountErr, account) => {
    if (accountErr) return res.status(500).json({ error: 'Unable to load account.' });
    if (!account || account.wallet_address.toLowerCase() !== wallet.toLowerCase()) {
      return res.status(403).json({ error: 'Wallet does not own this account.' });
    }
    refreshRiskBaselines(accountId, (baselineErr, liveAccount) => {
      if (baselineErr) return res.status(503).json({ error: 'Unable to calculate live account risk.' });
      refreshAccountLock(liveAccount, (lockErr, lock) => {
        if (lockErr) return res.status(500).json({ error: 'Unable to apply account risk lock.' });
        res.json({
          trades: liveAccount.open_trades || [],
          risk_balance: getRiskBalance(liveAccount),
          lock: lock || getActiveLock(liveAccount),
          account_status: liveAccount.status,
          lock_reason: liveAccount.lock_reason
        });
      });
    });
  });
});

app.get('/api/forex/candles', sensitiveLimiter, requireWalletSession, chartLimiter, requireWalletNotSoftLocked, (req, res) => {
  const market = getTradeMarket(String(req.query.symbol || ''));
  if (!market || market.asset_class !== 'FOREX') {
    return res.status(400).json({ error: 'Choose a supported Forex market.' });
  }
  const timeframe = String(req.query.timeframe || '1m');
  if (!forexChartTimeframes[timeframe]) {
    return res.status(400).json({ error: 'Choose a supported Forex chart timeframe.' });
  }
  getForexChartHistory(market, timeframe)
    .then(history => res.json(history))
    .catch(error => {
      console.warn(`Unable to load Yahoo Finance Forex history for ${market.pair}:`, error.message);
      res.status(502).json({ error: 'Unable to load Forex chart history. Live pricing is still available.' });
    });
});

function streamMarketData(res, filter = () => true, walletAddress) {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();
  res.write('retry: 3000\n\n');
  const client = {
    res,
    filter,
    walletAddress,
    heartbeat: setInterval(() => {
      if (!res.destroyed && !res.writableEnded) res.write(': heartbeat\n\n');
    }, 20000)
  };
  marketPriceStreamClients.add(client);
  for (const quote of marketDataService.getLatestQuotes()) {
    if (filter(quote)) res.write(`data: ${JSON.stringify(quote)}\n\n`);
  }
  let removed = false;
  const removeClient = () => {
    if (removed) return;
    removed = true;
    clearInterval(client.heartbeat);
    marketPriceStreamClients.delete(client);
  };
  client.close = () => {
    removeClient();
    if (!res.destroyed && !res.writableEnded) res.end();
  };
  res.on('close', removeClient);
}

function disconnectMarketDataStreams(walletAddress) {
  for (const client of marketPriceStreamClients) {
    if (client.walletAddress === walletAddress) client.close();
  }
}

app.get('/api/market-data/stream', requireWalletSession, chartLimiter, requireWalletNotSoftLocked, (req, res) => {
  streamMarketData(res, () => true, req.walletAddress);
});

app.get('/api/forex/stream', requireWalletSession, chartLimiter, requireWalletNotSoftLocked, (req, res) => {
  streamMarketData(res, quote => quote.assetClass === 'FOREX', req.walletAddress);
});

app.use('/api', (err, req, res, next) => {
  console.error(`Unhandled API error for ${req.method} ${req.path}:`, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'An unexpected API error occurred.' });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`Blastrr server running on port ${PORT}`);
});
