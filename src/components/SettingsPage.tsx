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
      {/* Settings Title */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Account Settings Section */}
      <div>
        
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