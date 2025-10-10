import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import de from 'date-fns/locale/de';
import {
  MeetingNote,
  MeetingNotesFilterParams,
  MeetingTimeRange,
  getMeetingNotes,
  createMeetingNote,
  exportMeetingNote
} from '../../../api';

interface MeetingNotesProps {
  timeRange: MeetingTimeRange;
}

const MeetingNotes: React.FC<MeetingNotesProps> = ({ timeRange }) => {
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newNote, setNewNote] = useState({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    participants: [] as string[],
    content: '',
    decisions: [] as string[],
    tasks: [] as { task: string; assignee: string }[],
    category: 'vertrieb',
  });
  
  // Daten aus der API abrufen
  useEffect(() => {
    const fetchMeetingNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: MeetingNotesFilterParams = {
          timeRange,
          ...(searchTerm && { searchTerm }),
          ...(selectedCategory && { category: selectedCategory }),
        };
        
        const response = await getMeetingNotes(params);
        setMeetingNotes(response.items);
      } catch (err) {
        console.error('Fehler beim Abrufen der Besprechungsnotizen:', err);
        setError('Fehler beim Laden der Besprechungsnotizen. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingNotes();
  }, [timeRange, searchTerm, selectedCategory]);

  // Neue Notiz hinzufügen
  const handleAddNote = async () => {
    try {
      setLoading(true);
      
      // Formatierte Participants als Array
      const formattedParticipants = newNote.participants.length > 0
        ? newNote.participants
        : newNote.participants.toString().split(',').map(p => p.trim());
      
      // Aufgaben formatieren, falls als String eingegeben
      let formattedTasks = newNote.tasks;
      if (!Array.isArray(formattedTasks) || formattedTasks.length === 0) {
        const tasksString = String(newNote.tasks || '');
        formattedTasks = tasksString.split('\n')
          .filter(t => t.trim() !== '')
          .map(t => {
            const [task, assignee = ''] = t.split(':').map(s => s.trim());
            return { task, assignee };
          });
      }
      
      // Entscheidungen formatieren, falls als String eingegeben
      let formattedDecisions = newNote.decisions;
      if (!Array.isArray(formattedDecisions) || formattedDecisions.length === 0) {
        const decisionsString = String(newNote.decisions || '');
        formattedDecisions = decisionsString.split('\n')
          .filter(d => d.trim() !== '');
      }
      
      const noteData = {
        title: newNote.title,
        date: newNote.date,
        participants: formattedParticipants,
        content: newNote.content,
        decisions: formattedDecisions,
        tasks: formattedTasks,
        category: newNote.category,
      };
      
      const response = await createMeetingNote(noteData);
      
      // Hinzufügen der neuen Notiz zur Liste
      setMeetingNotes([...meetingNotes, response]);
      
      // Modal schließen und Form zurücksetzen
      setShowAddModal(false);
      setNewNote({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        participants: [],
        content: '',
        decisions: [],
        tasks: [],
        category: 'vertrieb',
      });
    } catch (err) {
      console.error('Fehler beim Erstellen der Besprechungsnotiz:', err);
      setError('Fehler beim Erstellen der Besprechungsnotiz. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Notiz exportieren
  const handleExport = async (id: string, format: 'pdf' | 'json' = 'pdf') => {
    try {
      const blob = await exportMeetingNote(id, format);
      
      // Download der Datei
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-note-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Fehler beim Exportieren der Besprechungsnotiz:', err);
      setError('Fehler beim Exportieren der Besprechungsnotiz. Bitte versuchen Sie es später erneut.');
    }
  };

  // Formatieren des Datums
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd. MMMM yyyy', { locale: de });
    } catch (e) {
      return dateString;
    }
  };

  // Container-Animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Item-Animation
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // Kategorien (können auch aus der API kommen)
  const categories = [
    { id: '', name: 'Alle' },
    { id: 'vertrieb', name: 'Vertrieb' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'management', name: 'Management' },
  ];

  // Ladezustand anzeigen
  if (loading && !meetingNotes.length) {
    return (
      <div className="bg-[#0f172a] rounded-2xl shadow-2xl border border-[#334155]/40 p-6 h-full">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Fehlerzustand anzeigen
  if (error) {
    return (
      <div className="bg-[#0f172a] rounded-2xl shadow-2xl border border-[#334155]/40 p-6 h-full">
        <div className="text-center text-red-500 p-6">
          <p>{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-white"
            onClick={() => window.location.reload()}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-[#0f172a] rounded-2xl shadow-2xl border border-[#334155]/40 overflow-hidden"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#334155]/50 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <i className="ri-file-text-line text-white text-lg"></i>
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">Besprechungsnotizen</h2>
            <p className="text-slate-400 text-xs">Dokumente und Zusammenfassungen von Meetings</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex items-center"
        >
          <i className="ri-add-line mr-1"></i>
          Notiz hinzufügen
        </button>
      </div>
      
      {/* Filterbereich */}
      <div className="p-3 bg-[#1e293b]/50 flex flex-wrap items-center gap-2">
        <div className="relative flex-grow max-w-xs">
          <input
            type="text"
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0f172a]/70 text-slate-300 placeholder-slate-500 border border-[#334155]/60 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <i className="ri-search-line absolute right-3 top-2 text-slate-500"></i>
        </div>
        
        <div className="flex items-center">
          <label className="text-slate-400 text-xs mr-2">Kategorie</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#0f172a]/70 text-slate-300 border border-[#334155]/60 rounded-lg py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Notizen-Liste */}
      <div className="max-h-[360px] overflow-y-auto p-2">
        {meetingNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <i className="ri-file-search-line text-5xl mb-4 opacity-50"></i>
            <p>Keine Besprechungsnotizen gefunden</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-indigo-500 text-sm flex items-center hover:underline"
            >
              <i className="ri-add-line mr-1"></i>
              Neue Notiz erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {meetingNotes.map((note) => (
              <motion.div
                key={note.id}
                className="bg-gradient-to-br from-[#1e293b]/70 to-[#1e1e2d]/80 rounded-lg p-3 border border-[#334155]/40 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-semibold line-clamp-1">
                      {note.title}
                    </h3>
                    <p className="text-slate-400 text-xs">{formatDate(note.date)}</p>
                  </div>
                  <div>
                    <span className="bg-indigo-900/50 text-indigo-300 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30">
                      {note.category || 'Allgemein'}
                    </span>
                  </div>
                </div>
                
                <p className="text-slate-300 text-sm line-clamp-2 mb-2">
                  {note.content}
                </p>
                
                <div className="flex items-center text-xs text-slate-400 mb-2">
                  <i className="ri-team-line mr-1"></i>
                  <span className="line-clamp-1">
                    {note.participants.length > 0
                      ? note.participants.join(', ')
                      : 'Keine Teilnehmer'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex space-x-2">
                    {note.decisions.length > 0 && (
                      <span className="text-xs text-emerald-300 flex items-center">
                        <i className="ri-checkbox-circle-line mr-1"></i>
                        {note.decisions.length} Entscheidungen
                      </span>
                    )}
                    
                    {note.tasks.length > 0 && (
                      <span className="text-xs text-amber-300 flex items-center">
                        <i className="ri-task-line mr-1"></i>
                        {note.tasks.length} Aufgaben
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleExport(note.id, 'pdf')}
                      className="text-slate-400 hover:text-indigo-300 transition-colors"
                      title="Als PDF exportieren"
                    >
                      <i className="ri-file-pdf-line"></i>
                    </button>
                    <button
                      onClick={() => handleExport(note.id, 'json')}
                      className="text-slate-400 hover:text-indigo-300 transition-colors"
                      title="Als JSON exportieren"
                    >
                      <i className="ri-file-code-line"></i>
                    </button>
                    <button
                      className="text-slate-400 hover:text-indigo-300 transition-colors"
                      title="Details anzeigen"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal zum Hinzufügen einer neuen Notiz */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-[#334155]/50 flex justify-between items-center">
              <h3 className="text-white font-bold">Neue Besprechungsnotiz</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">Titel*</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  className="w-full bg-[#0f172a]/70 text-white border border-[#334155]/60 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Titel der Besprechung"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Datum*</label>
                  <input
                    type="date"
                    value={newNote.date}
                    onChange={(e) => setNewNote({...newNote, date: e.target.value})}
                    className="w-full bg-[#0f172a]/70 text-white border border-[#334155]/60 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Kategorie</label>
                  <select
                    value={newNote.category}
                    onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                    className="w-full bg-[#0f172a]/70 text-white border border-[#334155]/60 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="vertrieb">Vertrieb</option>
                    <option value="marketing">Marketing</option>
                    <option value="management">Management</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm mb-1">Teilnehmer</label>
                <input
                  type="text"
                  value={newNote.participants}
                  onChange={(e) => setNewNote({...newNote, participants: e.target.value.split(',')})}
                  className="w-full bg-[#0f172a]/70 text-white border border-[#334155]/60 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Namen durch Komma trennen"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm mb-1">Inhalt*</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  className="w-full bg-[#0f172a]/70 text-white border border-[#334155]/60 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[120px]"
                  placeholder="Inhalt der Besprechung"
                  required
                ></textarea>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm mb-1">Entscheidungen</label>
                <textarea
                  value={newNote.decisions}
                  onChange={(e) => setNewNote({...newNote, decisions: e.target.value.split('\n')})}
                  className="w-full bg-[#0f172a]/70 text-white border border-[#334155]/60 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Eine Entscheidung pro Zeile"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm mb-1">Aufgaben</label>
                <textarea
                  value={newNote.tasks.map(task => `${task.task}: ${task.assignee}`).join('\n')}
                  onChange={(e) => {
                    const tasksText = e.target.value;
                    const tasksArray = tasksText.split('\n').map(line => {
                      const [task, assignee = ''] = line.split(':').map(s => s.trim());
                      return { task, assignee };
                    });
                    setNewNote({...newNote, tasks: tasksArray});
                  }}
                  className="w-full bg-[#0f172a]/70 text-white border border-[#334155]/60 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Format: Aufgabe: Verantwortlicher (eine pro Zeile)"
                ></textarea>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#334155]/50 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#334155]/60 text-white rounded-lg hover:bg-[#475569]/60 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors flex items-center"
                disabled={!newNote.title || !newNote.date || !newNote.content}
              >
                <i className="ri-save-line mr-1"></i>
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MeetingNotes;
