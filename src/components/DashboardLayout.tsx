import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import PageHeader from './PageHeader';
import Card from './Card';
import Button from './Button';
import { BarChart3, Users, TrendingUp, Target } from 'lucide-react';
import ProjectsPage from './ProjectsPage';
import QuotesPage from './QuotesPage';
import AiCopilotPage from './AiCopilotPage';
import IntegrationsPage from './IntegrationsPage';
import SettingsPage from './SettingsPage';
import VendorsDataPage from './VendorsDataPage';

interface DashboardLayoutProps {
  companyName: string;
  updateCompanyName: (name: string) => Promise<void>;
}

const DashboardLayout = ({ companyName, updateCompanyName }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleLogout = () => {
    // In a real app, you'd clear the user session here
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} onLogout={handleLogout} />

      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={
            <>
              <PageHeader 
                title={companyName}
                size="lg"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="glass" padding="md" className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">2,847</h3>
            <p className="text-slate-400">Total Users</p>
          </Card>

          <Card variant="glass" padding="md" className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">$24.8K</h3>
            <p className="text-slate-400">Revenue</p>
          </Card>

          <Card variant="glass" padding="md" className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">94.2%</h3>
            <p className="text-slate-400">Conversion</p>
          </Card>

          <Card variant="glass" padding="md" className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mx-auto mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">87%</h3>
            <p className="text-slate-400">Goal Progress</p>
          </Card>
        </div>

        <Card variant="glass" className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Analytics Overview</h2>
              <p className="text-slate-400">Comprehensive view of your key metrics and performance indicators</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">Export Data</Button>
              <Button variant="primary" size="sm">View Reports</Button>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
            <p className="text-slate-400 text-center py-12">
              📊 Embedded Google Dashboard will go here.
              <br />
              <span className="text-sm">Connect your analytics to see real-time data visualization</span>
            </p>
          </div>
        </Card>

        <Card variant="gradient" padding="md">
          <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm">Generate Report</Button>
            <Button variant="secondary" size="sm">Sync Data</Button>
            <Button variant="outline" size="sm">Settings</Button>
            <Button variant="ghost" size="sm">Help</Button>
          </div>
        </Card>
            </>
          } />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/quotes" element={<QuotesPage />} />
          <Route path="/ai-copilot" element={<AiCopilotPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/vendors" element={<VendorsDataPage />} />
          <Route path="/settings" element={<SettingsPage companyName={companyName} updateCompanyName={updateCompanyName} />} />
        </Routes>
      </main>
    </div>
  );
};

export default DashboardLayout;
