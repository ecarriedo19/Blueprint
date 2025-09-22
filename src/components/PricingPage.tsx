import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Toast from './Toast';

interface PricingTier {
  id: string;
  name: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  description: string;
}

const PricingPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  // Pricing tiers configuration matching the landing page
  const pricingTiers: PricingTier[] = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPriceId: 'price_1S9YeYIW8jxYGd3BQUJpvETB',
      yearlyPriceId: 'price_1S9YeYIW8jxYGd3BQUJpvETB', // Using monthly for now
      monthlyPrice: '$59',
      yearlyPrice: '$590',
      description: 'For small contractors starting with AI planning',
      features: [
        '1 user',
        '2 projects',
        'QuickBooks + Google Sheets integration',
        'Basic forecasts',
        'Email support'
      ],
      buttonText: 'Start Free Trial',
      highlighted: false
    },
    {
      id: 'professional',
      name: 'Professional',
      monthlyPriceId: 'price_1S9Yf3IW8jxYGd3BYjYttBj6',
      yearlyPriceId: 'price_1S9Yf3IW8jxYGd3BYjYttBj6', // Using monthly for now
      monthlyPrice: '$179',
      yearlyPrice: '$1790',
      description: 'For growing construction companies',
      features: [
        '5 users',
        'Unlimited projects',
        'All integrations (QuickBooks, Xero, Stripe, Google Sheets, Salesforce)',
        'Advanced AI vendor recommendations',
        'Revenue forecasting dashboards',
        'Priority support'
      ],
      buttonText: 'Start Free Trial',
      highlighted: true
    }
  ];

  const handleSubscribe = async (tier: PricingTier) => {
    if (tier.id === 'enterprise') {
      // For enterprise, redirect to contact or external form
      window.open('mailto:sales@blueprint-saas.com?subject=Enterprise Inquiry', '_blank');
      return;
    }

    setLoading(tier.id);

    try {
      const priceId = isYearly ? tier.yearlyPriceId : tier.monthlyPriceId;
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          priceId: priceId
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout using direct URL navigation
      if (data.url) {
        // Use the checkout URL returned from the server
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from server');
      }

    } catch (error: any) {
      console.error('Subscription error:', error);
      setToast({ 
        message: error.message || 'Failed to start subscription process', 
        type: 'error' 
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 pt-24">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-12">
            Choose the perfect plan for your construction company
          </p>

          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center mb-12">
            <span className={`mr-3 text-lg ${!isYearly ? 'text-white font-semibold' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-blue-600' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 text-lg ${isYearly ? 'text-white font-semibold' : 'text-slate-400'}`}>
              Yearly
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border transition-all duration-300 hover:scale-105 ${
                tier.highlighted 
                  ? 'border-blue-500/50 ring-2 ring-blue-500/20' 
                  : 'border-slate-700/50 hover:border-slate-600/50'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tier.name}
                </h3>
                <p className="text-slate-400 mb-6">
                  {tier.description}
                </p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">
                    {isYearly ? tier.yearlyPrice : tier.monthlyPrice}
                  </span>
                  {tier.monthlyPrice !== 'Custom' && (
                    <span className="text-slate-400 ml-2">
                      /{isYearly ? 'year' : 'month'}
                    </span>
                  )}
                </div>

                <ul className="space-y-4 mb-8 text-left">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier)}
                  disabled={loading === tier.id}
                  className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                      : 'border border-slate-600 hover:border-slate-400 text-white hover:bg-slate-800/50'
                  }`}
                >
                  {loading === tier.id ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    tier.buttonText
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12">
          <p className="text-slate-400 text-sm">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Questions about our pricing?{' '}
            <button 
              onClick={() => window.open('mailto:support@blueprint-saas.com', '_blank')}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Contact our team
            </button>
          </p>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => setToast(null)}
        />
      )}
    </section>
  );
};

export default PricingPage;