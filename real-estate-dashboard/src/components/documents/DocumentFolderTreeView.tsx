/**
 * Document Folder Tree View
 * Hierarchische Ordnerstruktur für Dokumente
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { DocumentFolder } from '../../types/document';

interface DocumentFolderTreeViewProps {
  folders: DocumentFolder[];
  selectedFolderId?: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onFolderCreate?: (parentId: string | null, name: string) => void;
  onFolderUpdate?: (folderId: string, name: string) => void;
  onFolderDelete?: (folderId: string) => void;
  onFolderMove?: (folderId: string, newParentId: string | null) => void;
  readOnly?: boolean;
  className?: string;
}

interface TreeNode extends DocumentFolder {
  children: TreeNode[];
  level: number;
}

const DocumentFolderTreeView: React.FC<DocumentFolderTreeViewProps> = ({
  folders,
  selectedFolderId,
  onFolderSelect,
  onFolderCreate,
  onFolderUpdate,
  onFolderDelete,
  onFolderMove,
  readOnly = false,
  className = '',
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [creatingInFolder, setCreatingInFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextMenuFolder, setContextMenuFolder] = useState<string | null>(null);

  // Convert flat folder list to tree structure
  const folderTree = useMemo(() => {
    const folderMap = new Map<string, TreeNode>();
    const rootFolders: TreeNode[] = [];

    // Create TreeNode objects
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        level: 0,
      });
    });

    // Build tree structure
    folders.forEach(folder => {
      const treeNode = folderMap.get(folder.id)!;
      
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(treeNode);
          treeNode.level = parent.level + 1;
        } else {
          rootFolders.push(treeNode);
        }
      } else {
        rootFolders.push(treeNode);
      }
    });

    // Sort folders alphabetically
    const sortFolders = (folders: TreeNode[]) => {
      folders.sort((a, b) => a.name.localeCompare(b.name));
      folders.forEach(folder => sortFolders(folder.children));
    };

    sortFolders(rootFolders);
    return rootFolders;
  }, [folders]);

  const toggleExpanded = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  const startEditing = useCallback((folder: TreeNode) => {
    setEditingFolder(folder.id);
    setEditingName(folder.name);
    setContextMenuFolder(null);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingFolder(null);
    setEditingName('');
  }, []);

  const saveEditing = useCallback(() => {
    if (editingFolder && editingName.trim() && onFolderUpdate) {
      onFolderUpdate(editingFolder, editingName.trim());
      setEditingFolder(null);
      setEditingName('');
    }
  }, [editingFolder, editingName, onFolderUpdate]);

  const startCreating = useCallback((parentId: string | null) => {
    setCreatingInFolder(parentId);
    setNewFolderName('');
    setContextMenuFolder(null);
    if (parentId) {
      setExpandedFolders(prev => new Set(prev).add(parentId));
    }
    // Trigger für Root-Ordner: Bei parentId === null setze creatingInFolder auf 'root'
    if (parentId === null) {
      setCreatingInFolder('root');
    }
  }, []);

  const cancelCreating = useCallback(() => {
    setCreatingInFolder(null);
    setNewFolderName('');
  }, []);

  const saveCreating = useCallback(() => {
    if (newFolderName.trim() && onFolderCreate) {
      // Für Root-Ordner (creatingInFolder === 'root') wird null als parentId übergeben
      const parentId = creatingInFolder === 'root' ? null : creatingInFolder;
      onFolderCreate(parentId, newFolderName.trim());
      setCreatingInFolder(null);
      setNewFolderName('');
    }
  }, [creatingInFolder, newFolderName, onFolderCreate]);

  const handleDelete = useCallback((folderId: string) => {
    if (onFolderDelete && window.confirm('Ordner wirklich löschen? Alle enthaltenen Dokumente werden verschoben.')) {
      onFolderDelete(folderId);
      setContextMenuFolder(null);
    }
  }, [onFolderDelete]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, action: 'edit' | 'create') => {
    if (e.key === 'Enter') {
      if (action === 'edit') {
        saveEditing();
      } else {
        saveCreating();
      }
    } else if (e.key === 'Escape') {
      if (action === 'edit') {
        cancelEditing();
      } else {
        cancelCreating();
      }
    }
  }, [saveEditing, saveCreating, cancelEditing, cancelCreating]);

  const renderTreeNode = (folder: TreeNode): React.ReactNode => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isEditing = editingFolder === folder.id;
    const hasChildren = folder.children.length > 0;
    const showContextMenu = contextMenuFolder === folder.id;

    return (
      <div key={folder.id} className="select-none">
        {/* Folder Row */}
        <div
          className={`
            flex items-center py-1.5 px-2 rounded-lg cursor-pointer group
            hover:bg-gray-50 dark:hover:bg-gray-800/50
            ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' : ''}
            ${folder.level > 0 ? `ml-${Math.min(folder.level * 4, 16)}` : ''}
          `}
          style={{
            paddingLeft: `${folder.level * 16 + 8}px`,
          }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => hasChildren && toggleExpanded(folder.id)}
            className={`
              p-0.5 mr-1 rounded transition-colors
              ${hasChildren ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : 'invisible'}
            `}
            disabled={!hasChildren}
          >
            {hasChildren && (
              isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )
            )}
          </button>

          {/* Folder Icon */}
          <div className="mr-2">
            {isExpanded && hasChildren ? (
              <FolderOpenIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            ) : (
              <FolderIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            )}
          </div>

          {/* Folder Name */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, 'edit')}
                onBlur={saveEditing}
                className="w-full px-1 py-0.5 text-sm bg-white dark:bg-gray-700 border border-blue-500 rounded focus:outline-none"
                autoFocus
              />
            ) : (
              <span
                onClick={() => onFolderSelect(folder.id)}
                className={`
                  block text-sm truncate
                  ${isSelected ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'}
                  hover:text-blue-600 dark:hover:text-blue-400
                `}
              >
                {folder.name}
              </span>
            )}
          </div>

          {/* Document Count */}
          {folder.documentCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded-full">
              {folder.documentCount}
            </span>
          )}

          {/* Actions Menu */}
          {!readOnly && !isEditing && (
            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setContextMenuFolder(showContextMenu ? null : folder.id);
                }}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <EllipsisHorizontalIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          )}
        </div>

        {/* Context Menu */}
        {showContextMenu && !readOnly && (
          <div className="ml-8 mt-1 mb-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            <div className="space-y-1">
              <button
                onClick={() => startCreating(folder.id)}
                className="w-full flex items-center px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Unterordner erstellen
              </button>
              <button
                onClick={() => startEditing(folder)}
                className="w-full flex items-center px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Umbenennen
              </button>
              <button
                onClick={() => handleDelete(folder.id)}
                className="w-full flex items-center px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Löschen
              </button>
            </div>
          </div>
        )}

        {/* New Folder Input */}
        {creatingInFolder === folder.id && (
          <div
            className="ml-8 mt-1 mb-2"
            style={{
              paddingLeft: `${(folder.level + 1) * 16}px`,
            }}
          >
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <div className="flex items-center">
                <FolderIcon className="w-5 h-5 text-blue-500 mr-2" />
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, 'create')}
                  onBlur={saveCreating}
                  placeholder="Unterordner-Name eingeben..."
                  className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter: Erstellen • Esc: Abbrechen
              </p>
            </div>
          </div>
        )}

        {/* Render Children */}
        {isExpanded && hasChildren && (
          <div>
            {folder.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {/* All Documents Option */}
      <div
        onClick={() => onFolderSelect(null)}
        className={`
          flex items-center py-2 px-2 rounded-lg cursor-pointer
          hover:bg-gray-50 dark:hover:bg-gray-800/50
          ${selectedFolderId === null ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' : ''}
        `}
      >
        <DocumentDuplicateIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
        <span
          className={`
            text-sm
            ${selectedFolderId === null ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'}
          `}
        >
          Alle Dokumente
        </span>
      </div>

      {/* New Folder Button (only if not creating and not read-only) */}
      {!readOnly && creatingInFolder === null && (
        <button
          onClick={() => startCreating(null)}
          className="w-full flex items-center py-2 px-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Neuer Ordner
        </button>
      )}

      {/* New Root Folder Input - zeige nur wenn Root-Ordner erstellt wird */}
      {!readOnly && creatingInFolder === 'root' && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Neuen Ordner erstellen
          </label>
          <div className="flex items-center">
            <FolderIcon className="w-5 h-5 text-blue-500 mr-2" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, 'create')}
              onBlur={saveCreating}
              placeholder="Ordnername eingeben..."
              className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Drücken Sie Enter zum Bestätigen oder Esc zum Abbrechen
          </p>
        </div>
      )}

      {/* Folder Tree */}
      <div className="space-y-1">
        {folderTree.map(folder => renderTreeNode(folder))}
      </div>
    </div>
  );
};

export default DocumentFolderTreeView;
