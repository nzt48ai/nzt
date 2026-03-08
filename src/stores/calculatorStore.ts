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

// ES/MES share S&P prices, NQ/MNQ share NASDAQ prices
type PriceGroup = 'sp' | 'nq';
const INSTRUMENT_GROUP: Record<Instrument, PriceGroup> = {
  ES: 'sp', MES: 'sp', NQ: 'nq', MNQ: 'nq',
};

interface PriceSet {
  entry: number;
  stop: number;
  target: number;
}

const DEFAULT_PRICES: Record<PriceGroup, PriceSet> = {
  sp: { entry: 5500, stop: 5490, target: 5520 },
  nq: { entry: 21500, stop: 21470, target: 21560 },
};

interface PositionState {
  instrument: Instrument;
  balance: number;
  riskPercent: number;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  winRate: number;
  // Memory for each price group
  _prices: Record<PriceGroup, PriceSet>;
  setInstrument: (v: Instrument) => void;
  setBalance: (v: number) => void;
  setRiskPercent: (v: number) => void;
  setEntryPrice: (v: number) => void;
  setStopLoss: (v: number) => void;
  setTargetPrice: (v: number) => void;
  setWinRate: (v: number) => void;
}

export const usePositionStore = create<PositionState>((set, get) => ({
  instrument: 'ES',
  balance: 25000,
  riskPercent: 2,
  entryPrice: DEFAULT_PRICES.sp.entry,
  stopLoss: DEFAULT_PRICES.sp.stop,
  targetPrice: DEFAULT_PRICES.sp.target,
  winRate: 55,
  _prices: { ...DEFAULT_PRICES },

  setInstrument: (v) => {
    const state = get();
    const currentGroup = INSTRUMENT_GROUP[state.instrument];
    const newGroup = INSTRUMENT_GROUP[v];

    // Save current prices to memory
    const updatedPrices = {
      ...state._prices,
      [currentGroup]: {
        entry: state.entryPrice,
        stop: state.stopLoss,
        target: state.targetPrice,
      },
    };

    // Load prices from the new group
    const loaded = updatedPrices[newGroup];
    set({
      instrument: v,
      entryPrice: loaded.entry,
      stopLoss: loaded.stop,
      targetPrice: loaded.target,
      _prices: updatedPrices,
    });
  },
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
