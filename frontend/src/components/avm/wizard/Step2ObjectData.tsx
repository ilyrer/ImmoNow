/**
 * Step 2: Object Data - Property details
 */

import React from 'react';
import { Home, Maximize, Calendar, Layers } from 'lucide-react';
import { AvmRequest } from '../../../types/avm';

interface Props {
  formData: Partial<AvmRequest>;
  validationErrors: Record<string, string>;
  onUpdate: (updates: Partial<AvmRequest>) => void;
}

const Step2ObjectData: React.FC<Props> = ({ formData, validationErrors, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Objektdaten
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Geben Sie die wichtigsten Objektdetails an
        </p>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Immobilientyp *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { value: 'apartment', label: 'Wohnung', icon: Home },
            { value: 'house', label: 'Haus', icon: Home },
            { value: 'commercial', label: 'Gewerbe', icon: Home },
            { value: 'land', label: 'Grundstück', icon: Layers },
            { value: 'parking', label: 'Stellplatz', icon: Layers },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate({ property_type: value as any })}
              className={`
                p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center
                ${formData.property_type === value
                  ? 'border-apple-blue bg-gradient-to-br from-apple-blue/10 to-primary-600/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-apple-blue/50'
                }
              `}
            >
              <Icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Living Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Maximize className="inline w-4 h-4 mr-1" />
            Wohnfläche (m²) *
          </label>
          <input
            type="number"
            value={formData.livingArea || ''}
            onChange={(e) => onUpdate({ livingArea: parseFloat(e.target.value) || 0 })}
            className={`
              w-full px-4 py-3 rounded-lg border
              ${validationErrors.livingArea
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
              }
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:outline-none
            `}
            min="5"
            max="10000"
          />
          {validationErrors.livingArea && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.livingArea}</p>
          )}
        </div>

        {/* Rooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Zimmer
          </label>
          <input
            type="number"
            value={formData.rooms || ''}
            onChange={(e) => onUpdate({ rooms: parseInt(e.target.value) || undefined })}
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:outline-none
            "
            min="1"
            max="50"
          />
        </div>

        {/* Build Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Baujahr
          </label>
          <input
            type="number"
            value={formData.buildYear || ''}
            onChange={(e) => onUpdate({ buildYear: parseInt(e.target.value) || undefined })}
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:outline-none
            "
            min="1800"
            max="2030"
          />
        </div>

        {/* Bathrooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Badezimmer
          </label>
          <input
            type="number"
            value={formData.bathrooms || ''}
            onChange={(e) => onUpdate({ bathrooms: parseInt(e.target.value) || undefined })}
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:outline-none
            "
            min="1"
            max="10"
          />
        </div>
      </div>

      {/* Floor Info (for apartments) */}
      {formData.property_type === 'apartment' && (
        <div className="backdrop-blur-xl bg-apple-blue/10 dark:bg-apple-blue/20 rounded-[16px] p-4 space-y-4 border border-apple-blue/20">
          <h3 className="font-semibold text-apple-blue dark:text-apple-blue">
            Etagendetails
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Etage
              </label>
              <input
                type="number"
                value={formData.floor !== undefined ? formData.floor : ''}
                onChange={(e) => onUpdate({ floor: parseInt(e.target.value) || undefined })}
                className="
                  w-full px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-700
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:outline-none
                "
                min="0"
                max="100"
                placeholder="0 = EG"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Gesamtetagen
              </label>
              <input
                type="number"
                value={formData.totalFloors || ''}
                onChange={(e) => onUpdate({ totalFloors: parseInt(e.target.value) || undefined })}
                className="
                  w-full px-4 py-2 rounded-lg border border-blue-300 dark:border-blue-700
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:outline-none
                "
                min="1"
                max="100"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasElevator || false}
                  onChange={(e) => onUpdate({ hasElevator: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm font-medium text-blue-900 dark:text-blue-100">
                  Aufzug vorhanden
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Plot Area (for houses) */}
      {(formData.property_type === 'house' || formData.property_type === 'land') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Grundstücksfläche (m²)
          </label>
          <input
            type="number"
            value={formData.plotArea || ''}
            onChange={(e) => onUpdate({ plotArea: parseFloat(e.target.value) || undefined })}
            className="
              w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:outline-none
            "
            min="0"
            max="100000"
          />
        </div>
      )}
    </div>
  );
};

export default Step2ObjectData;

