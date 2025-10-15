import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './layout/Header';
import { useNotifications } from '../contexts/NotificationContext';
import Dashboard from './Dashboard';
import ProjectsPage from './ProjectsPage';
import QuotesPage from './QuotesPage';
import ViewQuotePage from './ViewQuotePage.tsx';
import ViewProjectPage from './ViewProjectPage';
import AiCopilotPage from './AiCopilotPage';
import ReportsPage from './ReportsPage';
import IntegrationsPage from './IntegrationsPage';
import SettingsPage from './SettingsPage';
import VendorsDataPage from './VendorsDataPage';
import { TeamMutationsProvider } from '../contexts/TeamMutations';

// Settings page components
import CompanyProfilePage from './settings/CompanyProfilePage';
import BillingPage from './settings/BillingPage';
import TeamMembersPage from './settings/TeamMembersPage';
import CostCodesPage from './settings/CostCodesPage';
import SecurityPage from './settings/SecurityPage';
import SettingsIntegrationsPage from './settings/IntegrationsPage';

interface DashboardLayoutProps {
  companyName: string;
  updateCompanyName: (name: string) => Promise<void>;
  currentUser: any;
  onLogout: () => Promise<void>;
}

const DashboardLayout = ({ companyName, updateCompanyName, currentUser, onLogout }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { state, markAsRead, markAllAsRead } = useNotifications();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        onLogout={onLogout} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          notifications={state.notifications}
          unreadCount={state.unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<Dashboard companyName={companyName} />} />
                <Route path="/projects" element={<ProjectsPage currentUser={currentUser} />} />
                <Route path="/projects/:id" element={<ViewProjectPage />} />
                <Route path="/quotes" element={<QuotesPage currentUser={currentUser} />} />
                <Route path="/quotes/:id" element={<ViewQuotePage currentUser={currentUser} />} />
                <Route path="/ai-copilot" element={<AiCopilotPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/vendors" element={<VendorsDataPage />} />
                <Route path="/settings" element={<SettingsPage currentUser={currentUser} />} />
                <Route path="/settings/profile" element={
                  <CompanyProfilePage 
                    companyName={companyName} 
                    updateCompanyName={updateCompanyName} 
                    currentUser={currentUser} 
                  />
                } />
                <Route path="/settings/billing" element={<BillingPage currentUser={currentUser} />} />
                <Route path="/settings/team" element={
                  <TeamMutationsProvider>
                    <TeamMembersPage />
                  </TeamMutationsProvider>
                } />
                <Route path="/settings/cost-codes" element={<CostCodesPage />} />
                <Route path="/settings/integrations" element={<SettingsIntegrationsPage />} />
                <Route path="/settings/security" element={<SecurityPage />} />
              </Routes>
            </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
