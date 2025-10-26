import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, FileText, Image, Video, Music, Archive, User, Calendar, Star } from 'lucide-react';
import { GlassCard, GlassInput, GlassButton } from './GlassUI';
import { DocumentResponse } from '../../api/types.gen';

interface SearchSuggestion {
  id: string;
  type: 'document' | 'folder' | 'user' | 'tag';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  metadata?: {
    size?: string;
    date?: string;
    type?: string;
  };
}

interface DocumentSearchProps {
  documents: DocumentResponse[];
  onSearch: (query: string) => void;
  onSelectDocument?: (document: DocumentResponse) => void;
  placeholder?: string;
  className?: string;
}

const DocumentSearch: React.FC<DocumentSearchProps> = ({
  documents,
  onSearch,
  onSelectDocument,
  placeholder = "Dokumente durchsuchen...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('documentRecentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (query.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      generateSuggestions(query);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, documents]);

  const generateSuggestions = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      const newSuggestions: SearchSuggestion[] = [];
      const queryLower = searchQuery.toLowerCase();

      // Search documents
      documents.forEach(doc => {
        const titleMatch = doc.title.toLowerCase().includes(queryLower);
        const fileNameMatch = doc.file_name.toLowerCase().includes(queryLower);
        const typeMatch = doc.document_type.toLowerCase().includes(queryLower);

        if (titleMatch || fileNameMatch || typeMatch) {
          newSuggestions.push({
            id: doc.id.toString(),
            type: 'document',
            title: doc.title,
            subtitle: doc.file_name,
            icon: getDocumentIcon(doc.document_type),
            metadata: {
              size: formatFileSize(doc.file_size),
              date: new Date(doc.uploaded_at).toLocaleDateString('de-DE'),
              type: doc.document_type
            }
          });
        }
      });

      // Add recent searches if query is empty or very short
      if (queryLower.length <= 2) {
        recentSearches.slice(0, 5).forEach(search => {
          newSuggestions.push({
            id: `recent-${search}`,
            type: 'document',
            title: search,
            subtitle: 'Letzte Suche',
            icon: <Clock className="w-4 h-4 text-gray-500" />
          });
        });
      }

      // Limit suggestions
      setSuggestions(newSuggestions.slice(0, 8));
      setIsLoading(false);
    }, 200);
  }, [documents, recentSearches]);

  const getDocumentIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4 text-purple-500" />;
    if (type.startsWith('audio/')) return <Music className="w-4 h-4 text-green-500" />;
    if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    return <Archive className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'document') {
      const document = documents.find(doc => doc.id.toString() === suggestion.id);
      if (document) {
        onSelectDocument?.(document);
        setQuery(document.title);
        setShowSuggestions(false);
        addToRecentSearches(document.title);
      }
    } else {
      setQuery(suggestion.title);
      setShowSuggestions(false);
      addToRecentSearches(suggestion.title);
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query);
      addToRecentSearches(query);
      setShowSuggestions(false);
    }
  };

  const addToRecentSearches = (searchTerm: string) => {
    const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 10);
    setRecentSearches(newRecent);
    localStorage.setItem('documentRecentSearches', JSON.stringify(newRecent));
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearch('');
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('documentRecentSearches');
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="glass-input w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
        />
        
        {query && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || isLoading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-50 mt-2"
          >
            <GlassCard className="p-2 shadow-xl max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={suggestion.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {highlightText(suggestion.title, query)}
                        </p>
                        {suggestion.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {suggestion.subtitle}
                          </p>
                        )}
                        {suggestion.metadata && (
                          <div className="flex items-center space-x-2 mt-1">
                            {suggestion.metadata.size && (
                              <span className="text-xs text-gray-400">
                                {suggestion.metadata.size}
                              </span>
                            )}
                            {suggestion.metadata.date && (
                              <span className="text-xs text-gray-400 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {suggestion.metadata.date}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {suggestion.type === 'document' && (
                        <div className="flex-shrink-0">
                          <Star className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                  
                  {/* Recent searches section */}
                  {query.length <= 2 && recentSearches.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Letzte Suchen
                        </h4>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          Löschen
                        </button>
                      </div>
                      {recentSearches.slice(0, 3).map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick({
                            id: `recent-${search}`,
                            type: 'document',
                            title: search,
                            subtitle: 'Letzte Suche',
                            icon: <Clock className="w-4 h-4 text-gray-500" />
                          })}
                          className="w-full flex items-center space-x-3 p-2 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {search}
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentSearch;
