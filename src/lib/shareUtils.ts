import type { Trade, JournalSummary } from "@/types/trade";

export function formatDollars(v: number): string {
  const abs = Math.abs(v);
  const prefix = v < 0 ? "-" : "";
  return `${prefix}$${abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatPoints(v: number): string {
  return `${Math.abs(v).toFixed(1)} pts`;
}

export function formatR(v: number): string {
  const prefix = v >= 0 ? "+" : "";
  return `${prefix}${v.toFixed(1)}R`;
}

export function calcDurationText(trade: Trade): string {
  if (!trade.entryTimestamp || !trade.exitTimestamp) return "";
  const entry = new Date(trade.entryTimestamp).getTime();
  const exit = new Date(trade.exitTimestamp).getTime();
  const mins = Math.round((exit - entry) / 60000);

  let outcome = "Closed";
  if (trade.exitPrice !== undefined) {
    if (trade.direction === "LONG") {
      if (trade.exitPrice <= trade.stopPrice) outcome = "Stopped out";
      else if (trade.exitPrice >= trade.targetPrice) outcome = "Target hit";
      else outcome = "Closed manually";
    } else {
      if (trade.exitPrice >= trade.stopPrice) outcome = "Stopped out";
      else if (trade.exitPrice <= trade.targetPrice) outcome = "Target hit";
      else outcome = "Closed manually";
    }
  }

  if (mins < 60) return `${outcome} in ${mins} minute${mins !== 1 ? "s" : ""}`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${outcome} in ${hrs}h ${rem}m`;
}

export function selectReplayPath(trade: Trade): Array<{ timestamp: string; price: number }> {
  if (trade.historicalPriceSeries && trade.historicalPriceSeries.length > 0) {
    return trade.historicalPriceSeries;
  }
  return generateSimplifiedPath(trade);
}

export function generateSimplifiedPath(trade: Trade): Array<{ timestamp: string; price: number }> {
  const entry = trade.entryPrice;
  const stop = trade.stopPrice;
  const target = trade.targetPrice;
  const exit = trade.exitPrice ?? entry;
  const isLong = trade.direction === "LONG";

  const points: number[] = [entry];

  // Add some realistic movement toward the result
  const midPoint = isLong
    ? entry + (exit - entry) * 0.3
    : entry - (entry - exit) * 0.3;

  // A small dip toward stop before moving to exit
  const dipPoint = isLong
    ? entry - Math.abs(entry - stop) * 0.3
    : entry + Math.abs(stop - entry) * 0.3;

  points.push(dipPoint, midPoint, exit);

  // Interpolate to ~60 frames
  const interpolated: Array<{ timestamp: string; price: number }> = [];
  const totalFrames = 60;
  for (let i = 0; i <= totalFrames; i++) {
    const t = i / totalFrames;
    const segIndex = t * (points.length - 1);
    const seg = Math.min(Math.floor(segIndex), points.length - 2);
    const segT = segIndex - seg;
    const price = points[seg] + (points[seg + 1] - points[seg]) * segT;
    interpolated.push({
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
      price,
    });
  }

  return interpolated;
}

// Mock data for preview
export const MOCK_TRADE: Trade = {
  id: "1",
  instrument: "MNQ",
  direction: "LONG",
  entryPrice: 21500,
  stopPrice: 21470,
  targetPrice: 21560,
  exitPrice: 21555,
  contracts: 6,
  riskAmount: 420,
  rewardAmount: 840,
  resultAmount: 660,
  riskPoints: 30,
  rewardPoints: 60,
  resultPoints: 55,
  rMultiple: 1.8,
  entryTimestamp: new Date(Date.now() - 12 * 60000).toISOString(),
  exitTimestamp: new Date().toISOString(),
  verificationLevel: "price_verified",
};

export const MOCK_JOURNAL_SUMMARIES: Record<string, JournalSummary> = {
  day: {
    period: "day",
    tradeCount: 4,
    winRate: 75,
    averageR: 1.6,
    netResultAmount: 1240,
    netResultR: 4.8,
    equityCurve: Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - (9 - i) * 3600000).toISOString(),
      value: 25000 + Math.random() * 800 + i * 120,
    })),
  },
  week: {
    period: "week",
    tradeCount: 18,
    winRate: 61,
    averageR: 1.4,
    netResultAmount: 3200,
    netResultR: 12.6,
    equityCurve: Array.from({ length: 30 }, (_, i) => ({
      timestamp: new Date(Date.now() - (29 - i) * 86400000 / 4).toISOString(),
      value: 25000 + Math.sin(i * 0.3) * 400 + i * 100,
    })),
  },
  month: {
    period: "month",
    tradeCount: 64,
    winRate: 58,
    averageR: 1.3,
    netResultAmount: 8400,
    netResultR: 38.2,
    equityCurve: Array.from({ length: 60 }, (_, i) => ({
      timestamp: new Date(Date.now() - (59 - i) * 86400000 / 2).toISOString(),
      value: 25000 + Math.sin(i * 0.15) * 600 + i * 130,
    })),
  },
};

export async function exportCanvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export async function shareBlob(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
  } else {
    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
