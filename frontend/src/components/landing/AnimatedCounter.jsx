// Animated number counter - counts up when in viewport
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

export default function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  duration = 1.5,
  className = '',
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const [display, setDisplay] = useState(0);

  // Parse numeric value from string like "2 min", "87%", "21x"
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10) || 0;
  const textSuffix = typeof value === 'string' ? value.replace(/[\d.]+/, '') : suffix;

  useEffect(() => {
    if (!isInView) return;

    const start = 0;
    const end = numericValue;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [isInView, numericValue, duration]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {prefix}{display}{textSuffix || suffix}
    </motion.span>
  );
}
