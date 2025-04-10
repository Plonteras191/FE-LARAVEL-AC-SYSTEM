import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    scale: 0.95,
    opacity: 0,
  },
  in: {
    scale: 1,
    opacity: 1,
  },
  out: {
    scale: 1.05,
    opacity: 0,
  },
};

const pageTransition = {
  duration: 0.5,
  ease: [0.43, 0.13, 0.23, 0.96], 
};

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
