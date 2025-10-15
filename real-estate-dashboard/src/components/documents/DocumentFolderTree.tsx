import React, { useState } from 'react';
import { DocumentFolder } from '../../types/document';
import { useCreateFolder } from '../../api/hooks';

interface DocumentFolderTreeProps {
  folders: DocumentFolder[];
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

interface FolderItemProps {
  folder: DocumentFolder;
  level: number;
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  expandedFolders: Set<string>;
  onToggleExpanded: (folderId: string) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({
  folder,
  level,
  selectedFolder,
  onFolderSelect,
  expandedFolders,
  onToggleExpanded
}) => {
  const isExpanded = expandedFolders.has(folder.id);
  const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;
  const isSelected = selectedFolder === folder.id;

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600 dark:text-blue-400',
      green: 'text-green-600 dark:text-green-400',
      purple: 'text-purple-600 dark:text-purple-400',
      orange: 'text-orange-600 dark:text-orange-400',
      red: 'text-red-600 dark:text-red-400',
      indigo: 'text-indigo-600 dark:text-indigo-400',
      pink: 'text-pink-600 dark:text-pink-400',
      gray: 'text-gray-600 dark:text-gray-400'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div>
      <div
        className={`flex items-center py-2 px-2 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onFolderSelect(folder.id)}
      >
        {hasSubfolders && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpanded(folder.id);
            }}
            className="mr-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <i className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line text-xs`}></i>
          </button>
        )}
        
        <div className={`w-4 h-4 flex items-center justify-center mr-2 ${!hasSubfolders ? 'ml-5' : ''}`}>
          <i className={`${folder.icon} text-sm ${getColorClass(folder.color)}`}></i>
        </div>
        
        <span className="flex-1 text-sm font-medium truncate">
          {folder.name}
        </span>
        
        {folder.documentCount > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs rounded-full">
            {folder.documentCount}
          </span>
        )}
      </div>

      {hasSubfolders && isExpanded && (
        <div>
          {folder.subfolders.map(subfolder => (
            <FolderItem
              key={subfolder.id}
              folder={subfolder}
              level={level + 1}
              selectedFolder={selectedFolder}
              onFolderSelect={onFolderSelect}
              expandedFolders={expandedFolders}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DocumentFolderTree: React.FC<DocumentFolderTreeProps> = ({
  folders,
  selectedFolder,
  onFolderSelect
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['verkauf', 'marketing']));
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const createFolder = useCreateFolder();

  const handleToggleExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Ordner
        </h3>
        <button
          onClick={() => onFolderSelect(null)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            selectedFolder === null
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Alle anzeigen
        </button>
      </div>

      <div className="space-y-1">
        {/* All Documents */}
        <div
          className={`flex items-center py-2 px-2 rounded-lg cursor-pointer transition-colors ${
            selectedFolder === null
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => onFolderSelect(null)}
        >
          <div className="w-4 h-4 flex items-center justify-center mr-2">
            <i className="ri-folder-line text-sm text-gray-600 dark:text-gray-400"></i>
          </div>
          <span className="flex-1 text-sm font-medium">
            Alle Dokumente
          </span>
        </div>

        {/* Recent Documents */}
        <div
          className={`flex items-center py-2 px-2 rounded-lg cursor-pointer transition-colors ${
            selectedFolder === 'recent'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => onFolderSelect('recent')}
        >
          <div className="w-4 h-4 flex items-center justify-center mr-2">
            <i className="ri-time-line text-sm text-green-600 dark:text-green-400"></i>
          </div>
          <span className="flex-1 text-sm font-medium">
            Zuletzt verwendet
          </span>
        </div>

        {/* Favorites */}
        <div
          className={`flex items-center py-2 px-2 rounded-lg cursor-pointer transition-colors ${
            selectedFolder === 'favorites'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => onFolderSelect('favorites')}
        >
          <div className="w-4 h-4 flex items-center justify-center mr-2">
            <i className="ri-star-line text-sm text-yellow-600 dark:text-yellow-400"></i>
          </div>
          <span className="flex-1 text-sm font-medium">
            Favoriten
          </span>
        </div>

        {/* Shared */}
        <div
          className={`flex items-center py-2 px-2 rounded-lg cursor-pointer transition-colors ${
            selectedFolder === 'shared'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => onFolderSelect('shared')}
        >
          <div className="w-4 h-4 flex items-center justify-center mr-2">
            <i className="ri-share-line text-sm text-purple-600 dark:text-purple-400"></i>
          </div>
          <span className="flex-1 text-sm font-medium">
            Geteilt
          </span>
        </div>

        {/* Expired */}
        <div
          className={`flex items-center py-2 px-2 rounded-lg cursor-pointer transition-colors ${
            selectedFolder === 'expired'
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => onFolderSelect('expired')}
        >
          <div className="w-4 h-4 flex items-center justify-center mr-2">
            <i className="ri-alert-line text-sm text-red-600 dark:text-red-400"></i>
          </div>
          <span className="flex-1 text-sm font-medium">
            Abgelaufen
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>

        {/* Custom Folders */}
        {folders.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            level={0}
            selectedFolder={selectedFolder}
            onFolderSelect={onFolderSelect}
            expandedFolders={expandedFolders}
            onToggleExpanded={handleToggleExpanded}
          />
        ))}
      </div>

      {/* Create Folder Button */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {showCreate ? (
          <div className="space-y-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ordnername"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                disabled={!newName.trim() || createFolder.isPending}
                onClick={async () => {
                  await createFolder.mutateAsync({ 
                    name: newName.trim(), 
                    parent_id: selectedFolder ? parseInt(selectedFolder) : undefined 
                  });
                  setNewName('');
                  setShowCreate(false);
                }}
                className="flex-1 py-2 px-3 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                Erstellen
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewName(''); }}
                className="flex-1 py-2 px-3 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center py-2 px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <i className="ri-add-line mr-2"></i>
            Neuer Ordner
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentFolderTree; 
