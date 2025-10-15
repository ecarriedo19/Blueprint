import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../utils/queries';
import { useQueryClient, useMutation } from '@tanstack/react-query';

import Button from './Button';
import CreateQuoteModal from './CreateQuoteModal';
import AssignTeamMemberModal from './AssignTeamMemberModal';
import CreateChangeOrderModal from './CreateChangeOrderModal';
import Toast from './Toast';
import ActualsLedger from './ActualsLedger';
import { ActualCostProvider } from '../contexts/ActualCostContext';
import BudgetVsActualsReport from './BudgetVsActualsReport';
import BaselineBudgetControls from './BaselineBudgetControls';
import ConfirmationModal from './ConfirmationModal';
import { useProjects as useProjectMutations } from '../contexts/ProjectState';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp,
  FileText, 
  Users, 
  AlertCircle,
  Briefcase,
  Target,
  Activity,
  Trash2
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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

  // Project mutations
  const { deleteProject } = useProjectMutations();

  // Delete project handler
  const handleDeleteProject = async () => {
    try {
      await deleteProject(projectId!);
      handleToastMessage('Project deleted successfully', 'success');
      setShowDeleteModal(false);
      // Navigate to projects list after a short delay
      setTimeout(() => navigate('/projects'), 500);
    } catch (error) {
      console.error('Failed to delete project:', error);
      handleToastMessage('Failed to delete project', 'error');
      setShowDeleteModal(false);
    }
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
  


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => navigate('/projects')}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {projectData.name}
                </h1>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                  projectData.status.toLowerCase() === 'completed' 
                    ? 'bg-success/10 text-success border-success/20' 
                    : projectData.status.toLowerCase() === 'in-progress'
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : projectData.status.toLowerCase() === 'planning'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted/10 text-muted-foreground border-border'
                }`}>
                  {projectData.status}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                  projectData.priority.toLowerCase() === 'urgent' 
                    ? 'bg-destructive/10 text-destructive border-destructive/20' 
                    : projectData.priority.toLowerCase() === 'high'
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : projectData.priority.toLowerCase() === 'medium'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-muted/10 text-muted-foreground border-border'
                }`}>
                  {projectData.priority} priority
                </span>
              </div>
              {projectData.description && (
                <p className="text-muted-foreground max-w-2xl">
                  {projectData.description}
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Project
          </Button>
        </div>
      </div>

      {/* Project KPI Bar */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border">
          
          {/* Total Budget KPI */}
          <div className="p-4 first:pl-0 last:pr-0">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Budget</p>
                {isEditingBudget ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={budgetValue}
                      onChange={(e) => setBudgetValue(e.target.value)}
                      className="text-xl font-bold bg-transparent border-b border-input text-foreground focus:outline-none focus:border-primary w-32"
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
                      size="xs"
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
                      setIsEditingBudget(true);
                      setBudgetValue(totalBudget.toString());
                    }}
                    className="text-2xl font-bold text-foreground hover:text-primary transition-colors text-left cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
                    title="Click to edit budget"
                  >
                    ${totalBudget.toLocaleString()}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Total Quotes KPI */}
          <div className="p-4 first:pl-0 last:pr-0">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Total Quotes</p>
                <p className="text-2xl font-bold text-foreground">{totalQuotes}</p>
              </div>
            </div>
          </div>

          {/* Quote Value KPI */}
          <div className="p-4 first:pl-0 last:pr-0">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Quote Value</p>
                <p className="text-2xl font-bold text-foreground">
                  ${totalQuoteValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Team Members KPI */}
          <div className="p-4 first:pl-0 last:pr-0">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold text-foreground">{members.length}</p>
              </div>
            </div>
          </div>

          {/* Committed Budget KPI */}
          <div className="p-4 first:pl-0 last:pr-0">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Committed</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(kpis.committed_budget || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Project Content Sections */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quotes Section */}
        <div className="bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                Quotes ({totalQuotes})
              </h3>
            </div>
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
          
          <div className="p-6">
            {quotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No quotes available</p>
                <Button
                  onClick={() => setShowCreateQuoteModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Create Your First Quote
                </Button>
              </div>
            ) : (
              <div className="space-y-0">
                {quotes.map((quote, index) => (
                  <div 
                    key={quote.id} 
                    className={`flex items-center justify-between py-4 cursor-pointer hover:bg-muted/50 transition-colors px-3 rounded ${
                      index !== quotes.length - 1 ? 'border-b border-border' : ''
                    }`}
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                    title="Click to view quote details"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-foreground truncate">{quote.quoteName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(quote.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3 ml-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          ${(quote.quoteTotal || 0).toLocaleString()}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${
                          quote.status.toLowerCase() === 'approved' 
                            ? 'bg-success/10 text-success border-success/20' 
                            : quote.status.toLowerCase() === 'pending'
                            ? 'bg-warning/10 text-warning border-warning/20'
                            : quote.status.toLowerCase() === 'draft'
                            ? 'bg-muted/10 text-muted-foreground border-border'
                            : 'bg-muted/10 text-muted-foreground border-border'
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Members Section */}
        <div className="bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                Team Members ({members.length})
              </h3>
            </div>
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
          
          <div className="p-6">
            {members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No team members assigned to this project</p>
                <Button
                  onClick={() => setShowAssignTeamMemberModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Assign Team Member
                </Button>
              </div>
            ) : (
              <div className="space-y-0">
                {members.map((member, index) => (
                  <div 
                    key={member.id} 
                    className={`flex items-center justify-between py-4 px-3 hover:bg-muted/50 transition-colors rounded ${
                      index !== members.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold">
                          {member.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-foreground truncate">{member.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium ml-4 flex-shrink-0">
                      {member.role || 'Member'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Change Orders Section */}
        <div className="bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                Change Orders ({changeOrders.length})
              </h3>
            </div>
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
          
          <div className="p-6">
            {changeOrders.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No change orders created yet</p>
                <Button
                  onClick={() => setShowCreateChangeOrderModal(true)}
                  variant="outline"
                  size="sm"
                >
                  Create Change Order
                </Button>
              </div>
            ) : (
              <div className="space-y-0">
                {changeOrders.map((changeOrder, index) => (
                  <div 
                    key={changeOrder.id} 
                    className={`flex items-center justify-between py-4 cursor-pointer hover:bg-muted/50 transition-colors px-3 rounded ${
                      index !== changeOrders.length - 1 ? 'border-b border-border' : ''
                    }`}
                    onClick={() => {
                      // Try multiple possible quote ID properties
                      const quoteId = changeOrder.quote_id || changeOrder.quoteId || changeOrder.id;
                      
                      if (quoteId) {
                        navigate(`/quotes/${quoteId}`);
                      } else {
                        // As fallback, navigate to quotes list
                        navigate('/quotes');
                      }
                    }}
                    title="Click to view associated quote"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-foreground truncate">{changeOrder.description}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        Quote: {changeOrder.quoteName}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3 ml-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          ${changeOrder.amount.toLocaleString()}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${
                          changeOrder.status.toLowerCase() === 'approved' 
                            ? 'bg-success/10 text-success border-success/20' 
                            : changeOrder.status.toLowerCase() === 'pending'
                            ? 'bg-warning/10 text-warning border-warning/20'
                            : changeOrder.status.toLowerCase() === 'rejected'
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-muted/10 text-muted-foreground border-border'
                        }`}>
                          {changeOrder.status}
                        </span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>



        {/* Project Summary */}
        <div className="bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                Project Summary
              </h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-foreground">
                  {new Date(projectData.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium text-foreground">
                  {new Date(projectData.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-muted-foreground">Completed Quotes</span>
                <span className="font-medium text-foreground">
                  {completedQuotes} / {totalQuotes}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">Pending Change Orders</span>
                <span className="font-medium text-foreground">
                  {pendingChangeOrders}
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Additional Components Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Baseline Budget Controls */}
          {projectData.budgetSummary && (
            <BaselineBudgetControls
              projectId={projectId!}
              budgetSummary={projectData.budgetSummary}
              onSuccess={handleToastMessage}
            />
          )}

          {/* Budget vs Actuals Report */}
          {projectData.budgetVsActuals && projectData.budgetSummary && (
            <BudgetVsActualsReport
              budgetVsActuals={projectData.budgetVsActuals}
              budgetSummary={projectData.budgetSummary}
            />
          )}

          {/* Actual Costs Ledger */}
          <ActualCostProvider>
            <ActualsLedger 
              projectId={projectId!}
              onSuccess={handleToastMessage}
            />
          </ActualCostProvider>
        </div>
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
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectData?.name}"? This action cannot be undone and will permanently delete all quotes, line items, change orders, and actual costs associated with this project.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
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