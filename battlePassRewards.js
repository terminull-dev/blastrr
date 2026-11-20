function roundOdds(value) {
  return Math.round(Number(value) * 100) / 100;
}

function validatePackRewardPool(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { valid: false, total: 0, error: 'Add at least one reward to the pack.' };
  }
  const seenRewardIds = new Set();
  let total = 0;
  for (const entry of entries) {
    const rewardId = Number(entry.reward_id);
    const odds = Number(entry.odds);
    const maxDrops = Number(entry.max_drops);
    if (!Number.isInteger(rewardId) || rewardId < 1 || seenRewardIds.has(rewardId)) {
      return { valid: false, total, error: 'Choose each valid reward only once per pack.' };
    }
    if (!Number.isFinite(odds) || odds <= 0 || odds > 100 || roundOdds(odds) !== odds) {
      return { valid: false, total, error: 'Reward odds must be from 0.01% to 100%, with at most two decimal places.' };
    }
    if (!Number.isInteger(maxDrops) || maxDrops < 0) {
      return { valid: false, total, error: 'Maximum drops must be zero (unlimited) or a positive whole number.' };
    }
    seenRewardIds.add(rewardId);
    total = roundOdds(total + odds);
  }
  if (total !== 100) {
    return { valid: false, total, error: `Reward odds must total exactly 100% (currently ${total}%).` };
  }
  return { valid: true, total, error: null };
}

function selectWeightedReward(entries, roll) {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 100) {
    throw new RangeError('Reward roll must be at least 0 and less than 100.');
  }
  const validation = validatePackRewardPool(entries);
  if (!validation.valid) throw new Error(validation.error);
  let cumulativeOdds = 0;
  for (const entry of entries) {
    cumulativeOdds = roundOdds(cumulativeOdds + Number(entry.odds));
    if (roll < cumulativeOdds) return entry;
  }
  return entries[entries.length - 1];
}

module.exports = { roundOdds, selectWeightedReward, validatePackRewardPool };
