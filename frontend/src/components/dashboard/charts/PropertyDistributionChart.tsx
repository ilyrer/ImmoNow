import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface PropertyDistributionChartProps {
  propertyTypeData: { name: string; value: number }[];
}

// Professionelle Farbpalette für Dark Mode
const propertyTypeColors = [
  { 
    name: 'Häuser', 
    color: '#1e40af',
    darkColor: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
    darkGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
    shadowColor: 'rgba(30, 64, 175, 0.3)',
    darkShadowColor: 'rgba(59, 130, 246, 0.4)',
    hoverColor: '#2563eb',
    darkHoverColor: '#60a5fa'
  },
  { 
    name: 'Wohnungen', 
    color: '#475569',
    darkColor: '#64748b',
    gradient: 'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)', 
    darkGradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%)',
    shadowColor: 'rgba(71, 85, 105, 0.3)',
    darkShadowColor: 'rgba(100, 116, 139, 0.4)',
    hoverColor: '#64748b',
    darkHoverColor: '#94a3b8'
  },
  { 
    name: 'Grundstücke', 
    color: '#334155',
    darkColor: '#475569',
    gradient: 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)',
    darkGradient: 'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)',
    shadowColor: 'rgba(51, 65, 85, 0.3)', 
    darkShadowColor: 'rgba(71, 85, 105, 0.4)',
    hoverColor: '#475569',
    darkHoverColor: '#64748b'
  },
  { 
    name: 'Gewerbe', 
    color: '#0f172a',
    darkColor: '#1e293b',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    darkGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
    shadowColor: 'rgba(15, 23, 42, 0.4)',
    darkShadowColor: 'rgba(30, 41, 59, 0.4)',
    hoverColor: '#1e293b',
    darkHoverColor: '#334155'
  }
];

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900/95 backdrop-blur-md border border-blue-400/30 rounded-lg p-3 shadow-xl"
        style={{
          boxShadow: '0 15px 35px -8px rgba(0, 0, 0, 0.5), 0 5px 15px -5px rgba(59, 130, 246, 0.2)',
        }}
      >
        <p className="text-white font-medium text-sm mb-1">{entry.name}</p>
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-blue-300 text-sm font-semibold">{entry.value} Immobilien</span>
        </div>
        <p className="text-blue-200/80 text-xs mt-1">
          {((entry.value / payload.reduce((sum: number, p: any) => sum + p.value, 0)) * 100).toFixed(1)}%
        </p>
      </motion.div>
    );
  }
  return null;
};

// Animation Varianten
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      type: "spring",
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

export const PropertyDistributionChart: React.FC<PropertyDistributionChartProps> = ({ propertyTypeData }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  // Dark Mode Detection
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    // Observer für Dark Mode Changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Erweiterte Daten mit Farben
  const enhancedData = propertyTypeData.map(item => {
    const colorConfig = propertyTypeColors.find(c => c.name === item.name) || propertyTypeColors[0];
    return {
      ...item,
      color: isDarkMode ? colorConfig.darkColor : colorConfig.color,
      gradient: isDarkMode ? colorConfig.darkGradient : colorConfig.gradient,
      shadowColor: isDarkMode ? colorConfig.darkShadowColor : colorConfig.shadowColor,
      hoverColor: isDarkMode ? colorConfig.darkHoverColor : colorConfig.hoverColor
    };
  });

  const totalProperties = propertyTypeData.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.div
      className="relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        background: isDarkMode 
          ? "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(13,20,36,0.98) 100%)"
          : "linear-gradient(135deg, rgba(248,250,252,0.98) 0%, rgba(241,245,249,0.95) 100%)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
        borderRadius: '20px',
        boxShadow: isDarkMode
          ? "0 20px 40px -10px rgba(2,6,23,0.4), 0 8px 25px -5px rgba(59,130,246,0.1)"
          : "0 20px 40px -10px rgba(0,0,0,0.1), 0 8px 25px -5px rgba(59,130,246,0.08)"
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-blue-200/20 dark:border-blue-400/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm">
            <i className="ri-building-line text-white text-sm"></i>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Immobilienverteilung
            </h2>
            <p className="text-xs text-blue-600/90 dark:text-blue-300/90">
              Verteilung nach Immobilientypen
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-4">
        {/* Kreisdiagramm */}
        <motion.div 
          className="p-2 xl:p-3 xl:col-span-2 lg:col-span-2 flex flex-col items-center justify-center"
          variants={itemVariants}
          style={{
            background: isDarkMode 
              ? "radial-gradient(circle at center, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.8) 80%)"
              : "radial-gradient(circle at center, rgba(248,250,252,0.8) 0%, rgba(241,245,249,0.5) 80%)",
          }}
        >
          <div className="relative h-96 w-full">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full p-0.5 mb-1.5 backdrop-blur-sm">
                    <i className="ri-home-4-line text-sm text-blue-400"></i>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-blue-200 font-medium tracking-wide">Gesamt</p>
                  <p className="text-base font-bold text-white">{totalProperties}</p>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={enhancedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                  labelLine={false}
                  animationDuration={1500}
                  animationBegin={300}
                  strokeWidth={2}
                  stroke="#0f172a"
                  style={{ filter: 'drop-shadow(3px 5px 8px rgba(0,0,0,0.4))' }}
                >
                  {enhancedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{ 
                        cursor: 'pointer',
                        filter: 'brightness(1.15) drop-shadow(0px 3px 4px rgba(0,0,0,0.45))',
                        transition: 'all 0.3s ease'
                      }}
                      strokeWidth={1.5}
                    />
                  ))}
                </Pie>
                
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value, name) => [`${value} Immobilien`, name]}
                  contentStyle={{ 
                    backgroundColor: "rgba(17, 25, 40, 0.95)",
                    border: "1px solid rgba(99, 102, 241, 0.3)", 
                    borderRadius: "12px",
                    boxShadow: "0 15px 35px -8px rgba(0, 0, 0, 0.5)",
                    padding: "12px 16px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Kompakte Legende */}
          <div className="grid grid-cols-2 gap-1.5 mt-2 w-full px-2">
            {enhancedData.map((entry, index) => (
              <div key={index} className="flex flex-col items-center justify-center">
                <div className="flex items-center mb-0.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full mr-1" 
                    style={{ 
                      backgroundColor: entry.color,
                      boxShadow: `0 0 6px ${entry.color}`
                    }}
                  ></div>
                  <span className="text-xs font-medium" style={{ color: entry.color }}>
                    {entry.name === 'Wohnungen' ? 'Wohng.' : 
                     entry.name === 'Grundstücke' ? 'Grund.' : 
                     entry.name === 'Gewerbe' ? 'Gew.' : entry.name}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: entry.color }}>
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
          
        {/* Detaillierte Typ-Liste */}
        <motion.div 
          className="xl:col-span-3 lg:col-span-2 p-2 xl:p-3 border-t lg:border-t-0 lg:border-l border-[#2a304a]/60 bg-gradient-to-br from-[#1e2538] to-[#1a2032]"
          variants={itemVariants}
        >
          <h3 className="text-base font-semibold relative inline-block mb-3 ml-1">
            <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
              Detailverteilung
            </span>
            <div className="absolute -bottom-1.5 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/80 to-blue-500/0"></div>
          </h3>
          
          <div className="space-y-3">
            {enhancedData.map((entry, index) => {
              const percentage = ((entry.value / totalProperties) * 100);
              const isExpanded = expandedType === entry.name;
              
              return (
                <motion.div
                  key={entry.name}
                  className="group cursor-pointer"
                  onClick={() => setExpandedType(isExpanded ? null : entry.name)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className="p-3 rounded-xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${entry.color}15 0%, ${entry.color}08 100%)`,
                      boxShadow: `0 4px 15px -4px ${entry.shadowColor}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ 
                            background: entry.gradient,
                            boxShadow: `0 0 10px ${entry.shadowColor}`,
                          }}
                        />
                        <div>
                          <span className="text-white font-medium text-sm">{entry.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-blue-300 text-xs font-semibold">{entry.value} Objekte</span>
                            <span className="text-blue-400/70 text-xs">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-16 h-2 rounded-full bg-slate-700/50"
                          style={{ 
                            background: `linear-gradient(90deg, ${entry.color}40 0%, ${entry.color}20 ${percentage}%, transparent ${percentage}%)`
                          }}
                        />
                        <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line text-blue-400 text-sm transition-transform duration-300`}></i>
                      </div>
                    </div>
                    
                    {/* Erweiterte Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ 
                            opacity: 1, 
                            height: "auto", 
                            y: 0,
                            transition: {
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                              opacity: { duration: 0.2 }
                            }
                          }}
                          exit={{ 
                            opacity: 0, 
                            height: 0, 
                            y: -10,
                            transition: {
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                              opacity: { duration: 0.15 }
                            }
                          }}
                          className="mt-3 pt-3 border-t border-blue-400/20"
                        >
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-slate-800/30 p-2 rounded-lg text-center">
                              <div className="text-xs text-blue-300">Anteil</div>
                              <div className="text-sm font-bold text-white">{percentage.toFixed(1)}%</div>
                            </div>
                            <div className="bg-slate-800/30 p-2 rounded-lg text-center">
                              <div className="text-xs text-blue-300">Anzahl</div>
                              <div className="text-sm font-bold text-white">{entry.value}</div>
                            </div>
                            <div className="bg-slate-800/30 p-2 rounded-lg text-center">
                              <div className="text-xs text-blue-300">Rang</div>
                              <div className="text-sm font-bold text-white">#{index + 1}</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PropertyDistributionChart;
