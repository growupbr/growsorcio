// Card with mouse-tracking glow border effect - huly.io style
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(255, 69, 0, 0.15)',
  ...props
}) {
  const ref = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e) {
    const rect = ref.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur ${className}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      {...props}
    >
      {/* Mouse-follow glow */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 60%)`,
          }}
        />
      )}
      {/* Border glow */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl"
          style={{
            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,69,0,0.3), transparent 50%)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'xor',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
