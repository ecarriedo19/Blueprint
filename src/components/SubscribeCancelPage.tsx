import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import PageHeader from './PageHeader';
import Button from './Button';
import Card from './Card';

const SubscribeCancelPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader 
        title="Subscription Cancelled" 
        subtitle="No worries - you can try again anytime"
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card variant="default" className="text-center p-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4">
              <XCircle className="w-16 h-16 text-gray-500 dark:text-gray-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Subscription Cancelled
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Your subscription process was cancelled. Don't worry - no charges were made to your account.
          </p>

          <div className="space-y-4 mb-8">
            <Link to="/pricing">
              <Button variant="primary" className="w-full md:w-auto inline-flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pricing
              </Button>
            </Link>
            
            <div className="text-center">
              <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
                Continue with Free Plan
              </Link>
            </div>
          </div>
        </Card>

        {/* Why Upgrade Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Why Upgrade to Blueprint Pro?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default" className="p-6 text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 dark:text-blue-400 font-bold">∞</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Unlimited Projects
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Scale your business without limits. Create unlimited construction projects and track them all in one place.
              </p>
            </Card>

            <Card variant="default" className="p-6 text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 dark:text-green-400 font-bold">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Advanced Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get detailed insights into your project performance, profitability, and business growth.
              </p>
            </Card>

            <Card variant="default" className="p-6 text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Priority Support
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get faster responses and dedicated support when you need help with your projects.
              </p>
            </Card>
          </div>
        </div>

        {/* Common Concerns */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Common Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="default" className="p-6">
              <div className="flex items-start mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Can I cancel anytime?
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 ml-8">
                Yes! You can cancel your subscription at any time. You'll continue to have access to Pro features until your billing period ends.
              </p>
            </Card>

            <Card variant="default" className="p-6">
              <div className="flex items-start mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Is my payment information secure?
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 ml-8">
                Absolutely. We use Stripe for secure payment processing. Your payment information is encrypted and never stored on our servers.
              </p>
            </Card>

            <Card variant="default" className="p-6">
              <div className="flex items-start mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  What happens to my data?
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 ml-8">
                Your existing projects and data remain safe. You can continue using the free plan with access to your first 3 projects.
              </p>
            </Card>

            <Card variant="default" className="p-6">
              <div className="flex items-start mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Can I upgrade later?
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 ml-8">
                Of course! You can upgrade to Pro at any time from your dashboard or the pricing page.
              </p>
            </Card>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Have questions about our plans or need help with your account?
          </p>
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() => window.open('mailto:support@blueprint-saas.com', '_blank')}
            >
              Contact Support
            </Button>
            <Link to="/pricing">
              <Button variant="ghost">
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribeCancelPage;