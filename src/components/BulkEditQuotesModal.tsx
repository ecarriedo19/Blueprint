import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../utils/queries';
import { modalBackdrop, modalContent } from '../utils/animations';
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

  // Remove the early return since we're using AnimatePresence

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
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={handleOverlayClick}
          variants={modalBackdrop}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="min-h-screen flex items-center justify-center p-4 py-8">
            <motion.div 
              className="w-full max-w-2xl my-8"
              variants={modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Card variant="glass" className="relative">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Edit3 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-1">
                        Editing {selectedQuoteIds.length} selected quotes
                      </h2>
                      <p className="text-muted-foreground">
                        Update multiple quotes at once
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Project Assignment */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Related Project
                    </label>
                    <select
                      value={formData.project_id}
                      onChange={(e) => handleInputChange('project_id', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
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
                    <label className="block text-sm font-medium text-foreground mb-3">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t border-border">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onClose}
                      className="flex-1"
                      disabled={bulkUpdateMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={bulkUpdateMutation.isPending}
                      className="flex-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      {bulkUpdateMutation.isPending ? 'Updating...' : `Update ${selectedQuoteIds.length} Quote${selectedQuoteIds.length !== 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkEditQuotesModal;