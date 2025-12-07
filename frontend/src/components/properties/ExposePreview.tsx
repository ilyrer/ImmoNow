/**
 * ExposePreview Component
 * 
 * Editable preview card for generated exposé content.
 * Shows title, body text, highlights, word count, and quality meter.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Edit3,
  Save,
  X,
  FileText,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Download
} from 'lucide-react';
import { ExposeVersion, ExposeQuality } from '../../types/expose';

interface ExposePreviewProps {
  version: ExposeVersion;
  onSave: () => void;
  onClose: () => void;
  onUpdate: (updated: ExposeVersion) => void;
}

const ExposePreview: React.FC<ExposePreviewProps> = ({
  version,
  onSave,
  onClose,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(version.title);
  const [editedBody, setEditedBody] = useState(version.body);
  const [editedBullets, setEditedBullets] = useState([...version.bullets]);

  useEffect(() => {
    setEditedTitle(version.title);
    setEditedBody(version.body);
    setEditedBullets([...version.bullets]);
  }, [version]);

  const handleSave = () => {
    const wordCount = editedBody.split(/\s+/).length;
    const updated: ExposeVersion = {
      ...version,
      title: editedTitle,
      body: editedBody,
      bullets: editedBullets,
      wordCount,
      updatedAt: new Date().toISOString()
    };
    onUpdate(updated);
    setIsEditing(false);
  };

  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...editedBullets];
    newBullets[index] = value;
    setEditedBullets(newBullets);
  };

  const addBullet = () => {
    setEditedBullets([...editedBullets, '']);
  };

  const removeBullet = (index: number) => {
    setEditedBullets(editedBullets.filter((_, i) => i !== index));
  };

  const getQualityColor = (quality: ExposeQuality) => {
    switch (quality) {
      case 'high':
        return 'from-green-500 to-emerald-600';
      case 'med':
        return 'from-yellow-500 to-orange-500';
      case 'low':
        return 'from-red-500 to-red-600';
    }
  };

  const getQualityText = (quality: ExposeQuality) => {
    switch (quality) {
      case 'high': return 'Hervorragend';
      case 'med': return 'Gut';
      case 'low': return 'Verbesserungswürdig';
    }
  };

  const getQualityIcon = (quality: ExposeQuality) => {
    return quality === 'high' ? CheckCircle : quality === 'med' ? AlertCircle : AlertCircle;
  };

  const QualityIcon = getQualityIcon(version.quality);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden"
    >
      {/* Header */}
      <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Exposé Vorschau</h3>
              <p className="text-white/80 text-sm">Bearbeiten und speichern</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all"
                  title="Bearbeiten"
                >
                  <Edit3 className="h-4 w-4 text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onSave}
                  className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all"
                  title="Als Version speichern"
                >
                  <Save className="h-4 w-4 text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all"
                  title="Schließen"
                >
                  <X className="h-4 w-4 text-white" />
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Übernehmen
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditedTitle(version.title);
                    setEditedBody(version.body);
                    setEditedBullets([...version.bullets]);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all"
                >
                  Abbrechen
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Titel
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-4 py-3 text-lg font-bold bg-white dark:bg-gray-700 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editedTitle}
            </h2>
          )}
        </div>

        {/* Body Text */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Beschreibungstext
          </label>
          {isEditing ? (
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          ) : (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {editedBody}
            </p>
          )}
        </div>

        {/* Highlights */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Highlights ({editedBullets.length})
            </label>
            {isEditing && (
              <button
                onClick={addBullet}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                + Highlight hinzufügen
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {editedBullets.map((bullet, index) => (
              <div key={index} className="flex items-start gap-3">
                {!isEditing && (
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                )}
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => handleBulletChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={`Highlight ${index + 1}`}
                    />
                    <button
                      onClick={() => removeBullet(index)}
                      className="p-2 text-red-600 hover:text-red-700 dark:text-red-400"
                      title="Entfernen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-700 dark:text-gray-300">{bullet}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats & Quality */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Word Count */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700/50">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Wörter</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {version.wordCount}
            </div>
          </div>

          {/* SEO Score */}
          {version.seoScore && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-300">SEO</span>
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {version.seoScore}/100
              </div>
            </div>
          )}

          {/* Quality Meter */}
          <div className={`p-4 rounded-xl border bg-gradient-to-br ${getQualityColor(version.quality)} text-white`}>
            <div className="flex items-center gap-2 mb-2">
              <QualityIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Qualität</span>
            </div>
            <div className="text-2xl font-bold">
              {getQualityText(version.quality)}
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all flex items-center gap-2"
              disabled
              title="Demnächst verfügbar"
            >
              <Download className="h-4 w-4" />
              PDF erstellen
            </button>
            <button
              onClick={onSave}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Als Version speichern
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ExposePreview;
