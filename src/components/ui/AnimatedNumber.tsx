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
  // We format the raw number with commas if there's no suffix
  // Only normalize the value depending on suffix if it hasn't been pre-normalized
  const normalizedValue = suffix === 'M' ? value / 1_000_000 : suffix === 'k' ? value / 1_000 : value;

  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  
  const formatNumber = (v: number) => {
    if (suffix === '') {
      return `${prefix}${Math.floor(v).toLocaleString()}${suffix}`;
    }
    return `${prefix}${v.toFixed(decimals)}${suffix}`;
  };
  
  const display = useTransform(spring, formatNumber);
  const [displayText, setDisplayText] = useState(formatNumber(normalizedValue));

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
