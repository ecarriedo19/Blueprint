import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Quote {
  id: number;
  quoteName: string;
  status: string;
  timeToDevelop: string;
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
    variancePercentage?: number;
    quoteTotal?: number;
    budget?: number;
  }) => Promise<Quote>;
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
      const response = await fetch('http://localhost:4000/api/quotes', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, don't treat as error
          setQuotes([]);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch quotes: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setQuotes(data.quotes || []);
      } else {
        throw new Error(data.error || 'Failed to fetch quotes');
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addQuote = useCallback(async (quoteData: {
    quoteName: string;
    status?: string;
    timeToDevelop?: string;
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
    refreshQuotes,
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
    </QuoteContext.Provider>
  );
};