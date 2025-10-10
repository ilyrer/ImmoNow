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
  Loader
} from 'lucide-react';
import { 
  ExposeAudience, 
  ExposeTone, 
  ExposeLanguage, 
  ExposeLength,
  GenerateExposeRequest 
} from '../../types/expose';
// TODO: Implement real expose API hooks
import ExposePreview from './ExposePreview';
import ExposeVersionList from './ExposeVersionList';

interface ExposeTabProps {
  propertyId: string;
}

const ExposeTab: React.FC<ExposeTabProps> = ({ propertyId }) => {
  // TODO: Implement real expose API hooks
  const generateExpose = (request: GenerateExposeRequest) => Promise.resolve();
  const isGenerating = false;
  const generateError = null;
  const versions: any[] = [];
  const isLoadingVersions = false;
  const saveVersion = (version: any) => Promise.resolve();
  const removeVersion = (versionId: string) => Promise.resolve();
  const publishVersion = (versionId: string) => Promise.resolve();
  
  // Draft configuration
  const [audience, setAudience] = useState<ExposeAudience>('kauf');
  const [tone, setTone] = useState<ExposeTone>('neutral');
  const [lang, setLang] = useState<ExposeLanguage>('de');
  const [length, setLength] = useState<ExposeLength>('standard');
  const [keywords, setKeywords] = useState<string>('');
  
  // UI state
  const [currentPreview, setCurrentPreview] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setSuccessMessage(null);
      
      const request: GenerateExposeRequest = {
        propertyId,
        audience,
        tone,
        lang,
        length,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        includeFinancials: true,
        includeLocation: true,
        includeFeatures: true
      };
      
      const version = await generateExpose(request);
      setCurrentPreview(version);
      setShowPreview(true);
      setSuccessMessage('Exposé erfolgreich generiert!');
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error generating expose:', error);
    }
  };
  
  const handleSaveVersion = async () => {
    if (currentPreview) {
      try {
        await saveVersion(currentPreview);
        setSuccessMessage('Version erfolgreich gespeichert!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Error saving version:', error);
      }
    }
  };

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
      {generateError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300 font-medium">{generateError}</span>
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
                    { value: 'kauf', label: 'Kauf', icon: '🏠' },
                    { value: 'miete', label: 'Miete', icon: '🔑' },
                    { value: 'investor', label: 'Investor', icon: '💼' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAudience(option.value as ExposeAudience)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                        audience === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
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
                  onChange={(e) => setTone(e.target.value as ExposeTone)}
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
                    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
                    { value: 'en', label: 'English', flag: '🇬🇧' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setLang(option.value as ExposeLanguage)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                        lang === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <span className="text-xl">{option.flag}</span>
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
                  onChange={(e) => setLength(e.target.value as ExposeLength)}
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
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
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
              onSave={handleSaveVersion}
              onClose={() => setShowPreview(false)}
              onUpdate={(updated) => setCurrentPreview(updated)}
            />
          )}

          {/* Versions List */}
          <ExposeVersionList
            versions={versions}
            isLoading={isLoadingVersions}
            onSelect={(version) => {
              setCurrentPreview(version);
              setShowPreview(true);
            }}
            onDelete={removeVersion}
            onPublish={publishVersion}
          />
        </div>
      </div>
    </div>
  );
};

export default ExposeTab;
