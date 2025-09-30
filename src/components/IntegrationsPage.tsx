import Card from './Card';

const IntegrationsPage = () => {
  return (
    <div className="space-y-6">
      <Card variant="glass" className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Available Integrations</h2>
            <p className="text-slate-400">Connect with popular construction and project management tools</p>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <p className="text-slate-400 text-center py-12">
            🔌 Integration marketplace coming soon.
            <br />
            <span className="text-sm">Connect with industry-leading construction and project management tools.</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default IntegrationsPage;
