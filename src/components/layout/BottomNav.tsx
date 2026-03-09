import { useLocation, useNavigate } from 'react-router-dom';
import { Calculator, TrendingUp, BookOpen, BarChart3, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/', icon: Calculator, label: 'Position' },
  { path: '/compound', icon: TrendingUp, label: 'Compound' },
  { path: '/journal', icon: BookOpen, label: 'Journal' },
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { path: '/share', icon: Share2, label: 'Share' },
];

const spring = { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.8 };

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeIndex = tabs.findIndex(t => t.path === location.pathname);

  return (
    <motion.div
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md select-none"
      style={{ x: '-50%' }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
    >
      <nav
        className="relative overflow-hidden rounded-[22px] px-1.5 py-2 transition-colors duration-300"
        style={{
          background: 'hsl(var(--glass-bg))',
          border: '1px solid hsl(var(--glass-border))',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          boxShadow:
            '0 8px 40px hsl(220 30% 10% / 0.15), 0 2px 10px hsl(220 30% 10% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.5), inset 0 -1px 0 hsl(0 0% 100% / 0.05)',
        }}
      >
        <div className="flex items-center justify-around relative">
          {/* Sliding active pill with glow */}
          {activeIndex >= 0 && (
            <motion.div
              layoutId="active-pill"
              className="absolute rounded-xl pointer-events-none"
              style={{
                background: 'hsl(var(--primary) / 0.12)',
                border: '1px solid hsl(var(--primary) / 0.25)',
                boxShadow: '0 0 16px hsl(var(--primary) / 0.2), 0 0 4px hsl(var(--primary) / 0.1)',
                width: `${100 / tabs.length}%`,
                left: `${(activeIndex / tabs.length) * 100}%`,
                top: 0,
                bottom: 0,
              }}
              transition={spring}
            />
          )}

          {tabs.map((tab, i) => {
            const active = activeIndex === i;
            return (
              <motion.button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl"
                whileTap={{ scale: 0.82, transition: { duration: 0.08 } }}
                whileHover={{ scale: 1.08, transition: { type: 'spring', stiffness: 400, damping: 18 } }}
              >
                <motion.div
                  animate={active ? { scale: 1.18, filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.5))' } : { scale: 1, filter: 'drop-shadow(0 0 0px transparent)' }}
                  transition={spring}
                >
                  <tab.icon
                    size={21}
                    strokeWidth={active ? 2.3 : 1.5}
                    className={`transition-colors duration-200 ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </motion.div>
                <span
                  className={`text-[10px] font-semibold transition-colors duration-200 ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </motion.div>
  );
}
