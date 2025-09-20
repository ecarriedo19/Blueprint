import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useNotifications } from '../contexts/NotificationContext';
import Dashboard from './Dashboard';
import ProjectsPage from './ProjectsPage';
import QuotesPage from './QuotesPage';
import ViewQuotePage from './ViewQuotePage.tsx';
import AiCopilotPage from './AiCopilotPage';
import IntegrationsPage from './IntegrationsPage';
import SettingsPage from './SettingsPage';
import VendorsDataPage from './VendorsDataPage';

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
    <div className="flex h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-gray-900 dark:text-white transition-colors duration-300">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
        currentUser={currentUser}
        onLogout={onLogout} 
      />

      <main className="flex-1 p-8 overflow-y-auto relative">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectsPage currentUser={currentUser} />} />
          <Route path="/quotes" element={<QuotesPage currentUser={currentUser} />} />
          <Route path="/quotes/:id" element={<ViewQuotePage currentUser={currentUser} />} />
          <Route path="/ai-copilot" element={<AiCopilotPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/vendors" element={<VendorsDataPage />} />
          <Route path="/settings" element={<SettingsPage companyName={companyName} updateCompanyName={updateCompanyName} currentUser={currentUser} />} />
        </Routes>

        {/* Notification Bell - Fixed Position */}
        <div className="fixed top-4 right-4 z-50">
          <NotificationBell 
            notifications={state.notifications}
            unreadCount={state.unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
