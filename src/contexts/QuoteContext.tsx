import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

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
  quotes: Quote[];
  loading: boolean;
  error: string | null;
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
  refreshQuotes: () => Promise<void>;
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
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching quotes from:', 'http://localhost:4000/api/quotes');
      const response = await fetch('http://localhost:4000/api/quotes', {
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, don't treat as error
          console.log('User not authenticated, clearing quotes');
          setQuotes([]);
          setLoading(false);
          return;
        }
        const errorText = await response.text();
        console.error('Server response error:', errorText);
        throw new Error(`Server error (${response.status}): ${errorText || 'Unknown server error'}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setQuotes(data.quotes || []);
      } else {
        throw new Error(data.error || 'Failed to fetch quotes');
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error occurred';
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 4000.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/quotes', {
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
        // Add the new quote to the current list
        setQuotes(prevQuotes => [data.quote, ...prevQuotes]);
        return data.quote;
      } else {
        throw new Error(data.error || 'Failed to create quote');
      }
    } catch (err) {
      console.error('Error adding quote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

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
    setError(null);

    try {
      const response = await fetch(`http://localhost:4000/api/quotes/${quoteId}`, {
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
        // Update the quote in the current list
        setQuotes(prevQuotes => 
          prevQuotes.map(quote => 
            quote.id === quoteId ? data.quote : quote
          )
        );
        return data.quote;
      } else {
        throw new Error(data.error || 'Failed to update quote');
      }
    } catch (err) {
      console.error('Error updating quote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteQuote = useCallback(async (quoteId: number): Promise<void> => {
    setError(null);

    try {
      const response = await fetch(`http://localhost:4000/api/quotes/${quoteId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Remove the quote from the current list
        setQuotes(prevQuotes => 
          prevQuotes.filter(quote => quote.id !== quoteId)
        );
      } else {
        throw new Error(data.error || 'Failed to delete quote');
      }
    } catch (err) {
      console.error('Error deleting quote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const refreshQuotes = useCallback(async () => {
    await fetchQuotes();
  }, [fetchQuotes]);

  // Fetch quotes when the component mounts
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const value: QuoteContextType = {
    quotes,
    loading,
    error,
    addQuote,
    updateQuote,
    deleteQuote,
    refreshQuotes,
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
    </QuoteContext.Provider>
  );
};