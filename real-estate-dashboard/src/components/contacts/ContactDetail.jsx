import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiService from '../../services/api.service';
import toast from 'react-hot-toast';
import { getRecommendations, getContactOverview } from '../../api/crm/api';
import { listMyCompanyUsers } from '../../api/users/api';

const ContactDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [activities, setActivities] = useState([]);
  // Derived from backend activities: used for History tab as well
  // Each item: { id, type, title, description, date, time, category, icon, color, bgColor, user, actorId }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [docs, setDocs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [renameDocId, setRenameDocId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [recs, setRecs] = useState([]);
  const [userDirectory, setUserDirectory] = useState({});
  const [avatarDirectory, setAvatarDirectory] = useState({});
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [historyFilter, setHistoryFilter] = useState({ type: 'all', status: 'all', from: '', to: '' });
  const [overview, setOverview] = useState(null);
  // Inline create task modal state
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDesc, setTaskDesc] = useState('');

  useEffect(() => {
    loadContactData();
  }, [id]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading contact data for ID:', id);
      
      // Lade 360° Overview zuerst (enthält alle CIM-Daten)
      try {
        setLoadingOverview(true);
        const o = await getContactOverview(String(id));
        console.log('✅ CIM Overview loaded:', o);
        setOverview(o || null);
        
        // Verwende die Kontakt-Daten aus dem CIM-Overview
        if (o?.contact) {
          console.log('✅ Using CIM contact data:', o.contact);
          console.log('✅ Lead score from CIM:', o.contact.lead_score);
          setContact(o.contact);
        } else {
          // Fallback: Lade Kontakt-Daten separat
          console.log('⚠️ CIM contact data not available, loading separately');
          const contactData = await apiService.getContact(id);
          console.log('✅ Fallback contact data:', contactData);
          console.log('✅ Lead score from fallback:', contactData.lead_score);
          setContact(contactData);
        }
      } catch (e) {
        console.warn('CIM Overview konnte nicht geladen werden:', e?.message || e);
        // Fallback: Lade Kontakt-Daten separat
        const contactData = await apiService.getContact(id);
        setContact(contactData);
        setOverview(null);
      } finally {
        setLoadingOverview(false);
      }

      // CRM: Empfehlungen laden (nutzt jetzt CIM-Daten)
      try {
        const r = await getRecommendations(String(id), 5);
        setRecs(Array.isArray(r?.properties) ? r.properties : []);
      } catch (e) {
        console.warn('Empfehlungen konnten nicht geladen werden:', e?.message || e);
      }

      // Load documents for this contact
      try {
        const d = await apiService.listContactDocuments(id);
        setDocs(Array.isArray(d) ? d : []);
      } catch (e) {
        console.warn('Dokumente konnten nicht geladen werden:', e?.message || e);
      }
      
      // Aktivitäten aus dem Backend laden und für die UI mappen
      try {
        const raw = await apiService.listContactActivities(id);
        // Prefetch user directory for actor labels (best-effort)
        const { nameMap, avatarMap } = await listMyCompanyUsers().then(arr => {
          const nameMap = {};
          const avatarMap = {};
          arr.forEach(u => {
            const key = String(u.id);
            nameMap[key] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || `User ${key.slice(0,6)}…`;
            if (u.avatar_url) avatarMap[key] = u.avatar_url;
          });
          return { nameMap, avatarMap };
        }).catch(()=>({ nameMap: {}, avatarMap: {} }));
        setUserDirectory(nameMap);
        setAvatarDirectory(avatarMap);

  const mapped = (Array.isArray(raw) ? raw : []).map((a) => {
          // Bestimme Icon/Color nach activity_type/status
          const t = (a.activity_type || '').toString();
          let icon = 'ri-file-list-line';
          let color = 'text-gray-600 dark:text-gray-300';
          let bgColor = 'bg-gray-50 dark:bg-gray-900/20';
          const typeIconMap = {
            call: { icon: 'ri-phone-line', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            email: { icon: 'ri-mail-line', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            meeting: { icon: 'ri-user-voice-line', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            note: { icon: 'ri-sticky-note-line', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            property_viewing: { icon: 'ri-home-5-line', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            follow_up: { icon: 'ri-time-line', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20' },
          };
          if (typeIconMap[t]) {
            icon = typeIconMap[t].icon;
            color = typeIconMap[t].color;
            bgColor = typeIconMap[t].bg;
          }
          const dt = a.completed_at || a.scheduled_at || a.created_at;
          const d = dt ? new Date(dt) : new Date();
          const actorId = a.user_id || null;
          let actorLabel = 'System';
          if (actorId) {
            if (user?.id && String(actorId) === String(user.id)) actorLabel = 'Du';
            else actorLabel = nameMap[String(actorId)] || `User ${String(actorId).slice(0,6)}…`;
          }
          // Replace raw UUID in description text (e.g., "geändert von User <uuid>") with actor label
          let desc = a.description || '';
          if (actorId) {
            const uuidStr = String(actorId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(`(User\\s+)${uuidStr}`, 'gi');
            desc = desc.replace(re, `$1${actorLabel}`);
          }
          return {
            id: a.id,
            type: t,
            title: a.title || t,
            description: desc,
            date: d.toLocaleDateString('de-DE'),
            time: d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            category: a.status || undefined,
            icon,
            color,
            bgColor,
            user: actorLabel,
            avatar: avatarMap[String(actorId)] || null,
            actorId,
            ts: d.getTime(),
          };
        });
        setActivities(mapped);
      } catch (e) {
        console.warn('Aktivitäten konnten nicht geladen werden:', e?.message || e);
        setActivities([]);
      }
    } catch (error) {
      console.error('❌ Error loading contact:', error);
      setError(error.message || 'Fehler beim Laden des Kontakts');
      toast.error('Fehler beim Laden des Kontakts');
    } finally {
      setLoading(false);
    }
  };

  // Light refresh of overview only
  const refreshOverview = async () => {
    try {
      setLoadingOverview(true);
      const o = await getContactOverview(String(id));
      setOverview(o || null);
    } catch (e) {
      setOverview(null);
    } finally {
      setLoadingOverview(false);
    }
  };

  // Refresh only history activities (used after doc ops)
  const refreshHistory = async () => {
    try {
      const raw = await apiService.listContactActivities(id);
      let directory = userDirectory;
      if ((!directory || Object.keys(directory).length === 0) || Object.keys(avatarDirectory).length === 0) {
        try {
          const arr = await listMyCompanyUsers();
          directory = {};
          const aMap = {};
          arr.forEach(u => { 
            const key = String(u.id);
            directory[key] = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || `User ${key.slice(0,6)}…`; 
            if (u.avatar_url) aMap[key] = u.avatar_url;
          });
          setUserDirectory(directory);
          setAvatarDirectory(aMap);
        } catch (_) {
          directory = {};
        }
      }
      const mapped = (Array.isArray(raw) ? raw : []).map((a) => {
        const t = (a.activity_type || '').toString();
        let icon = 'ri-file-list-line';
        let color = 'text-gray-600 dark:text-gray-300';
        let bgColor = 'bg-gray-50 dark:bg-gray-900/20';
        const typeIconMap = {
          call: { icon: 'ri-phone-line', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          email: { icon: 'ri-mail-line', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          meeting: { icon: 'ri-user-voice-line', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          note: { icon: 'ri-sticky-note-line', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          property_viewing: { icon: 'ri-home-5-line', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          follow_up: { icon: 'ri-time-line', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/20' },
        };
        if (typeIconMap[t]) { icon = typeIconMap[t].icon; color = typeIconMap[t].color; bgColor = typeIconMap[t].bg; }
        const dt = a.completed_at || a.scheduled_at || a.created_at;
        const d = dt ? new Date(dt) : new Date();
        const actorId = a.user_id || null;
        let actorLabel = 'System';
        if (actorId) {
          if (user?.id && String(actorId) === String(user.id)) actorLabel = 'Du';
          else actorLabel = directory[String(actorId)] || `User ${String(actorId).slice(0,6)}…`;
        }
        // Replace raw UUID in description text with actor label for history as well
        let desc = a.description || '';
        if (actorId) {
          const uuidStr = String(actorId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const re = new RegExp(`(User\\s+)${uuidStr}`, 'gi');
          desc = desc.replace(re, `$1${actorLabel}`);
        }
        return {
          id: a.id,
          type: t,
          title: a.title || t,
          description: desc,
          date: d.toLocaleDateString('de-DE'),
          time: d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          category: a.status || undefined,
          icon,
          color,
          bgColor,
          user: actorLabel,
          avatar: avatarDirectory[String(actorId)] || null,
          actorId,
          ts: d.getTime(),
        };
      });
      setActivities(mapped);
    } catch (_) {
      // ignore
    }
  };

  // Filtered history derived state
  const filteredActivities = activities.filter((h) => {
    if (historyFilter.type !== 'all' && h.type !== historyFilter.type) return false;
    if (historyFilter.status !== 'all' && (h.category || '') !== historyFilter.status) return false;
    if (historyFilter.from) {
      const [d, m, y] = h.date.split('.');
      const hd = new Date(`${y}-${m}-${d}T00:00:00`);
      if (hd < new Date(historyFilter.from)) return false;
    }
    if (historyFilter.to) {
      const [d, m, y] = h.date.split('.');
      const hd = new Date(`${y}-${m}-${d}T23:59:59`);
      if (hd > new Date(historyFilter.to)) return false;
    }
    return true;
  });

  // Specialize Activities Timeline: interaction-only types
  const activitiesTimeline = activities.filter(a => (
    ['call','email','meeting','note','follow_up','property_viewing'].includes((a.type || '').toLowerCase())
  )).sort((a,b)=> (b.ts||0) - (a.ts||0));

  // Engagement heat map data (last 6 weeks)
  const heatmapDays = (() => {
    const days = [];
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 41);
    const counts = new Map();
    activities.forEach(a => {
      if (!a.ts) return;
      const d = new Date(a.ts);
      const key = d.toISOString().slice(0,10);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    for (let i=0;i<42;i++) {
      const d = new Date(start.getTime());
      d.setDate(start.getDate()+i);
      const key = d.toISOString().slice(0,10);
      days.push({ date: key, count: counts.get(key) || 0 });
    }
    return days;
  })();

  const heatColor = (c) => {
    if (c === 0) return 'bg-emerald-500/10';
    if (c <= 2) return 'bg-emerald-500/30';
    if (c <= 5) return 'bg-emerald-500/60';
    return 'bg-emerald-600';
  };

  const onOpenCreateTask = () => {
    setTaskTitle('');
    setTaskDue('');
    setTaskPriority('medium');
    setTaskDesc('');
    setShowCreateTaskModal(true);
  };

  const createContactTask = async () => {
    if (!taskTitle.trim()) { toast.error('Titel erforderlich'); return; }
    try {
      const payload = {
        title: taskTitle.trim(),
        status: 'todo',
        priority: taskPriority,
        due_date: taskDue ? new Date(taskDue).toISOString() : undefined,
        related_contact_id: id,
        description: taskDesc || undefined,
      };
      await apiService.createTask(payload);
      toast.success('Aufgabe erstellt');
      setShowCreateTaskModal(false);
      await refreshOverview();
    } catch (e) {
      console.error(e);
      toast.error('Aufgabe konnte nicht erstellt werden');
    }
  };

  const exportHistoryCsv = () => {
    const rows = [['Datum', 'Uhrzeit', 'Typ', 'Titel', 'Status', 'Benutzer', 'Beschreibung']];
    filteredActivities.forEach(h => {
      rows.push([h.date, h.time, h.type, h.title, h.category || '', h.user || '', (h.description || '').replace(/\n/g, ' ') ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kontakt_${id}_historie.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFilesUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setIsUploading(true);
    try {
  for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setUploadProgress(Math.round(((i) / files.length) * 100));
        const uploaded = await apiService.uploadContactDocument(id, f, { title: f.name });
        setDocs(prev => [uploaded, ...prev]);
      }
      setUploadProgress(100);
      toast.success('Dokument(e) erfolgreich hochgeladen');
  // refresh history to include upload entries
  await refreshHistory();
    } catch (e) {
      console.error('Upload Fehler:', e);
      toast.error('Fehler beim Hochladen');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const iconForMime = (mime) => {
    if (!mime) return 'ri-file-2-line';
    if (mime.includes('pdf')) return 'ri-file-pdf-2-line';
    if (mime.includes('image')) return 'ri-image-line';
    if (mime.includes('word') || mime.includes('msword')) return 'ri-file-word-2-line';
    return 'ri-file-2-line';
  };

  const startRename = (d) => {
    setRenameDocId(d.id);
    setRenameTitle(d.title || d.original_filename || '');
  };

  const submitRename = async () => {
    if (!renameDocId) return;
    try {
      const form = new FormData();
      form.append('title', renameTitle);
      // Backend expects PATCH with form fields
      const res = await apiService.api.patch(
        `/contacts/${id}/documents/${renameDocId}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
  setDocs(prev => prev.map(d => d.id === renameDocId ? res.data : d));
      setRenameDocId(null);
      toast.success('Titel aktualisiert');
  // refresh history to include rename entry
  await refreshHistory();
    } catch (e) {
      console.error('Rename failed (PATCH form). Retrying with JSON)…', e);
      // Optional fallback: some servers accept JSON for title updates
      try {
        const resJson = await apiService.api.patch(
          `/contacts/${id}/documents/${renameDocId}`,
          { title: renameTitle }
        );
  setDocs(prev => prev.map(d => d.id === renameDocId ? resJson.data : d));
        setRenameDocId(null);
        toast.success('Titel aktualisiert');
  await refreshHistory();
      } catch (e2) {
        console.error('Rename failed (JSON fallback):', e2);
        toast.error('Umbenennen fehlgeschlagen');
      }
    }
  };

  const cancelRename = () => {
    setRenameDocId(null);
    setRenameTitle('');
  };

  const askDelete = (docId) => setPendingDeleteId(docId);
  const cancelDelete = () => setPendingDeleteId(null);
  const deleteDoc = async (docId) => {
    try {
      await apiService.api.delete(`/contacts/${id}/documents/${docId}`);
      setDocs(prev => prev.filter(d => d.id !== docId));
      toast.success('Dokument gelöscht');
  await refreshHistory();
    } catch (e) {
      console.error(e);
      toast.error('Löschen fehlgeschlagen');
    } finally {
      setPendingDeleteId(null);
    }
  };

  // Hilfsfunktionen für Datenformatierung
  const formatDate = (dateString) => {
    if (!dateString) return 'Nicht angegeben';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE');
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'Nicht angegeben';
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value);
  };

  // Robust parser for German/Intl numeric inputs (supports 200000, 200.000, 200,000, 200.000,00)
  const parseEuroNumber = (raw) => {
    if (raw === null || raw === undefined) return undefined;
    if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
    let s = String(raw).trim();
    if (!s) return undefined;
    s = s.replace(/\s/g, '');
    if (s.includes('.') && s.includes(',')) {
      // Assume '.' as thousands, ',' as decimal
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes('.') && /^[\d.]+$/.test(s) && s.split('.').pop().length === 3) {
      // Looks like thousands grouping: 200.000 -> 200000
      s = s.replace(/\./g, '');
    } else {
      // Normalize comma decimal
      s = s.replace(',', '.');
    }
    const n = Number(s);
    return Number.isNaN(n) ? undefined : n;
  };

  const getInitials = (name) => {
    if (!name) return 'N/A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Hoch';
      case 'medium':
        return 'Mittel';
      case 'low':
        return 'Niedrig';
      default:
        return 'Nicht angegeben';
    }
  };

  // Handler-Funktionen für Bearbeiten
  const handleEditContact = () => {
    setEditingContact({ ...contact });
    setShowEditModal(true);
  };

  const handleSaveContact = async () => {
    try {
      const updatedContact = await apiService.updateContact(contact.id, editingContact);
      setContact(updatedContact);
      setShowEditModal(false);
      setEditingContact(null);
      toast.success('Kontakt erfolgreich aktualisiert');
    } catch (error) {
      console.error('❌ Error updating contact:', error);
      toast.error('Fehler beim Aktualisieren des Kontakts');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingContact(null);
  };

  const updateEditingContact = (field, value) => {
    setEditingContact(prev => {
      // Behandlung von verschachtelten Objekten wie address und additional_info
      if (field.includes('.')) {
        const [parentField, childField] = field.split('.');
        return {
          ...prev,
          [parentField]: {
            ...prev[parentField],
            [childField]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 dark:border-indigo-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mb-6">
          <i className="ri-user-3-line text-3xl text-white"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {error ? 'Fehler beim Laden' : 'Kontakt nicht gefunden'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error || 'Der angeforderte Kontakt existiert nicht oder wurde entfernt.'}
        </p>
        <Link
          to="/kontakte"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <i className="ri-arrow-left-line mr-2"></i>
          Zurück zur Kontaktliste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header mit Breadcrumb */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 opacity-10 dark:opacity-20"></div>
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-8">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Link to="/kontakte" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Kontakte
            </Link>
            <i className="ri-arrow-right-s-line mx-2"></i>
            <span className="text-gray-900 dark:text-white font-medium">{contact.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            {/* Kontakt Info */}
            <div className="flex items-start space-x-6">
              <div className="relative">
                {contact.avatar ? (
                  <img 
                    src={contact.avatar} 
                    alt={contact.name}
                    className="h-24 w-24 rounded-2xl object-cover shadow-xl"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl ${contact.avatar ? 'hidden' : ''}`}>
                  <span className="text-2xl font-bold text-white">
                    {getInitials(contact.name)}
                  </span>
                </div>
                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-3 border-white dark:border-gray-800 ${contact.priority === 'high' ? 'bg-red-500' : contact.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'} shadow-lg`}></div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    {contact.name}
                  </h1>
                  <span className={`inline-flex px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(contact.status)} transform hover:scale-105 transition-transform duration-200`}>
                    {contact.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                  {contact.company && (
                    <div className="flex items-center">
                      <i className="ri-building-line mr-2"></i>
                      <span className="font-medium">{contact.company}</span>
                    </div>
                  )}
                  {contact.location && (
                    <div className="flex items-center">
                      <i className="ri-map-pin-line mr-2"></i>
                      <span>{contact.location}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <i className="ri-user-line mr-2"></i>
                    <span>ID: {contact.id ? String(contact.id).substring(0, 8) : 'N/A'}...</span>
                  </div>
                </div>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {contact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Empfehlungen */}
                {activeTab === 'details' && recs?.length > 0 && (
                  <div className="mt-6 bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 shadow border border-white/20 dark:border-gray-700/40">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Empfohlene Objekte</h3>
                      <span className="text-xs text-gray-500">Top {recs.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recs.map((p) => (
                        <Link key={p.id} to={`/immobilien/${p.id}`} className="block group">
                          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900 hover:shadow-md transition">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.title}</div>
                              <div className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">{Math.round(p.score)}%</div>
                            </div>
                            <div className="text-xs text-gray-500">{p.location}</div>
                            {p.price ? (
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p.price)}</div>
                            ) : null}
                            {Array.isArray(p.tags) && p.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {p.tags.slice(0,3).map((t) => (
                                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 lg:min-w-[300px]">
              <div className="text-center p-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(contact.value)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Potenzial</div>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activities.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Aktivitäten</div>
              </div>
              <div className="text-center p-4 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {getPriorityLabel(contact.priority)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Priorität</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <button 
              onClick={() => window.open(`tel:${contact.phone}`, '_self')}
              className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <i className="ri-phone-line mr-2 text-lg"></i>
              Anrufen
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
            
            <button 
              onClick={() => window.open(`mailto:${contact.email}?subject=Kontakt zu ${contact.name}&body=Hallo ${contact.name},%0D%0A%0D%0AIch möchte mich bezüglich Ihrer Immobilienanfrage bei Ihnen melden.%0D%0A%0D%0AMit freundlichen Grüßen`, '_blank')}
              className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <i className="ri-mail-line mr-2 text-lg"></i>
              E-Mail senden
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
            
            <button 
              onClick={() => setShowAppointmentModal(true)}
              className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <i className="ri-calendar-line mr-2 text-lg"></i>
              Termin planen
              <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
            
            <button 
              onClick={handleEditContact}
              className="inline-flex items-center px-6 py-3 bg-gray-800 dark:bg-gray-900 text-white font-semibold rounded-xl border-2 border-blue-500 hover:border-blue-400 hover:bg-gray-700 dark:hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <i className="ri-edit-line mr-2 text-lg"></i>
              Bearbeiten
            </button>
            
            <button
              onClick={() => navigate('/kontakte')}
              className="inline-flex items-center px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Zurück
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation mit modernem Design */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
        <div className="border-b border-gray-200/50 dark:border-gray-700/50">
          <nav className="flex space-x-0 px-6">
            {[
              { id: 'details', label: 'Details', icon: 'ri-user-line', count: null },
              { id: 'activities', label: 'Aktivitäten', icon: 'ri-history-line', count: activities.length },
              { id: 'documents', label: 'Dokumente', icon: 'ri-file-text-line', count: docs.length },
                { id: 'history', label: 'Historie', icon: 'ri-time-line', count: activities.length },
                { id: 'overview', label: '360°', icon: 'ri-compass-3-line', count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-4 px-6 font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <i className={`${tab.icon} text-lg`}></i>
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'details' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Kontaktinformationen Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Persönliche Informationen */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <i className="ri-user-3-line mr-3 text-indigo-600 dark:text-indigo-400"></i>
                    Persönliche Informationen
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { 
                        label: 'Telefon', 
                        value: contact.phone, 
                        icon: 'ri-phone-line', 
                        onClick: () => window.open(`tel:${contact.phone}`, '_self'),
                        actionText: 'Anrufen'
                      },
                      { 
                        label: 'E-Mail', 
                        value: contact.email, 
                        icon: 'ri-mail-line', 
                        onClick: () => window.open(`mailto:${contact.email}?subject=Kontakt zu ${contact.name}&body=Hallo ${contact.name},%0D%0A%0D%0AIch möchte mich bezüglich Ihrer Immobilienanfrage bei Ihnen melden.%0D%0A%0D%0AMit freundlichen Grüßen`, '_blank'),
                        actionText: 'E-Mail senden'
                      },
                      { 
                        label: 'Geburtstag', 
                        value: contact.additional_info?.birth_date ? formatDate(contact.additional_info.birth_date) : 'Nicht angegeben', 
                        icon: 'ri-cake-line' 
                      },
                      { 
                        label: 'Quelle', 
                        value: contact.additional_info?.source || 'Nicht angegeben', 
                        icon: 'ri-compass-line' 
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 group">
                        <div className="flex items-center flex-1">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <i className={`${item.icon} text-white`}></i>
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.label}</div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.value || 'Nicht angegeben'}</div>
                          </div>
                        </div>
                        
                        {/* Action Button für Telefon und E-Mail */}
                        {item.onClick && (
                          <button
                            onClick={item.onClick}
                            className="opacity-0 group-hover:opacity-100 ml-3 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                          >
                            {item.actionText}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Geschäftsinformationen */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <i className="ri-building-line mr-3 text-indigo-600 dark:text-indigo-400"></i>
                    Geschäftsinformationen
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { label: 'Unternehmen', value: contact.company, icon: 'ri-building-2-line' },
                      { 
                        label: 'Adresse', 
                        value: contact.address ? `${contact.address.street}, ${contact.address.zip_code} ${contact.address.city}` : 'Nicht angegeben', 
                        icon: 'ri-map-pin-line' 
                      },
                      { label: 'Kategorie', value: contact.category, icon: 'ri-price-tag-3-line' },
                      { 
                        label: 'Priorität', 
                        value: getPriorityLabel(contact.priority), 
                        icon: getPriorityIcon(contact.priority), 
                        color: getPriorityColor(contact.priority) 
                      },
                      { 
                        label: 'Letzter Kontakt', 
                        value: formatDate(contact.last_contact), 
                        icon: 'ri-calendar-line' 
                      },
                      { 
                        label: 'Erstellt am', 
                        value: formatDate(contact.created_at), 
                        icon: 'ri-time-line' 
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <i className={`${item.icon} text-white`}></i>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{item.label}</div>
                          <div className={`text-sm font-semibold ${item.color || 'text-gray-900 dark:text-white'} capitalize`}>
                            {item.value || 'Nicht angegeben'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Notizen */}
              {contact.additional_info?.notes && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <i className="ri-sticky-note-line mr-3 text-indigo-600 dark:text-indigo-400"></i>
                    Notizen
                  </h3>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-700/50">
                    <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">{contact.additional_info.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <i className="ri-history-line mr-3 text-indigo-600 dark:text-indigo-400"></i>
                  Aktivitäten Timeline
                </h3>
                <div className="flex items-center space-x-3">
                  {/* Inline Quick Actions */}
                  <button onClick={onOpenCreateTask} className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                    <i className="ri-add-line mr-1"></i>
                    Neue Aufgabe
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={() => window.open(`mailto:${contact.email}`,'_blank')}>
                    <i className="ri-mail-line mr-1"></i>
                    E-Mail
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-700" onClick={() => setShowAppointmentModal(true)}>
                    <i className="ri-calendar-line mr-1"></i>
                    Termin
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-600"></div>
                
                <div className="space-y-6">
                  {activitiesTimeline.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="relative flex items-start space-x-6 group"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Timeline Dot */}
                      <div className={`relative z-10 flex-shrink-0 w-16 h-16 ${activity.bgColor} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 transform group-hover:scale-110`}>
                        {activity.avatar ? (
                          <img src={activity.avatar} alt={activity.user} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <i className={`${activity.icon} text-xl ${activity.color}`}></i>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 bg-white/50 dark:bg-gray-700/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 group-hover:bg-white dark:group-hover:bg-gray-700/50 transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                {activity.title}
                              </h4>
                              {activity.category && (
                                <span className="inline-flex px-3 py-1 text-xs font-bold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 rounded-full">
                                  {activity.category}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                              {activity.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <i className="ri-calendar-line mr-1"></i>
                                {activity.date}
                              </div>
                              <div className="flex items-center">
                                <i className="ri-time-line mr-1"></i>
                                {activity.time}
                              </div>
                              <div className="flex items-center">
                                {activity.avatar ? (
                                  <img src={activity.avatar} alt={activity.user} className="w-5 h-5 rounded-full mr-1 object-cover" />
                                ) : (
                                  <i className="ri-user-line mr-1"></i>
                                )}
                                {activity.user}
                              </div>
                            </div>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 transform hover:scale-110">
                            <i className="ri-more-2-line text-lg"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Upload area */}
              <div
                className={`p-6 border-2 border-dashed rounded-2xl ${dragOver ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-gray-300 dark:border-gray-600'} transition-colors`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFilesUpload(e.dataTransfer.files); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                      <i className="ri-file-upload-line text-2xl"></i>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">Dokumente hochladen</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Ziehen Sie Dateien hierher oder wählen Sie über den Button aus</div>
                    </div>
                  </div>
                  <div>
                    <label className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg cursor-pointer hover:from-indigo-700 hover:to-purple-700">
                      <i className="ri-upload-line mr-2"></i>
                      Datei wählen
                      <input type="file" className="hidden" onChange={(e) => e.target.files && handleFilesUpload(e.target.files)} multiple />
                    </label>
                  </div>
                </div>
                {isUploading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload {uploadProgress}%</div>
                  </div>
                )}
              </div>

              {/* Documents list */}
              {docs.length === 0 ? (
                <div className="text-center py-12">
                  <i className="ri-file-text-line text-4xl text-gray-400"></i>
                  <div className="mt-2 text-gray-600 dark:text-gray-400">Noch keine Dokumente vorhanden</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map((d) => (
                    <div key={d.id} className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center">
                            <i className={iconForMime(d.mime_type)}></i>
                          </div>
                          <div>
                            {renameDocId === d.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  className="w-[240px] h-9 px-3 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  value={renameTitle}
                                  onChange={(e)=>setRenameTitle(e.target.value)}
                                  placeholder="Neuer Name"
                                  autoFocus
                                  onFocus={(e)=>e.target.select()}
                                  onKeyDown={(e)=>{
                                    if (e.key === 'Enter') submitRename();
                                    if (e.key === 'Escape') cancelRename();
                                  }}
                                />
                              </div>
                            ) : (
                              <>
                                <div className="font-semibold text-gray-900 dark:text-white truncate w-[240px]" title={d.title || d.original_filename}>{d.title || d.original_filename}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{d.mime_type || 'Datei'}</div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          {pendingDeleteId === d.id ? (
                            <>
                              <button onClick={()=>deleteDoc(d.id)} className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm">Bestätigen</button>
                              <button onClick={cancelDelete} className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">Abbrechen</button>
                            </>
                          ) : renameDocId === d.id ? (
                            <>
                              <button onClick={submitRename} className="inline-flex items-center px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm">Speichern</button>
                              <button onClick={cancelRename} className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">Abbrechen</button>
                            </>
                          ) : (
                            <>
                              <a href={d.url} target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-400 text-sm font-medium">Öffnen</a>
                              <button onClick={()=>startRename(d)} className="text-gray-500 hover:text-gray-300 text-sm">Umbenennen</button>
                              <button onClick={()=>askDelete(d.id)} className="text-red-500 hover:text-red-400 text-sm">Löschen</button>
                            </>
                          )}
                        </div>
                      </div>
                      {d.description && (
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{d.description}</div>
                      )}
                      <div className="mt-3 text-xs text-gray-500">Hochgeladen am {new Date(d.created_at).toLocaleDateString('de-DE')} • {d.file_size ? `${(d.file_size/1024/1024).toFixed(1)} MB` : 'Größe unbekannt'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <i className="ri-time-line mr-3 text-indigo-600 dark:text-indigo-400"></i>
                  Änderungs-Historie
                </h3>
                <div className="flex items-center gap-2">
                  <select value={historyFilter.type} onChange={(e)=>setHistoryFilter(prev=>({...prev, type: e.target.value}))} className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                    <option value="all">Alle Typen</option>
                    <option value="note">Notizen</option>
                    <option value="call">Anruf</option>
                    <option value="email">E-Mail</option>
                    <option value="meeting">Meeting</option>
                    <option value="property_viewing">Besichtigung</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                  <select value={historyFilter.status} onChange={(e)=>setHistoryFilter(prev=>({...prev, status: e.target.value}))} className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                    <option value="all">Alle Stati</option>
                    <option value="completed">Erledigt</option>
                    <option value="open">Offen</option>
                    <option value="planned">Geplant</option>
                  </select>
                  <input type="date" value={historyFilter.from} onChange={(e)=>setHistoryFilter(prev=>({...prev, from: e.target.value}))} className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                  <input type="date" value={historyFilter.to} onChange={(e)=>setHistoryFilter(prev=>({...prev, to: e.target.value}))} className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                  <button onClick={exportHistoryCsv} className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-white/50 dark:bg-gray-700/50 border border-gray-200/60 dark:border-gray-600/60"><i className="ri-download-line mr-1"></i>CSV</button>
                </div>
              </div>

              {filteredActivities.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <i className="ri-history-line text-3xl text-white"></i>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Keine Einträge</h4>
                  <p className="text-gray-600 dark:text-gray-400">Für diesen Kontakt wurden noch keine Aktivitäten protokolliert.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/60 dark:bg-gray-800/40">
                      <div className={`flex-shrink-0 w-9 h-9 ${h.bgColor} rounded-lg flex items-center justify-center`}>
                        {h.avatar ? (
                          <img src={h.avatar} alt={h.user} className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <i className={`${h.icon} ${h.color} text-base`}></i>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {h.title}
                          </div>
                          {h.category && (
                            <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                              {h.category}
                            </span>
                          )}
                        </div>
                        {h.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">{h.description}</div>
                        )}
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            {h.avatar ? <img src={h.avatar} alt={h.user} className="w-4 h-4 rounded-full object-cover" /> : <i className="ri-user-line"></i>}
                            {h.user}
                          </span>
                          <span className="inline-flex items-center gap-1"><i className="ri-calendar-line"></i>{h.date}</span>
                          <span className="inline-flex items-center gap-1"><i className="ri-time-line"></i>{h.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <i className="ri-compass-3-line mr-3 text-indigo-600 dark:text-indigo-400"></i>
                  360° Übersicht
                </h3>
              </div>
              {loadingOverview ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_,i)=> (
                    <div key={i} className="p-4 rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-gray-100 dark:bg-gray-800 animate-pulse h-20"></div>
                  ))}
                </div>
              ) : !overview ? (
                <div className="text-center py-16 text-gray-500">Keine Daten verfügbar.</div>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20" title="Lead Score schätzt Engagement + Fit (0–100) aus Interaktionen, Profil-Fit, Aktualität und Reaktionsgeschwindigkeit.">
                      <div className="text-xs text-gray-500 mb-1">Lead Score</div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{overview.contact?.lead_score ?? '—'}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                      <div className="text-xs text-gray-500 mb-1">Aufgaben</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{overview.tasks?.length || 0}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                      <div className="text-xs text-gray-500 mb-1">Termine</div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{overview.appointments?.length || 0}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-sky-500/10 to-cyan-500/10 border border-sky-500/20">
                      <div className="text-xs text-gray-500 mb-1">Aktivitäten</div>
                      <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{activities.length}</div>
                    </div>
                  </div>

                  {/* Main Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Contact Card + Next Meeting */}
                    <div className="xl:col-span-1 space-y-4">
                      <div className="p-5 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/40">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold">
                            {getInitials(`${overview.contact?.first_name || ''} ${overview.contact?.last_name || ''}`)}
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{overview.contact?.first_name} {overview.contact?.last_name}</div>
                            <div className="text-sm text-gray-500">{overview.contact?.company || '—'}</div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-2"><i className="ri-mail-line text-gray-400"></i>{overview.contact?.email || contact?.email || '—'}</div>
                          <div className="flex items-center gap-2"><i className="ri-phone-line text-gray-400"></i>{overview.contact?.phone || contact?.phone || '—'}</div>
                          <div className="flex items-center gap-2"><i className="ri-user-voice-line text-gray-400"></i>Status: {overview.contact?.status || contact?.status || '—'}</div>
                          <div className="flex items-center gap-2">
                            <i className="ri-star-line text-gray-400"></i>
                            <span>Score: {overview.contact?.lead_score ?? contact?.lead_score ?? '—'}</span>
                            {overview.leadQuality && (
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                overview.leadQuality.level === 'high' 
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  : overview.leadQuality.level === 'medium'
                                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {overview.leadQuality.level}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Budget Information */}
                        {overview.budgetAnalysis && overview.budgetAnalysis.formatted !== 'Kein Budget angegeben' && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center gap-2 mb-2">
                              <i className="ri-money-euro-circle-line text-blue-600 dark:text-blue-400"></i>
                              <span className="font-semibold text-blue-900 dark:text-blue-100">Budget</span>
                            </div>
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                              {overview.budgetAnalysis.formatted}
                            </div>
                            {overview.budgetAnalysis.avg > 0 && (
                              <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                Durchschnitt: {new Intl.NumberFormat('de-DE', {
                                  style: 'currency',
                                  currency: 'EUR',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(overview.budgetAnalysis.avg)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="p-5 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/40 sticky top-2 xl:top-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Nächster Termin</div>
                        {overview.appointments && overview.appointments.length ? (
                          (() => {
                            const upcoming = [...overview.appointments].filter(a => a.start_datetime).sort((a,b) => new Date(a.start_datetime) - new Date(b.start_datetime))[0];
                            return upcoming ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">{upcoming.title}</div>
                                <div className="text-gray-500">{new Date(upcoming.start_datetime).toLocaleString('de-DE')}</div>
                                {upcoming.location && <div className="text-gray-500">{upcoming.location}</div>}
                              </div>
                            ) : (<div className="text-gray-500">Kein Termin geplant.</div>);
                          })()
                        ) : <div className="text-gray-500">Kein Termin geplant.</div>}
                      </div>
                    </div>

                    {/* Recent Activity Timeline */}
                    <div className="xl:col-span-1 p-5 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/40">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Letzte Aktivitäten</div>
                      {activities.length ? (
                        <div className="space-y-3">
                          {activities.sort((a,b)=> (b.ts||0) - (a.ts||0)).slice(0,6).map(a => (
                            <div key={a.id} className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.bgColor}`}>
                                {a.avatar ? <img src={a.avatar} alt={a.user} className="w-6 h-6 rounded-full object-cover" /> : <i className={`${a.icon} ${a.color}`}></i>}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.title}</div>
                                <div className="text-xs text-gray-500">{a.date} • {a.time} • {a.user}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Keine Aktivitäten.</div>
                      )}
                    </div>

                    {/* Tasks & Recommendations */}
                    <div className="xl:col-span-1 space-y-4">
                      <div className="p-5 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/40">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Aufgaben (Top 6)</div>
                        {overview.tasks?.length ? (
                          <ul className="divide-y divide-gray-200/60 dark:divide-gray-700/60">
                            {overview.tasks.slice(0,6).map(t => (
                              <li key={t.id} className="py-2 text-sm flex items-center justify-between">
                                <span className="truncate mr-3">{t.title}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{t.status}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-gray-500">Keine Aufgaben.</div>
                        )}
                      </div>

                      {/* Lead Quality Analysis */}
                      {overview?.leadQuality && (
                        <div className="p-5 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/40">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Lead-Qualität</div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Gesamt-Score</span>
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      overview.leadQuality.level === 'high' 
                                        ? 'bg-green-500' 
                                        : overview.leadQuality.level === 'medium'
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${overview.leadQuality.score}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{overview.leadQuality.score}/100</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Level:</span>
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                overview.leadQuality.level === 'high' 
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  : overview.leadQuality.level === 'medium'
                                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {overview.leadQuality.level === 'high' ? 'Hoch' : overview.leadQuality.level === 'medium' ? 'Mittel' : 'Niedrig'}
                              </span>
                            </div>
                            {overview.leadQuality.factors && overview.leadQuality.factors.length > 0 && (
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Qualitäts-Faktoren:</div>
                                <div className="flex flex-wrap gap-1">
                                  {overview.leadQuality.factors.map((factor, idx) => (
                                    <span key={idx} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                      {factor}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Engagement Heat Map & Mini Funnel */}
                      <div className="p-5 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/40">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Engagement & Funnel</div>
                        <div className="grid grid-cols-7 gap-1 mb-3">
                          {heatmapDays.map((d, i) => (
                            <div key={i} className={`h-2 rounded ${heatColor(d.count)}`} title={`${d.date}: ${d.count} Aktivität(en)`}></div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Lead → Interessent</span>
                              <span className="font-semibold text-gray-900 dark:text-white">68%</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mt-1">
                              <div className="h-2 bg-indigo-500 rounded" style={{ width: '68%' }}></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Interessent → Kunde</span>
                              <span className="font-semibold text-gray-900 dark:text-white">35%</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mt-1">
                              <div className="h-2 bg-purple-500 rounded" style={{ width: '35%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Perfect Matches */}
                      {overview?.perfectMatches && overview.perfectMatches.length > 0 && (
                        <div className="p-5 rounded-2xl border border-green-200/60 dark:border-green-700/60 bg-gradient-to-r from-green-50/70 to-emerald-50/70 dark:from-green-900/20 dark:to-emerald-900/20">
                          <div className="flex items-center gap-2 mb-3">
                            <i className="ri-target-line text-green-600 dark:text-green-400"></i>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">🎯 Perfekte Matches</div>
                            <div className="text-xs text-green-600 dark:text-green-400 font-medium ml-auto">{overview.perfectMatches.length} Matches</div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {overview.perfectMatches.slice(0,4).map(p => (
                              <Link key={p.id} to={`/immobilien/${p.id}`} className="group border border-green-200/60 dark:border-green-700/60 rounded-xl p-3 hover:shadow-lg transition-all duration-200 bg-white/50 dark:bg-gray-800/30">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.title}</div>
                                  <div className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                    {Math.round(p.match_score)}%
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 truncate">{p.address}</div>
                                <div className="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">{p.price_formatted}</div>
                                <div className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <i className="ri-arrow-right-line"></i> Details anzeigen
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {(overview?.matchingProperties?.length || recs?.length) ? (
                        <div className="p-5 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-800/40">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Empfehlungen</div>
                          <div className="grid grid-cols-2 gap-3">
                            {(overview?.matchingProperties || recs).slice(0,4).map(p => (
                              <Link key={p.id} to={`/immobilien/${p.id}`} className="group border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-3 hover:shadow-lg transition-all duration-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.title}</div>
                                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                                    {Math.round(p.match_score || p.score || 0)}%
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500 truncate">{p.address || p.location}</div>
                                <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                                  {p.price_formatted || (p.price ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p.price) : 'Preis auf Anfrage')}
                                </div>
                                <div className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <i className="ri-arrow-right-line"></i> Details anzeigen
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Terminplanungs-Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <i className="ri-calendar-line mr-2 text-purple-600 dark:text-purple-400"></i>
                  Termin mit {contact.name} planen
                </h3>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <i className="ri-close-line text-gray-500 dark:text-gray-400"></i>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Kontakt-Info */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">
                      {getInitials(contact.name)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{contact.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{contact.phone} • {contact.email}</div>
                  </div>
                </div>
              </div>

              {/* Termindetails */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Datum
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Uhrzeit
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Termintyp
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option>Beratungsgespräch</option>
                  <option>Objektbesichtigung</option>
                  <option>Vertragsunterzeichnung</option>
                  <option>Telefonat</option>
                  <option>Video-Call</option>
                  <option>Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ort
                </label>
                <input
                  type="text"
                  placeholder="z.B. Büro, Objektadresse, Online"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dauer
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option>30 Minuten</option>
                  <option>1 Stunde</option>
                  <option>1,5 Stunden</option>
                  <option>2 Stunden</option>
                  <option>Ganzer Tag</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Beschreibung / Agenda
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Beschreiben Sie den Zweck und die Agenda des Termins..."
                ></textarea>
              </div>

              {/* Erinnerungen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Erinnerungen
                </label>
                <div className="space-y-2">
                  {['15 Minuten vorher', '1 Stunde vorher', '1 Tag vorher'].map((reminder, index) => (
                    <label key={index} className="flex items-center">
                      <input type="checkbox" className="mr-2 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{reminder}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Teilnehmer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weitere Teilnehmer (E-Mail-Adressen)
                </label>
                <input
                  type="text"
                  placeholder="kollege@firma.de, assistent@firma.de"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button 
                  onClick={() => {
                    // Hier würde der Termin gespeichert werden
                    alert(`Termin mit ${contact.name} wurde erfolgreich geplant!`);
                    setShowAppointmentModal(false);
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                >
                  Termin erstellen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aufgabe erstellen Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center"><i className="ri-add-line mr-2"></i>Neue Aufgabe</h3>
              <button onClick={()=>setShowCreateTaskModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Titel</label>
                <input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" placeholder="z.B. Rückruf vereinbaren" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Fällig am</label>
                  <input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Priorität</label>
                  <select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Beschreibung</label>
                <textarea rows={3} value={taskDesc} onChange={e=>setTaskDesc(e.target.value)} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" placeholder="Details zur Aufgabe..." />
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
              <button onClick={()=>setShowCreateTaskModal(false)} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600">Abbrechen</button>
              <button onClick={createContactTask} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white">Erstellen</button>
            </div>
          </div>
        </div>
      )}

      {/* Bearbeitungs-Modal */}
      {showEditModal && editingContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="p-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Kontakt bearbeiten
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Aktualisieren Sie die Kontaktinformationen
                  </p>
                </div>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <i className="ri-close-line text-gray-500 dark:text-gray-400 text-xl"></i>
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-10">
              {/* Grunddaten */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Grunddaten
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={editingContact.name}
                      onChange={(e) => updateEditingContact('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
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
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={editingContact.phone || ''}
                      onChange={(e) => updateEditingContact('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unternehmen
                    </label>
                    <input
                      type="text"
                      value={editingContact.company || ''}
                      onChange={(e) => updateEditingContact('company', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Klassifizierung */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Status & Klassifizierung
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editingContact.status}
                      onChange={(e) => updateEditingContact('status', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    >
                      <option value="Lead">Lead</option>
                      <option value="Interessent">Interessent</option>
                      <option value="Kunde">Kunde</option>
                      <option value="Inaktiv">Inaktiv</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priorität
                    </label>
                    <select
                      value={editingContact.priority}
                      onChange={(e) => updateEditingContact('priority', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    >
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Potenzialwert (EUR)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={editingContact.value ?? ''}
                      onChange={(e) => {
                        const n = parseEuroNumber(e.target.value);
                        updateEditingContact('value', n);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="500000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kategorie
                  </label>
                  <input
                    type="text"
                    value={editingContact.category || ''}
                    onChange={(e) => updateEditingContact('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="z.B. Eigentümer, Kaufinteressent"
                  />
                </div>
              </div>

              {/* Adresse & Kontaktdetails */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Adresse & Kontaktdetails
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Straße
                    </label>
                    <input
                      type="text"
                      value={editingContact.address?.street || ''}
                      onChange={(e) => updateEditingContact('address.street', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="Musterstraße 123"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      PLZ
                    </label>
                    <input
                      type="text"
                      value={editingContact.address?.zip_code || ''}
                      onChange={(e) => updateEditingContact('address.zip_code', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="80333"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stadt
                    </label>
                    <input
                      type="text"
                      value={editingContact.address?.city || ''}
                      onChange={(e) => updateEditingContact('address.city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="München"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Land
                    </label>
                    <input
                      type="text"
                      value={editingContact.address?.country || ''}
                      onChange={(e) => updateEditingContact('address.country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                      placeholder="Deutschland"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Standort (Kurzform)
                  </label>
                  <input
                    type="text"
                    value={editingContact.location || ''}
                    onChange={(e) => updateEditingContact('location', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="München"
                  />
                </div>
              </div>

              {/* Zusätzliche Informationen */}
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  Zusätzliche Informationen
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Geburtstag
                    </label>
                    <input
                      type="date"
                      value={editingContact.additional_info?.birth_date || ''}
                      onChange={(e) => updateEditingContact('additional_info.birth_date', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quelle
                    </label>
                    <select
                      value={editingContact.additional_info?.source || ''}
                      onChange={(e) => updateEditingContact('additional_info.source', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="Website">Website</option>
                      <option value="Empfehlung">Empfehlung</option>
                      <option value="Kaltakquise">Kaltakquise</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Messe">Messe</option>
                      <option value="Anzeige">Anzeige</option>
                      <option value="Immobilienscout24">Immobilienscout24</option>
                      <option value="Immowelt">Immowelt</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </div>
                </div>

                {/* Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bevorzugte Kontaktmethode</label>
                    <select
                      value={editingContact.additional_info?.preferred_contact_method || ''}
                      onChange={(e) => updateEditingContact('additional_info.preferred_contact_method', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="phone">Telefon</option>
                      <option value="email">E-Mail</option>
                      <option value="sms">SMS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bevorzugte Kontaktzeit</label>
                    <input
                      type="text"
                      value={editingContact.additional_info?.preferred_contact_time || ''}
                      onChange={(e) => updateEditingContact('additional_info.preferred_contact_time', e.target.value)}
                      placeholder="z.B. Werktags Vormittag"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sprache</label>
                    <select
                      value={editingContact.additional_info?.language || ''}
                      onChange={(e) => updateEditingContact('additional_info.language', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="deutsch">Deutsch</option>
                      <option value="english">English</option>
                      <option value="français">Français</option>
                      <option value="español">Español</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (kommagetrennt)
                  </label>
                  <input
                    type="text"
                    value={editingContact.tags?.join(', ') || ''}
                    onChange={(e) => updateEditingContact('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    placeholder="VIP, Investor, Schnellentscheider"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notizen
                  </label>
                  <textarea
                    rows={4}
                    value={editingContact.additional_info?.notes || ''}
                    onChange={(e) => updateEditingContact('additional_info.notes', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
                    placeholder="Zusätzliche Informationen und Notizen..."
                  ></textarea>
                </div>

                {/* Intern & Follow-up */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interne Notizen</label>
                    <textarea
                      rows={4}
                      value={editingContact.additional_info?.internal_notes || ''}
                      onChange={(e) => updateEditingContact('additional_info.internal_notes', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
                      placeholder="Nur intern sichtbar..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nächste Nachverfolgung</label>
                    <input
                      type="datetime-local"
                      value={editingContact.next_follow_up || ''}
                      onChange={(e) => updateEditingContact('next_follow_up', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Budget & Consents */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget min</label>
                    <input
                      type="number"
                      value={editingContact.budget?.min || ''}
                      onChange={(e) => updateEditingContact('budget.min', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget max</label>
                    <input
                      type="number"
                      value={editingContact.budget?.max || ''}
                      onChange={(e) => updateEditingContact('budget.max', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Währung</label>
                    <select
                      value={editingContact.budget?.currency || 'EUR'}
                      onChange={(e) => updateEditingContact('budget.currency', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    >
                      <option value="EUR">EUR</option>
                      <option value="CHF">CHF</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={!!editingContact.consents?.newsletter_subscribed}
                      onChange={(e) => updateEditingContact('consents.newsletter_subscribed', e.target.checked)}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Newsletter</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={!!editingContact.consents?.marketing_consent}
                      onChange={(e) => updateEditingContact('consents.marketing_consent', e.target.checked)}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Marketing-Einwilligung</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={!!editingContact.consents?.gdpr_consent}
                      onChange={(e) => updateEditingContact('consents.gdpr_consent', e.target.checked)}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">DSGVO-Einwilligung</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button 
                  onClick={handleSaveContact}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetail; 