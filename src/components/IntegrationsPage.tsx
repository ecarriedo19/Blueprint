import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Card from './Card';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
        type={toast.type}
      />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Integrations
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Connect Blueprint with your favorite tools to streamline your workflow
        </p>
      </div>

      {statusError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">
              Failed to load integration status. Please refresh the page.
            </p>
          </div>
        </div>
      )}

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* QuickBooks Integration */}
        <Card className="p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  QuickBooks
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Accounting & Finance
                </p>
              </div>
            </div>
            
            {statusLoading ? (
              <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-blue-600 rounded-full animate-spin" />
            ) : isQuickBooksConnected ? (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            ) : quickbooksStatus?.expired ? (
              <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Expired</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-400">
                <LinkIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Not Connected</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
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
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Company ID: {quickbooksStatus.realmId}
              </p>
            </div>
          )}
        </Card>

        {/* Coming Soon - Other Integrations */}
        <Card className="p-6 border border-slate-200 dark:border-slate-700 opacity-60">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Xero
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Accounting & Finance
                </p>
              </div>
            </div>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
              Coming Soon
            </span>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Connect with Xero for comprehensive financial data synchronization.
          </p>
          
          <Button variant="ghost" fullWidth disabled>
            Coming Soon
          </Button>
        </Card>

        <Card className="p-6 border border-slate-200 dark:border-slate-700 opacity-60">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Procore
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Construction Management
                </p>
              </div>
            </div>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
              Coming Soon
            </span>
          </div>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Integrate with Procore for project management and document sharing.
          </p>
          
          <Button variant="ghost" fullWidth disabled>
            Coming Soon
          </Button>
        </Card>
      </div>

      {/* Integration Benefits */}
      <Card className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Why Connect Your Tools?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                Eliminate Manual Entry
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Automatically sync data between your tools to save time and reduce errors.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                Real-time Insights
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Get up-to-date financial and project data for better decision making.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                Better Budget Control
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Compare actual expenses against project budgets in real-time.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default IntegrationsPage;
