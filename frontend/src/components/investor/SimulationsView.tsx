/**
 * Simulations View - Investor Module
 * ROI calculation and comparison tool with break-even analysis
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Calculator,
  TrendingUp,
  Trash2,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Target
} from 'lucide-react';
// TODO: Implement real API hooks
import { Simulation } from '../../types/investor';

interface SimulationData {
  id: string;
  name: string;
  scenario: string;
  investment: number;
  interestRate: number;
  loanTerm: number;
  downPayment: number;
  renovationCosts: number;
  monthlyRent: number;
  vacancyAssumption: number;
  createdAt: string;
  roiProjection?: number[]; // Array of ROI values over time
  breakEvenMonth?: number; // Months until break-even
  totalReturn?: number; // Total return amount
  results: {
    monthlyCashFlow: number;
    annualCashFlow: number;
    totalReturn: number;
    roi: number;
    breakEvenYears: number;
  };
}

// Mock hook for investor simulations
const useInvestorSimulationsMock = () => {
  const simulations: SimulationData[] = [];
  const loading = false;
  const error = null;
  
  const createSimulation = (data: any) => {
    console.log('Creating simulation:', data);
    return Promise.resolve();
  };
  
  const deleteSimulation = (id: string) => {
    console.log('Deleting simulation:', id);
    return Promise.resolve();
  };
  
  return { simulations, loading, error, createSimulation, deleteSimulation };
};

const SimulationsView: React.FC = () => {
  const { simulations, loading, error, createSimulation, deleteSimulation } = useInvestorSimulationsMock();
  const [showForm, setShowForm] = useState(false);
  const [selectedSimulations, setSelectedSimulations] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    scenario: 'realistisch' as 'optimistisch' | 'realistisch' | 'pessimistisch',
    investment: 400000,
    interestRate: 3.5,
    loanTerm: 25,
    downPayment: 80000,
    renovationCosts: 0,
    monthlyRent: 2200,
    vacancyAssumption: 7
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createSimulation(formData);
      setShowForm(false);
      setFormData({
        name: '',
        scenario: 'realistisch',
        investment: 400000,
        interestRate: 3.5,
        loanTerm: 25,
        downPayment: 80000,
        renovationCosts: 0,
        monthlyRent: 2200,
        vacancyAssumption: 7
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Möchten Sie diese Simulation wirklich löschen?')) {
      await deleteSimulation(id);
      setSelectedSimulations(prev => prev.filter(s => s !== id));
    }
  };

  const toggleSimulationSelection = (id: string) => {
    setSelectedSimulations(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const getScenarioBadge = (scenario: string) => {
    const badges = {
      optimistisch: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      realistisch: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      pessimistisch: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      custom: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return badges[scenario as keyof typeof badges] || badges.custom;
  };

  // Prepare comparison chart data
  const comparisonData = selectedSimulations.length > 0
    ? Array.from({ length: 30 }, (_, i) => {
        const data: any = { year: i + 1 };
        selectedSimulations.forEach(simId => {
          const sim = simulations.find(s => s.id === simId);
          if (sim && sim.roiProjection[i]) {
            data[sim.name] = sim.roiProjection[i];
          }
        });
        return data;
      })
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Simulationen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ROI-Simulationen
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kalkulieren und vergleichen Sie verschiedene Investitionsszenarien
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Abbrechen' : 'Neue Simulation'}
        </button>
      </motion.div>

      {/* Creation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg overflow-hidden"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Neue Simulation erstellen
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name der Simulation
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="z.B. Neubau München-Schwabing"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Szenario
                  </label>
                  <select
                    value={formData.scenario}
                    onChange={(e) => setFormData({ ...formData, scenario: e.target.value as any })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="optimistisch">Optimistisch</option>
                    <option value="realistisch">Realistisch</option>
                    <option value="pessimistisch">Pessimistisch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Investitionssumme (€)
                  </label>
                  <input
                    type="number"
                    value={formData.investment}
                    onChange={(e) => setFormData({ ...formData, investment: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Eigenkapital (€)
                  </label>
                  <input
                    type="number"
                    value={formData.downPayment}
                    onChange={(e) => setFormData({ ...formData, downPayment: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zinssatz (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Laufzeit (Jahre)
                  </label>
                  <input
                    type="number"
                    value={formData.loanTerm}
                    onChange={(e) => setFormData({ ...formData, loanTerm: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monatliche Miete (€)
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Leerstandsannahme (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vacancyAssumption}
                    onChange={(e) => setFormData({ ...formData, vacancyAssumption: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sanierungskosten (€)
                  </label>
                  <input
                    type="number"
                    value={formData.renovationCosts}
                    onChange={(e) => setFormData({ ...formData, renovationCosts: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  {isCreating ? 'Wird erstellt...' : 'Simulation erstellen'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Chart */}
      {selectedSimulations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Vergleich der Szenarien
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {selectedSimulations.length} Simulation{selectedSimulations.length > 1 ? 'en' : ''} ausgewählt
          </p>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis 
                  dataKey="year" 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: 'Jahre', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff'
                  }}
                />
                <Legend />
                {selectedSimulations.map((simId, idx) => {
                  const sim = simulations.find(s => s.id === simId);
                  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
                  return sim ? (
                    <Line
                      key={simId}
                      type="monotone"
                      dataKey={sim.name}
                      stroke={colors[idx % colors.length]}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  ) : null;
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Simulations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {simulations.map((sim: SimulationData, index: number) => (
          <motion.div
            key={sim.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border-2 ${
              selectedSimulations.includes(sim.id)
                ? 'border-blue-500'
                : 'border-white/20 dark:border-gray-700/50'
            } shadow-lg hover:shadow-xl transition-all cursor-pointer`}
            onClick={() => toggleSimulationSelection(sim.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {sim.name}
                </h3>
                <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${getScenarioBadge(sim.scenario)}`}>
                  {sim.scenario.charAt(0).toUpperCase() + sim.scenario.slice(1)}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(sim.id);
                }}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Investment</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(sim.investment)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Zinssatz</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {sim.interestRate.toFixed(2)}%
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Break-Even</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {Math.floor(sim.breakEvenMonth / 12)}J {sim.breakEvenMonth % 12}M
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Gesamt-ROI</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(sim.totalReturn)}
                </div>
              </div>
            </div>

            {/* Selection indicator */}
            {selectedSimulations.includes(sim.id) && (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                <CheckCircle className="w-4 h-4" />
                Zum Vergleich ausgewählt
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {simulations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-12 border border-white/20 dark:border-gray-700/50 shadow-lg text-center"
        >
          <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Noch keine Simulationen
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstellen Sie Ihre erste ROI-Simulation
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Erste Simulation erstellen
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SimulationsView;
