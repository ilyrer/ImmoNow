import React from 'react';

const TopProgressBar = ({ active = false }) => {
  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-[100]">
      <div className={`h-0.5 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-500 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`h-full bg-white/60 mix-blend-overlay w-1/3 animate-progress-bar`}></div>
      </div>
      <style>{`
        @keyframes progressBarMove { 
          0% { transform: translateX(-100%); } 
          100% { transform: translateX(400%); } 
        }
        .animate-progress-bar { 
          animation: progressBarMove 1.4s ease-in-out infinite; 
        }
      `}</style>
    </div>
  );
};

export default TopProgressBar;
