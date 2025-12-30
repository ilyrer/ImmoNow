import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, RadialBarChart, RadialBar } from 'recharts';
import { useProperties, useDashboardAnalytics } from '../../../hooks/useApi';
import { ProjectTimeRange } from '../../../api';

interface ProjectStatusOverviewProps {
  timeRange: ProjectTimeRange;
  teamFilter: string;
}

const ProjectStatusOverview: React.FC<ProjectStatusOverviewProps> = ({ timeRange, teamFilter }) => {
  // API Hooks
  const { data: propertiesData, isLoading: propertiesLoading, error: propertiesError } = useProperties();
  const { data: analyticsData } = useDashboardAnalytics();
  
  // State
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Transform properties data to project status
  const projectStatusData = useMemo(() => {
    if (!propertiesData || !Array.isArray(propertiesData)) {
      return [
        { name: 'Auf Kurs', value: 0, color: '#1e40af', darkColor: '#3b82f6', gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)', darkGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)', shadowColor: 'rgba(30, 64, 175, 0.3)', darkShadowColor: 'rgba(59, 130, 246, 0.4)', hoverColor: '#2563eb', darkHoverColor: '#60a5fa' },
        { name: 'Risiko', value: 0, color: '#475569', darkColor: '#64748b', gradient: 'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)', darkGradient: 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%)', shadowColor: 'rgba(71, 85, 105, 0.3)', darkShadowColor: 'rgba(100, 116, 139, 0.4)', hoverColor: '#64748b', darkHoverColor: '#94a3b8' },
        { name: 'Verzögerung', value: 0, color: '#334155', darkColor: '#475569', gradient: 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)', darkGradient: 'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)', shadowColor: 'rgba(51, 65, 85, 0.3)', darkShadowColor: 'rgba(71, 85, 105, 0.4)', hoverColor: '#475569', darkHoverColor: '#64748b' },
        { name: 'Erledigt', value: 0, color: '#0f172a', darkColor: '#1e293b', gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)', darkGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)', shadowColor: 'rgba(15, 23, 42, 0.3)', darkShadowColor: 'rgba(30, 41, 59, 0.5)', hoverColor: '#1e293b', darkHoverColor: '#334155' }
      ];
    }

    // Calculate project status based on property data
    const activeProperties = propertiesData.filter(p => p.status === 'aktiv');
    const soldProperties = propertiesData.filter(p => p.status === 'verkauft');
    const reservedProperties = propertiesData.filter(p => p.status === 'reserviert');
    const availableProperties = propertiesData.filter(p => p.status === 'vorbereitung');

    return [
      { 
        name: 'Auf Kurs', 
        value: activeProperties.length + availableProperties.length, 
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
        name: 'Risiko', 
        value: reservedProperties.length, 
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
        name: 'Verzögerung', 
        value: Math.floor(activeProperties.length * 0.1), // 10% as delayed
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
        name: 'Erledigt', 
        value: soldProperties.length, 
        color: '#0f172a',
        darkColor: '#1e293b',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        darkGradient: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        shadowColor: 'rgba(15, 23, 42, 0.3)',
        darkShadowColor: 'rgba(30, 41, 59, 0.5)',
        hoverColor: '#1e293b',
        darkHoverColor: '#334155'
      }
    ];
  }, [propertiesData]);

  // Transform properties by type
  const propertyTypes = useMemo(() => {
    if (!propertiesData || !Array.isArray(propertiesData)) {
      return [
        { name: 'Häuser', icon: '🏡', onTrack: 0, atRisk: 0, delayed: 0, completed: 0 },
        { name: 'Wohnungen', icon: '🏢', onTrack: 0, atRisk: 0, delayed: 0, completed: 0 },
        { name: 'Grundstücke', icon: '🌍', onTrack: 0, atRisk: 0, delayed: 0, completed: 0 },
        { name: 'Gewerbe', icon: '🏬', onTrack: 0, atRisk: 0, delayed: 0, completed: 0 }
      ];
    }

    const getTypeStats = (typeFilter: string) => {
      const typeProperties = propertiesData.filter(p => p.type === typeFilter);
      return {
        onTrack: typeProperties.filter(p => p.status === 'aktiv' || p.status === 'vorbereitung').length,
        atRisk: typeProperties.filter(p => p.status === 'reserviert').length,
        delayed: Math.floor(typeProperties.filter(p => p.status === 'aktiv').length * 0.1),
        completed: typeProperties.filter(p => p.status === 'verkauft').length
      };
    };

    return [
      { name: 'Häuser', icon: '🏡', ...getTypeStats('house') },
      { name: 'Wohnungen', icon: '🏢', ...getTypeStats('apartment') },
      { name: 'Grundstücke', icon: '🌍', ...getTypeStats('land') },
      { name: 'Gewerbe', icon: '🏬', ...getTypeStats('commercial') }
    ];
  }, [propertiesData]);

  const totalProjects = projectStatusData.reduce((sum, item) => sum + item.value, 0);

  // Debug logging
  console.log('📊 ProjectStatusOverview - Debug Info:', {
    propertiesData,
    analyticsData,
    projectStatusData,
    propertyTypes,
    totalProjects,
    propertiesLoading
  });

  // Dark Mode Detection
  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  // Custom Tooltip Component mit Dark Mode
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.85, y: 15 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 25,
              mass: 0.8
            }
          }}
          exit={{ 
            opacity: 0, 
            scale: 0.85, 
            y: 15,
            transition: { duration: 0.15 }
          }}
          className={`backdrop-blur-xl border rounded-3xl p-5 shadow-2xl ${
            isDarkMode 
              ? 'bg-gray-800/95 border-gray-600/50' 
              : 'bg-white/95 border-slate-200/50'
          }`}
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(31,41,55,0.95) 0%, rgba(17,24,39,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            boxShadow: isDarkMode
              ? '0 25px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1)'
              : '0 25px 50px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(255,255,255,0.5)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-5 h-5 rounded-full shadow-lg"
              style={{ 
                background: isDarkMode ? data.darkGradient : data.gradient,
                boxShadow: `0 4px 16px ${isDarkMode ? data.darkShadowColor : data.shadowColor}`
              }}
              whileHover={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            />
            <div>
              <p className={`font-bold text-lg ${isDarkMode ? 'text-gray-100' : 'text-slate-800'}`}>
                {data.name}
              </p>
              <p className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {data.value} Projekte
              </p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                {((data.value / totalProjects) * 100).toFixed(1)}% der Gesamtprojekte
              </p>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };
  
  // Smoothere Animationen
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 0.8,
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.9 },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 0.9
      }
    }
  };

  // Ladezustand anzeigen
  if (propertiesLoading && !projectStatusData.length) {
    return (
      <motion.div 
        className="bg-[#0f172a] rounded-2xl shadow-2xl border border-[#334155]/40 overflow-hidden backdrop-blur-sm h-full flex items-center justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{
          background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(13,20,36,0.98) 100%)",
          boxShadow: "0 10px 30px -5px rgba(2,6,23,0.3), 0 1px 3px rgba(1,1,15,0.1)"
        }}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center">
            <div className="w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-blue-300 text-sm">Projektstatus-Daten werden geladen...</p>
        </div>
      </motion.div>
    );
  }

  // Fehlerzustand anzeigen
  if (propertiesError) {
    return (
      <motion.div 
        className="bg-[#0f172a] rounded-2xl shadow-2xl border border-[#334155]/40 overflow-hidden backdrop-blur-sm h-full flex items-center justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{
          background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(13,20,36,0.98) 100%)",
          boxShadow: "0 10px 30px -5px rgba(2,6,23,0.3), 0 1px 3px rgba(1,1,15,0.1)"
        }}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <i className="ri-error-warning-line text-red-400 text-2xl"></i>
          </div>
          <h3 className="text-white text-lg font-semibold mb-2">Fehler beim Laden</h3>
          <p className="text-red-300/80 text-sm max-w-md">{String(propertiesError)}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600/80 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            onClick={() => window.location.reload()}
          >
            Erneut versuchen
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-[#0f172a] rounded-2xl shadow-2xl border border-[#334155]/40 overflow-hidden backdrop-blur-sm"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{
        background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(13,20,36,0.98) 100%)",
        boxShadow: "0 10px 30px -5px rgba(2,6,23,0.3), 0 1px 3px rgba(1,1,15,0.1)"
      }}
    >
      <div 
        className="p-4 border-b border-[#334155]/50"
        style={{
          background: "linear-gradient(to right, rgba(30,41,59,0.6), rgba(15,23,42,0.8))",
          backdropFilter: "blur(10px)"
        }}
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mr-3">
            <i className="ri-pie-chart-line text-white text-sm"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Projektstatus-Übersicht
            </h2>
            <p className="text-xs text-blue-300/90">
              Status der Immobilienprojekte im Vertriebsteam
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-4">
        {/* Kreisdiagramm für den Gesamtstatus */}
        <motion.div 
          className="p-3 xl:p-4 xl:col-span-2 lg:col-span-2 flex flex-col items-center justify-center"
          variants={itemVariants}
          style={{
            background: "radial-gradient(circle at center, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.8) 80%)",
            backdropFilter: "blur(8px)"
          }}
        >          
          <div className="h-[300px] w-full relative">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Hintergrundeffekte */}
              <div className="w-[150px] h-[150px] rounded-full bg-blue-600/10 absolute animate-pulse" 
                style={{filter: "blur(20px)"}}></div>
              
              {/* Zentraler Kreis */}
              <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-[#1e293b]/90 to-[#0f172a]/95 
                shadow-xl border border-indigo-500/30 flex items-center justify-center z-10 backdrop-blur-sm"
                style={{boxShadow: "0 0 20px 5px rgba(79, 70, 229, 0.15) inset"}}
              >
                <div className="text-center">
                  <p className="text-xs text-blue-400 font-medium tracking-wide">Gesamt</p>
                  <p className="text-2xl font-bold text-white mt-1">{totalProjects}</p>
                </div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <defs>
                  {projectStatusData.map((entry, index) => (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={isDarkMode ? entry.darkColor : entry.color} stopOpacity={0.95}/>
                      <stop offset="50%" stopColor={isDarkMode ? entry.darkHoverColor : entry.hoverColor} stopOpacity={1}/>
                      <stop offset="100%" stopColor={isDarkMode ? entry.darkColor : entry.color} stopOpacity={0.85}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`url(#gradient-${index})`}
                      stroke={isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.8)"}
                      strokeWidth={hoveredSegment === index ? 6 : 3}
                      style={{
                        filter: hoveredSegment === index 
                          ? `drop-shadow(0 12px 35px ${isDarkMode ? entry.darkShadowColor : entry.shadowColor})` 
                          : `drop-shadow(0 6px 20px ${isDarkMode ? entry.darkShadowColor : entry.shadowColor})`,
                        transform: hoveredSegment === index ? 'scale(1.08)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Zentrale Statistik mit Glasmorphism und Dark Mode */}
          <motion.div 
            className="relative mt-8 text-center"
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 25,
                delay: 0.8
              }
            }}
            whileHover={{ 
              scale: 1.05,
              transition: { type: "spring", stiffness: 400, damping: 20 }
            }}
          >
            <div 
              className={`relative backdrop-blur-xl rounded-3xl p-8 border transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-gray-800/30 border-gray-600/30' 
                  : 'bg-white/25 border-white/30'
              }`}
              style={{
                boxShadow: isDarkMode
                  ? '0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 12px 40px rgba(15, 23, 42, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              <h3 className={`text-5xl font-black mb-2 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent'
              }`}>
                {totalProjects}
              </h3>
              <p className={`font-bold text-lg mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-slate-600'
              }`}>
                Gesamtprojekte
              </p>
              <div className="flex justify-center gap-3">
                {projectStatusData.map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center"
                    whileHover={{ 
                      scale: 1.15, 
                      y: -3,
                      transition: { type: "spring", stiffness: 400, damping: 15 }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div 
                      className="w-4 h-4 rounded-full shadow-xl mb-2"
                      style={{ 
                        background: isDarkMode ? item.darkGradient : item.gradient,
                        boxShadow: `0 4px 12px ${isDarkMode ? item.darkShadowColor : item.shadowColor}`
                      }}
                    />
                    <span className={`text-sm font-bold ${
                      isDarkMode ? 'text-gray-200' : 'text-slate-600'
                    }`}>
                      {item.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Detaillierte Status-Liste - Premium Design mit Dark Mode */}
        <motion.div 
          className={`lg:col-span-2 p-8 border-t lg:border-t-0 lg:border-l relative transition-all duration-500 ${
            isDarkMode ? 'border-gray-700/30' : 'border-white/20'
          }`}
          variants={itemVariants}
        >
          <motion.h3 
            className={`text-2xl font-black mb-10 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-gray-100 to-gray-300 bg-clip-text text-transparent' 
                : 'bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent'
            }`}
            initial={{ opacity: 0, x: -30 }}
            animate={{ 
              opacity: 1, 
              x: 0,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 25,
                delay: 0.4
              }
            }}
          >
            Status nach Objekttyp
          </motion.h3>
          
          <div className="space-y-6">
            {propertyTypes.map((type, index) => {
              const total = type.onTrack + type.atRisk + type.delayed + type.completed;
              const isSelected = selectedType === type.name;
              
              return (
                <motion.div 
                  key={index}
                  className="group cursor-pointer"
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: {
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                      delay: 0.1 * index + 0.6
                    }
                  }}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -5,
                    transition: { type: "spring", stiffness: 400, damping: 25 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedType(isSelected ? null : type.name)}
                >
                  <div 
                    className={`relative p-7 rounded-3xl border transition-all duration-400 ${
                      isSelected 
                        ? isDarkMode 
                          ? 'bg-gray-700/50 border-blue-500/50 shadow-2xl' 
                          : 'bg-white/50 border-blue-300/50 shadow-2xl'
                        : isDarkMode
                          ? 'bg-gray-800/30 border-gray-600/30 hover:bg-gray-700/40 hover:border-blue-400/30'
                          : 'bg-white/25 border-white/30 hover:bg-white/35 hover:border-blue-200/50'
                    }`}
                    style={{
                      backdropFilter: 'blur(15px)',
                      boxShadow: isSelected 
                        ? isDarkMode
                          ? '0 25px 50px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                          : '0 25px 50px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        : isDarkMode
                          ? '0 10px 25px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                          : '0 10px 25px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {/* Header mit Icon und Dark Mode */}
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <motion.span 
                          className="text-3xl"
                          whileHover={{ 
                            scale: 1.2, 
                            rotate: 5,
                            transition: { type: "spring", stiffness: 400, damping: 15 }
                          }}
                        >
                          {type.icon}
                        </motion.span>
                        <div>
                          <span className={`font-black text-xl ${
                            isDarkMode ? 'text-gray-100' : 'text-slate-800'
                          }`}>
                            {type.name}
                          </span>
                          <p className={`text-sm font-semibold ${
                            isDarkMode ? 'text-gray-300' : 'text-slate-600'
                          }`}>
                            {total} Projekte gesamt
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ 
                          rotate: isSelected ? 180 : 0,
                          scale: isSelected ? 1.1 : 1
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className={isDarkMode ? 'text-gray-400' : 'text-slate-400'}
                      >
                        <i className="ri-arrow-down-s-line text-2xl"></i>
                      </motion.div>
                    </div>
                    
                    {/* Ultra Premium Progress Bar mit Dark Mode */}
                    <div className={`relative h-5 w-full rounded-full overflow-hidden backdrop-blur-sm border transition-all duration-500 ${
                      isDarkMode 
                        ? 'bg-gray-700/40 border-gray-600/20' 
                        : 'bg-slate-100/60 border-white/20'
                    }`}>
                      <div className="absolute inset-0 flex">
                        <motion.div 
                          className="h-full relative overflow-hidden"
                          style={{ 
                            width: `${(type.onTrack / total * 100)}%`,
                            background: isDarkMode
                              ? 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)'
                              : 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)'
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(type.onTrack / total * 100)}%` }}
                          transition={{ 
                            delay: 0.8 + index * 0.15, 
                            duration: 1.2, 
                            type: "spring", 
                            stiffness: 100, 
                            damping: 20 
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                        </motion.div>
                        <motion.div 
                          className="h-full relative overflow-hidden"
                          style={{ 
                            width: `${(type.atRisk / total * 100)}%`,
                            background: isDarkMode
                              ? 'linear-gradient(90deg, #64748b 0%, #94a3b8 100%)'
                              : 'linear-gradient(90deg, #475569 0%, #64748b 100%)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)'
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(type.atRisk / total * 100)}%` }}
                          transition={{ 
                            delay: 0.9 + index * 0.15, 
                            duration: 1.2, 
                            type: "spring", 
                            stiffness: 100, 
                            damping: 20 
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                        </motion.div>
                        <motion.div 
                          className="h-full relative overflow-hidden"
                          style={{ 
                            width: `${(type.delayed / total * 100)}%`,
                            background: isDarkMode
                              ? 'linear-gradient(90deg, #475569 0%, #64748b 100%)'
                              : 'linear-gradient(90deg, #334155 0%, #475569 100%)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)'
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(type.delayed / total * 100)}%` }}
                          transition={{ 
                            delay: 1.0 + index * 0.15, 
                            duration: 1.2, 
                            type: "spring", 
                            stiffness: 100, 
                            damping: 20 
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                        </motion.div>
                        <motion.div 
                          className="h-full relative overflow-hidden"
                          style={{ 
                            width: `${(type.completed / total * 100)}%`,
                            background: isDarkMode
                              ? 'linear-gradient(90deg, #1e293b 0%, #334155 100%)'
                              : 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
                            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)'
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(type.completed / total * 100)}%` }}
                          transition={{ 
                            delay: 1.1 + index * 0.15, 
                            duration: 1.2, 
                            type: "spring", 
                            stiffness: 100, 
                            damping: 20 
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Status-Details mit Dark Mode */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div 
                          className="grid grid-cols-4 gap-5 mt-8"
                          initial={{ opacity: 0, height: 0, scale: 0.9 }}
                          animate={{ 
                            opacity: 1, 
                            height: 'auto', 
                            scale: 1,
                            transition: {
                              type: "spring",
                              stiffness: 200,
                              damping: 25,
                              staggerChildren: 0.1
                            }
                          }}
                          exit={{ 
                            opacity: 0, 
                            height: 0, 
                            scale: 0.9,
                            transition: { duration: 0.3 }
                          }}
                        >
                          {[
                            { 
                              label: 'Auf Kurs', 
                              value: type.onTrack, 
                              color: isDarkMode ? '#3b82f6' : '#1e40af', 
                              icon: '✅' 
                            },
                            { 
                              label: 'Risiko', 
                              value: type.atRisk, 
                              color: isDarkMode ? '#64748b' : '#475569', 
                              icon: '⚠️' 
                            },
                            { 
                              label: 'Verzögert', 
                              value: type.delayed, 
                              color: isDarkMode ? '#475569' : '#334155', 
                              icon: '🔄' 
                            },
                            { 
                              label: 'Erledigt', 
                              value: type.completed, 
                              color: isDarkMode ? '#1e293b' : '#0f172a', 
                              icon: '🎉' 
                            }
                          ].map((item, idx) => (
                            <motion.div 
                              key={idx}
                              className={`text-center p-5 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                                isDarkMode 
                                  ? 'bg-gray-700/40 border-gray-600/20 hover:bg-gray-600/50' 
                                  : 'bg-white/40 border-white/20 hover:bg-white/60'
                              }`}
                              initial={{ opacity: 0, y: 30, scale: 0.8 }}
                              animate={{ 
                                opacity: 1, 
                                y: 0, 
                                scale: 1,
                                transition: { delay: idx * 0.1 }
                              }}
                              whileHover={{ 
                                scale: 1.08, 
                                y: -5,
                                transition: { type: "spring", stiffness: 400, damping: 15 }
                              }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <motion.span 
                                className="text-2xl mb-3 block"
                                whileHover={{ 
                                  scale: 1.3, 
                                  rotate: 10,
                                  transition: { type: "spring", stiffness: 400, damping: 15 }
                                }}
                              >
                                {item.icon}
                              </motion.span>
                              <p className={`text-xs font-bold mb-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-slate-600'
                              }`}>
                                {item.label}
                              </p>
                              <p className={`text-3xl font-black mb-3 ${
                                isDarkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}>
                                {item.value}
                              </p>
                              <motion.div 
                                className="w-10 h-1.5 rounded-full mx-auto"
                                style={{ backgroundColor: item.color }}
                                whileHover={{ 
                                  scaleX: 1.2,
                                  transition: { type: "spring", stiffness: 400, damping: 20 }
                                }}
                              />
                            </motion.div>
                          ))}
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

export default ProjectStatusOverview; 
