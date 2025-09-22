// Query functions for TanStack Query
import { useQuery } from '@tanstack/react-query';
import { checkRedirectResult } from './googleAuth';
import type { Project } from '../contexts/ProjectState';
import type { Quote } from '../contexts/QuoteContext';

// Projects queries
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const response = await fetch('/api/projects', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return data.projects || [];
      } else {
        throw new Error(data.error || 'Failed to fetch projects');
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProject = (projectId: number) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<Project> => {
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return data.project;
      } else {
        throw new Error(data.error || 'Failed to fetch project');
      }
    },
    enabled: !!projectId,
  });
};

// Quotes queries
export const useQuotes = () => {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: async (): Promise<Quote[]> => {
      const response = await fetch('/api/quotes', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText || 'Unknown server error'}`);
      }

      const data = await response.json();
      if (data.success) {
        return data.quotes || [];
      } else {
        throw new Error(data.error || 'Failed to fetch quotes');
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useQuote = (quoteId: number) => {
  return useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async (): Promise<Quote> => {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return data.quote;
      } else {
        throw new Error(data.error || 'Failed to fetch quote');
      }
    },
    enabled: !!quoteId,
  });
};

// Line items queries
export interface LineItem {
  id: number;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  quoteId: number;
  userId: number;
  created_at: string;
  updated_at: string;
}

export const useLineItems = (quoteId: number) => {
  return useQuery({
    queryKey: ['lineItems', quoteId],
    queryFn: async (): Promise<LineItem[]> => {
      const response = await fetch(`/api/quotes/${quoteId}/line-items`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return data.lineItems || [];
      } else {
        throw new Error(data.error || 'Failed to fetch line items');
      }
    },
    enabled: !!quoteId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Dashboard summary query
export interface DashboardSummary {
  kpis: {
    totalRevenue: number;
    totalBudget: number;
    profitMargin: number;
    growthRate: number;
    totalProjects: number;
    activeProjects: number;
  };
  statusBreakdown: { [key: string]: number };
  cashFlowData: Array<{
    month: string;
    revenue: number;
  }>;
}

export const useDashboardSummary = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async (): Promise<DashboardSummary> => {
      const response = await fetch('/api/dashboard-summary', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch dashboard summary');
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled, // Only run query when enabled
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      // First check for redirect result from Google OAuth
      const redirectUser = await checkRedirectResult();
      if (redirectUser) {
        console.log('Processing redirect result:', redirectUser);
        // Handle the redirect result by calling our backend
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(redirectUser),
          credentials: 'include'
        });

        if (response.ok) {
          const responseData = await response.json();
          return responseData.user;
        }
      }

      // If no redirect result, check for existing session
      const response = await fetch('/api/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        return userData;
      }
      
      // Return null if no user is authenticated
      return null;
    },
    retry: false, // Don't retry auth checks
  });
};

// Notification Queries
export const useNotificationsList = () => {
  const { data: currentUser } = useCurrentUser();
  
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        return data.data || [];
      } else {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
    },
    enabled: !!currentUser,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Team Management Queries
export const useTeamMembers = () => {
  const { data: currentUser } = useCurrentUser();
  
  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const response = await fetch('http://localhost:4000/api/team/members', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        return data.data || [];
      } else {
        throw new Error(data.error || 'Failed to fetch team members');
      }
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};