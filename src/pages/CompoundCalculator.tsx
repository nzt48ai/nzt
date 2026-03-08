import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCompoundStore } from '@/stores/calculatorStore';
import { calcCompoundGrowthExpected } from '@/lib/calculations';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CompoundCalculator() {
  const store = useCompoundStore();

  const data36 = useMemo(
    () => calcCompoundGrowthExpected(store.startingBalance, store.winRate, store.riskPercent, store.avgRMultiple, store.tradesPerMonth, 36),
    [store.startingBalance, store.winRate, store.riskPercent, store.avgRMultiple, store.tradesPerMonth]
  );

  const bal6 = data36.find((d) => d.month === 6)?.balance ?? 0;
  const bal12 = data36.find((d) => d.month === 12)?.balance ?? 0;
  const bal36 = data36[data36.length - 1]?.balance ?? 0;

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-xl font-bold text-gradient">Compound Growth</h1>
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

      {/* Projections */}
      <div className="grid grid-cols-3 gap-2">
        <ProjectionCard label="6 Months" value={bal6} />
        <ProjectionCard label="1 Year" value={bal12} />
        <ProjectionCard label="3 Years" value={bal36} />
      </div>

      {/* Equity Curve */}
      <GlassCard>
        <p className="text-xs text-muted-foreground mb-2">Projected Equity Curve</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data36}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 80%, 45%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(270, 60%, 55%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(215,12%,55%)' }} tickFormatter={(v) => `M${v}`} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215,12%,55%)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,14%,25%)', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Balance']}
                labelFormatter={(v) => `Month ${v}`}
              />
              <Area type="monotone" dataKey="balance" stroke="hsl(160,80%,45%)" fill="url(#equityGrad)" strokeWidth={2} />
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
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="relative mt-0.5">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          value={raw}
          step={step}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
          className={`bg-secondary border-border font-mono text-sm h-9 ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-6' : ''}`}
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function ProjectionCard({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard glow="primary" className="text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold font-mono text-primary mt-1">
        <AnimatedNumber value={value} prefix="$" decimals={0} />
      </p>
    </GlassCard>
  );
}
