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

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <nav
        className="rounded-[22px] border border-white/[0.12] px-2 py-2.5"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          backdropFilter: 'blur(40px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
              >
                {active && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <tab.icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.6}
                  className={`relative z-10 transition-colors ${active ? 'text-primary' : 'text-white/40'}`}
                />
                <span
                  className={`relative z-10 text-[10px] font-semibold transition-colors ${
                    active ? 'text-primary' : 'text-white/35'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
