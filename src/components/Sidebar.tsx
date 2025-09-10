import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, FileText, BrainCircuit, Link as LinkIcon, Settings, LogOut, ChevronFirst, ChevronLast, Truck } from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  onLogout: () => void;
}

const SidebarContext = React.createContext({ isSidebarOpen: true });

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar, onLogout }) => {
  return (
    <aside className={`h-screen transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <nav className="h-full flex flex-col bg-white/5 dark:bg-white/5 border-r border-gray-200/50 dark:border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="p-4 pb-2 flex justify-between items-center">
          <img src="/logo-new.png" className={`overflow-hidden transition-all ${isSidebarOpen ? 'w-32' : 'w-0'}`} alt="Blueprint Logo" />
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded-lg bg-gray-100/20 dark:bg-gray-50/5 hover:bg-gray-100/30 dark:hover:bg-gray-50/10 transition-colors duration-200"
          >
            {isSidebarOpen ? (
              <ChevronFirst className="text-gray-600 dark:text-gray-300" />
            ) : (
              <ChevronLast className="text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>

        <SidebarContext.Provider value={{ isSidebarOpen }}>
          <ul className="flex-1 px-3">
            <Link to="/">
              <SidebarItem icon={<Home size={20} />} text="Home" path="/" />
            </Link>
            <Link to="/projects">
              <SidebarItem icon={<Briefcase size={20} />} text="Projects" path="/projects" />
            </Link>
            <Link to="/quotes">
              <SidebarItem icon={<FileText size={20} />} text="Quotes" path="/quotes" />
            </Link>
            <Link to="/ai-copilot">
              <SidebarItem icon={<BrainCircuit size={20} />} text="AI-Copilot" path="/ai-copilot" />
            </Link>
            <Link to="/vendors">
              <SidebarItem icon={<Truck size={20} />} text="Vendors Data" path="/vendors" />
            </Link>
            <Link to="/integrations">
              <SidebarItem icon={<LinkIcon size={20} />} text="Integrations" path="/integrations" />
            </Link>
          </ul>
        </SidebarContext.Provider>

        <div className="border-t border-gray-200/50 dark:border-white/10 flex p-3">
          <img
            src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true&name=Ethan+Manuel"
            alt=""
            className="w-10 h-10 rounded-md"
          />
          <div className={`flex justify-between items-center overflow-hidden transition-all ${isSidebarOpen ? 'w-52 ml-3' : 'w-0'}`}>
            <div className="leading-4">
              <h4 className="font-semibold text-gray-800 dark:text-white">Ethan Manuel</h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">carriedo78@gmail.com</span>
            </div>
          </div>
        </div>
        
        <ul className="px-3 pb-3">
            <Link to="/settings">
              <SidebarItem icon={<Settings size={20} />} text="Settings" path="/settings" />
            </Link>
            <div onClick={onLogout}>
              <SidebarItem icon={<LogOut size={20} />} text="Logout" />
            </div>
        </ul>
      </nav>
    </aside>
  );
};

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
        relative flex items-center py-2 px-3 my-1
        font-medium rounded-md cursor-pointer
        transition-colors group
        ${isActive 
          ? 'bg-gradient-to-tr from-indigo-200/80 to-indigo-100/80 dark:from-indigo-200 dark:to-indigo-100 text-indigo-800 dark:text-indigo-800' 
          : 'hover:bg-gray-100/50 dark:hover:bg-indigo-50/10 text-gray-600 dark:text-gray-300'
        }
    `}
    >
      <span className={isActive ? 'text-indigo-600' : 'text-gray-500 dark:text-gray-400'}>{icon}</span>
      <span className={`overflow-hidden transition-all ${isSidebarOpen ? 'w-52 ml-3' : 'w-0'}`}>{text}</span>
      {alert && <div className={`absolute right-2 w-2 h-2 rounded bg-indigo-400 ${isSidebarOpen ? '' : 'top-2'}`} />}
    </li>
  );
}

export default Sidebar;
