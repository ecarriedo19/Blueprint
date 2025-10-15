import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Card from './Card';
import Button from './Button';
import { X, Activity, Plus } from 'lucide-react';

interface Quote {
  id: number;
  quoteName: string;
  status: string;
  quoteTotal: number;
}

interface CreateChangeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}

const CreateChangeOrderModal: React.FC<CreateChangeOrderModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId,
  onSuccess 
}) => {
  const queryClient = useQueryClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    status: 'Pending',
    quote_id: ''
  });

  // Mutation for creating a change order
  const createChangeOrderMutation = useMutation({
    mutationFn: async (changeOrderData: {
      description: string;
      amount: number;
      status: string;
      quote_id: number;
      project_id: number;
    }) => {
      const response = await fetch('/api/change-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(changeOrderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create change order');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch project data
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      
      if (onSuccess) {
        onSuccess('Change order created successfully!');
      }
      
      // Reset form and close modal
      setFormData({
        description: '',
        amount: '',
        status: 'Pending',
        quote_id: ''
      });
      onClose();
    },
    onError: (error: Error) => {
      if (onSuccess) {
        onSuccess(error.message || 'Failed to create change order', 'error');
      }
    }
  });

  // Fetch project quotes when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectQuotes();
    }
  }, [isOpen, projectId]);

  const fetchProjectQuotes = async () => {
    setLoadingQuotes(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project quotes');
      }

      const data = await response.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      console.error('Error fetching project quotes:', err);
      if (onSuccess) {
        onSuccess('Failed to load project quotes', 'error');
      }
    } finally {
      setLoadingQuotes(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      if (onSuccess) {
        onSuccess('Please provide a description for the change order', 'error');
      }
      return;
    }

    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      if (onSuccess) {
        onSuccess('Please provide a valid amount', 'error');
      }
      return;
    }

    if (!formData.quote_id) {
      if (onSuccess) {
        onSuccess('Please select a quote for this change order', 'error');
      }
      return;
    }

    createChangeOrderMutation.mutate({
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      status: formData.status,
      quote_id: parseInt(formData.quote_id),
      project_id: projectId
    });
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
        description: '',
        amount: '',
        status: 'Pending',
        quote_id: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const statusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' }
  ];

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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Create Change Order
                  </h2>
                  <p className="text-muted-foreground">
                    Add a change order to modify project scope or costs
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quote Selection */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Parent Quote *
                </label>
                {loadingQuotes ? (
                  <div className="flex items-center justify-center py-4 bg-background rounded-xl border border-border">
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mr-2"></div>
                    <span className="text-muted-foreground">Loading quotes...</span>
                  </div>
                ) : (
                  <select
                    value={formData.quote_id}
                    onChange={(e) => handleInputChange('quote_id', e.target.value)}
                    className="w-full px-4 py-4 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select a quote</option>
                    {quotes.map((quote) => (
                      <option key={quote.id} value={quote.id}>
                        {quote.quoteName} (${quote.quoteTotal.toLocaleString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                  placeholder="Describe the change order (e.g., Additional electrical work for new outlets)"
                  rows={3}
                  required
                />
              </div>

              {/* Amount and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="w-full px-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-4 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={createChangeOrderMutation.isPending}
                  disabled={createChangeOrderMutation.isPending || loadingQuotes}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4" />
                  {createChangeOrderMutation.isPending ? 'Creating...' : 'Create Change Order'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateChangeOrderModal;