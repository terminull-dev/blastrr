const crypto = require('crypto');
const { createBattlePassDiscountCertificates } = require('./battlePassCertificates');

function completeBattlePassPackOpening({
  db,
  openingId,
  walletAddress,
  reward,
  quantity,
  xpAwarded,
  pointsAwarded,
  pack,
  packId,
  accountIds,
  pointsSpent = pack.points_cost,
  rollback,
  response,
  notifyPackCap
}) {
  const addBalance = callback => {
    if (!xpAwarded && !pointsAwarded) return callback(null);
    db.run(
      `UPDATE battlepass_users
       SET xp = xp + ?, points = points + ?, updated_at = CURRENT_TIMESTAMP
       WHERE LOWER(wallet_address) = LOWER(?)`,
      [xpAwarded, pointsAwarded, walletAddress],
      balanceUpdateErr => callback(balanceUpdateErr)
    );
  };
  const insertRewardEvent = callback => {
    if (!xpAwarded && !pointsAwarded) return callback(null);
    db.run(
      `INSERT INTO battlepass_events
       (id, wallet_address, event_type, reference_id, xp, points)
       VALUES (?, ?, 'PACK_REWARD', ?, ?, ?)`,
      [`bpe_${crypto.randomBytes(10).toString('hex')}`, walletAddress, openingId, xpAwarded, pointsAwarded],
      callback
    );
  };
  const finishOpening = certificates => addBalance(balanceUpdateErr => {
    if (balanceUpdateErr) return rollback(500, 'Unable to apply your XP or points reward.');
    insertRewardEvent(eventErr => {
      if (eventErr) return rollback(500, 'Unable to record your reward history.');
      const capReached = Number(reward.max_drops) > 0 &&
        Number(reward.drops) + 1 >= Number(reward.max_drops);
      const updateCap = callback => {
        if (!capReached) return callback(null);
        db.run(
          'UPDATE battlepass_packs SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [packId],
          updateErr => updateErr
            ? callback(updateErr)
            : notifyPackCap(pack, reward, callback)
        );
      };
      updateCap(capErr => {
        if (capErr) return rollback(500, 'Unable to record the reward cap notification.');
        db.get(
          'SELECT points FROM battlepass_users WHERE LOWER(wallet_address) = LOWER(?)',
          [walletAddress],
          (finalBalanceErr, finalBalance) => {
            if (finalBalanceErr) return rollback(500, 'Unable to load your updated points balance.');
            db.run('COMMIT', [], commitErr => {
              if (commitErr) return response.status(500).json({ error: 'Unable to complete your pack opening.' });
              response.json({
                success: true,
                opening: {
                  id: openingId,
                  pack_id: packId,
                  reward_name: reward.name,
                  reward_description: reward.description,
                  reward_type: reward.reward_type,
                  quantity,
                  xp_awarded: xpAwarded,
                  points_awarded: pointsAwarded,
                  account_ids: accountIds,
                  points_spent: Number(pointsSpent)
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

  createBattlePassDiscountCertificates({
    db,
    openingId,
    walletAddress,
    reward,
    quantity
  }, (certificateErr, certificates) => {
    if (certificateErr) return rollback(500, 'Unable to create your discount certificate.');
    finishOpening(certificates);
  });
}

module.exports = { completeBattlePassPackOpening };
