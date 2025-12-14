/**
 * Step 3: Quality & Equipment
 */

import React from 'react';
import { Zap, Leaf, Home as HomeIcon } from 'lucide-react';
import { AvmRequest } from '../../../types/avm';

interface Props {
  formData: Partial<AvmRequest>;
  validationErrors: Record<string, string>;
  onUpdate: (updates: Partial<AvmRequest>) => void;
}

const Step3Quality: React.FC<Props> = ({ formData, onUpdate }) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Ausstattung & Qualität
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Details zur Ausstattung verbessern die Bewertungsgenauigkeit
        </p>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <HomeIcon className="inline w-4 h-4 mr-1" />
          Zustand *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { value: 'new', label: 'Neu' },
            { value: 'renovated', label: 'Renoviert' },
            { value: 'good', label: 'Gut' },
            { value: 'needs_renovation', label: 'Renovierungsbedürftig' },
            { value: 'poor', label: 'Schlecht' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate({ condition: value as any })}
              className={`
                p-3 rounded-lg border-2 transition-all text-center
                ${formData.condition === value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900 font-semibold'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Outdoor Spaces */}
      <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-green-900 dark:text-green-100 flex items-center">
          <Leaf className="w-5 h-5 mr-2" />
          Außenflächen
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Balkon (m²)
            </label>
            <input
              type="number"
              value={formData.balconyArea || ''}
              onChange={(e) => onUpdate({ balconyArea: parseFloat(e.target.value) || undefined })}
              className="
                w-full px-4 py-2 rounded-lg border border-green-300 dark:border-green-700
                bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500
              "
              min="0"
              max="200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Terrasse (m²)
            </label>
            <input
              type="number"
              value={formData.terraceArea || ''}
              onChange={(e) => onUpdate({ terraceArea: parseFloat(e.target.value) || undefined })}
              className="
                w-full px-4 py-2 rounded-lg border border-green-300 dark:border-green-700
                bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500
              "
              min="0"
              max="500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Garten (m²)
            </label>
            <input
              type="number"
              value={formData.gardenArea || ''}
              onChange={(e) => onUpdate({ gardenArea: parseFloat(e.target.value) || undefined })}
              className="
                w-full px-4 py-2 rounded-lg border border-green-300 dark:border-green-700
                bg-white dark:bg-gray-800 focus:ring-2 focus:ring-green-500
              "
              min="0"
              max="10000"
            />
          </div>
        </div>
      </div>

      {/* Energy */}
      <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Energieeffizienz
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Energieeffizienzklasse
            </label>
            <select
              value={formData.energyClass || ''}
              onChange={(e) => onUpdate({ energyClass: e.target.value as any || undefined })}
              className="
                w-full px-4 py-2 rounded-lg border border-yellow-300 dark:border-yellow-700
                bg-white dark:bg-gray-800 focus:ring-2 focus:ring-yellow-500
              "
            >
              <option value="">Keine Angabe</option>
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
            <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Heizungsart
            </label>
            <select
              value={formData.heatingType || ''}
              onChange={(e) => onUpdate({ heatingType: e.target.value as any || undefined })}
              className="
                w-full px-4 py-2 rounded-lg border border-yellow-300 dark:border-yellow-700
                bg-white dark:bg-gray-800 focus:ring-2 focus:ring-yellow-500
              "
            >
              <option value="">Keine Angabe</option>
              <option value="gas">Gas</option>
              <option value="oil">Öl</option>
              <option value="district">Fernwärme</option>
              <option value="heat_pump">Wärmepumpe</option>
              <option value="electric">Elektro</option>
              <option value="pellets">Pellets</option>
            </select>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Ausstattungsmerkmale
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="checkbox"
              checked={formData.fittedKitchen || false}
              onChange={(e) => onUpdate({ fittedKitchen: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="ml-3 text-sm font-medium">Einbauküche</span>
          </label>

          <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="checkbox"
              checked={formData.barrierFree || false}
              onChange={(e) => onUpdate({ barrierFree: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="ml-3 text-sm font-medium">Barrierefrei</span>
          </label>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stellplätze / Garagen
            </label>
            <input
              type="number"
              value={formData.parkingSpaces || 0}
              onChange={(e) => onUpdate({ parkingSpaces: parseInt(e.target.value) || 0 })}
              className="
                w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500
              "
              min="0"
              max="20"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Quality;

