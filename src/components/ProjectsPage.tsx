import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../utils/queries';
import { useProjects as useProjectMutations } from '../contexts/ProjectState';
import Card from './Card';
import Button from './Button';
import ConfirmationModal from './ConfirmationModal';
import { MoreVertical, Trash2 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface ProjectsPageProps {
  currentUser: User;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: { name: string; description: string; status: string; priority: string }) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
    setFormData({ name: '', description: '', status: 'planning', priority: 'medium' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Create New Project
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="Enter project name..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="Describe your project..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ProjectCardProps {
  project: {
    id: number;
    name: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
  };
  onUpdate: (projectId: number, updates: any) => void;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  showCheckbox?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onUpdate, isSelected = false, onSelect, showCheckbox = false }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'on-hold': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-slate-200 dark:border-slate-700 relative">
      {/* Checkbox for selection */}
      {showCheckbox && onSelect && (
        <div className="absolute top-4 left-4 z-10" onClick={(e) => e.preventDefault()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(project.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded border-slate-600 bg-slate-800/50 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      )}
      <div className={`p-6 ${showCheckbox ? 'pl-12' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {project.name}
          </h3>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status.replace('-', ' ')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </span>
          </div>
        </div>
        
        {project.description && (
          <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
          <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
        </div>
        
        <div className="mt-4 flex gap-2">
          <select
            value={project.status}
            onChange={(e) => onUpdate(project.id, { status: e.target.value })}
            className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="planning">Planning</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
          
          <select
            value={project.priority}
            onChange={(e) => onUpdate(project.id, { priority: e.target.value })}
            className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
    </Card>
  );
};

const ProjectsPage: React.FC<ProjectsPageProps> = ({ currentUser }) => {
  const { data: projects = [], isLoading: loading, error } = useProjects();
  const { addProject, updateProject, bulkAction } = useProjectMutations();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Role-based permission check
  const canModifyProjects = () => {
    const userRole = currentUser?.role || 'Member';
    return userRole === 'Admin' || userRole === 'Member';
  };

  const handleCreateProject = async (projectData: { name: string; description: string; status: string; priority: string }) => {
    try {
      await addProject(projectData);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleUpdateProject = async (projectId: number, updates: any) => {
    try {
      await updateProject(projectId, updates);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleSelectProject = (projectId: number) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      await bulkAction({
        projectIds: selectedProjects,
        action: 'delete'
      });
      setSelectedProjects([]);
      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error('Failed to delete projects:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const statusMatch = filterStatus === 'all' || project.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || project.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error instanceof Error ? error.message : 'An error occurred'}</p>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="planning">Planning</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setShowBulkActions(!showBulkActions)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <MoreVertical className="w-4 h-4" />
            Options
          </Button>
          {canModifyProjects() && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              className="whitespace-nowrap"
            >
              + Create Project
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {showBulkActions && selectedProjects.length > 0 && (
        <Card variant="glass" className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">
              {selectedProjects.length} project{selectedProjects.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setSelectedProjects([])}
                size="sm"
              >
                Clear Selection
              </Button>
              <Button
                variant="danger"
                onClick={() => setShowBulkDeleteModal(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {filterStatus === 'all' && filterPriority === 'all' ? 'No projects yet' : 'No projects match your filters'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {filterStatus === 'all' && filterPriority === 'all' 
              ? 'Create your first project to get started with project management.'
              : 'Try adjusting your filters or create a new project.'
            }
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
          >
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
            >
              <ProjectCard
                project={project}
                onUpdate={handleUpdateProject}
                isSelected={selectedProjects.includes(project.id)}
                onSelect={handleSelectProject}
                showCheckbox={showBulkActions}
              />
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
      />
      
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onCancel={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Projects"
        message={`Are you sure you want to delete ${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''}? This action cannot be undone and will permanently delete all quotes, line items, change orders, and actual costs associated with ${selectedProjects.length > 1 ? 'these projects' : 'this project'}.`}
        confirmText="Yes, Delete All"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ProjectsPage;
