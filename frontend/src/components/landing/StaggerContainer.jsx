// Stagger container for child elements appearing in sequence
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: {},
  visible: (stagger = 0.1) => ({
    transition: {
      staggerChildren: stagger,
      delayChildren: 0.1,
    },
  }),
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function StaggerContainer({
  children,
  className = '',
  stagger = 0.1,
  as = 'div',
  ...props
}) {
  const Component = motion[as] || motion.div;

  return (
    <Component
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      custom={stagger}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}
