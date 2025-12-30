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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="h-[calc(100vh-120px)] grid grid-cols-12 gap-4 p-4 max-w-[1920px] mx-auto">
        {/* Channels */}
        <div className="col-span-3 space-y-3">
          <Card className="shadow-xl border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900 dark:text-white">Channels & Teams</CardTitle>
                </div>
                {channelsLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium mb-1.5 block text-gray-700 dark:text-gray-300">Channel-Name</Label>
                  <Input
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    placeholder="z.B. Team Nord, Objekt 123..."
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block text-gray-700 dark:text-gray-300">Thema / Agenda</Label>
                  <Input
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    placeholder="Optional"
                    value={settingsTopic}
                    onChange={(e) => setSettingsTopic(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <Checkbox
                    id="private-channel"
                    checked={settingsPrivate}
                    onCheckedChange={(checked) => setSettingsPrivate(checked as boolean)}
                  />
                  <Label htmlFor="private-channel" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    Privat (nur Mitglieder)
                  </Label>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1.5 block text-gray-700 dark:text-gray-300">Mitglieder (IDs/Emails, Komma-getrennt)</Label>
                  <Input
                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    placeholder="user@example.com, 123"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
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
                    Anwenden
                  </Button>
                  <Button
                    onClick={handleCreateChannel}
                    size="sm"
                    className="text-xs bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white"
                    disabled={createChannel.isPending}
                  >
                    {createChannel.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                    Chat starten
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-900 dark:text-white">Channel-Liste</CardTitle>
                <Badge variant="secondary" className="text-[11px]">
                  {channels?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 overflow-y-auto max-h-[65vh] pr-1">
                {channels?.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${
                      activeChannelId === ch.id
                        ? 'border-indigo-300 bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950/50 dark:to-indigo-900/30 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-200 shadow-md shadow-indigo-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-800 dark:text-gray-200 hover:border-indigo-200 dark:hover:border-indigo-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold truncate">{ch.name}</span>
                      {ch.is_private && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5">Privat</Badge>
                      )}
                    </div>
                    {ch.topic && <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-1">{ch.topic}</div>}
                    <div className="text-[11px] text-gray-500 dark:text-gray-500">{ch.members?.length || 0} Mitglieder</div>
                  </button>
                ))}
                {!channels?.length && !channelsLoading && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Keine Channels vorhanden</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Messages */}
      <Card className="col-span-6 shadow-xl border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur flex flex-col">
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  {activeChannel?.name || 'Channel wählen'}
                </div>
                {activeChannel?.topic && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">{activeChannel.topic}</div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pinnedResources.slice(0, 3).map((p) => (
                  <Badge
                    key={p.id}
                    variant="secondary"
                    className="text-[10px] px-2 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 cursor-pointer"
                    asChild
                  >
                    <a
                      href={p.type === 'contact' ? `/contacts/${p.resourceId}` : `/properties/${p.resourceId}`}
                    >
                      <LinkIcon className="w-2.5 h-2.5 mr-1" />
                      {p.label}
                    </a>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messagesLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <span className="ml-2 text-sm text-gray-500">Lade Nachrichten...</span>
              </div>
            )}
            {rootMessages.map((msg) => (
              <Card key={msg.id} className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                      User {msg.user_id.slice(0, 6)}…
                    </Badge>
                    <span className="text-[10px]">{new Date(msg.created_at).toLocaleString('de-DE')}</span>
                  </div>
                  <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed mb-3">
                    {msg.content || 'Gelöscht'}
                  </div>
                  {msg.attachments?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2 mb-3">
                      {msg.attachments.map((a) => (
                        <Badge
                          key={a.id}
                          variant="secondary"
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                          asChild
                        >
                          <a href={a.file_url} target="_blank" rel="noreferrer">
                            <Paperclip className="w-3 h-3 mr-1" />
                            {a.file_name}
                          </a>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {msg.resource_links?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2 mb-3">
                      {msg.resource_links.map((r) => (
                        <Badge
                          key={r.id}
                          variant="secondary"
                          className="text-xs px-2 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 cursor-pointer"
                          asChild
                        >
                          <a href={r.resource_type === 'contact' ? `/contacts/${r.resource_id}` : `/properties/${r.resource_id}`}>
                            <LinkIcon className="w-2.5 h-2.5 mr-1" />
                            {r.label || r.resource_type}
                          </a>
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => handleReaction(msg, '👍')}
                    >
                      <Smile className="w-3 h-3 mr-1" />
                      {msg.reactions?.find((r) => r.emoji === '👍') ? 'Entfernen' : '👍'}
                    </Button>
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {msg.reactions.map((r) => (
                          <span key={r.emoji} className="text-sm">{r.emoji}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1 ml-auto">
                      {emojiPalette.map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleReaction(msg, emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs h-auto p-0"
                      onClick={() => setThreadParentId(threadParentId === msg.id ? null : msg.id)}
                    >
                      {threadParentId === msg.id ? 'Thread schließen' : 'Antworten'}
                    </Button>
                    {repliesByParent[msg.id]?.length ? (
                      <Badge variant="outline" className="text-[10px]">
                        {repliesByParent[msg.id].length} Antworten
                      </Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
          ))}
            {!messagesLoading && !messagesPage?.items?.length && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Noch keine Nachrichten</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl h-11"
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
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <Button
                onClick={handleSend}
                disabled={!activeChannelId || sendMessage.isPending || !messageText.trim()}
                size="icon"
                className="h-11 w-11 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50"
              >
                {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            {sendError && (
              <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                {sendError}
              </div>
            )}
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <Input
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                placeholder="Attachment URL"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
              />
              <Input
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                placeholder="Attachment Name"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
              />
              <Input
                type="file"
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              <div className="flex gap-2 items-center col-span-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowResourceModal(true)}
                >
                  Resource auswählen
                </Button>
                {resourceId && (
                  <Badge variant="secondary" className="text-[11px]">
                    {resourceLabel || resourceType} • {resourceId.slice(0, 6)}…
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

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
