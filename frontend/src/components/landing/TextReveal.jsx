// Word-by-word text reveal animation - huly.io style
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: (staggerDelay = 0.06) => ({
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  }),
};

const wordVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function TextReveal({
  text,
  className = '',
  as: Tag = 'h1',
  stagger = 0.06,
  highlight = [],
  highlightClass = 'text-[#FF4500]',
}) {
  const words = text.split(' ');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      custom={stagger}
      className={className}
    >
      <Tag className={className}>
        {words.map((word, i) => (
          <motion.span
            key={`${word}-${i}`}
            variants={wordVariants}
            className={`inline-block mr-[0.3em] ${highlight.includes(word) ? highlightClass : ''}`}
          >
            {word}
          </motion.span>
        ))}
      </Tag>
    </motion.div>
  );
}
