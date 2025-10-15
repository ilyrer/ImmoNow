import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/solid';

// Mock measures service
const measuresService = {
  list: async (params: any) => {
    console.log('Fetching measures with params:', params);
    return Promise.resolve({ items: [] });
  }
};

type MeasureRow = { 
  id: number; 
  title: string; 
  property?: string;
  status: string; 
  dueDate: string; 
  responsible: string;
  description: string;
  created?: string;
};

const MeasuresList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Alle');
  const statusOptions = ['Alle', 'Geplant', 'In Umsetzung', 'Erledigt'];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [measures, setMeasures] = useState<MeasureRow[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await measuresService.list({ is_active: true, page: 1, size: 25 }) as any;
        if (!mounted) return;
        const rows: MeasureRow[] = (data?.metrics || data?.items || []).map((m: any) => ({
          id: m.id,
          title: m.display_name || m.name,
          property: '',
          status: m.is_active ? 'In Umsetzung' : 'Erledigt',
          dueDate: (m.updated_at || m.created_at || '').slice(0, 10),
          responsible: m.creator_name || '—',
          description: m.description || '',
          created: (m.created_at || '').slice(0, 10)
        }));
        setMeasures(rows);
      } catch (e) {
        console.error('Fehler beim Laden der Maßnahmen:', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Filter measures based on search term and filter status
  const filteredMeasures = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return measures.filter(measure => {
      const matchesSearch = 
        measure.title.toLowerCase().includes(term) ||
        (measure.property || '').toLowerCase().includes(term) ||
        measure.responsible.toLowerCase().includes(term);
      const matchesStatus = filterStatus === 'Alle' || measure.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [measures, searchTerm, filterStatus]);

  const toggleRowExpand = (id: number) => {
    if (selectedRow === id) {
      setSelectedRow(null);
    } else {
      setSelectedRow(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Maßnahmen</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Neue Maßnahme
        </button>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Maßnahme suchen..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:w-64 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Measures Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maßnahme
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Immobilie
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fällig am
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verantwortlich
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Aktionen</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMeasures.map((measure) => (
                <React.Fragment key={measure.id}>
                  <tr 
                    className={`hover:bg-gray-50 ${selectedRow === measure.id ? 'bg-gray-50' : ''}`}
                    onClick={() => toggleRowExpand(measure.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{measure.title}</div>
                      <div className="text-xs text-gray-500">Erstellt am {measure.created}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{measure.property}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        measure.status === 'In Umsetzung' 
                          ? 'bg-blue-100 text-blue-800' 
                          : measure.status === 'Geplant'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {measure.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {measure.dueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {measure.responsible}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <svg 
                        className={`inline-block h-5 w-5 text-gray-500 transition-transform ${selectedRow === measure.id ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </td>
                  </tr>
                  {selectedRow === measure.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="text-sm text-gray-700 mb-3">
                          <span className="font-medium">Beschreibung:</span> {measure.description}
                        </div>
                        <div className="flex space-x-2">
                          <button className="inline-flex items-center px-3 py-1 border border-primary-300 text-sm leading-5 font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:border-primary-400 focus:shadow-outline-primary active:bg-primary-100">
                            Bearbeiten
                          </button>
                          <button className="inline-flex items-center px-3 py-1 border border-green-300 text-sm leading-5 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:border-green-400 focus:shadow-outline-green active:bg-green-100">
                            Als erledigt markieren
                          </button>
                          <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:border-gray-400 focus:shadow-outline-gray active:bg-gray-100">
                            Zuweisen
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* New Measure Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                    Neue Maßnahme erstellen
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titel</label>
                      <input 
                        type="text" 
                        name="title" 
                        id="title" 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" 
                        placeholder="Titel der Maßnahme"
                      />
                    </div>
                    <div>
                      <label htmlFor="property" className="block text-sm font-medium text-gray-700">Immobilie</label>
                      <select 
                        id="property" 
                        name="property" 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="">-- Bitte wählen --</option>
                        <option>Villa Seeblick</option>
                        <option>Penthouse City Center</option>
                        <option>Apartment Parkblick</option>
                        <option>Einfamilienhaus Sonnenhügel</option>
                        <option>Doppelhaushälfte Waldrand</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                      <select 
                        id="status" 
                        name="status" 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option>Geplant</option>
                        <option>In Umsetzung</option>
                        <option>Erledigt</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Fällig am</label>
                      <input 
                        type="date" 
                        name="dueDate" 
                        id="dueDate" 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="responsible" className="block text-sm font-medium text-gray-700">Verantwortlich</label>
                      <select 
                        id="responsible" 
                        name="responsible" 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="">-- Bitte wählen --</option>
                        <option>Max Mustermann</option>
                        <option>Laura Schmidt</option>
                        <option>Thomas Weber</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">Beschreibung</label>
                      <textarea 
                        id="description" 
                        name="description" 
                        rows={3} 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Detaillierte Beschreibung der Maßnahme..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Speichern
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasuresList;
