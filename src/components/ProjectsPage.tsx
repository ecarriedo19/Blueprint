import PageHeader from './PageHeader';
import Card from './Card';

const ProjectsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Projects" 
        subtitle="Manage and track all your construction projects in one place."
        size="lg"
      />
      
      <Card variant="glass" className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Active Projects</h2>
            <p className="text-slate-400">View and manage your ongoing construction projects</p>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <p className="text-slate-400 text-center py-12">
            🏗️ Project management features coming soon.
            <br />
            <span className="text-sm">Track budgets, timelines, and resources for all your construction projects.</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ProjectsPage;
