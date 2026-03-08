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
    >
      <nav
        className="relative overflow-hidden rounded-[22px] px-1.5 py-2 bg-card border border-border shadow-lg"
      >
        <div className="flex items-center justify-around relative">
          {/* Sliding active pill */}
          {activeIndex >= 0 && (
            <motion.div
              layoutId="active-pill"
              className="absolute rounded-xl pointer-events-none bg-secondary"
              style={{
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
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl"
              >
                <tab.icon
                  size={21}
                  strokeWidth={active ? 2.2 : 1.5}
                  className={`transition-colors duration-200 ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`text-[10px] font-semibold transition-colors duration-200 ${
                    active ? 'text-primary' : 'text-muted-foreground'
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
  );
}
