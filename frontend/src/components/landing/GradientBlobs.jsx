// Animated gradient orbs - huly.io style floating blobs
import { motion } from 'framer-motion';

export default function GradientBlobs({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Primary orange blob */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(circle, #FF4500 0%, transparent 70%)',
          top: '-10%',
          left: '10%',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Secondary purple blob */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
        style={{
          background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)',
          top: '30%',
          right: '-5%',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -60, 30, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Accent blue blob */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
          bottom: '10%',
          left: '30%',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 50, -60, 0],
          y: [0, -40, 60, 0],
          scale: [1, 1.2, 0.85, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
