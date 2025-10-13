import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FileText, Edit3 } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import QuoteModal from './QuoteModal';
import UploadQuoteModal from './UploadQuoteModal';
import BulkEditQuotesModal from './BulkEditQuotesModal';
import { useQuotes } from '../utils/queries';
import { useQuotes as useQuoteMutations, Quote } from '../contexts/QuoteContext';
import { useApp } from '../contexts/AppContext';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface QuotesPageProps {
  currentUser: User;
}

const QuotesPage = ({ currentUser }: QuotesPageProps) => {
  const navigate = useNavigate();
  const { data: quotes = [], isLoading: loading, error } = useQuotes();
  const { deleteQuote } = useQuoteMutations();
  const { showConfirmationModal } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; type: 'success' | 'error' }>({ 
    message: '', 
    isVisible: false, 
    type: 'success' 
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Role-based permission check
  const canModifyQuotes = () => {
    const userRole = currentUser?.role || 'Member';
    return userRole === 'Admin' || userRole === 'Member';
  };

  // Handle toast notifications
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, isVisible: true, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle opening modal for creating new quote manually
  const handleCreateQuote = () => {
    setQuoteToEdit(null);
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  // Handle opening upload modal for AI quote creation
  const handleCreateFromDocument = () => {
    setIsUploadModalOpen(true);
    setIsDropdownOpen(false);
  };

  // Handle opening modal for editing existing quote
  const handleEditQuote = (quote: Quote) => {
    setQuoteToEdit(quote);
    setIsModalOpen(true);
  };

  // Handle viewing a quote in detail
  const handleViewQuote = (quote: Quote) => {
    navigate(`/quotes/${quote.id}`);
  };

  // Handle deleting a quote
  const handleDeleteQuote = (quote: Quote) => {
    showConfirmationModal({
      title: 'Delete Quote', 
      message: `Are you sure you want to delete the quote "${quote.quoteName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteQuote(quote.id);
          showToast('Quote deleted successfully!');
        } catch (error) {
          console.error('Failed to delete quote:', error);
          showToast('Failed to delete quote. Please try again.', 'error');
        }
      }
    });
  };

  // Handle closing modal and resetting edit state
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setQuoteToEdit(null);
  };

  // Handle closing upload modal
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  // Bulk edit functions
  const handleSelectQuote = (quoteId: number, isSelected: boolean) => {
    setSelectedQuoteIds(prev => 
      isSelected 
        ? [...prev, quoteId]
        : prev.filter(id => id !== quoteId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedQuoteIds(isSelected ? quotes.map(quote => quote.id) : []);
  };

  const handleBulkEdit = () => {
    if (selectedQuoteIds.length > 0) {
      setIsBulkEditModalOpen(true);
    }
  };

  const handleCloseBulkEditModal = () => {
    setIsBulkEditModalOpen(false);
    setSelectedQuoteIds([]); // Clear selection when closing
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };



  // Empty State Component
  const EmptyState = () => (
    <Card variant="glass" className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">No Quotes Yet</h3>
        <p className="text-slate-400 mb-8 leading-relaxed">
          {canModifyQuotes() 
            ? "You don't have any quotes yet. Create your first quote to start managing construction project estimates and costs."
            : "No quotes to display. Contact an administrator to create quotes."
          }
        </p>
        {canModifyQuotes() && (
          <div className="relative">
            <Button
              onClick={handleDropdownToggle}
              size="lg"
              className="px-8 flex items-center gap-2"
            >
              + Add Your First Quote
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Dropdown Menu for Empty State */}
            {isDropdownOpen && (
              <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-64 z-50 animate-fade-in">
                <Card variant="glass" className="py-2 shadow-2xl border-white/20">
                  <button
                    onClick={handleCreateQuote}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                  >
                    <Edit3 className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-medium text-white">Create Manually</div>
                      <div className="text-sm text-slate-400">Build a quote from scratch</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleCreateFromDocument}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                  >
                    <FileText className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-medium text-white">Create from Document (AI)</div>
                      <div className="text-sm text-slate-400">Upload and let AI generate</div>
                    </div>
                  </button>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );

  // Add status badge for new statuses
  const getStatusBadgeClassEnhanced = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'approved':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'client to be review':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'working on it':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  // Quotes Table Component
  const QuotesTable = () => (
    <Card variant="glass">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-center py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectedQuoteIds.length === quotes.length && quotes.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                />
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Quote
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Related Project
              </th>
              <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Time to Develop
              </th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Percentage of Variances
              </th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Quote Total
              </th>
              <th className="text-right py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Budget
              </th>
              <th className="text-center py-4 px-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote, index) => (
              <tr
                key={quote.id}
                className={`
                  group border-b border-slate-700/30 hover:bg-white/5 transition-colors duration-200
                  ${index === quotes.length - 1 ? 'border-b-0' : ''}
                  ${selectedQuoteIds.includes(quote.id) ? 'bg-blue-500/10' : ''}
                `}
              >
                <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedQuoteIds.includes(quote.id)}
                    onChange={(e) => handleSelectQuote(quote.id, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </td>
                <td className="py-4 px-4 cursor-pointer" onClick={() => handleViewQuote(quote)}>
                  <div>
                    <h4 className="text-white font-medium">{quote.quoteName}</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      Created {new Date(quote.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`
                      inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                      ${getStatusBadgeClassEnhanced(quote.status)}
                    `}
                  >
                    {quote.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-slate-300">
                    {(quote as any).project_name || 'N/A'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-slate-300">
                    {quote.timeToDevelopValue > 0 && quote.timeToDevelopUnit 
                      ? `${quote.timeToDevelopValue} ${quote.timeToDevelopUnit}`
                      : quote.timeToDevelop || '—'
                    }
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-slate-300">
                    {formatPercentage(quote.variancePercentage)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-white font-semibold">
                    {formatCurrency(quote.quoteTotal)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-slate-300">
                    {formatCurrency(quote.budget)}
                  </span>
                </td>
                <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleViewQuote(quote)}
                      className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors duration-200"
                      title="View quote details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {canModifyQuotes() && (
                      <button
                        onClick={() => handleEditQuote(quote)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors duration-200"
                        title="Edit quote"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {canModifyQuotes() && (
                      <button
                        onClick={() => handleDeleteQuote(quote)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                        title="Delete quote"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.isVisible && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <Card variant="glass" className={`p-4 ${toast.type === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 ${toast.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {toast.type === 'error' ? (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className={toast.type === 'error' ? 'text-red-300' : 'text-green-300'}>{toast.message}</p>
              <button 
                onClick={hideToast}
                className={`ml-2 ${toast.type === 'error' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Card>
        </div>
      )}

      {quotes.length > 0 && canModifyQuotes() && (
        <div className="flex justify-end gap-3 mb-6">
          {/* Bulk Edit Button - shown when quotes are selected */}
          {selectedQuoteIds.length > 0 && (
            <Button
              onClick={handleBulkEdit}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Selected ({selectedQuoteIds.length})
            </Button>
          )}
          
          <div className="relative" ref={dropdownRef}>
            <Button
              onClick={handleDropdownToggle}
              className="shrink-0 flex items-center gap-2"
            >
              + New Quote
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 z-50 animate-fade-in">
                <Card variant="glass" className="py-2 shadow-2xl border-white/20">
                  <button
                    onClick={handleCreateQuote}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                  >
                    <Edit3 className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="font-medium text-white">Create Manually</div>
                      <div className="text-sm text-slate-400">Build a quote from scratch</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={handleCreateFromDocument}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                  >
                    <FileText className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-medium text-white">Create from Document (AI)</div>
                      <div className="text-sm text-slate-400">Upload and let AI generate</div>
                    </div>
                  </button>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <Card variant="glass" className="border-red-500/50 bg-red-500/10">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-300">{error?.message || 'An error occurred while loading quotes'}</p>
          </div>
        </Card>
      )}

      {loading ? (
        <Card variant="glass" className="text-center py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            <span className="text-slate-300">Loading quotes...</span>
          </div>
        </Card>
      ) : quotes.length === 0 ? (
        <EmptyState />
      ) : (
        <QuotesTable />
      )}

      {/* Quote Modal - Create/Edit */}
      <QuoteModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={showToast}
        quoteToEdit={quoteToEdit}
      />

      {/* Upload Quote Modal - AI Creation */}
      <UploadQuoteModal 
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onSuccess={showToast}
      />

      {/* Bulk Edit Quotes Modal */}
      <BulkEditQuotesModal 
        isOpen={isBulkEditModalOpen}
        onClose={handleCloseBulkEditModal}
        selectedQuoteIds={selectedQuoteIds}
        onSuccess={showToast}
      />
    </div>
  );
};

export default QuotesPage;
