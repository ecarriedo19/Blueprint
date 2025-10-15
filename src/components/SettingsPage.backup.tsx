import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import { Building2, CreditCard, Users2, Link, Shield, Palette, Mail, Trash2, UserCheck, AlertCircle, Upload, X, Settings, CheckCircle, ExternalLink, Crown, Receipt } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useTeamMembers, useSubscriptionDetails } from '../utils/queries';
import { useTeamMutations } from '../contexts/TeamMutations';
import ProjectAccessModal from './ProjectAccessModal';
import CostCodesPage from './CostCodesPage';
import { CostCodeProvider } from '../contexts/CostCodeContext';

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  CreditCard, 
  Users2, 
  Receipt, 
  Link as LinkIcon, 
  Shield,
  ArrowRight 
} from 'lucide-react';
import PageHeader from './PageHeader';

// Define the settings sections and their items
const settingsItems = [
  {
    id: 'profile',
    label: 'Company Profile',
    icon: Building2,
    description: 'Manage your organization\'s profile and preferences',
    href: '/settings/profile'
  },
  {
    id: 'billing',
    label: 'Billing & Subscription',
    icon: CreditCard,
    description: 'View and manage your subscription plan and payment methods',
    href: '/settings/billing'
  },
  {
    id: 'team',
    label: 'Team Members',
    icon: Users2,
    description: 'Invite and manage your team members and their permissions',
    href: '/settings/team'
  },
  {
    id: 'cost-codes',
    label: 'Cost Codes',
    icon: Receipt,
    description: 'Manage CSI MasterFormat cost codes for budget tracking',
    href: '/settings/cost-codes'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: LinkIcon,
    description: 'Connect with QuickBooks, Procore, and other tools',
    href: '/settings/integrations'
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    description: 'Manage your security settings and authentication methods',
    href: '/settings/security'
  }
];

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  subscriptionStatus?: string;
}

interface SettingsPageProps {
  currentUser: User;
}

const SettingsPage = ({ currentUser }: SettingsPageProps) => {
  // Role-based permission check
  const isAdmin = () => {
    const userRole = currentUser?.role || 'Member';
    return userRole === 'Admin';
  };

  // Filter settings items based on user role
  const getVisibleSettingsItems = () => {
    return settingsItems.filter(item => {
      // Only show billing and team management to admins
      if (item.id === 'billing' || item.id === 'team') {
        return isAdmin();
      }
      return true;
    });
  };

  const visibleSettingsItems = getVisibleSettingsItems();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader 
        title="Settings" 
        subtitle="Manage your account settings and preferences" 
      />

      {/* Account Settings Section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6">Account Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleSettingsItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                to={item.href}
                className="group bg-card border border-border rounded-lg p-6 hover:border-primary/20 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {item.label}
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

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
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Invite New Team Member
        </h4>
        
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
                placeholder="colleague@company.com"
                required
                className="w-full px-4 py-2 bg-background border border-border rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-ring text-foreground 
                          placeholder-muted-foreground transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg 
                          focus:outline-none focus:ring-2 focus:ring-ring text-foreground 
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

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            💡 Invitations are valid for 7 days. The invited user will receive an email with a secure link to join your team.
          </p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-6 border-b border-border">
          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users2 className="w-5 h-5 text-primary" />
            Team Members ({teamMembers.length})
          </h4>
          <p className="text-muted-foreground text-sm mt-1">
            Manage roles and permissions for your team members
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
              Loading team members...
            </div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No team members found. Start by inviting someone to join your team.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
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
                          <div className="text-foreground font-medium">{member.name || 'Unknown User'}</div>
                          <div className="text-muted-foreground text-sm">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={member.role || 'Member'}
                        onChange={(e) => handleRoleChange(member.id, e.target.value, member.name)}
                        className="bg-background border border-border rounded-lg px-3 py-1 text-sm text-foreground
                                  focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                      >
                        <option value="View-Only">View-Only</option>
                        <option value="Member">Member</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleManageProjectAccess(member)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary 
                                    hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors duration-200"
                          title="Manage project access"
                        >
                          <Settings className="w-3 h-3" />
                          Manage Projects
                        </button>
                        <button
                          onClick={() => handleDeleteUser(member.id, member.name)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg 
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
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Crown className="w-5 h-5 text-muted-foreground" />
              Current Plan
            </h4>
            <div className="px-3 py-1 bg-muted rounded-full">
              <span className="text-muted-foreground text-sm font-medium">Free</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <span className="text-foreground font-medium">Free Plan</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-success font-medium">Active</span>
            </div>

            <div className="mt-4 p-3 bg-muted border border-border rounded-lg">
              <p className="text-muted-foreground text-sm">
                You're currently on the Free Plan with access to basic features. Upgrade to unlock advanced project management tools, unlimited team members, and priority support.
              </p>
            </div>
          </div>
        </div>

        {/* Upgrade Section for Free Users */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Crown className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-foreground">Unlock Pro Features</h4>
              <p className="text-muted-foreground text-sm">Take your construction management to the next level</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <span>Unlimited projects and quotes</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <span>Advanced AI document analysis</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <span>Team collaboration & role management</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
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
          
          <p className="text-center text-muted-foreground text-xs mt-3">
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
          <button 
            onClick={() => setSuccess('')}
            className="ml-auto text-green-600 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Current Plan Display for Paid Users */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Current Plan
          </h4>
        </div>
        
        {isLoadingSubscription ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
              <span>Loading subscription details...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <span className="text-foreground font-medium">
                {subscriptionData?.planName || 'Subscription Plan'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-medium capitalize ${
                hasActiveSubscription ? 'text-success' :
                isPastDue ? 'text-warning' : 'text-destructive'
              }`}>
                {hasActiveSubscription ? 'Active' : 
                 isPastDue ? 'Past Due' : 'Canceled'}
              </span>
            </div>

            {isPastDue && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Your payment is past due. Please update your payment method to continue using all features.
                </p>
              </div>
            )}

            {isCanceled && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Your subscription has been canceled. You can reactivate it through the billing portal.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscription Management for Paid Users */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-lg font-semibold text-foreground mb-3">Subscription Management</h4>
        <p className="text-muted-foreground text-sm mb-4">
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
    if (tabParam && ['profile', 'appearance', 'billing', 'team', 'cost-codes', 'integrations', 'security'].includes(tabParam)) {
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
                  <label htmlFor="companyName" className="block text-sm font-medium text-foreground">
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
                      className={`w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground transition-colors
                        ${error ? 'border-destructive' : 'border-border'}
                        ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Enter company name"
                    />
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
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
                <div className="pt-6 border-t border-border">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Company Logo
                      </label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload your company logo to appear on generated PDF reports. Supported formats: JPEG, PNG, GIF, WebP (max 5MB).
                      </p>
                    </div>

                    {/* Current Logo Display */}
                    {logoUrl && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-foreground mb-2">Current Logo:</p>
                        <div className="w-20 h-20 border border-border rounded-lg overflow-hidden bg-background flex items-center justify-center">
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
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{logoError}</p>
                      </div>
                    )}

                    {logoSuccess && (
                      <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                        <p className="text-sm text-success">{logoSuccess}</p>
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
                          className="text-destructive hover:text-destructive/90 border-destructive/30 hover:border-destructive/50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove Logo
                        </Button>
                      )}
                    </div>

                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm text-primary">
                        💡 Your logo will automatically appear on all generated PDF reports, giving them a professional, branded appearance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                <h4 className="font-medium text-warning mb-2">Limited Access</h4>
                <p className="text-sm text-warning/80">
                  You don't have permission to modify company profile settings. Please contact an administrator.
                </p>
                <div className="mt-3 p-3 bg-muted rounded border border-border">
                  <p className="text-sm text-muted-foreground">
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
                <h3 className="text-lg font-semibold text-foreground mb-3">Theme Preference</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose between light and dark mode. Your preference will be saved and applied across all sessions.
                </p>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
                    <Palette className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Currently using {theme} theme
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
              
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h4 className="font-medium text-primary mb-2">Theme Features</h4>
                <ul className="text-sm text-primary/80 space-y-1">
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
      'cost-codes': {
        title: 'Cost Codes',
        description: 'Manage your cost codes for budget vs. actuals tracking.',
        content: (
          <CostCodeProvider>
            <CostCodesPage 
              onSuccess={(message, type) => {
                // You can show a toast notification here if needed
                console.log(message, type);
              }} 
            />
          </CostCodeProvider>
        )
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
      <div className="bg-card border border-border rounded-lg p-6 flex-1">
        <div className="space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-semibold text-foreground">{current.title}</h2>
            <p className="text-muted-foreground text-sm">{current.description}</p>
          </div>
          
          <div>
            {typeof current.content === 'string' ? (
              <p className="text-foreground">{current.content}</p>
            ) : (
              current.content
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-card border border-border rounded-lg p-4 h-fit">
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
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                >
                  {/* Active Tab Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-full" />
                  )}
                  
                  <Icon size={20} className={isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'} />
                  <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
                  {/* <ChevronRight size={16} className={`transition-transform duration-200
                    ${isActive ? 'text-primary-foreground translate-x-0' : 'text-muted-foreground/50 -translate-x-2 group-hover:translate-x-0'}
                  `} /> */}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SettingsPage;
