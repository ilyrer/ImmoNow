import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact
} from '../../api/hooks';

const ContactsList = ({ user }) => {
  // API Hooks
  const { data: contactsData, isLoading, error, refetch: refetchContacts } = useContacts();
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const deleteContactMutation = useDeleteContact();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('alle');
  const [filterCategory, setFilterCategory] = useState('alle');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    category: '',
    status: 'Lead',
    priority: 'medium',
    location: '',
    value: ''
  });

  // Process contacts data
  const contacts = useMemo(() => {
    // Handle paginated response format
    const items = contactsData?.items || contactsData?.data || contactsData;

    if (!items || !Array.isArray(items)) {
      return [];
    }

    // Transform API data to component format
    return items.map((contact, index) => {

      const processed = {
        id: contact.id,
        name: contact.name || 'Unbekannt',
        phone: contact.phone || '',
        email: contact.email || '',
        category: contact.category || contact.company || '',
        lastContact: contact.last_contact ? new Date(contact.last_contact).toLocaleDateString('de-DE') :
          contact.updated_at ? new Date(contact.updated_at).toLocaleDateString('de-DE') :
            new Date().toLocaleDateString('de-DE'),
        status: contact.status || 'Lead',
        avatar: contact.avatar,
        company: contact.company || '',
        location: contact.location || '',
        budget: contact.budget || contact.budget_max || contact.value || null,
        budget_min: contact.budget_min || null,
        budget_max: contact.budget_max || null,
        value: contact.budget || contact.budget_max ? `€ ${(contact.budget || contact.budget_max).toLocaleString('de-DE')}` : '',
        priority: contact.priority || (contact.lead_score > 50 ? 'high' : 'medium')
      };

      return processed;
    });
  }, [contactsData]);


  // Filterfunktionen
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'alle' || contact.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesCategory = filterCategory === 'alle' || contact.category.toLowerCase().includes(filterCategory.toLowerCase());

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sortierfunktion
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === 'lastContact') {
      aValue = new Date(aValue.split('.').reverse().join('-'));
      bValue = new Date(bValue.split('.').reverse().join('-'));
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Paginierung
  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContacts = sortedContacts.slice(startIndex, startIndex + itemsPerPage);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'kunde':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25';
      case 'interessent':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25';
      case 'lead':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return 'ri-arrow-up-line';
      case 'medium':
        return 'ri-subtract-line';
      case 'low':
        return 'ri-arrow-down-line';
      default:
        return 'ri-subtract-line';
    }
  };

  const toggleContactSelection = (contactId) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const toggleAllContacts = () => {
    if (selectedContacts.size === paginatedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(paginatedContacts.map(c => c.id)));
    }
  };

  // Handler-Funktionen für Bearbeiten und Löschen
  const handleEditContact = (contact) => {
    setEditingContact({ ...contact });
    setShowEditModal(true);
  };

  const handleDeleteContact = (contact) => {
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const handleSaveContact = () => {
    if (editingContact) {
      // Parse value to get budget
      let budget = null;
      if (editingContact.value) {
        const valueStr = editingContact.value.toString().replace(/[^\d.-]/g, '');
        budget = valueStr ? parseFloat(valueStr) : null;
      }

      // Update existing contact
      updateContactMutation.mutate({
        id: editingContact.id,
        data: {
          name: editingContact.name,
          email: editingContact.email,
          phone: editingContact.phone,
          company: editingContact.company,
          category: editingContact.category,
          status: editingContact.status,
          priority: editingContact.priority,
          location: editingContact.location,
          budget: budget
        }
      }, {
        onSuccess: () => {
          setShowEditModal(false);
          setEditingContact(null);
          refetchContacts();
        }
      });
    }
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      deleteContactMutation.mutate(contactToDelete.id, {
        onSuccess: () => {
          setShowDeleteModal(false);
          setContactToDelete(null);
          setSelectedContacts(prev => {
            const newSet = new Set(prev);
            newSet.delete(contactToDelete.id);
            return newSet;
          });
        }
      });
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingContact(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setContactToDelete(null);
  };

  const updateEditingContact = (field, value) => {
    setEditingContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNewContact = (field, value) => {
    setNewContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateContact = () => {
    // Validate required fields
    if (!newContact.name || !newContact.email || !newContact.phone) {
      alert('Name, E-Mail und Telefon sind Pflichtfelder');
      return;
    }

    // Parse value to get budget
    let budget = null;
    if (newContact.value) {
      const valueStr = newContact.value.toString().replace(/[^\d.-]/g, '');
      budget = valueStr ? parseFloat(valueStr) : null;
    }

    createContactMutation.mutate({
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      company: newContact.company || undefined,
      category: newContact.category || undefined,
      status: newContact.status || 'Lead',
      priority: newContact.priority || 'medium',
      location: newContact.location || undefined,
      budget: budget,
      budget_currency: 'EUR',
      preferences: {}
    }, {
      onSuccess: () => {
        setShowNewContactModal(false);
        setNewContact({
          name: '',
          email: '',
          phone: '',
          company: '',
          category: '',
          status: 'Lead',
          priority: 'medium',
          location: '',
          value: ''
        });
        refetchContacts();
      }
    });
  };

  const handleExportContacts = () => {
    const exportData = filteredContacts.map(contact => ({
      Name: contact.name,
      Email: contact.email,
      Telefon: contact.phone,
      Unternehmen: contact.company,
      Kategorie: contact.category,
      Status: contact.status,
      Priorität: contact.priority,
      Standort: contact.location,
      Wert: contact.value,
      'Letzter Kontakt': contact.lastContact
    }));

    const csvContent = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kontakte_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check authentication
  const isAuthenticated = !!localStorage.getItem('access_token');

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Kontakte werden geladen...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Fehler beim Laden der Kontakte
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {error.message || 'Es ist ein unbekannter Fehler aufgetreten'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header mit Glassmorphism */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-10 dark:opacity-20"></div>
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Kontakte
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Verwalten Sie Ihre {contacts.length} Kunden und Interessenten
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50 dark:border-gray-600/50">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'table'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  Tabelle
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  Karten
                </button>
              </div>

              <button
                onClick={() => setShowNewContactModal(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                Neuer Kontakt
              </button>

              <button
                onClick={handleExportContacts}
                className="px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-sm"
              >
                Exportieren
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Erweiterte Filter und Suche */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Erweiterte Suchleiste */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              placeholder="Nach Name, E-Mail, Telefon oder Firma suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="alle">Alle Status</option>
              <option value="kunde">Kunde</option>
              <option value="interessent">Interessent</option>
              <option value="lead">Lead</option>
            </select>
          </div>

          {/* Kategorie Filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="alle">Alle Kategorien</option>
              <option value="eigentümer">Eigentümer</option>
              <option value="kaufinteressent">Kaufinteressent</option>
              <option value="bauträger">Bauträger</option>
              <option value="mieter">Mieter</option>
            </select>
          </div>

          {/* Sortierung */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="lastContact-desc">Neueste zuerst</option>
              <option value="lastContact-asc">Älteste zuerst</option>
            </select>
          </div>
        </div>

        {/* Aktive Filter Anzeige */}
        {(searchTerm || filterStatus !== 'alle' || filterCategory !== 'alle') && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                Suche: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                >
                  ×
                </button>
              </span>
            )}
            {filterStatus !== 'alle' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                Status: {filterStatus}
                <button
                  onClick={() => setFilterStatus('alle')}
                  className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                >
                  ×
                </button>
              </span>
            )}
            {filterCategory !== 'alle' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300">
                Kategorie: {filterCategory}
                <button
                  onClick={() => setFilterCategory('alle')}
                  className="ml-2 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-200"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Kontakte Anzeige */}
      {!isLoading && !error && (!contacts || contacts.length === 0) && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <i className="ri-contacts-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Keine Kontakte gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Es sind noch keine Kontakte in der Datenbank vorhanden oder sie konnten nicht geladen werden.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewContactModal(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                Ersten Kontakt erstellen
              </button>
              <button
                onClick={() => refetchContacts()}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kontakte Anzeige */}
      {contacts && contacts.length > 0 && (
        <>
          {viewMode === 'table' ? (
            /* Tabellen-Ansicht */
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedContacts.size === paginatedContacts.length && paginatedContacts.length > 0}
                          onChange={toggleAllContacts}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Kontakt
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Unternehmen
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Kontaktdaten
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Wert
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Priorität
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {paginatedContacts.map((contact, index) => (
                      <tr
                        key={contact.id}
                        className="group hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 dark:hover:from-indigo-900/10 dark:hover:to-purple-900/10 transition-all duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedContacts.has(contact.id)}
                            onChange={() => toggleContactSelection(contact.id)}
                            className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center group">
                            <div className="flex-shrink-0 h-12 w-12 relative">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 transform group-hover:scale-105">
                                <span className="text-sm font-bold text-white">
                                  {getInitials(contact.name)}
                                </span>
                              </div>
                              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center ${contact.priority === 'high' ? 'bg-red-500' : contact.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                                <i className={`${getPriorityIcon(contact.priority)} text-xs text-white`}></i>
                              </div>
                            </div>
                            <div className="ml-4">
                              <Link
                                to={`/contacts/${contact.id}`}
                                className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                              >
                                {contact.name}
                              </Link>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white font-medium">{contact.company}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{contact.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {contact.phone && (
                              <div className="flex items-center text-sm text-gray-900 dark:text-gray-300">
                                <i className="ri-phone-line mr-2 text-gray-400"></i>
                                {contact.phone}
                              </div>
                            )}
                            <div className="flex items-center text-sm">
                              <i className="ri-mail-line mr-2 text-gray-400"></i>
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-200"
                              >
                                {contact.email}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(contact.status)} transform hover:scale-105 transition-transform duration-200`}>
                            {contact.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {(() => {
                              // Prioritize new budget field
                              if (contact.budget) {
                                return `€${contact.budget.toLocaleString('de-DE')}`;
                              } else if (contact.budget_min && contact.budget_max) {
                                return `€${contact.budget_min.toLocaleString('de-DE')} - €${contact.budget_max.toLocaleString('de-DE')}`;
                              } else if (contact.budget_max) {
                                return `bis zu €${contact.budget_max.toLocaleString('de-DE')}`;
                              } else if (contact.budget_min) {
                                return `ab €${contact.budget_min.toLocaleString('de-DE')}`;
                              } else if (contact.value) {
                                return contact.value;
                              } else {
                                return 'Nicht angegeben';
                              }
                            })()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Potenzialwert</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${getPriorityColor(contact.priority)}`}>
                            <i className={`${getPriorityIcon(contact.priority)} mr-1`}></i>
                            <span className="text-sm font-medium capitalize">{contact.priority}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Link
                              to={`/contacts/${contact.id}`}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-200 transform hover:scale-110"
                              title="Details anzeigen"
                            >
                              <i className="ri-eye-line text-lg"></i>
                            </Link>
                            <button
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors duration-200 transform hover:scale-110"
                              title="Bearbeiten"
                              onClick={() => handleEditContact(contact)}
                            >
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                            <button
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200 transform hover:scale-110"
                              title="Löschen"
                              onClick={() => handleDeleteContact(contact)}
                            >
                              <i className="ri-delete-bin-line text-lg"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid-Ansicht */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Prioritäts-Indikator */}
                  <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${contact.priority === 'high' ? 'bg-red-500' : contact.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'} shadow-lg`}></div>

                  {/* Avatar und Name */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                        <span className="text-lg font-bold text-white">
                          {getInitials(contact.name)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/contacts/${contact.id}`}
                        className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 block truncate"
                      >
                        {contact.name}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{contact.company}</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(contact.status)}`}>
                      {contact.status}
                    </span>
                  </div>

                  {/* Kontaktinformationen */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <i className="ri-map-pin-line mr-2 text-gray-400"></i>
                      <span className="truncate">{contact.location}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <i className="ri-phone-line mr-2 text-gray-400"></i>
                        <span className="truncate">{contact.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <i className="ri-mail-line mr-2 text-gray-400"></i>
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-200 truncate"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>

                  {/* Wert */}
                  <div className="mb-4">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {(() => {
                        // Prioritize new budget field
                        if (contact.budget) {
                          return `€${contact.budget.toLocaleString('de-DE')}`;
                        } else if (contact.budget_min && contact.budget_max) {
                          return `€${contact.budget_min.toLocaleString('de-DE')} - €${contact.budget_max.toLocaleString('de-DE')}`;
                        } else if (contact.budget_max) {
                          return `bis zu €${contact.budget_max.toLocaleString('de-DE')}`;
                        } else if (contact.budget_min) {
                          return `ab €${contact.budget_min.toLocaleString('de-DE')}`;
                        } else if (contact.value) {
                          return contact.value;
                        } else {
                          return 'Nicht angegeben';
                        }
                      })()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Potenzialwert</div>
                  </div>

                  {/* Aktionen */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/contacts/${contact.id}`}
                        className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200"
                        title="Details anzeigen"
                      >
                        <i className="ri-eye-line"></i>
                      </Link>
                      <button
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                        title="Bearbeiten"
                        onClick={() => handleEditContact(contact)}
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {contact.lastContact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Erweiterte Paginierung */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Zeige <span className="font-semibold">{startIndex + 1}</span> bis <span className="font-semibold">{Math.min(startIndex + itemsPerPage, sortedContacts.length)}</span> von <span className="font-semibold">{sortedContacts.length}</span> Kontakten
                </div>
                {selectedContacts.size > 0 && (
                  <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    {selectedContacts.size} ausgewählt
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  <i className="ri-arrow-left-line mr-1"></i>
                  Zurück
                </button>

                {/* Seitenzahlen */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else {
                      const start = Math.max(1, currentPage - 2);
                      const end = Math.min(totalPages, start + 4);
                      page = start + i;
                      if (page > end) return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-105 ${currentPage === page
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800'
                          }`}
                      >
                        {page}
                      </button>
                    );
                  }).filter(Boolean)}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  Weiter
                  <i className="ri-arrow-right-line ml-1"></i>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bearbeitungs-Modal */}
      {showEditModal && editingContact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <i className="ri-edit-line mr-2 text-indigo-600 dark:text-indigo-400"></i>
                  Kontakt bearbeiten
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <i className="ri-close-line text-gray-500 dark:text-gray-400"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingContact.name}
                    onChange={(e) => updateEditingContact('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    value={editingContact.email}
                    onChange={(e) => updateEditingContact('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={editingContact.phone}
                    onChange={(e) => updateEditingContact('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unternehmen
                  </label>
                  <input
                    type="text"
                    value={editingContact.company}
                    onChange={(e) => updateEditingContact('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={editingContact.status}
                    onChange={(e) => updateEditingContact('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Interessent">Interessent</option>
                    <option value="Kunde">Kunde</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priorität
                  </label>
                  <select
                    value={editingContact.priority}
                    onChange={(e) => updateEditingContact('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategorie
                </label>
                <input
                  type="text"
                  value={editingContact.category}
                  onChange={(e) => updateEditingContact('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="z.B. Eigentümer, Kaufinteressent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Standort
                </label>
                <input
                  type="text"
                  value={editingContact.location}
                  onChange={(e) => updateEditingContact('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Potenzialwert
                </label>
                <input
                  type="text"
                  value={editingContact.value}
                  onChange={(e) => updateEditingContact('value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="z.B. € 500.000"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveContact}
                  disabled={updateContactMutation.isPending}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {updateContactMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Speichern...
                    </>
                  ) : (
                    'Speichern'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lösch-Bestätigungs-Modal */}
      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <i className="ri-delete-bin-line text-2xl text-red-600 dark:text-red-400"></i>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
                Kontakt löschen
              </h3>

              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Sind Sie sicher, dass Sie <strong>{contactToDelete.name}</strong> löschen möchten?
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteContactMutation.isPending}
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {deleteContactMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Löschen...
                    </>
                  ) : (
                    'Löschen'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Neuer Kontakt Modal */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <i className="ri-user-add-line mr-2 text-indigo-600 dark:text-indigo-400"></i>
                  Neuen Kontakt erstellen
                </h3>
                <button
                  onClick={() => setShowNewContactModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <i className="ri-close-line text-gray-500 dark:text-gray-400"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => updateNewContact('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => updateNewContact('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => updateNewContact('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unternehmen
                  </label>
                  <input
                    type="text"
                    value={newContact.company}
                    onChange={(e) => updateNewContact('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={newContact.status}
                    onChange={(e) => updateNewContact('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Interessent">Interessent</option>
                    <option value="Kunde">Kunde</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priorität
                  </label>
                  <select
                    value={newContact.priority}
                    onChange={(e) => updateNewContact('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategorie
                </label>
                <input
                  type="text"
                  value={newContact.category}
                  onChange={(e) => updateNewContact('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="z.B. Eigentümer, Kaufinteressent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Standort
                </label>
                <input
                  type="text"
                  value={newContact.location}
                  onChange={(e) => updateNewContact('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Potenzialwert
                </label>
                <input
                  type="text"
                  value={newContact.value}
                  onChange={(e) => updateNewContact('value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="z.B. € 500.000"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowNewContactModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateContact}
                  disabled={!newContact.name || !newContact.email || createContactMutation.isPending}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {createContactMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Erstellen...
                    </>
                  ) : (
                    'Erstellen'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsList; 
