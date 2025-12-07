import React from 'react';
import { motion } from 'framer-motion';

const AuroraBackgroundClean = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Sharp, clean gradient - NO BLUR AT ALL */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4c1d95 50%, #7c2d92 75%, #be185d 100%)'
        }}
      />
      
      {/* Subtle color variations - NO BLUR */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(168,85,247,0.05) 0%, transparent 60%)',
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 70% 80%, rgba(236,72,153,0.04) 0%, transparent 60%)',
        }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4
        }}
      />

      {/* Elegant floating elements instead of particles */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute opacity-10"
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, rgba(168,85,247,0.1) 0%, transparent 70%)`,
            left: `${15 + i * 35}%`,
            top: `${20 + i * 25}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 3,
          }}
        />
      ))}
    </div>
  );
};

export default AuroraBackgroundClean;
