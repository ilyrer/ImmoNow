/**
 * ExposeTab Component
 * 
 * Main tab for AI-powered exposé generation.
 * Features: draft configuration, generation, preview, and version management.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileText,
  Globe,
  Target,
  Zap,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  Loader,
  Download,
  Trash2,
  Eye,
  Home,
  Key,
  Briefcase
} from 'lucide-react';
import { useExpose } from '../../hooks/useExpose';
import { ExposeVersionData } from '../../services/expose';
import ExposePreview from './ExposePreview';
import ExposeVersionList from './ExposeVersionList';

interface ExposeTabProps {
  propertyId: string;
}

const ExposeTab: React.FC<ExposeTabProps> = ({ propertyId }) => {
  const {
    exposeData,
    isLoading,
    generateExpose,
    isGenerating,
    saveExpose,
    isSaving,
    deleteExpose,
    isDeleting,
    publishExpose,
    isPublishing,
    generatePDF,
    isGeneratingPDF,
    downloadPDF,
    isDownloadingPDF,
    error
  } = useExpose(propertyId);

  // Draft configuration
  const [audience, setAudience] = useState<'kauf' | 'miete' | 'investor'>('kauf');
  const [tone, setTone] = useState<'neutral' | 'elegant' | 'kurz'>('neutral');
  const [language, setLanguage] = useState<'de' | 'en'>('de');
  const [length, setLength] = useState<'short' | 'standard' | 'long'>('standard');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ExposeVersionData | null>(null);
  const [editingVersion, setEditingVersion] = useState<ExposeVersionData | null>(null);
  const [currentPreview, setCurrentPreview] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setSuccessMessage(null);

      generateExpose({
        audience,
        tone,
        language,
        length,
        keywords
      });
    } catch (error) {
      console.error('Generation error:', error);
    }
  };

  const handleSaveVersion = async (version: ExposeVersionData) => {
    try {
      saveExpose({
        title: version.title,
        content: version.content,
        audience: version.audience,
        tone: version.tone,
        language: version.language,
        length: version.length,
        keywords: version.keywords
      });
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (window.confirm('Möchten Sie diese Exposé-Version wirklich löschen?')) {
      deleteExpose(versionId);
    }
  };

  const handlePublishVersion = async (versionId: string) => {
    publishExpose(versionId);
  };

  const handleDownloadPDF = async (versionId: string) => {
    downloadPDF(versionId);
  };

  const handlePreviewVersion = (version: ExposeVersionData) => {
    setSelectedVersion(version);
    setShowPreview(true);
  };

  const handleEditVersion = (version: ExposeVersionData) => {
    setEditingVersion(version);
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl"
          >
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-300 font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300 font-medium">{error.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">KI-Exposé Generator</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Konfiguration</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Zielgruppe */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Target className="h-4 w-4" />
                  Zielgruppe
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'kauf', label: 'Kauf', Icon: Home },
                    { value: 'miete', label: 'Miete', Icon: Key },
                    { value: 'investor', label: 'Investor', Icon: Briefcase }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAudience(option.value as 'kauf' | 'miete' | 'investor')}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${audience === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                    >
                      <option.Icon className={`h-5 w-5 mx-auto mb-1 ${audience === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                      <div className="text-xs font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tonalität */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Zap className="h-4 w-4" />
                  Tonalität
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as 'neutral' | 'elegant' | 'kurz')}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="neutral">Neutral & Sachlich</option>
                  <option value="elegant">Elegant & Exklusiv</option>
                  <option value="kurz">Kurz & Prägnant</option>
                </select>
              </div>

              {/* Sprache */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Globe className="h-4 w-4" />
                  Sprache
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'de', label: 'Deutsch', code: 'DE' },
                    { value: 'en', label: 'English', code: 'EN' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLanguage(option.value as 'de' | 'en')}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${language === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                    >
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${language === option.value ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>{option.code}</span>
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Länge */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <FileText className="h-4 w-4" />
                  Textlänge
                </label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as 'short' | 'standard' | 'long')}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="short">Kurz (~100 Wörter)</option>
                  <option value="standard">Standard (~200 Wörter)</option>
                  <option value="long">Lang (~300+ Wörter)</option>
                </select>
              </div>

              {/* SEO Keywords */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  <Sparkles className="h-4 w-4" />
                  SEO-Keywords
                </label>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="z.B. modern, zentral, saniert"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Durch Komma getrennt
                </p>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    Text vorschlagen
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Preview & Versions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview */}
          {showPreview && currentPreview && (
            <ExposePreview
              version={currentPreview}
              onSave={() => {
                if (currentPreview) {
                  handleSaveVersion(currentPreview);
                }
              }}
              onClose={() => setShowPreview(false)}
              onUpdate={(updated) => setCurrentPreview(updated)}
            />
          )}

          {/* Versions List */}
          <ExposeVersionList
            versions={exposeData?.versions || []}
            isLoading={isLoading}
            onSelect={(version) => {
              setCurrentPreview(version);
              setShowPreview(true);
            }}
            onDelete={handleDeleteVersion}
            onPublish={handlePublishVersion}
            onDownloadPDF={handleDownloadPDF}
            isDeleting={isDeleting}
            isPublishing={isPublishing}
            isDownloadingPDF={isDownloadingPDF}
          />
        </div>
      </div>
    </div>
  );
};

export default ExposeTab;
