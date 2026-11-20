const test = require('node:test');
const assert = require('node:assert/strict');
const { createBattlePassDiscountCertificates } = require('../battlePassCertificates');

function createMockDb(error = null) {
  const inserts = [];
  return {
    inserts,
    run(sql, params, callback) {
      inserts.push({ sql, params });
      process.nextTick(() => callback(error));
    }
  };
}

function issueCertificates(db, reward, quantity) {
  return new Promise((resolve, reject) => {
    createBattlePassDiscountCertificates({
      db,
      openingId: 'opening-1',
      walletAddress: '0x1234',
      reward: { reward_id: 7, ...reward },
      quantity
    }, (error, certificates) => error ? reject(error) : resolve(certificates));
  });
}

test('non-discount pack rewards do not create certificates', async () => {
  for (const rewardType of ['ACCOUNT', 'XP', 'POINTS']) {
    const db = createMockDb();
    const certificates = await issueCertificates(db, { reward_type: rewardType }, 2);
    assert.deepEqual(certificates, []);
    assert.equal(db.inserts.length, 0);
  }
});

test('discount rewards create the requested number of wallet-bound certificates', async () => {
  const db = createMockDb();
  const certificates = await issueCertificates(db, {
    reward_type: 'DISCOUNT',
    discount_pct: 15,
    plan_id: 4
  }, 2);

  assert.equal(db.inserts.length, 2);
  assert.deepEqual(certificates.map(({ discount_pct, eligible_plan_id }) => ({ discount_pct, eligible_plan_id })), [
    { discount_pct: 15, eligible_plan_id: 4 },
    { discount_pct: 15, eligible_plan_id: 4 }
  ]);
  for (const [index, insert] of db.inserts.entries()) {
    assert.match(insert.sql, /INSERT INTO battlepass_discount_certificates/);
    assert.match(insert.params[0], /^BP[A-F0-9]{24}$/);
    assert.equal(insert.params[0], certificates[index].code);
    assert.deepEqual(insert.params.slice(1), ['opening-1', '0x1234', 7, 15, 4]);
  }
});

test('discount certificate insert failures are returned to the caller', async () => {
  const dbError = new Error('insert failed');
  const db = createMockDb(dbError);
  await assert.rejects(issueCertificates(db, {
    reward_type: 'DISCOUNT',
    discount_pct: 15
  }, 1), error => error === dbError);
  assert.equal(db.inserts.length, 1);
});
