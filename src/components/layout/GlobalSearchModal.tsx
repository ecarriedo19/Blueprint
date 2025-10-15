import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, FileText, Briefcase, Truck, X } from 'lucide-react';

interface SearchResult {
  id: number;
  type: 'Project' | 'Quote' | 'Vendor';
  name: string;
  description?: string;
  status?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Search function with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
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
        if (!isOpen) {
          onOpen();
        }
      }
      
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onOpen]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const handleResultSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'Project':
        navigate(`/projects/${result.id}`);
        break;
      case 'Quote':
        navigate(`/quotes/${result.id}`);
        break;
      case 'Vendor':
        navigate(`/vendors`); // Navigate to vendors page with filter
        break;
    }
    onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm">
      <div className="flex items-start justify-center pt-20 px-4">
        <div className="w-full max-w-2xl">
          <Command className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center border-b border-border px-4">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <Command.Input
                value={searchQuery}
                onValueChange={setSearchQuery}
                placeholder="Search projects, quotes, vendors..."
                className="flex-1 py-4 text-foreground placeholder-muted-foreground bg-transparent border-none outline-none text-base"
                autoFocus
              />
              <button
                onClick={onClose}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <Command.List className="max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    Searching...
                  </div>
                </div>
              )}

              {!isLoading && searchQuery && results.length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  No results found for "{searchQuery}"
                </div>
              )}

              {!searchQuery && !isLoading && (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <div className="space-y-2">
                    <p>Start typing to search...</p>
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

              {results.map((result) => (
                <Command.Item
                  key={`${result.type}-${result.id}`}
                  value={`${result.type} ${result.name} ${result.description || ''}`}
                  onSelect={() => handleResultSelect(result)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors"
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
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;