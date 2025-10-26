import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Trash2, GripVertical } from 'lucide-react';
import apiClient from '../../api/enhancedClient';
import { PropertyResponse } from '../../lib/api/types';

type Step = 1 | 2 | 3 | 4;

const defaultState: any = {
  title: '',
  description: '',
  location: '',
  property_type: 'house',
  status: 'vorbereitung',
  price: undefined,
  price_currency: 'EUR',
  price_type: 'sale',
  // address
  address: { street: '', house_number: '', postal_code: '', city: '', state: '', country: 'Deutschland' },
  // details
  living_area: undefined,
  total_area: undefined,
  plot_area: undefined,
  rooms: undefined,
  bedrooms: undefined,
  bathrooms: undefined,
  floors: undefined,
  year_built: undefined,
  energy_class: '',
  energy_consumption: undefined,
  heating_type: '',
  coordinates_lat: undefined,
  coordinates_lng: undefined,
  amenities: [],
  tags: [],
  contact_person: { first_name: '', last_name: '', email: '', phone: ''},
  // New fields
  internal_id: '',
  unit_number: '',
  project_id: '',
  floor_number: '',
  condition_status: '',
  availability_date: '',
  commission: undefined,
  parking_type: '',
  object_description: '',
  location_description: '',
  last_modernization: undefined,
  construction_phase: '',
  equipment_description: '',
  additional_info: '',
};

const PropertyCreateWizard: React.FC = () => {
  const navigate = useNavigate();
  // Removed useCreateProperty hook - now using apiClient directly
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<any>({ ...defaultState });
  const [images, setImages] = useState<File[]>([]);
  const [docs, setDocs] = useState<File[]>([]);
  // Track which selected image (by index) should be Hauptbild when uploading
  const [mainImageIndex, setMainImageIndex] = useState<number | null>(null);
  const dropRefImg = useRef<HTMLDivElement | null>(null);
  const dropRefDoc = useRef<HTMLDivElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imgProgress, setImgProgress] = useState<number>(0);
  const [docProgress, setDocProgress] = useState<number>(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [isOverImg, setIsOverImg] = useState(false);
  const [isOverDoc, setIsOverDoc] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const DRAFT_KEY_SINGLE = 'property-create-draft-v1';
  const DRAFTS_KEY = 'property-create-drafts-v1';

  const canNext = useMemo(() => {
    if (step === 1) {
      // Backend requires: title (min 5), property_type, location, address fields
      const titleOk = typeof form.title === 'string' && form.title.trim().length >= 5;
      const addressOk = Boolean(form.address?.street && form.address?.postal_code && form.address?.city);
      const locationOk = Boolean((form.location || form.address?.city));
      const propertyTypeOk = Boolean(form.property_type);
      const priceOk = form.price ? form.price > 0 : true; // Price is optional but if provided must be positive
      
      return titleOk && addressOk && locationOk && propertyTypeOk && priceOk;
    }
    if (step === 2) {
      // Optional details - validate numeric fields if provided
      const livingAreaOk = form.living_area ? form.living_area > 0 : true;
      const totalAreaOk = form.total_area ? form.total_area > 0 : true;
      const plotAreaOk = form.plot_area ? form.plot_area > 0 : true;
      const roomsOk = form.rooms ? form.rooms > 0 : true;
      const bedroomsOk = form.bedrooms ? form.bedrooms >= 0 : true;
      const bathroomsOk = form.bathrooms ? form.bathrooms >= 0 : true;
      const floorsOk = form.floors ? form.floors > 0 : true;
      const yearBuiltOk = form.year_built ? form.year_built >= 1800 && form.year_built <= new Date().getFullYear() : true;
      const commissionOk = form.commission ? form.commission >= 0 && form.commission <= 100 : true;
      
      return livingAreaOk && totalAreaOk && plotAreaOk && roomsOk && bedroomsOk && bathroomsOk && floorsOk && yearBuiltOk && commissionOk;
    }
    if (step === 3) return true; // media optional
    if (step === 4) return true;
    return false;
  }, [step, form]);

  const handleFileInput = (filesList: FileList | null, setter: (f: File[]) => void, prev: File[], accept: 'image' | 'docs' | 'any' = 'any') => {
    if (!filesList) return;
    const files = Array.from(filesList);
    const maxSizeMB = 15; // per file
    const accepted: File[] = [];
    const newMsgs: string[] = [];
    files.forEach((f) => {
      const sizeOk = f.size <= maxSizeMB * 1024 * 1024;
      let typeOk = true;
      if (accept === 'image') typeOk = f.type.startsWith('image/');
      if (accept === 'docs') {
        const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const byExt = /\.(pdf|docx?|PDF|DOCX?)$/.test(f.name);
        typeOk = allowed.includes(f.type) || byExt;
      }
      if (!typeOk || !sizeOk) {
        if (!typeOk) newMsgs.push(`${f.name} übersprungen: Ungültiger Dateityp.`);
        if (!sizeOk) newMsgs.push(`${f.name} übersprungen: Datei größer als ${maxSizeMB} MB.`);
        return;
      }
      accepted.push(f);
    });
    if (newMsgs.length) setMessages((m) => [...newMsgs, ...m].slice(0, 8));
    if (accepted.length) setter([...prev, ...accepted]);
  };

  const removeFile = (idx: number, setter: (f: File[]) => void, list: File[]) => {
    const copy = [...list];
    copy.splice(idx, 1);
    setter(copy);
  };

  const validateStep = (stepNumber: Step): boolean => {
    const errors: Record<string, string> = {};
    
    if (stepNumber === 1) {
      if (!form.title || form.title.trim().length < 5) {
        errors.title = 'Titel muss mindestens 5 Zeichen lang sein';
      }
      if (!form.address?.street) {
        errors.street = 'Straße ist erforderlich';
      }
      if (!form.address?.postal_code) {
        errors.postal_code = 'Postleitzahl ist erforderlich';
      }
      if (!form.address?.city) {
        errors.city = 'Stadt ist erforderlich';
      }
      if (!form.property_type) {
        errors.property_type = 'Immobilientyp ist erforderlich';
      }
      if (form.price && form.price <= 0) {
        errors.price = 'Preis muss größer als 0 sein';
      }
    }
    
    if (stepNumber === 2) {
      if (form.living_area && form.living_area <= 0) {
        errors.living_area = 'Wohnfläche muss größer als 0 sein';
      }
      if (form.total_area && form.total_area <= 0) {
        errors.total_area = 'Gesamtfläche muss größer als 0 sein';
      }
      if (form.plot_area && form.plot_area <= 0) {
        errors.plot_area = 'Grundstücksfläche muss größer als 0 sein';
      }
      if (form.rooms && form.rooms <= 0) {
        errors.rooms = 'Anzahl Zimmer muss größer als 0 sein';
      }
      if (form.bedrooms && form.bedrooms < 0) {
        errors.bedrooms = 'Anzahl Schlafzimmer darf nicht negativ sein';
      }
      if (form.bathrooms && form.bathrooms < 0) {
        errors.bathrooms = 'Anzahl Bäder darf nicht negativ sein';
      }
      if (form.floors && form.floors <= 0) {
        errors.floors = 'Anzahl Etagen muss größer als 0 sein';
      }
      if (form.year_built && (form.year_built < 1800 || form.year_built > new Date().getFullYear())) {
        errors.year_built = `Baujahr muss zwischen 1800 und ${new Date().getFullYear()} liegen`;
      }
      if (form.commission && (form.commission < 0 || form.commission > 100)) {
        errors.commission = 'Provision muss zwischen 0 und 100% liegen';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const next = () => {
    if (validateStep(step)) {
      setStep((s) => (Math.min(4, (s + 1)) as Step));
    }
  };
  const prev = () => setStep((s) => (Math.max(1, (s - 1)) as Step));

  const submit = async () => {
    if (!canNext) return;
    setSubmitting(true);
    setImgProgress(0);
    setDocProgress(0);
    try {
      // Clean up the form data
      const cleanedForm = { ...form };
      
      // Remove contact_person if all fields are empty
      if (form.contact_person) {
        const hasAnyContactData = 
          form.contact_person.first_name?.trim() ||
          form.contact_person.last_name?.trim() ||
          form.contact_person.email?.trim() ||
          form.contact_person.phone?.trim();
        
        if (!hasAnyContactData) {
          delete cleanedForm.contact_person;
        }
      }
      
      const created = await apiClient.createProperty({
        ...cleanedForm,
        location: cleanedForm.location || cleanedForm.address.city,
      });
      
      // created ist jetzt ein PropertyResponse Objekt mit .id
      const propId = (created.data as any).id;
      toast.success('Immobilie erstellt');
      
      // Upload media if any
      if (images.length) {
        const results = await apiClient.uploadPropertyImages(propId, images, { onProgress: (p: number) => setImgProgress(p) });
        toast.success(`${images.length} Bild(er) hochgeladen`);
        if (mainImageIndex !== null && results.data[mainImageIndex]) {
          try {
            await apiClient.setPrimaryImage(propId, (results.data[mainImageIndex] as any).id);
            toast.success('Hauptbild gesetzt');
          } catch (e) {
            // non-blocking
            toast.error('Hauptbild konnte nicht gesetzt werden');
          }
        }
      }
      if (docs.length) {
        await apiClient.uploadPropertyDocuments(propId, docs, { onProgress: (p: number) => setDocProgress(p) });
        toast.success(`${docs.length} Dokument(e) hochgeladen`);
      }
      navigate(`/properties/${propId}`);
    } catch (err: any) {
      let msg = 'Erstellen fehlgeschlagen.';
      
      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          // Pydantic validation errors
          msg = detail.map((e: any) => {
            const field = e.loc?.join('.') || 'unknown';
            return `${field}: ${e.msg}`;
          }).join(', ');
        } else if (typeof detail === 'string') {
          msg = detail;
        } else if (typeof detail === 'object') {
          // Handle single validation error object
          const field = detail.loc?.join('.') || 'unknown';
          msg = `${field}: ${detail.msg}`;
        }
      } else if (err?.message) {
        msg = err.message;
      }
      
      // Ensure msg is always a string
      const errorMessage = typeof msg === 'string' ? msg : JSON.stringify(msg);
      setMessages((m) => [errorMessage, ...m].slice(0, 8));
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-save draft in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DRAFT_KEY_SINGLE);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setForm({ ...defaultState, ...parsed.form });
        setStep(parsed.step as Step || 1);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const payload = { form, step, savedAt: new Date().toISOString(), title: form.title || 'Entwurf' };
    localStorage.setItem(DRAFT_KEY_SINGLE, JSON.stringify(payload));
  }, [form, step]);

  const saveDraft = () => {
    const id = crypto.randomUUID();
    const payload = { id, form, step, savedAt: new Date().toISOString(), title: form.title || `Entwurf ${new Date().toLocaleString()}` };
    // save as single (last)
    localStorage.setItem(DRAFT_KEY_SINGLE, JSON.stringify(payload));
    // save to list
    const list = getDrafts();
    list.unshift(payload);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(list.slice(0, 20)));
    setMessages((m) => ["Entwurf gespeichert.", ...m].slice(0, 8));
  };

  const getDrafts = (): Array<{ id: string; title: string; savedAt: string; form: any; step: Step }> => {
    try {
      const raw = localStorage.getItem(DRAFTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const loadDraft = (id: string) => {
    const list = getDrafts();
    const d = list.find((x) => x.id === id);
    if (!d) return;
    setForm({ ...defaultState, ...d.form });
    setStep(d.step);
    localStorage.setItem(DRAFT_KEY_SINGLE, JSON.stringify(d));
    setShowDrafts(false);
  };

  const deleteDraft = (id: string) => {
    const list = getDrafts();
    const next = list.filter((x) => x.id !== id);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(next));
    const last = localStorage.getItem(DRAFT_KEY_SINGLE);
    if (last) {
      try {
        const parsed = JSON.parse(last);
        if (parsed.id === id) localStorage.removeItem(DRAFT_KEY_SINGLE);
      } catch {}
    }
    setShowDrafts(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Neue Immobilie anlegen</h1>
          <div className="relative">
            <button type="button" onClick={() => setShowDrafts((s) => !s)} className="px-3 py-2 text-sm rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">Entwürfe</button>
            {showDrafts && (
              <div className="absolute right-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border dark:border-gray-700 rounded-lg shadow-2xl z-10">
                <div className="p-3 border-b dark:border-gray-700 text-sm font-medium">Gespeicherte Entwürfe</div>
                <div className="max-h-64 overflow-auto">
                  {getDrafts().length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">Keine Entwürfe vorhanden.</div>
                  ) : (
                    getDrafts().map((d) => (
                      <div key={d.id} className="p-3 border-b last:border-none dark:border-gray-700 text-sm flex items-center justify-between gap-2">
                        <div>
                          <div className="font-medium truncate">{d.title || 'Entwurf'}</div>
                          <div className="text-xs text-gray-500">{new Date(d.savedAt).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-2 py-1 text-xs rounded border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => loadDraft(d.id)}>Laden</button>
                          <button className="px-2 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/30" onClick={() => deleteDraft(d.id)}>Löschen</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* stepper */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[1,2,3,4].map((s) => (
            <div key={s} className={`h-2 rounded-full transition-colors ${step >= s ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-inner' : 'bg-gray-300 dark:bg-gray-700'}`} />
          ))}
          <div className="col-span-4 grid grid-cols-4 text-xs text-center mt-2 text-gray-600 dark:text-gray-400">
            <div>Basis</div>
            <div>Details</div>
            <div>Medien</div>
            <div>Bestätigung</div>
          </div>
        </div>

        {/* content */}
        <motion.div
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/30 dark:border-gray-700/50 rounded-2xl shadow-2xl p-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Titel</label>
                  <input 
                    className={`w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition ${
                      validationErrors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''
                    }`} 
                    value={form.title} 
                    onChange={(e)=>setForm({...form, title: e.target.value})} 
                    placeholder="z.B. Helles Einfamilienhaus" 
                  />
                  {validationErrors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Beschreibung</label>
                  <textarea className="w-full p-3 border rounded-lg dark:bg-gray-700 min-h-[110px] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Objektbeschreibung</label>
                  <textarea className="w-full p-3 border rounded-lg dark:bg-gray-700 min-h-[80px] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.object_description} onChange={(e)=>setForm({...form, object_description: e.target.value})} placeholder="Detaillierte Beschreibung des Objekts..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Typ</label>
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.property_type} onChange={(e)=>setForm({...form, property_type: e.target.value})}>
                      <option value="house">Haus</option>
                      <option value="apartment">Wohnung</option>
                      <option value="commercial">Gewerbe</option>
                      <option value="land">Grundstück</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.status} onChange={(e)=>setForm({...form, status: e.target.value})}>
                      <option value="vorbereitung">Vorbereitung</option>
                      <option value="aktiv">Aktiv</option>
                      <option value="reserviert">Reserviert</option>
                      <option value="verkauft">Verkauft</option>
                      <option value="zurückgezogen">Zurückgezogen</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Interne ID</label>
                    <input className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.internal_id} onChange={(e)=>setForm({...form, internal_id: e.target.value})} placeholder="z.B. IMMO-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Einheitennummer</label>
                    <input className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.unit_number} onChange={(e)=>setForm({...form, unit_number: e.target.value})} placeholder="z.B. WHG-01" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Projekt-ID</label>
                    <input className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.project_id} onChange={(e)=>setForm({...form, project_id: e.target.value})} placeholder="z.B. PROJ-2024-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Etage</label>
                    <input className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.floor_number} onChange={(e)=>setForm({...form, floor_number: e.target.value})} placeholder="z.B. 3. OG" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Preis (€)</label>
                    <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.price ?? ''} onChange={(e)=>setForm({...form, price: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Preisart</label>
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.price_type} onChange={(e)=>setForm({...form, price_type: e.target.value})}>
                      <option value="sale">Kauf</option>
                      <option value="rent">Miete</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Währung</label>
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.price_currency} onChange={(e)=>setForm({...form, price_currency: e.target.value})}>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="CHF">CHF</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* address */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Straße</label>
                  <input 
                    className={`w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition ${
                      validationErrors.street ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''
                    }`} 
                    value={form.address.street} 
                    onChange={(e)=>setForm({...form, address: {...form.address, street: e.target.value}})} 
                    placeholder="Musterstraße 1"
                  />
                  {validationErrors.street && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.street}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">PLZ</label>
                    <input 
                      className={`w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition ${
                        validationErrors.postal_code ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''
                      }`} 
                      value={form.address.postal_code} 
                      onChange={(e)=>setForm({...form, address: {...form.address, postal_code: e.target.value}})} 
                    />
                    {validationErrors.postal_code && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.postal_code}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ort</label>
                    <input 
                      className={`w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition ${
                        validationErrors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''
                      }`} 
                      value={form.address.city} 
                      onChange={(e)=>setForm({...form, address: {...form.address, city: e.target.value}})} 
                    />
                    {validationErrors.city && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.city}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bundesland</label>
                    <input className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.address.state} onChange={(e)=>setForm({...form, address: {...form.address, state: e.target.value}})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Land</label>
                    <input className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.address.country} onChange={(e)=>setForm({...form, address: {...form.address, country: e.target.value}})} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Wohnfläche (m²)</label>
                    <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.living_area ?? ''} onChange={(e)=>setForm({...form, living_area: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Gesamtfläche (m²)</label>
                    <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.total_area ?? ''} onChange={(e)=>setForm({...form, total_area: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Grundstücksfläche (m²)</label>
                    <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.plot_area ?? ''} onChange={(e)=>setForm({...form, plot_area: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Zimmer</label>
                    <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.rooms ?? ''} onChange={(e)=>setForm({...form, rooms: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Schlafzimmer</label>
                    <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.bedrooms ?? ''} onChange={(e)=>setForm({...form, bedrooms: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bäder</label>
                    <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.bathrooms ?? ''} onChange={(e)=>setForm({...form, bathrooms: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Etagen</label>
                    <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.floors ?? ''} onChange={(e)=>setForm({...form, floors: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Baujahr</label>
                    <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.year_built ?? ''} onChange={(e)=>setForm({...form, year_built: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Energieklasse</label>
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.energy_class} onChange={(e)=>setForm({...form, energy_class: e.target.value})}>
                      <option value="">Bitte wählen</option>
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                      <option value="G">G</option>
                      <option value="H">H</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Heizung</label>
                    <input className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.heating_type} onChange={(e)=>setForm({...form, heating_type: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Energieverbrauch (kWh/m²a)</label>
                  <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.energy_consumption ?? ''} onChange={(e)=>setForm({...form, energy_consumption: e.target.value? Number(e.target.value): undefined})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Zustand</label>
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.condition_status} onChange={(e)=>setForm({...form, condition_status: e.target.value})}>
                      <option value="">Auswählen</option>
                      <option value="excellent">Sehr gut</option>
                      <option value="good">Gut</option>
                      <option value="fair">Befriedigend</option>
                      <option value="poor">Schlecht</option>
                      <option value="needs_renovation">Renovierungsbedürftig</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Verfügbarkeitsdatum</label>
                    <input type="date" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.availability_date} onChange={(e)=>setForm({...form, availability_date: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Provision (%)</label>
                    <input type="number" step="0.1" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.commission ?? ''} onChange={(e)=>setForm({...form, commission: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Parkplatz</label>
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.parking_type} onChange={(e)=>setForm({...form, parking_type: e.target.value})}>
                      <option value="">Auswählen</option>
                      <option value="garage">Garage</option>
                      <option value="carport">Carport</option>
                      <option value="parking_space">Stellplatz</option>
                      <option value="street_parking">Straßenparkplatz</option>
                      <option value="none">Kein Parkplatz</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Letzte Modernisierung</label>
                    <input type="number" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.last_modernization ?? ''} onChange={(e)=>setForm({...form, last_modernization: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bauphase</label>
                    <select className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.construction_phase} onChange={(e)=>setForm({...form, construction_phase: e.target.value})}>
                      <option value="">Auswählen</option>
                      <option value="planning">Planung</option>
                      <option value="construction">Bau</option>
                      <option value="completed">Fertiggestellt</option>
                      <option value="existing">Bestehend</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ausstattungsbeschreibung</label>
                  <textarea className="w-full p-3 border rounded-lg dark:bg-gray-700 min-h-[80px] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.equipment_description} onChange={(e)=>setForm({...form, equipment_description: e.target.value})} placeholder="Beschreibung der Ausstattung..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Lagebeschreibung</label>
                  <textarea className="w-full p-3 border rounded-lg dark:bg-gray-700 min-h-[80px] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.location_description} onChange={(e)=>setForm({...form, location_description: e.target.value})} placeholder="Beschreibung der Lage..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Zusätzliche Informationen</label>
                  <textarea className="w-full p-3 border rounded-lg dark:bg-gray-700 min-h-[80px] focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.additional_info} onChange={(e)=>setForm({...form, additional_info: e.target.value})} placeholder="Weitere wichtige Informationen..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Breite (Lat)</label>
                    <input type="number" step="0.000001" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.coordinates_lat ?? ''} onChange={(e)=>setForm({...form, coordinates_lat: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Länge (Lng)</label>
                    <input type="number" step="0.000001" className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={form.coordinates_lng ?? ''} onChange={(e)=>setForm({...form, coordinates_lng: e.target.value? Number(e.target.value): undefined})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ausstattung (Kommagetrennt)</label>
                  <input className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={(form.amenities||[]).join(', ')} onChange={(e)=>setForm({...form, amenities: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tags (Kommagetrennt)</label>
                  <input className="w-full p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" value={(form.tags||[]).join(', ')} onChange={(e)=>setForm({...form, tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ansprechpartner</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input className="p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" placeholder="Vorname" value={form.contact_person.first_name} onChange={(e)=>setForm({...form, contact_person: {...form.contact_person, first_name: e.target.value}})} />
                    <input className="p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" placeholder="Nachname" value={form.contact_person.last_name} onChange={(e)=>setForm({...form, contact_person: {...form.contact_person, last_name: e.target.value}})} />
                    <input className="p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" placeholder="E-Mail" value={form.contact_person.email} onChange={(e)=>setForm({...form, contact_person: {...form.contact_person, email: e.target.value}})} />
                    <input className="p-3 border rounded-lg dark:bg-gray-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition" placeholder="Telefon" value={form.contact_person.phone} onChange={(e)=>setForm({...form, contact_person: {...form.contact_person, phone: e.target.value}})} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              {messages.length > 0 && (
                <div className="space-y-2">
                  {messages.map((m, i) => (
                    <div key={i} className="text-xs px-3 py-2 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200 flex justify-between items-center">
                      <span className="truncate pr-2">{typeof m === 'string' ? m : JSON.stringify(m)}</span>
                      <button className="text-xs" onClick={() => setMessages((prev) => prev.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium mb-2">Bilder hochladen</label>
                  <span className="text-xs text-gray-500">Erlaubt: JPG, PNG, WEBP • Max. 15 MB pro Datei</span>
                </div>
                <div
                  ref={dropRefImg}
                  onDragOver={(e)=>{e.preventDefault(); e.stopPropagation(); setIsOverImg(true);}}
                  onDragLeave={()=>setIsOverImg(false)}
                  onDrop={(e)=>{e.preventDefault(); setIsOverImg(false); handleFileInput(e.dataTransfer.files, setImages, images, 'image');}}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${isOverImg? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'dark:border-gray-700 hover:border-indigo-400'}`}
                >
                  <p className="text-sm text-gray-500 mb-2">Dateien hierher ziehen oder auswählen</p>
                  <input type="file" accept="image/*" multiple onChange={(e)=>handleFileInput(e.target.files, setImages, images, 'image')} />
                </div>
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((f, idx) => {
                      const url = URL.createObjectURL(f);
                      return (
                        <div
                          key={idx}
                          className="relative group border rounded-lg overflow-hidden dark:border-gray-700 hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={() => setDragIdx(idx)}
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDrop={() => {
                            if (dragIdx === null || dragIdx === idx) return;
                            const next = [...images];
                            const [moved] = next.splice(dragIdx, 1);
                            next.splice(idx, 0, moved);
                            setImages(next);
                            setDragIdx(null);
                          }}
                          onDragEnd={() => setDragIdx(null)}
                        >
                          <img src={url} alt={f.name} className="w-full h-28 object-cover group-hover:brightness-95 transition" />
                          <div className="absolute top-1 left-1 hidden group-hover:flex items-center gap-1 bg-white/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 rounded px-1.5 py-1 shadow-sm">
                            <GripVertical className="h-3.5 w-3.5" />
                            <span className="text-[10px]">Ziehen</span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate flex items-center justify-between gap-2">
                            <span className="truncate">{f.name}</span>
                            <button
                              type="button"
                              className={`px-2 py-0.5 rounded text-[10px] ${mainImageIndex===idx? 'bg-amber-400 text-black':'bg-white/80 text-black hover:bg-white'}`}
                              onClick={(e)=>{ e.stopPropagation(); setMainImageIndex(idx===mainImageIndex? null: idx); }}
                              title="Als Hauptbild markieren"
                            >
                              {mainImageIndex===idx? 'Hauptbild' : 'Als Hauptbild'}
                            </button>
                          </div>
                          <button type="button" onClick={()=>removeFile(idx, setImages, images)} className="absolute top-1 right-1 p-1 rounded bg-white/80 dark:bg-gray-800/80 hover:bg-white"><Trash2 className="h-4 w-4"/></button>
                          {dragIdx !== null && (
                            <div className="absolute inset-0 border-2 border-indigo-400 pointer-events-none rounded-lg" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium mb-2">Dokumente hochladen</label>
                  <span className="text-xs text-gray-500">PDF, DOCX • Max. 15 MB pro Datei</span>
                </div>
                <div
                  ref={dropRefDoc}
                  onDragOver={(e)=>{e.preventDefault(); e.stopPropagation(); setIsOverDoc(true);}}
                  onDragLeave={()=>setIsOverDoc(false)}
                  onDrop={(e)=>{e.preventDefault(); setIsOverDoc(false); handleFileInput(e.dataTransfer.files, setDocs, docs, 'docs');}}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${isOverDoc? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'dark:border-gray-700 hover:border-indigo-400'}`}
                >
                  <p className="text-sm text-gray-500 mb-2">Dateien hierher ziehen oder auswählen</p>
                  <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple onChange={(e)=>handleFileInput(e.target.files, setDocs, docs, 'docs')} />
                </div>
                {docs.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {docs.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between border rounded-lg p-2 text-sm dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors">
                        <span className="truncate mr-3">{f.name}</span>
                        <button type="button" onClick={()=>removeFile(idx, setDocs, docs)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 className="h-4 w-4"/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Zusammenfassung</h3>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <div><span className="font-medium">Titel:</span> {form.title}</div>
                <div><span className="font-medium">Adresse:</span> {[form.address.street, form.address.postal_code, form.address.city].filter(Boolean).join(', ')}</div>
                <div><span className="font-medium">Typ/Status:</span> {form.property_type} / {form.status}</div>
                <div><span className="font-medium">Preis:</span> {form.price ? `${form.price} ${form.price_currency}` : '—'} ({form.price_type === 'sale' ? 'Kauf' : 'Miete'})</div>
                <div><span className="font-medium">Flächen:</span> W: {form.living_area||'—'} | G: {form.total_area||'—'} | Grdst: {form.plot_area||'—'}</div>
                <div><span className="font-medium">Zimmer:</span> {form.rooms||'—'} SZ: {form.bedrooms||'—'} B: {form.bathrooms||'—'}</div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {images.length} Bild(er), {docs.length} Dokument(e) werden hochgeladen.
              </div>
              {submitting && (
                <div className="space-y-3 mt-2">
                  {images.length > 0 && (
                    <div>
                      <div className="text-xs mb-1">Bilder Upload: {imgProgress}%</div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" style={{ width: `${imgProgress}%` }} />
                      </div>
                    </div>
                  )}
                  {docs.length > 0 && (
                    <div>
                      <div className="text-xs mb-1">Dokumente Upload: {docProgress}%</div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-600" style={{ width: `${docProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
  </motion.div>

        {/* footer */}
        <div className="flex justify-between mt-6">
          <button onClick={prev} disabled={step===1} className={`px-4 py-2 rounded-lg border ${step===1? 'opacity-50 cursor-not-allowed':'hover:bg-gray-50 dark:hover:bg-gray-800'} dark:border-gray-700`}>
            <ChevronLeft className="h-4 w-4 inline mr-1"/> Zurück
          </button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={saveDraft} className="px-4 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">Entwurf speichern</button>
            {step < 4 && (
              <button onClick={next} disabled={!canNext} className={`px-4 py-2 rounded-lg ${canNext? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all':'bg-gray-300 dark:bg-gray-700 text-gray-600 cursor-not-allowed'}`}>
                Weiter <ChevronRight className="h-4 w-4 inline ml-1"/>
              </button>
            )}
            {step === 4 && (
              <button onClick={submit} disabled={submitting || !canNext} className={`px-4 py-2 rounded-lg ${(!submitting && canNext)? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all':'bg-gray-300 dark:bg-gray-700 text-gray-600 cursor-not-allowed'}`}>
                {submitting? 'Wird erstellt…' : 'Erstellen'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCreateWizard;
