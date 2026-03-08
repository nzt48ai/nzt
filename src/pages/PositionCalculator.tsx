import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePositionStore, type Instrument, INSTRUMENT_LABELS } from '@/stores/calculatorStore';
import { calcPositionSize } from '@/lib/calculations';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const instruments: Instrument[] = ['ES', 'MES', 'NQ', 'MNQ'];

export default function PositionCalculator() {
  const store = usePositionStore();

  const result = useMemo(
    () => calcPositionSize(store.instrument, store.balance, store.riskPercent, store.entryPrice, store.stopLoss, store.targetPrice, store.winRate),
    [store.instrument, store.balance, store.riskPercent, store.entryPrice, store.stopLoss, store.targetPrice, store.winRate]
  );

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-xl font-bold text-gradient">Position Sizer</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Calculate optimal contract size</p>
      </motion.div>

      {/* Instrument Select */}
      <GlassCard>
        <Label className="text-xs text-muted-foreground">Instrument</Label>
        <Select value={store.instrument} onValueChange={(v) => store.setInstrument(v as Instrument)}>
          <SelectTrigger className="mt-1 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {instruments.map((i) => (
              <SelectItem key={i} value={i}>{i} — {INSTRUMENT_LABELS[i]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </GlassCard>

      {/* Inputs Grid */}
      <GlassCard>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Account Balance" prefix="$" value={store.balance} onChange={store.setBalance} />
          <FieldInput label="Risk %" suffix="%" value={store.riskPercent} onChange={store.setRiskPercent} step={0.5} />
          <FieldInput label="Entry Price" value={store.entryPrice} onChange={store.setEntryPrice} step={0.25} />
          <FieldInput label="Stop Loss" value={store.stopLoss} onChange={store.setStopLoss} step={0.25} />
          <FieldInput label="Target Price" value={store.targetPrice} onChange={store.setTargetPrice} step={0.25} />
          <FieldInput label="Win Rate %" suffix="%" value={store.winRate} onChange={store.setWinRate} />
        </div>
      </GlassCard>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <>
            <GlassCard glow="primary" className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Recommended Contracts</p>
              <div className="text-5xl font-bold text-primary font-mono">
                <AnimatedNumber value={result.contracts} decimals={0} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <ResultStat label="Dollar Risk" value={result.dollarRisk} prefix="$" />
                <ResultStat label="Dollar Reward" value={result.dollarReward} prefix="$" />
                <ResultStat label="R Multiple" value={result.rMultiple} suffix="R" color="accent" />
              </div>
            </GlassCard>

            {/* Sizing Methods */}
            <GlassCard>
              <p className="text-xs text-muted-foreground mb-3">Sizing Methods Comparison</p>
              <div className="grid grid-cols-3 gap-2">
                <MethodCard title="Kelly" percent={result.kellyPercent} contracts={result.kellyContracts} />
                <MethodCard title="½ Kelly" percent={result.halfKelly} contracts={result.halfKellyContracts} />
                <MethodCard title="Optimal-F" percent={result.optimalFPercent} contracts={result.optimalFContracts} />
              </div>
            </GlassCard>

            {/* Payoff Chart */}
            {result.payoffData.length > 0 && (
              <GlassCard>
                <p className="text-xs text-muted-foreground mb-2">Payoff Visualization</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.payoffData}>
                      <defs>
                        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(160, 80%, 45%)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(160, 80%, 45%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="price" tick={{ fontSize: 10, fill: 'hsl(215,12%,55%)' }} tickFormatter={(v) => v.toFixed(0)} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(215,12%,55%)' }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(220,18%,10%)', border: '1px solid hsl(220,14%,25%)', borderRadius: '8px', fontSize: '12px' }}
                        labelFormatter={(v) => `Price: ${v}`}
                        formatter={(v: number) => [`$${v.toFixed(2)}`, 'P&L']}
                      />
                      <ReferenceLine y={0} stroke="hsl(215,12%,55%)" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="pnl" stroke="hsl(160,80%,45%)" fill="url(#pnlGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldInput({ label, value, onChange, prefix, suffix, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number;
}) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="relative mt-0.5">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{prefix}</span>}
        <Input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`bg-secondary border-border font-mono text-sm h-9 ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-6' : ''}`}
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function ResultStat({ label, value, prefix = '', suffix = '', color = 'primary' }: {
  label: string; value: number; prefix?: string; suffix?: string; color?: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold font-mono ${color === 'accent' ? 'text-accent' : 'text-primary'}`}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
      </p>
    </div>
  );
}

function MethodCard({ title, percent, contracts }: { title: string; percent: number; contracts: number }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
      <p className="text-[10px] text-muted-foreground">{title}</p>
      <p className="text-lg font-bold font-mono text-foreground">{contracts}</p>
      <p className="text-[10px] text-muted-foreground">{percent.toFixed(1)}%</p>
    </div>
  );
}
