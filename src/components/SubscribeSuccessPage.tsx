import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import PageHeader from './PageHeader';
import Button from './Button';
import Card from './Card';

const SubscribeSuccessPage: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get session ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session_id');
    setSessionId(session);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader 
        title="Welcome to Blueprint Pro!" 
        subtitle="Your subscription has been successfully activated"
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card variant="default" className="text-center p-12">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Subscription Successful!
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Thank you for upgrading to Blueprint Pro. You now have access to all premium features 
            to help grow your construction business.
          </p>

          {sessionId && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Transaction ID: <span className="font-mono">{sessionId.slice(-12)}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 dark:text-blue-400 font-bold">∞</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Unlimited Projects
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Create as many projects as you need
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Advanced Reporting
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Detailed insights and analytics
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 dark:text-green-400 font-bold">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Priority Support
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get help when you need it most
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Link to="/dashboard">
              <Button variant="primary" className="w-full md:w-auto inline-flex items-center">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <div className="text-center">
              <Link 
                to="/projects" 
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Start your first project →
              </Link>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            What's Next?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="default" className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Create Your First Project
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Set up a new construction project with detailed budgeting and tracking.
              </p>
              <Link to="/projects">
                <Button variant="outline">Create Project</Button>
              </Link>
            </Card>

            <Card variant="default" className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Generate Professional Quotes
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Use our advanced templates to create impressive quotes for clients.
              </p>
              <Link to="/quotes">
                <Button variant="outline">Create Quote</Button>
              </Link>
            </Card>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Need help getting started? We're here to help!
          </p>
          <div className="space-x-4">
            <Button
              variant="ghost"
              onClick={() => window.open('mailto:support@blueprint-saas.com', '_blank')}
            >
              Contact Support
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.open('https://docs.blueprint-saas.com', '_blank')}
            >
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribeSuccessPage;