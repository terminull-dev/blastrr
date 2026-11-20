const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const plans = require('../config/plans.json');
const markets = require('../public/config/markets.json');
const serverJs = fs.readFileSync('server.js', 'utf8');
const appJs = fs.readFileSync('public/js/app.js', 'utf8');

test('supported EVM purchases use the configured treasury recipient in the client and verifier', () => {
  const treasury = '0x9c19edeba86b214db5b3d21da9416d5e5568365b';
  assert.match(serverJs, new RegExp(`const TREASURY_WALLET = '${treasury}'`));
  assert.match(appJs, new RegExp(`const TREASURY_WALLET = "${treasury}"`));
  assert.match(serverJs, /verifyMultiChainPurchase\([\s\S]*?wallet_address, totalPrice, TREASURY_WALLET, paymentAsset\)/);
  assert.match(appJs, /const paddedRecipient = TREASURY_WALLET\.toLowerCase\(\)/);
});

test('Solana treasury and official USDC token addresses are configured for supported networks', () => {
  assert.match(serverJs, /const SOLANA_TREASURY_WALLET = 'A3AVrbzCYzqKEkBR7pDQGYgnAbmBF9qNMQDX84QpuRZx'/);
  assert.match(serverJs, /USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'/);
  assert.match(appJs, /const SOLANA_TREASURY_WALLET = 'A3AVrbzCYzqKEkBR7pDQGYgnAbmBF9qNMQDX84QpuRZx'/);
  assert.match(appJs, /USDC: \{ address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 \}/);
  for (const address of [
    '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
  ]) {
    assert.ok(serverJs.toLowerCase().includes(address.toLowerCase()), `missing official USDC address ${address}`);
    assert.ok(appJs.toLowerCase().includes(address.toLowerCase()), `missing official USDC address ${address}`);
  }
  assert.doesNotMatch(serverJs.match(/56:\s*\{[\s\S]*?tokens:\s*\{([\s\S]*?)\}\s*\}/)?.[1] || '', /USDC/);
});

test('plan configuration preserves existing seed limits and valid values', () => {
  assert.equal(plans.length, 6);
  const names = new Set();
  for (const plan of plans) {
    assert.ok(plan.name);
    assert.ok(!names.has(plan.name), `duplicate plan name: ${plan.name}`);
    names.add(plan.name);
    for (const key of [
      'base_price_usdt',
      'price_usdt',
      'simulated_capital',
      'profit_target',
      'max_drawdown_pct',
      'daily_loss_pct',
      'max_single_day_profit_pct'
    ]) {
      assert.ok(Number.isFinite(plan[key]) && plan[key] > 0, `${plan.name} has invalid ${key}`);
    }
    assert.equal(plan.price_usdt, plan.base_price_usdt, `${plan.name} should start at full price`);
    assert.equal(plan.max_drawdown_pct, 10);
    assert.equal(plan.daily_loss_pct, 5);
  }
  assert.equal(plans.find(plan => plan.name === 'Whale $250k').simulated_capital, 250000);
});

test('market configuration exposes only the top Binance USDT crypto spot selection', () => {
  assert.equal(markets.length, 20);
  const symbols = new Set();
  for (const market of markets) {
    assert.ok(market.label && market.symbol && market.pair && market.group);
    assert.ok(!symbols.has(market.symbol), `duplicate market symbol: ${market.symbol}`);
    symbols.add(market.symbol);
    assert.equal(market.source, 'BINANCE_SPOT');
    assert.equal(market.type, 'SPOT');
    assert.equal(market.group, 'Spot Crypto (Binance)');
    assert.ok(market.pair.endsWith('USDT'));
    assert.equal(market.symbol, `BINANCE:${market.pair}`);
  }
  assert.deepEqual(markets.map(({ pair }) => pair), [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT',
    'TRXUSDT', 'ZECUSDT', 'HYPEUSDT', 'DOGEUSDT', 'LINKUSDT',
    'ADAUSDT', 'NEARUSDT', 'XLMUSDT', 'BCHUSDT', 'LTCUSDT',
    'UNIUSDT', 'AVAXUSDT', 'SUIUSDT', 'HBARUSDT', 'SHIBUSDT'
  ]);
});
