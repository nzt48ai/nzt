import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  glow?: 'primary' | 'accent' | 'none';
  interactive?: boolean;
}

export default function GlassCard({ className, glow = 'none', interactive = false, children, ...props }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={interactive ? { y: -2, scale: 1.01, transition: { duration: 0.18, ease: 'easeOut' } } : undefined}
      whileTap={interactive ? { scale: 0.98, transition: { duration: 0.1 } } : undefined}
      className={cn(
        'glass-card p-4 transition-shadow duration-200',
        glow === 'primary' && 'glow-primary',
        glow === 'accent' && 'glow-accent',
        interactive && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
