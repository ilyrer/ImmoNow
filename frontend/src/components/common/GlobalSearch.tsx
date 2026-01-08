import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  FileText,
  Building2,
  MessageSquare,
  Calculator,
  Calendar,
  TrendingUp,
  Users,
  Settings,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: 'user' | 'document' | 'property' | 'message' | 'calculation' | 'event' | 'report' | 'page' | 'setting';
  path?: string;
  icon?: React.ElementType;
  metadata?: {
    author?: string;
    date?: string;
    status?: string;
  };
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  compact?: boolean;
  onResultSelect?: (result: SearchResult) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ 
  placeholder = "Search analytics, users, reports", 
  className = "",
  compact = false,
  onResultSelect 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // TODO: Implement real search API
  const mockData: SearchResult[] = [];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing recent searches:', e);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Search function
  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implement real search API call
      // const searchResults = await searchService.search(searchTerm);
      
      // For now, use empty results
      const filtered: SearchResult[] = [];
      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      performSearch(value);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    setQuery('');
    setIsOpen(false);
    setResults([]);
    
    if (onResultSelect) {
      onResultSelect(result);
    } else if (result.path) {
      navigate(result.path);
    }
  };

  // Handle recent search selection
  const handleRecentSearchSelect = (searchTerm: string) => {
    setQuery(searchTerm);
    performSearch(searchTerm);
    setIsOpen(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex]);
        } else if (query.trim()) {
          saveRecentSearch(query);
          // TODO: Navigate to search results page
          navigate(`/search?q=${encodeURIComponent(query)}`);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'user': return User;
      case 'document': return FileText;
      case 'property': return Building2;
      case 'message': return MessageSquare;
      case 'calculation': return Calculator;
      case 'event': return Calendar;
      case 'report': return TrendingUp;
      case 'page': return TrendingUp;
      case 'setting': return Settings;
      default: return Search;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return 'Kontakt';
      case 'document': return 'Dokument';
      case 'property': return 'Immobilie';
      case 'message': return 'Nachricht';
      case 'calculation': return 'Berechnung';
      case 'event': return 'Termin';
      case 'report': return 'Bericht';
      case 'page': return 'Seite';
      case 'setting': return 'Einstellung';
      default: return 'Ergebnis';
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className={`relative ${compact ? 'w-64' : 'w-full max-w-2xl'}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true);
            setIsFocused(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`block w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${compact ? 'text-sm' : ''}`}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Suche läuft...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = getIconForType(result.type);
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultSelect(result)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                      index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      {result.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {result.description}
                        </p>
                      )}
                      {result.metadata && (
                        <div className="flex items-center space-x-2 mt-1">
                          {result.metadata.author && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {result.metadata.author}
                            </span>
                          )}
                          {result.metadata.date && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {result.metadata.date}
                            </span>
                          )}
                          {result.metadata.status && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {result.metadata.status}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">Keine Ergebnisse gefunden</p>
              <p className="text-xs mt-1">Versuchen Sie andere Suchbegriffe</p>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <Clock className="h-3 w-3 inline mr-1" />
                Letzte Suchen
              </div>
              {recentSearches.map((searchTerm, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchSelect(searchTerm)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3"
                >
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {searchTerm}
                  </span>
                </button>
              ))}
            </div>
          ) : isFocused ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">Beginnen Sie mit der Eingabe</p>
              <p className="text-xs mt-1">Durchsuchen Sie Kontakte, Dokumente, Immobilien und mehr</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
