import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { usePositionStore, type Instrument, INSTRUMENT_LABELS } from '@/stores/calculatorStore';
import { calcPositionSize } from '@/lib/calculations';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const instruments: Instrument[] = ['ES', 'MES', 'NQ', 'MNQ'];
type KellyMode = 'half' | 'quarter';

function NumericInput({ value, onChange, step, className }: {
  value: number; onChange: (v: number) => void; step?: number; className?: string;
}) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Sync raw with external value changes (e.g. instrument switch) when not focused
  if (!focused && raw !== String(value)) {
    setRaw(String(value));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRaw(v);
    onChange(v === '' ? 0 : Number(v));
  };
  return (
    <input
      type="number"
      value={raw}
      step={step}
      onChange={handleChange}
      onBlur={() => { setFocused(false); setRaw(String(value)); }}
      onFocus={(e) => { setFocused(true); e.target.select(); }}
      className={className}
    />
  );
}

export default function PositionCalculator() {
  const store = usePositionStore();
  const [kellyMode, setKellyMode] = useState<KellyMode>('half');

  const result = useMemo(
    () => calcPositionSize(store.instrument, store.balance, store.entryPrice, store.stopLoss, store.targetPrice, store.winRate),
    [store.instrument, store.balance, store.entryPrice, store.stopLoss, store.targetPrice, store.winRate]
  );

  const contracts = result
    ? kellyMode === 'half' ? result.halfKellyContracts : result.quarterKellyContracts
    : 0;

  const dollarRisk = result
    ? contracts * result.riskPerContract
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-1">
        <h1 className="text-2xl font-bold text-foreground">Position Sizer</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Kelly-based contract sizing</p>
      </motion.div>

      {/* Instrument Selector - pill style */}
      <div className="flex gap-2">
        {instruments.map((inst) => (
          <button
            key={inst}
            onClick={() => store.setInstrument(inst)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              store.instrument === inst
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {inst}
          </button>
        ))}
      </div>

      {/* Balance Card */}
      <GlassCard className="text-center py-6">
        <p className="text-xs text-muted-foreground mb-1">Account Balance</p>
        <div className="relative inline-block">
          <span className="text-muted-foreground text-2xl font-light absolute -left-5 top-1">$</span>
          <NumericInput
            value={store.balance}
            onChange={store.setBalance}
            className="bg-transparent text-4xl font-bold font-mono text-foreground text-center outline-none w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </GlassCard>

      {/* Trade Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="py-3 px-4">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Entry</Label>
          <NumericInput
            value={store.entryPrice}
            onChange={store.setEntryPrice}
            step={0.25}
            className="bg-transparent text-xl font-bold font-mono text-foreground w-full outline-none mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </GlassCard>
        <GlassCard className="py-3 px-4">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Stop Loss</Label>
          <NumericInput
            value={store.stopLoss}
            onChange={store.setStopLoss}
            step={0.25}
            className="bg-transparent text-xl font-bold font-mono text-destructive w-full outline-none mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </GlassCard>
        <GlassCard className="py-3 px-4">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Target</Label>
          <NumericInput
            value={store.targetPrice}
            onChange={store.setTargetPrice}
            step={0.25}
            className="bg-transparent text-xl font-bold font-mono text-primary w-full outline-none mt-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </GlassCard>
        <GlassCard className="py-3 px-4">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</Label>
          <div className="flex items-baseline gap-0.5 mt-1">
            <NumericInput
              value={store.winRate}
              onChange={store.setWinRate}
              className="bg-transparent text-xl font-bold font-mono text-foreground w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-muted-foreground text-sm">%</span>
          </div>
        </GlassCard>
      </div>

      {/* Kelly Toggle */}
      <div className="flex gap-2 bg-secondary rounded-xl p-1">
        <button
          onClick={() => setKellyMode('half')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            kellyMode === 'half'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground'
          }`}
        >
          ½ Kelly
        </button>
        <button
          onClick={() => setKellyMode('quarter')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            kellyMode === 'quarter'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground'
          }`}
        >
          ¼ Kelly
        </button>
      </div>

      {/* Result Card */}
      {result && (
        <GlassCard glow="primary" className="text-center py-8">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Suggested Position</p>
          <motion.div
            key={contracts}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-bold text-primary font-mono"
          >
            <AnimatedNumber value={contracts} decimals={0} />
          </motion.div>
          <p className="text-sm text-muted-foreground mt-1">
            {contracts === 1 ? 'contract' : 'contracts'}
          </p>

          <div className="flex justify-center gap-8 mt-6">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Risk</p>
              <p className="text-sm font-bold font-mono text-destructive">
                $<AnimatedNumber value={dollarRisk} decimals={0} />
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">R Multiple</p>
              <p className="text-sm font-bold font-mono text-primary">
                <AnimatedNumber value={result.rMultiple} decimals={1} suffix="R" />
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
