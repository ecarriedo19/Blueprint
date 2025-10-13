import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProjects } from '../utils/queries';
import Card from './Card';
import Button from './Button';
import { X, Edit3 } from 'lucide-react';

interface BulkEditQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedQuoteIds: number[];
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}

const BulkEditQuotesModal: React.FC<BulkEditQuotesModalProps> = ({ 
  isOpen, 
  onClose, 
  selectedQuoteIds, 
  onSuccess 
}) => {
  const queryClient = useQueryClient();
  const { data: projects = [] } = useProjects();
  
  const [formData, setFormData] = useState({
    project_id: '',
    status: ''
  });

  // Mutation for bulk updating quotes
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: { project_id?: number | null; status?: string }) => {
      const response = await fetch('/api/quotes/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          quote_ids: selectedQuoteIds,
          updates: updates
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quotes');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch quotes data
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      if (onSuccess) {
        onSuccess(`Successfully updated ${data.updatedCount} quotes!`);
      }
      onClose();
    },
    onError: (error: Error) => {
      if (onSuccess) {
        onSuccess(error.message || 'Failed to update quotes', 'error');
      }
    }
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build updates object with only non-empty values
    const updates: { project_id?: number | null; status?: string } = {};
    
    if (formData.project_id !== '') {
      updates.project_id = formData.project_id === 'null' ? null : parseInt(formData.project_id);
    }
    
    if (formData.status !== '') {
      updates.status = formData.status;
    }

    // Check if at least one field is selected for update
    if (Object.keys(updates).length === 0) {
      if (onSuccess) {
        onSuccess('Please select at least one field to update', 'error');
      }
      return;
    }

    bulkUpdateMutation.mutate(updates);
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

  if (!isOpen) return null;

  const statusOptions = [
    { value: '', label: 'Keep current status' },
    { value: 'Draft', label: 'Draft' },
    { value: 'Client to be review', label: 'Client to be review' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Working on it', label: 'Working on it' },
    { value: 'Completed', label: 'Completed' }
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
                  <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Bulk Edit Quotes
                  </h2>
                  <p className="text-slate-400">
                    Editing {selectedQuoteIds.length} selected quote{selectedQuoteIds.length !== 1 ? 's' : ''}
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
              {/* Project Assignment */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Related Project
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => handleInputChange('project_id', e.target.value)}
                  className="w-full px-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Keep current project</option>
                  <option value="null">No Project (Standalone Quote)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

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
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
                  loading={bulkUpdateMutation.isPending}
                  className="flex-1"
                >
                  {bulkUpdateMutation.isPending ? 'Updating...' : `Update ${selectedQuoteIds.length} Quote${selectedQuoteIds.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BulkEditQuotesModal;