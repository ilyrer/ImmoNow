/**
 * Matching & Recommendations View
 * KI-basiertes Kunden-Immobilien-Matching
 */

import React, { useState, useEffect } from 'react';
import { Users, Home, TrendingUp, Target, Star, ArrowRight } from 'lucide-react';
import { CustomerProfile, PropertyListing, MatchRecommendation } from '../../types/matching';
import { apiClient } from '../../lib/api/client';

const MatchingView: React.FC = () => {
  const [view, setView] = useState<'customer-to-property' | 'property-to-customer'>('customer-to-property');
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyListing | null>(null);
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const props = await apiClient.get<any>(`/api/v1/properties?size=20`);
        setProperties((props.items || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          address: p.address?.street || p.location || '',
          city: p.address?.city || '',
          price: p.price || 0,
          size: p.living_area || 0,
          status: p.status || 'available',
        })));

        const contacts = await apiClient.get<any>(`/api/v1/contacts?size=20`);
        setCustomers((contacts.items || []).map((c: any) => ({
          id: c.id,
          firstName: c.name?.split(' ')[0] || c.name,
          lastName: c.name?.split(' ').slice(1).join(' ') || '',
          email: c.email || '',
          status: c.status || 'lead',
          budget: { min: c.budget_min || 0, max: c.budget || c.budget_max || 0 },
          preferences: [],
        })));
      } catch (e) {
        console.error('Fehler beim Laden von Daten:', e);
      }
    })();
  }, []);

  const handleCustomerSelect = async (customer: CustomerProfile) => {
    setSelectedCustomer(customer);
    setLoading(true);
    try {
      const recs = await apiClient.get<any>(`/api/v1/contacts/${customer.id}/matching-properties?limit=10`);
      const mapped: MatchRecommendation[] = (recs || []).map((p: any, idx: number) => ({
        id: p.id,
        rank: idx + 1,
        matchScore: 70, // Basiswert, kann später über Server-Score ersetzt werden
        matchReason: 'Budget-Fit (±10%) und Status aktiv',
        matchDetails: [
          { criterion: 'Budget Fit', score: 85, status: 'match', description: 'Preis innerhalb des Budgets' },
        ],
        property: {
          id: p.id,
          title: p.title,
          address: p.address?.street || p.location || '',
          city: p.address?.city || '',
          price: p.price || 0,
          size: p.living_area || 0,
          status: p.status || 'available',
        },
      }));
      setRecommendations(mapped);
    } catch (e) {
      console.error('Fehler beim Matching:', e);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = async (property: PropertyListing) => {
    setSelectedProperty(property);
    setLoading(true);
    try {
      const recs = await apiClient.get<any>(`/api/v1/properties/${property.id}/matching-contacts?limit=10`);
      const mapped: MatchRecommendation[] = (recs || []).map((c: any, idx: number) => ({
        id: c.id,
        rank: idx + 1,
        matchScore: 70,
        matchReason: 'Budget-Fit (±10%) und Lead-Score',
        matchDetails: [
          { criterion: 'Lead Score', score: Math.min(100, (c.lead_score || 50)), status: 'partial', description: 'Qualität des Leads' },
        ],
        customer: {
          id: c.id,
          firstName: (c.name || '').split(' ')[0] || c.name,
          lastName: (c.name || '').split(' ').slice(1).join(' ') || '',
          email: c.email || '',
          status: c.status || 'lead',
          budget: { min: c.budget_min || 0, max: c.budget || c.budget_max || 0 },
          preferences: [],
        },
      }));
      setRecommendations(mapped);
    } catch (e) {
      console.error('Fehler beim Matching:', e);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (score >= 70) return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
    return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'lead': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      'active': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'viewing': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      'offer': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'available': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'reserved': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'sold': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    };
    return colors[status] || colors.lead;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6" />
            KI-Matching & Empfehlungen
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Intelligente Zuordnung von Kunden und Immobilien
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setView('customer-to-property')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'customer-to-property'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Kunde → Immobilie
          </button>
          <button
            onClick={() => setView('property-to-customer')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'property-to-customer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Home className="w-4 h-4 inline mr-2" />
            Immobilie → Kunde
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Liste links */}
        <div className="col-span-5 glass rounded-xl p-6 max-h-[800px] overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {view === 'customer-to-property' ? 'Kunden' : 'Immobilien'}
          </h2>
          
          {view === 'customer-to-property' ? (
            <div className="space-y-3">
              {customers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`glass p-4 rounded-lg cursor-pointer transition hover:shadow-lg ${
                    selectedCustomer?.id === customer.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {customer.firstName} {customer.lastName}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(customer.status)}`}>
                      {customer.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Budget: {customer.budget.min.toLocaleString()} - {customer.budget.max.toLocaleString()} €</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {customer.preferences.slice(0, 3).map(pref => (
                        <span key={pref.id} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          {typeof pref.value === 'object' ? pref.label : pref.value}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {properties.filter(p => p.status === 'available').map(property => (
                <div
                  key={property.id}
                  onClick={() => handlePropertySelect(property)}
                  className={`glass p-4 rounded-lg cursor-pointer transition hover:shadow-lg ${
                    selectedProperty?.id === property.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {property.title}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(property.status)}`}>
                      {property.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div>{property.address}, {property.city}</div>
                    <div className="font-semibold text-gray-900 dark:text-white mt-1">
                      {property.price.toLocaleString()} € | {property.size} m²
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empfehlungen rechts */}
        <div className="col-span-7 glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Empfohlene {view === 'customer-to-property' ? 'Immobilien' : 'Kunden'}
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Analyse läuft...</p>
              </div>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Wählen Sie {view === 'customer-to-property' ? 'einen Kunden' : 'eine Immobilie'}</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto">
              {recommendations.map(rec => (
                <div key={rec.id} className="glass p-5 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          #{rec.rank}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(rec.matchScore)}`}>
                          {rec.matchScore}% Match
                        </span>
                      </div>
                      {rec.property && (
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{rec.property.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{rec.property.address}, {rec.property.city}</p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {rec.property.price.toLocaleString()} €
                          </p>
                        </div>
                      )}
                      {rec.customer && (
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {rec.customer.firstName} {rec.customer.lastName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{rec.customer.email}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Budget: {rec.customer.budget.min.toLocaleString()} - {rec.customer.budget.max.toLocaleString()} €
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 italic">
                    {rec.matchReason}
                  </p>

                  <div className="space-y-2">
                    {rec.matchDetails.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {detail.criterion}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              detail.status === 'match' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              detail.status === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {detail.score}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                detail.score >= 80 ? 'bg-green-500' :
                                detail.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${detail.score}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{detail.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                    Kontakt aufnehmen
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingView;
