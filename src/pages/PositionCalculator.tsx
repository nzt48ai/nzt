import { useMemo, useState, useRef, useCallback } from 'react';
import { motion, useSpring, useTransform, useMotionValue, animate } from 'framer-motion';
import { usePositionStore, type Instrument, INSTRUMENT_LABELS, POINT_VALUES } from '@/stores/calculatorStore';
import { calcPositionSize } from '@/lib/calculations';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { Label } from '@/components/ui/label';

const instruments: Instrument[] = ['ES', 'MES', 'NQ', 'MNQ'];
type KellyMode = 'full' | 'half' | 'quarter' | 'off';

const KELLY_OPTIONS: { mode: KellyMode; label: string }[] = [
  { mode: 'full', label: 'Full' },
  { mode: 'half', label: '½' },
  { mode: 'quarter', label: '¼' },
  { mode: 'off', label: 'Off' },
];

// Tick size per instrument (minimum price movement)
const TICK_SIZE: Record<Instrument, number> = {
  ES: 0.25,
  MES: 0.25,
  NQ: 0.25,
  MNQ: 0.25,
};

const spring = { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.8 };

interface NumericInputProps {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
  scrollable?: boolean;
  instrument?: Instrument;
}

function NumericInput({ value, onChange, step = 1, min, max, className, scrollable }: NumericInputProps) {
  const [raw, setRaw] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const startY = useRef<number | null>(null);
  const startValue = useRef<number>(value);
  // For smooth animated scroll display
  const animatedValue = useMotionValue(value);
  const isScrolling = useRef(false);
  const scrollAnimRef = useRef<ReturnType<typeof animate> | null>(null);

  if (!focused && !isScrolling.current && raw !== String(value)) {
    setRaw(String(value));
  }

  const clamp = useCallback((v: number) => {
    if (min !== undefined && v < min) return min;
    if (max !== undefined && v > max) return max;
    return v;
  }, [min, max]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRaw(v);
    const num = v === '' ? 0 : Number(v);
    onChange(clamp(num));
  };

  const smoothStep = useCallback((next: number) => {
    isScrolling.current = true;
    if (scrollAnimRef.current) scrollAnimRef.current.stop();
    scrollAnimRef.current = animate(animatedValue, next, {
      type: 'spring',
      stiffness: 500,
      damping: 35,
      mass: 0.5,
      onUpdate: (v) => {
        setRaw(v.toFixed(step < 1 ? 2 : 0));
      },
      onComplete: () => {
        isScrolling.current = false;
        setRaw(String(next));
      },
    });
    onChange(next);
  }, [animatedValue, onChange, step]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    if (!scrollable) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    const next = clamp(parseFloat((value + delta).toFixed(4)));
    smoothStep(next);
  }, [scrollable, step, value, clamp, smoothStep]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    if (!scrollable) return;
    startY.current = e.touches[0].clientY;
    startValue.current = value;
  }, [scrollable, value]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    if (!scrollable || startY.current === null) return;
    e.preventDefault();
    const dy = startY.current - e.touches[0].clientY;
    const steps = Math.round(dy / 6);
    const next = clamp(parseFloat((startValue.current + steps * step).toFixed(4)));
    smoothStep(next);
  }, [scrollable, step, clamp, smoothStep]);

  const handleTouchEnd = useCallback(() => {
    startY.current = null;
  }, []);

  return (
    <input
      type="number"
      inputMode="decimal"
      value={raw}
      step={step}
      min={min}
      max={max}
      onChange={handleChange}
      onBlur={() => { setFocused(false); isScrolling.current = false; setRaw(String(value)); }}
      onFocus={(e) => { setFocused(true); e.target.select(); }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={className}
    />
  );
}

export default function PositionCalculator() {
  const store = usePositionStore();
  const [kellyMode, setKellyMode] = useState<KellyMode>('half');
  const activeIndex = instruments.indexOf(store.instrument);

  const result = useMemo(
    () => calcPositionSize(store.instrument, store.balance, store.entryPrice, store.stopLoss, store.targetPrice, store.winRate),
    [store.instrument, store.balance, store.entryPrice, store.stopLoss, store.targetPrice, store.winRate]
  );

  const contracts = result
    ? kellyMode === 'full' ? Math.floor(store.balance * (result.kellyPercent / 100) / result.riskPerContract)
    : kellyMode === 'half' ? result.halfKellyContracts
    : kellyMode === 'quarter' ? result.quarterKellyContracts
    : 0
    : 0;

  const dollarRisk = result ? contracts * result.riskPerContract : 0;
  const dollarReturn = result ? contracts * result.rewardPoints * POINT_VALUES[store.instrument] : 0;

  const tick = TICK_SIZE[store.instrument];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-1">
        <h1 className="text-2xl font-bold text-foreground">Position Sizer</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Kelly-based contract sizing</p>
      </motion.div>

      {/* Instrument Selector */}
      <div
        className="relative overflow-hidden rounded-[22px] px-1.5 py-2"
        style={{
          background: 'hsl(var(--glass-bg))',
          border: '1px solid hsl(var(--glass-border))',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 8px 32px hsl(220 30% 10% / 0.1), inset 0 1px 0 hsl(0 0% 100% / 0.5)',
        }}
      >
        <div className="flex items-center relative">
          {activeIndex >= 0 && (
            <motion.div
              layoutId="inst-pill"
              className="absolute rounded-xl pointer-events-none"
              style={{
                background: 'hsl(var(--primary) / 0.12)',
                border: '1px solid hsl(var(--primary) / 0.2)',
                width: `${100 / instruments.length}%`,
                left: `${(activeIndex / instruments.length) * 100}%`,
                top: 0,
                bottom: 0,
              }}
              transition={spring}
            />
          )}

          {instruments.map((inst) => {
            const active = store.instrument === inst;
            return (
              <motion.button
                key={inst}
                onClick={() => store.setInstrument(inst)}
                className="relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl"
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.07 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <motion.span
                  animate={active ? { scale: 1.1 } : { scale: 1 }}
                  transition={spring}
                  className={`text-sm font-bold transition-colors duration-200 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {inst}
                </motion.span>
                <span className={`text-[9px] font-medium transition-colors duration-200 leading-tight text-center ${active ? 'text-primary/70' : 'text-muted-foreground/60'}`}>
                  {INSTRUMENT_LABELS[inst].split(' ').slice(0, 2).join(' ')}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Balance Card */}
      <GlassCard className="text-center py-6">
        <p className="text-xs text-muted-foreground mb-1">Account Balance</p>
        <div className="relative inline-block">
          <span className="text-muted-foreground text-2xl font-light absolute -left-5 top-1">$</span>
          <NumericInput
            value={store.balance}
            onChange={store.setBalance}
            min={0}
            className="bg-transparent text-4xl font-bold font-numbers text-foreground text-center outline-none w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </GlassCard>

      {/* Trade Inputs */}
      <div className="grid grid-cols-2 gap-3">
        {/* Entry */}
        <GlassCard className="py-3 px-4">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Entry</Label>
          <NumericInput
            value={store.entryPrice}
            onChange={store.setEntryPrice}
            step={tick}
            min={0}
            scrollable
            instrument={store.instrument}
            className="bg-transparent text-xl font-bold font-numbers text-foreground w-full outline-none mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-ns-resize touch-none"
          />
        </GlassCard>

        {/* Stop */}
        <GlassCard className="py-3 px-4">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Stop</Label>
          <NumericInput
            value={store.stopLoss}
            onChange={store.setStopLoss}
            step={tick}
            min={0}
            scrollable
            instrument={store.instrument}
            className="bg-transparent text-xl font-bold font-numbers text-destructive w-full outline-none mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-ns-resize touch-none"
          />
        </GlassCard>

        {/* Target */}
        <GlassCard className="py-3 px-4">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Target</Label>
          <NumericInput
            value={store.targetPrice}
            onChange={store.setTargetPrice}
            step={tick}
            min={0}
            scrollable
            instrument={store.instrument}
            className="bg-transparent text-xl font-bold font-numbers text-success w-full outline-none mt-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-ns-resize touch-none"
          />
        </GlassCard>

        {/* Win Rate */}
        <GlassCard className="py-3 px-4">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</Label>
          <div className="flex items-baseline gap-0.5 mt-2">
            <NumericInput
              value={store.winRate}
              onChange={(v) => store.setWinRate(Math.min(100, Math.max(0, v)))}
              step={1}
              min={0}
              max={100}
              className="bg-transparent text-xl font-bold font-numbers text-foreground w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-muted-foreground text-sm">%</span>
          </div>
        </GlassCard>
      </div>

      {/* Kelly Selector — subtle pill row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider shrink-0">Kelly</span>
        <div className="flex flex-1 rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--glass-border))' }}>
          {KELLY_OPTIONS.map(({ mode, label }, i) => {
            const active = kellyMode === mode;
            return (
              <motion.button
                key={mode}
                onClick={() => setKellyMode(mode)}
                className={`flex-1 py-1.5 text-xs font-semibold relative transition-colors duration-200 ${
                  active ? 'text-primary' : 'text-muted-foreground/50'
                } ${i > 0 ? 'border-l' : ''}`}
                style={i > 0 ? { borderColor: 'hsl(var(--glass-border))' } : {}}
                whileTap={{ scale: 0.92 }}
              >
                {active && (
                  <motion.div
                    layoutId="kelly-pill"
                    className="absolute inset-0 rounded-none"
                    style={{ background: 'hsl(var(--primary) / 0.08)' }}
                    transition={spring}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <GlassCard glow="primary" className="text-center py-8">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Suggested Position</p>
          <motion.div
            key={contracts}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-bold text-primary font-numbers"
          >
            <AnimatedNumber value={contracts} decimals={0} />
          </motion.div>
          <p className="text-sm text-muted-foreground mt-1">
            {contracts === 1 ? 'contract' : 'contracts'}
          </p>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t" style={{ borderColor: 'hsl(var(--glass-border))' }}>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Risk $</p>
              <p className="text-sm font-bold font-numbers text-destructive">
                <AnimatedNumber value={dollarRisk} prefix="$" decimals={0} />
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Return $</p>
              <p className="text-sm font-bold font-numbers text-success">
                <AnimatedNumber value={dollarReturn} prefix="$" decimals={0} />
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">R:R</p>
              <p className="text-sm font-bold font-numbers text-foreground">
                <AnimatedNumber value={result.rMultiple} decimals={1} suffix="R" />
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
