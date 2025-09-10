import { useState, useCallback } from 'react';
import PageHeader from './PageHeader';
import Card from './Card';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import { Building2, CreditCard, Users2, Link, Shield, ChevronRight, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

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

interface SettingsPageProps {
  companyName: string;
  updateCompanyName: (name: string) => Promise<void>;
}

const SettingsPage = ({ companyName, updateCompanyName }: SettingsPageProps) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [newCompanyName, setNewCompanyName] = useState(companyName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();

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
