import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCompoundStore } from '@/stores/calculatorStore';
import { calcCompoundGrowthExpected, calcCompoundGrowth, calcTradeByTrade } from '@/lib/calculations';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CompoundCalculator() {
  const store = useCompoundStore();

  const [showTradeList, setShowTradeList] = useState(false);

  const data12 = useMemo(
    () => calcCompoundGrowthExpected(store.startingBalance, store.winRate, store.riskPercent, store.avgRMultiple, store.tradesPerMonth, 12),
    [store.startingBalance, store.winRate, store.riskPercent, store.avgRMultiple, store.tradesPerMonth]
  );

  const tradeData = useMemo(
    () => calcTradeByTrade(store.startingBalance, store.winRate, store.riskPercent, store.avgRMultiple, store.tradesPerMonth, 12, 200),
    [store.startingBalance, store.winRate, store.riskPercent, store.avgRMultiple, store.tradesPerMonth]
  );

  const bal6 = data12.find((d) => d.month === 6)?.balance ?? 0;
  const bal12 = data12.find((d) => d.month === 12)?.balance ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-xl font-bold text-gradient">Compound Growth</h1>
      </motion.div>

      {/* Starting Balance — big centered card like Position tab */}
      <GlassCard className="text-center py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1">Starting Balance</p>
        <div className="relative inline-flex items-baseline gap-1">
          <span className="text-muted-foreground text-2xl font-light">$</span>
          <input
            type="number"
            inputMode="decimal"
            value={store.startingBalance}
            min={0}
            onChange={(e) => store.setStartingBalance(Math.max(0, Number(e.target.value)))}
            onFocus={(e) => e.target.select()}
            className="bg-transparent text-4xl font-bold font-numbers text-foreground text-center outline-none w-44 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </GlassCard>

      {/* 3 inputs in a row */}
      <div className="grid grid-cols-3 gap-2.5">
        <CompactInput label="Win Rate" suffix="" value={store.winRate} onChange={store.setWinRate} />
        <CompactInput label="Risk %" suffix="" value={store.riskPercent} onChange={store.setRiskPercent} step={0.5} />
        <CompactInput label="Avg R" suffix="" value={store.avgRMultiple} onChange={store.setAvgRMultiple} step={0.1} />
      </div>

      {/* Trades per month — inline row like win rate in position tab */}
      <GlassCard className="flex items-center justify-between px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Trades / Month</span>
        <div className="flex items-baseline gap-0.5">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={store.tradesPerMonth}
            onChange={(e) => store.setTradesPerMonth(Math.max(0, Math.floor(Number(e.target.value))))}
            onFocus={(e) => e.target.select()}
            className="bg-transparent text-base font-bold font-numbers text-foreground w-10 text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </GlassCard>

      {/* Projections */}
      <div className="grid grid-cols-2 gap-2">
        <ProjectionCard label="6 Months" value={bal6} />
        <ProjectionCard label="1 Year" value={bal12} />
      </div>

      {/* Equity Curve — full width */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {showTradeList ? 'Trade by Trade Results' : 'Projected Equity Curve'}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground">Graph</span>
            <button
              onClick={() => setShowTradeList(!showTradeList)}
              className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${showTradeList ? 'bg-primary' : 'bg-muted/50'}`}
            >
              <motion.div
                className="w-3 h-3 bg-white rounded-full shadow-sm"
                animate={{ x: showTradeList ? 16 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className="text-[10px] font-medium text-muted-foreground">List</span>
          </div>
        </div>
        
        {showTradeList ? (
          <div className="h-52">
            <ScrollArea className="h-full">
              <div className="space-y-1 pr-2">
                {tradeData.map((trade) => (
                  <div
                    key={trade.trade}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      trade.result === 'win' 
                        ? 'bg-success/5 border-success/20' 
                        : 'bg-destructive/5 border-destructive/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-medium text-muted-foreground w-8">#{trade.trade}</span>
                      <div className="text-[10px]">
                        <div className="text-muted-foreground/70">Before: ${trade.before.toLocaleString()}</div>
                        <div className="text-foreground font-medium">After: ${trade.after.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-medium ${
                        trade.result === 'win' ? 'text-success' : 'text-destructive'
                      }`}>
                        {trade.result === 'win' ? '+' : ''}${trade.pnl.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-muted-foreground/70 uppercase">
                        {trade.result}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data12}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(220,10%,50%)' }} tickFormatter={(v) => `M${v}`} />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(220,10%,50%)' }}
                  tickFormatter={(v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}k` : `$${v}`}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--glass-bg))',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid hsl(var(--glass-border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 4px 24px hsl(220 30% 10% / 0.1)',
                  }}
                  formatter={(v: number) => [`$${v.toLocaleString()}`, 'Balance']}
                  labelFormatter={(v) => `Month ${v}`}
                />
                <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="url(#equityGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function CompactInput({ label, value, onChange, suffix, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; suffix?: string; step?: number;
}) {
  const [raw, setRaw] = useState(String(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRaw(v);
    onChange(v === '' ? 0 : Number(v));
  };

  const handleBlur = () => setRaw(String(value));

  return (
    <GlassCard className="flex flex-col p-0 overflow-hidden">
      <div className="px-3 pt-2.5 pb-0 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-3 pb-3 pt-1">
        <div className="flex items-baseline gap-0.5">
          <input
            type="number"
            inputMode="decimal"
            value={raw}
            step={step}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={(e) => e.target.select()}
            className="bg-transparent font-medium font-numbers w-full text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-foreground"
            style={{ fontSize: 'clamp(1.05rem, 4vw, 1.35rem)' }}
          />
          {suffix && <span className="text-xs text-muted-foreground/70 font-medium">{suffix}</span>}
        </div>
      </div>
    </GlassCard>
  );
}

function ProjectionCard({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard glow="primary" className="text-center overflow-hidden">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</p>
      <div className="text-sm font-bold font-numbers text-primary mt-1 truncate min-w-0">
        <AnimatedNumber 
          value={value} 
          prefix="$" 
          decimals={value >= 1_000_000 ? 2 : value >= 1_000 ? 1 : 0}
          suffix={value >= 1_000_000 ? 'M' : value >= 1_000 ? 'k' : ''}
        />
      </div>
    </GlassCard>
  );
}
