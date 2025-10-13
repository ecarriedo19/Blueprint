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

export interface BudgetVsActualsItem {
  costCodeId: number;
  code: string;
  description: string;
  division: string | null;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  status: 'under_budget' | 'on_budget' | 'over_budget';
  lineItemCount: number;
  expenseCount: number;
}

export interface BudgetSummary {
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  variancePercent: number;
  baselineFrozen: boolean;
  budgetHealth: 'healthy' | 'warning' | 'critical';
  baseline: {
    id: number;
    frozen_at: string;
    frozen_by: number;
    notes: string | null;
  } | null;
}

export interface ProjectDetails extends Project {
  quotes: any[];
  members: any[];
  changeOrders: any[];
  budgetVsActuals?: BudgetVsActualsItem[];
  budgetSummary?: BudgetSummary;
}

export const useProject = (projectId: string | number | undefined) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async (): Promise<ProjectDetails> => {
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found');
        }
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return {
          ...data.project,
          quotes: data.quotes || [],
          members: data.members || [],
          changeOrders: data.changeOrders || [],
          kpis: data.kpis || {}, // Include KPI data from server response
          budgetVsActuals: data.budgetVsActuals || [],
          budgetSummary: data.budgetSummary || null
        };
      } else {
        throw new Error(data.error || 'Failed to fetch project');
      }
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes (shorter cache for detailed view)
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

// Subscription Details Query
export const useSubscriptionDetails = () => {
  const { data: currentUser } = useCurrentUser();
  
  return useQuery({
    queryKey: ['subscription-details'],
    queryFn: async (): Promise<{
      subscription: any;
      planName: string;
    }> => {
      const response = await fetch('/api/subscription-details', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return {
          subscription: data.subscription,
          planName: data.planName
        };
      } else {
        throw new Error(data.error || 'Failed to fetch subscription details');
      }
    },
    enabled: !!currentUser && currentUser.subscriptionStatus !== 'free',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// ===== COST CODES QUERIES (Budget vs Actuals Feature) =====

export interface CostCode {
  id: number;
  code: string;
  description: string;
  division: string | null;
  is_template: boolean;
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

// Fetch all cost codes (user's custom + CSI templates)
export const useCostCodes = (options?: { division?: string; search?: string; includeTemplates?: boolean }) => {
  return useQuery({
    queryKey: ['cost-codes', options?.division, options?.search, options?.includeTemplates],
    queryFn: async (): Promise<CostCode[]> => {
      const params = new URLSearchParams();
      if (options?.division) params.append('division', options.division);
      if (options?.search) params.append('search', options.search);
      if (options?.includeTemplates !== undefined) {
        params.append('includeTemplates', String(options.includeTemplates));
      }

      const response = await fetch(`/api/cost-codes?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return data.data || [];
      } else {
        throw new Error(data.error || 'Failed to fetch cost codes');
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Fetch CSI MasterFormat templates only
export const useCostCodeTemplates = () => {
  return useQuery({
    queryKey: ['cost-code-templates'],
    queryFn: async (): Promise<{
      templates: CostCode[];
      groupedByDivision: Record<string, CostCode[]>;
    }> => {
      const response = await fetch('/api/cost-codes/templates', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to fetch CSI templates');
      }
    },
    staleTime: Infinity, // Templates don't change
  });
};

// ===== ACTUAL COSTS QUERIES (Budget vs Actuals Feature - Phase 2) =====

export interface ActualCost {
  id: number;
  project_id: number;
  cost_code_id: number;
  amount: number;
  date: string;
  description: string | null;
  vendor_id: number | null;
  receipt_url: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  cost_code: string;
  cost_code_description: string;
  cost_code_division: string | null;
  vendor_name: string | null;
  created_by_email: string;
}

// Fetch all actual costs for a project
export const useProjectActuals = (projectId: number | undefined) => {
  return useQuery({
    queryKey: ['project-actuals', projectId],
    queryFn: async (): Promise<ActualCost[]> => {
      if (!projectId) throw new Error('Project ID is required');

      const response = await fetch(`/api/projects/${projectId}/actuals`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }

      const data = await response.json();
      if (data.success) {
        return data.data || [];
      } else {
        throw new Error(data.error || 'Failed to fetch actual costs');
      }
    },
    enabled: !!projectId, // Only run query if projectId exists
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};