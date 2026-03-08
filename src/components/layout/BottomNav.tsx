import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, TrendingUp, BookOpen, BarChart3, Share2 } from 'lucide-react';
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';

const tabs = [
  { path: '/', icon: Calculator, label: 'Position' },
  { path: '/compound', icon: TrendingUp, label: 'Compound' },
  { path: '/journal', icon: BookOpen, label: 'Journal' },
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { path: '/share', icon: Share2, label: 'Share' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const controls = useAnimationControls();
  const lastScrollY = useRef(0);
  const [visible, setVisible] = useState(true);

  // Hold-and-slide state
  const [holding, setHolding] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Scroll hide/show
  useEffect(() => {
    const threshold = 10;
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;
      if (delta > threshold && visible) setVisible(false);
      else if (delta < -threshold && !visible) setVisible(true);
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [visible]);

  useEffect(() => {
    controls.start(visible ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 });
  }, [visible, controls]);

  const getTabIndexFromPosition = useCallback((clientX: number) => {
    for (let i = 0; i < tabRefs.current.length; i++) {
      const el = tabRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return i;
    }
    return -1;
  }, []);

  // Touch handlers for hold-and-slide
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const idx = getTabIndexFromPosition(touch.clientX);

    holdTimer.current = setTimeout(() => {
      setHolding(true);
      setHoveredIndex(idx);
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(10);
    }, 300);
  }, [getTabIndexFromPosition]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!holding) {
      // Cancel hold if moved before activation
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
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
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (holding && hoveredIndex >= 0) {
      navigate(tabs[hoveredIndex].path);
    }
    setHolding(false);
    setHoveredIndex(-1);
  }, [holding, hoveredIndex, navigate]);

  // Mouse fallback for desktop
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
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (holding && hoveredIndex >= 0) {
      navigate(tabs[hoveredIndex].path);
    }
    setHolding(false);
    setHoveredIndex(-1);
  }, [holding, hoveredIndex, navigate]);

  const onMouseLeave = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (holding) {
      setHolding(false);
      setHoveredIndex(-1);
    }
  }, [holding]);

  return (
    <>
      {/* Expanded glass overlay when holding */}
      <AnimatePresence>
        {holding && (
          <motion.div
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          />
        )}
      </AnimatePresence>

      {/* Expanded label tooltip */}
      <AnimatePresence>
        {holding && hoveredIndex >= 0 && (
          <motion.div
            key={hoveredIndex}
            className="fixed z-[70] pointer-events-none"
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            style={{
              bottom: 90,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className="px-5 py-3 rounded-2xl border border-white/[0.15] text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
                backdropFilter: 'blur(60px) saturate(2)',
                WebkitBackdropFilter: 'blur(60px) saturate(2)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {(() => {
                const Tab = tabs[hoveredIndex];
                return (
                  <div className="flex flex-col items-center gap-1.5">
                    <Tab.icon size={28} strokeWidth={2} className="text-primary" />
                    <span className="text-sm font-semibold text-foreground">{Tab.label}</span>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main nav bar */}
      <motion.div
        ref={navRef}
        className="fixed bottom-4 left-1/2 z-[65] w-[calc(100%-2rem)] max-w-md select-none"
        style={{ x: '-50%' }}
        initial={{ y: 0, opacity: 1 }}
        animate={holding
          ? { y: 0, opacity: 1, scale: 1.05 }
          : visible
            ? { y: 0, opacity: 1, scale: 1 }
            : { y: 80, opacity: 0, scale: 1 }
        }
        transition={holding
          ? { type: 'spring', stiffness: 400, damping: 25 }
          : { type: 'spring', stiffness: 400, damping: 32 }
        }
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <nav
          className="rounded-[22px] border px-2 py-2.5 transition-colors duration-200"
          style={{
            borderColor: holding ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.12)',
            background: holding
              ? 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
            backdropFilter: holding ? 'blur(60px) saturate(2)' : 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: holding ? 'blur(60px) saturate(2)' : 'blur(40px) saturate(1.8)',
            boxShadow: holding
              ? '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)'
              : '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-around">
            {tabs.map((tab, i) => {
              const active = !holding && location.pathname === tab.path;
              const hovered = holding && hoveredIndex === i;

              return (
                <button
                  key={tab.path}
                  ref={(el) => { tabRefs.current[i] = el; }}
                  onClick={() => {
                    if (!holding) navigate(tab.path);
                  }}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all touch-none"
                >
                  {/* Active indicator (normal mode) */}
                  {active && !holding && (
                    <motion.div
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}

                  {/* Hovered indicator (hold mode) */}
                  {hovered && (
                    <motion.div
                      layoutId="hold-highlight"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        boxShadow: '0 0 20px rgba(79, 255, 120, 0.15)',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  <motion.div
                    animate={{
                      scale: hovered ? 1.25 : 1,
                      y: hovered ? -4 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="relative z-10"
                  >
                    <tab.icon
                      size={22}
                      strokeWidth={hovered ? 2.4 : active ? 2.2 : 1.6}
                      className={`transition-colors duration-150 ${
                        hovered ? 'text-primary' : active ? 'text-primary' : 'text-white/40'
                      }`}
                    />
                  </motion.div>
                  <span
                    className={`relative z-10 text-[10px] font-semibold transition-all duration-150 ${
                      hovered ? 'text-primary' : active ? 'text-primary' : 'text-white/35'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </motion.div>
    </>
  );
}
