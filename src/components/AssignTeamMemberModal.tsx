import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProject } from '../utils/queries';
import Card from './Card';
import Button from './Button';
import { X, Users, UserPlus, UserMinus } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface ProjectMember {
  id: number;
  name: string;
  email: string;
  role?: string;
  project_role?: string;
}

interface AssignTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onSuccess?: (message: string, type?: 'success' | 'error') => void;
}

const AssignTeamMemberModal: React.FC<AssignTeamMemberModalProps> = ({ 
  isOpen, 
  onClose, 
  projectId, 
  onSuccess 
}) => {
  const queryClient = useQueryClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get current project data to see assigned members
  const { data: projectData } = useProject(projectId);
  const assignedMembers = projectData?.members || [];
  
  // Mutation for assigning a team member
  const assignMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign team member');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch all related data
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      
      // Force refetch project data to ensure UI updates immediately
      queryClient.refetchQueries({ queryKey: ['project', projectId] });
      
      if (onSuccess) {
        const successMessage = data.message || `🎉 Team member assigned successfully!`;
        onSuccess(successMessage);
      }
    },
    onError: (error: Error) => {
      if (onSuccess) {
        onSuccess(error.message || 'Failed to assign team member', 'error');
      }
    }
  });

  // Mutation for removing a team member
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove team member');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch all related data
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      
      // Force refetch project data to ensure UI updates immediately
      queryClient.refetchQueries({ queryKey: ['project', projectId] });
      
      if (onSuccess) {
        const successMessage = data.message || `✅ Team member removed successfully!`;
        onSuccess(successMessage);
      }
    },
    onError: (error: Error) => {
      if (onSuccess) {
        onSuccess(error.message || 'Failed to remove team member', 'error');
      }
    }
  });

  // Fetch all users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Handle assigning a user to the project
  const handleAssignUser = (user: User) => {
    assignMemberMutation.mutate(user.id);
  };

  // Handle removing a user from the project
  const handleRemoveUser = (user: User) => {
    removeMemberMutation.mutate(user.id);
  };

  // Check if a user is already assigned to the project
  const isUserAssigned = (userId: number) => {
    return assignedMembers.some((member: ProjectMember) => member.id === userId);
  };

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div className="min-h-screen flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-4xl my-8">
          <Card variant="glass" className="relative animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Assign Team Member
                  </h2>
                  <p className="text-slate-400">
                    Add team members to collaborate on this project
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="ml-3 text-slate-300">Loading users...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Error Loading Users</h3>
                  <p className="text-slate-400 mb-6">{error}</p>
                  <Button onClick={fetchUsers} variant="primary">
                    Try Again
                  </Button>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Users Available</h3>
                  <p className="text-slate-400">There are no users available to assign to this project.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => {
                    const assigned = isUserAssigned(user.id);
                    return (
                      <div 
                        key={user.id} 
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          assigned 
                            ? 'bg-green-900/20 border-green-700/50 hover:bg-green-900/30' 
                            : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            assigned 
                              ? 'bg-green-500/20' 
                              : 'bg-blue-500/20'
                          }`}>
                            <span className={`font-semibold ${
                              assigned 
                                ? 'text-green-400' 
                                : 'text-blue-400'
                            }`}>
                              {user.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{user.name}</h4>
                            <p className="text-sm text-slate-400">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {user.role && (
                                <span className="inline-block px-2 py-1 text-xs bg-slate-600/50 text-slate-300 rounded">
                                  {user.role}
                                </span>
                              )}
                              {assigned && (
                                <span className="inline-block px-2 py-1 text-xs bg-green-600/50 text-green-300 rounded">
                                  Assigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {assigned ? (
                          <Button
                            onClick={() => handleRemoveUser(user)}
                            variant="outline"
                            size="sm"
                            loading={removeMemberMutation.isPending}
                            disabled={removeMemberMutation.isPending}
                            className="flex items-center gap-2 border-red-600/50 text-red-400 hover:bg-red-600/10"
                          >
                            <UserMinus className="w-4 h-4" />
                            Remove
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleAssignUser(user)}
                            variant="primary"
                            size="sm"
                            loading={assignMemberMutation.isPending}
                            disabled={assignMemberMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Assign
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-6 mt-6 border-t border-slate-700/50">
              <Button
                onClick={onClose}
                variant="ghost"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignTeamMemberModal;