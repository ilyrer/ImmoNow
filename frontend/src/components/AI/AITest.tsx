import React, { useState } from 'react';
import { AIService } from '../../services/ai.service';

const AITest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      // Test 1: Aufgabenanalyse
      const taskResult = await AIService.suggestTaskPriority(
        'Besichtigung Villa Seeblick organisieren',
        'Terminkoordination mit Interessenten und Eigentümer für die Besichtigung der Villa Seeblick. Vorbereitung der Unterlagen und Durchführung der Besichtigung.',
        'Vertriebsteam Nord'
      );
      setResults(prev => [...prev, { type: 'Aufgabenanalyse', data: taskResult }]);

      // Test 2: Immobilienbeschreibung
      const propertyResult = await AIService.generatePropertyDescription({
        type: 'Villa',
        size: 280,
        rooms: 8,
        location: 'Seeufer, ruhige Lage',
        features: ['Privatstrand', 'Bootsanleger', 'Smart Home', 'Wellnessbereich'],
        condition: 'Neuwertig',
        price: 2850000
      });
      setResults(prev => [...prev, { type: 'Immobilienbeschreibung', data: propertyResult }]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">KI-Integration Testen</h1>
      
      <button
        onClick={runTests}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Tests laufen...' : 'Tests starten'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Fehler:</strong> {typeof error === 'string' ? error : (error as any)?.message || 'Unbekannter Fehler'}
        </div>
      )}

      {results.map((result, index) => (
        <div key={index} className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Test {index + 1}: {result.type}
          </h2>
          <pre className="p-4 bg-gray-800 text-gray-200 rounded-lg overflow-x-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
};

export default AITest; 
