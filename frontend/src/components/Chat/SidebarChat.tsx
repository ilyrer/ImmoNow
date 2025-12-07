import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { listConversations, listMessages, sendMessage, createMeetingFromChat, createConversation, markConversationRead, listCoworkers } from '../../api';
import { createAppointment } from '../../api/calendar/api';
import type { Conversation, ChatMessage } from '../../api';

interface SidebarChatProps {
  open: boolean;
  onClose: () => void;
}

const SidebarChat: React.FC<SidebarChatProps> = ({ open, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [search, setSearch] = useState('');
  const [typing, setTyping] = useState(false);
  const [pinned, setPinned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('chat_pins') || '[]'); } catch { return []; }
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [coworkers, setCoworkers] = useState<{ id: string; name: string; role?: string; avatarUrl?: string }[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [apptOpen, setApptOpen] = useState(false);
  const [apptTitle, setApptTitle] = useState('Besprechung');
  const [apptStart, setApptStart] = useState(() => new Date().toISOString().slice(0,16)); // yyyy-MM-ddTHH:mm (local)
  const [apptDurationMin, setApptDurationMin] = useState(60);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const selectConversation = useCallback(async (c: Conversation) => {
    setActive(c);
    try {
      const res = await listMessages(c.id, 1, 100);
      setMessages(res.items);
      scrollToBottom();
      // mark as read
      try { await markConversationRead(c.id); } catch {}
    } catch (e) {
      console.error('Messages load failed', e);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await listConversations();
    setConversations(res.items);
    // Prefer last updated or first pinned
    const initial = res.items.find(c => pinned.includes(c.id)) || res.items.sort((a,b)=>new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime())[0];
    if (initial) selectConversation(initial);
      } catch (e) {
        console.error('Chat load failed', e);
      }
    })();
  }, [open, selectConversation, pinned]);

  // Realtime WS
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const base = (process.env.REACT_APP_API_URL as string | undefined) || 'http://localhost:8000/api/v1';
  const wsUrl = base.replace(/^http/, 'ws') + '/chat/ws?token=' + encodeURIComponent(token);
    const ws = new WebSocket(wsUrl, []);
    wsRef.current = ws;
    ws.onopen = () => {
      // Attach token via protocol is tricky; backend reads header; most browsers don't allow setting headers for WS.
      // Fallback: immediately close if not authorized; to support auth, switch to query param token.
    };
    ws.onmessage = (ev) => {
      try {
        const evt = JSON.parse(ev.data);
        if (evt.type === 'chat.message') {
          const msg = evt.data as ChatMessage;
          setMessages((cur) => (active && msg.conversationId === active.id) ? [...cur, msg] : cur);
          setConversations((list) => list.map(c => c.id === msg.conversationId ? { ...c, lastMessage: msg, updatedAt: msg.createdAt, unreadCount: (active && active.id === c.id) ? 0 : (c.unreadCount || 0) + 1 } : c));
          scrollToBottom();
        } else if (evt.type === 'chat.typing') {
          // optionally show typing
          if (active && evt.data?.conversationId === active.id) {
            setTyping(true);
            setTimeout(() => setTyping(false), 1200);
          }
        }
      } catch {}
    };
    ws.onclose = () => { wsRef.current = null; };
    return () => { try { ws.close(); } catch {} };
  }, [open, active]);

  // Send typing events
  useEffect(() => {
    if (!input || !active) return;
    const t = setTimeout(() => {
      try { wsRef.current?.send(JSON.stringify({ type: 'typing', conversationId: active.id })); } catch {}
    }, 50);
    return () => clearTimeout(t);
  }, [input, active]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  const handleSend = async () => {
    if (!active || !input.trim()) return;
    setIsSending(true);
    try {
      const msg = await sendMessage({ conversationId: active.id, type: 'text', content: input });
      setMessages((m) => [...m, msg]);
      setInput('');
      scrollToBottom();
    } catch (e) {
      console.error('Send failed', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachClick = () => fileInputRef.current?.click();
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!active) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const msg = await sendMessage({ conversationId: active.id, type: 'file', content: file });
      setMessages((m) => [...m, msg]);
      scrollToBottom();
    } catch (err) {
      console.error('File send failed', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAudioSend = async (blob: Blob) => {
    if (!active) return;
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
    try {
      const msg = await sendMessage({ conversationId: active.id, type: 'audio', content: file });
      setMessages((m) => [...m, msg]);
      scrollToBottom();
    } catch (e) {
      console.error('Audio send failed', e);
    }
  };

  const handleCreateMeeting = async () => {
    if (!active) return;
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    try {
      await createMeetingFromChat({
        conversationId: active.id,
        title: `Meeting: ${active.title || 'Team'}`,
        startDatetime: now.toISOString(),
        endDatetime: inOneHour.toISOString(),
        attendees: active.participants.map((p) => ({ userId: p.id, name: p.name, role: p.role || 'agent' }))
      });
      // Optional toast
      console.log('Meeting created');
    } catch (e) {
      console.error('Create meeting failed', e);
    }
  };

  // Derived UI state
  const myId = useMemo(() => localStorage.getItem('user_id') || 'me', []);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = conversations.slice().sort((a,b)=>{
      const ap = pinned.includes(a.id) ? 1 : 0;
      const bp = pinned.includes(b.id) ? 1 : 0;
      if (ap !== bp) return bp - ap; // pinned first
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    if (!q) return list;
    return list.filter(c => (c.title || '').toLowerCase().includes(q) || c.participants.some(p=>p.name.toLowerCase().includes(q)));
  }, [conversations, search, pinned]);

  const togglePin = (id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('chat_pins', JSON.stringify(next));
      return next;
    });
  };

  // Typing indicator (local UX)
  useEffect(() => {
    if (!input) return;
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 1200);
    return () => clearTimeout(t);
  }, [input]);

  // DnD upload
  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!active) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const msg = await sendMessage({ conversationId: active.id, type: 'file', content: file });
      setMessages((m) => [...m, msg]);
      scrollToBottom();
    } catch (err) {
      console.error('Drop upload failed', err);
    }
  };
  const preventDefault = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  // Helpers
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const dateLabel = (d: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (isSameDay(d, today)) return 'Heute';
    if (isSameDay(d, yesterday)) return 'Gestern';
    return d.toLocaleDateString('de-DE');
  };

  // Group messages by day
  const groups = useMemo(() => {
    const map: Record<string, ChatMessage[]> = {};
    for (const m of messages) {
      const key = new Date(m.createdAt).toDateString();
      (map[key] ||= []).push(m);
    }
    return Object.entries(map).sort(([a],[b]) => new Date(a).getTime() - new Date(b).getTime());
  }, [messages]);

  return (
    <aside
      className={`fixed top-0 right-0 h-full ${open ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden z-40`}
      aria-hidden={!open}
    >
      <div className="h-full backdrop-blur-xl bg-white/70 dark:bg-gray-800/60 border-l border-white/30 dark:border-white/10 flex">
        {/* Conversations list */}
        <div className="w-48 border-r border-white/30 dark:border-white/10 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Chats</span>
            <div className="flex items-center gap-1">
              <button
                className="p-1.5 rounded-md hover:bg-white/60 dark:hover:bg-white/10"
                onClick={async () => {
                  setPickerOpen(true);
                  setSelectedIds([]);
                  setNewChatTitle('');
                  try {
                    const res = await listCoworkers();
                    setCoworkers(res.items || []);
                  } catch (e) {
                    console.error('Coworkers load failed', e);
                  }
                }}
                title="Neuer Chat"
              >
                <i className="ri-add-line" />
              </button>
            </div>
          </div>
          <div className="mb-2">
            <div className="relative">
              <i className="ri-search-line absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-white/60 dark:bg-white/10 text-sm focus:outline-none"
                placeholder="Suchen…"
              />
            </div>
          </div>
          <div className="overflow-y-auto space-y-1">
            {filtered.map((c) => {
              const other = c.participants.find(p=>p.id !== myId) || c.participants[0];
              const isActive = active?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 ${isActive ? 'bg-white/80 dark:bg-white/10' : ''}`}
                >
                  <img src={other?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name||'N')}`} alt="avatar" className="w-7 h-7 rounded-full" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium truncate">{c.title || other?.name || 'Unterhaltung'}</div>
                      {c.unreadCount ? <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">{c.unreadCount}</span> : null}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{c.lastMessage?.content || '—'}</div>
                  </div>
                  <button type="button" onClick={(e)=>{e.stopPropagation(); togglePin(c.id);}} className={`text-xs ${pinned.includes(c.id) ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`} title={pinned.includes(c.id) ? 'Gepinnt' : 'Anheften'}>
                    <i className={pinned.includes(c.id) ? 'ri-pushpin-2-fill' : 'ri-pushpin-2-line'} />
                  </button>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 flex flex-col" onDragOver={preventDefault} onDrop={onDrop}>
          <div className="px-4 py-3 border-b border-white/30 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {active && (
                <>
                  <div className="flex -space-x-2">
                    {active.participants.slice(0,3).map(p => (
                      <img key={p.id} src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`} className="w-6 h-6 rounded-full border border-white/50" />
                    ))}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold truncate">{active.title || active.participants.map(p=>p.name).join(', ')}</div>
                    <div className="text-xs text-gray-500 truncate">{active.participants.length} Teilnehmer</div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCreateMeeting} className="px-2 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-500">
                Termin erstellen
              </button>
              <button onClick={()=>setApptOpen(true)} className="px-2 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-500" title="Schnell-Termin">
                Neu (Kalender)
              </button>
              <button className="p-1 rounded-md hover:bg-white/60 dark:hover:bg-white/10" title="Anruf (bald)">
                <i className="ri-phone-line" />
              </button>
              <button onClick={onClose} className="p-1 rounded-md hover:bg-white/60 dark:hover:bg-white/10">
                <i className="ri-close-line" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {groups.map(([key, msgs]) => {
              const d = new Date(key);
              return (
                <div key={key}>
                  <div className="sticky top-0 z-10 flex justify-center mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-gray-700/70 text-gray-500 border border-white/30 dark:border-white/10">{dateLabel(d)}</span>
                  </div>
                  <div className="space-y-2">
                    {msgs.map(m => {
                      const mine = (m.author.id === myId) || (m.author.id === 'me');
                      return (
                        <div key={m.id} className={`flex items-end ${mine ? 'justify-end' : 'justify-start'}`}>
                          {!mine && (
                            <img src={m.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.author.name)}`} className="w-7 h-7 rounded-full mr-2" />
                          )}
                          <div className={`max-w-[75%] rounded-2xl px-3 py-2 shadow ${mine ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white/80 dark:bg-white/10 rounded-bl-sm'}`}>
                            {m.type === 'text' ? (
                              <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                            ) : m.type === 'audio' ? (
                              <audio controls src={m.content} className="w-full" />
                            ) : (
                              <a href={m.content} className="underline" target="_blank" rel="noreferrer">Datei herunterladen</a>
                            )}
                            <div className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-gray-500'}`}>{formatTime(m.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="p-3 border-t border-white/30 dark:border-white/10">
            <div className="flex items-center gap-2">
              <AudioRecorder onSend={handleAudioSend} disabled={!active} />
              <button onClick={handleAttachClick} disabled={!active} className="p-2 rounded-full bg-white/60 dark:bg-white/10" title="Datei anhängen">
                <i className="ri-attachment-2" />
              </button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
              <div className="relative flex-1">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Nachricht schreiben…"
                  className="w-full rounded-xl px-3 py-2 bg-white/60 dark:bg-white/10 focus:outline-none"
                  disabled={!active}
                />
                {typing && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">Tippt…</div>}
              </div>
              <button onClick={handleSend} disabled={!active || isSending} className="px-3 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50">
                {isSending ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-send-plane-2-line" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Conversation Picker Modal */}
      {pickerOpen && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-[28rem] max-w-[90vw] rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Neuer Chat</div>
              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={()=>setPickerOpen(false)}>
                <i className="ri-close-line" />
              </button>
            </div>
            <div className="mb-3">
              <input
                value={newChatTitle}
                onChange={(e)=>setNewChatTitle(e.target.value)}
                placeholder="Titel (optional)"
                className="w-full rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="mb-2">
              <div className="relative">
                <i className="ri-search-line absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  value={pickerSearch}
                  onChange={async (e)=>{
                    const v = e.target.value; setPickerSearch(v);
                    try { const res = await listCoworkers(v); setCoworkers(res.items || []); } catch {}
                  }}
                  className="w-full pl-7 pr-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
                  placeholder="Teammitglieder suchen…"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
              {coworkers.map(u => (
                <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={(e)=>{
                    setSelectedIds(prev => e.target.checked ? [...prev, u.id] : prev.filter(x=>x!==u.id));
                  }} />
                  <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`} className="w-6 h-6 rounded-full" />
                  <div className="text-sm">{u.name}</div>
                  <div className="ml-auto text-xs text-gray-500">{u.role}</div>
                </label>
              ))}
              {!coworkers.length && (
                <div className="p-4 text-sm text-gray-500">Keine Ergebnisse</div>
              )}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600" onClick={()=>setPickerOpen(false)}>Abbrechen</button>
              <button
                className="px-3 py-1.5 rounded-md bg-indigo-600 text-white disabled:opacity-50"
                disabled={!selectedIds.length}
                onClick={async ()=>{
                  try {
                    const me = localStorage.getItem('user_id') || '1';
                    const participantIds = Array.from(new Set([...selectedIds, me]));
                    const c = await createConversation({ participantIds, title: newChatTitle || undefined });
                    setConversations(prev => [c, ...prev]);
                    setPickerOpen(false);
                    setSelectedIds([]);
                    setNewChatTitle('');
                    selectConversation(c);
                  } catch (e) { console.error('Chat creation failed', e); }
                }}
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Appointment Modal */}
      {apptOpen && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="w-[28rem] max-w-[90vw] rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Neuen Termin erstellen</div>
              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" onClick={()=>setApptOpen(false)}>
                <i className="ri-close-line" />
              </button>
            </div>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" value={apptTitle} onChange={e=>setApptTitle(e.target.value)} placeholder="Titel" />
              <div className="flex gap-2">
                <input type="datetime-local" className="flex-1 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" value={apptStart} onChange={e=>setApptStart(e.target.value)} />
                <input type="number" min={15} step={15} className="w-28 px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" value={apptDurationMin} onChange={e=>setApptDurationMin(parseInt(e.target.value||'60'))} />
              </div>
              <div className="text-xs text-gray-500">Dauer (Minuten)</div>
              <div className="text-xs text-gray-500">Teilnehmer werden aus dem aktuellen Chat übernommen.</div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600" onClick={()=>setApptOpen(false)}>Abbrechen</button>
              <button
                className="px-3 py-1.5 rounded-md bg-emerald-600 text-white"
                onClick={async () => {
                  try {
                    if (!active) return;
                    const start = new Date(apptStart);
                    const end = new Date(start.getTime() + apptDurationMin * 60000);
                    const attendees = active.participants.map(p => {
                      const numId = /^[0-9]+$/.test(p.id) ? parseInt(p.id, 10) : undefined;
                      return { name: p.name, role: p.role || 'agent', user_id: numId, email_notifications: true } as any;
                    });
                    await createAppointment({
                      title: apptTitle || 'Termin',
                      type: 'meeting',
                      start_datetime: start.toISOString(),
                      end_datetime: end.toISOString(),
                      timezone: 'Europe/Berlin',
                      attendees,
                    });
                    setApptOpen(false);
                  } catch (err) {
                    console.error('Create appointment failed', err);
                  }
                }}
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

const AudioRecorder: React.FC<{ onSend: (blob: Blob) => void; disabled?: boolean }> = ({ onSend, disabled }) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const chunks = useRef<Blob[]>([]);

  const start = async () => {
    if (disabled || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        chunks.current = [];
        onSend(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      setMediaRecorder(rec);
      setRecording(true);
    } catch (e) {
      console.error('Mic permission denied', e);
    }
  };

  const stop = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  return (
    <button onClick={recording ? stop : start} disabled={disabled} className={`p-2 rounded-full ${recording ? 'bg-red-500 text-white' : 'bg-white/60 dark:bg-white/10'}`} title="Sprachnachricht">
      <i className={recording ? 'ri-stop-fill' : 'ri-mic-line'} />
    </button>
  );
};

export default SidebarChat;
