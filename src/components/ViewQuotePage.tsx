import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuote, useLineItems, LineItem } from '../utils/queries';
import { useQuotes as useQuoteMutations } from '../contexts/QuoteContext';
import { useApp } from '../contexts/AppContext';
import Card from './Card';
import Button from './Button';
import PageHeader from './PageHeader';
import LineItemModal from './LineItemModal';
import Toast from './Toast';
import AiInsights from './AiInsights';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle, 
  Play, 
  Award, 
  Edit2, 
  Trash2, 
  Plus,
  Check,
  Download
} from 'lucide-react';

// ViewQuotePage Component
interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface ViewQuotePageProps {
  currentUser: User;
}

const ViewQuotePage = ({ currentUser }: ViewQuotePageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateQuote, deleteLineItem } = useQuoteMutations();
  const { showConfirmationModal } = useApp();
  
  // Use React Query hooks for data fetching
  const quoteId = id ? parseInt(id, 10) : 0;
  const { data: quote, isLoading: loading, error } = useQuote(quoteId);
  const { data: lineItems = [], isLoading: lineItemsLoading } = useLineItems(quoteId);
  const [isLineItemModalOpen, setIsLineItemModalOpen] = useState(false);
  const [lineItemToEdit, setLineItemToEdit] = useState<LineItem | null>(null);
  const [editingQuoteTotal, setEditingQuoteTotal] = useState(false);
  const [tempQuoteTotal, setTempQuoteTotal] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; type: 'success' | 'error' }>({ 
    message: '', 
    isVisible: false, 
    type: 'success' 
  });

  // Role-based permission check
  const canModifyQuotes = () => {
    const userRole = currentUser?.role || 'Member';
    return userRole === 'Admin' || userRole === 'Member';
  };

  // Toast functions
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, isVisible: true, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Fetch line items for the quote
  // Initialize tempQuoteTotal when quote data is loaded
  useEffect(() => {
    if (quote) {
      setTempQuoteTotal(quote.quoteTotal.toString());
    }
  }, [quote]);

  // Dynamic calculations
  const calculateActualCost = useCallback(() => {
    return lineItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);
  }, [lineItems]);

  const calculateProfitMargin = useCallback(() => {
    if (!quote || quote.quoteTotal === 0) return 0;
    const actualCost = calculateActualCost();
    if (actualCost === 0) return 0;
    return ((quote.quoteTotal - actualCost) / actualCost) * 100;
  }, [quote, calculateActualCost]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };



  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-400';
    if (variance < 0) return 'text-green-400';
    return 'text-slate-300';
  };

  const getProfitMarginColor = (margin: number) => {
    return margin >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'text-gray-400';
      case 'pending':
      case 'client to be review':
        return 'text-yellow-400';
      case 'approved':
        return 'text-green-400';
      case 'in progress':
      case 'working on it':
        return 'text-blue-400';
      case 'completed':
        return 'text-purple-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  // Handle quote total editing with auto-save
  const handleQuoteTotalEdit = () => {
    if (quote) {
      setTempQuoteTotal(quote.quoteTotal.toString());
      setEditingQuoteTotal(true);
    }
  };

  const handleQuoteTotalBlur = async () => {
    if (!quote) return;
    
    const newTotal = parseFloat(tempQuoteTotal);
    
    // If value hasn't changed, just exit edit mode
    if (newTotal === quote.quoteTotal) {
      setEditingQuoteTotal(false);
      return;
    }
    
    // Validate the new value
    if (isNaN(newTotal) || newTotal < 0) {
      showToast('Please enter a valid positive number', 'error');
      setTempQuoteTotal(quote.quoteTotal.toString());
      setEditingQuoteTotal(false);
      return;
    }

    try {
      await updateQuote(quote.id, { quoteTotal: newTotal });
      setEditingQuoteTotal(false);
      showToast('Quote total updated successfully!');
    } catch (error) {
      console.error('Failed to update quote total:', error);
      showToast('Failed to update quote total', 'error');
      setTempQuoteTotal(quote.quoteTotal.toString());
      setEditingQuoteTotal(false);
    }
  };

  const handleQuoteTotalKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur(); // Trigger onBlur which will save
    } else if (e.key === 'Escape') {
      // Cancel editing
      if (quote) {
        setTempQuoteTotal(quote.quoteTotal.toString());
      }
      setEditingQuoteTotal(false);
    }
  };

  // Handle status updates
  const handleStatusUpdate = async (newStatus: string) => {
    if (!quote || quote.status.toLowerCase() === newStatus.toLowerCase()) return;

    try {
      await updateQuote(quote.id, { status: newStatus });
      showToast(`Status updated to '${newStatus}'!`);
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  // Line Item CRUD Functions
  const handleAddLineItem = () => {
    setLineItemToEdit(null);
    setIsLineItemModalOpen(true);
  };

  const handleEditLineItem = (item: LineItem) => {
    setLineItemToEdit(item);
    setIsLineItemModalOpen(true);
  };

  const handleDeleteLineItem = (item: LineItem) => {
    showConfirmationModal({
      title: 'Delete Line Item',
      message: `Are you sure you want to delete "${item.description}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteLineItem(item.id!, quoteId);
          showToast('Line item deleted successfully!');
        } catch (error) {
          console.error('Failed to delete line item:', error);
          showToast('Failed to delete line item. Please try again.', 'error');
        }
      }
    });
  };

  const handleCloseLineItemModal = () => {
    setIsLineItemModalOpen(false);
    setLineItemToEdit(null);
  };

  const handleLineItemSuccess = (message: string, type: 'success' | 'error' = 'success') => {
    showToast(message, type);
    // React Query will automatically refresh the data
  };

  const calculateVariance = (estimated: number, actual: number) => {
    if (estimated === 0) return 0;
    return ((actual - estimated) / estimated) * 100;
  };

  // PDF Download functionality
  const handleDownloadPDF = async () => {
    if (!quote) return;

    try {
      showToast('Generating PDF report...', 'success');
      
      const response = await fetch(`/api/quotes/${quote.id}/pdf`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quote-${quote.quoteName.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showToast('Failed to download PDF. Please try again.', 'error');
    }
  };

  // Interactive Status Stepper Component
  const InteractiveStatusStepper = ({ currentStatus }: { currentStatus: string }) => {
    const steps = [
      { key: 'draft', label: 'Draft', icon: FileText },
      { key: 'sent', label: 'Sent', icon: Clock },
      { key: 'approved', label: 'Approved', icon: CheckCircle },
      { key: 'working on it', label: 'In Progress', icon: Play },
      { key: 'completed', label: 'Completed', icon: Award }
    ];

    const getCurrentStepIndex = () => {
      const statusMap: { [key: string]: number } = {
        'draft': 0,
        'sent': 1,
        'pending': 1,
        'client to be review': 1,
        'approved': 2,
        'working on it': 3,
        'in progress': 3,
        'completed': 4,
        'rejected': -1
      };
      return statusMap[currentStatus.toLowerCase()] ?? 0;
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
      <Card variant="glass" className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Project Status</h3>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            
            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={canModifyQuotes() ? () => handleStatusUpdate(step.key) : undefined}
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 transform hover:scale-105
                    ${canModifyQuotes() ? 'cursor-pointer' : 'cursor-default'}
                    ${isCompleted 
                      ? 'bg-green-500/20 border-green-400 text-green-400 hover:bg-green-500/30' 
                      : isActive 
                        ? 'bg-blue-500/20 border-blue-400 text-blue-400 hover:bg-blue-500/30' 
                        : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500'
                    }
                  `}
                  title={canModifyQuotes() ? `Set status to ${step.label}` : 'Read-only access'}
                  disabled={!canModifyQuotes()}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </button>
                
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    isCompleted ? 'text-green-400' : 
                    isActive ? 'text-blue-400' : 
                    'text-slate-500'
                  }`}>
                    {step.label}
                  </p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 transition-colors duration-300 ${
                    isCompleted ? 'bg-green-400' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        {currentStatus.toLowerCase() === 'rejected' && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm font-medium">
              This quote has been rejected. Please review and make necessary changes.
            </p>
          </div>
        )}
        
        <div className="mt-4 text-xs text-slate-400">
          Click on any step to update the status
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card variant="glass" className="text-center py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            <span className="text-slate-300">Loading quote details...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/quotes')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quotes
          </Button>
        </div>
        <Card variant="glass" className="border-red-500/50 bg-red-500/10 text-center py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-6 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-300">{error?.message || 'Quote not found'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/quotes')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quotes
        </Button>
      </div>

      {/* Quote Header */}
      <div className="flex items-center justify-between">
        <PageHeader 
          title={quote.quoteName}
          subtitle={`Created ${new Date(quote.created_at).toLocaleDateString()}`}
          size="lg"
        />
        <Button
          onClick={handleDownloadPDF}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Actual Cost Card - Sum of actual costs from line items */}
        <Card variant="glass" padding="md" className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {formatCurrency(calculateActualCost())}
          </h3>
          <p className="uppercase tracking-wider text-xs text-slate-400">Actual Cost</p>
        </Card>

        {/* Editable Quote Total Card with Auto-Save */}
        <Card variant="glass" padding="md" className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg mx-auto mb-4">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          {editingQuoteTotal ? (
            <div className="space-y-2">
              <input
                type="number"
                value={tempQuoteTotal}
                onChange={(e) => setTempQuoteTotal(e.target.value)}
                onBlur={handleQuoteTotalBlur}
                onKeyDown={handleQuoteTotalKeyPress}
                className="text-2xl font-bold bg-transparent border-b-2 border-green-400 text-white text-center w-full focus:outline-none focus:border-green-300 transition-colors"
                autoFocus
                placeholder="Enter amount"
              />
              <p className="text-xs text-slate-400">
                Press Enter to save • Esc to cancel
              </p>
            </div>
          ) : (
            <div
              onClick={canModifyQuotes() ? handleQuoteTotalEdit : undefined}
              className={`${canModifyQuotes() ? 'cursor-pointer group hover:bg-white/5' : ''} rounded-lg p-2 transition-all duration-200`}
            >
              <h3 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2 group-hover:text-green-300 transition-colors">
                {formatCurrency(quote.quoteTotal)}
                {canModifyQuotes() && (
                  <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-green-400" />
                )}
              </h3>
              <p className="uppercase tracking-wider text-xs text-slate-400">Quote Total</p>
            </div>
          )}
        </Card>

        {/* Dynamic Profit Margin Card */}
        <Card variant="glass" padding="md" className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mx-auto mb-4">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${getProfitMarginColor(calculateProfitMargin())}`}>
            {formatPercentage(calculateProfitMargin())}
          </h3>
          <p className="uppercase tracking-wider text-xs text-slate-400">Profit Margin</p>
        </Card>

        {/* Status Card */}
        <Card variant="glass" padding="md" className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mx-auto mb-4">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h3 className={`text-2xl font-bold mb-1 ${getStatusColor(quote.status)}`}>
            {capitalizeStatus(quote.status)}
          </h3>
          <p className="uppercase tracking-wider text-xs text-slate-400">Current Status</p>
        </Card>
      </div>

      {/* Status Stepper */}
      <InteractiveStatusStepper currentStatus={quote.status} />

      {/* Line Items Table */}
      <Card variant="glass">
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Cost Breakdown</h3>
            <p className="text-slate-400 mt-1">Detailed line items with estimated vs actual costs</p>
          </div>
          {canModifyQuotes() && (
            <Button
              onClick={handleAddLineItem}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Line Item
            </Button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Line Item
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Estimated Cost
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Actual Cost
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                  Variance
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItemsLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-300">Loading line items...</p>
                  </td>
                </tr>
              ) : lineItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="text-slate-400">
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">No line items yet</h3>
                      <p className="mb-4">Add your first line item to start tracking costs and progress.</p>
                      <Button
                        onClick={handleAddLineItem}
                        className="mx-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Line Item
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                lineItems.map((item, index) => {
                  const variance = calculateVariance(item.estimatedCost, item.actualCost || 0);
                  return (
                    <tr
                      key={item.id}
                      className={`
                        group border-b border-slate-700/30 hover:bg-white/5 transition-colors duration-200
                        ${index === lineItems.length - 1 ? 'border-b-0' : ''}
                      `}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-medium">{item.description}</h4>
                            <p className="text-sm text-slate-400 mt-1">General</p>
                          </div>
                          {canModifyQuotes() && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
                              <button
                                onClick={() => handleEditLineItem(item)}
                                className="p-2 text-slate-400 hover:text-blue-400 transition-colors duration-200 rounded-lg hover:bg-white/5"
                                title="Edit line item"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLineItem(item)}
                                className="p-2 text-slate-400 hover:text-red-400 transition-colors duration-200 rounded-lg hover:bg-white/5"
                                title="Delete line item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-slate-300 font-medium">
                          {formatCurrency(item.estimatedCost)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-white font-semibold">
                          {formatCurrency(item.actualCost || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`font-semibold ${getVarianceColor(variance)}`}>
                          {formatPercentage(variance)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-600/50 bg-slate-800/30">
                <td className="py-4 px-6">
                  <span className="text-white font-bold">Total</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="text-slate-300 font-bold">
                    {formatCurrency(lineItems.reduce((sum, item) => sum + item.estimatedCost, 0))}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="text-white font-bold">
                    {formatCurrency(lineItems.reduce((sum, item) => sum + (item.actualCost || 0), 0))}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="text-blue-400 font-bold">
                    {lineItems.length > 0 ? formatPercentage(
                      ((lineItems.reduce((sum, item) => sum + (item.actualCost || 0), 0) - 
                        lineItems.reduce((sum, item) => sum + item.estimatedCost, 0)) / 
                       lineItems.reduce((sum, item) => sum + item.estimatedCost, 0)) * 100
                    ) : '0%'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* AI Insights Section */}
      <AiInsights quote={quote} lineItems={lineItems} />

      {/* Line Item Modal */}
      <LineItemModal
        isOpen={isLineItemModalOpen}
        onClose={handleCloseLineItemModal}
        onSuccess={handleLineItemSuccess}
        itemToEdit={lineItemToEdit}
        quoteId={parseInt(id!)}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default ViewQuotePage;