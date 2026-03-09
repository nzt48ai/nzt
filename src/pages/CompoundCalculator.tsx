import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCompoundStore } from '@/stores/calculatorStore';
import { calcCompoundGrowthExpected } from '@/lib/calculations';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Label } from '@/components/ui/label';

export default function CompoundCalculator() {
  const store = useCompoundStore();

  const data36 = useMemo(
    () => calcCompoundGrowthExpected(store.startingBalance, store.winRate, store.riskPercent, store.avgRMultiple, store.tradesPerMonth, 36),
    [store.startingBalance, store.winRate, store.riskPercent, store.avgRMultiple, store.tradesPerMonth]
  );

  const bal6 = data36.find((d) => d.month === 6)?.balance ?? 0;
  const bal12 = data36.find((d) => d.month === 12)?.balance ?? 0;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-xl font-bold text-foreground">Compound Growth</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Simulate account growth over time</p>
      </motion.div>

      <GlassCard>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Starting Balance" prefix="$" value={store.startingBalance} onChange={store.setStartingBalance} />
          <FieldInput label="Win Rate %" suffix="%" value={store.winRate} onChange={store.setWinRate} />
          <FieldInput label="Risk per Trade %" suffix="%" value={store.riskPercent} onChange={store.setRiskPercent} step={0.5} />
          <FieldInput label="Avg R Multiple" suffix="R" value={store.avgRMultiple} onChange={store.setAvgRMultiple} step={0.1} />
          <div className="col-span-2">
            <FieldInput label="Trades per Month" value={store.tradesPerMonth} onChange={store.setTradesPerMonth} />
          </div>
        </div>
      </GlassCard>

      {/* Projections — 2 cards only */}
      <div className="grid grid-cols-2 gap-2">
        <ProjectionCard label="6 Months" value={bal6} />
        <ProjectionCard label="1 Year" value={bal12} />
      </div>

      {/* Equity Curve */}
      <GlassCard>
        <p className="text-xs text-muted-foreground mb-2">Projected Equity Curve</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data36}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(220, 80%, 55%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(220, 80%, 55%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(220,10%,50%)' }} tickFormatter={(v) => `M${v}`} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(220,10%,50%)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
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
              <Area type="monotone" dataKey="balance" stroke="hsl(220,80%,55%)" fill="url(#equityGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}

function FieldInput({ label, value, onChange, prefix, suffix, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number;
}) {
  const [raw, setRaw] = useState(String(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRaw(v);
    onChange(v === '' ? 0 : Number(v));
  };

  const handleBlur = () => {
    setRaw(String(value));
  };

  return (
    <div>
      <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</Label>
      <div className="relative mt-0.5">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70 z-10">{prefix}</span>}
        <input
          type="number"
          value={raw}
          step={step}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
          className={`w-full h-9 rounded-lg text-sm font-numbers font-medium text-foreground outline-none px-3 transition-all
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-6' : ''}
            focus:ring-1 focus:ring-primary/40`}
          style={{
            background: 'hsl(var(--glass-bg))',
            border: '1px solid hsl(var(--glass-border))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">{suffix}</span>}
      </div>
    </div>
  );
}

function ProjectionCard({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard glow="primary" className="text-center overflow-hidden">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</p>
      <p className="text-sm font-bold font-numbers text-primary mt-1 truncate min-w-0">
        <AnimatedNumber value={value} prefix="$" decimals={0} />
      </p>
    </GlassCard>
  );
}
