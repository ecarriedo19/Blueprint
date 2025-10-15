import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const SecurityPage = () => {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          to="/settings" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Settings</span>
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Security Settings</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-foreground mb-3">
            Security & Authentication
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Configure two-factor authentication, password policies, and session management for your organization. 
            Keep your construction data secure with enterprise-grade security features.
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

export default SecurityPage;