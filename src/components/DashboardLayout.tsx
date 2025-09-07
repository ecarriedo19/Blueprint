import { useState } from 'react';
import Sidebar from './Sidebar';
import PageHeader from './PageHeader';
import Card from './Card';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className={`h-screen bg-slate-800 grid ${isSidebarOpen ? 'grid-cols-12' : 'grid-cols-[80px_1fr]'}`}>
      {/* Sidebar */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'col-span-2' : 'w-20'}`}>
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </div>

      {/* Main Content */}
      <div className="col-span-10 p-8 text-slate-300">
        <PageHeader title="Main Dashboard" subtitle="Welcome to your dashboard" />
        <Card>
          <p className="text-slate-400">Embedded Google Dashboard will go here.</p>
        </Card>
      </div>
    </div>
  );
};

export default DashboardLayout;
