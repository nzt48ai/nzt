import { motion } from 'framer-motion';
import GlassCard from '@/components/ui/GlassCard';
import { Share2 } from 'lucide-react';

export default function ShareCard() {
  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-xl font-bold text-gradient">Share Card</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Generate shareable trade cards</p>
      </motion.div>
      <GlassCard className="flex flex-col items-center py-12">
        <Share2 size={48} className="text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Share cards coming soon</p>
        <p className="text-xs text-muted-foreground mt-1">Export premium trade cards for social media</p>
      </GlassCard>
    </div>
  );
}
