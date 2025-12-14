/**
 * Location Management - Admin interface for managing cities/locations
 */
import React, { useState, useEffect } from 'react';
import {
    MapPin, Plus, Edit2, Trash2, Search, Save, X,
    Building2, TrendingUp, Settings, AlertCircle
} from 'lucide-react';
import { locationService } from 'services/location';
import {
    LocationMarketData,
    LocationCreate,
    LocationUpdate
} from 'types/location';

const LocationManagement: React.FC = () => {
    const [locations, setLocations] = useState<LocationMarketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingLocation, setEditingLocation] = useState<LocationMarketData | null>(null);
    const [formData, setFormData] = useState<LocationCreate>({
        city: '',
        state: '',
        country: 'Deutschland',
        postal_code_start: '',
        postal_code_end: '',
        base_price_per_sqm: 3000,
        is_premium_location: false,
        is_suburban: false,
        population: undefined,
        location_type: 'city',
        is_active: true
    });

    useEffect(() => {
        loadLocations();
    }, [searchQuery]);

    const loadLocations = async () => {
        try {
            setLoading(true);
            const response = await locationService.listLocations(
                1,
                100,
                searchQuery || undefined
            );
            setLocations(response.items);
        } catch (error) {
            console.error('Error loading locations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await locationService.createLocation(formData);
            setShowAddModal(false);
            resetForm();
            loadLocations();
        } catch (error) {
            console.error('Error creating location:', error);
            alert('Fehler beim Erstellen der Location');
        }
    };

    const handleUpdate = async () => {
        if (!editingLocation) return;

        try {
            await locationService.updateLocation(editingLocation.id, formData as LocationUpdate);
            setEditingLocation(null);
            resetForm();
            loadLocations();
        } catch (error) {
            console.error('Error updating location:', error);
            alert('Fehler beim Aktualisieren der Location');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Möchten Sie diese Location wirklich löschen?')) return;

        try {
            await locationService.deleteLocation(id, false);
            loadLocations();
        } catch (error) {
            console.error('Error deleting location:', error);
            alert('Fehler beim Löschen der Location');
        }
    };

    const openEditModal = (location: LocationMarketData) => {
        setEditingLocation(location);
        setFormData({
            city: location.city,
            state: location.state || '',
            country: location.country,
            postal_code_start: location.postal_code_start || '',
            postal_code_end: location.postal_code_end || '',
            base_price_per_sqm: location.base_price_per_sqm,
            is_premium_location: location.is_premium_location,
            is_suburban: location.is_suburban,
            population: location.population || undefined,
            location_type: location.location_type,
            is_active: location.is_active
        });
        setShowAddModal(true);
    };

    const resetForm = () => {
        setFormData({
            city: '',
            state: '',
            country: 'Deutschland',
            postal_code_start: '',
            postal_code_end: '',
            base_price_per_sqm: 3000,
            is_premium_location: false,
            is_suburban: false,
            population: undefined,
            location_type: 'city',
            is_active: true
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-6 h-6" />
                        Standortverwaltung
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Städte, Dörfer und Marktpreise verwalten
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingLocation(null);
                        setShowAddModal(true);
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Neue Location
                </button>
            </div>

            {/* Search */}
            <div className="glass rounded-xl p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Suche nach Stadt, PLZ oder Bundesland..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Location List */}
            <div className="glass rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Stadt
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Bundesland
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    PLZ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Preis/m²
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Typ
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Aktionen
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Lade Locations...
                                    </td>
                                </tr>
                            ) : locations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Keine Locations gefunden
                                    </td>
                                </tr>
                            ) : (
                                locations.map((location) => (
                                    <tr key={location.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {location.city}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {location.state || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {location.postal_code_start || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                €{location.base_price_per_sqm.toLocaleString()}
                                            </div>
                                            {location.is_premium_location && (
                                                <span className="text-xs text-yellow-600">Premium +20%</span>
                                            )}
                                            {location.is_suburban && (
                                                <span className="text-xs text-gray-500">Suburban -5%</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${location.location_type === 'metropolis' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                location.location_type === 'city' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    location.location_type === 'town' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                }`}>
                                                {location.location_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${location.is_active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                }`}>
                                                {location.is_active ? 'Aktiv' : 'Inaktiv'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openEditModal(location)}
                                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(location.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingLocation ? 'Location bearbeiten' : 'Neue Location hinzufügen'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setEditingLocation(null);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Stadt *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="z.B. München"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Bundesland
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="z.B. Bayern"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        PLZ Start
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.postal_code_start}
                                        onChange={(e) => setFormData({ ...formData, postal_code_start: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="80000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        PLZ Ende
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.postal_code_end}
                                        onChange={(e) => setFormData({ ...formData, postal_code_end: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="81999"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Basispreis pro m² *
                                </label>
                                <input
                                    type="number"
                                    value={formData.base_price_per_sqm}
                                    onChange={(e) => setFormData({ ...formData, base_price_per_sqm: Number(e.target.value) })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    placeholder="3000"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Typ
                                    </label>
                                    <select
                                        value={formData.location_type}
                                        onChange={(e) => setFormData({ ...formData, location_type: e.target.value as any })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="metropolis">Metropole (&gt;1M)</option>
                                        <option value="city">Großstadt (&gt;100k)</option>
                                        <option value="town">Stadt (&gt;10k)</option>
                                        <option value="village">Dorf/Gemeinde</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Einwohnerzahl
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.population || ''}
                                        onChange={(e) => setFormData({ ...formData, population: e.target.value ? Number(e.target.value) : undefined })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_premium_location}
                                        onChange={(e) => setFormData({ ...formData, is_premium_location: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Premium Location (+20% auf Preis)
                                    </span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_suburban}
                                        onChange={(e) => setFormData({ ...formData, is_suburban: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Vorstadtlage (-5% auf Preis)
                                    </span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        Aktiv (für AVM-Berechnungen verwenden)
                                    </span>
                                </label>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={editingLocation ? handleUpdate : handleCreate}
                                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    {editingLocation ? 'Aktualisieren' : 'Erstellen'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setEditingLocation(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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

export default LocationManagement;
