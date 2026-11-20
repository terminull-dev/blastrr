const crypto = require('crypto');

function createBattlePassDiscountCertificates({ db, openingId, walletAddress, reward, quantity }, callback) {
  if (reward?.reward_type !== 'DISCOUNT') return callback(null, []);

  const certificates = [];
  const createNext = index => {
    if (index >= quantity) return callback(null, certificates);
    const code = `BP${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
    db.run(
      `INSERT INTO battlepass_discount_certificates
       (code, opening_id, wallet_address, reward_id, discount_pct, eligible_plan_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        code,
        openingId,
        walletAddress,
        reward.reward_id,
        Number(reward.discount_pct),
        reward.plan_id || null
      ],
      err => {
        if (err) return callback(err);
        certificates.push({
          code,
          discount_pct: Number(reward.discount_pct),
          eligible_plan_id: reward.plan_id == null ? null : Number(reward.plan_id)
        });
        createNext(index + 1);
      }
    );
  };
  createNext(0);
}

module.exports = { createBattlePassDiscountCertificates };
