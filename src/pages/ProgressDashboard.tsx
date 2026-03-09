import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { BarChart3 } from 'lucide-react';

export default function ProgressDashboard() {
  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-xl font-bold text-gradient">Dashboard</h1>
      </motion.div>
      <GlassCard className="flex flex-col items-center py-12">
        <BarChart3 size={48} className="text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Analytics dashboard coming soon</p>
        <p className="text-xs text-muted-foreground mt-1">Equity curve, win rate, profit factor</p>
      </GlassCard>
    </div>
  );
}
