export type Instrument = "ES" | "MES" | "NQ" | "MNQ";

export type Trade = {
  id: string;
  instrument: Instrument;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  exitPrice?: number;
  contracts?: number;
  riskAmount?: number;
  rewardAmount?: number;
  resultAmount?: number;
  riskPoints?: number;
  rewardPoints?: number;
  resultPoints?: number;
  rMultiple?: number;
  entryTimestamp: string;
  exitTimestamp?: string;
  verificationLevel?: "broker_verified" | "price_verified" | "manual_journal";
  historicalPriceSeries?: Array<{ timestamp: string; price: number }>;
};

export type JournalSummary = {
  period: "day" | "week" | "month";
  tradeCount: number;
  winRate: number;
  averageR: number;
  netResultAmount?: number;
  netResultR?: number;
  equityCurve: Array<{ timestamp: string; value: number }>;
};

export type ShareCardMode = "SETUP" | "REPLAY" | "JOURNAL";
export type DisplayMode = "$" | "Points";
export type JournalPeriod = "day" | "week" | "month";
export type JournalExportMode = "Static" | "Animated";
