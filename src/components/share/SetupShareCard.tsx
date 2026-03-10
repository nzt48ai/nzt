import type { Trade, DisplayMode } from "@/types/trade";
import { formatDollars, formatPoints, formatR } from "@/lib/shareUtils";

interface Props {
  trade: Trade;
  displayMode: DisplayMode;
}

export default function SetupShareCard({ trade, displayMode }: Props) {
  const isDollar = displayMode === "$";

  return (
    <div className="w-full h-full flex flex-col justify-between p-[8%] bg-[hsl(220,30%,8%)] text-[hsl(0,0%,96%)]">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-[6%]">
          <div>
            <p className="text-[5%] font-bold uppercase tracking-[0.15em] text-[hsl(220,80%,60%)]">
              {trade.instrument} Setup
            </p>
            <p className="text-[3.2%] uppercase tracking-[0.2em] text-[hsl(0,0%,50%)] mt-[1%]">
              {trade.direction}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[3%] font-bold tracking-[0.15em] text-[hsl(0,0%,40%)]">HELIX</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-[hsl(220,20%,20%)] mb-[6%]" />

        {/* Price levels */}
        <div className="space-y-[4%]">
          <PriceRow label="Entry" value={trade.entryPrice} color="hsl(0,0%,96%)" />
          <PriceRow label="Stop" value={trade.stopPrice} color="hsl(0,72%,55%)" />
          <PriceRow label="Target" value={trade.targetPrice} color="hsl(152,60%,45%)" />
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="h-[1px] bg-[hsl(220,20%,20%)] mb-[5%]" />

        {isDollar ? (
          <div className="grid grid-cols-3 gap-[3%]">
            <StatBlock label="Contracts" value={String(trade.contracts ?? 1)} />
            <StatBlock label="Risk" value={formatDollars(trade.riskAmount ?? 0)} color="hsl(0,72%,55%)" />
            <StatBlock label="Reward" value={formatDollars(trade.rewardAmount ?? 0)} color="hsl(152,60%,45%)" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[3%]">
            <StatBlock label="Risk" value={formatPoints(trade.riskPoints ?? 0)} color="hsl(0,72%,55%)" />
            <StatBlock label="Reward" value={formatPoints(trade.rewardPoints ?? 0)} color="hsl(152,60%,45%)" />
          </div>
        )}

        {/* R Multiple */}
        <div className="mt-[5%] text-center">
          <p className="text-[8%] font-bold text-[hsl(220,80%,60%)]">
            {formatR(trade.rMultiple ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

function PriceRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[3.2%] uppercase tracking-[0.15em] text-[hsl(0,0%,50%)]">{label}</span>
      <span className="text-[4.5%] font-bold font-numbers" style={{ color }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <p className="text-[2.8%] uppercase tracking-[0.15em] text-[hsl(0,0%,50%)] mb-[2%]">{label}</p>
      <p className="text-[4%] font-bold font-numbers" style={{ color: color ?? "hsl(0,0%,96%)" }}>
        {value}
      </p>
    </div>
  );
}
