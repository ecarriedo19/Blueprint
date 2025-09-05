import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import StripeCheckout from './StripeCheckout';

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const plans = [
    {
      name: 'Starter',
      description: 'For small contractors starting with AI planning',
      price: isYearly ? 49 : 59,
      yearlyPrice: 49,
      monthlyPrice: 59,
      features: [
        '1 user',
        '2 projects',
        'QuickBooks + Google Sheets integration',
        'Basic forecasts',
        'Email support'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Professional',
      description: 'For growing construction companies',
      price: isYearly ? 149 : 179,
      yearlyPrice: 149,
      monthlyPrice: 179,
      features: [
        '5 users',
        'Unlimited projects',
        'All integrations (QuickBooks, Xero, Stripe, Google Sheets, Salesforce)',
        'Advanced AI vendor recommendations',
        'Revenue forecasting dashboards',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large firms with complex needs',
      price: 'Custom',
      features: [
        'Unlimited users',
        'AI benchmarks (labor + neighborhood costs)',
        'Dedicated support & onboarding',
        'API access + custom integrations',
        'Advanced security features',
        'Custom reporting'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const handlePricingClick = (planName: string) => {
    const plan = plans.find(p => p.name === planName);
    if (planName === 'Enterprise') {
      // Handle contact sales
      window.location.href = 'mailto:sales@blueprintfpa.com?subject=Enterprise Inquiry';
    } else {
      setSelectedPlan(plan);
      setIsCheckoutOpen(true);
    }
  };

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false);
    setSelectedPlan(null);
  };

  return (
    <section className="py-20 bg-slate-50">
      <StripeCheckout 
        isOpen={isCheckoutOpen}
        onClose={handleCheckoutClose}
        selectedPlan={selectedPlan}
        isYearly={isYearly}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Choose the perfect plan for your construction company
          </p>
          
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${!isYearly ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${isYearly ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="ml-3 bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                Save 20%
              </span>
            )}
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg border ${
                plan.popular ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'
              } hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-600">{plan.description}</p>
                </div>
                
                <div className="mb-6">
                  {typeof plan.price === 'number' ? (
                    <div>
                      <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                      <span className="text-slate-600 ml-2">
                        /{isYearly ? 'month' : 'month'}
                      </span>
                      {isYearly && (
                        <div className="text-sm text-slate-500 mt-1">
                          Billed annually (${plan.price * 12})
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  )}
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handlePricingClick(plan.name)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-sm text-slate-500">
            Questions about our pricing? <a href="mailto:support@blueprintfpa.com" className="text-blue-600 hover:text-blue-700 font-medium">Contact our team</a>
          </p>
        </div>
      </div>
    </section>
  );
}