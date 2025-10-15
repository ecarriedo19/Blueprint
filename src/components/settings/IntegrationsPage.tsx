import { Link as RouterLink } from 'react-router-dom';
import { Link, ArrowLeft } from 'lucide-react';

const IntegrationsPage = () => {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <RouterLink 
          to="/settings" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Settings</span>
        </RouterLink>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-8">
        <div className="text-center">
          <Link className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Third-Party Integrations
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Set up and manage integrations with QuickBooks, Procore, and other construction management software. 
            Sync your project data seamlessly across platforms.
          </p>
          <div className="mt-8">
            <span className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-full text-sm">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;