import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 2, className = '' }: AnimatedNumberProps) {
  // Normalize the value depending on suffix if it hasn't been pre-normalized
  const normalizedValue = suffix === 'M' ? value / 1_000_000 : suffix === 'k' ? value / 1_000 : value;

  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);
  const [displayText, setDisplayText] = useState(`${prefix}${normalizedValue.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    spring.set(normalizedValue);
  }, [normalizedValue, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayText(v));
    return unsubscribe;
  }, [display]);

  return (
    <motion.span className={`font-numbers ${className}`}>
      {displayText}
    </motion.span>
  );
}
