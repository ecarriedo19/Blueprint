import PageHeader from './PageHeader';
import Card from './Card';

const QuotesPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Quotes" 
        subtitle="Generate and manage construction quotes with AI assistance."
        size="lg"
      />
      
      <Card variant="glass" className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Quote Management</h2>
            <p className="text-slate-400">Create and track project quotes with real-time cost analysis</p>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <p className="text-slate-400 text-center py-12">
            💡 Quote generation system coming soon.
            <br />
            <span className="text-sm">AI-powered cost estimation and quote generation for construction projects.</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default QuotesPage;
