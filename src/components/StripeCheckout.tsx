import React, { useState } from 'react';
import { ArrowLeft, Check, CreditCard, Shield, Lock } from 'lucide-react';

interface StripeCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: {
    name: string;
    description: string;
    price: number | string;
    yearlyPrice?: number;
    monthlyPrice?: number;
    features: string[];
  } | null;
  isYearly: boolean;
}

export default function StripeCheckout({ isOpen, onClose, selectedPlan, isYearly }: StripeCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    billingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  if (!isOpen || !selectedPlan) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would integrate with Stripe
    console.log('Processing payment for:', selectedPlan.name);
    alert('Payment processing would happen here with Stripe integration');
  };

  const formatPrice = () => {
    if (typeof selectedPlan.price === 'string') return selectedPlan.price;
    return `$${selectedPlan.price}`;
  };

  const calculateTotal = () => {
    if (typeof selectedPlan.price === 'string') return 'Custom';
    const price = selectedPlan.price;
    const tax = price * 0.08; // 8% tax
    return `$${(price + tax).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="grid lg:grid-cols-2">
          {/* Left Side - Order Summary */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 border-r border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Complete Your Order</h2>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedPlan.name}</h3>
              <p className="text-slate-600 mb-4">{selectedPlan.description}</p>
              
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                <span className="text-slate-700">
                  {selectedPlan.name} Plan ({isYearly ? 'Yearly' : 'Monthly'})
                </span>
                <span className="text-xl font-bold text-slate-900">
                  {formatPrice()}{typeof selectedPlan.price === 'number' && `/${isYearly ? 'year' : 'month'}`}
                </span>
              </div>

              {isYearly && typeof selectedPlan.price === 'number' && (
                <div className="flex items-center justify-between mb-4 text-sm">
                  <span className="text-green-600">Annual discount (20% off)</span>
                  <span className="text-green-600 font-medium">
                    -${((selectedPlan.monthlyPrice || selectedPlan.price) * 12 - selectedPlan.price * 12).toFixed(2)}
                  </span>
                </div>
              )}

              {typeof selectedPlan.price === 'number' && (
                <>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="text-slate-700">{formatPrice()}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <span className="text-slate-600">Tax (8%)</span>
                    <span className="text-slate-700">${(selectedPlan.price * 0.08).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-lg font-bold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-slate-900">{calculateTotal()}</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">What's included:</h4>
              <ul className="space-y-3">
                {selectedPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">14-Day Free Trial</span>
              </div>
              <p className="text-sm text-blue-700">
                Start your free trial today. Cancel anytime during the trial period with no charges.
              </p>
            </div>
          </div>

          {/* Right Side - Payment Form */}
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Information</h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Lock className="w-4 h-4" />
                <span>Secured by Stripe • SSL Encrypted</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === 'paypal'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    PayPal
                  </button>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      name="nameOnCard"
                      value={formData.nameOnCard}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Billing Address</h4>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="billingAddress"
                    value={formData.billingAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Street Address"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="City"
                      required
                    />
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="State"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="ZIP Code"
                      required
                    />
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-slate-800">Secure Payment</span>
                </div>
                <p className="text-sm text-slate-600">
                  Your payment information is encrypted and processed securely by Stripe. 
                  We never store your card details.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                {typeof selectedPlan.price === 'string' 
                  ? 'Contact Sales' 
                  : `Start Free Trial - ${formatPrice()}/${isYearly ? 'year' : 'month'}`
                }
              </button>

              <div className="text-center">
                <p className="text-xs text-slate-500">
                  By completing this purchase, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
                </p>
              </div>
            </form>
          </div>

          {/* Right Side - Plan Details */}
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Plan Summary</h3>
              
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{selectedPlan.name}</h4>
                    <p className="text-slate-600">{selectedPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{formatPrice()}</div>
                    {typeof selectedPlan.price === 'number' && (
                      <div className="text-sm text-slate-600">per {isYearly ? 'year' : 'month'}</div>
                    )}
                  </div>
                </div>

                {isYearly && typeof selectedPlan.price === 'number' && (
                  <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                    💰 Save 20% with annual billing
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900">Features included:</h4>
                <ul className="space-y-3">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h4 className="font-medium text-slate-800 mb-2">What happens next?</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <p>1. Start your 14-day free trial immediately</p>
                <p>2. Get onboarding email with setup instructions</p>
                <p>3. Connect your existing financial tools</p>
                <p>4. Begin getting AI-powered insights</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
              <span>Powered by</span>
              <div className="font-bold text-slate-700">stripe</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}