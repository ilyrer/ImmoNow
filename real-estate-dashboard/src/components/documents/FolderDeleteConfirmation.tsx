/**
 * Confirmation Dialog für Folder Deletion
 * Sichere Bestätigung beim Löschen von Ordnern mit Inhalten
 */

import React from 'react';

interface FolderDeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  folderName: string;
  hasDocuments: boolean;
  hasSubfolders: boolean;
  documentCount?: number;
  subfolderCount?: number;
}

const FolderDeleteConfirmation: React.FC<FolderDeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  folderName,
  hasDocuments,
  hasSubfolders,
  documentCount = 0,
  subfolderCount = 0,
}) => {
  if (!isOpen) return null;

  const getWarningText = () => {
    if (hasDocuments && hasSubfolders) {
      return `Dieser Ordner enthält ${documentCount} Dokument(e) und ${subfolderCount} Unterordner. Alle Inhalte werden unwiderruflich gelöscht.`;
    } else if (hasDocuments) {
      return `Dieser Ordner enthält ${documentCount} Dokument(e). Alle Dokumente werden unwiderruflich gelöscht.`;
    } else if (hasSubfolders) {
      return `Dieser Ordner enthält ${subfolderCount} Unterordner. Alle Unterordner und deren Inhalte werden unwiderruflich gelöscht.`;
    }
    return 'Dieser Ordner wird gelöscht.';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <i className="ri-alert-line text-2xl text-red-600 dark:text-red-400"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Ordner löschen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <i className="ri-close-line text-xl text-gray-600 dark:text-gray-400"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Sind Sie sich sicher?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sie sind dabei, den Ordner <strong>"{folderName}"</strong> zu löschen.
            </p>
            
            {(hasDocuments || hasSubfolders) && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                <div className="flex items-start space-x-3">
                  <i className="ri-error-warning-line text-xl text-red-600 dark:text-red-400 mt-0.5"></i>
                  <div>
                    <h5 className="font-medium text-red-800 dark:text-red-200 mb-1">
                      Warnung: Ordner nicht leer
                    </h5>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {getWarningText()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400">
              <strong>Diese Aktion kann nicht rückgängig gemacht werden.</strong>
            </p>
          </div>

          {/* Content Summary */}
          {(hasDocuments || hasSubfolders) && (
            <div className="mb-6 space-y-2">
              <h5 className="font-medium text-gray-900 dark:text-white">
                Was wird gelöscht:
              </h5>
              {hasDocuments && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <i className="ri-file-line text-blue-500"></i>
                  <span>{documentCount} Dokument{documentCount !== 1 ? 'e' : ''}</span>
                </div>
              )}
              {hasSubfolders && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <i className="ri-folder-line text-yellow-500"></i>
                  <span>{subfolderCount} Unterordner</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
          >
            <i className="ri-delete-bin-line"></i>
            <span>Endgültig löschen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderDeleteConfirmation;
