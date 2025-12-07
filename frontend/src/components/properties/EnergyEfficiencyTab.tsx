import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Leaf, Calendar, TrendingDown, Award, FileText, Save, Download } from 'lucide-react';
import { useEnergyCertificate } from '../../hooks/useEnergyCertificate';

interface EnergyEfficiencyTabProps {
  property: any;
}

const EnergyEfficiencyTab: React.FC<EnergyEfficiencyTabProps> = ({ property }) => {
  const { 
    energyData, 
    isLoading, 
    updateEnergyData, 
    isUpdating, 
    downloadPDF, 
    isDownloadingPDF 
  } = useEnergyCertificate(property.id);

  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState({
    energy_class: energyData?.energy_class || '',
    energy_consumption: energyData?.energy_consumption || 0,
    energy_certificate_type: energyData?.energy_certificate_type || '',
    energy_certificate_valid_until: energyData?.energy_certificate_valid_until || '',
    energy_certificate_issue_date: energyData?.energy_certificate_issue_date || '',
    co2_emissions: energyData?.co2_emissions || 0,
    heating_type: energyData?.heating_type || '',
  });

  // Update editing data when energyData changes
  React.useEffect(() => {
    if (energyData) {
      setEditingData({
        energy_class: energyData.energy_class || '',
        energy_consumption: energyData.energy_consumption || 0,
        energy_certificate_type: energyData.energy_certificate_type || '',
        energy_certificate_valid_until: energyData.energy_certificate_valid_until || '',
        energy_certificate_issue_date: energyData.energy_certificate_issue_date || '',
        co2_emissions: energyData.co2_emissions || 0,
        heating_type: energyData.heating_type || '',
      });
    }
  }, [energyData]);

  const handleSave = () => {
    updateEnergyData(editingData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingData({
      energy_class: energyData?.energy_class || '',
      energy_consumption: energyData?.energy_consumption || 0,
      energy_certificate_type: energyData?.energy_certificate_type || '',
      energy_certificate_valid_until: energyData?.energy_certificate_valid_until || '',
      energy_certificate_issue_date: energyData?.energy_certificate_issue_date || '',
      co2_emissions: energyData?.co2_emissions || 0,
      heating_type: energyData?.heating_type || '',
    });
    setIsEditing(false);
  };

  const handleDownloadPDF = () => {
    downloadPDF();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const energyClass = energyData?.energy_class || 'C';
  const energyValue = energyData?.energy_consumption || 85;
  const co2Emissions = energyData?.co2_emissions || 18;
  const validUntil = energyData?.energy_certificate_valid_until || '2033';

  const energyClasses = [
    { grade: 'A+', range: '< 30', color: 'from-emerald-600 to-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { grade: 'A', range: '30-50', color: 'from-emerald-500 to-lime-500', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { grade: 'B', range: '50-75', color: 'from-lime-500 to-green-500', bgColor: 'bg-lime-50 dark:bg-lime-900/20' },
    { grade: 'C', range: '75-100', color: 'from-yellow-400 to-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { grade: 'D', range: '100-130', color: 'from-orange-400 to-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
    { grade: 'E', range: '130-160', color: 'from-orange-500 to-red-400', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
    { grade: 'F', range: '160-200', color: 'from-red-400 to-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
    { grade: 'G', range: '> 200', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  ];

  const getEfficiencyCategory = () => {
    const classes = ['A+', 'A', 'B'];
    if (classes.includes(energyClass)) return { label: 'Sehr effizient', color: 'emerald', icon: Leaf };
    if (['C', 'D'].includes(energyClass)) return { label: 'Durchschnittlich', color: 'yellow', icon: Zap };
    return { label: 'Wenig effizient', color: 'red', icon: TrendingDown };
  };

  const category = getEfficiencyCategory();
  const CategoryIcon = category.icon;
  const currentClass = energyClasses.find(c => c.grade === energyClass) || energyClasses[3];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-xl rounded-2xl p-6 border border-green-200/50 dark:border-green-700/30 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Leaf className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Energieeffizienz-Bewertung</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Zertifiziert nach EnEV 2014</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span>Zertifiziert</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Energy Rating */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/50 p-8"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className={`inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-gradient-to-br ${currentClass.color} shadow-2xl mb-4 relative`}
            >
              <span className="text-5xl font-black text-white">{energyClass}</span>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg">
                <CategoryIcon className={`h-5 w-5 text-${category.color}-500`} />
              </div>
            </motion.div>
            
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Energieeffizienzklasse {energyClass}
            </h3>
            <p className={`text-lg font-semibold text-${category.color}-600 dark:text-${category.color}-400`}>
              {category.label}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-700/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Energiebedarf</span>
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{energyValue}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">kWh/m²a</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-700/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">CO₂-Emissionen</span>
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{co2Emissions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">kg/m²a</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700/50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Gültig bis</span>
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">{validUntil}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Jahr</div>
            </motion.div>
          </div>

          {/* Energy Scale */}
          <div className="space-y-6">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Energieeffizienzskala</h4>
            <div className="space-y-2">
              {energyClasses.map((item, index) => {
                const isActive = item.grade === energyClass;
                return (
                  <motion.div
                    key={item.grade}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r ' + item.bgColor + ' border-2 border-current shadow-lg scale-105' 
                        : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <span className="text-2xl font-black text-white">{item.grade}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{item.range} kWh/m²a</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {index < 3 ? 'Sehr effizient' : index < 5 ? 'Durchschnittlich' : 'Wenig effizient'}
                      </div>
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Award className="h-6 w-6 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Sidebar Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Certificate Info */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/30 dark:border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">Zertifikat-Details</h4>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  Bearbeiten
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Energieklasse
                  </label>
                  <select
                    value={editingData.energy_class}
                    onChange={(e) => setEditingData({...editingData, energy_class: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nicht angegeben</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                    <option value="H">H</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Endenergiebedarf (kWh/m²a)
                  </label>
                  <input
                    type="number"
                    value={editingData.energy_consumption}
                    onChange={(e) => setEditingData({...editingData, energy_consumption: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CO₂-Emissionen (kg/m²a)
                  </label>
                  <input
                    type="number"
                    value={editingData.co2_emissions}
                    onChange={(e) => setEditingData({...editingData, co2_emissions: Number(e.target.value)})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ausweistyp
                  </label>
                  <select
                    value={editingData.energy_certificate_type}
                    onChange={(e) => setEditingData({...editingData, energy_certificate_type: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Nicht angegeben</option>
                    <option value="bedarfsausweis">Bedarfsausweis</option>
                    <option value="verbrauchsausweis">Verbrauchsausweis</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gültig bis
                  </label>
                  <input
                    type="date"
                    value={editingData.energy_certificate_valid_until}
                    onChange={(e) => setEditingData({...editingData, energy_certificate_valid_until: e.target.value})}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heizungsart
                  </label>
                  <input
                    type="text"
                    value={editingData.heating_type}
                    onChange={(e) => setEditingData({...editingData, heating_type: e.target.value})}
                    placeholder="z.B. Gas, Öl, Wärmepumpe"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isUpdating ? 'Speichern...' : 'Speichern'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ausstellungsdatum</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {energyData?.energy_certificate_issue_date || 'Nicht angegeben'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Gültig bis</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {energyData?.energy_certificate_valid_until || 'Nicht angegeben'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Norm</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">EnEV 2014</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ausweistyp</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {energyData?.energy_certificate_type || 'Nicht angegeben'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Category Explanation */}
          <div className={`bg-gradient-to-br from-${category.color}-50 to-${category.color}-100 dark:from-${category.color}-900/20 dark:to-${category.color}-800/20 rounded-2xl p-6 border border-${category.color}-200 dark:border-${category.color}-700/50 shadow-xl`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 bg-${category.color}-500 rounded-xl flex items-center justify-center shadow-lg`}>
                <CategoryIcon className="h-5 w-5 text-white" />
              </div>
              <h4 className={`text-lg font-bold text-${category.color}-900 dark:text-${category.color}-200`}>
                {category.label}
              </h4>
            </div>
            <p className={`text-sm text-${category.color}-700 dark:text-${category.color}-300 leading-relaxed`}>
              {category.label === 'Sehr effizient' && 'Diese Immobilie hat einen niedrigen Energieverbrauch und trägt aktiv zum Umweltschutz bei. Niedrige Betriebskosten.'}
              {category.label === 'Durchschnittlich' && 'Diese Immobilie entspricht dem durchschnittlichen Energiestandard. Moderate Betriebskosten mit Potenzial zur Optimierung.'}
              {category.label === 'Wenig effizient' && 'Diese Immobilie hat einen höheren Energieverbrauch. Modernisierungsmaßnahmen könnten die Effizienz steigern und Kosten senken.'}
            </p>
          </div>

          {/* Download Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50"
          >
            <Download className="h-5 w-5" />
            <span>{isDownloadingPDF ? 'PDF wird generiert...' : 'Zertifikat herunterladen'}</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default EnergyEfficiencyTab;
