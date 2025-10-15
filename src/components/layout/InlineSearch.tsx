import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Briefcase, Truck, X } from 'lucide-react';

interface SearchResult {
  id: number;
  type: 'Project' | 'Quote' | 'Vendor';
  name: string;
  description?: string;
  status?: string;
}

interface InlineSearchProps {
  onKeyboardShortcut?: () => void;
}

const SearchResultSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="w-4 h-4 bg-muted rounded animate-pulse" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <div className="h-4 bg-muted rounded animate-pulse w-32" />
        <div className="h-5 bg-muted rounded-full animate-pulse w-16" />
      </div>
      <div className="h-3 bg-muted rounded animate-pulse w-48 mt-1" />
    </div>
    <div className="h-6 bg-muted rounded-full animate-pulse w-16" />
  </div>
);

const InlineSearch: React.FC<InlineSearchProps> = ({ onKeyboardShortcut }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search function with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/global-search?q=${encodeURIComponent(searchQuery)}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        onKeyboardShortcut?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onKeyboardShortcut]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setResults([]);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'Project':
        navigate(`/projects/${result.id}`);
        break;
      case 'Quote':
        navigate(`/quotes/${result.id}`);
        break;
      case 'Vendor':
        navigate(`/vendors`);
        break;
    }
    setIsOpen(false);
    setSearchQuery('');
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'Project':
        return <Briefcase className="w-4 h-4" />;
      case 'Quote':
        return <FileText className="w-4 h-4" />;
      case 'Vendor':
        return <Truck className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && (searchQuery.length > 0 || inputRef.current === document.activeElement);

  return (
    <div className="relative flex-1 max-w-md" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center w-full px-3 py-2 text-sm bg-muted/50 hover:bg-muted rounded-md transition-colors duration-150 group border border-transparent focus-within:border-border focus-within:bg-background">
          <Search className="w-4 h-4 mr-3 text-muted-foreground group-hover:text-foreground group-focus-within:text-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="p-0.5 text-muted-foreground hover:text-foreground rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="ml-2">
            <kbd className="px-2 py-0.5 text-xs bg-background border border-border rounded">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Search Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Searching...
              </div>
              {[...Array(3)].map((_, i) => (
                <SearchResultSkeleton key={i} />
              ))}
            </div>
          )}

          {/* No Query State */}
          {!searchQuery && !isLoading && (
            <div className="px-4 py-6 text-center text-muted-foreground">
              <div className="space-y-2">
                <p className="text-sm">Start typing to search...</p>
                <div className="flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    Projects
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Quotes
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Vendors
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Results State */}
          {!isLoading && searchQuery && results.length === 0 && (
            <div className="px-4 py-6 text-center text-muted-foreground text-sm">
              No results found for "{searchQuery}"
            </div>
          )}

          {/* Results */}
          {!isLoading && results.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Results ({results.length})
              </div>
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors text-left ${
                    selectedIndex === index
                      ? 'bg-muted'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="text-muted-foreground">
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {result.name}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                        {result.type}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {result.description}
                      </p>
                    )}
                  </div>
                  {result.status && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      result.status === 'Active' || result.status === 'Approved'
                        ? 'bg-success/10 text-success'
                        : result.status === 'Pending' || result.status === 'Draft'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {result.status}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineSearch;