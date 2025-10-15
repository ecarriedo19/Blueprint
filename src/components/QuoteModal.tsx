import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import { useQuotes, Quote } from '../contexts/QuoteContext';
import { useProjects } from '../utils/queries';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string, type?: 'success' | 'error') => void; // For toast notifications
  quoteToEdit?: Quote | null; // Optional prop for editing mode
}

const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose, onSuccess, quoteToEdit }) => {
  const { addQuote, updateQuote } = useQuotes();
  const { data: projects = [] } = useProjects(); // Fetch available projects for dropdown
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    quoteName: '',
    status: 'Client to be review',
    timeToDevelop: '', // Keep for backward compatibility
    timeToDevelopValue: 1, // Default to 1 instead of 0
    timeToDevelopUnit: 'weeks', // Use lowercase for consistency
    variancePercentage: 0,
    quoteTotal: 0,
    budget: 0,
    project_id: null as number | null // Project linking field
  });

  // Reset form when modal opens - populate with edit data if available
  useEffect(() => {
    if (isOpen) {
      if (quoteToEdit) {
        // Edit mode - populate with existing data
        // Handle backward compatibility: parse timeToDevelop if new fields are not available
        let parsedValue = quoteToEdit.timeToDevelopValue || 1;
        let parsedUnit = quoteToEdit.timeToDevelopUnit || 'weeks';
        
        if ((!quoteToEdit.timeToDevelopValue || quoteToEdit.timeToDevelopValue === 0) && quoteToEdit.timeToDevelop) {
          // Parse existing timeToDevelop string (e.g., "8 weeks", "3 months", "14 days")
          const match = quoteToEdit.timeToDevelop.match(/(\d+)\s*(day|week|month)s?/i);
          if (match) {
            parsedValue = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            parsedUnit = unit === 'day' ? 'days' : unit === 'week' ? 'weeks' : 'months';
          }
        }
        
        setFormData({
          quoteName: quoteToEdit.quoteName,
          status: quoteToEdit.status,
          timeToDevelop: quoteToEdit.timeToDevelop,
          timeToDevelopValue: parsedValue,
          timeToDevelopUnit: parsedUnit,
          variancePercentage: quoteToEdit.variancePercentage,
          quoteTotal: quoteToEdit.quoteTotal,
          budget: quoteToEdit.budget,
          project_id: (quoteToEdit as any).project_id || null // Handle existing quotes that might have project_id
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          quoteName: '',
          status: 'Client to be review',
          timeToDevelop: '',
          timeToDevelopValue: 0,
          timeToDevelopUnit: 'Weeks',
          variancePercentage: 0,
          quoteTotal: 0,
          budget: 0,
          project_id: null
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
  const handleInputChange = (field: string, value: string | number | null) => {
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

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div 
        className="bg-background border border-border rounded-xl p-6 w-full max-w-2xl mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {quoteToEdit ? 'Edit Quote' : 'Create New Quote'}
              </h2>
              <p className="text-muted-foreground">
                {quoteToEdit 
                  ? 'Update the details below to modify this construction quote.'
                  : 'Fill in the details below to create a new construction quote.'
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
            {/* Quote Name - Full Width */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Quote Name *
              </label>
              <input
                type="text"
                value={formData.quoteName}
                onChange={(e) => handleInputChange('quoteName', e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                placeholder="e.g., Downtown Office Building Renovation"
                required
              />
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Link to Project (Optional)
              </label>
              <select
                value={formData.project_id || ''}
                onChange={(e) => handleInputChange('project_id', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
              >
                <option value="">No Project (Standalone Quote)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.status})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Link this quote to a project to track it in the Project Command Center
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
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
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Time to Develop
                </label>
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="number"
                    min="1"
                    value={formData.timeToDevelopValue || ''}
                    onChange={(e) => handleInputChange('timeToDevelopValue', e.target.value ? parseInt(e.target.value) : 1)}
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                    placeholder="12"
                  />
                  <select
                    value={formData.timeToDevelopUnit || 'weeks'}
                    onChange={(e) => handleInputChange('timeToDevelopUnit', e.target.value)}
                    className="px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 min-w-[120px]"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              {/* Variance Percentage */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Variance Percentage
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.variancePercentage}
                    onChange={(e) => handleInputChange('variancePercentage', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-l-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                    placeholder="0.0"
                  />
                  <div className="px-4 py-3 bg-muted border border-l-0 border-border rounded-r-lg text-muted-foreground font-medium">
                    %
                  </div>
                </div>
              </div>

              {/* Quote Total */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Quote Total
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quoteTotal}
                    onChange={(e) => handleInputChange('quoteTotal', parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Budget
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                    className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>
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
      </div>
    </div>,
    document.body
  );
};

export default QuoteModal;