import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, TrendingUp, BookOpen, BarChart3, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';

const tabs = [
  { path: '/', icon: Calculator, label: 'Position' },
  { path: '/compound', icon: TrendingUp, label: 'Compound' },
  { path: '/journal', icon: BookOpen, label: 'Journal' },
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { path: '/share', icon: Share2, label: 'Share' },
];

// SwiftUI-style spring config
const swiftSpring = { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.8 };
const gentleSpring = { type: 'spring' as const, stiffness: 260, damping: 24, mass: 1 };

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hold-and-slide state
  const [holding, setHolding] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const getTabIndexFromPosition = useCallback((clientX: number) => {
    for (let i = 0; i < tabRefs.current.length; i++) {
      const el = tabRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return i;
    }
    return -1;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const idx = getTabIndexFromPosition(touch.clientX);
    holdTimer.current = setTimeout(() => {
      setHolding(true);
      setHoveredIndex(idx);
      if (navigator.vibrate) navigator.vibrate(10);
    }, 300);
  }, [getTabIndexFromPosition]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!holding) {
      if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
      return;
    }
    const touch = e.touches[0];
    const idx = getTabIndexFromPosition(touch.clientX);
    if (idx !== -1 && idx !== hoveredIndex) {
      setHoveredIndex(idx);
      if (navigator.vibrate) navigator.vibrate(5);
    }
  }, [holding, hoveredIndex, getTabIndexFromPosition]);

  const onTouchEnd = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (holding && hoveredIndex >= 0) navigate(tabs[hoveredIndex].path);
    setHolding(false);
    setHoveredIndex(-1);
  }, [holding, hoveredIndex, navigate]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const idx = getTabIndexFromPosition(e.clientX);
    holdTimer.current = setTimeout(() => {
      setHolding(true);
      setHoveredIndex(idx);
    }, 300);
  }, [getTabIndexFromPosition]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!holding) return;
    const idx = getTabIndexFromPosition(e.clientX);
    if (idx !== -1 && idx !== hoveredIndex) setHoveredIndex(idx);
  }, [holding, hoveredIndex, getTabIndexFromPosition]);

  const onMouseUp = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (holding && hoveredIndex >= 0) navigate(tabs[hoveredIndex].path);
    setHolding(false);
    setHoveredIndex(-1);
  }, [holding, hoveredIndex, navigate]);

  const onMouseLeave = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (holding) { setHolding(false); setHoveredIndex(-1); }
  }, [holding]);

  const activeIndex = tabs.findIndex(t => t.path === location.pathname);

  return (
    <>
      {/* Overlay when holding */}
      <AnimatePresence>
        {holding && (
          <motion.div
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          />
        )}
      </AnimatePresence>

      {/* Floating tooltip when holding */}
      <AnimatePresence>
        {holding && hoveredIndex >= 0 && (
          <motion.div
            key={hoveredIndex}
            className="fixed z-[70] pointer-events-none left-1/2"
            initial={{ opacity: 0, scale: 0.5, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 16 }}
            transition={swiftSpring}
            style={{ bottom: 96, transform: 'translateX(-50%)' }}
          >
            <div
              className="px-5 py-3 rounded-2xl flex flex-col items-center gap-1.5"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(80px) saturate(2.2)',
                WebkitBackdropFilter: 'blur(80px) saturate(2.2)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {(() => {
                const Tab = tabs[hoveredIndex];
                return (
                  <>
                    <Tab.icon size={28} strokeWidth={2} className="text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
                    <span className="text-sm font-semibold text-foreground">{Tab.label}</span>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent bottom nav */}
      <motion.div
        ref={navRef}
        className="fixed bottom-4 left-1/2 z-[65] w-[calc(100%-2rem)] max-w-md select-none"
        style={{ x: '-50%' }}
        animate={holding ? { scale: 1.06 } : { scale: 1 }}
        transition={swiftSpring}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {/* Liquid Glass shell */}
        <nav
          className="relative overflow-hidden rounded-[22px] px-1.5 py-2"
          style={{
            background: holding
              ? 'linear-gradient(145deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 100%)'
              : 'linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: holding ? 'blur(80px) saturate(2.2)' : 'blur(50px) saturate(1.9)',
            WebkitBackdropFilter: holding ? 'blur(80px) saturate(2.2)' : 'blur(50px) saturate(1.9)',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: holding
              ? '0 16px 56px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -0.5px 0 rgba(255,255,255,0.06)'
              : '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -0.5px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Specular highlight — top edge shine */}
          <div
            className="absolute top-0 left-[10%] right-[10%] h-[1px] pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            }}
          />

          <div className="flex items-center justify-around relative">
          {/* SwiftUI-style sliding active pill */}
            {!holding && activeIndex >= 0 && (
              <motion.div
                layoutId="active-pill"
                className="absolute rounded-xl pointer-events-none"
                style={{
                  width: `${100 / tabs.length}%`,
                  left: `${(activeIndex / tabs.length) * 100}%`,
                  top: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                  boxShadow: '0 0 24px hsl(var(--primary) / 0.12), inset 0 0.5px 0 rgba(255,255,255,0.1)',
                }}
                transition={swiftSpring}
              />
            )}

            {/* Hold-mode sliding highlight */}
            {holding && hoveredIndex >= 0 && (
              <motion.div
                layoutId="hold-pill"
                className="absolute rounded-xl pointer-events-none"
                style={{
                  width: `${100 / tabs.length}%`,
                  left: `${(hoveredIndex / tabs.length) * 100}%`,
                  top: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                  boxShadow: '0 0 28px hsl(var(--primary) / 0.2), inset 0 0.5px 0 rgba(255,255,255,0.14)',
                }}
                transition={swiftSpring}
              />
            )}

            {tabs.map((tab, i) => {
              const active = !holding && activeIndex === i;
              const hovered = holding && hoveredIndex === i;

              return (
                <button
                  key={tab.path}
                  ref={(el) => { tabRefs.current[i] = el; }}
                  onClick={() => { if (!holding) navigate(tab.path); }}
                  className="relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl touch-none"
                >
                  <motion.div
                    animate={{
                      scale: hovered ? 1.3 : active ? 1.05 : 1,
                      y: hovered ? -6 : 0,
                    }}
                    transition={hovered ? swiftSpring : gentleSpring}
                    className="relative z-10"
                  >
                    <tab.icon
                      size={21}
                      strokeWidth={hovered ? 2.4 : active ? 2.2 : 1.5}
                      className={`transition-colors duration-200 ${
                        hovered || active
                          ? 'text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]'
                          : 'text-muted-foreground/60'
                      }`}
                    />
                  </motion.div>
                  <motion.span
                    animate={{
                      scale: hovered ? 1.1 : 1,
                      opacity: hovered || active ? 1 : 0.45,
                    }}
                    transition={gentleSpring}
                    className={`relative z-10 text-[10px] font-semibold ${
                      hovered || active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {tab.label}
                  </motion.span>

                  {/* Active dot indicator */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={swiftSpring}
                        className="absolute -top-0.5 w-1 h-1 rounded-full bg-primary"
                        style={{ boxShadow: '0 0 6px hsl(var(--primary) / 0.6)' }}
                      />
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </nav>
      </motion.div>
    </>
  );
}
