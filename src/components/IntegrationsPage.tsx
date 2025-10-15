import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from './Button';
import Toast from './Toast';
import { 
  Link as LinkIcon, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  DollarSign,
  Download,
  Unlink
} from 'lucide-react';

interface IntegrationStatus {
  quickbooks: {
    connected: boolean;
    realmId: string | null;
    expired: boolean;
  };
}

interface SyncResponse {
  success: boolean;
  data: {
    expenses: Array<{
      id: string;
      date: string;
      amount: number;
      description: string;
      vendor: string;
      account: string;
      source: string;
    }>;
    syncedAt: string;
    source: string;
  };
}

const IntegrationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; isVisible: boolean; type: 'success' | 'error' }>({ 
    message: '', 
    isVisible: false, 
    type: 'success' 
  });

  // Check URL params for OAuth callback results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'connected') {
      showToast('QuickBooks connected successfully!', 'success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Invalidate integration status to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['integrations-status'] });
    } else if (error) {
      const errorMessages: { [key: string]: string } = {
        oauth_denied: 'QuickBooks connection was cancelled',
        invalid_callback: 'Invalid callback from QuickBooks',
        invalid_state: 'Security validation failed',
        session_expired: 'Session expired, please try again',
        token_exchange_failed: 'Failed to complete QuickBooks connection',
        storage_failed: 'Failed to save QuickBooks credentials'
      };
      showToast(errorMessages[error] || 'Failed to connect to QuickBooks', 'error');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient]);

  // Listen for OAuth popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'quickbooks_oauth_success') {
        showToast('QuickBooks connected successfully!', 'success');
        queryClient.invalidateQueries({ queryKey: ['integrations-status'] });
      } else if (event.data.type === 'quickbooks_oauth_error') {
        const errorMessages: { [key: string]: string } = {
          oauth_denied: 'QuickBooks connection was cancelled',
          invalid_callback: 'Invalid callback from QuickBooks',
          invalid_state: 'Security validation failed',
          session_expired: 'Session expired, please try again',
          token_exchange_failed: 'Failed to complete QuickBooks connection',
          storage_failed: 'Failed to save QuickBooks credentials'
        };
        showToast(errorMessages[event.data.message] || 'Failed to connect to QuickBooks', 'error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, isVisible: true, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Fetch integration status
  const { data: integrationStatus, isLoading: statusLoading, error: statusError } = useQuery<IntegrationStatus>({
    queryKey: ['integrations-status'],
    queryFn: async () => {
      const response = await fetch('/api/integrations/status', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch integration status');
      }
      
      const data = await response.json();
      return data.integrations;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // QuickBooks sync mutation
  const syncQuickBooksMutation = useMutation<SyncResponse>({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/quickbooks/sync', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync QuickBooks data');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      showToast(`Successfully synced ${data.data.expenses.length} expenses from QuickBooks!`, 'success');
      // Optionally invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (error) => {
      showToast(error.message || 'Failed to sync QuickBooks data', 'error');
    }
  });

  // QuickBooks disconnect mutation
  const disconnectQuickBooksMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/integrations/quickbooks/disconnect', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disconnect QuickBooks');
      }
      
      return response.json();
    },
    onSuccess: () => {
      showToast('QuickBooks disconnected successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['integrations-status'] });
    },
    onError: (error) => {
      showToast(error.message || 'Failed to disconnect QuickBooks', 'error');
    }
  });

  const handleQuickBooksConnect = () => {
    // Open OAuth endpoint in new tab
    const oauthWindow = window.open(
      '/api/integrations/quickbooks/connect',
      'quickbooks-oauth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );
    
    // Focus the popup window
    if (oauthWindow) {
      oauthWindow.focus();
    }
  };

  const handleQuickBooksSync = () => {
    syncQuickBooksMutation.mutate();
  };

  const handleQuickBooksDisconnect = () => {
    if (confirm('Are you sure you want to disconnect QuickBooks? You can reconnect at any time.')) {
      disconnectQuickBooksMutation.mutate();
    }
  };

  const quickbooksStatus = integrationStatus?.quickbooks;
  const isQuickBooksConnected = quickbooksStatus?.connected && !quickbooksStatus?.expired;

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
        type={toast.type}
      />
      
      {/* Header */}
      <div>
      </div>

      {statusError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-destructive">
              Failed to load integration status. Please refresh the page.
            </p>
          </div>
        </div>
      )}

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* QuickBooks Integration */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  QuickBooks
                </h3>
                <p className="text-sm text-muted-foreground">
                  Accounting & Finance
                </p>
              </div>
            </div>
            
            {statusLoading ? (
              <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
            ) : isQuickBooksConnected ? (
              <div className="flex items-center gap-1 text-success">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            ) : quickbooksStatus?.expired ? (
              <div className="flex items-center gap-1 text-warning">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Expired</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <LinkIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Not Connected</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Sync your expense data from QuickBooks to compare against project budgets and eliminate manual data entry.
          </p>
          
          <div className="space-y-3">
            {isQuickBooksConnected ? (
              <>
                <Button
                  onClick={handleQuickBooksSync}
                  variant="primary"
                  fullWidth
                  loading={syncQuickBooksMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Sync Data
                </Button>
                
                <Button
                  onClick={handleQuickBooksDisconnect}
                  variant="outline"
                  fullWidth
                  loading={disconnectQuickBooksMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Unlink className="w-4 h-4" />
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={handleQuickBooksConnect}
                variant="primary"
                fullWidth
                className="flex items-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                Connect to QuickBooks
              </Button>
            )}
          </div>
          
          {quickbooksStatus?.realmId && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Company ID: {quickbooksStatus.realmId}
              </p>
            </div>
          )}
        </div>

        {/* Coming Soon - Other Integrations */}
        <div className="bg-card border border-border rounded-lg p-6 opacity-60">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted/30 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Xero
                </h3>
                <p className="text-sm text-muted-foreground">
                  Accounting & Finance
                </p>
              </div>
            </div>
            <span className="px-2 py-1 bg-muted/30 text-muted-foreground rounded-full text-xs font-medium">
              Coming Soon
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Connect with Xero for comprehensive financial data synchronization.
          </p>
          
          <Button variant="ghost" fullWidth disabled>
            Coming Soon
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 opacity-60">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted/30 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Procore
                </h3>
                <p className="text-sm text-muted-foreground">
                  Construction Management
                </p>
              </div>
            </div>
            <span className="px-2 py-1 bg-muted/30 text-muted-foreground rounded-full text-xs font-medium">
              Coming Soon
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Integrate with Procore for project management and document sharing.
          </p>
          
          <Button variant="ghost" fullWidth disabled>
            Coming Soon
          </Button>
        </div>
      </div>

      {/* Integration Benefits */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Why Connect Your Tools?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">
                Eliminate Manual Entry
              </h4>
              <p className="text-sm text-muted-foreground">
                Automatically sync data between your tools to save time and reduce errors.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-success" />
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">
                Real-time Insights
              </h4>
              <p className="text-sm text-muted-foreground">
                Get up-to-date financial and project data for better decision making.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">
                Better Budget Control
              </h4>
              <p className="text-sm text-muted-foreground">
                Compare actual expenses against project budgets in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
