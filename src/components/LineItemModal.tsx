import React, { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';

interface LineItem {
  id?: number;
  description: string;
  estimatedCost: number;
  actualCost: number;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    estimatedCost: 0,
    actualCost: 0
  });

  // Reset form when modal opens - populate with edit data if available
  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        // Edit mode - populate with existing data
        setFormData({
          description: itemToEdit.description,
          estimatedCost: itemToEdit.estimatedCost,
          actualCost: itemToEdit.actualCost
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          description: '',
          estimatedCost: 0,
          actualCost: 0
        });
      }
    }
  }, [isOpen, itemToEdit]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      
      if (itemToEdit) {
        // Edit mode - update existing line item
        response = await fetch(`http://localhost:4000/api/line-items/${itemToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        });
      } else {
        // Create mode - add new line item
        response = await fetch(`http://localhost:4000/api/quotes/${quoteId}/line-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${itemToEdit ? 'update' : 'create'} line item`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Success feedback
        if (onSuccess) {
          onSuccess(`Line item ${itemToEdit ? 'updated' : 'created'} successfully!`);
        }
        
        // Close modal
        onClose();
      } else {
        throw new Error(data.error || `Failed to ${itemToEdit ? 'update' : 'create'} line item`);
      }
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
  const handleInputChange = (field: string, value: string | number) => {
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
          <Card variant="glass" className="relative animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {itemToEdit ? 'Edit Line Item' : 'Add Line Item'}
                </h2>
                <p className="text-slate-400">
                  {itemToEdit 
                    ? 'Update the details below to modify this line item.'
                    : 'Fill in the details below to add a new line item to this quote.'
                  }
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
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
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Foundation Work, Electrical Installation"
                  required
                />
              </div>

              {/* Cost Fields - Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Estimated Cost */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Estimated Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.estimatedCost || ''}
                      onChange={(e) => handleInputChange('estimatedCost', e.target.value ? parseFloat(e.target.value) : 0)}
                      className="w-full pl-8 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Actual Cost */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Actual Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.actualCost || ''}
                      onChange={(e) => handleInputChange('actualCost', e.target.value ? parseFloat(e.target.value) : 0)}
                      className="w-full pl-8 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Variance Preview */}
              {(formData.estimatedCost > 0 || formData.actualCost > 0) && (
                <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Variance:</span>
                    <span className={`text-sm font-semibold ${
                      formData.actualCost > formData.estimatedCost 
                        ? 'text-red-400' 
                        : formData.actualCost < formData.estimatedCost 
                          ? 'text-green-400' 
                          : 'text-slate-300'
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
              <div className="flex gap-4 pt-6 border-t border-slate-700/50">
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
                  disabled={!formData.description.trim() || isSubmitting}
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