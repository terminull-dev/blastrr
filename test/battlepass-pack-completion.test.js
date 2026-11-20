const test = require('node:test');
const assert = require('node:assert/strict');
const { completeBattlePassPackOpening } = require('../battlePassPackCompletion');

function createMockDb(certificateError = null) {
  const runs = [];
  return {
    runs,
    run(sql, params, callback) {
      runs.push({ sql, params });
      const error = /INSERT INTO battlepass_discount_certificates/.test(sql) ? certificateError : null;
      process.nextTick(() => callback(error));
    },
    get(sql, params, callback) {
      process.nextTick(() => callback(null, { points: 240 }));
    }
  };
}

function completeOpening(reward, { xpAwarded = 0, pointsAwarded = 0, db = createMockDb() } = {}) {
  return new Promise((resolve, reject) => {
    completeBattlePassPackOpening({
      db,
      openingId: 'opening-1',
      walletAddress: '0x1234',
      reward: {
        reward_id: 7,
        name: 'Test reward',
        description: 'Test description',
        max_drops: 0,
        drops: 0,
        ...reward
      },
      quantity: 2,
      xpAwarded,
      pointsAwarded,
      pack: { name: 'Test pack', points_cost: 20 },
      packId: 3,
      accountIds: [],
      rollback: (status, error) => reject(Object.assign(new Error(error), { status })),
      response: {
        status(status) {
          return { json: body => resolve({ status, body, db }) };
        },
        json(body) {
          resolve({ status: 200, body, db });
        }
      },
      notifyPackCap: (pack, cappedReward, callback) => callback(null)
    });
  });
}

test('pack completion commits non-discount rewards without issuing certificates', async () => {
  for (const rewardType of ['ACCOUNT', 'XP', 'POINTS']) {
    const result = await completeOpening({ reward_type: rewardType }, {
      xpAwarded: rewardType === 'XP' ? 50 : 0,
      pointsAwarded: rewardType === 'POINTS' ? 20 : 0
    });
    assert.equal(result.body.success, true);
    assert.deepEqual(result.body.certificates, []);
    assert.equal(result.db.runs.some(run => /INSERT INTO battlepass_discount_certificates/.test(run.sql)), false);
    assert.equal(result.db.runs.at(-1).sql, 'COMMIT');
  }
});

test('pack completion commits discount certificates in the response', async () => {
  const result = await completeOpening({
    reward_type: 'DISCOUNT',
    discount_pct: 95,
    plan_id: 4
  });

  assert.equal(result.body.success, true);
  assert.equal(result.body.certificates.length, 2);
  assert.equal(result.db.runs.filter(run => /INSERT INTO battlepass_discount_certificates/.test(run.sql)).length, 2);
  assert.equal(result.db.runs.at(-1).sql, 'COMMIT');
});

test('pack completion rolls back when discount certificate creation fails', async () => {
  const db = createMockDb(new Error('certificate insert failed'));
  await assert.rejects(
    completeOpening({ reward_type: 'DISCOUNT', discount_pct: 95 }, { db }),
    error => error.status === 500 && error.message === 'Unable to create your discount certificate.'
  );
  assert.equal(db.runs.some(run => /COMMIT/.test(run.sql)), false);
});
