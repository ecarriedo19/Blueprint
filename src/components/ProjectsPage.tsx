import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProjects } from '../utils/queries';
import { useProjects as useProjectMutations } from '../contexts/ProjectState';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-lg">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Create New Project
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
              placeholder="Enter project name..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
              placeholder="Describe your project..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
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



const ProjectsPage: React.FC<ProjectsPageProps> = ({ currentUser }) => {
  const { data: projects = [], isLoading: loading, error } = useProjects();
  const { addProject, updateProject, bulkAction } = useProjectMutations();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Handle URL parameter for opening create modal
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
      // Remove the parameter from URL
      setSearchParams(params => {
        params.delete('create');
        return params;
      });
    }
  }, [searchParams, setSearchParams]);

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
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive">{error instanceof Error ? error.message : 'An error occurred'}</p>
        </div>
      )}

      {/* Filter and Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
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
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary bg-background text-foreground"
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
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-foreground font-medium">
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
                variant="destructive"
                onClick={() => setShowBulkDeleteModal(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
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
        <div className="bg-card border border-border rounded-lg">
          {/* Table Header */}
          <div className="bg-muted/30 border-b border-border px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
              {showBulkActions && (
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProjects(filteredProjects.map(p => p.id));
                      } else {
                        setSelectedProjects([]);
                      }
                    }}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              <div className={showBulkActions ? "col-span-4" : "col-span-5"}>
                Project Name
              </div>
              <div className="col-span-2">
                Status
              </div>
              <div className="col-span-2">
                Priority
              </div>
              <div className="col-span-2">
                Created
              </div>
              <div className="col-span-1">
                Actions
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="divide-y divide-border">
            {filteredProjects.map(project => (
              <div key={project.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {showBulkActions && (
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectProject(project.id);
                        }}
                        className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                  <div className={showBulkActions ? "col-span-4" : "col-span-5"}>
                    <Link
                      to={`/projects/${project.id}`}
                      className="block hover:text-primary transition-colors"
                    >
                      <div>
                        <h3 className="font-medium text-foreground mb-1">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                  <div className="col-span-2">
                    <select
                      value={project.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleUpdateProject(project.id, { status: e.target.value });
                      }}
                      className={`px-2 py-1 rounded-full text-xs font-medium border focus:ring-2 focus:ring-primary focus:outline-none ${
                        project.status === 'completed' 
                          ? 'bg-success/10 text-success border-success/20' 
                          : project.status === 'in-progress'
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : project.status === 'planning'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : project.status === 'review'
                          ? 'bg-accent/10 text-accent border-accent/20'
                          : 'bg-muted/10 text-muted-foreground border-border'
                      }`}
                    >
                      <option value="planning">Planning</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <select
                      value={project.priority}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleUpdateProject(project.id, { priority: e.target.value });
                      }}
                      className={`px-2 py-1 rounded-full text-xs font-medium border focus:ring-2 focus:ring-primary focus:outline-none ${
                        project.priority === 'urgent' 
                          ? 'bg-destructive/10 text-destructive border-destructive/20' 
                          : project.priority === 'high'
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : project.priority === 'medium'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-muted/10 text-muted-foreground border-border'
                      }`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
