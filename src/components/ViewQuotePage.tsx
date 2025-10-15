import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuote, useLineItems, useProjects, LineItem } from '../utils/queries';
import { useQuotes as useQuoteMutations } from '../contexts/QuoteContext';
import { useApp } from '../contexts/AppContext';

import Button from './Button';
import LineItemModal from './LineItemModal';
import ChangeOrderModal from './ChangeOrderModal';
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

// Change Order interface
interface ChangeOrder {
  id: number;
  description: string;
  amount: number;
  status: string;
  quoteId: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

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
  const { data: projects = [] } = useProjects();
  const [isLineItemModalOpen, setIsLineItemModalOpen] = useState(false);
  const [lineItemToEdit, setLineItemToEdit] = useState<LineItem | null>(null);
  const [isChangeOrderModalOpen, setIsChangeOrderModalOpen] = useState(false);
  const [changeOrderToEdit, setChangeOrderToEdit] = useState<ChangeOrder | null>(null);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [changeOrdersLoading, setChangeOrdersLoading] = useState(false);
  const [editingQuoteTotal, setEditingQuoteTotal] = useState(false);
  const [tempQuoteTotal, setTempQuoteTotal] = useState<string>('');
  const [editingProject, setEditingProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
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

  // Enhanced approval permission check
  const canApproveQuotes = () => {
    const userRole = currentUser?.role || 'Member';
    return userRole === 'Admin'; // Only admins can approve quotes
  };

  // Status transition validation
  const canTransitionTo = (newStatus: string, currentStatus: string) => {
    const status = newStatus.toLowerCase();
    const current = currentStatus.toLowerCase();
    
    // Admin can make any transition
    if (canApproveQuotes()) return true;
    
    // Members can only make these transitions:
    switch (status) {
      case 'sent':
        return current === 'draft';
      case 'working on it':
      case 'in progress':
        return current === 'approved';
      case 'completed':
        return current === 'working on it' || current === 'in progress';
      default:
        return false; // Cannot transition to other statuses without admin permissions
    }
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
      console.log('🔍 Quote data loaded:', quote);
      console.log('🔍 Project ID from quote:', (quote as any).project_id);
      setTempQuoteTotal(quote.quoteTotal.toString());
      setSelectedProjectId((quote as any).project_id || null);
    }
  }, [quote]);

  // Fetch change orders for the quote
  const fetchChangeOrders = useCallback(async () => {
    if (!quoteId) return;

    setChangeOrdersLoading(true);
    try {
      const response = await fetch(`/api/quotes/${quoteId}/change-orders`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch change orders');
      }

      const result = await response.json();
      if (result.success) {
        setChangeOrders(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch change orders');
      }
    } catch (error) {
      console.error('Error fetching change orders:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to load change orders',
        'error'
      );
    } finally {
      setChangeOrdersLoading(false);
    }
  }, [quoteId, showToast]);

  // Fetch change orders when quote is loaded
  useEffect(() => {
    if (quote) {
      fetchChangeOrders();
    }
  }, [quote, fetchChangeOrders]);

  // Dynamic calculations
  const calculateActualCost = useCallback(() => {
    const lineItemsTotal = lineItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);
    const approvedChangeOrdersTotal = changeOrders
      .filter(co => co.status === 'Approved')
      .reduce((sum, co) => sum + co.amount, 0);
    return lineItemsTotal + approvedChangeOrdersTotal;
  }, [lineItems, changeOrders]);

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



  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getChangeOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
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

  // Handle status updates with approval workflow
  const handleStatusUpdate = async (newStatus: string) => {
    if (!quote || quote.status.toLowerCase() === newStatus.toLowerCase()) return;

    // Check if user can make this transition
    if (!canTransitionTo(newStatus, quote.status)) {
      const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      showToast(`Only administrators can set status to '${statusLabel}'`, 'error');
      return;
    }

    // Special handling for approval status
    if (newStatus.toLowerCase() === 'approved') {
      showConfirmationModal({
        title: 'Approve Quote',
        message: `Are you sure you want to approve this quote for $${quote.quoteTotal.toLocaleString()}? This action will allow work to begin.`,
        confirmText: 'Approve Quote',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            await updateQuote(quote.id, { status: newStatus });
            showToast(`Quote approved successfully! Work can now begin.`);
          } catch (error) {
            console.error('Failed to approve quote:', error);
            showToast('Failed to approve quote', 'error');
          }
        }
      });
      return;
    }

    // Special handling for rejection
    if (newStatus.toLowerCase() === 'rejected') {
      showConfirmationModal({
        title: 'Reject Quote',
        message: `Are you sure you want to reject this quote? This will require creating a new quote for any future work.`,
        confirmText: 'Reject Quote',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            await updateQuote(quote.id, { status: newStatus });
            showToast(`Quote has been rejected.`, 'error');
          } catch (error) {
            console.error('Failed to reject quote:', error);
            showToast('Failed to reject quote', 'error');
          }
        }
      });
      return;
    }

    // Standard status updates
    try {
      await updateQuote(quote.id, { status: newStatus });
      const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      showToast(`Status updated to '${statusLabel}'!`);
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  // Project Update Function
  const handleProjectUpdate = async (newProjectId: number | null) => {
    if (!quote || (quote as any).project_id === newProjectId) return;

    try {
      await updateQuote(quote.id, { project_id: newProjectId } as any);
      setSelectedProjectId(newProjectId);
      setEditingProject(false);
      const projectName = newProjectId 
        ? projects.find(p => p.id === newProjectId)?.name || 'Unknown Project'
        : 'No Project';
      showToast(`Quote linked to '${projectName}'!`);
    } catch (error) {
      console.error('Failed to update project:', error);
      showToast('Failed to update project', 'error');
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

  // Change Order CRUD Functions
  const handleAddChangeOrder = () => {
    setChangeOrderToEdit(null);
    setIsChangeOrderModalOpen(true);
  };

  const handleEditChangeOrder = (changeOrder: ChangeOrder) => {
    setChangeOrderToEdit(changeOrder);
    setIsChangeOrderModalOpen(true);
  };

  const handleDeleteChangeOrder = (changeOrder: ChangeOrder) => {
    showConfirmationModal({
      title: 'Delete Change Order',
      message: `Are you sure you want to delete this change order: "${changeOrder.description}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/change-orders/${changeOrder.id}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to delete change order');
          }

          showToast('Change order deleted successfully!');
          fetchChangeOrders(); // Refresh the list
        } catch (error) {
          console.error('Failed to delete change order:', error);
          showToast(
            error instanceof Error ? error.message : 'Failed to delete change order',
            'error'
          );
        }
      }
    });
  };

  const handleChangeOrderStatusUpdate = async (changeOrder: ChangeOrder, newStatus: string) => {
    try {
      const response = await fetch(`/api/change-orders/${changeOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update change order status');
      }

      showToast(`Change order ${newStatus.toLowerCase()}!`);
      fetchChangeOrders(); // Refresh the list to update actual cost calculations
    } catch (error) {
      console.error('Failed to update change order status:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to update change order status',
        'error'
      );
    }
  };

  const handleCloseChangeOrderModal = () => {
    setIsChangeOrderModalOpen(false);
    setChangeOrderToEdit(null);
  };

  const handleChangeOrderSuccess = (message: string, type: 'success' | 'error' = 'success') => {
    showToast(message, type);
    fetchChangeOrders(); // Refresh the change orders list
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
      { key: 'draft', label: 'Draft', icon: FileText, description: 'Quote is being prepared' },
      { key: 'sent', label: 'Sent', icon: Clock, description: 'Waiting for client review' },
      { key: 'approved', label: 'Approved', icon: CheckCircle, description: 'Ready to begin work', requiresAdmin: true },
      { key: 'working on it', label: 'In Progress', icon: Play, description: 'Work is underway' },
      { key: 'completed', label: 'Completed', icon: Award, description: 'Work is finished' }
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
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Project Status</h3>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            
            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={canModifyQuotes() && canTransitionTo(step.key, currentStatus) ? () => handleStatusUpdate(step.key) : undefined}
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 transform hover:scale-105 relative
                    ${canModifyQuotes() && canTransitionTo(step.key, currentStatus) ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                    ${isCompleted 
                      ? 'bg-success/20 border-success text-success hover:bg-success/30' 
                      : isActive 
                        ? 'bg-primary/20 border-primary text-primary hover:bg-primary/30' 
                        : canTransitionTo(step.key, currentStatus)
                          ? 'bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:border-muted-foreground'
                          : 'bg-muted/50 border-border/50 text-muted-foreground/50'
                    }
                    ${(step as any).requiresAdmin && !canApproveQuotes() ? 'ring-2 ring-warning/50' : ''}
                  `}
                  title={
                    !canModifyQuotes() ? 'Read-only access' :
                    !canTransitionTo(step.key, currentStatus) ? 
                      ((step as any).requiresAdmin ? 'Administrator approval required' : 'Cannot transition to this status') :
                    `Set status to ${step.label}`
                  }
                  disabled={!canModifyQuotes() || !canTransitionTo(step.key, currentStatus)}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </button>
                
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    isCompleted ? 'text-success' : 
                    isActive ? 'text-primary' : 
                    'text-muted-foreground'
                  }`}>
                    {step.label}
                  </p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 transition-colors duration-300 ${
                    isCompleted ? 'bg-success' : 'bg-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Approval Actions */}
        {currentStatus.toLowerCase() === 'sent' && canApproveQuotes() && (
          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-primary text-sm font-medium">
                Quote ready for approval • ${quote?.quoteTotal.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => handleStatusUpdate('approved')}
                variant="primary"
                size="sm"
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Quote
              </Button>
              <Button
                onClick={() => handleStatusUpdate('rejected')}
                variant="outline"
                size="sm"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                Reject Quote
              </Button>
            </div>
          </div>
        )}

        {currentStatus.toLowerCase() === 'rejected' && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm font-medium">
              This quote has been rejected. Please review and make necessary changes.
            </p>
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground">
          {canApproveQuotes() ? (
            'Click on any step to update the status • Admin privileges enabled'
          ) : (
            'Limited status changes available • Contact admin for approvals'
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-lg text-center py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <span className="text-muted-foreground">Loading quote details...</span>
          </div>
        </div>
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
        <div className="bg-card border border-destructive/50 rounded-lg text-center py-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-6 h-6 text-destructive">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-destructive">{error?.message || 'Quote not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">


      {/* Command Center Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/quotes')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Quotes</span>
            </button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {quote.quoteName}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Quote Details & Cost Tracking
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Project Assignment Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Project Assignment</h3>
            <p className="text-muted-foreground text-sm">Link this quote to a project for better tracking</p>
          </div>
          {!editingProject ? (
            <div className="flex items-center gap-3">
              <span className="text-foreground">
                {selectedProjectId 
                  ? projects.find(p => p.id === selectedProjectId)?.name || 'Unknown Project'
                  : 'No Project Assigned'
                }
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProject(true)}
                className="text-sm"
              >
                Change Project
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="">No Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleProjectUpdate(selectedProjectId)}
                className="text-sm"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProjectId((quote as any).project_id || null);
                  setEditingProject(false);
                }}
                className="text-sm"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Unified KPI Row */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Actual Cost KPI */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {formatCurrency(calculateActualCost())}
            </p>
            <p className="text-sm text-muted-foreground">Actual Cost</p>
          </div>

          {/* Editable Quote Total KPI */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-success/10 rounded-lg mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            {editingQuoteTotal ? (
              <div className="space-y-2">
                <input
                  type="number"
                  value={tempQuoteTotal}
                  onChange={(e) => setTempQuoteTotal(e.target.value)}
                  onBlur={handleQuoteTotalBlur}
                  onKeyDown={handleQuoteTotalKeyPress}
                  className="text-2xl font-bold bg-background border border-border rounded px-2 py-1 text-foreground text-center w-full focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  autoFocus
                  placeholder="Enter amount"
                />
                <p className="text-xs text-muted-foreground">
                  Press Enter to save • Esc to cancel
                </p>
              </div>
            ) : (
              <div
                onClick={canModifyQuotes() ? handleQuoteTotalEdit : undefined}
                className={`${canModifyQuotes() ? 'cursor-pointer group hover:bg-muted/50' : ''} rounded-lg p-2 transition-all duration-200`}
              >
                <p className="text-2xl font-bold text-foreground mb-1 flex items-center justify-center gap-2 group-hover:text-success transition-colors">
                  {formatCurrency(quote.quoteTotal)}
                  {canModifyQuotes() && (
                    <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-success" />
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Quote Total</p>
              </div>
            )}
          </div>

          {/* Profit Margin KPI */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-warning/10 rounded-lg mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <p className={`text-2xl font-bold mb-1 ${calculateProfitMargin() >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatPercentage(calculateProfitMargin())}
            </p>
            <p className="text-sm text-muted-foreground">Profit Margin</p>
          </div>

          {/* Status KPI */}
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-3">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl font-bold mb-1 text-foreground">
              {capitalizeStatus(quote.status)}
            </p>
            <p className="text-sm text-muted-foreground">Current Status</p>
          </div>
        </div>
      </div>

      {/* Status Stepper */}
      <InteractiveStatusStepper currentStatus={quote.status} />

      {/* Line Items Table */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-foreground">Cost Breakdown</h3>
            <p className="text-muted-foreground mt-1">Detailed line items with estimated vs actual costs</p>
          </div>
          {canModifyQuotes() && (
            <Button
              onClick={handleAddLineItem}
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Line Item
            </Button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Line Item
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Estimated Cost
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Actual Cost
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Variance
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItemsLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading line items...</p>
                  </td>
                </tr>
              ) : lineItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <div className="text-muted-foreground">
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">No line items yet</h3>
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
                        group border-b border-border hover:bg-muted/50 transition-colors duration-200
                        ${index === lineItems.length - 1 ? 'border-b-0' : ''}
                      `}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-foreground font-medium">{item.description}</h4>
                            <p className="text-sm text-muted-foreground mt-1">General</p>
                          </div>
                          {canModifyQuotes() && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-2">
                              <button
                                onClick={() => handleEditLineItem(item)}
                                className="p-2 text-muted-foreground hover:text-primary transition-colors duration-200 rounded-lg hover:bg-muted"
                                title="Edit line item"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLineItem(item)}
                                className="p-2 text-muted-foreground hover:text-destructive transition-colors duration-200 rounded-lg hover:bg-muted"
                                title="Delete line item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-muted-foreground font-medium">
                          {formatCurrency(item.estimatedCost)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-foreground font-semibold">
                          {formatCurrency(item.actualCost || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`font-semibold ${variance > 0 ? 'text-destructive' : variance < 0 ? 'text-success' : 'text-muted-foreground'}`}>
                          {formatPercentage(variance)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="py-4 px-6">
                  <span className="text-foreground font-bold">Total</span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="text-muted-foreground font-bold">
                    {formatCurrency(lineItems.reduce((sum, item) => sum + item.estimatedCost, 0))}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="text-foreground font-bold">
                    {formatCurrency(lineItems.reduce((sum, item) => sum + (item.actualCost || 0), 0))}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="text-primary font-bold">
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
      </div>



      {/* Change Orders Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Change Orders</h2>
            <p className="text-muted-foreground">
              Track and manage changes to the original scope of work
            </p>
          </div>
          {canModifyQuotes() && (
            <Button
              variant="primary"
              onClick={handleAddChangeOrder}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Change Order
            </Button>
          )}
        </div>

        {changeOrdersLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <span className="ml-3 text-muted-foreground">Loading change orders...</span>
          </div>
        ) : changeOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Change Orders</h3>
            <p className="text-muted-foreground mb-6">
              No change orders have been created for this quote yet.
            </p>
            {canModifyQuotes() && (
              <Button
                variant="outline"
                onClick={handleAddChangeOrder}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create First Change Order
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {changeOrders.map((changeOrder) => (
              <div
                key={changeOrder.id}
                className="bg-background border border-border rounded-lg p-6 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {changeOrder.description}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getChangeOrderStatusColor(changeOrder.status)}`}>
                        {changeOrder.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className={`font-medium ${
                          changeOrder.amount >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {changeOrder.amount >= 0 ? '+' : ''}
                          {formatCurrency(changeOrder.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Created {new Date(changeOrder.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canModifyQuotes() && (
                    <div className="flex items-center gap-2 ml-4">
                      {/* Status Action Buttons */}
                      {changeOrder.status === 'Pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeOrderStatusUpdate(changeOrder, 'Approved')}
                            className="flex items-center gap-1 text-success border-success/30 hover:bg-success/10"
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeOrderStatusUpdate(changeOrder, 'Rejected')}
                            className="flex items-center gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {changeOrder.status === 'Approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeOrderStatusUpdate(changeOrder, 'Pending')}
                          className="flex items-center gap-1 text-warning border-warning/30 hover:bg-warning/10"
                        >
                          <Clock className="w-3 h-3" />
                          Revert to Pending
                        </Button>
                      )}

                      {changeOrder.status === 'Rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeOrderStatusUpdate(changeOrder, 'Pending')}
                          className="flex items-center gap-1 text-warning border-warning/30 hover:bg-warning/10"
                        >
                          <Clock className="w-3 h-3" />
                          Revert to Pending
                        </Button>
                      )}

                      {/* Edit and Delete Actions */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditChangeOrder(changeOrder)}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChangeOrder(changeOrder)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Change Orders Summary */}
            <div className="border-t border-border pt-4 mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Total Change Orders Impact:
                </span>
                <span className={`font-semibold ${
                  changeOrders
                    .filter(co => co.status === 'Approved')
                    .reduce((sum, co) => sum + co.amount, 0) >= 0 
                    ? 'text-success' 
                    : 'text-destructive'
                }`}>
                  {changeOrders
                    .filter(co => co.status === 'Approved')
                    .reduce((sum, co) => sum + co.amount, 0) >= 0 ? '+' : ''}
                  {formatCurrency(
                    changeOrders
                      .filter(co => co.status === 'Approved')
                      .reduce((sum, co) => sum + co.amount, 0)
                  )}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Only approved change orders affect the actual costs
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Change Order Modal */}
      <ChangeOrderModal
        isOpen={isChangeOrderModalOpen}
        onClose={handleCloseChangeOrderModal}
        onSuccess={handleChangeOrderSuccess}
        changeOrderToEdit={changeOrderToEdit}
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