import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import Button from '../Button';
import { useSubscriptionDetails } from '../../utils/queries';

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  subscriptionStatus?: string;
}

interface BillingPageProps {
  currentUser: User;
}

const BillingPage = ({ currentUser }: BillingPageProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch subscription details for active users
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useSubscriptionDetails();

  // Get subscription status and details
  const subscriptionStatus = currentUser?.subscriptionStatus || 'free';
  const hasActiveSubscription = subscriptionStatus === 'active';
  const isPastDue = subscriptionStatus === 'past_due';
  const isCanceled = subscriptionStatus === 'canceled';
  const isFreeUser = subscriptionStatus === 'free';

  // Handle upgrade click for free users
  const handleUpgradeClick = () => {
    navigate('/pricing');
  };

  // Handle manage subscription click for paid users
  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Check if response is JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }

      if (response.ok && data.success) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open billing portal');
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-700 font-medium">Success</p>
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Render view for FREE users */}
      {isFreeUser ? (
        <div className="space-y-6">
          {/* Current Plan - Free */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Current Plan</h3>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                Free Plan
              </span>
            </div>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You're currently on the free plan with limited features.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Included:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 3 Projects</li>
                    <li>• 10 Quotes per month</li>
                    <li>• Basic reporting</li>
                    <li>• Email support</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Upgrade for:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Unlimited projects & quotes</li>
                    <li>• Advanced financial tracking</li>
                    <li>• Team collaboration</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-6">
            <div className="text-center">
              <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Ready to Unlock Full Features?
              </h3>
              <p className="text-muted-foreground mb-6">
                Upgrade to Blueprint Pro and get unlimited access to all construction management tools.
              </p>
              
              <Button
                onClick={handleUpgradeClick}
                size="lg"
                className="w-full sm:w-auto"
              >
                View Pricing Plans
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Render view for PAID users (active, past_due, canceled) */
        <div className="space-y-6">
          {/* Current Plan Display for Paid Users */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Current Plan</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                hasActiveSubscription 
                  ? 'bg-green-100 text-green-800' 
                  : isPastDue 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {hasActiveSubscription ? 'Active' : isPastDue ? 'Past Due' : 'Canceled'}
              </span>
            </div>
            
            {isLoadingSubscription ? (
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium text-foreground">
                    {subscriptionData?.planName || 'Blueprint Pro'}
                  </p>
                </div>
                
                {subscriptionData?.subscription?.amount && (
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium text-foreground">
                      ${(subscriptionData.subscription.amount / 100).toFixed(2)} / {subscriptionData.subscription.interval || 'month'}
                    </p>
                  </div>
                )}
                
                {subscriptionData?.subscription?.current_period_end && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isCanceled ? 'Expires' : 'Next billing date'}
                    </p>
                    <p className="font-medium text-foreground">
                      {new Date(subscriptionData.subscription.current_period_end * 1000).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subscription Management for Paid Users */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Manage Subscription
            </h3>
            <p className="text-muted-foreground mb-6">
              Update your payment method, view billing history, or manage your subscription settings.
            </p>
            
            <Button
              onClick={handleManageSubscription}
              disabled={isLoading}
              loading={isLoading}
            >
              <CreditCard className="w-4 h-4" />
              Open Billing Portal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;