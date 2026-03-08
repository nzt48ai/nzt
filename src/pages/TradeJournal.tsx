import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { BookOpen } from 'lucide-react';

export default function TradeJournal() {
  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-xl font-bold text-gradient">Trade Journal</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Log and review your trades</p>
      </motion.div>
      <GlassCard className="flex flex-col items-center py-12">
        <BookOpen size={48} className="text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Trade logging coming soon</p>
        <p className="text-xs text-muted-foreground mt-1">Manual entry, CSV import & broker sync</p>
      </GlassCard>
    </div>
  );
}
