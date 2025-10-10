import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SuccessOverlay = ({ show = false, message = 'Willkommen!' }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }} className="relative bg-white rounded-3xl shadow-2xl px-10 py-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
              <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{message}</h3>
            <p className="text-sm text-gray-600">Sie werden jetzt weitergeleitet…</p>
          </motion.div>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <span key={i} className="absolute block w-1 h-6 rounded-full bg-gradient-to-b from-fuchsia-400 to-violet-600 opacity-70" style={{ left: `${(i*3.3)%100}%`, top: '-24px', transform: `rotate(${(i*37)%360}deg)`, animation: `drop 1200ms ${(i*40)%800}ms linear infinite` }} />
            ))}
          </div>
          <style jsx>{`
            @keyframes drop { to { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SuccessOverlay;
