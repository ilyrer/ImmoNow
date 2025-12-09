import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, Leaf, Calendar, Award, FileText, Save, Download, Edit2, X, Home, TrendingUp, AlertCircle } from 'lucide-react';
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

    const energyClass = editingData.energy_class || 'C';
    const energyValue = editingData.energy_consumption || 0;
    const co2Emissions = editingData.co2_emissions || 0;

    const energyClasses = [
        { grade: 'A+', range: '< 30', color: 'from-emerald-600 to-emerald-500', textColor: 'emerald' },
        { grade: 'A', range: '30-50', color: 'from-emerald-500 to-lime-500', textColor: 'emerald' },
        { grade: 'B', range: '50-75', color: 'from-lime-500 to-green-500', textColor: 'lime' },
        { grade: 'C', range: '75-100', color: 'from-yellow-400 to-yellow-500', textColor: 'yellow' },
        { grade: 'D', range: '100-130', color: 'from-orange-400 to-orange-500', textColor: 'orange' },
        { grade: 'E', range: '130-160', color: 'from-orange-500 to-red-400', textColor: 'orange' },
        { grade: 'F', range: '160-200', color: 'from-red-400 to-red-500', textColor: 'red' },
        { grade: 'G', range: '> 200', color: 'from-red-500 to-red-600', textColor: 'red' },
    ];

    const getEfficiencyCategory = () => {
        const classes = ['A+', 'A', 'B'];
        if (classes.includes(energyClass)) return { label: 'Sehr effizient', color: 'emerald', icon: Leaf };
        if (['C', 'D'].includes(energyClass)) return { label: 'Durchschnittlich', color: 'yellow', icon: Zap };
        return { label: 'Wenig effizient', color: 'red', icon: TrendingUp };
    };

    const category = getEfficiencyCategory();
    const CategoryIcon = category.icon;
    const currentClass = energyClasses.find(c => c.grade === energyClass) || energyClasses[3];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                            <Leaf className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Energieausweis</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Zertifiziert nach EnEV 2014</p>
                        </div>
                    </div>
                    {!isEditing ? (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                            >
                                <Edit2 className="h-4 w-4" />
                                Bearbeiten
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={isDownloadingPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Download className="h-4 w-4" />
                                {isDownloadingPDF ? 'Generiere...' : 'PDF'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                <X className="h-4 w-4" />
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isUpdating}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {isUpdating ? 'Speichern...' : 'Speichern'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Energy Rating & Edit Form */}
                <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    {isEditing ? (
                        /* Edit Mode - Comprehensive Form */
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Energieausweis bearbeiten</h3>

                            {/* Primary Energy Data */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Energieeffizienzklasse *
                                    </label>
                                    <select
                                        value={editingData.energy_class}
                                        onChange={(e) => setEditingData({ ...editingData, energy_class: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Bitte wählen</option>
                                        <option value="A+">A+ (&lt; 30 kWh/m²a)</option>
                                        <option value="A">A (30-50 kWh/m²a)</option>
                                        <option value="B">B (50-75 kWh/m²a)</option>
                                        <option value="C">C (75-100 kWh/m²a)</option>
                                        <option value="D">D (100-130 kWh/m²a)</option>
                                        <option value="E">E (130-160 kWh/m²a)</option>
                                        <option value="F">F (160-200 kWh/m²a)</option>
                                        <option value="G">G (&gt; 200 kWh/m²a)</option>
                                        <option value="H">H (&gt; 250 kWh/m²a)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Endenergiebedarf (kWh/m²a) *
                                    </label>
                                    <input
                                        type="number"
                                        value={editingData.energy_consumption}
                                        onChange={(e) => setEditingData({ ...editingData, energy_consumption: Number(e.target.value) })}
                                        min="0"
                                        step="1"
                                        placeholder="z.B. 85"
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
                                        onChange={(e) => setEditingData({ ...editingData, co2_emissions: Number(e.target.value) })}
                                        min="0"
                                        step="1"
                                        placeholder="z.B. 18"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Heizungsart
                                    </label>
                                    <select
                                        value={editingData.heating_type}
                                        onChange={(e) => setEditingData({ ...editingData, heating_type: e.target.value })}
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Bitte wählen</option>
                                        <option value="gas">Gas</option>
                                        <option value="öl">Öl</option>
                                        <option value="fernwärme">Fernwärme</option>
                                        <option value="wärmepumpe">Wärmepumpe</option>
                                        <option value="pellets">Pellets</option>
                                        <option value="solar">Solar</option>
                                        <option value="elektro">Elektro</option>
                                        <option value="blockheizkraftwerk">Blockheizkraftwerk</option>
                                    </select>
                                </div>
                            </div>

                            {/* Certificate Details */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Zertifikat-Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Ausweistyp *
                                        </label>
                                        <select
                                            value={editingData.energy_certificate_type}
                                            onChange={(e) => setEditingData({ ...editingData, energy_certificate_type: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Bitte wählen</option>
                                            <option value="bedarfsausweis">Bedarfsausweis</option>
                                            <option value="verbrauchsausweis">Verbrauchsausweis</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Ausstellungsdatum
                                        </label>
                                        <input
                                            type="date"
                                            value={editingData.energy_certificate_issue_date}
                                            onChange={(e) => setEditingData({ ...editingData, energy_certificate_issue_date: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Gültig bis
                                        </label>
                                        <input
                                            type="date"
                                            value={editingData.energy_certificate_valid_until}
                                            onChange={(e) => setEditingData({ ...editingData, energy_certificate_valid_until: e.target.value })}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                    <div className="text-sm text-blue-800 dark:text-blue-300">
                                        <p className="font-semibold mb-1">Hinweis zur Vollständigkeit</p>
                                        <p>Alle mit * markierten Felder sind für einen vollständigen Energieausweis erforderlich. Ein Energieausweis ist für die Vermarktung von Immobilien gesetzlich vorgeschrieben.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Display Mode */
                        <div className="space-y-6">
                            {/* Energy Rating Display */}
                            <div className="text-center">
                                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-gradient-to-br ${currentClass.color} shadow-lg mb-4`}>
                                    <span className="text-5xl font-black text-white">{energyClass}</span>
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Energieeffizienzklasse {energyClass}
                                </h3>
                                <p className={`text-lg font-semibold text-${category.color}-600 dark:text-${category.color}-400`}>
                                    {category.label}
                                </p>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Flame className="h-5 w-5 text-orange-600" />
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Energiebedarf</span>
                                    </div>
                                    <div className="text-2xl font-black text-gray-900 dark:text-white">{energyValue}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">kWh/m²a</div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Leaf className="h-5 w-5 text-emerald-600" />
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">CO₂-Emissionen</span>
                                    </div>
                                    <div className="text-2xl font-black text-gray-900 dark:text-white">{co2Emissions}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400">kg/m²a</div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Home className="h-5 w-5 text-blue-600" />
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Heizung</span>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                        {editingData.heating_type || 'Nicht angegeben'}
                                    </div>
                                </div>
                            </div>

                            {/* Energy Scale */}
                            <div className="space-y-3">
                                <h4 className="text-md font-bold text-gray-900 dark:text-white">Energieeffizienzskala</h4>
                                <div className="space-y-2">
                                    {energyClasses.map((item) => {
                                        const isActive = item.grade === energyClass;
                                        return (
                                            <div
                                                key={item.grade}
                                                className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${isActive
                                                        ? 'bg-gradient-to-r ' + item.color + ' scale-105 shadow-md'
                                                        : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600'
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow flex-shrink-0`}>
                                                    <span className="text-lg font-black text-white">{item.grade}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white">{item.range} kWh/m²a</div>
                                                </div>
                                                {isActive && (
                                                    <Award className="h-5 w-5 text-white" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Certificate Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">Zertifikat-Details</h4>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Ausweistyp</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {editingData.energy_certificate_type || 'Nicht angegeben'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Ausstellungsdatum</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {editingData.energy_certificate_issue_date || 'Nicht angegeben'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Gültig bis</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {editingData.energy_certificate_valid_until || 'Nicht angegeben'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Norm</span>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">EnEV 2014</span>
                            </div>
                        </div>
                    </div>

                    {/* Category Explanation */}
                    <div className={`bg-${category.color}-50 dark:bg-${category.color}-900/20 rounded-2xl p-6 border border-${category.color}-200 dark:border-${category.color}-700/50`}>
                        <div className="flex items-center gap-3 mb-3">
                            <CategoryIcon className={`h-5 w-5 text-${category.color}-600`} />
                            <h4 className={`text-md font-bold text-${category.color}-900 dark:text-${category.color}-200`}>
                                {category.label}
                            </h4>
                        </div>
                        <p className={`text-sm text-${category.color}-700 dark:text-${category.color}-300 leading-relaxed`}>
                            {category.label === 'Sehr effizient' && 'Diese Immobilie hat einen niedrigen Energieverbrauch und trägt aktiv zum Umweltschutz bei. Niedrige Betriebskosten.'}
                            {category.label === 'Durchschnittlich' && 'Diese Immobilie entspricht dem durchschnittlichen Energiestandard. Moderate Betriebskosten mit Potenzial zur Optimierung.'}
                            {category.label === 'Wenig effizient' && 'Diese Immobilie hat einen höheren Energieverbrauch. Modernisierungsmaßnahmen könnten die Effizienz steigern und Kosten senken.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnergyEfficiencyTab;
