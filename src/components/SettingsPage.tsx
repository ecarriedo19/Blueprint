import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Card from './Card';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import { Building2, CreditCard, Users2, Link, Shield, ChevronRight, Palette, Mail, Trash2, UserCheck, AlertCircle, Upload, X, Settings, CheckCircle, ExternalLink, Crown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useTeamMembers, useSubscriptionDetails } from '../utils/queries';
import { useTeamMutations } from '../contexts/TeamMutations';
import ProjectAccessModal from './ProjectAccessModal';

// Helper function to construct absolute URLs for images
const getAbsoluteImageUrl = (relativePath: string | null): string | null => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath; // Already absolute
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  return `${apiBaseUrl}${relativePath}`;
};

// Define the navigation items
const navItems = [
  {
    id: 'profile',
    label: 'Company Profile',
    icon: Building2,
    description: 'Manage your company information and preferences'
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Customize your theme and visual preferences'
  },
  {
    id: 'billing',
    label: 'Billing & Subscription',
    icon: CreditCard,
    description: 'View and manage your subscription plan and payment methods'
  },
  {
    id: 'team',
    label: 'Team Members',
    icon: Users2,
    description: 'Invite and manage your team members and their permissions'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Link,
    description: 'Connect with QuickBooks, Procore, and other tools'
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Manage your security settings and authentication methods'
  }
];

// Team Member interface


// Team Management Component
const TeamManagementContent = () => {
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

  // Send invitation
  const handleSendInvite = async (e) => {
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
  const handleRoleChange = async (userId, newRole, userName) => {
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
  const handleDeleteUser = (userId, userName) => {
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
          console.error('Error removing team member:', err);
          setError(err.message || 'Failed to remove team member. Please try again.');
          setSuccess('');
        }
      }
    });
  };

  // Handle project access modal
  const handleManageProjectAccess = (user) => {
    setSelectedUserForProjects(user);
    setIsProjectAccessModalOpen(true);
  };

  const handleCloseProjectAccessModal = () => {
    setIsProjectAccessModalOpen(false);
    setSelectedUserForProjects(null);
  };

  const handleProjectAccessSuccess = (message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Status Messages */}
      {(error || queryError) && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error || queryError?.message}</p>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-300 text-sm">{success}</p>
          <button 
            onClick={() => setSuccess('')}
            className="ml-auto text-green-400 hover:text-green-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Invite New Member Form */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" />
          Invite New Team Member
        </h4>
        
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                required
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 text-white 
                          placeholder-slate-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-blue-500 text-white 
                          transition-colors"
              >
                <option value="Member">Member</option>
                <option value="View-Only">View-Only</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={inviting}
            disabled={inviting || !inviteEmail.trim()}
            className="w-full md:w-auto"
          >
            {inviting ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 Invitations are valid for 7 days. The invited user will receive an email with a secure link to join your team.
          </p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users2 className="w-5 h-5 text-blue-400" />
            Team Members ({teamMembers.length})
          </h4>
          <p className="text-slate-400 text-sm mt-1">
            Manage roles and permissions for your team members
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
              Loading team members...
            </div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No team members found. Start by inviting someone to join your team.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/30 border-b border-slate-600/50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          {member.profilePictureUrl ? (
                            <img 
                              src={getAbsoluteImageUrl(member.profilePictureUrl) || ''} 
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-sm">
                              {member.name?.charAt(0)?.toUpperCase() || member.email.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">{member.name || 'Unknown User'}</div>
                          <div className="text-slate-400 text-sm">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role || 'Member'}
                        onChange={(e) => handleRoleChange(member.id, e.target.value, member.name)}
                        className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1 text-sm text-white
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <option value="View-Only">View-Only</option>
                        <option value="Member">Member</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleManageProjectAccess(member)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-400 
                                    hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors duration-200"
                          title="Manage project access"
                        >
                          <Settings className="w-3 h-3" />
                          Manage Projects
                        </button>
                        <button
                          onClick={() => handleDeleteUser(member.id, member.name)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg 
                                    transition-colors duration-200"
                          title="Remove team member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

// Billing Management Component
const BillingManagementContent = ({ currentUser }: { currentUser: any }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch subscription details for active users
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useSubscriptionDetails();

  // Get subscription status and details
  const subscriptionStatus = currentUser?.subscriptionStatus || 'free';
  const hasActiveSubscription = subscriptionStatus === 'active';
  const isPastDue = subscriptionStatus === 'past_due';
  const isCanceled = subscriptionStatus === 'canceled';
  const isFreeUser = subscriptionStatus === 'free';

  // Handle upgrade click for free users
  const handleUpgradeClick = () => {
    navigate('/pricing');
  };

  // Handle manage subscription click for paid users
  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Check if response is JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        setError('Invalid response from server. Please try again.');
        return;
      }

      if (response.ok && data.success) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open billing portal. Please try again.');
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render view for FREE users
  if (isFreeUser) {
    return (
      <div className="space-y-6">
        {/* Current Plan Display for Free Users */}
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-slate-400" />
              Current Plan
            </h4>
            <div className="px-3 py-1 bg-slate-700/50 rounded-full">
              <span className="text-slate-300 text-sm font-medium">Free</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Plan:</span>
              <span className="text-white font-medium">Free Plan</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Status:</span>
              <span className="text-slate-400 font-medium">Active</span>
            </div>

            <div className="mt-4 p-3 bg-slate-700/30 border border-slate-600/50 rounded-lg">
              <p className="text-slate-300 text-sm">
                You're currently on the Free Plan with access to basic features. Upgrade to unlock advanced project management tools, unlimited team members, and priority support.
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Section for Free Users */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Crown className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">Unlock Pro Features</h4>
              <p className="text-blue-200 text-sm">Take your construction management to the next level</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>Unlimited projects and quotes</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>Advanced AI document analysis</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>Team collaboration & role management</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>Priority customer support</span>
            </div>
          </div>
          
          <Button
            onClick={handleUpgradeClick}
            className="w-full flex items-center justify-center gap-2"
            variant="primary"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Pro
          </Button>
          
          <p className="text-center text-slate-400 text-xs mt-3">
            30-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </div>
    );
  }

  // Render view for PAID users (active, past_due, canceled)
  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-300 text-sm">{success}</p>
          <button 
            onClick={() => setSuccess('')}
            className="ml-auto text-green-400 hover:text-green-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Current Plan Display for Paid Users */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            Current Plan
          </h4>
        </div>
        
        {isLoadingSubscription ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
              <span>Loading subscription details...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Plan:</span>
              <span className="text-white font-medium">
                {subscriptionData?.planName || 'Subscription Plan'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Status:</span>
              <span className={`font-medium capitalize ${
                hasActiveSubscription ? 'text-green-400' :
                isPastDue ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {hasActiveSubscription ? 'Active' : 
                 isPastDue ? 'Past Due' : 'Canceled'}
              </span>
            </div>

            {isPastDue && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Your payment is past due. Please update your payment method to continue using all features.
                </p>
              </div>
            )}

            {isCanceled && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Your subscription has been canceled. You can reactivate it through the billing portal.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscription Management for Paid Users */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
        <h4 className="text-lg font-semibold text-white mb-3">Subscription Management</h4>
        <p className="text-slate-300 text-sm mb-4">
          Access your Stripe Customer Portal to manage your subscription, view billing history, 
          update payment methods, and download invoices.
        </p>
        
        <Button
          onClick={handleManageSubscription}
          loading={isLoading}
          disabled={isLoading}
          className="flex items-center gap-2"
          variant="primary"
        >
          <ExternalLink className="w-4 h-4" />
          Manage Subscription & Billing
        </Button>
      </div>
    </div>
  );
};

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  subscriptionStatus?: string;
}

interface SettingsPageProps {
  companyName: string;
  updateCompanyName: (name: string) => Promise<void>;
  currentUser: User;
}

const SettingsPage = ({ companyName, updateCompanyName, currentUser }: SettingsPageProps) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [newCompanyName, setNewCompanyName] = useState(companyName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [logoSuccess, setLogoSuccess] = useState('');
  const { theme } = useTheme();

  // Handle URL parameters to set initial tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'appearance', 'billing', 'team', 'integrations', 'security'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch company profile data (including logo) on component mount
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const response = await fetch('/api/company-profile', {
          credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
          setLogoUrl(data.logo_url);
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
      }
    };
    
    fetchCompanyProfile();
  }, []);

  // Handle logo file upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLogoError('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Image file must be smaller than 5MB');
      return;
    }

    setIsUploadingLogo(true);
    setLogoError('');
    setLogoSuccess('');

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/company-profile/logo', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setLogoUrl(result.logo_url);
        setLogoSuccess(logoUrl ? 'Company logo updated successfully!' : 'Company logo uploaded successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setLogoSuccess(''), 3000);
      } else {
        setLogoError(result.error || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setLogoError('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
      // Reset the file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Handle logo removal
  const handleLogoRemove = async () => {
    setIsUploadingLogo(true);
    setLogoError('');
    setLogoSuccess('');

    try {
      const response = await fetch('/api/company-profile/logo', {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setLogoUrl(null);
        setLogoSuccess('Company logo removed successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setLogoSuccess(''), 3000);
      } else {
        setLogoError(result.error || 'Failed to remove logo');
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      setLogoError('Failed to remove logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Role-based permission check
  const isAdmin = () => {
    const userRole = currentUser?.role || 'Member';
    return userRole === 'Admin';
  };

  // Filter nav items based on user role
  const getVisibleNavItems = () => {
    return navItems.filter(item => {
      // Only show billing and team management to admins
      if (item.id === 'billing' || item.id === 'team') {
        return isAdmin();
      }
      return true;
    });
  };

  const visibleNavItems = getVisibleNavItems();

  // Handle save company name
  const handleSave = useCallback(async () => {
    const trimmedName = newCompanyName.trim();
    if (!trimmedName || trimmedName === companyName) return;
    
    try {
      setIsSaving(true);
      await updateCompanyName(trimmedName);
      // Reset error state if successful
      setError('');
    } catch (error) {
      console.error('Error saving company name:', error);
      setError('Failed to update company name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [newCompanyName, updateCompanyName, companyName]);

  // Render the content for the active tab
  const renderTabContent = () => {
    const tabContent = {
      profile: {
        title: 'Company Profile',
        description: "Manage your organization's profile and preferences.",
        content: (
          <div className="space-y-6">
            {isAdmin() ? (
              <div className="space-y-6">
                {/* Company Name Section */}
                <div className="space-y-2">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Company Name
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      id="companyName"
                      value={newCompanyName}
                      onChange={(e) => {
                        setNewCompanyName(e.target.value);
                        setError(''); // Clear error when user types
                      }}
                      disabled={isSaving}
                      className={`w-full px-4 py-2 bg-gray-100/50 dark:bg-slate-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors
                        ${error ? 'border-red-500/50' : 'border-gray-300/50 dark:border-slate-700/50'}
                        ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Enter company name"
                    />
                    {error && (
                      <p className="text-sm text-red-400">{error}</p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      loading={isSaving}
                      disabled={isSaving || !newCompanyName.trim() || newCompanyName.trim() === companyName}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>

                {/* Company Logo Section */}
                <div className="pt-6 border-t border-gray-200/50 dark:border-slate-700/50">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Company Logo
                      </label>
                      <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                        Upload your company logo to appear on generated PDF reports. Supported formats: JPEG, PNG, GIF, WebP (max 5MB).
                      </p>
                    </div>

                    {/* Current Logo Display */}
                    {logoUrl && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Current Logo:</p>
                        <div className="w-20 h-20 border border-gray-300/50 dark:border-slate-600/50 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center">
                          <img 
                            src={getAbsoluteImageUrl(logoUrl) || ''} 
                            alt="Company Logo" 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* Logo Status Messages */}
                    {logoError && (
                      <div className="p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-700/50 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{logoError}</p>
                      </div>
                    )}

                    {logoSuccess && (
                      <div className="p-3 bg-green-50/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/50 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">{logoSuccess}</p>
                      </div>
                    )}

                    {/* Upload/Remove Buttons */}
                    <div className="flex items-center gap-3">
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer inline-block">
                        <Button
                          variant="outline"
                          loading={isUploadingLogo}
                          disabled={isUploadingLogo}
                          className="relative pointer-events-none"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploadingLogo ? 'Processing...' : (logoUrl ? 'Replace Logo' : 'Upload Logo')}
                        </Button>
                      </label>
                      
                      {logoUrl && (
                        <Button
                          variant="outline"
                          onClick={handleLogoRemove}
                          loading={isUploadingLogo}
                          disabled={isUploadingLogo}
                          className="text-red-500 hover:text-red-600 border-red-500/30 hover:border-red-500/50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove Logo
                        </Button>
                      )}
                    </div>

                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-lg">
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        💡 Your logo will automatically appear on all generated PDF reports, giving them a professional, branded appearance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/50">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Limited Access</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  You don't have permission to modify company profile settings. Please contact an administrator.
                </p>
                <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-800 rounded border">
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    <strong>Current Company:</strong> {companyName}
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      },
      appearance: {
        title: 'Appearance',
        description: 'Customize your theme and visual preferences.',
        content: (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Theme Preference</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                  Choose between light and dark mode. Your preference will be saved and applied across all sessions.
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-700/30 rounded-lg border border-gray-200/50 dark:border-slate-600/50">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-slate-600 rounded-lg">
                    <Palette className="w-5 h-5 text-gray-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Currently using {theme} theme
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Theme Features</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Automatic system preference detection</li>
                  <li>• Smooth transitions between themes</li>
                  <li>• Persistent preference storage</li>
                  <li>• Optimized for productivity and comfort</li>
                </ul>
              </div>
            </div>
          </div>
        )
      },
      billing: {
        title: 'Billing & Subscription',
        description: 'Manage your subscription and payment details.',
        content: <BillingManagementContent currentUser={currentUser} />
      },
      team: {
        title: 'Team Members',
        description: 'Manage your team and their access levels.',
        content: <TeamManagementContent />
      },
      integrations: {
        title: 'Integrations',
        description: 'Connect your favorite construction management tools.',
        content: 'Set up and manage integrations with QuickBooks, Procore, and other construction management software.'
      },
      security: {
        title: 'Security Settings',
        description: 'Manage your security preferences.',
        content: 'Configure two-factor authentication, password policies, and session management for your organization.'
      }
    };

    const current = tabContent[activeTab];

    return (
      <Card variant="glass" className="flex-1">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{current.title}</h2>
            <p className="text-gray-600 dark:text-slate-400">{current.description}</p>
          </div>
          
          <div className="h-px bg-gradient-to-r from-gray-300/50 via-gray-400/50 to-gray-300/50 dark:from-slate-700/50 dark:via-slate-500/50 dark:to-slate-700/50" />
          
          <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-lg p-6 border border-gray-200/50 dark:border-slate-700/50">
            {typeof current.content === 'string' ? (
              <p className="text-gray-700 dark:text-slate-300">{current.content}</p>
            ) : (
              current.content
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">      
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* Navigation Sidebar */}
        <Card variant="glass" className="h-fit" padding="sm" hover={false}>
          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  {/* Active Tab Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                  )}
                  
                  <Icon size={20} className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'} />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  <ChevronRight size={16} className={`transition-transform duration-200
                    ${isActive ? 'text-blue-400 translate-x-0' : 'text-slate-600 -translate-x-2 group-hover:translate-x-0'}
                  `} />
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Content Area */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SettingsPage;
