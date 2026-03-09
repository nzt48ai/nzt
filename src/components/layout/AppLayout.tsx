import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { ThemeToggle } from '../ui/ThemeToggle';
import { motion } from 'framer-motion';
import BackgroundFX from '../ui/BackgroundFX';

export default function AppLayout() {
  return (
    <div className="min-h-screen gradient-bg transition-colors duration-300 relative">
      <BackgroundFX />

      {/* Top bar with theme toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed top-3 right-4 z-50"
      >
        <ThemeToggle />
      </motion.div>

      <main className="pb-20 px-4 pt-4 max-w-lg mx-auto relative z-10">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
