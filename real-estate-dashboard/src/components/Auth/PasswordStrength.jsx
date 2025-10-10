import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

function estimateStrength(pw) {
  if (!pw) return { score: 0, label: 'Very Weak', hints: ['Min. 8 characters'], color: 'from-red-500 to-red-600' };
  const length = pw.length;
  const lowers = /[a-z]/.test(pw);
  const uppers = /[A-Z]/.test(pw);
  const digits = /\d/.test(pw);
  const symbols = /[^A-Za-z0-9]/.test(pw);
  let score = 0;
  if (length >= 8) score++;
  if (length >= 12) score++;
  if (lowers && uppers) score++;
  if (digits) score++;
  if (symbols) score++;
  
  const configs = [
    { label: 'Very Weak', color: 'from-red-500 to-red-600', textColor: 'text-red-400' },
    { label: 'Weak', color: 'from-orange-500 to-orange-600', textColor: 'text-orange-400' },
    { label: 'Fair', color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-400' },
    { label: 'Good', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-400' },
    { label: 'Excellent', color: 'from-green-500 to-green-600', textColor: 'text-green-400' },
  ];
  
  const idx = Math.min(configs.length - 1, Math.max(0, score - 1));
  const hints = [];
  if (length < 12) hints.push('Length ≥ 12');
  if (!(lowers && uppers)) hints.push('Upper & lowercase');
  if (!digits) hints.push('Add numbers');
  if (!symbols) hints.push('Add symbols');
  
  return { 
    score, 
    label: configs[idx].label, 
    color: configs[idx].color,
    textColor: configs[idx].textColor,
    hints 
  };
}

const PasswordStrength = ({ value }) => {
  const { score, label, hints, color, textColor } = useMemo(() => estimateStrength(value), [value]);
  const percent = Math.min(100, (score / 5) * 100);
  
  return (
    <motion.div 
      className="mt-3"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
    >
      {/* Premium Progress Bar */}
      <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div 
          className={`h-full bg-gradient-to-r ${color} relative`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            animate={{ x: [-100, 200] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
      
      {/* Enhanced Labels */}
      <div className="mt-2 flex items-center justify-between">
        <motion.div 
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${color}`} />
          <span className={`text-sm font-medium ${textColor}`}>
            Strength: {label}
          </span>
        </motion.div>
        
        {hints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-purple-300/60 max-w-xs text-right"
          >
            Tips: {hints.slice(0, 2).join(' · ')}
          </motion.div>
        )}
      </div>

      {/* Requirement Indicators */}
      {value && (
        <motion.div 
          className="mt-3 grid grid-cols-2 gap-2 text-xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { check: value.length >= 8, text: '8+ characters' },
            { check: /[A-Z]/.test(value) && /[a-z]/.test(value), text: 'Upper & lower' },
            { check: /\d/.test(value), text: 'Numbers' },
            { check: /[^A-Za-z0-9]/.test(value), text: 'Special chars' }
          ].map((req, index) => (
            <motion.div
              key={req.text}
              className={`flex items-center space-x-2 ${req.check ? 'text-green-400' : 'text-purple-300/50'}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                req.check ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5 border border-white/20'
              }`}>
                {req.check && (
                  <motion.svg 
                    className="w-2 h-2 text-green-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </motion.svg>
                )}
              </div>
              <span>{req.text}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PasswordStrength;
