import React, { createContext, useContext } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ActualCostInput {
  cost_code_id: number;
  amount: number;
  date: string;
  description?: string;
  vendor_id?: number;
}

interface ActualCostContextType {
  addActualCost: (projectId: number, data: ActualCostInput) => Promise<void>;
  updateActualCost: (projectId: number, actualId: number, data: Partial<ActualCostInput>) => Promise<void>;
  deleteActualCost: (projectId: number, actualId: number) => Promise<void>;
  isAddingActualCost: boolean;
  isUpdatingActualCost: boolean;
  isDeletingActualCost: boolean;
}

const ActualCostContext = createContext<ActualCostContextType | undefined>(undefined);

export const ActualCostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // Add actual cost mutation
  const addActualCostMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: ActualCostInput }) => {
      const response = await fetch(`/api/projects/${projectId}/actuals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add actual cost');
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate actual costs query for this project
      queryClient.invalidateQueries({ queryKey: ['project-actuals', variables.projectId] });
      // Also invalidate project query as it may include BvA data
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });

  // Update actual cost mutation
  const updateActualCostMutation = useMutation({
    mutationFn: async ({ projectId, actualId, data }: { projectId: number; actualId: number; data: Partial<ActualCostInput> }) => {
      const response = await fetch(`/api/projects/${projectId}/actuals/${actualId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update actual cost');
      }

      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-actuals', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });

  // Delete actual cost mutation
  const deleteActualCostMutation = useMutation({
    mutationFn: async ({ projectId, actualId }: { projectId: number; actualId: number }) => {
      const response = await fetch(`/api/projects/${projectId}/actuals/${actualId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete actual cost');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-actuals', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
    },
  });

  const contextValue: ActualCostContextType = {
    addActualCost: (projectId, data) => addActualCostMutation.mutateAsync({ projectId, data }),
    updateActualCost: (projectId, actualId, data) => updateActualCostMutation.mutateAsync({ projectId, actualId, data }),
    deleteActualCost: (projectId, actualId) => deleteActualCostMutation.mutateAsync({ projectId, actualId }),
    isAddingActualCost: addActualCostMutation.isPending,
    isUpdatingActualCost: updateActualCostMutation.isPending,
    isDeletingActualCost: deleteActualCostMutation.isPending,
  };

  return <ActualCostContext.Provider value={contextValue}>{children}</ActualCostContext.Provider>;
};

export const useActualCostMutations = (): ActualCostContextType => {
  const context = useContext(ActualCostContext);
  if (!context) {
    throw new Error('useActualCostMutations must be used within ActualCostProvider');
  }
  return context;
};

