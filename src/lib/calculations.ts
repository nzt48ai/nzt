import { type Instrument, POINT_VALUES } from '@/stores/calculatorStore';

export function calcPositionSize(
  instrument: Instrument,
  balance: number,
  riskPercent: number,
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
  const riskAmount = balance * (riskPercent / 100);
  const contracts = Math.floor(riskAmount / riskPerContract);
  const rMultiple = rewardPoints / riskPoints;
  const dollarRisk = contracts * riskPerContract;
  const dollarReward = contracts * rewardPoints * pointValue;

  // Kelly Criterion: K = W - (1-W)/R
  const W = winRate / 100;
  const R = rMultiple || 1;
  const kelly = W > 0 ? W - (1 - W) / R : 0;
  const kellyPercent = Math.max(0, kelly * 100);
  const halfKelly = kellyPercent / 2;

  // Kelly-based contracts
  const kellyRiskAmount = balance * (kellyPercent / 100);
  const kellyContracts = riskPerContract > 0 ? Math.floor(kellyRiskAmount / riskPerContract) : 0;
  const halfKellyRiskAmount = balance * (halfKelly / 100);
  const halfKellyContracts = riskPerContract > 0 ? Math.floor(halfKellyRiskAmount / riskPerContract) : 0;

  // Optimal-F (simplified: using win rate as fraction)
  const optimalF = W > 0 ? W - (1 - W) / R : 0;
  const optimalFPercent = Math.max(0, optimalF * 100);
  const optimalFRiskAmount = balance * (optimalFPercent / 100);
  const optimalFContracts = riskPerContract > 0 ? Math.floor(optimalFRiskAmount / riskPerContract) : 0;

  // Payoff data for chart
  const payoffData = [];
  for (let price = entry - riskPoints * 1.5; price <= entry + rewardPoints * 1.5; price += (riskPoints + rewardPoints) / 20) {
    const pnl = (price - entry) * pointValue * contracts * (entry > stop ? 1 : -1);
    payoffData.push({ price: Number(price.toFixed(2)), pnl: Number(pnl.toFixed(2)) });
  }

  return {
    contracts,
    riskPoints,
    rewardPoints,
    riskPerContract,
    riskAmount,
    dollarRisk,
    dollarReward,
    rMultiple,
    kellyPercent,
    halfKelly,
    optimalFPercent,
    kellyContracts,
    halfKellyContracts,
    optimalFContracts,
    payoffData,
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
