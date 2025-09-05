import React from 'react';
import './DashboardMain.css';

const DashboardMain = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Main Dashboard</h1>
      </header>
      <aside className="dashboard-sidebar">
        <div className="client-name">Blueprint Client Name</div>
        <nav className="sidebar-menu">
          <button>Home</button>
          <button>Projects</button>
          <button>Quotes</button>
          <button>AI-Copilot</button>
          <button>Integrations</button>
          <button>Settings</button>
        </nav>
        <div className="billing">Billing inside Settings</div>
      </aside>
      <main className="dashboard-main">
        <div className="google-dashboard">Embedded Google Dashboard</div>
      </main>
    </div>
  );
};

export default DashboardMain;
