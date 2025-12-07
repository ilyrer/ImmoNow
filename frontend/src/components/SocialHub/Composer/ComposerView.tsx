/**
 * SocialHub Composer Component - Premium Design
 * Post-Editor für Social Media Beiträge mit Apple-Style Glassmorphism
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Calendar,
  Image as ImageIcon,
  Video,
  Type,
  LayoutGrid,
  Hash,
  AtSign,
  Smile,
  Clock,
  Save,
  Eye,
  Sparkles,
  X,
  Upload,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useSocialAccounts, useCreateSocialPost } from '../../../api/hooks';
import { PostType as PostTypeEnum } from '../../../api/types.gen';
import toast from 'react-hot-toast';

interface ComposerViewProps {
  onBack: () => void;
}

type LocalPostType = 'text' | 'image' | 'video' | 'carousel';

// Map local type to API enum
const postTypeToEnum = (type: LocalPostType): PostTypeEnum => {
  const map: Record<LocalPostType, PostTypeEnum> = {
    text: PostTypeEnum.TEXT,
    image: PostTypeEnum.IMAGE,
    video: PostTypeEnum.VIDEO,
    carousel: PostTypeEnum.CAROUSEL,
  };
  return map[type];
};

const PLATFORM_CONFIG: Record<string, {
  name: string;
  icon: string;
  color: string;
  bgGradient: string;
  maxChars: number;
}> = {
  instagram: {
    name: 'Instagram',
    icon: 'ri-instagram-line',
    color: 'text-pink-500',
    bgGradient: 'from-purple-600 via-pink-600 to-orange-500',
    maxChars: 2200,
  },
  facebook: {
    name: 'Facebook',
    icon: 'ri-facebook-fill',
    color: 'text-blue-600',
    bgGradient: 'from-blue-600 to-blue-700',
    maxChars: 63206,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'ri-linkedin-fill',
    color: 'text-blue-700',
    bgGradient: 'from-blue-700 to-blue-800',
    maxChars: 3000,
  },
  twitter: {
    name: 'X (Twitter)',
    icon: 'ri-twitter-x-fill',
    color: 'text-gray-900 dark:text-white',
    bgGradient: 'from-gray-800 to-gray-900',
    maxChars: 280,
  },
  youtube: {
    name: 'YouTube',
    icon: 'ri-youtube-fill',
    color: 'text-red-600',
    bgGradient: 'from-red-600 to-red-700',
    maxChars: 5000,
  },
};

const ComposerView: React.FC<ComposerViewProps> = ({ onBack }) => {
  const [postText, setPostText] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<LocalPostType>('text');
  const [scheduledDate, setScheduledDate] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);

  const { data: accounts, isLoading: accountsLoading } = useSocialAccounts();
  const createPost = useCreateSocialPost();

  const connectedAccounts = accounts?.filter(a => a.is_active) || [];

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  // Get selected platforms for character limit calculation
  const selectedPlatforms = connectedAccounts
    .filter(a => selectedAccountIds.includes(a.id))
    .map(a => a.platform);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedMedia(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!postText.trim() || selectedAccountIds.length === 0) {
      toast.error('Bitte Text eingeben und mindestens ein Konto wählen');
      return;
    }

    try {
      await createPost.mutateAsync({
        content: postText,
        account_ids: selectedAccountIds,
        post_type: postTypeToEnum(selectedType),
        scheduled_at: isScheduled && scheduledDate ? scheduledDate : undefined,
        media_urls: [],
        hashtags: hashtags,
        mentions: mentions,
      });
      toast.success(isScheduled ? 'Beitrag erfolgreich geplant!' : 'Beitrag wird veröffentlicht!');
      onBack();
    } catch (error) {
      toast.error('Fehler beim Erstellen des Beitrags');
    }
  };

  const characterCount = postText.length;
  const minMaxChars = selectedPlatforms.length > 0
    ? Math.min(...selectedPlatforms.map(p => PLATFORM_CONFIG[p]?.maxChars || 280))
    : 280;

  const postTypes = [
    { id: 'text', label: 'Text', icon: Type },
    { id: 'image', label: 'Bild', icon: ImageIcon },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'carousel', label: 'Karussell', icon: LayoutGrid },
  ];

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-[32px] blur-3xl -z-10"></div>

        <div className="relative bg-white/10 dark:bg-[#1C1C1E]/40 backdrop-blur-xl rounded-[32px] p-8 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="w-12 h-12 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/20 transition-all shadow-lg"
              >
                <ArrowLeft className="w-5 h-5 text-[#1C1C1E] dark:text-white" />
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
                  Beitrag erstellen
                </h1>
                <p className="text-[#3A3A3C] dark:text-gray-400 mt-1">
                  Erstellen Sie ansprechende Social Media Beiträge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-xl flex items-center gap-2 border border-white/30 dark:border-white/10 text-[#1C1C1E] dark:text-white font-medium hover:bg-white/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                KI-Assistent
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Type Selection */}
          <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <h3 className="text-lg font-semibold text-[#1C1C1E] dark:text-white mb-4">Beitragstyp</h3>
            <div className="flex gap-3">
              {postTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType(type.id as LocalPostType)}
                    className={`flex-1 py-4 px-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${isSelected
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-white/10 dark:bg-white/5 text-[#3A3A3C] dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 border border-white/20 dark:border-white/10'
                      }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Text Editor */}
          <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1C1C1E] dark:text-white">Inhalt</h3>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${characterCount > minMaxChars
                  ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                  : 'bg-white/20 dark:bg-white/10 text-[#3A3A3C] dark:text-gray-400'
                }`}>
                {characterCount} / {minMaxChars}
              </span>
            </div>

            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="Was möchten Sie mit Ihrer Zielgruppe teilen? ✨"
              rows={8}
              className="w-full px-5 py-4 bg-white/10 dark:bg-[#1C1C1E]/40 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-2xl text-[#1C1C1E] dark:text-white placeholder-[#3A3A3C]/50 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none transition-all text-lg"
            />

            <div className="flex items-center gap-3 mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-white/5 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-all border border-white/20 dark:border-white/10"
              >
                <Hash className="w-4 h-4" />
                <span className="text-sm font-medium">Hashtags</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-white/5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-all border border-white/20 dark:border-white/10"
              >
                <AtSign className="w-4 h-4" />
                <span className="text-sm font-medium">Erwähnen</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-white/5 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 transition-all border border-white/20 dark:border-white/10"
              >
                <Smile className="w-4 h-4" />
                <span className="text-sm font-medium">Emoji</span>
              </motion.button>
            </div>
          </div>

          {/* Media Upload */}
          {(selectedType === 'image' || selectedType === 'video' || selectedType === 'carousel') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            >
              <h3 className="text-lg font-semibold text-[#1C1C1E] dark:text-white mb-4">Medien</h3>

              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-white/30 dark:border-white/20 rounded-2xl p-10 text-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-[#1C1C1E] dark:text-white font-medium mb-1">
                    Dateien hochladen
                  </p>
                  <p className="text-sm text-[#3A3A3C] dark:text-gray-400">
                    {selectedType === 'video' ? 'Videos bis 100MB' : 'Bilder bis 50MB'} • Drag & Drop oder klicken
                  </p>
                </div>
                <input
                  type="file"
                  multiple={selectedType === 'carousel'}
                  accept={selectedType === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleMediaUpload}
                  className="hidden"
                />
              </label>

              {uploadedMedia.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {uploadedMedia.map((file, index) => (
                    <div key={index} className="relative group aspect-square">
                      <div className="w-full h-full bg-white/10 dark:bg-[#1C1C1E]/40 rounded-2xl overflow-hidden border border-white/20 dark:border-white/10">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeMedia(index)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Platform Selection */}
          <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <h3 className="text-lg font-semibold text-[#1C1C1E] dark:text-white mb-4">Plattformen</h3>

            {accountsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : connectedAccounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#3A3A3C] dark:text-gray-400 mb-4">Keine Konten verbunden</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onBack}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl text-sm font-medium"
                >
                  Konten verbinden
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3">
                {connectedAccounts.map((account) => {
                  const config = PLATFORM_CONFIG[account.platform];
                  const isSelected = selectedAccountIds.includes(account.id);

                  return (
                    <motion.button
                      key={account.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleAccount(account.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isSelected
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/20 dark:border-white/10 bg-white/5 hover:border-white/30 dark:hover:border-white/20'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 bg-gradient-to-br ${config?.bgGradient || 'from-gray-500 to-gray-600'} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                          <i className={`${config?.icon || 'ri-global-line'} text-xl`}></i>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[#1C1C1E] dark:text-white text-sm">
                            {config?.name || account.platform}
                          </p>
                          <p className="text-xs text-[#3A3A3C] dark:text-gray-400">
                            @{account.account_name}
                          </p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-purple-500 text-white' : 'bg-white/10 dark:bg-white/5'
                        }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scheduling */}
          <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <h3 className="text-lg font-semibold text-[#1C1C1E] dark:text-white mb-4">Planung</h3>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsScheduled(false)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${!isScheduled
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/20 dark:border-white/10 bg-white/5 hover:border-white/30'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!isScheduled ? 'bg-purple-500 text-white' : 'bg-white/10 text-[#3A3A3C] dark:text-gray-400'
                  }`}>
                  <Send className="w-5 h-5" />
                </div>
                <span className="font-medium text-[#1C1C1E] dark:text-white">Sofort veröffentlichen</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsScheduled(true);
                  if (!scheduledDate) {
                    const now = new Date();
                    now.setHours(now.getHours() + 1);
                    setScheduledDate(now.toISOString().slice(0, 16));
                  }
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isScheduled
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/20 dark:border-white/10 bg-white/5 hover:border-white/30'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isScheduled ? 'bg-purple-500 text-white' : 'bg-white/10 text-[#3A3A3C] dark:text-gray-400'
                  }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <span className="font-medium text-[#1C1C1E] dark:text-white">Zeitplan festlegen</span>
              </motion.button>

              <AnimatePresence>
                {isScheduled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 dark:bg-[#1C1C1E]/40 border border-white/20 dark:border-white/10 rounded-xl text-[#1C1C1E] dark:text-white focus:ring-2 focus:ring-purple-500/50"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white/10 dark:bg-[#1C1C1E]/30 backdrop-blur-xl rounded-[24px] p-6 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePublish}
                disabled={!postText.trim() || selectedPlatforms.length === 0 || createPost.isPending}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                {createPost.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isScheduled ? (
                  <>
                    <Calendar className="w-5 h-5" />
                    Planen
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Veröffentlichen
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-white/10 dark:bg-white/5 text-[#1C1C1E] dark:text-white font-medium rounded-2xl hover:bg-white/20 dark:hover:bg-white/10 transition-all border border-white/20 dark:border-white/10 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Als Entwurf speichern
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-white/5 dark:bg-white/5 text-[#3A3A3C] dark:text-gray-400 font-medium rounded-2xl hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Vorschau
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposerView;
