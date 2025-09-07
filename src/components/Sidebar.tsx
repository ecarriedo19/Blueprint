import React from 'react';
import { LayoutDashboard, Briefcase, FileText, BrainCircuit, Link, Database, Settings, PanelLeftClose, PanelRightClose } from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const [showLogoutPopup, setShowLogoutPopup] = React.useState(false);

  const handleLogoutClick = () => {
    setShowLogoutPopup(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutPopup(false);
    window.location.reload(); // Redirect to landing page
  };

  const handleLogoutCancel = () => {
    setShowLogoutPopup(false);
  };

  return (
    <div className={`h-screen bg-slate-900 border-r border-slate-700 text-slate-300 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      {/* Logo Area */}
      {isSidebarOpen && (
        <div className="p-4 flex flex-col items-center">
          <img src="/logo.svg" alt="Blueprint Logo" className="h-12 w-auto mb-2" />
          <span className="text-sm text-slate-400">Client Name</span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1">
        <ul className="space-y-2">
          <li className="pl-4 py-2 bg-slate-800 border-l-4 border-blue-500">
            <a href="#" className="flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-blue-500" />
              {isSidebarOpen && <span>Home</span>}
            </a>
          </li>
          <li className="pl-4 py-2 hover:bg-slate-800">
            <a href="#" className="flex items-center gap-3">
              <Briefcase className="h-5 w-5" />
              {isSidebarOpen && <span>Projects</span>}
            </a>
          </li>
          <li className="pl-4 py-2 hover:bg-slate-800">
            <a href="#" className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              {isSidebarOpen && <span>Quotes</span>}
            </a>
          </li>
          <li className="pl-4 py-2 hover:bg-slate-800">
            <a href="#" className="flex items-center gap-3">
              <BrainCircuit className="h-5 w-5" />
              {isSidebarOpen && <span>AI-Copilot</span>}
            </a>
          </li>
          <li className="pl-4 py-2 hover:bg-slate-800">
            <a href="#" className="flex items-center gap-3">
              <Link className="h-5 w-5" />
              {isSidebarOpen && <span>Integrations</span>}
            </a>
          </li>
          <li className="pl-4 py-2 hover:bg-slate-800">
            <a href="#" className="flex items-center gap-3">
              <Database className="h-5 w-5" />
              {isSidebarOpen && <span>Providers Data</span>}
            </a>
          </li>
        </ul>
      </nav>

      {/* Toggle Button */}
      <div className="p-4">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 hover:bg-slate-800 py-2 pl-4 text-slate-300"
        >
          {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
          {isSidebarOpen && <span>Collapse</span>}
        </button>
      </div>

      {/* Settings Link */}
      <div className="p-4">
        <a href="#" className="flex items-center gap-3 hover:bg-slate-800 py-2 pl-4">
          <Settings className="h-5 w-5" />
          {isSidebarOpen && <span>Settings</span>}
        </a>
      </div>

      {/* Logout Button */}
      <div className="p-4">
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-3 hover:bg-slate-800 py-2 pl-4 text-slate-300"
        >
          <span>Log Out</span>
        </button>
      </div>

      {/* Logout Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-slate-700 mb-4">Are you sure you want to log out?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLogoutConfirm}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Yes
              </button>
              <button
                onClick={handleLogoutCancel}
                className="bg-gray-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
