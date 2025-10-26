import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Plus, Edit2, Trash2, Phone, Mail, MapPin,
  User, Crown, Building, Home, Heart, MessageSquare
} from 'lucide-react';
import { PropertyResponse, PropertyContact, ContactRole, getContactRoleLabel } from '../../types/property';
import { propertiesService } from '../../services/properties';
import toast from 'react-hot-toast';

interface ContactsTabProps {
  property: PropertyResponse;
  onUpdate: (updates: Partial<PropertyResponse>) => Promise<void>;
}

interface ContactCardProps {
  contact: PropertyContact;
  onEdit: (contact: PropertyContact) => void;
  onDelete: (contactId: string, role: string) => void;
  isDeleting?: boolean;
}

const ContactCard: React.FC<ContactCardProps> = ({ contact, onEdit, onDelete, isDeleting = false }) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4" />;
      case 'agent': return <Building className="w-4 h-4" />;
      case 'manager': return <User className="w-4 h-4" />;
      case 'tenant': return <Home className="w-4 h-4" />;
      case 'buyer': return <Heart className="w-4 h-4" />;
      case 'interested': return <MessageSquare className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'agent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'manager': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'tenant': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'buyer': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      case 'interested': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              Kontakt #{contact.contact_id.slice(0, 8)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {getContactRoleLabel(contact.role)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {contact.is_primary && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-medium">
              Hauptkontakt
            </span>
          )}
          
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(contact)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => onDelete(contact.contact_id, contact.role)}
              disabled={isDeleting}
              className={`p-1 rounded transition-colors ${
                isDeleting 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-red-100 dark:hover:bg-red-900/30'
              }`}
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-red-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(contact.role)}`}>
          {getRoleIcon(contact.role)}
          <span>{getContactRoleLabel(contact.role)}</span>
        </div>
        
        {contact.notes && (
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            {contact.notes}
          </div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Verknüpft am {new Date(contact.created_at).toLocaleDateString('de-DE')}
        </div>
      </div>
    </motion.div>
  );
};

const ContactsTab: React.FC<ContactsTabProps> = ({ property, onUpdate }) => {
  const [contacts, setContacts] = useState<PropertyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<PropertyContact | null>(null);

  // Load contacts
  useEffect(() => {
    loadContacts();
  }, [property.id]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const data = await propertiesService.getPropertyContacts(property.id);
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Fehler beim Laden der Kontakte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (contactData: { contact_id: string; role: string; is_primary?: boolean; notes?: string }) => {
    try {
      setIsAdding(true);
      await propertiesService.linkContact(property.id, contactData);
      await loadContacts();
      setShowAddModal(false);
      toast.success('Kontakt erfolgreich verknüpft');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Fehler beim Verknüpfen des Kontakts');
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditContact = async (contactData: { contact_id: string; role: string; is_primary?: boolean; notes?: string }) => {
    try {
      setIsEditing(true);
      await propertiesService.linkContact(property.id, contactData);
      await loadContacts();
      setEditingContact(null);
      toast.success('Kontakt erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error editing contact:', error);
      toast.error('Fehler beim Aktualisieren des Kontakts');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteContact = async (contactId: string, role: string) => {
    if (!window.confirm('Möchten Sie diese Kontakt-Verknüpfung wirklich löschen?')) {
      return;
    }

    try {
      setIsDeleting(contactId);
      await propertiesService.unlinkContact(property.id, contactId, role);
      await loadContacts();
      toast.success('Kontakt-Verknüpfung gelöscht');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Fehler beim Löschen der Kontakt-Verknüpfung');
    } finally {
      setIsDeleting(null);
    }
  };

  // Group contacts by role
  const contactsByRole = (contacts || []).reduce((acc, contact) => {
    if (!acc[contact.role]) {
      acc[contact.role] = [];
    }
    acc[contact.role].push(contact);
    return acc;
  }, {} as Record<string, PropertyContact[]>);

  const roleOrder = ['owner', 'agent', 'manager', 'tenant', 'buyer', 'interested', 'contact_person'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Verknüpfte Kontakte
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Verwalten Sie die mit dieser Immobilie verknüpften Kontakte
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Kontakt hinzufügen
        </button>
      </div>

      {/* Contacts by Role */}
      {(contacts || []).length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Kontakte verknüpft
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Fügen Sie Kontakte hinzu, um sie mit dieser Immobilie zu verknüpfen
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ersten Kontakt hinzufügen
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {roleOrder.map((role) => {
            const roleContacts = contactsByRole[role];
            if (!roleContacts || roleContacts.length === 0) return null;

            return (
              <div key={role}>
                <div className="flex items-center space-x-2 mb-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    {getContactRoleLabel(role)}
                  </h4>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                    {roleContacts.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roleContacts.map((contact) => (
                    <ContactCard
                      key={`${contact.contact_id}-${contact.role}`}
                      contact={contact}
                      onEdit={setEditingContact}
                      onDelete={handleDeleteContact}
                      isDeleting={isDeleting === contact.contact_id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddContact}
          isLoading={isAdding}
        />
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSave={handleEditContact}
          isLoading={isEditing}
        />
      )}
    </div>
  );
};

// Add Contact Modal Component
interface AddContactModalProps {
  onClose: () => void;
  onSave: (data: { contact_id: string; role: string; is_primary?: boolean; notes?: string }) => void;
  isLoading?: boolean;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ onClose, onSave, isLoading = false }) => {
  const [formData, setFormData] = useState({
    contact_id: '',
    role: 'contact_person',
    is_primary: false,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Kontakt hinzufügen
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kontakt-ID
            </label>
            <input
              type="text"
              value={formData.contact_id}
              onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Kontakt-ID eingeben"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rolle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="owner">Eigentümer</option>
              <option value="agent">Makler</option>
              <option value="manager">Verwalter</option>
              <option value="tenant">Mieter</option>
              <option value="buyer">Käufer</option>
              <option value="interested">Interessent</option>
              <option value="contact_person">Ansprechpartner</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_primary"
              checked={formData.is_primary}
              onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_primary" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Hauptkontakt für diese Rolle
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notizen
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Optionale Notizen..."
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Wird hinzugefügt...
                </div>
              ) : (
                'Hinzufügen'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Contact Modal Component
interface EditContactModalProps {
  contact: PropertyContact;
  onClose: () => void;
  onSave: (data: { contact_id: string; role: string; is_primary?: boolean; notes?: string }) => void;
  isLoading?: boolean;
}

const EditContactModal: React.FC<EditContactModalProps> = ({ contact, onClose, onSave, isLoading = false }) => {
  const [formData, setFormData] = useState({
    contact_id: contact.contact_id,
    role: contact.role,
    is_primary: contact.is_primary,
    notes: contact.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Kontakt bearbeiten
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rolle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="owner">Eigentümer</option>
              <option value="agent">Makler</option>
              <option value="manager">Verwalter</option>
              <option value="tenant">Mieter</option>
              <option value="buyer">Käufer</option>
              <option value="interested">Interessent</option>
              <option value="contact_person">Ansprechpartner</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_primary"
              checked={formData.is_primary}
              onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_primary" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Hauptkontakt für diese Rolle
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notizen
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Optionale Notizen..."
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Wird gespeichert...
                </div>
              ) : (
                'Speichern'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactsTab;
