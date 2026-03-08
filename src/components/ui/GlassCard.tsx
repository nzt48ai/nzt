import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  glow?: 'primary' | 'accent' | 'none';
}

export default function GlassCard({ className, glow = 'none', children, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'glass-card p-4',
        glow === 'primary' && 'glow-primary',
        glow === 'accent' && 'glow-accent',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
