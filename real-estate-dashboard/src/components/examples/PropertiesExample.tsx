/**
 * Example Component showing API Integration
 * This demonstrates how to use the new React Query hooks
 */

import React, { useState } from 'react';
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty } from '../../api/hooks';
import { useDashboardAnalytics } from '../../api/hooks';
import type { CreatePropertyRequest, UpdatePropertyRequest } from '../../api/types.gen';

const PropertiesExample: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Use React Query hooks
  const { data: properties, isLoading, error } = useProperties({
    page,
    size: 10,
    search,
    sort_by: 'created_at',
    sort_order: 'desc'
  });
  
  const { data: analytics } = useDashboardAnalytics();
  
  const createPropertyMutation = useCreateProperty();
  const updatePropertyMutation = useUpdateProperty();
  const deletePropertyMutation = useDeleteProperty();
  
  const handleCreateProperty = async () => {
    const newProperty: CreatePropertyRequest = {
      title: 'Neue Immobilie',
      description: 'Beschreibung der Immobilie',
      property_type: 'apartment' as any,
      price: 250000,
      location: 'Berlin',
      living_area: 80,
      rooms: 3,
      bathrooms: 1,
      year_built: 2020
    };
    
    try {
      await createPropertyMutation.mutateAsync(newProperty);
      // Success is handled automatically by React Query
    } catch (error) {
      console.error('Failed to create property:', error);
    }
  };
  
  const handleUpdateProperty = async (id: string) => {
    const updateData: UpdatePropertyRequest = {
      title: 'Aktualisierte Immobilie',
      price: 275000
    };
    
    try {
      await updatePropertyMutation.mutateAsync({ id, data: updateData });
    } catch (error) {
      console.error('Failed to update property:', error);
    }
  };
  
  const handleDeleteProperty = async (id: string) => {
    if (window.confirm('Möchten Sie diese Immobilie wirklich löschen?')) {
      try {
        await deletePropertyMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete property:', error);
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Lade Immobilien...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Fehler beim Laden der Immobilien: {error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Immobilien</h1>
        
        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Gesamt</h3>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_properties}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Aktiv</h3>
              <p className="text-2xl font-bold text-green-600">{analytics.active_properties}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Kontakte</h3>
              <p className="text-2xl font-bold text-blue-600">{analytics.total_contacts}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Aufgaben</h3>
              <p className="text-2xl font-bold text-purple-600">{analytics.total_tasks}</p>
            </div>
          </div>
        )}
        
        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Immobilien durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleCreateProperty}
            disabled={createPropertyMutation.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {createPropertyMutation.isPending ? 'Erstelle...' : 'Neue Immobilie'}
          </button>
        </div>
      </div>
      
      {/* Properties List */}
      {properties && (
        <div className="space-y-4">
          {properties.items.map((property) => (
            <div key={property.id} className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                  <p className="text-gray-600 mt-1">{property.description}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{property.property_type}</span>
                    <span>{property.location}</span>
                    <span>{property.rooms} Zimmer</span>
                    <span>{property.living_area}m²</span>
                    {property.price && (
                      <span className="font-semibold text-green-600">
                        {property.price.toLocaleString('de-DE')}€
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdateProperty(property.id)}
                    disabled={updatePropertyMutation.isPending}
                    className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDeleteProperty(property.id)}
                    disabled={deletePropertyMutation.isPending}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {properties.pages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Zurück
              </button>
              <span className="px-3 py-2">
                Seite {page} von {properties.pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === properties.pages}
                className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Weiter
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Empty State */}
      {properties && properties.items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Keine Immobilien gefunden</p>
          <p className="text-gray-400 mt-2">
            {search ? 'Versuchen Sie eine andere Suche.' : 'Erstellen Sie Ihre erste Immobilie.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertiesExample;
