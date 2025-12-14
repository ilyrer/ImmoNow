/**
 * Preset Selection Component
 * Allows users to quickly apply predefined scenarios
 */

import React from 'react';
import { motion } from 'framer-motion';
import { SCENARIO_PRESETS, ScenarioPreset } from '../../../lib/finance/scenarios';
import { FinancingParameters } from '../../../types/finance';

interface PresetSelectorProps {
    onApplyPreset: (preset: ScenarioPreset) => void;
    currentParameters: FinancingParameters;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
    onApplyPreset,
    currentParameters
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Schnellstart-Szenarien
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    Klicken um anzuwenden
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {SCENARIO_PRESETS.map((preset, index) => (
                    <motion.button
                        key={preset.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onApplyPreset(preset)}
                        className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 text-left group"
                    >
                        {/* Icon */}
                        <div className="text-4xl mb-3">{preset.icon}</div>

                        {/* Title */}
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {preset.name}
                        </h4>

                        {/* Description */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {preset.description}
                        </p>

                        {/* Hover indicator */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-blue-500 rounded-full p-1">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

/**
 * Scenario Management Panel
 * Lists saved scenarios with actions
 */

import { Trash2, Copy, FolderOpen, Calendar } from 'lucide-react';
import { FinancingScenario } from '../../../types/finance';

interface ScenarioListProps {
    scenarios: FinancingScenario[];
    currentScenarioId?: string | null;
    onLoadScenario: (id: string) => void;
    onDeleteScenario: (id: string) => void;
    onDuplicateScenario: (id: string) => void;
}

export const ScenarioList: React.FC<ScenarioListProps> = ({
    scenarios,
    currentScenarioId,
    onLoadScenario,
    onDeleteScenario,
    onDuplicateScenario
}) => {
    if (scenarios.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Keine gespeicherten Szenarien</p>
                <p className="text-sm mt-2">Speichern Sie Ihre Berechnungen für späteren Vergleich</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {scenarios.map((scenario, index) => {
                const isActive = scenario.id === currentScenarioId;

                return (
                    <motion.div
                        key={scenario.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
              bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border-2
              ${isActive
                                ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }
              transition-all duration-200 cursor-pointer
            `}
                        onClick={() => onLoadScenario(scenario.id)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                {/* Header */}
                                <div className="flex items-center space-x-2 mb-2">
                                    <h4 className="font-bold text-gray-900 dark:text-white truncate">
                                        {scenario.name}
                                    </h4>
                                    {isActive && (
                                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            AKTIV
                                        </span>
                                    )}
                                    <ScoreBadge score={scenario.score} />
                                </div>

                                {/* Description */}
                                {scenario.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                        {scenario.description}
                                    </p>
                                )}

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">Monatl. Rate:</span>
                                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                            {scenario.result.monthlyPayment.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">Zinsen gesamt:</span>
                                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                            {scenario.result.totalInterest.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">Darlehenssumme:</span>
                                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                            {scenario.result.loanAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 dark:text-gray-400">Laufzeit:</span>
                                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                            {scenario.parameters.loanTerm} Jahre
                                        </span>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(scenario.createdAt).toLocaleDateString('de-DE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col space-y-2 ml-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicateScenario(scenario.id);
                                    }}
                                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    title="Duplizieren"
                                >
                                    <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Szenario "${scenario.name}" wirklich löschen?`)) {
                                            onDeleteScenario(scenario.id);
                                        }
                                    }}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    title="Löschen"
                                >
                                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

/**
 * Score badge component
 */
const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    const getColor = () => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className={`${getColor()} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
            {score}
        </div>
    );
};
