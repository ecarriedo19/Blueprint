import { useState, useCallback } from 'react';
import PageHeader from './PageHeader';
import Card from './Card';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import { Building2, CreditCard, Users2, Link, Shield, ChevronRight, Palette, Mail, Trash2, UserCheck, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { useTeamMembers } from '../utils/queries';
import { useTeamMutations } from '../contexts/TeamMutations';

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
                              src={member.profilePictureUrl} 
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
                      <button
                        onClick={() => handleDeleteUser(member.id, member.name)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg 
                                  transition-colors duration-200"
                        title="Remove team member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface SettingsPageProps {
  companyName: string;
  updateCompanyName: (name: string) => Promise<void>;
  currentUser: User;
}

const SettingsPage = ({ companyName, updateCompanyName, currentUser }: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [newCompanyName, setNewCompanyName] = useState(companyName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

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
        content: 'View your current plan, billing history, and manage your payment methods. Upgrade or modify your subscription as needed.'
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
      <PageHeader 
        title="Settings" 
        subtitle="Manage your company profile, billing, and team members."
        size="lg"
      />
      
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
