import { useEffect, useState, useRef } from "react";
import type { Trade, DisplayMode } from "@/types/trade";
import { formatDollars, formatPoints, formatR, calcDurationText, selectReplayPath } from "@/lib/shareUtils";

interface Props {
  trade: Trade;
  displayMode: DisplayMode;
  autoPlay?: boolean;
}

export default function ReplayShareCard({ trade, displayMode, autoPlay = true }: Props) {
  const isDollar = displayMode === "$";
  const path = selectReplayPath(trade);
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const duration = 6000; // 6 seconds

  useEffect(() => {
    if (!autoPlay) {
      setProgress(1);
      return;
    }

    const loop = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      setProgress(t);

      if (t >= 1) {
        // Loop after pause
        setTimeout(() => {
          startRef.current = 0;
          setProgress(0);
          animRef.current = requestAnimationFrame(loop);
        }, 1000);
        return;
      }
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [autoPlay]);

  const visibleCount = Math.max(2, Math.floor(progress * path.length));
  const visiblePath = path.slice(0, visibleCount);

  // Chart dimensions (relative to container)
  const prices = path.map((p) => p.price);
  const allPrices = [...prices, trade.stopPrice, trade.targetPrice, trade.entryPrice];
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const range = maxP - minP || 1;
  const pad = range * 0.1;

  const chartMin = minP - pad;
  const chartMax = maxP + pad;

  const toY = (price: number) => (1 - (price - chartMin) / (chartMax - chartMin)) * 100;
  const toX = (i: number) => (i / (path.length - 1)) * 100;

  const pathD = visiblePath
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.price)}`)
    .join(" ");

  const lastPoint = visiblePath[visiblePath.length - 1];
  const cursorX = toX(visiblePath.length - 1);
  const cursorY = toY(lastPoint?.price ?? trade.entryPrice);

  const durationText = calcDurationText(trade);
  const isWin = (trade.resultAmount ?? 0) >= 0;

  return (
    <div className="w-full h-full flex flex-col bg-[hsl(220,30%,8%)] text-[hsl(0,0%,96%)] overflow-hidden">
      {/* Header */}
      <div className="p-[6%] pb-[3%]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[5%] font-bold uppercase tracking-[0.15em] text-[hsl(220,80%,60%)]">
              {trade.instrument} Replay
            </p>
            <p className="text-[3%] uppercase tracking-[0.15em] text-[hsl(0,0%,50%)] mt-[1%]">
              {trade.direction}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[3%] font-bold tracking-[0.15em] text-[hsl(0,0%,40%)]">HELIX</p>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 px-[6%] relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {/* Stop level */}
          <line
            x1="0" y1={toY(trade.stopPrice)} x2="100" y2={toY(trade.stopPrice)}
            stroke="hsl(0,72%,55%)" strokeWidth="0.3" strokeDasharray="2,2" opacity={0.5}
          />
          {/* Target level */}
          <line
            x1="0" y1={toY(trade.targetPrice)} x2="100" y2={toY(trade.targetPrice)}
            stroke="hsl(152,60%,45%)" strokeWidth="0.3" strokeDasharray="2,2" opacity={0.5}
          />
          {/* Entry level */}
          <line
            x1="0" y1={toY(trade.entryPrice)} x2="100" y2={toY(trade.entryPrice)}
            stroke="hsl(0,0%,50%)" strokeWidth="0.2" strokeDasharray="1,2" opacity={0.4}
          />

          {/* Price path */}
          <path
            d={pathD}
            fill="none"
            stroke={isWin ? "hsl(152,60%,55%)" : "hsl(0,72%,60%)"}
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />

          {/* Entry marker */}
          <circle cx={toX(0)} cy={toY(trade.entryPrice)} r="1.2" fill="hsl(0,0%,96%)" />

          {/* Cursor */}
          <circle cx={cursorX} cy={cursorY} r="1.5" fill={isWin ? "hsl(152,60%,55%)" : "hsl(0,72%,60%)"} />
          <circle cx={cursorX} cy={cursorY} r="2.5" fill={isWin ? "hsl(152,60%,55%)" : "hsl(0,72%,60%)"} opacity={0.3} />
        </svg>

        {/* Level labels */}
        <div className="absolute left-[7%] text-[2.5%] font-numbers" style={{ top: `${toY(trade.targetPrice) * 0.85}%`, color: "hsl(152,60%,45%)" }}>
          TP {trade.targetPrice.toFixed(0)}
        </div>
        <div className="absolute left-[7%] text-[2.5%] font-numbers" style={{ top: `${toY(trade.stopPrice) * 0.85 + 4}%`, color: "hsl(0,72%,55%)" }}>
          SL {trade.stopPrice.toFixed(0)}
        </div>
      </div>

      {/* Footer stats */}
      <div className="p-[6%] pt-[3%]">
        <div className="h-[1px] bg-[hsl(220,20%,20%)] mb-[4%]" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[3%] text-[hsl(0,0%,50%)] mb-[1%]">Result</p>
            <p className="text-[5%] font-bold font-numbers" style={{ color: isWin ? "hsl(152,60%,45%)" : "hsl(0,72%,55%)" }}>
              {isDollar ? formatDollars(trade.resultAmount ?? 0) : formatPoints(trade.resultPoints ?? 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[3%] text-[hsl(0,0%,50%)] mb-[1%]">R Multiple</p>
            <p className="text-[5%] font-bold font-numbers text-[hsl(220,80%,60%)]">
              {formatR(trade.rMultiple ?? 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[3%] text-[hsl(0,0%,50%)] mb-[1%]">Duration</p>
            <p className="text-[3.5%] font-medium text-[hsl(0,0%,70%)]">{durationText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
