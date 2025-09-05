import React from 'react';
import { Zap } from 'lucide-react';

export default function Integrations() {
  const integrations = [
    { name: 'QuickBooks', logo: 'QB' },
    { name: 'Xero', logo: 'X' },
    { name: 'Stripe', logo: 'S' },
    { name: 'Google Sheets', logo: 'GS' },
    { name: 'Salesforce', logo: 'SF' },
    { name: 'Slack', logo: 'SL' }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
            <h2 className="text-4xl font-bold text-slate-900">
              From Data to Decision in Minutes
            </h2>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Connect QuickBooks, Xero, Stripe, Google Sheets, and more. 
            Seamlessly sync your existing financial data and start getting insights immediately.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="group flex flex-col items-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3">
                {integration.logo}
              </div>
              <span className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                {integration.name}
              </span>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Enterprise-Grade Security & Compliance
            </h3>
            <p className="text-slate-600 mb-6">
              Your financial data is protected with bank-level encryption, SOC 2 compliance, 
              and secure API connections. We never store sensitive information.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                SOC 2 Certified
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                256-bit Encryption
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                GDPR Compliant
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                99.9% Uptime
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}