import React, { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';

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

interface ChangeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
  changeOrderToEdit?: ChangeOrder | null;
  quoteId: number;
}

const ChangeOrderModal: React.FC<ChangeOrderModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  changeOrderToEdit, 
  quoteId 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0
  });

  // Reset form when modal opens - populate with edit data if available
  useEffect(() => {
    if (isOpen) {
      if (changeOrderToEdit) {
        // Edit mode - populate with existing data
        setFormData({
          description: changeOrderToEdit.description,
          amount: changeOrderToEdit.amount
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          description: '',
          amount: 0
        });
      }
    }
  }, [isOpen, changeOrderToEdit]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      if (onSuccess) {
        onSuccess('Description is required', 'error');
      }
      return;
    }

    if (isNaN(formData.amount)) {
      if (onSuccess) {
        onSuccess('Amount must be a valid number', 'error');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      
      if (changeOrderToEdit) {
        // Edit mode - update existing change order
        response = await fetch(`/api/change-orders/${changeOrderToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
      } else {
        // Create mode - add new change order
        response = await fetch(`/api/quotes/${quoteId}/change-orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${changeOrderToEdit ? 'update' : 'create'} change order`);
      }

      // Success feedback
      if (onSuccess) {
        onSuccess(
          changeOrderToEdit 
            ? 'Change order updated successfully!' 
            : 'Change order created successfully!'
        );
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error(`Failed to ${changeOrderToEdit ? 'update' : 'create'} change order:`, error);
      
      // Error feedback
      if (onSuccess) {
        onSuccess(
          error instanceof Error 
            ? error.message 
            : `Failed to ${changeOrderToEdit ? 'update' : 'save'} change order. Please try again.`, 
          'error'
        );
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
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl my-8">
          <Card variant="glass" className="relative animate-fade-in z-50">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {changeOrderToEdit ? 'Edit Change Order' : 'Create New Change Order'}
                </h2>
                <p className="text-slate-400">
                  {changeOrderToEdit 
                    ? 'Update the details below to modify this change order.'
                    : 'Fill in the details below to create a new change order for this quote.'
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
              {/* Description - Full Width */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical min-h-[100px]"
                  placeholder="e.g., Add additional electrical outlets in conference room"
                  required
                  rows={3}
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Enter a positive number for additional costs or a negative number for cost reductions.
                </p>
              </div>

              {/* Status Display for Edit Mode */}
              {changeOrderToEdit && (
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Current Status
                  </label>
                  <div className="px-4 py-3 bg-slate-800/30 border border-slate-600/30 rounded-xl">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      changeOrderToEdit.status === 'Approved' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : changeOrderToEdit.status === 'Rejected'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {changeOrderToEdit.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-2">
                      Status can be changed using the action buttons on the main page.
                    </p>
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
                  {changeOrderToEdit ? 'Update Change Order' : 'Create Change Order'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChangeOrderModal;