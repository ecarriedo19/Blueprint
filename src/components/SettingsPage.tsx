import { useState, useCallback } from 'react';
import PageHeader from './PageHeader';
import Card from './Card';
import Button from './Button';
import { Building2, CreditCard, Users2, Link, Shield, ChevronRight } from 'lucide-react';

// Define the navigation items
const navItems = [
  {
    id: 'profile',
    label: 'Company Profile',
    icon: Building2,
    description: 'Manage your company information and preferences'
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

interface SettingsPageProps {
  companyName: string;
  updateCompanyName: (name: string) => Promise<void>;
}

const SettingsPage = ({ companyName, updateCompanyName }: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [newCompanyName, setNewCompanyName] = useState(companyName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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
            <div className="space-y-2">
              <label htmlFor="companyName" className="block text-sm font-medium text-slate-300">
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
                  className={`w-full px-4 py-2 bg-slate-800/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-colors
                    ${error ? 'border-red-500/50' : 'border-slate-700/50'}
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
        content: 'Invite new team members, set roles and permissions, and manage access to different features of the platform.'
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
            <h2 className="text-2xl font-bold text-white mb-2">{current.title}</h2>
            <p className="text-slate-400">{current.description}</p>
          </div>
          
          <div className="h-px bg-gradient-to-r from-slate-700/50 via-slate-500/50 to-slate-700/50" />
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            {typeof current.content === 'string' ? (
              <p className="text-slate-300">{current.content}</p>
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
            {navItems.map((item) => {
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
