import { create } from 'zustand';

export type Instrument = 'ES' | 'MES' | 'NQ' | 'MNQ';

export const POINT_VALUES: Record<Instrument, number> = {
  ES: 50,
  MES: 5,
  NQ: 20,
  MNQ: 2,
};

export const INSTRUMENT_LABELS: Record<Instrument, string> = {
  ES: 'E-mini S&P 500',
  MES: 'Micro E-mini S&P',
  NQ: 'E-mini NASDAQ',
  MNQ: 'Micro E-mini NASDAQ',
};

interface PositionState {
  instrument: Instrument;
  balance: number;
  riskPercent: number;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  winRate: number;
  setInstrument: (v: Instrument) => void;
  setBalance: (v: number) => void;
  setRiskPercent: (v: number) => void;
  setEntryPrice: (v: number) => void;
  setStopLoss: (v: number) => void;
  setTargetPrice: (v: number) => void;
  setWinRate: (v: number) => void;
}

export const usePositionStore = create<PositionState>((set) => ({
  instrument: 'ES',
  balance: 25000,
  riskPercent: 2,
  entryPrice: 5500,
  stopLoss: 5490,
  targetPrice: 5520,
  winRate: 55,
  setInstrument: (v) => set({ instrument: v }),
  setBalance: (v) => set({ balance: v }),
  setRiskPercent: (v) => set({ riskPercent: v }),
  setEntryPrice: (v) => set({ entryPrice: v }),
  setStopLoss: (v) => set({ stopLoss: v }),
  setTargetPrice: (v) => set({ targetPrice: v }),
  setWinRate: (v) => set({ winRate: v }),
}));

interface CompoundState {
  startingBalance: number;
  winRate: number;
  riskPercent: number;
  avgRMultiple: number;
  tradesPerMonth: number;
  setStartingBalance: (v: number) => void;
  setWinRate: (v: number) => void;
  setRiskPercent: (v: number) => void;
  setAvgRMultiple: (v: number) => void;
  setTradesPerMonth: (v: number) => void;
}

export const useCompoundStore = create<CompoundState>((set) => ({
  startingBalance: 25000,
  winRate: 55,
  riskPercent: 2,
  avgRMultiple: 2,
  tradesPerMonth: 20,
  setStartingBalance: (v) => set({ startingBalance: v }),
  setWinRate: (v) => set({ winRate: v }),
  setRiskPercent: (v) => set({ riskPercent: v }),
  setAvgRMultiple: (v) => set({ avgRMultiple: v }),
  setTradesPerMonth: (v) => set({ tradesPerMonth: v }),
}));
