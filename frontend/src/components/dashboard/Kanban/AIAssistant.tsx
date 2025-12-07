import React, { useState, useEffect } from 'react';
// @ts-ignore - Notwendig für Kompatibilität mit framer-motion@4.1.17
import { motion, AnimatePresence } from 'framer-motion';
import {
  AITaskSuggestion,
  AIPropertyDescription,
  TaskAnalysisParams,
  PropertyDescriptionParams,
  suggestTaskPriority,
  generatePropertyDescription,
  checkAIServiceAvailability
} from '../../../api';

interface AIAssistantProps {
  onSuggestTask?: (suggestion: AITaskSuggestion) => void;
  onGenerateDescription?: (description: AIPropertyDescription) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  onSuggestTask,
  onGenerateDescription
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'descriptions' | 'analysis'>('tasks');
  const [taskInput, setTaskInput] = useState({
    title: '',
    description: '',
    teamContext: ''
  });
  const [aiAvailable, setAiAvailable] = useState<boolean>(true);
  const [aiMessage, setAiMessage] = useState<string | undefined>(undefined);

  // Überprüfe die Verfügbarkeit des AI-Services beim Laden
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const status = await checkAIServiceAvailability();
        setAiAvailable(status.available);
        setAiMessage(status.message);
      } catch (error) {
        setAiAvailable(false);
        setAiMessage('Fehler bei der Überprüfung der KI-Verfügbarkeit');
      }
    };

    checkAvailability();
  }, []);

  const handleTaskAnalysis = async () => {
    try {
      setIsLoading(true);
      
      // Erstelle Parameter-Objekt für die API
      const params: TaskAnalysisParams = {
        taskTitle: taskInput.title,
        taskDescription: taskInput.description,
        teamContext: taskInput.teamContext
      };
      
      // API-Aufruf
      const suggestion = await suggestTaskPriority(params);
      
      // Weitergabe des Ergebnisses an die übergeordnete Komponente
      onSuggestTask?.(suggestion);
      
      // Modal schließen und Lade-Status zurücksetzen
      setIsOpen(false);
      setIsLoading(false);
    } catch (error) {
      console.error('Fehler bei der KI-Analyse:', error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* KI-Assistent Button */}
      <motion.button
        className="ki-button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
      >
        <i className="ri-robot-line"></i>
      </motion.button>

      {/* KI-Assistent Modal */}
      {/* @ts-ignore */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-container"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="modal-header">
                <div className="header-content">
                  <h3 className="modal-title">
                    <i className="ri-robot-line"></i>
                    KI-Assistent
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="close-button"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="tab-container">
                  <button
                    className={`tab-button ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                  >
                    Aufgaben-Analyse
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'descriptions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('descriptions')}
                  >
                    Immobilien-Beschreibungen
                  </button>
                  <button
                    className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysis')}
                  >
                    Marktanalyse
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="modal-content">
                {activeTab === 'tasks' && (
                  <div className="form-container">
                    <div className="form-group">
                      <label className="form-label">
                        Aufgabentitel
                      </label>
                      <input
                        type="text"
                        value={taskInput.title}
                        onChange={(e) => setTaskInput({ ...taskInput, title: e.target.value })}
                        className="form-input"
                        placeholder="z.B. Besichtigung Villa Seeblick"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        Beschreibung
                      </label>
                      <textarea
                        value={taskInput.description}
                        onChange={(e) => setTaskInput({ ...taskInput, description: e.target.value })}
                        rows={3}
                        className="form-textarea"
                        placeholder="Detaillierte Beschreibung der Aufgabe..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Team-Kontext
                      </label>
                      <input
                        type="text"
                        value={taskInput.teamContext}
                        onChange={(e) => setTaskInput({ ...taskInput, teamContext: e.target.value })}
                        className="form-input"
                        placeholder="z.B. Vertriebsteam Nord"
                      />
                    </div>

                    <button
                      onClick={handleTaskAnalysis}
                      disabled={isLoading}
                      className="submit-button"
                    >
                      {isLoading ? (
                        <span className="button-content">
                          <i className="ri-loader-4-line loading-icon"></i>
                          Analysiere...
                        </span>
                      ) : (
                        <span className="button-content">
                          <i className="ri-magic-line"></i>
                          KI-Analyse starten
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {activeTab === 'descriptions' && (
                  <div className="placeholder-content">
                    <i className="ri-file-text-line"></i>
                    <p>Immobilien-Beschreibungen Generator</p>
                    <p className="placeholder-subtitle">Demnächst verfügbar</p>
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div className="placeholder-content">
                    <i className="ri-line-chart-line"></i>
                    <p>Marktanalyse & Trends</p>
                    <p className="placeholder-subtitle">Demnächst verfügbar</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <p className="footer-text">
                  Powered by OpenAI GPT-4 • Alle Vorschläge sollten überprüft werden
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 
