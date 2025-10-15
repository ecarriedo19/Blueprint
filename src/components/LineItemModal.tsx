import React, { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import { useQuotes } from '../contexts/QuoteContext';
import { useCostCodes } from '../utils/queries';
import { Search } from 'lucide-react';

interface LineItem {
  id?: number;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  cost_code_id?: number;
}

interface LineItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
  itemToEdit?: LineItem | null;
  quoteId: number;
}

const LineItemModal: React.FC<LineItemModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  itemToEdit, 
  quoteId 
}) => {
  const { addLineItem, updateLineItem } = useQuotes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [costCodeSearch, setCostCodeSearch] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    estimatedCost: 0,
    actualCost: 0,
    cost_code_id: undefined as number | undefined
  });

  // Fetch cost codes with search filter
  const { data: allCostCodes = [], isLoading: loadingCostCodes } = useCostCodes({
    search: costCodeSearch,
    includeTemplates: true
  });

  // Reset form when modal opens - populate with edit data if available
  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        // Edit mode - populate with existing data
        setFormData({
          description: itemToEdit.description,
          estimatedCost: itemToEdit.estimatedCost,
          actualCost: itemToEdit.actualCost || 0,
          cost_code_id: itemToEdit.cost_code_id
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          description: '',
          estimatedCost: 0,
          actualCost: 0,
          cost_code_id: undefined
        });
      }
      setCostCodeSearch(''); // Reset search when modal opens
    }
  }, [isOpen, itemToEdit]);

  // Get selected cost code for display
  const selectedCostCode = allCostCodes.find(code => code.id === formData.cost_code_id);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      return;
    }

    if (!formData.cost_code_id) {
      if (onSuccess) {
        onSuccess('Please select a cost code', 'error');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      if (itemToEdit) {
        // Edit mode - use mutation from context (this will trigger cache invalidation)
        await updateLineItem(itemToEdit.id!, quoteId, formData);
      } else {
        // Create mode - use mutation from context (this will trigger cache invalidation)
        await addLineItem(quoteId, formData);
      }

      // Success feedback
      if (onSuccess) {
        onSuccess(`Line item ${itemToEdit ? 'updated' : 'created'} successfully!`);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error(`Failed to ${itemToEdit ? 'update' : 'create'} line item:`, error);
      
      // Error feedback
      if (onSuccess) {
        onSuccess(`Failed to ${itemToEdit ? 'update' : 'save'} line item. Please try again.`, 'error');
      }
    } finally {
      setIsSubmitting(false);
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

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg my-8">
          <Card variant="default" className="relative animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {itemToEdit ? 'Edit Line Item' : 'Add Line Item'}
                </h2>
                <p className="text-muted-foreground">
                  {itemToEdit 
                    ? 'Update the details below to modify this line item.'
                    : 'Fill in the details below to add a new line item to this quote.'
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Foundation Work, Electrical Installation"
                  required
                />
              </div>

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
                                  {code.is_template ? ' (CSI Template)' : ''}
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
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/50"
                  />
                </div>
              </div>

              {/* Cost Fields - Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estimated Cost */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Estimated Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.estimatedCost || ''}
                      onChange={(e) => handleInputChange('estimatedCost', e.target.value ? parseFloat(e.target.value) : 0)}
                      className="w-full pl-8 pr-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Actual Cost */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Actual Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.actualCost || ''}
                      onChange={(e) => handleInputChange('actualCost', e.target.value ? parseFloat(e.target.value) : 0)}
                      className="w-full pl-8 pr-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Variance Preview */}
              {(formData.estimatedCost > 0 || formData.actualCost > 0) && (
                <div className="p-4 bg-muted/30 border border-border rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground text-sm">Variance:</span>
                    <span className={`text-sm font-semibold ${
                      formData.actualCost > formData.estimatedCost 
                        ? 'text-destructive' 
                        : formData.actualCost < formData.estimatedCost 
                          ? 'text-success' 
                          : 'text-muted-foreground'
                    }`}>
                      {formData.estimatedCost > 0 
                        ? `${((formData.actualCost - formData.estimatedCost) / formData.estimatedCost * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                </div>
              )}

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
                  disabled={!formData.description.trim() || !formData.cost_code_id || isSubmitting}
                  className="flex-1"
                >
                  {itemToEdit ? 'Update Line Item' : 'Add Line Item'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LineItemModal;