import React, { createContext, useContext, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface Quote {
  id: number;
  quoteName: string;
  status: string;
  timeToDevelop: string; // Keep for backward compatibility
  timeToDevelopValue: number;
  timeToDevelopUnit: string;
  variancePercentage: number;
  quoteTotal: number;
  budget: number;
  created_at: string;
  updated_at: string;
}

interface QuoteContextType {
  addQuote: (quoteData: {
    quoteName: string;
    status?: string;
    timeToDevelop?: string;
    timeToDevelopValue?: number;
    timeToDevelopUnit?: string;
    variancePercentage?: number;
    quoteTotal?: number;
    budget?: number;
  }) => Promise<Quote>;
  addLineItem: (quoteId: number, lineItemData: {
    description: string;
    estimatedCost: number;
  }) => Promise<any>;
  updateLineItem: (itemId: number, quoteId: number, lineItemData: {
    description: string;
    estimatedCost: number;
    actualCost?: number;
  }) => Promise<any>;
  deleteLineItem: (itemId: number, quoteId: number) => Promise<void>;
  updateQuote: (quoteId: number, updatedData: Partial<{
    quoteName: string;
    status: string;
    timeToDevelop: string;
    timeToDevelopValue: number;
    timeToDevelopUnit: string;
    variancePercentage: number;
    quoteTotal: number;
    budget: number;
  }>) => Promise<Quote>;
  deleteQuote: (quoteId: number) => Promise<void>;
}

interface QuoteProviderProps {
  children: React.ReactNode;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const useQuotes = () => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuotes must be used within a QuoteProvider');
  }
  return context;
};

export const QuoteProvider: React.FC<QuoteProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  const addQuoteMutation = useMutation({
    mutationFn: async (quoteData: {
      quoteName: string;
      status?: string;
      timeToDevelop?: string;
      timeToDevelopValue?: number;
      timeToDevelopUnit?: string;
      variancePercentage?: number;
      quoteTotal?: number;
      budget?: number;
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
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.quote) {
        return data.quote;
      } else {
        throw new Error(data.error || 'Failed to create quote');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch quotes
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async ({ quoteId, updatedData }: { 
      quoteId: number; 
      updatedData: Partial<{
        quoteName: string;
        status: string;
        timeToDevelop: string;
        timeToDevelopValue: number;
        timeToDevelopUnit: string;
        variancePercentage: number;
        quoteTotal: number;
        budget: number;
      }>
    }) => {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.quote) {
        return data.quote;
      } else {
        throw new Error(data.error || 'Failed to update quote');
      }
    },
    onSuccess: (updatedQuote) => {
      // Update individual quote cache and invalidate quotes list
      queryClient.setQueryData(['quote', updatedQuote.id], updatedQuote);
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: number) => {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete quote: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return data;
      } else {
        throw new Error(data.error || 'Failed to delete quote');
      }
    },
    onSuccess: (_, quoteId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({ queryKey: ['quote', quoteId] });
      queryClient.removeQueries({ queryKey: ['lineItems', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      console.log('Quote deleted successfully');
    },
  });

  const addLineItemMutation = useMutation({
    mutationFn: async ({ quoteId, lineItemData }: {
      quoteId: number;
      lineItemData: {
        description: string;
        estimatedCost: number;
      };
    }) => {
      const response = await fetch(`/api/quotes/${quoteId}/line-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(lineItemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.lineItem) {
        return data.lineItem;
      } else {
        throw new Error(data.error || 'Failed to add line item');
      }
    },
    onSuccess: (_, { quoteId }) => {
      // Invalidate line items for this quote and related data
      queryClient.invalidateQueries({ queryKey: ['lineItems', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const deleteLineItemMutation = useMutation({
    mutationFn: async ({ itemId, quoteId: _ }: { itemId: number; quoteId: number }) => {
      const response = await fetch(`/api/line-items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete line item');
      }
    },
    onSuccess: (_, { quoteId }) => {
      // Invalidate line items for this quote and related data
      queryClient.invalidateQueries({ queryKey: ['lineItems', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const updateLineItemMutation = useMutation({
    mutationFn: async ({ itemId, quoteId: _, lineItemData }: {
      itemId: number;
      quoteId: number;
      lineItemData: {
        description: string;
        estimatedCost: number;
        actualCost?: number;
      };
    }) => {
      const response = await fetch(`/api/line-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(lineItemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.lineItem) {
        return data.lineItem;
      } else {
        throw new Error(data.error || 'Failed to update line item');
      }
    },
    onSuccess: (_, { quoteId }) => {
      // Invalidate line items for this quote and related data
      queryClient.invalidateQueries({ queryKey: ['lineItems', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const addQuote = useCallback(async (quoteData: {
    quoteName: string;
    status?: string;
    timeToDevelop?: string;
    timeToDevelopValue?: number;
    timeToDevelopUnit?: string;
    variancePercentage?: number;
    quoteTotal?: number;
    budget?: number;
  }): Promise<Quote> => {
    return await addQuoteMutation.mutateAsync(quoteData);
  }, [addQuoteMutation]);

  const updateQuote = useCallback(async (quoteId: number, updatedData: Partial<{
    quoteName: string;
    status: string;
    timeToDevelop: string;
    timeToDevelopValue: number;
    timeToDevelopUnit: string;
    variancePercentage: number;
    quoteTotal: number;
    budget: number;
  }>): Promise<Quote> => {
    return await updateQuoteMutation.mutateAsync({ quoteId, updatedData });
  }, [updateQuoteMutation]);

  const deleteQuote = useCallback(async (quoteId: number): Promise<void> => {
    await deleteQuoteMutation.mutateAsync(quoteId);
  }, [deleteQuoteMutation]);

  const addLineItem = useCallback(async (quoteId: number, lineItemData: {
    description: string;
    estimatedCost: number;
  }) => {
    return await addLineItemMutation.mutateAsync({ quoteId, lineItemData });
  }, [addLineItemMutation]);

  const deleteLineItem = useCallback(async (itemId: number, quoteId: number) => {
    await deleteLineItemMutation.mutateAsync({ itemId, quoteId });
  }, [deleteLineItemMutation]);

  const updateLineItem = useCallback(async (itemId: number, quoteId: number, lineItemData: {
    description: string;
    estimatedCost: number;
    actualCost?: number;
  }) => {
    return await updateLineItemMutation.mutateAsync({ itemId, quoteId, lineItemData });
  }, [updateLineItemMutation]);

  const value: QuoteContextType = {
    addQuote,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    updateQuote,
    deleteQuote,
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
    </QuoteContext.Provider>
  );
};