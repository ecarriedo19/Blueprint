import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../utils/queries';
import Card from './Card';
import Button from './Button';
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
  
  // Use React Query hook for data fetching
  const projectId = id ? parseInt(id, 10) : undefined;
  const { data: projectData, isLoading, error } = useProject(projectId);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
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
  
  // Calculate project metrics
  const totalQuotes = quotes.length;
  const totalQuoteValue = quotes.reduce((sum, quote) => sum + (quote.quoteTotal || 0), 0);
  const completedQuotes = quotes.filter(quote => quote.status === 'Completed').length;
  const pendingChangeOrders = changeOrders.filter(co => co.status === 'pending').length;
  
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Budget</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${projectData.budget ? projectData.budget.toLocaleString() : '0'}
              </p>
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
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Quote Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${totalQuoteValue.toLocaleString()}
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
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
            <Button
              onClick={() => navigate('/quotes')}
              variant="outline"
              size="sm"
            >
              View All Quotes
            </Button>
          </div>
          
          {quotes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No quotes available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.slice(0, 5).map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
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
              {quotes.length > 5 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  And {quotes.length - 5} more quotes...
                </p>
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
          </div>
          
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No team members assigned</p>
            </div>
          ) : (
            <div className="space-y-4">
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
          )}
        </Card>

        {/* Change Orders Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Change Orders ({changeOrders.length})
            </h3>
          </div>
          
          {changeOrders.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No change orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {changeOrders.slice(0, 5).map((changeOrder) => (
                <div key={changeOrder.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
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
    </div>
  );
};

export default ViewProjectPage;