/**
 * Step 4: Result - Valuation results and report
 */

import React, { useState } from 'react';
import { TrendingUp, Download, BarChart3, FileText, MapPin } from 'lucide-react';
import { AvmRequest, AvmResponseData } from '../../../types/avm';

interface Props {
  result: AvmResponseData;
  formData: AvmRequest;
  onNewValuation: () => void;
}

const Step4Result: React.FC<Props> = ({ result, onNewValuation }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'comps' | 'market'>('overview');

  const { result: avmResult, comparables, marketIntelligence } = result;

  const handleExportPDF = async () => {
    if (!result.valuationId) {
      alert('Keine Bewertungs-ID verfügbar');
      return;
    }

    try {
      // Call PDF export endpoint
      const response = await fetch(
        `/api/v1/avm/valuations/${result.valuationId}/export/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('PDF export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Immobilienbewertung_${result.valuationId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF-Export fehlgeschlagen');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Bewertung abgeschlossen</h2>
            <p className="text-blue-100">
              Geschätzter Marktwert Ihrer Immobilie
            </p>
          </div>
          <div className={`
            px-4 py-2 rounded-lg font-semibold
            ${avmResult.confidenceLevel === 'high'
              ? 'bg-green-500'
              : avmResult.confidenceLevel === 'medium'
              ? 'bg-yellow-500'
              : 'bg-orange-500'
            }
          `}>
            Konfidenz: {avmResult.confidenceLevel.toUpperCase()}
          </div>
        </div>

        <div className="text-center bg-white bg-opacity-20 rounded-lg p-6">
          <div className="text-5xl font-bold mb-2">
            € {avmResult.estimatedValue.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-blue-100 text-lg">
            Spanne: € {avmResult.valuationRange.min.toLocaleString('de-DE', { maximumFractionDigits: 0 })} - 
            € {avmResult.valuationRange.max.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
          </div>
          <div className="mt-4 text-blue-100">
            € {avmResult.pricePerSqm.toLocaleString('de-DE', { maximumFractionDigits: 0 })}/m²
          </div>
        </div>

        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={handleExportPDF}
            className="
              flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold
              hover:bg-blue-50 transition shadow-lg
            "
          >
            <Download className="w-5 h-5 mr-2" />
            PDF-Report exportieren
          </button>
          <button
            onClick={onNewValuation}
            className="
              flex items-center px-6 py-3 bg-blue-700 text-white rounded-lg font-semibold
              hover:bg-blue-800 transition
            "
          >
            Neue Bewertung
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Übersicht', icon: BarChart3 },
            { id: 'comps', label: 'Vergleichsobjekte', icon: MapPin },
            { id: 'market', label: 'Marktanalyse', icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`
                flex items-center px-4 py-3 border-b-2 font-medium transition
                ${activeTab === id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Icon className="w-5 h-5 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Bewertungsfaktoren</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {avmResult.factors.slice(0, 6).map((factor, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{factor.name}</h4>
                    <span
                      className={`
                        px-2 py-1 rounded text-xs font-semibold
                        ${factor.impact === 'positive'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : factor.impact === 'negative'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }
                      `}
                    >
                      {factor.impact === 'positive' ? '↑ Positiv' : factor.impact === 'negative' ? '↓ Negativ' : '→ Neutral'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {factor.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${factor.weight}%` }}
                      />
                    </div>
                    <span className="font-medium">{factor.weight}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Bewertungsmethodik</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {avmResult.methodology}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              <FileText className="inline w-4 h-4 mr-1" />
              Basierend auf {avmResult.comparablesUsed} Vergleichsobjekten
            </p>
          </div>
        </div>
      )}

      {activeTab === 'comps' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Vergleichsobjekte ({comparables.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Adresse
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Größe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Zimmer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Preis
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    €/m²
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Match
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {comparables.slice(0, 10).map((comp) => (
                  <tr key={comp.id}>
                    <td className="px-4 py-3 text-sm">
                      {comp.address}, {comp.city}
                    </td>
                    <td className="px-4 py-3 text-sm">{comp.size} m²</td>
                    <td className="px-4 py-3 text-sm">{comp.rooms || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      € {comp.price.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      € {comp.pricePerSqm.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2 max-w-[60px]">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${comp.matchScore * 100}%` }}
                          />
                        </div>
                        <span>{(comp.matchScore * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'market' && marketIntelligence && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
              <div className="text-sm text-blue-600 dark:text-blue-300 mb-1">Nachfrage</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {marketIntelligence.demandLevel.toUpperCase()}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
              <div className="text-sm text-green-600 dark:text-green-300 mb-1">
                Preiswachstum (12M)
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {marketIntelligence.priceGrowth12m > 0 ? '+' : ''}
                {marketIntelligence.priceGrowth12m.toFixed(1)}%
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
              <div className="text-sm text-purple-600 dark:text-purple-300 mb-1">
                Ø Vermarktungsdauer
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {marketIntelligence.averageDaysOnMarket} Tage
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Markttrends</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Chart-Visualisierung wird im nächsten Schritt integriert
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-sm">
        <p className="text-yellow-900 dark:text-yellow-100">
          <strong>Hinweis:</strong> Diese Bewertung ist eine automatisierte Marktwertindikation
          und ersetzt keine professionelle Gutachterbewertung durch einen zertifizierten Sachverständigen.
        </p>
      </div>
    </div>
  );
};

export default Step4Result;

