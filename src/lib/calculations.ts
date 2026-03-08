import { type Instrument, POINT_VALUES } from '@/stores/calculatorStore';

export function calcPositionSize(
  instrument: Instrument,
  balance: number,
  entry: number,
  stop: number,
  target: number,
  winRate: number
) {
  const pointValue = POINT_VALUES[instrument];
  const riskPoints = Math.abs(entry - stop);
  const rewardPoints = Math.abs(target - entry);

  if (riskPoints === 0) return null;

  const riskPerContract = riskPoints * pointValue;
  const rMultiple = rewardPoints / riskPoints;

  // Kelly Criterion: K = W - (1-W)/R
  const W = winRate / 100;
  const R = rMultiple || 1;
  const kelly = W > 0 ? W - (1 - W) / R : 0;
  const kellyPercent = Math.max(0, kelly * 100);
  const halfKellyPercent = kellyPercent / 2;
  const quarterKellyPercent = kellyPercent / 4;

  // Kelly-based contracts
  const halfKellyRisk = balance * (halfKellyPercent / 100);
  const halfKellyContracts = riskPerContract > 0 ? Math.floor(halfKellyRisk / riskPerContract) : 0;
  const quarterKellyRisk = balance * (quarterKellyPercent / 100);
  const quarterKellyContracts = riskPerContract > 0 ? Math.floor(quarterKellyRisk / riskPerContract) : 0;

  return {
    riskPoints,
    rewardPoints,
    riskPerContract,
    rMultiple,
    kellyPercent,
    halfKellyContracts,
    quarterKellyContracts,
  };
}

export function calcCompoundGrowth(
  startingBalance: number,
  winRate: number,
  riskPercent: number,
  avgRMultiple: number,
  tradesPerMonth: number,
  months: number
) {
  const W = winRate / 100;
  const R = riskPercent / 100;
  const data: { month: number; balance: number }[] = [{ month: 0, balance: startingBalance }];

  let balance = startingBalance;
  for (let m = 1; m <= months; m++) {
    for (let t = 0; t < tradesPerMonth; t++) {
      const isWin = Math.random() < W;
      if (isWin) {
        balance += balance * R * avgRMultiple;
      } else {
        balance -= balance * R;
      }
      if (balance <= 0) {
        balance = 0;
        break;
      }
    }
    data.push({ month: m, balance: Math.round(balance) });
    if (balance <= 0) break;
  }

  return data;
}

// Deterministic expected value version
export function calcCompoundGrowthExpected(
  startingBalance: number,
  winRate: number,
  riskPercent: number,
  avgRMultiple: number,
  tradesPerMonth: number,
  months: number
) {
  const W = winRate / 100;
  const R = riskPercent / 100;
  // Expected per-trade growth factor
  const expectedGrowth = W * R * avgRMultiple - (1 - W) * R;
  const data: { month: number; balance: number }[] = [{ month: 0, balance: startingBalance }];

  let balance = startingBalance;
  for (let m = 1; m <= months; m++) {
    for (let t = 0; t < tradesPerMonth; t++) {
      balance += balance * expectedGrowth;
    }
    data.push({ month: m, balance: Math.round(balance) });
  }

  return data;
}
