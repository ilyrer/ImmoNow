/**
 * SocialHub Composer Component
 * Post-Editor für Social Media Beiträge
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../common/Card';
// TODO: Implement real composer API
import {
  SocialPost,
  PostType,
  SocialPlatform,
  PLATFORM_ICONS,
  PLATFORM_COLORS,
} from '../Types';

interface ComposerViewProps {
  onBack: () => void;
}

const ComposerView: React.FC<ComposerViewProps> = ({ onBack }) => {
  const [postText, setPostText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [selectedType, setSelectedType] = useState<PostType>('text');
  const [scheduledDate, setScheduledDate] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);

  const connectedAccounts: any[] = []; // TODO: Get from real API

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedMedia(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = () => {
    console.log('Publishing post...', {
      text: postText,
      platforms: selectedPlatforms,
      type: selectedType,
      media: uploadedMedia,
      scheduledDate,
    });
  };

  const characterCount = postText.length;
  const maxCharacters = 280; // Twitter limit as example

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <i className="ri-arrow-left-line text-xl text-gray-600 dark:text-gray-400"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Beitrag erstellen
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Erstellen und planen Sie Ihre Social Media Beiträge
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Composer */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inhalt</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Post Type Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Beitragstyp
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['text', 'image', 'video', 'carousel'] as PostType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type === 'text' && <i className="ri-text mr-1"></i>}
                      {type === 'image' && <i className="ri-image-line mr-1"></i>}
                      {type === 'video' && <i className="ri-video-line mr-1"></i>}
                      {type === 'carousel' && <i className="ri-layout-grid-line mr-1"></i>}
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Editor */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Beitragstext
                </label>
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Was möchten Sie teilen?"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-4 text-sm">
                    <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                      <i className="ri-hashtag mr-1"></i>
                      Hashtags
                    </button>
                    <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                      <i className="ri-at-line mr-1"></i>
                      Erwähnen
                    </button>
                    <button className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                      <i className="ri-emotion-line mr-1"></i>
                      Emoji
                    </button>
                  </div>
                  <span className={`text-sm ${
                    characterCount > maxCharacters
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {characterCount} / {maxCharacters}
                  </span>
                </div>
              </div>

              {/* Media Upload */}
              {(selectedType === 'image' || selectedType === 'video' || selectedType === 'carousel') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medien
                  </label>
                  
                  {/* Upload Button */}
                  <label className="block">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                      <i className="ri-upload-cloud-line text-3xl text-gray-400 dark:text-gray-500 mb-2"></i>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Klicken Sie hier, um Dateien hochzuladen
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {selectedType === 'video' ? 'Videos' : 'Bilder'} bis 50MB
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

                  {/* Uploaded Media Preview */}
                  {uploadedMedia.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {uploadedMedia.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            onClick={() => removeMedia(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <i className="ri-close-line"></i>
                          </button>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                            {file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Plattformen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connectedAccounts.map((account: any) => (
                  <button
                    key={account.id}
                    onClick={() => togglePlatform(account.platform)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                      selectedPlatforms.includes(account.platform)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${PLATFORM_COLORS[account.platform as keyof typeof PLATFORM_COLORS]}`}>
                        <i className={`${PLATFORM_ICONS[account.platform as keyof typeof PLATFORM_ICONS]} text-lg`}></i>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {account.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{account.username}
                        </p>
                      </div>
                    </div>
                    {selectedPlatforms.includes(account.platform) && (
                      <i className="ri-checkbox-circle-fill text-blue-600 dark:text-blue-400 text-xl"></i>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Planung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Veröffentlichung
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="publish-time"
                        checked={!scheduledDate}
                        onChange={() => setScheduledDate('')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        Sofort veröffentlichen
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="publish-time"
                        checked={!!scheduledDate}
                        onChange={() => setScheduledDate(new Date().toISOString().slice(0, 16))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        Zeitplan festlegen
                      </span>
                    </label>
                  </div>
                </div>

                {scheduledDate !== '' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Datum & Uhrzeit
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent>
              <div className="space-y-3">
                <button
                  onClick={handlePublish}
                  disabled={!postText.trim() || selectedPlatforms.length === 0}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {scheduledDate ? (
                    <>
                      <i className="ri-calendar-line mr-2"></i>
                      Planen
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-fill mr-2"></i>
                      Veröffentlichen
                    </>
                  )}
                </button>
                <button className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <i className="ri-save-line mr-2"></i>
                  Als Entwurf speichern
                </button>
                <button className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <i className="ri-eye-line mr-2"></i>
                  Vorschau
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ComposerView;
