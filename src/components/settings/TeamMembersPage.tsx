import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users2, UserPlus, AlertCircle, CheckCircle, ArrowLeft, X } from 'lucide-react';
import Button from '../Button';
import ProjectAccessModal from '../ProjectAccessModal';
import { useTeamMembers } from '../../utils/queries';
import { useTeamMutations } from '../../contexts/TeamMutations';
import { useApp } from '../../contexts/AppContext';

const TeamMembersPage = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProjectAccessModalOpen, setIsProjectAccessModalOpen] = useState(false);
  const [selectedUserForProjects, setSelectedUserForProjects] = useState(null);
  const { showConfirmationModal } = useApp();

  // Use React Query for data fetching
  const { data: teamMembers = [], isLoading: loading, error: queryError } = useTeamMembers();
  
  // Use React Query mutations
  const { inviteTeamMember, updateMemberRole, removeMember } = useTeamMutations();

  // Auto-dismiss notifications after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Send invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError('');
    setSuccess('');

    try {
      await inviteTeamMember(inviteEmail.trim(), inviteRole);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('Member');
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  // Update user role
  const handleRoleChange = async (userId: number, newRole: string, userName: string) => {
    try {
      await updateMemberRole(userId, newRole);
      setSuccess(`${userName}'s role updated to ${newRole}`);
      setError('');
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err.message || 'Failed to update role. Please try again.');
      setSuccess('');
    }
  };

  // Delete user
  const handleDeleteUser = (userId: number, userName: string) => {
    showConfirmationModal({
      title: 'Remove Team Member',
      message: `Are you sure you want to remove ${userName} from the team? This action cannot be undone and they will lose access to all projects and data.`,
      confirmText: 'Remove Member',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await removeMember(userId);
          setSuccess(`${userName} has been removed from the team`);
          setError('');
        } catch (err: any) {
          console.error('Error removing member:', err);
          setError(err.message || 'Failed to remove member. Please try again.');
          setSuccess('');
        }
      }
    });
  };

  // Handle project access modal
  const handleManageProjectAccess = (user: any) => {
    setSelectedUserForProjects(user);
    setIsProjectAccessModalOpen(true);
  };

  const handleCloseProjectAccessModal = () => {
    setIsProjectAccessModalOpen(false);
    setSelectedUserForProjects(null);
  };

  const handleProjectAccessSuccess = (message: string, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          to="/settings" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Settings</span>
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
      </div>

      {/* Status Messages */}
      {(error || queryError) && (
        <div className="p-4 bg-card border border-destructive/20 rounded-lg shadow-sm flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-foreground font-medium">Error</p>
            <p className="text-muted-foreground text-sm">
              {error || (queryError as any)?.message || 'An error occurred'}
            </p>
          </div>
          <button 
            onClick={() => setError('')}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-card border border-success/20 rounded-lg shadow-sm flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-foreground font-medium">Success</p>
            <p className="text-muted-foreground text-sm">{success}</p>
          </div>
          <button 
            onClick={() => setSuccess('')}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invite New Member Form */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Invite New Team Member
        </h3>
        
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="colleague@company.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={!inviteEmail.trim() || inviting}
            loading={inviting}
          >
            <UserPlus className="w-4 h-4" />
            Send Invitation
          </Button>
        </form>
      </div>

      {/* Team Members List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users2 className="w-5 h-5" />
            Team Members ({teamMembers.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-muted rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="p-6 text-center">
            <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium text-foreground mb-2">No team members yet</h4>
            <p className="text-sm text-muted-foreground">
              Invite your first team member to get started with collaboration.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {teamMembers.map((member: any) => (
              <div key={member.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-medium">
                      {member.name?.charAt(0)?.toUpperCase() || member.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground">
                      {member.name || member.email}
                    </h4>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.role === 'Admin' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {member.role || 'Member'}
                      </span>
                      {member.status && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          {member.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={member.role || 'Member'}
                    onChange={(e) => handleRoleChange(member.id, e.target.value, member.name || member.email)}
                    className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManageProjectAccess(member)}
                  >
                    Manage Access
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(member.id, member.name || member.email)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Access Modal */}
      <ProjectAccessModal
        isOpen={isProjectAccessModalOpen}
        onClose={handleCloseProjectAccessModal}
        selectedUser={selectedUserForProjects}
        onSuccess={handleProjectAccessSuccess}
      />
    </div>
  );
};

export default TeamMembersPage;