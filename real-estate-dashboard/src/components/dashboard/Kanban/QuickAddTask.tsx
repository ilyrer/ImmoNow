import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAddTaskProps {
  columnId: string;
  onAdd: (taskData: {
    title: string;
    description?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    estimatedHours?: number;
  }) => void;
  onCancel: () => void;
}

const QuickAddTask: React.FC<QuickAddTaskProps> = ({ columnId, onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        estimatedHours
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setEstimatedHours(4);
      setShowAdvanced(false);
    }
  };

  const priorityOptions = [
    { value: 'critical', label: 'Kritisch', icon: '🔴' },
    { value: 'high', label: 'Hoch', icon: '🟠' },
    { value: 'medium', label: 'Mittel', icon: '🟡' },
    { value: 'low', label: 'Niedrig', icon: '🟢' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-3"
    >
      <form onSubmit={handleSubmit}>
        <div className="bg-white/60 dark:bg-white/15 backdrop-blur-2xl rounded-2xl border-2 
          border-blue-500/30 shadow-glass-lg p-4 space-y-3">
          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Aufgabentitel..."
            autoFocus
            className="w-full px-4 py-3 bg-white/50 dark:bg-white/10 backdrop-blur-sm 
              border border-white/30 dark:border-white/20 rounded-xl text-gray-900 
              dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
              focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-semibold"
          />

          {/* Advanced Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 
              dark:hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            {showAdvanced ? 'Weniger Details' : 'Mehr Details'}
          </button>

          {/* Advanced Fields */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Description */}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibung (optional)..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/50 dark:bg-white/10 backdrop-blur-sm 
                    border border-white/30 dark:border-white/20 rounded-xl text-gray-900 
                    dark:text-white placeholder-gray-500 dark:placeholder-gray-400 
                    focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none text-sm"
                />

                <div className="grid grid-cols-2 gap-3">
                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Priorität
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as typeof priority)}
                      className="w-full px-3 py-2 bg-white/50 dark:bg-white/10 backdrop-blur-sm 
                        border border-white/30 dark:border-white/20 rounded-lg text-gray-900 
                        dark:text-white text-sm focus:ring-2 focus:ring-blue-500/50"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estimated Hours */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Geschätzte Stunden
                    </label>
                    <input
                      type="number"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 0)}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 bg-white/50 dark:bg-white/10 backdrop-blur-sm 
                        border border-white/30 dark:border-white/20 rounded-lg text-gray-900 
                        dark:text-white text-sm focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 
                hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-semibold 
                text-sm transition-all shadow-glass disabled:opacity-50 disabled:cursor-not-allowed 
                disabled:hover:from-blue-500 disabled:hover:to-purple-600"
            >
              ✓ Erstellen
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 bg-white/50 dark:bg-white/10 hover:bg-white/70 
                dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 rounded-xl 
                font-semibold text-sm transition-all backdrop-blur-sm"
            >
              ✕ Abbrechen
            </button>
          </div>

          {/* Keyboard Hint */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-white/50 dark:bg-white/10 rounded border border-white/30 
                dark:border-white/20 font-mono">
                Enter
              </kbd>
              Erstellen
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 bg-white/50 dark:bg-white/10 rounded border border-white/30 
                dark:border-white/20 font-mono">
                Esc
              </kbd>
              Abbrechen
            </span>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default QuickAddTask;
