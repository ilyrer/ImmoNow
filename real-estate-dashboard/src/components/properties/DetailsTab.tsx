import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, Ruler, Bed, Bath, Car, Flame, Zap, MapPin, 
  Edit2, Save, X, Building2, Euro, Tag, FileText, Map
} from 'lucide-react';
import { PropertyResponse } from '../../types/property';
import { propertiesService } from '../../services/properties';
import { toast } from 'react-hot-toast';

interface EditableFieldProps {
  label: string;
  value: string | number | null | undefined;
  field: string;
  type?: 'text' | 'number' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  icon?: React.ComponentType<{ className?: string }>;
  onUpdate: (field: string, value: any) => Promise<void>;
  globalEditMode?: boolean;
  pendingValue?: any;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  label, 
  value, 
  field, 
  type = 'text', 
  options, 
  icon, 
  onUpdate,
  globalEditMode = false,
  pendingValue
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');

  // Update editValue when value changes or when pendingValue changes
  React.useEffect(() => {
    const currentValue = pendingValue !== undefined ? pendingValue : value;
    setEditValue(currentValue?.toString() || '');
  }, [value, pendingValue]);

  const handleSave = async () => {
    console.log('🔍 EditableField: handleSave called', { field, editValue, type });
    try {
      // Convert value to appropriate type
      let finalValue: any = editValue;
      if (type === 'number') {
        finalValue = editValue ? parseFloat(editValue) : null;
      }
      
      console.log('🔍 EditableField: Calling onUpdate with', { field, finalValue });
      await onUpdate(field, finalValue);
      console.log('🔍 EditableField: onUpdate completed');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // In global edit mode, always show editing interface
  const showEditing = isEditing || globalEditMode;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group relative"
    >
      <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-2xl p-6 shadow-lg shadow-primary-500/5 hover:bg-white/70 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {icon && (
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25"
              >
                {React.createElement(icon, { className: "w-6 h-6 text-white" })}
              </motion.div>
            )}
            <div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                {label}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {showEditing ? (
                  <div className="flex items-center space-x-2">
                    {type === 'select' && options ? (
                      <select
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="px-3 py-1 border border-primary-200 dark:border-primary-700 rounded-lg bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      >
                        {options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : type === 'textarea' ? (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="px-3 py-1 border border-primary-200 dark:border-primary-700 rounded-lg bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-200"
                        rows={2}
                        autoFocus={!globalEditMode}
                      />
                    ) : (
                      <input
                        type={type}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="px-3 py-1 border border-primary-200 dark:border-primary-700 rounded-lg bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        autoFocus={!globalEditMode}
                      />
                    )}
                  </div>
                ) : (
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {(pendingValue !== undefined ? pendingValue : value) || 'Nicht angegeben'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {!showEditing && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-all duration-200"
            >
              <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </motion.button>
          )}
          
          {showEditing && !globalEditMode && (
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                className="p-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors shadow-lg shadow-accent-500/25"
              >
                <Save className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCancel}
                className="p-2 bg-neutral-500 hover:bg-neutral-600 text-white rounded-lg transition-colors shadow-lg shadow-neutral-500/25"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface DetailsTabProps {
  property: PropertyResponse;
  isEditing?: boolean;
  onUpdate: (updates: Partial<PropertyResponse>) => Promise<void>;
  globalEditMode?: boolean;
  onGlobalEditToggle?: () => void;
}

interface FieldConfig {
  label: string;
  value: string | number | null | undefined;
  field: string;
  type?: 'text' | 'number' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  icon?: React.ComponentType<{ className?: string }>;
}

interface SectionConfig {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: FieldConfig[];
}

const DetailsTab: React.FC<DetailsTabProps> = ({ 
  property, 
  isEditing, 
  onUpdate, 
  globalEditMode = false, 
  onGlobalEditToggle 
}) => {
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});

  const handleFieldUpdate = async (field: string, value: any) => {
    console.log('🔍 DetailsTab: handleFieldUpdate called', { field, value, globalEditMode });
    try {
      if (globalEditMode) {
        // Im globalen Modus sammeln wir die Änderungen
        console.log('🔍 DetailsTab: Adding to pending changes', { field, value });
        setPendingChanges(prev => ({
          ...prev,
          [field]: value
        }));
      } else {
        // Im einzelnen Modus sofort speichern
        const updates: any = {};
        
        // Handle nested fields like address.street
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          const parentValue = property[parent as keyof PropertyResponse] as any;
          updates[parent] = {
            ...(parentValue || {}),
            [child]: value
          };
        } else {
          updates[field] = value;
        }
        
        console.log('🔍 DetailsTab: Calling onUpdate with', updates);
        await onUpdate(updates);
        console.log('🔍 DetailsTab: onUpdate completed successfully');
      }
    } catch (error) {
      console.error('Error updating field:', error);
    }
  };

  const handleGlobalEditEnd = async () => {
    try {
      if (Object.keys(pendingChanges).length > 0) {
        // Alle gesammelten Änderungen verarbeiten
        const updates: any = {};
        const changesCount = Object.keys(pendingChanges).length;
        
        Object.entries(pendingChanges).forEach(([field, value]) => {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            const parentValue = property[parent as keyof PropertyResponse] as any;
            
            // Sicherstellen, dass das parent-Objekt existiert
            if (!updates[parent]) {
              updates[parent] = { ...(parentValue || {}) };
            }
            updates[parent][child] = value;
          } else {
            updates[field] = value;
          }
        });
        
        console.log('Saving global changes:', updates);
        await onUpdate(updates);
        setPendingChanges({});
        
        // Success Toast
        toast.success(`${changesCount} Änderungen erfolgreich gespeichert`);
      }
      
      // Bearbeitungsmodus beenden
      if (onGlobalEditToggle) {
        onGlobalEditToggle();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Fehler beim Speichern der Änderungen');
    }
  };

  const sections: SectionConfig[] = [
    {
      title: 'Grunddaten',
      icon: Home,
      fields: [
        {
          label: 'Immobilientyp',
          value: property.property_type,
          field: 'property_type',
          type: 'select',
          options: [
            { value: 'apartment', label: 'Wohnung' },
            { value: 'house', label: 'Haus' },
            { value: 'commercial', label: 'Gewerbe' },
            { value: 'land', label: 'Grundstück' },
          ],
          icon: Building2,
        },
        {
          label: 'Zimmer',
          value: property.rooms,
          field: 'rooms',
          type: 'number',
          icon: Home,
        },
        {
          label: 'Schlafzimmer',
          value: property.bedrooms,
          field: 'bedrooms',
          type: 'number',
          icon: Bed,
        },
        {
          label: 'Badezimmer',
          value: property.bathrooms,
          field: 'bathrooms',
          type: 'number',
          icon: Bath,
        },
        {
          label: 'Wohnfläche',
          value: property.living_area,
          field: 'living_area',
          type: 'number',
          icon: Ruler,
        },
        {
          label: 'Gesamtfläche',
          value: property.total_area,
          field: 'total_area',
          type: 'number',
          icon: Ruler,
        },
        {
          label: 'Grundstücksfläche',
          value: property.plot_area,
          field: 'plot_area',
          type: 'number',
          icon: Ruler,
        },
        {
          label: 'Etagen',
          value: property.floors,
          field: 'floors',
          type: 'number',
          icon: Building2,
        },
      ],
    },
    {
      title: 'Standort',
      icon: MapPin,
      fields: [
        {
          label: 'Straße',
          value: property.address?.street,
          field: 'address.street',
          icon: MapPin,
        },
        {
          label: 'PLZ',
          value: property.address?.zip_code,
          field: 'address.zip_code',
          icon: MapPin,
        },
        {
          label: 'Stadt',
          value: property.address?.city,
          field: 'address.city',
          icon: MapPin,
        },
        {
          label: 'Bundesland',
          value: property.address?.state,
          field: 'address.state',
          icon: MapPin,
        },
        {
          label: 'Land',
          value: property.address?.country,
          field: 'address.country',
          icon: MapPin,
        },
      ],
    },
    {
      title: 'Energie & Technik',
      icon: Zap,
      fields: [
        {
          label: 'Energieklasse',
          value: property.energy_class,
          field: 'energy_class',
          type: 'select',
          options: [
            { value: 'A+', label: 'A+' },
            { value: 'A', label: 'A' },
            { value: 'B', label: 'B' },
            { value: 'C', label: 'C' },
            { value: 'D', label: 'D' },
            { value: 'E', label: 'E' },
            { value: 'F', label: 'F' },
            { value: 'G', label: 'G' },
            { value: 'H', label: 'H' },
          ],
          icon: Zap,
        },
        {
          label: 'Energieverbrauch',
          value: property.energy_consumption,
          field: 'energy_consumption',
          type: 'number',
          icon: Zap,
        },
        {
          label: 'Heizung',
          value: property.heating_type,
          field: 'heating_type',
          type: 'select',
          options: [
            { value: 'gas', label: 'Gas' },
            { value: 'oil', label: 'Öl' },
            { value: 'electric', label: 'Elektrisch' },
            { value: 'heat_pump', label: 'Wärmepumpe' },
            { value: 'solar', label: 'Solar' },
            { value: 'wood', label: 'Holz' },
            { value: 'district_heating', label: 'Fernwärme' },
          ],
          icon: Flame,
        },
        {
          label: 'Parkplatz',
          value: property.parking_type,
          field: 'parking_type',
          type: 'select',
          options: [
            { value: 'garage', label: 'Garage' },
            { value: 'carport', label: 'Carport' },
            { value: 'tiefgarage', label: 'Tiefgarage' },
            { value: 'außenstellplatz', label: 'Außenstellplatz' },
            { value: 'keine', label: 'Keine' },
          ],
          icon: Car,
        },
      ],
    },
    {
      title: 'Finanzen',
      icon: Euro,
      fields: [
        {
          label: 'Kaufpreis',
          value: property.price,
          field: 'price',
          type: 'number',
          icon: Euro,
        },
        {
          label: 'Provision',
          value: property.commission,
          field: 'commission',
          type: 'number',
          icon: Euro,
        },
      ],
    },
    {
      title: 'Zusätzliche Informationen',
      icon: FileText,
      fields: [
        {
          label: 'Beschreibung',
          value: property.description,
          field: 'description',
          type: 'textarea',
          icon: FileText,
        },
        {
          label: 'Ausstattung',
          value: property.equipment_description,
          field: 'equipment_description',
          type: 'textarea',
          icon: Tag,
        },
        {
          label: 'Zusätzliche Infos',
          value: property.additional_info,
          field: 'additional_info',
          type: 'textarea',
          icon: FileText,
        },
        {
          label: 'Tags',
          value: property.tags?.join(', '),
          field: 'tags',
          type: 'text',
          icon: Tag,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Global Edit Button */}
      {onGlobalEditToggle && (
        <div className="flex justify-between items-center mb-6">
          {globalEditMode && Object.keys(pendingChanges).length > 0 && (
            <div className="text-sm text-accent-600 dark:text-accent-400 font-medium">
              {Object.keys(pendingChanges).length} Änderung{Object.keys(pendingChanges).length !== 1 ? 'en' : ''} ausstehend
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={globalEditMode ? handleGlobalEditEnd : onGlobalEditToggle}
            className={`px-6 py-3 rounded-2xl font-medium transition-all duration-200 ${
              globalEditMode
                ? 'bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-accent-500/25'
                : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25'
            }`}
          >
            {globalEditMode ? 'Bearbeitung beenden & speichern' : 'Alle Felder bearbeiten'}
          </motion.button>
        </div>
      )}

      {sections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
          className="backdrop-blur-xl bg-white/70 border border-white/50 rounded-3xl p-8 shadow-2xl shadow-primary-500/10"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-4 mb-6"
          >
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-500/25"
            >
              {React.createElement(section.icon, { className: "w-7 h-7 text-white" })}
            </motion.div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              {section.title}
            </h3>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field, fieldIndex) => (
              <motion.div
                key={field.field}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (sectionIndex * 0.1) + (fieldIndex * 0.05) }}
              >
                <EditableField
                  label={field.label}
                  value={field.value}
                  field={field.field}
                  type={field.type}
                  options={field.options}
                  icon={field.icon}
                  onUpdate={handleFieldUpdate}
                  globalEditMode={globalEditMode}
                  pendingValue={pendingChanges[field.field]}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default DetailsTab;