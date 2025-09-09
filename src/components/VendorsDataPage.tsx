import PageHeader from './PageHeader';
import Card from './Card';

const VendorsDataPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vendors Data" 
        subtitle="Manage and analyze your vendor relationships."
        size="lg"
      />
      
      <Card variant="glass" className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Vendor Management</h2>
            <p className="text-slate-400">Track vendor performance, costs, and relationships</p>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
          <p className="text-slate-400 text-center py-12">
            🚛 Vendor management features coming soon.
            <br />
            <span className="text-sm">Monitor vendor performance, track costs, and optimize your supply chain.</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default VendorsDataPage;
