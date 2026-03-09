import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { usePositionStore, type Instrument, INSTRUMENT_LABELS, POINT_VALUES } from '@/stores/calculatorStore';
import { calcPositionSize } from '@/lib/calculations';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

const instruments: Instrument[] = ['ES', 'MES', 'NQ', 'MNQ'];
type KellyMode = 'full' | 'half' | 'quarter' | 'off';

const KELLY_OPTIONS: { mode: KellyMode; label: string }[] = [
  { mode: 'full', label: 'Full' },
  { mode: 'half', label: '½' },
  { mode: 'quarter', label: '¼' },
  { mode: 'off', label: 'Off' },
];

// Tick size = minimum price movement per instrument
const TICK_SIZE: Record<Instrument, number> = {
  ES: 0.25,
  MES: 0.25,
  NQ: 0.25,
  MNQ: 0.25,
};

// Price display formatting: how many decimals to show for each instrument
const PRICE_DECIMALS: Record<Instrument, number> = {
  ES: 2,
  MES: 2,
  NQ: 2,
  MNQ: 2,
};

// Adaptive step tiers based on scroll velocity (px/ms → multiplier of tick)
// Slow = 1 tick, medium = 4 ticks (1pt), fast = 20 ticks (5pt), very fast = 100 ticks
function getAdaptiveSteps(velocity: number): number {
  if (velocity < 0.3) return 1;
  if (velocity < 1.0) return 4;
  if (velocity < 3.0) return 20;
  return 100;
}

const springFast = { type: 'spring' as const, stiffness: 480, damping: 32, mass: 0.6 };
const springNav = { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.8 };

interface PriceInputProps {
  value: number;
  onChange: (v: number) => void;
  instrument: Instrument;
  colorClass: string;
  label: string;
}

function PriceInput({ value, onChange, instrument, colorClass, label }: PriceInputProps) {
  const tick = TICK_SIZE[instrument];
  const decimals = PRICE_DECIMALS[instrument];
  const fmt = useCallback((v: number) => v.toFixed(decimals), [decimals]);

  const [raw, setRaw] = useState(fmt(value));
  const [focused, setFocused] = useState(false);
  const animVal = useMotionValue(value);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  const isAnimating = useRef(false);

  // Wheel velocity tracking
  const lastWheelTime = useRef<number>(0);
  const lastWheelDelta = useRef<number>(0);
  // Touch drag velocity
  const touchStartY = useRef<number>(0);
  const touchStartVal = useRef<number>(value);
  const touchLastY = useRef<number>(0);
  const touchLastTime = useRef<number>(0);

  // Sync display when value changes externally
  useEffect(() => {
    if (!focused && !isAnimating.current) {
      setRaw(fmt(value));
      animVal.set(value);
    }
  }, [value, focused, fmt, animVal]);

  const clamp = (v: number) => Math.max(0, v);

  const smoothTo = useCallback((next: number) => {
    isAnimating.current = true;
    if (animRef.current) animRef.current.stop();
    const clamped = clamp(next);
    animRef.current = animate(animVal, clamped, {
      type: 'spring',
      stiffness: 600,
      damping: 38,
      mass: 0.4,
      onUpdate: (v) => setRaw(v.toFixed(decimals)),
      onComplete: () => {
        isAnimating.current = false;
        setRaw(fmt(clamped));
      },
    });
    onChange(clamped);
  }, [animVal, decimals, fmt, onChange]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLInputElement>) => {
    e.preventDefault();
    const now = performance.now();
    const dt = now - lastWheelTime.current;
    // Velocity in px/ms (use abs deltaY)
    const rawDelta = Math.abs(e.deltaY);
    const velocity = dt > 0 ? rawDelta / dt : 0;
    lastWheelTime.current = now;
    lastWheelDelta.current = rawDelta;

    const steps = getAdaptiveSteps(velocity);
    const dir = e.deltaY < 0 ? 1 : -1;
    const next = parseFloat((value + dir * steps * tick).toFixed(4));
    smoothTo(next);
  }, [value, tick, smoothTo]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartVal.current = value;
    touchLastY.current = e.touches[0].clientY;
    touchLastTime.current = performance.now();
  }, [value]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLInputElement>) => {
    e.preventDefault();
    const y = e.touches[0].clientY;
    const now = performance.now();
    const dt = now - touchLastTime.current;
    const dy = touchLastY.current - y; // positive = finger moved up = price up

    // Velocity-based step (pixels per ms)
    const velocity = dt > 0 ? Math.abs(dy) / dt : 0;
    const steps = getAdaptiveSteps(velocity);

    // Accumulate from total drag for precision when slow
    const totalDy = touchStartY.current - y;
    const ticksFromTotal = totalDy / 6; // 6px per tick at minimum precision
    const adaptedDelta = Math.sign(ticksFromTotal) * Math.abs(ticksFromTotal) * steps * tick;
    const next = parseFloat((touchStartVal.current + adaptedDelta / steps).toFixed(4));

    touchLastY.current = y;
    touchLastTime.current = now;
    smoothTo(next);
  }, [tick, smoothTo]);

  const handleTouchEnd = useCallback(() => {
    touchStartY.current = 0;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRaw(v);
    const num = parseFloat(v);
    if (!isNaN(num)) onChange(clamp(num));
  };

  return (
    <GlassCard className="flex flex-col p-0 overflow-hidden">
      <div className="px-3 pt-2.5 pb-0">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</span>
      </div>
      <div className="flex-1 flex items-end px-3 pb-3 pt-1">
        <input
          type="number"
          inputMode="decimal"
          value={raw}
          step={tick}
          min={0}
          onChange={handleChange}
          onBlur={() => {
            setFocused(false);
            isAnimating.current = false;
            setRaw(fmt(value));
          }}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`bg-transparent font-bold font-numbers w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-ns-resize touch-none leading-none ${colorClass}`}
          style={{ fontSize: 'clamp(1.35rem, 5.5vw, 1.85rem)' }}
        />
      </div>
    </GlassCard>
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
    ? kellyMode === 'full'
      ? Math.max(0, Math.floor(store.balance * (result.kellyPercent / 100) / result.riskPerContract))
      : kellyMode === 'half'
      ? result.halfKellyContracts
      : kellyMode === 'quarter'
      ? result.quarterKellyContracts
      : 0
    : 0;

  const dollarRisk = result ? contracts * result.riskPerContract : 0;
  const dollarReturn = result ? contracts * result.rewardPoints * POINT_VALUES[store.instrument] : 0;

  return (
    <div className="space-y-4">
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
              transition={springNav}
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
                  transition={springNav}
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
      <GlassCard className="text-center py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1">Account Balance</p>
        <div className="relative inline-flex items-baseline gap-1">
          <span className="text-muted-foreground text-2xl font-light">$</span>
          <input
            type="number"
            inputMode="decimal"
            value={store.balance}
            min={0}
            onChange={(e) => store.setBalance(Math.max(0, Number(e.target.value)))}
            onFocus={(e) => e.target.select()}
            className="bg-transparent text-4xl font-bold font-numbers text-foreground text-center outline-none w-44 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </GlassCard>

      {/* Trade Price Inputs — 3 equal columns */}
      <div className="grid grid-cols-3 gap-2.5">
        <PriceInput
          value={store.entryPrice}
          onChange={store.setEntryPrice}
          instrument={store.instrument}
          colorClass="text-foreground"
          label="Entry"
        />
        <PriceInput
          value={store.stopLoss}
          onChange={store.setStopLoss}
          instrument={store.instrument}
          colorClass="text-destructive"
          label="Stop"
        />
        <PriceInput
          value={store.targetPrice}
          onChange={store.setTargetPrice}
          instrument={store.instrument}
          colorClass="text-success"
          label="Target"
        />
      </div>

      {/* Win Rate + Kelly — same row */}
      <div className="grid grid-cols-5 gap-2.5">
        {/* Win Rate */}
        <GlassCard className="col-span-2 flex flex-col p-0 overflow-hidden">
          <div className="px-3 pt-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">Win Rate</span>
          </div>
          <div className="flex-1 flex items-end px-3 pb-3 pt-1 gap-0.5">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              value={store.winRate}
              onChange={(e) => store.setWinRate(Math.min(100, Math.max(0, Number(e.target.value))))}
              onFocus={(e) => e.target.select()}
              className="bg-transparent font-bold font-numbers text-foreground w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none leading-none"
              style={{ fontSize: 'clamp(1.35rem, 5.5vw, 1.85rem)' }}
            />
            <span className="text-muted-foreground text-base font-semibold pb-0.5">%</span>
          </div>
        </GlassCard>

        {/* Kelly Selector */}
        <div className="col-span-3 flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 px-0.5">Kelly</span>
          <div
            className="flex flex-1 rounded-xl overflow-hidden"
            style={{ border: '1px solid hsl(var(--glass-border))', background: 'hsl(var(--glass-bg))' }}
          >
            {KELLY_OPTIONS.map(({ mode, label }, i) => {
              const active = kellyMode === mode;
              return (
                <motion.button
                  key={mode}
                  onClick={() => setKellyMode(mode)}
                  className={`flex-1 text-xs font-bold relative transition-colors duration-150 ${
                    active ? 'text-primary' : 'text-muted-foreground/40'
                  } ${i > 0 ? 'border-l' : ''}`}
                  style={i > 0 ? { borderColor: 'hsl(var(--glass-border))' } : {}}
                  whileTap={{ scale: 0.9 }}
                >
                  {active && (
                    <motion.div
                      layoutId="kelly-pill"
                      className="absolute inset-0"
                      style={{ background: 'hsl(var(--primary) / 0.1)' }}
                      transition={springFast}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <GlassCard glow="primary" className="text-center py-7">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">Suggested Position</p>
          <motion.div
            key={`${contracts}-${kellyMode}`}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springFast}
            className="text-6xl font-bold text-primary font-numbers"
          >
            <AnimatedNumber value={contracts} decimals={0} />
          </motion.div>
          <p className="text-sm text-muted-foreground mt-1">
            {contracts === 1 ? 'contract' : 'contracts'}
          </p>

          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t" style={{ borderColor: 'hsl(var(--glass-border))' }}>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1">Risk</p>
              <p className="text-sm font-bold font-numbers text-destructive">
                <AnimatedNumber value={dollarRisk} prefix="$" decimals={0} />
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1">Return</p>
              <p className="text-sm font-bold font-numbers text-success">
                <AnimatedNumber value={dollarReturn} prefix="$" decimals={0} />
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1">R:R</p>
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
