import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Card from './Card';
import Button from './Button';
import { X, FileText, Plus } from 'lucide-react';

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}

const CreateQuoteModal: React.FC<CreateQuoteModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId,
  onSuccess 
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    quoteName: '',
    clientName: '',
    clientEmail: '',
    quoteTotal: '',
    status: 'Draft',
    description: ''
  });

  // Mutation for creating a quote
  const createQuoteMutation = useMutation({
    mutationFn: async (quoteData: {
      quoteName: string;
      clientName: string;
      clientEmail: string;
      quoteTotal: number;
      status: string;
      project_id: number;
      description?: string;
    }) => {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quote');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch project and quotes data
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      
      if (onSuccess) {
        onSuccess('Quote created successfully!');
      }
      
      // Reset form and close modal
      setFormData({
        quoteName: '',
        clientName: '',
        clientEmail: '',
        quoteTotal: '',
        status: 'Draft',
        description: ''
      });
      onClose();
    },
    onError: (error: Error) => {
      if (onSuccess) {
        onSuccess(error.message || 'Failed to create quote', 'error');
      }
    }
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quoteName.trim()) {
      if (onSuccess) {
        onSuccess('Please provide a quote name', 'error');
      }
      return;
    }

    if (!formData.clientName.trim()) {
      if (onSuccess) {
        onSuccess('Please provide a client name', 'error');
      }
      return;
    }

    if (formData.clientEmail && !isValidEmail(formData.clientEmail)) {
      if (onSuccess) {
        onSuccess('Please provide a valid email address', 'error');
      }
      return;
    }

    if (!formData.quoteTotal || isNaN(parseFloat(formData.quoteTotal)) || parseFloat(formData.quoteTotal) <= 0) {
      if (onSuccess) {
        onSuccess('Please provide a valid quote amount', 'error');
      }
      return;
    }

    createQuoteMutation.mutate({
      quoteName: formData.quoteName.trim(),
      clientName: formData.clientName.trim(),
      clientEmail: formData.clientEmail.trim(),
      quoteTotal: parseFloat(formData.quoteTotal),
      status: formData.status,
      project_id: projectId,
      description: formData.description.trim() || undefined
    });
  };

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        quoteName: '',
        clientName: '',
        clientEmail: '',
        quoteTotal: '',
        status: 'Draft',
        description: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const statusOptions = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Accepted', label: 'Accepted' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Expired', label: 'Expired' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl my-8">
          <Card variant="glass" className="relative animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Create New Quote
                  </h2>
                  <p className="text-slate-400">
                    Create a quote for this project
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quote Name and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Quote Name *
                  </label>
                  <input
                    type="text"
                    value={formData.quoteName}
                    onChange={(e) => handleInputChange('quoteName', e.target.value)}
                    className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Kitchen Renovation Quote"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              {/* Quote Total */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Quote Total *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quoteTotal}
                  onChange={(e) => handleInputChange('quoteTotal', e.target.value)}
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Brief description of the work to be performed..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-slate-700/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={createQuoteMutation.isPending}
                  disabled={createQuoteMutation.isPending}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4" />
                  {createQuoteMutation.isPending ? 'Creating...' : 'Create Quote'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateQuoteModal;