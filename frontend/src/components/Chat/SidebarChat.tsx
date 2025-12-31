import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MessageSquare, Plus, X, Search, Pin, Phone, Calendar, Send, Paperclip, Mic, Loader2 } from 'lucide-react';
import { listConversations, listMessages, sendMessage, createMeetingFromChat, createConversation, markConversationRead, listCoworkers } from '../../api';
import { createAppointment } from '../../api/calendar/api';
import type { Conversation, ChatMessage } from '../../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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
    const base = (import.meta.env.VITE_API_URL as string | undefined) || (process.env.REACT_APP_API_URL as string | undefined) || 'http://localhost:8000/api/v1';
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
      className={cn(
        "fixed top-0 right-0 h-full transition-all duration-300 overflow-hidden z-40",
        open ? 'w-[420px]' : 'w-0'
      )}
      aria-hidden={!open}
    >
      <div className="h-full backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex">
        {/* Conversations list */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900 dark:to-gray-950">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">Chats</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
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
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                className="pl-9 h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                placeholder="Suchen…"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 pr-2">
              {filtered.map((c) => {
                const other = c.participants.find(p=>p.id !== myId) || c.participants[0];
                const isActive = active?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left",
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    <Avatar className="w-10 h-10 border-2 border-white/20">
                      <AvatarImage src={other?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name||'N')}`} />
                      <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                        {(other?.name || 'N')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className={cn("text-sm font-semibold truncate", isActive ? 'text-white' : 'text-gray-900 dark:text-white')}>
                          {c.title || other?.name || 'Unterhaltung'}
                        </div>
                        {c.unreadCount ? (
                          <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5 text-[10px]">
                            {c.unreadCount}
                          </Badge>
                        ) : null}
                      </div>
                      <div className={cn("text-xs truncate", isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400')}>
                        {c.lastMessage?.content || '—'}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6",
                        pinned.includes(c.id) 
                          ? 'text-yellow-500 dark:text-yellow-400' 
                          : isActive ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                      )}
                      onClick={(e)=>{e.stopPropagation(); togglePin(c.id);}}
                      title={pinned.includes(c.id) ? 'Gepinnt' : 'Anheften'}
                    >
                      <Pin className={cn("w-3.5 h-3.5", pinned.includes(c.id) && "fill-current")} />
                    </Button>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950" onDragOver={preventDefault} onDrop={onDrop}>
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {active ? (
                <>
                  <div className="flex -space-x-2">
                    {active.participants.slice(0,3).map(p => (
                      <Avatar key={p.id} className="w-9 h-9 border-2 border-white dark:border-gray-800">
                        <AvatarImage src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`} />
                        <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs">
                          {p.name[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <div className="truncate min-w-0">
                    <div className="font-bold text-gray-900 dark:text-white truncate text-sm">
                      {active.title || active.participants.map(p=>p.name).join(', ')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {active.participants.length} Teilnehmer
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">Wähle einen Chat aus</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {active && (
                <>
                  <Button onClick={handleCreateMeeting} size="sm" variant="outline" className="h-8 text-xs">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Termin
                  </Button>
                  <Button onClick={()=>setApptOpen(true)} size="sm" variant="outline" className="h-8 text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 border-emerald-200 dark:border-emerald-800">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Neu
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Anruf (bald)">
                    <Phone className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {groups.map(([key, msgs]) => {
                const d = new Date(key);
                return (
                  <div key={key}>
                    <div className="sticky top-0 z-10 flex justify-center mb-4">
                      <Badge variant="secondary" className="text-[10px] px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {dateLabel(d)}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {msgs.map(m => {
                        const mine = (m.author.id === myId) || (m.author.id === 'me');
                        return (
                          <div key={m.id} className={cn("flex items-end gap-2", mine ? 'justify-end' : 'justify-start')}>
                            {!mine && (
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={m.author.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.author.name)}`} />
                                <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs">
                                  {m.author.name[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-lg",
                              mine 
                                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-md' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                            )}>
                              {m.type === 'text' ? (
                                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.content}</div>
                              ) : m.type === 'audio' ? (
                                <audio controls src={m.content} className="w-full" />
                              ) : (
                                <a href={m.content} className="underline flex items-center gap-2" target="_blank" rel="noreferrer">
                                  <Paperclip className="w-3.5 h-3.5" />
                                  Datei herunterladen
                                </a>
                              )}
                              <div className={cn("mt-1.5 text-[10px] font-medium", mine ? 'text-white/70' : 'text-gray-500 dark:text-gray-400')}>
                                {formatTime(m.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {!groups.length && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Noch keine Nachrichten</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Composer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-end gap-2">
              <AudioRecorder onSend={handleAudioSend} disabled={!active} />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleAttachClick}
                disabled={!active}
                title="Datei anhängen"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
              <div className="relative flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={active ? "Nachricht schreiben…" : "Wähle einen Chat aus"}
                  className="pr-20 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl h-11"
                  disabled={!active}
                />
                {typing && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500 dark:text-indigo-400 font-medium">
                    Tippt…
                  </div>
                )}
              </div>
              <Button
                onClick={handleSend}
                disabled={!active || isSending || !input.trim()}
                size="icon"
                className="h-11 w-11 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* New Conversation Picker Modal */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Neuer Chat
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setPickerOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Titel (optional)</Label>
                <Input
                  value={newChatTitle}
                  onChange={(e)=>setNewChatTitle(e.target.value)}
                  placeholder="z.B. Projekt Team"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Teammitglieder suchen</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={pickerSearch}
                    onChange={async (e)=>{
                      const v = e.target.value; setPickerSearch(v);
                      try { const res = await listCoworkers(v); setCoworkers(res.items || []); } catch {}
                    }}
                    className="pl-9 bg-white dark:bg-gray-800"
                    placeholder="Namen oder E-Mail eingeben…"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                {coworkers.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={(e)=>{
                      setSelectedIds(prev => e.target.checked ? [...prev, u.id] : prev.filter(x=>x!==u.id));
                    }} className="rounded" />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`} />
                      <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs">
                        {u.name[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name}</div>
                      {u.role && <div className="text-xs text-gray-500 dark:text-gray-400">{u.role}</div>}
                    </div>
                  </label>
                ))}
                {!coworkers.length && (
                  <div className="p-6 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Keine Ergebnisse gefunden</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={()=>setPickerOpen(false)}>
                  Abbrechen
                </Button>
                <Button
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
                  disabled={!selectedIds.length}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                >
                  Erstellen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Appointment Modal */}
      {apptOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Neuen Termin erstellen
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setApptOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Titel</Label>
                <Input
                  value={apptTitle}
                  onChange={e=>setApptTitle(e.target.value)}
                  placeholder="z.B. Team-Besprechung"
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Startzeit</Label>
                  <Input
                    type="datetime-local"
                    value={apptStart}
                    onChange={e=>setApptStart(e.target.value)}
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Dauer (Min)</Label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={apptDurationMin}
                    onChange={e=>setApptDurationMin(parseInt(e.target.value||'60'))}
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Teilnehmer werden aus dem aktuellen Chat übernommen.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={()=>setApptOpen(false)}>
                  Abbrechen
                </Button>
                <Button
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
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Erstellen
                </Button>
              </div>
            </CardContent>
          </Card>
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
    <Button
      variant={recording ? "destructive" : "ghost"}
      size="icon"
      className={cn("h-9 w-9", recording && "animate-pulse")}
      onClick={recording ? stop : start}
      disabled={disabled}
      title="Sprachnachricht"
    >
      <Mic className={cn("w-4 h-4", recording && "fill-current")} />
    </Button>
  );
};

export default SidebarChat;
