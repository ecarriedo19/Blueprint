import { useState } from 'react';
import { CreditCard, AlertCircle, ArrowRight, Shield, Clock } from 'lucide-react';
import Card from './Card';
import Button from './Button';

const UpdatePaymentPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdatePayment = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open payment portal. Please try again.');
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
      setError('Something went wrong. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card variant="glass" className="text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Issue Detected
            </h1>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              It looks like there was an issue processing your recent payment. Don't worry – this happens sometimes with expired cards or insufficient funds.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm text-left">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Secure Payment Portal</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Powered by Stripe's secure infrastructure</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">Quick Resolution</p>
                <p className="text-xs text-green-700 dark:text-green-300">Takes less than 2 minutes to update</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleUpdatePayment}
            loading={isLoading}
            fullWidth
            variant="primary"
            size="lg"
            className="mb-6"
          >
            <CreditCard className="w-5 h-5" />
            Update Payment Method
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              You'll be securely redirected to Stripe to update your payment information. 
              Once updated, your access will be restored immediately.
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact our support team at{' '}
            <a 
              href="mailto:support@blueprint.com" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              support@blueprint.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpdatePaymentPage;