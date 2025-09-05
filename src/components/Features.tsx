import React from 'react';
import { Calculator, TrendingUp, Users } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Calculator,
      title: 'Expense Planning',
      description: 'Track materials, labor, permits, and vendor costs in one place.',
      mockup: (
        <div className="bg-white rounded-lg shadow-lg p-4 border">
          <h4 className="font-semibold mb-3 text-slate-800">Project Expenses</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Materials</span>
              <span className="font-semibold text-slate-800">$890,000</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Labor</span>
              <span className="font-semibold text-slate-800">$450,000</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Permits</span>
              <span className="font-semibold text-slate-800">$25,000</span>
            </div>
            <div className="flex justify-between items-center py-2 font-semibold text-slate-900">
              <span>Total</span>
              <span>$1,365,000</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: TrendingUp,
      title: 'Revenue Planning',
      description: 'Forecast ROI and profitability scenarios with AI.',
      mockup: (
        <div className="bg-white rounded-lg shadow-lg p-4 border">
          <h4 className="font-semibold mb-3 text-slate-800">ROI Scenarios</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
              <span className="font-medium text-emerald-800">Bull Case</span>
              <span className="font-bold text-emerald-600">22.5%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-blue-800">Base Case</span>
              <span className="font-bold text-blue-600">18.5%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="font-medium text-orange-800">Bear Case</span>
              <span className="font-bold text-orange-600">14.2%</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Users,
      title: 'Headcount & Contractor Planning',
      description: 'Compare vendor bids and allocate labor efficiently.',
      mockup: (
        <div className="bg-white rounded-lg shadow-lg p-4 border">
          <h4 className="font-semibold mb-3 text-slate-800">Vendor Comparison</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div>
                <span className="font-medium text-green-800 block">Vendor A</span>
                <span className="text-green-600 text-sm">Recommended</span>
              </div>
              <span className="font-bold text-green-600">$320,000</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="font-medium text-slate-800 block">Vendor B</span>
                <span className="text-slate-600 text-sm">12% higher</span>
              </div>
              <span className="font-bold text-slate-600">$358,400</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Everything you need for construction FP&A
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Plan, track, and optimize every aspect of your construction projects with AI-powered insights
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group hover:transform hover:-translate-y-2 transition-all duration-300"
            >
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 h-full border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
                <div className="mt-6">
                  {feature.mockup}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}