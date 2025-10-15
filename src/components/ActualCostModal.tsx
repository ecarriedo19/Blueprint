import React, { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import { useCostCodes, type ActualCost } from '../utils/queries';
import { useVendors } from '../contexts/VendorContext';
import { useActualCostMutations } from '../contexts/ActualCostContext';
import { Search, Calendar, DollarSign, FileText } from 'lucide-react';

interface ActualCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
  projectId: number;
  actualCostToEdit?: ActualCost | null;
}

const ActualCostModal: React.FC<ActualCostModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId,
  actualCostToEdit
}) => {
  const { addActualCost, updateActualCost, isAddingActualCost, isUpdatingActualCost } = useActualCostMutations();
  const [costCodeSearch, setCostCodeSearch] = useState('');
  const [formData, setFormData] = useState({
    cost_code_id: undefined as number | undefined,
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    description: '',
    vendor_id: undefined as number | undefined
  });

  // Fetch cost codes with search filter
  const { data: allCostCodes = [], isLoading: loadingCostCodes } = useCostCodes({
    search: costCodeSearch,
    includeTemplates: true
  });

  // Fetch vendors
  const { vendors = [] } = useVendors();

  // Get selected cost code for display
  const selectedCostCode = allCostCodes.find(code => code.id === formData.cost_code_id);

  // Reset form when modal opens - populate with edit data if available
  useEffect(() => {
    if (isOpen) {
      if (actualCostToEdit) {
        // Edit mode - populate with existing data
        setFormData({
          cost_code_id: actualCostToEdit.cost_code_id,
          amount: actualCostToEdit.amount,
          date: actualCostToEdit.date,
          description: actualCostToEdit.description || '',
          vendor_id: actualCostToEdit.vendor_id || undefined
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          cost_code_id: undefined,
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: '',
          vendor_id: undefined
        });
      }
      setCostCodeSearch(''); // Reset search when modal opens
    }
  }, [isOpen, actualCostToEdit]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cost_code_id) {
      if (onSuccess) {
        onSuccess('Please select a cost code', 'error');
      }
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      if (onSuccess) {
        onSuccess('Amount must be greater than 0', 'error');
      }
      return;
    }

    if (!formData.date) {
      if (onSuccess) {
        onSuccess('Date is required', 'error');
      }
      return;
    }

    // Create validated data object with guaranteed cost_code_id
    const validatedData = {
      cost_code_id: formData.cost_code_id, // Guaranteed to be number due to validation above
      amount: formData.amount,
      date: formData.date,
      description: formData.description,
      vendor_id: formData.vendor_id
    };

    try {
      if (actualCostToEdit) {
        // Edit mode
        await updateActualCost(projectId, actualCostToEdit.id, validatedData);
        if (onSuccess) {
          onSuccess('Actual cost updated successfully!');
        }
      } else {
        // Create mode
        await addActualCost(projectId, validatedData);
        if (onSuccess) {
          onSuccess('Actual cost logged successfully!');
        }
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error(`Failed to ${actualCostToEdit ? 'update' : 'create'} actual cost:`, error);
      
      // Error feedback
      if (onSuccess) {
        onSuccess(
          error instanceof Error 
            ? error.message 
            : `Failed to ${actualCostToEdit ? 'update' : 'save'} actual cost. Please try again.`, 
          'error'
        );
      }
    }
  };

  // Handle form field changes
  const handleInputChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSubmitting = isAddingActualCost || isUpdatingActualCost;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl my-8">
          <Card variant="default" className="relative animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {actualCostToEdit ? 'Edit Actual Cost' : 'Log New Expense'}
                </h2>
                <p className="text-muted-foreground">
                  {actualCostToEdit 
                    ? 'Update the details below to modify this expense entry.'
                    : 'Record an actual expense for this project to track budget vs. actuals.'
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cost Code Selection */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Cost Code *
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none z-10" />
                    <select
                      value={formData.cost_code_id || ''}
                      onChange={(e) => handleInputChange('cost_code_id', e.target.value ? parseInt(e.target.value) : undefined)}
                      onFocus={() => setCostCodeSearch('')}
                      className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 cursor-pointer"
                      required
                    >
                      <option value="">Select a cost code...</option>
                      {loadingCostCodes ? (
                        <option disabled>Loading cost codes...</option>
                      ) : (
                        (() => {
                          // Group codes by division
                          const groupedCodes = allCostCodes.reduce((acc, code) => {
                            const division = code.division || 'Uncategorized';
                            if (!acc[division]) {
                              acc[division] = [];
                            }
                            acc[division].push(code);
                            return acc;
                          }, {} as Record<string, typeof allCostCodes>);

                          // Render optgroups
                          return Object.entries(groupedCodes).map(([division, codes]) => (
                            <optgroup key={division} label={division}>
                              {codes.map(code => (
                                <option key={code.id} value={code.id}>
                                  {code.code} - {code.description}
                                  {code.is_template ? ' (CSI)' : ''}
                                </option>
                              ))}
                            </optgroup>
                          ));
                        })()
                      )}
                    </select>
                  </div>
                  {selectedCostCode && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Selected: <span className="text-primary font-mono">{selectedCostCode.code}</span> - {selectedCostCode.description}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Search cost codes..."
                    value={costCodeSearch}
                    onChange={(e) => setCostCodeSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Amount and Date - Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Amount *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.amount || ''}
                      onChange={(e) => handleInputChange('amount', e.target.value ? parseFloat(e.target.value) : 0)}
                      className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Vendor (Optional)
                </label>
                <select
                  value={formData.vendor_id || ''}
                  onChange={(e) => handleInputChange('vendor_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-4 py-4 bg-background border border-border rounded-xl text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 cursor-pointer"
                >
                  <option value="">Select a vendor (optional)...</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Description (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-muted-foreground w-5 h-5 pointer-events-none" />
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 resize-vertical min-h-[100px]"
                    placeholder="e.g., Invoice #12345 for concrete delivery"
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={!formData.cost_code_id || !formData.amount || !formData.date || isSubmitting}
                  className="flex-1"
                >
                  {actualCostToEdit ? 'Update Expense' : 'Log Expense'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActualCostModal;

