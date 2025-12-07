import React from 'react';
import { motion } from 'framer-motion';

const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Clean gradient base - NO BLUR */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4c1d95 50%, #7c2d92 75%, #be185d 100%)'
        }}
      />
      
      {/* Subtle animated gradients - MINIMAL BLUR */}
      <motion.div
        className="absolute w-full h-full"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(168,85,247,0.1) 0%, transparent 50%)',
          filter: 'blur(2px)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute w-full h-full"
        style={{
          background: 'radial-gradient(circle at 70% 80%, rgba(236,72,153,0.08) 0%, transparent 50%)',
          filter: 'blur(2px)',
        }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Small floating particles - NO BLUR */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: `rgba(${i % 2 === 0 ? '168,85,247' : '236,72,153'}, 0.6)`,
            left: `${30 + i * 20}%`,
            top: `${40 + i * 15}%`,
          }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}
    </div>
  );
};

export default AuroraBackground;
