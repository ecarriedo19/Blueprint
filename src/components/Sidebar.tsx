import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, FileText, BrainCircuit, Link as LinkIcon, Truck, BarChart3 } from 'lucide-react';
import UserMenu from './shared/UserMenu';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  onLogout: () => Promise<void>;
}

export const SidebarContext = React.createContext({ isSidebarOpen: true });

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar, onLogout }) => {

  return (
    <aside className={`relative h-screen transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <nav className="h-full flex flex-col bg-card border-r border-border shadow-sm overflow-visible">
        <div className="p-4 pb-2"></div>

        <SidebarContext.Provider value={{ isSidebarOpen }}>
          <ul className="flex-1 px-3 py-2">
            {/* Main Section */}
            <SidebarHeader text="Main" />
            <Link to="/">
              <SidebarItem icon={<Home className="w-4 h-4" />} text="Home" path="/" />
            </Link>
            <Link to="/projects">
              <SidebarItem icon={<Briefcase className="w-4 h-4" />} text="Projects" path="/projects" />
            </Link>
            <Link to="/quotes">
              <SidebarItem icon={<FileText className="w-4 h-4" />} text="Quotes" path="/quotes" />
            </Link>

            {/* Analytics Section */}
            <SidebarHeader text="Analytics" />
            <Link to="/reports">
              <SidebarItem icon={<BarChart3 className="w-4 h-4" />} text="Reports" path="/reports" />
            </Link>
            <Link to="/ai-copilot">
              <SidebarItem icon={<BrainCircuit className="w-4 h-4" />} text="AI Copilot" path="/ai-copilot" />
            </Link>

            {/* Management Section */}
            <SidebarHeader text="Management" />
            <Link to="/vendors">
              <SidebarItem icon={<Truck className="w-4 h-4" />} text="Vendors" path="/vendors" />
            </Link>
            <Link to="/integrations">
              <SidebarItem icon={<LinkIcon className="w-4 h-4" />} text="Integrations" path="/integrations" />
            </Link>
          </ul>
        </SidebarContext.Provider>

        {/* User Menu - wrapped in context */}
        <SidebarContext.Provider value={{ isSidebarOpen }}>
          <UserMenu onLogout={onLogout} />
        </SidebarContext.Provider>
      </nav>
      
      {/* Stripe-style Collapse Bar */}
      <div 
        className="absolute top-1/2 -right-[1px] transform -translate-y-1/2 group cursor-pointer z-10"
        onClick={toggleSidebar}
      >
        {/* Vertical Bar */}
        <div className="w-3 h-12 bg-border hover:bg-muted-foreground/30 transition-colors duration-200 rounded-r-md flex items-center justify-center">
          <div className="w-[1px] h-6 bg-muted-foreground/40"></div>
        </div>
        
        {/* Tooltip */}
        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-foreground text-background text-xs font-medium rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
          {isSidebarOpen ? 'Collapse' : 'Expand'}
        </div>
      </div>
    </aside>
  );
};

interface SidebarHeaderProps {
  text: string;
}

function SidebarHeader({ text }: SidebarHeaderProps) {
  const { isSidebarOpen } = React.useContext(SidebarContext);
  
  return (
    <li className={`px-4 mt-6 mb-2 first:mt-2 ${isSidebarOpen ? 'block' : 'hidden'}`}>
      <h4 className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
        {text}
      </h4>
    </li>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  path?: string;
  alert?: boolean;
}

function SidebarItem({ icon, text, path, alert }: SidebarItemProps) {
  const { isSidebarOpen } = React.useContext(SidebarContext);
  const location = useLocation();
  const isActive = path && location.pathname === path;
  
  return (
    <li
      className={`
        relative flex items-center py-2 px-4 mb-1
        text-sm font-medium rounded-md cursor-pointer
        transition-colors duration-150 group
        ${isActive 
          ? 'bg-muted text-primary' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }
      `}
    >
      <span className={`transition-colors duration-150 ${
        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
      }`}>
        {icon}
      </span>
      <span className={`overflow-hidden transition-all duration-300 text-sm ${
        isSidebarOpen ? 'w-52 ml-3' : 'w-0'
      }`}>
        {text}
      </span>
      {alert && (
        <div className={`absolute right-3 w-1.5 h-1.5 rounded-full bg-primary ${
          isSidebarOpen ? '' : 'top-2 right-2'
        }`} />
      )}
    </li>
  );
}

export default Sidebar;
