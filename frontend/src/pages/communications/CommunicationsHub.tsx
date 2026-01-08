import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Plus, Send, Smile, Link as LinkIcon, Loader2, Paperclip, Search, Users, Info, Lock, FileText } from 'lucide-react';
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
import { apiClient } from '../../api/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AIMessageImprover } from '@/components/communications/AIMessageImprover';
import { AIReplySuggester } from '@/components/communications/AIReplySuggester';
import { AISummaryGenerator } from '@/components/communications/AISummaryGenerator';

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
    <div className="h-[calc(100vh-140px)] bg-gray-50 dark:bg-black overflow-hidden -m-6 flex flex-col">
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 max-w-[1920px] mx-auto min-h-0">
        {/* Left Sidebar - Bento Box */}
        <div className="col-span-3 flex flex-col bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden h-full">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Channels
              </h2>
              {channelsLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
          </div>

          {/* Create Channel */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 space-y-2.5 bg-white dark:bg-gray-950">
            <Input
              className="h-9 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Neuer Channel..."
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="private-channel"
                  checked={settingsPrivate}
                  onCheckedChange={(checked) => setSettingsPrivate(checked as boolean)}
                  className="h-4 w-4"
                />
                <Label htmlFor="private-channel" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                  Privat
                </Label>
              </div>
              <Button
                onClick={handleCreateChannel}
                size="sm"
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                disabled={createChannel.isPending || !channelName.trim()}
              >
                {createChannel.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Plus className="w-3 h-3 mr-1.5" />}
                Erstellen
              </Button>
            </div>
          </div>

          {/* Channel List */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
            <div className="px-2 py-3">
              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-2">
                {channels?.length || 0} Channels
              </div>
              <div className="space-y-0.5">
                {channels?.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      activeChannelId === ch.id
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate flex-1">#{ch.name}</span>
                      {ch.is_private && (
                        <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
                {!channels?.length && !channelsLoading && (
                  <div className="text-center py-12 px-2">
                    <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-800 mx-auto mb-3" />
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-500 mb-1">Keine Channels</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-600">Erstelle einen neuen Channel</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area - Main Stage */}
        <div className="col-span-6 flex flex-col bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden min-h-0">
          {/* Header */}
          <div className="flex-shrink-0 bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800/50">
            <div className="px-5 py-3">
              {activeChannel ? (
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Channel Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                        {activeChannel.name}
                      </h1>
                      {activeChannel.is_private && (
                        <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{activeChannel.members?.length || 0} Mitglieder</span>
                      {activeChannel.topic && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span className="truncate">{activeChannel.topic}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Group */}
                  <div className="flex items-center gap-0.5">
                    <AISummaryGenerator
                      channel={activeChannel}
                      messages={allMessages}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900"
                          title="Zusammenfassen"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900"
                      title="Mitglieder"
                      onClick={() => setShowMemberModal(true)}
                    >
                      <Users className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900"
                      title="Suche"
                      onClick={() => {
                        const searchInput = document.querySelector('[placeholder*="Nachrichten durchsuchen"]') as HTMLInputElement;
                        searchInput?.focus();
                      }}
                    >
                      <Search className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-1">
                  <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-0.5">Channel wählen</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Wähle einen Channel aus der Liste</p>
                </div>
              )}
            </div>
          </div>

          {/* Messages - Slack-like Rhythm */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-black min-h-0">
            <div className="px-5 py-4">
              {messagesLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 dark:text-gray-500" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-500">Lade Nachrichten...</span>
                </div>
              )}
              <div className="space-y-1">
                {rootMessages.map((msg) => (
                  <div key={msg.id} className="group py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-900 flex items-center justify-center text-[11px] font-semibold text-gray-600 dark:text-gray-400 mt-0.5">
                        {msg.user_id.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-[15px] font-semibold text-gray-900 dark:text-white">
                            User {msg.user_id.slice(0, 6)}…
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[15px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                          {msg.content || 'Gelöscht'}
                        </div>
                        {msg.attachments?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((a) => (
                              <a
                                key={a.id}
                                href={a.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                              >
                                <Paperclip className="w-3 h-3" />
                                {a.file_name}
                              </a>
                            ))}
                          </div>
                        ) : null}
                        {msg.resource_links?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.resource_links.map((r) => (
                              <a
                                key={r.id}
                                href={r.resource_type === 'contact' ? `/contacts/${r.resource_id}` : `/properties/${r.resource_id}`}
                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                              >
                                <LinkIcon className="w-3 h-3" />
                                {r.label || r.resource_type}
                              </a>
                            ))}
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex items-center gap-1">
                              {msg.reactions.map((r) => (
                                <button
                                  key={r.emoji}
                                  onClick={() => handleReaction(msg, r.emoji)}
                                  className="text-sm hover:scale-110 transition-transform"
                                >
                                  {r.emoji}
                                </button>
                              ))}
                            </div>
                          )}
                          {activeChannel && (
                            <AIReplySuggester
                              message={msg}
                              channel={activeChannel}
                              recentMessages={rootMessages}
                              onSuggestion={(suggestion) => {
                                setMessageText(suggestion);
                                setThreadParentId(msg.id);
                              }}
                            />
                          )}
                          <button
                            onClick={() => handleReaction(msg, '👍')}
                            className="text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Reagieren
                          </button>
                          <button
                            onClick={() => setThreadParentId(threadParentId === msg.id ? null : msg.id)}
                            className="text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            {threadParentId === msg.id ? 'Thread schließen' : 'Antworten'}
                          </button>
                          {repliesByParent[msg.id]?.length ? (
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {repliesByParent[msg.id].length} Antworten
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {!messagesLoading && !messagesPage?.items?.length && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-800 mb-3" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Noch keine Nachrichten</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Beginne die Unterhaltung</p>
                </div>
              )}
            </div>
          </div>

          {/* Composer - Slack-like - Always Visible */}
          <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 dark:border-gray-800/50 bg-white dark:bg-black">
            {sendError && (
              <div className="mb-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded border border-red-200 dark:border-red-900">
                {sendError}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Input
                  className="w-full bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-blue-500/20 rounded-lg h-9 text-[15px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3"
                  placeholder={
                    activeChannelId
                      ? threadParentId
                        ? 'Antwort im Thread eingeben…'
                        : `Nachricht an #${activeChannel?.name || 'Channel'}`
                      : 'Channel wählen um zu schreiben'
                  }
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={!activeChannelId}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                {activeChannelId && messageText.trim() && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <AIMessageImprover
                      currentMessage={messageText}
                      onImprove={(improved) => setMessageText(improved)}
                      disabled={sendMessage.isPending}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.onchange = (e) => handleFile((e.target as HTMLInputElement).files?.[0] || null);
                    input.click();
                  }}
                  disabled={!activeChannelId}
                  title="Datei anhängen"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!activeChannelId || sendMessage.isPending || !messageText.trim()}
                  size="icon"
                  className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  title="Senden"
                >
                  {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            {(resourceId || messageText.trim()) && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {resourceId && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    <LinkIcon className="w-3 h-3 mr-1" />
                    {resourceLabel || resourceType}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  onClick={() => setShowResourceModal(true)}
                >
                  Verknüpfen
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Bento Box */}
        <div className="col-span-3 flex flex-col bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden h-full">
          <div className="px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Channel-Info
              </h3>
              {activeChannel && (
                <Button
                  size="sm"
                  className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  onClick={handleUpdateChannel}
                >
                  Speichern
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 bg-white dark:bg-gray-950">
            {activeChannel ? (
              <>
                {/* Channel Settings */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Channel-Name</Label>
                    <Input
                      className="h-8 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      placeholder="Channel-Name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Thema</Label>
                    <Input
                      className="h-8 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      value={settingsTopic}
                      onChange={(e) => setSettingsTopic(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="private-check"
                      checked={settingsPrivate}
                      onCheckedChange={(checked) => setSettingsPrivate(checked as boolean)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="private-check" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                      Privat
                    </Label>
                    <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto">
                      {activeChannel.is_private ? 'Privat' : 'Öffentlich'}
                    </span>
                  </div>
                </div>

                {/* Members */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mitglieder</Label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{activeChannel.members?.length || 0}</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      className="h-8 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="User-ID oder E-Mail"
                      value={memberInput}
                      onChange={(e) => setMemberInput(e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={handleAddMember}
                      disabled={!memberInput.trim()}
                    >
                      Hinzufügen
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs w-full"
                    onClick={() => setShowMemberModal(true)}
                  >
                    <Search className="w-3 h-3 mr-1.5" />
                    Mitglieder suchen
                  </Button>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {activeChannel.members?.map((m) => (
                      <div
                        key={m.user_id}
                        className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <span className="text-xs text-gray-700 dark:text-gray-200">User {m.user_id.slice(0, 6)}…</span>
                        <div className="flex items-center gap-1.5">
                          <select
                            className="text-[10px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            value={m.role}
                            onChange={(e) =>
                              updateMember.mutate({ channel_id: activeChannel.id, member_user_id: m.user_id, role: e.target.value })
                            }
                          >
                            <option value="owner" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">Owner</option>
                            <option value="member" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">Member</option>
                            <option value="guest" className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">Guest</option>
                          </select>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            onClick={() => removeMember.mutate({ channel_id: activeChannel.id, member_user_id: m.user_id })}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Suche</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      className="h-8 pl-8 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      placeholder="Nachrichten durchsuchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {searchLoading && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Suche...
                    </div>
                  )}
                  {searchResults?.items?.length ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {searchResults.items.map((m) => (
                        <div
                          key={m.id}
                          className="p-2 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                            <span>Channel {m.channel_id.slice(0, 6)}…</span>
                            <span>{new Date(m.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-xs text-gray-900 dark:text-gray-100 line-clamp-2">{m.content}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    searchTerm && !searchLoading && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">Keine Treffer</div>
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Wähle einen Channel</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showResourceModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Ressource auswählen</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowResourceModal(false)}
              >
                ×
              </Button>
            </div>
            <div className="flex gap-2">
              {['contact', 'property', 'task'].map((kind) => (
                <Button
                  key={kind}
                  variant={resourceKind === kind ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setResourceKind(kind as any)}
                >
                  {kind === 'contact' ? 'Kontakte' : kind === 'property' ? 'Immobilien' : 'Tasks'}
                </Button>
              ))}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="h-8 pl-8 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Suchen..."
                  value={resourceSearch}
                  onChange={(e) => setResourceSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              {resourceLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-gray-500" />
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Laden...</span>
                </div>
              )}
              {!resourceLoading && resourceResults.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400">Keine Ergebnisse</div>
              )}
              {resourceResults.map((r: any) => {
                const name = r.name || r.title || r.contact_name || r.subject || 'Unbenannt';
                const id = r.id || r.uuid || r.pk;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{id}</div>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        setResourceType(resourceKind);
                        setResourceId(String(id));
                        setResourceLabel(name);
                        setShowResourceModal(false);
                      }}
                    >
                      Auswählen
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Mitglieder suchen</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowMemberModal(false)}
              >
                ×
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                className="h-9 pl-9 text-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Nach Namen oder E-Mail suchen..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              {memberLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-gray-500" />
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Laden...</span>
                </div>
              )}
              {!memberLoading && memberResults.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-500 dark:text-gray-400">Keine Ergebnisse</div>
              )}
              {memberResults.map((u: any) => {
                const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || u.name || 'Unbekannt';
                const id = u.id || u.user_id || u.uuid;
                const role = u.role || 'member';
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email || id}</div>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        if (activeChannelId) {
                          addMember.mutate({ channel_id: activeChannelId, user_id: String(id), role: role });
                        }
                        setShowMemberModal(false);
                      }}
                    >
                      Hinzufügen
                    </Button>
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
