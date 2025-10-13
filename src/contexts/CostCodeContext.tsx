import React, { createContext, useContext, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CostCode } from '../utils/queries';

interface CostCodeContextType {
  addCostCode: (codeData: {
    code: string;
    description: string;
    division?: string;
  }) => Promise<CostCode>;
  updateCostCode: (id: number, codeData: {
    code: string;
    description: string;
    division?: string;
  }) => Promise<CostCode>;
  deleteCostCode: (id: number) => Promise<void>;
  importTemplate: (templateId: number, customDescription?: string) => Promise<CostCode>;
}

interface CostCodeProviderProps {
  children: React.ReactNode;
}

const CostCodeContext = createContext<CostCodeContextType | undefined>(undefined);

export const useCostCodes = () => {
  const context = useContext(CostCodeContext);
  if (context === undefined) {
    throw new Error('useCostCodes must be used within a CostCodeProvider');
  }
  return context;
};

export const CostCodeProvider: React.FC<CostCodeProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  const addCostCodeMutation = useMutation({
    mutationFn: async (codeData: {
      code: string;
      description: string;
      division?: string;
    }) => {
      const response = await fetch('/api/cost-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(codeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to create cost code');
      }
    },
    onSuccess: () => {
      // Invalidate cost codes query to refetch
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] });
    },
  });

  const updateCostCodeMutation = useMutation({
    mutationFn: async ({ id, codeData }: {
      id: number;
      codeData: {
        code: string;
        description: string;
        division?: string;
      };
    }) => {
      const response = await fetch(`/api/cost-codes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(codeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to update cost code');
      }
    },
    onSuccess: () => {
      // Invalidate cost codes query to refetch
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] });
    },
  });

  const deleteCostCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/cost-codes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete cost code: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Failed to delete cost code');
      }
    },
    onSuccess: () => {
      // Invalidate cost codes query to refetch
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] });
      console.log('Cost code deleted successfully');
    },
  });

  const importTemplateMutation = useMutation({
    mutationFn: async ({ templateId, customDescription }: {
      templateId: number;
      customDescription?: string;
    }) => {
      const response = await fetch('/api/cost-codes/import-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ templateId, customDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to import template');
      }
    },
    onSuccess: () => {
      // Invalidate cost codes query to refetch
      queryClient.invalidateQueries({ queryKey: ['cost-codes'] });
    },
  });

  const addCostCode = useCallback(async (codeData: {
    code: string;
    description: string;
    division?: string;
  }): Promise<CostCode> => {
    return await addCostCodeMutation.mutateAsync(codeData);
  }, [addCostCodeMutation]);

  const updateCostCode = useCallback(async (id: number, codeData: {
    code: string;
    description: string;
    division?: string;
  }): Promise<CostCode> => {
    return await updateCostCodeMutation.mutateAsync({ id, codeData });
  }, [updateCostCodeMutation]);

  const deleteCostCode = useCallback(async (id: number): Promise<void> => {
    await deleteCostCodeMutation.mutateAsync(id);
  }, [deleteCostCodeMutation]);

  const importTemplate = useCallback(async (templateId: number, customDescription?: string): Promise<CostCode> => {
    return await importTemplateMutation.mutateAsync({ templateId, customDescription });
  }, [importTemplateMutation]);

  const value: CostCodeContextType = {
    addCostCode,
    updateCostCode,
    deleteCostCode,
    importTemplate,
  };

  return (
    <CostCodeContext.Provider value={value}>
      {children}
    </CostCodeContext.Provider>
  );
};

