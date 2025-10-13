import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../utils/queries';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import Card from './Card';
import Button from './Button';
import CreateQuoteModal from './CreateQuoteModal';
import AssignTeamMemberModal from './AssignTeamMemberModal';
import CreateChangeOrderModal from './CreateChangeOrderModal';
import Toast from './Toast';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp,
  FileText, 
  Users, 
  AlertCircle,
  Briefcase,
  Target,
  Activity
} from 'lucide-react';

const ViewProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Use React Query hook for data fetching
  const projectId = id ? parseInt(id, 10) : undefined;
  const { data: projectData, isLoading, error } = useProject(projectId);
  

  
  // State for editing total budget
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState<string>('');
  
  // Modal states
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);
  const [showAssignTeamMemberModal, setShowAssignTeamMemberModal] = useState(false);
  const [showCreateChangeOrderModal, setShowCreateChangeOrderModal] = useState(false);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  // Toast handler
  const handleToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };
  
  // Mutation for updating project total budget
  const updateBudgetMutation = useMutation({
    mutationFn: async (newBudget: number) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ total_budget: newBudget }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update budget');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refresh project data to show updated budget and KPIs
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setIsEditingBudget(false);
    },
    onError: (error) => {
      console.error('Failed to update budget:', error);
    }
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            </div>
          </div>
          
          {/* KPI Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
          
          {/* Content sections skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/projects')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Failed to Load Project
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
            {error instanceof Error ? error.message : 'An error occurred while loading the project details.'}
          </p>
          <Button
            onClick={() => navigate('/projects')}
            variant="primary"
          >
            Return to Projects
          </Button>
        </div>
      </div>
    );
  }

  // Handle case where project is not found
  if (!projectData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/projects')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            Project Not Found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button
            onClick={() => navigate('/projects')}
            variant="primary"
          >
            Return to Projects
          </Button>
        </div>
      </div>
    );
  }

  const { quotes = [], members = [], changeOrders = [] } = projectData;
  const kpis = (projectData as any).kpis || {}; // Project-specific KPIs from enhanced API
  
  // Use project-specific KPIs from the API response (calculated server-side)
  const totalQuotes = kpis.total_quotes || 0;
  const totalQuoteValue = kpis.quote_value || 0;
  const completedQuotes = kpis.completed_quotes || 0;
  const pendingChangeOrders = kpis.pending_change_orders || 0;
  const totalBudget = kpis.total_budget || (projectData as any).total_budget || 0;
  
  // Get status styling
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'on-hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/projects')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {projectData.name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(projectData.status)}`}>
                {projectData.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(projectData.priority)}`}>
                {projectData.priority} priority
              </span>
            </div>
            {projectData.description && (
              <p className="text-slate-600 dark:text-slate-400">
                {projectData.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Budget</p>
              {isEditingBudget ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                    className="text-xl font-bold bg-transparent border-b border-slate-400 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 w-32"
                    placeholder="0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const newBudget = parseFloat(budgetValue) || 0;
                        updateBudgetMutation.mutate(newBudget);
                      } else if (e.key === 'Escape') {
                        setIsEditingBudget(false);
                        setBudgetValue(totalBudget.toString());
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const newBudget = parseFloat(budgetValue) || 0;
                      updateBudgetMutation.mutate(newBudget);
                    }}
                    loading={updateBudgetMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    console.log('Budget button clicked, totalBudget:', totalBudget);
                    setIsEditingBudget(true);
                    setBudgetValue(totalBudget.toString());
                  }}
                  className="text-2xl font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded"
                  title="Click to edit budget"
                >
                  ${totalBudget.toLocaleString()}
                </button>
              )}
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Quotes</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalQuotes}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Linked to this project
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Proposed Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${totalQuoteValue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total value of linked quotes
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Team Members</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{members.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Active team members
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        {/* Committed Budget KPI Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Committed Budget</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${(kpis.committed_budget || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Value of approved quotes
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quotes Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quotes ({totalQuotes})
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateQuoteModal(true)}
                variant="primary"
                size="sm"
              >
                + Add New Quote
              </Button>
              <Button
                onClick={() => navigate('/quotes')}
                variant="outline"
                size="sm"
              >
                View All
              </Button>
            </div>
          </div>
          
          {quotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No quotes available</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
              <div className="space-y-4 pr-2">
                {quotes.map((quote) => (
                  <div 
                    key={quote.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                    title="Click to view quote details"
                  >
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{quote.quoteName}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ${(quote.quoteTotal || 0).toLocaleString()}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {quotes.length > 4 && (
                <div className="text-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing all {quotes.length} quotes
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Team Members Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members ({members.length})
            </h3>
            {members.length > 0 && (
              <Button
                onClick={() => setShowAssignTeamMemberModal(true)}
                variant="outline"
                size="sm"
              >
                + Assign Member
              </Button>
            )}
          </div>
          
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">No team members assigned</p>
              <Button
                onClick={() => setShowAssignTeamMemberModal(true)}
                variant="outline"
                size="sm"
              >
                Assign Team Member
              </Button>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
              <div className="space-y-4 pr-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {member.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">{member.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                      {member.role || 'Member'}
                    </span>
                  </div>
                ))}
              </div>
              {members.length > 4 && (
                <div className="text-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing all {members.length} team members
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Change Orders Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Change Orders ({changeOrders.length})
            </h3>
            {changeOrders.length > 0 && (
              <Button
                onClick={() => setShowCreateChangeOrderModal(true)}
                variant="outline"
                size="sm"
              >
                + Create Change Order
              </Button>
            )}
          </div>
          
          {changeOrders.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 mb-4">No change orders yet</p>
              <Button
                onClick={() => setShowCreateChangeOrderModal(true)}
                variant="outline"
                size="sm"
              >
                Create Change Order
              </Button>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
              <div className="space-y-4 pr-2">
                {changeOrders.map((changeOrder) => (
                  <div 
                    key={changeOrder.id} 
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => {
                      console.log('🔍 Change order clicked. Full object:', JSON.stringify(changeOrder, null, 2));
                      console.log('🔍 Available properties:', Object.keys(changeOrder));
                      console.log('🔍 quote_id:', changeOrder.quote_id);
                      console.log('🔍 quoteId:', changeOrder.quoteId);
                      console.log('🔍 quoteName:', changeOrder.quoteName);
                      
                      // Try multiple possible quote ID properties
                      const quoteId = changeOrder.quote_id || changeOrder.quoteId || changeOrder.id;
                      
                      if (quoteId) {
                        console.log('✅ Attempting navigation to quote ID:', quoteId);
                        try {
                          navigate(`/quotes/${quoteId}`);
                          console.log('✅ Navigation called successfully');
                        } catch (error) {
                          console.error('❌ Navigation error:', error);
                        }
                      } else {
                        console.log('❌ No quote ID found. Available keys:', Object.keys(changeOrder));
                        // As fallback, navigate to quotes list
                        console.log('🔄 Fallback: navigating to quotes list');
                        navigate('/quotes');
                      }
                    }}
                    title="Click to view associated quote"
                  >
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">{changeOrder.description}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Quote: {changeOrder.quoteName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ${changeOrder.amount.toLocaleString()}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(changeOrder.status)}`}>
                        {changeOrder.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {changeOrders.length > 4 && (
                <div className="text-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing all {changeOrders.length} change orders
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Project Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Project Summary
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Created</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {new Date(projectData.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Last Updated</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {new Date(projectData.updated_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Completed Quotes</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {completedQuotes} / {totalQuotes}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600 dark:text-slate-400">Pending Change Orders</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {pendingChangeOrders}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <CreateQuoteModal 
        isOpen={showCreateQuoteModal}
        onClose={() => setShowCreateQuoteModal(false)}
        projectId={projectId!}
        onSuccess={handleToastMessage}
      />
      
      <AssignTeamMemberModal 
        isOpen={showAssignTeamMemberModal}
        onClose={() => setShowAssignTeamMemberModal(false)}
        projectId={projectId!}
        onSuccess={handleToastMessage}
      />
      
      <CreateChangeOrderModal 
        isOpen={showCreateChangeOrderModal}
        onClose={() => setShowCreateChangeOrderModal(false)}
        projectId={projectId!}
        onSuccess={handleToastMessage}
      />

      {/* Toast */}
      <Toast 
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default ViewProjectPage;