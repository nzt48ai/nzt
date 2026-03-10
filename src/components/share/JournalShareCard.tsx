import { useEffect, useState, useRef } from "react";
import type { JournalSummary, DisplayMode, JournalExportMode } from "@/types/trade";
import { formatDollars, formatR } from "@/lib/shareUtils";

interface Props {
  summary: JournalSummary;
  displayMode: DisplayMode;
  exportMode: JournalExportMode;
  autoPlay?: boolean;
}

const PERIOD_LABELS: Record<string, string> = {
  day: "Daily",
  week: "Weekly",
  month: "Monthly",
};

export default function JournalShareCard({ summary, displayMode, exportMode, autoPlay = true }: Props) {
  const isDollar = displayMode === "$";
  const isAnimated = exportMode === "Animated";
  const [progress, setProgress] = useState(isAnimated ? 0 : 1);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!isAnimated || !autoPlay) {
      setProgress(1);
      return;
    }

    setProgress(0);
    startRef.current = 0;

    const loop = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const t = Math.min((timestamp - startRef.current) / 6000, 1);
      setProgress(t);
      if (t >= 1) {
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
  }, [isAnimated, autoPlay]);

  const curve = summary.equityCurve;
  const values = curve.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const pad = range * 0.1;

  const toY = (v: number) => (1 - (v - (minV - pad)) / (range + 2 * pad)) * 100;
  const toX = (i: number) => (i / (curve.length - 1)) * 100;

  const visibleCount = Math.max(2, Math.floor(progress * curve.length));
  const visibleCurve = curve.slice(0, visibleCount);

  const pathD = visibleCurve
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.value)}`)
    .join(" ");

  // Gradient area
  const areaD = pathD + ` L ${toX(visibleCount - 1)} 100 L 0 100 Z`;

  const isPositive = (summary.netResultAmount ?? 0) >= 0;

  return (
    <div className="w-full h-full flex flex-col bg-[hsl(220,30%,8%)] text-[hsl(0,0%,96%)] overflow-hidden">
      {/* Header */}
      <div className="p-[6%] pb-[2%]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[5%] font-bold uppercase tracking-[0.15em] text-[hsl(220,80%,60%)]">
              {PERIOD_LABELS[summary.period]} Journal
            </p>
          </div>
          <p className="text-[3%] font-bold tracking-[0.15em] text-[hsl(0,0%,40%)]">HELIX</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-[2%] mt-[5%]">
          <StatBlock label="Trades" value={String(summary.tradeCount)} />
          <StatBlock label="Win Rate" value={`${summary.winRate}%`} />
          <StatBlock label="Avg R" value={formatR(summary.averageR)} color="hsl(220,80%,60%)" />
          <StatBlock
            label="Net P&L"
            value={isDollar ? formatDollars(summary.netResultAmount ?? 0) : formatR(summary.netResultR ?? 0)}
            color={isPositive ? "hsl(152,60%,45%)" : "hsl(0,72%,55%)"}
          />
        </div>
      </div>

      {/* Equity curve */}
      <div className="flex-1 px-[4%] pb-[4%]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="equity-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? "hsl(152,60%,45%)" : "hsl(0,72%,55%)"} stopOpacity={0.3} />
              <stop offset="100%" stopColor={isPositive ? "hsl(152,60%,45%)" : "hsl(0,72%,55%)"} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaD} fill="url(#equity-gradient)" />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={isPositive ? "hsl(152,60%,55%)" : "hsl(0,72%,60%)"}
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />

          {/* Cursor dot */}
          {visibleCurve.length > 0 && (
            <>
              <circle
                cx={toX(visibleCount - 1)}
                cy={toY(visibleCurve[visibleCurve.length - 1].value)}
                r="1.5"
                fill={isPositive ? "hsl(152,60%,55%)" : "hsl(0,72%,60%)"}
              />
              <circle
                cx={toX(visibleCount - 1)}
                cy={toY(visibleCurve[visibleCurve.length - 1].value)}
                r="2.5"
                fill={isPositive ? "hsl(152,60%,55%)" : "hsl(0,72%,60%)"}
                opacity={0.3}
              />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <p className="text-[2.5%] uppercase tracking-[0.15em] text-[hsl(0,0%,50%)] mb-[2%]">{label}</p>
      <p className="text-[3.5%] font-bold font-numbers" style={{ color: color ?? "hsl(0,0%,96%)" }}>
        {value}
      </p>
    </div>
  );
}
