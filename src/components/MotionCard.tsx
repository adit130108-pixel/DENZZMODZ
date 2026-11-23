import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface MotionCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

export function MotionCard({ children, index = 0, className = '' }: MotionCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.42,
        delay: Math.min(index * 0.06, 0.24),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
      }}
      className={`rounded-2xl border border-[#2B1E4A] bg-[#130D21] transition-colors duration-200 hover:border-violet-500/60 ${className}`}
    >
      {children}
    </motion.article>
  );
}
