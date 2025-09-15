import React, { useState, useEffect } from 'react';
import Button from './Button';
import Card from './Card';
import { useQuotes, Quote } from '../contexts/QuoteContext';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string, type?: 'success' | 'error') => void; // For toast notifications
  quoteToEdit?: Quote | null; // Optional prop for editing mode
}

const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose, onSuccess, quoteToEdit }) => {
  const { addQuote, updateQuote } = useQuotes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    quoteName: '',
    status: 'Client to be review',
    timeToDevelop: '',
    variancePercentage: 0,
    quoteTotal: 0,
    budget: 0
  });

  // Reset form when modal opens - populate with edit data if available
  useEffect(() => {
    if (isOpen) {
      if (quoteToEdit) {
        // Edit mode - populate with existing data
        setFormData({
          quoteName: quoteToEdit.quoteName,
          status: quoteToEdit.status,
          timeToDevelop: quoteToEdit.timeToDevelop,
          variancePercentage: quoteToEdit.variancePercentage,
          quoteTotal: quoteToEdit.quoteTotal,
          budget: quoteToEdit.budget
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          quoteName: '',
          status: 'Client to be review',
          timeToDevelop: '',
          variancePercentage: 0,
          quoteTotal: 0,
          budget: 0
        });
      }
    }
  }, [isOpen, quoteToEdit]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quoteName.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (quoteToEdit) {
        // Edit mode - update existing quote
        await updateQuote(quoteToEdit.id, formData);
        
        // Success feedback
        if (onSuccess) {
          onSuccess('Quote updated successfully!');
        }
      } else {
        // Create mode - add new quote
        await addQuote(formData);
        
        // Success feedback
        if (onSuccess) {
          onSuccess('Quote created successfully!');
        }
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error(`Failed to ${quoteToEdit ? 'update' : 'create'} quote:`, error);
      
      // Error feedback
      if (onSuccess) {
        onSuccess(`Failed to ${quoteToEdit ? 'update' : 'save'} quote. Please try again.`, 'error');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card variant="glass" className="relative animate-fade-in">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {quoteToEdit ? 'Edit Quote' : 'Create New Quote'}
              </h2>
              <p className="text-slate-400">
                {quoteToEdit 
                  ? 'Update the details below to modify this construction quote.'
                  : 'Fill in the details below to create a new construction quote.'
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
            {/* Quote Name - Full Width */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Quote Name *
              </label>
              <input
                type="text"
                value={formData.quoteName}
                onChange={(e) => handleInputChange('quoteName', e.target.value)}
                className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Downtown Office Building Renovation"
                required
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="Client to be review">Client to be review</option>
                  <option value="Approved">Approved</option>
                  <option value="Working on it">Working on it</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Time to Develop */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Time to Develop
                </label>
                <input
                  type="text"
                  value={formData.timeToDevelop}
                  onChange={(e) => handleInputChange('timeToDevelop', e.target.value)}
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., 8-12 weeks"
                />
              </div>

              {/* Variance Percentage */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Variance Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.variancePercentage}
                    onChange={(e) => handleInputChange('variancePercentage', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-4 pr-12 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.0"
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400">%</span>
                </div>
              </div>

              {/* Quote Total */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Quote Total
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={formData.quoteTotal}
                    onChange={(e) => handleInputChange('quoteTotal', parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Budget
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

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
                disabled={!formData.quoteName.trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting 
                  ? (quoteToEdit ? 'Updating Quote...' : 'Creating Quote...') 
                  : (quoteToEdit ? 'Update Quote' : 'Create Quote')
                }
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default QuoteModal;