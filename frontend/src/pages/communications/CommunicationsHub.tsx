import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Plus, Send, Smile, Link as LinkIcon, Loader2, Paperclip, Search } from 'lucide-react';
import {
  useChannels,
  useCreateChannel,
  useUpdateChannel,
  useAddChannelMember,
  useUpdateChannelMember,
  useRemoveChannelMember,
  useChannelMessages,
  useSendChannelMessage,
  useAddReaction,
  useRemoveReaction,
  useSearchMessages,
  Channel,
  ChannelMessage,
} from '../../api/hooks';
import { apiClient } from '../../lib/api/client';

const CommunicationsHub: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [channelName, setChannelName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [resourceType, setResourceType] = useState<'contact' | 'property' | 'task' | ''>('');
  const [resourceId, setResourceId] = useState('');
  const [resourceLabel, setResourceLabel] = useState('');
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceKind, setResourceKind] = useState<'contact' | 'property' | 'task'>('contact');
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceResults, setResourceResults] = useState<any[]>([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [fileObjectUrl, setFileObjectUrl] = useState('');
  const [threadParentId, setThreadParentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [settingsTopic, setSettingsTopic] = useState('');
  const [settingsName, setSettingsName] = useState('');
  const [settingsPrivate, setSettingsPrivate] = useState(false);
  const [memberInput, setMemberInput] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);

  const { data: channels, isLoading: channelsLoading } = useChannels();
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const addMember = useAddChannelMember();
  const updateMember = useUpdateChannelMember();
  const removeMember = useRemoveChannelMember();
  const sendMessage = useSendChannelMessage();
  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();

  const activeChannelId = selectedChannel || channels?.[0]?.id || null;
  const { data: messagesPage, isLoading: messagesLoading } = useChannelMessages(activeChannelId || '', {
    page: 1,
    size: 50,
  });
  const { data: searchResults, refetch: refetchSearch, isFetching: searchLoading } = useSearchMessages(searchTerm);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (searchTerm.trim().length === 0) return;
    const t = setTimeout(() => refetchSearch(), 250);
    return () => clearTimeout(t);
  }, [searchTerm, refetchSearch]);

  const handleCreateChannel = () => {
    const name = channelName.trim() || `Sofort-Chat ${new Date().toLocaleString('de-DE')}`;
    createChannel.mutate({ name, is_private: false, member_ids: [] }, {
      onSuccess: (ch) => {
        setSelectedChannel(ch.id);
        setChannelName('');
      },
    });
  };

  const handleFile = (file?: File | null) => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setFileObjectUrl(objectUrl);
    setAttachmentUrl(objectUrl);
    setAttachmentName(file.name);
  };

  const handleSend = () => {
    if (!activeChannelId || !messageText.trim()) return;
    setSendError(null);
    const attachments = attachmentUrl
      ? [
          {
            file_url: attachmentUrl,
            file_name: attachmentName || attachmentUrl.split('/').pop() || 'Attachment',
          },
        ]
      : [];
    const resource_links =
      resourceType && resourceId
        ? [
            {
              resource_type: resourceType,
              resource_id: resourceId,
              label: resourceLabel || (resourceType === 'contact' ? 'Kontakt' : resourceType === 'property' ? 'Immobilie' : 'Task'),
            },
          ]
        : [];
    const cleanAttachments = attachments.filter((a) => a.file_url);
    const cleanResources = resource_links.filter((r) => r.resource_type && r.resource_id);
    sendMessage.mutate(
      {
        channel_id: activeChannelId,
        content: messageText.trim(),
        attachments: cleanAttachments,
        resource_links: cleanResources,
        parent_id: threadParentId || undefined,
      },
      {
        onSuccess: () => {
          setMessageText('');
          setAttachmentUrl('');
          setAttachmentName('');
          setResourceId('');
          setResourceType('');
          setResourceLabel('');
          if (fileObjectUrl) {
            URL.revokeObjectURL(fileObjectUrl);
            setFileObjectUrl('');
          }
          setThreadParentId(null);
        },
        onError: (err: any) => {
          console.error('❌ Send message failed', err);
          setSendError(err?.message || 'Senden fehlgeschlagen');
        },
      }
    );
  };

  const handleReaction = (msg: ChannelMessage, emoji: string) => {
    const already = msg.reactions?.some((r) => r.emoji === emoji);
    if (already) {
      removeReaction.mutate({ message_id: msg.id, emoji, channel_id: msg.channel_id });
    } else {
      addReaction.mutate({ message_id: msg.id, emoji, channel_id: msg.channel_id });
    }
  };

  const activeChannel = useMemo<Channel | undefined>(() => channels?.find((c) => c.id === activeChannelId), [channels, activeChannelId]);
  const allMessages = messagesPage?.items || [];
  const rootMessages = allMessages.filter((m) => !m.parent_id);
  const repliesByParent = useMemo(() => {
    const map: Record<string, ChannelMessage[]> = {};
    allMessages.forEach((m) => {
      if (m.parent_id) {
        if (!map[m.parent_id]) map[m.parent_id] = [];
        map[m.parent_id].push(m);
      }
    });
    return map;
  }, [allMessages]);

  const pinnedResources = useMemo(() => {
    const seen = new Set<string>();
    const pins: { id: string; label: string; type: string; resourceId: string }[] = [];
    allMessages.forEach((m) => {
      m.resource_links?.forEach((r) => {
        const key = `${r.resource_type}-${r.resource_id}`;
        if (seen.has(key)) return;
        seen.add(key);
        pins.push({
          id: r.id,
          label: r.label || r.resource_type,
          type: r.resource_type,
          resourceId: r.resource_id,
        });
      });
    });
    return pins;
  }, [allMessages]);

  const emojiPalette = ['👍', '✅', '🔥', '❤️', '🎯', '💡', '🚀', '📌'];

  const loadResources = async () => {
    if (resourceLoading) return;
    setResourceLoading(true);
    try {
      let url = '';
      let params: any = {};
      if (resourceKind === 'contact') {
        url = '/api/v1/contacts';
        params.search = resourceSearch;
        params.page = 1;
        params.size = 20;
      } else if (resourceKind === 'property') {
        url = '/api/v1/properties';
        params.search = resourceSearch;
        params.page = 1;
        params.size = 20;
      } else {
        url = '/api/v1/tasks';
        params.search = resourceSearch;
        params.page = 1;
        params.size = 20;
      }
      const res: any = await apiClient.get(url, { params });
      const items = res?.items || res?.data || res;
      setResourceResults(Array.isArray(items) ? items : []);
    } catch (e) {
      setResourceResults([]);
    } finally {
      setResourceLoading(false);
    }
  };

  useEffect(() => {
    if (!showResourceModal) return;
    const t = setTimeout(() => loadResources(), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceSearch, resourceKind, showResourceModal]);

  useEffect(() => {
    if (activeChannel) {
      setSettingsName(activeChannel.name);
      setSettingsTopic(activeChannel.topic || '');
      setSettingsPrivate(activeChannel.is_private);
    }
  }, [activeChannel]);

  const handleUpdateChannel = () => {
    if (!activeChannelId) return;
    updateChannel.mutate({ id: activeChannelId, data: { name: settingsName, topic: settingsTopic, is_private: settingsPrivate } });
  };

  const handleAddMember = () => {
    if (!activeChannelId || !memberInput.trim()) return;
    addMember.mutate({ channel_id: activeChannelId, user_id: memberInput.trim(), role: 'member' });
    setMemberInput('');
  };

  const loadMembers = async () => {
    if (memberLoading) return;
    setMemberLoading(true);
    try {
      const res: any = await apiClient.get('/api/v1/users', {
        params: { search: memberSearch, page: 1, size: 20 },
      });
      const items = res?.items || res?.data || res;
      setMemberResults(Array.isArray(items) ? items : []);
    } catch (e) {
      setMemberResults([]);
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    if (!showMemberModal) return;
    const t = setTimeout(() => loadMembers(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberSearch, showMemberModal]);

  return (
    <div className="h-[calc(100vh-120px)] grid grid-cols-12 gap-4 p-4">
      {/* Channels */}
      <div className="col-span-3 space-y-3">
        <div className="rounded-2xl bg-white/85 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Channels & Teams</h2>
            </div>
            {channelsLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <input
              className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder="Channel-Name (z.B. Team Nord, Objekt 123...)"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
            <input
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
              placeholder="Thema / Agenda"
              value={settingsTopic}
              onChange={(e) => setSettingsTopic(e.target.value)}
            />
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={settingsPrivate}
                onChange={(e) => setSettingsPrivate(e.target.checked)}
              />
              Privat (nur Mitglieder)
            </label>
            <input
              className="col-span-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
              placeholder="Mitglieder-IDs/Emails, getrennt durch Kommas"
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
            />
            <button
              className="col-span-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-800"
              onClick={() => {
                if (!memberInput.trim()) return;
                memberInput
                  .split(',')
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .forEach((id) => addMember.mutate({ channel_id: activeChannelId || '', user_id: id, role: 'member' }));
                setMemberInput('');
              }}
            >
              Mitglieder anwenden
            </button>
            <button
              onClick={handleCreateChannel}
              className="col-span-1 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-1"
              disabled={createChannel.isPending}
            >
              {createChannel.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Chat starten</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white/85 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur p-3">
          <div className="flex items-center justify-between mb-2 text-sm font-semibold text-gray-800 dark:text-white">
            <span>Channel-Liste</span>
            <span className="text-[11px] text-gray-500">{channels?.length || 0} Einträge</span>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[65vh] pr-1">
            {channels?.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelectedChannel(ch.id)}
                className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition ${
                  activeChannelId === ch.id
                    ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-200 shadow-sm'
                    : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold truncate">{ch.name}</span>
                  {ch.is_private && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">Privat</span>
                  )}
                </div>
                {ch.topic && <div className="text-[12px] text-gray-500 line-clamp-1">{ch.topic}</div>}
                <div className="text-[11px] text-gray-400 mt-1">{ch.members?.length || 0} Mitglieder</div>
              </button>
            ))}
            {!channels?.length && !channelsLoading && (
              <div className="text-xs text-gray-500">Keine Channels vorhanden.</div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="col-span-6 bg-white/80 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm backdrop-blur flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-800 dark:text-white">{activeChannel?.name || 'Channel wählen'}</div>
              {activeChannel?.topic && <div className="text-xs text-gray-500">{activeChannel.topic}</div>}
            </div>
            <div className="flex flex-wrap gap-1">
              {pinnedResources.slice(0, 3).map((p) => (
                <a
                  key={p.id}
                  href={p.type === 'contact' ? `/contacts/${p.resourceId}` : `/properties/${p.resourceId}`}
                  className="text-[11px] px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                >
                  {p.label} • {p.resourceId.slice(0, 6)}…
                </a>
              ))}
            </div>
          </div>
          <LinkIcon className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messagesLoading && <div className="text-xs text-gray-500">Lade Nachrichten...</div>}
          {rootMessages.map((msg) => (
            <div key={msg.id} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>User {msg.user_id.slice(0, 6)}…</span>
                <span>{new Date(msg.created_at).toLocaleString('de-DE')}</span>
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{msg.content || 'Gelöscht'}</div>
              {msg.attachments?.length ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {msg.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 inline-flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      {a.file_name}
                    </a>
                  ))}
                </div>
              ) : null}
              {msg.resource_links?.length ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {msg.resource_links.map((r) => (
                    <a
                      key={r.id}
                      href={r.resource_type === 'contact' ? `/contacts/${r.resource_id}` : `/properties/${r.resource_id}`}
                      className="px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                    >
                      {r.label || r.resource_type} • {r.resource_id.slice(0, 6)}…
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center gap-2 mt-2">
                <button
                  className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1"
                  onClick={() => handleReaction(msg, '👍')}
                >
                  <Smile className="w-3 h-3" /> {msg.reactions?.find((r) => r.emoji === '👍') ? 'Entfernen' : '👍'}
                </button>
                {msg.reactions?.length > 0 && (
                  <div className="text-[11px] text-gray-500">
                    {msg.reactions.map((r) => r.emoji).join(' ')}
                  </div>
                )}
                <div className="flex gap-1">
                  {emojiPalette.map((emoji) => (
                    <button
                      key={emoji}
                      className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                      onClick={() => handleReaction(msg, emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
                <button
                  className="underline"
                  onClick={() => setThreadParentId(threadParentId === msg.id ? null : msg.id)}
                >
                  {threadParentId === msg.id ? 'Thread schließen' : 'Antworten'}
                </button>
                {repliesByParent[msg.id]?.length ? (
                  <span>{repliesByParent[msg.id].length} Antworten</span>
                ) : null}
              </div>
            </div>
          ))}
          {!messagesLoading && !messagesPage?.items?.length && (
            <div className="text-xs text-gray-500">Keine Nachrichten vorhanden.</div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800 text-sm"
            placeholder={
              activeChannelId
                ? threadParentId
                  ? 'Antwort im Thread eingeben…'
                  : 'Nachricht eingeben…'
                : 'Channel wählen um zu schreiben'
            }
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={!activeChannelId}
          />
          <button
            onClick={handleSend}
            disabled={!activeChannelId || sendMessage.isPending}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
          >
            {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Senden
          </button>
        </div>
        {sendError && <div className="text-[11px] text-red-500 mt-1">{sendError}</div>}
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <input
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800"
            placeholder="Attachment URL"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
          />
          <input
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800"
            placeholder="Attachment Name"
            value={attachmentName}
            onChange={(e) => setAttachmentName(e.target.value)}
          />
          <input
            type="file"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          <div className="flex gap-2 items-center">
            <button
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-700"
              onClick={() => setShowResourceModal(true)}
            >
              Resource auswählen
            </button>
            {resourceId && (
              <span className="text-[11px] px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                {resourceLabel || resourceType} • {resourceId.slice(0, 6)}…
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details / Threads / Search / Settings */}
      <div className="col-span-3 bg-white/80 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-gray-800 dark:text-white">Channel-Command</div>
            <div className="text-[12px] text-gray-500">Rollen, Privacy, Mitglieder & Suche</div>
          </div>
          {activeChannel && (
            <button
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-700 shadow-sm"
              onClick={handleUpdateChannel}
            >
              Speichern
            </button>
          )}
        </div>
        {activeChannel ? (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[12px] text-gray-500">Channel</div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                  {activeChannel.is_private ? 'Privat' : 'Offen'}
                </span>
              </div>
              <input
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                value={settingsName}
                onChange={(e) => setSettingsName(e.target.value)}
                placeholder="Channel-Name"
              />
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                value={settingsTopic}
                onChange={(e) => setSettingsTopic(e.target.value)}
                placeholder="Thema / Agenda"
                rows={2}
              />
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                <input
                  type="checkbox"
                  checked={settingsPrivate}
                  onChange={(e) => setSettingsPrivate(e.target.checked)}
                />
                Privat (nur Mitglieder)
              </label>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-gray-500">Mitglieder</div>
                  <div className="text-[11px] text-gray-400">{activeChannel.members?.length || 0} Personen</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-[11px] px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100"
                    onClick={handleAddMember}
                    disabled={!memberInput.trim()}
                  >
                    Hinzufügen
                  </button>
                  <button
                    className="text-[11px] px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                    onClick={() => setShowMemberModal(true)}
                  >
                    Suchen
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  placeholder="User-ID oder E-Mail"
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {activeChannel.members?.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-2 py-1"
                  >
                    <span className="text-xs text-gray-700 dark:text-gray-200">User {m.user_id.slice(0, 6)}…</span>
                    <div className="flex items-center gap-2">
                      <select
                        className="text-[11px] px-2 py-1 rounded bg-gray-200 dark:bg-gray-700"
                        value={m.role}
                        onChange={(e) =>
                          updateMember.mutate({ channel_id: activeChannel.id, member_user_id: m.user_id, role: e.target.value })
                        }
                      >
                        <option value="owner">Owner</option>
                        <option value="member">Member</option>
                        <option value="guest">Guest</option>
                      </select>
                      <button
                        className="text-[11px] px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-200"
                        onClick={() => removeMember.mutate({ channel_id: activeChannel.id, member_user_id: m.user_id })}
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Search className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-[12px] text-gray-500">Suche</div>
                  <div className="text-[11px] text-gray-400">Filtere Nachrichten, Ressourcen</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  placeholder="Suche in Nachrichten..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {searchLoading && <div className="text-[11px] text-gray-500">Suche...</div>}
              {searchResults?.items?.length ? (
                <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                  {searchResults.items.map((m) => (
                    <div key={m.id} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex justify-between text-[11px] text-gray-500">
                        <span>Channel {m.channel_id.slice(0, 6)}…</span>
                        <span>{new Date(m.created_at).toLocaleString('de-DE')}</span>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100 line-clamp-2">{m.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                searchTerm && !searchLoading && <div className="text-[11px] text-gray-500">Keine Treffer.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500">Wähle einen Channel aus.</div>
        )}

        {/* Thread View */}
        {threadParentId && (
          <div>
            <div className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Thread</div>
            <div className="space-y-2 text-sm max-h-64 overflow-y-auto pr-1">
              {repliesByParent[threadParentId]?.map((r) => (
                <div key={r.id} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-[11px] text-gray-500 flex justify-between">
                    <span>User {r.user_id.slice(0, 6)}…</span>
                    <span>{new Date(r.created_at).toLocaleString('de-DE')}</span>
                  </div>
                  <div className="text-gray-900 dark:text-gray-100">{r.content}</div>
                </div>
              )) || <div className="text-xs text-gray-500">Keine Antworten.</div>}
            </div>
          </div>
        )}

        {/* Suche */}
        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-white mb-2">Suche</div>
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800 text-sm"
              placeholder="Suche in Nachrichten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchLoading && <div className="text-xs text-gray-500">Suche...</div>}
          {searchResults?.items?.length ? (
            <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
              {searchResults.items.map((m) => (
                <div key={m.id} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Channel {m.channel_id.slice(0, 6)}…</span>
                    <span>{new Date(m.created_at).toLocaleString('de-DE')}</span>
                  </div>
                  <div className="text-gray-900 dark:text-gray-100 line-clamp-2">{m.content}</div>
                </div>
              ))}
            </div>
          ) : (
            searchTerm && !searchLoading && <div className="text-xs text-gray-500">Keine Treffer.</div>
          )}
        </div>
      </div>

      {showResourceModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Ressource auswählen</div>
              </div>
              <button
                className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                onClick={() => setShowResourceModal(false)}
              >
                Schließen
              </button>
            </div>
            <div className="flex gap-2 text-xs">
              {['contact', 'property', 'task'].map((kind) => (
                <button
                  key={kind}
                  onClick={() => setResourceKind(kind as any)}
                  className={`px-3 py-2 rounded-lg border ${
                    resourceKind === kind
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {kind === 'contact' ? 'Kontakte' : kind === 'property' ? 'Immobilien' : 'Tasks'}
                </button>
              ))}
              <div className="flex items-center gap-2 flex-1 ml-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800 text-sm"
                  placeholder="Suchen..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {resourceLoading && <div className="text-xs text-gray-500">Laden...</div>}
              {!resourceLoading && resourceResults.length === 0 && (
                <div className="text-xs text-gray-500">Keine Ergebnisse.</div>
              )}
              {resourceResults.map((r: any) => {
                const name = r.name || r.title || r.contact_name || r.subject || 'Unbenannt';
                const id = r.id || r.uuid || r.pk;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</div>
                      <div className="text-[11px] text-gray-500 truncate">{id}</div>
                    </div>
                    <button
                      className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                      onClick={() => {
                        setResourceType(resourceKind);
                        setResourceId(String(id));
                        setResourceLabel(name);
                        setShowResourceModal(false);
                      }}
                    >
                      Auswählen
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                <div className="text-sm font-semibold text-gray-800 dark:text-white">Mitglieder suchen</div>
              </div>
              <button
                className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                onClick={() => setShowMemberModal(false)}
              >
                Schließen
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800 text-sm"
                placeholder="Nach Namen oder E-Mail suchen..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {memberLoading && <div className="text-xs text-gray-500">Laden...</div>}
              {!memberLoading && memberResults.length === 0 && (
                <div className="text-xs text-gray-500">Keine Ergebnisse.</div>
              )}
              {memberResults.map((u: any) => {
                const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || u.name || 'Unbekannt';
                const id = u.id || u.user_id || u.uuid;
                const role = u.role || 'member';
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</div>
                      <div className="text-[11px] text-gray-500 truncate">{u.email || id}</div>
                    </div>
                    <button
                      className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                      onClick={() => {
                        if (activeChannelId) {
                          addMember.mutate({ channel_id: activeChannelId, user_id: String(id), role: role });
                        }
                        setShowMemberModal(false);
                      }}
                    >
                      Hinzufügen
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationsHub;
