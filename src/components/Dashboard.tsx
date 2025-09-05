import React from 'react';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Financial Insights at a Glance
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Get instant visibility into every project's financial health with comprehensive dashboards and real-time analytics
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-900">
            <h3 className="text-xl font-bold text-white mb-2">Project Financial Dashboard</h3>
            <p className="text-slate-300">Real-time overview of all active construction projects</p>
          </div>
          
          <div className="p-8">
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                  <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">+12%</span>
                </div>
                <p className="text-emerald-800 font-semibold text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-900">$8.2M</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">18.5%</span>
                </div>
                <p className="text-blue-800 font-semibold text-sm">Avg ROI</p>
                <p className="text-2xl font-bold text-blue-900">18.5%</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">7 Active</span>
                </div>
                <p className="text-purple-800 font-semibold text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-purple-900">12</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign className="w-8 h-8 text-orange-600" />
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">-8%</span>
                </div>
                <p className="text-orange-800 font-semibold text-sm">Cost Variance</p>
                <p className="text-2xl font-bold text-orange-900">$156K</p>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h4 className="text-lg font-bold text-slate-900 mb-4">Project Budget Overview</h4>
                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left p-4 font-semibold text-slate-800">Project</th>
                        <th className="text-left p-4 font-semibold text-slate-800">Budget</th>
                        <th className="text-left p-4 font-semibold text-slate-800">Spent</th>
                        <th className="text-left p-4 font-semibold text-slate-800">ROI</th>
                        <th className="text-left p-4 font-semibold text-slate-800">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-4 font-medium text-slate-900">Downtown Office Complex</td>
                        <td className="p-4 text-slate-600">$2.4M</td>
                        <td className="p-4 text-slate-600">$1.6M</td>
                        <td className="p-4 font-semibold text-emerald-600">22.5%</td>
                        <td className="p-4">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm font-medium">
                            On Track
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-4 font-medium text-slate-900">Residential Tower</td>
                        <td className="p-4 text-slate-600">$3.1M</td>
                        <td className="p-4 text-slate-600">$890K</td>
                        <td className="p-4 font-semibold text-blue-600">18.2%</td>
                        <td className="p-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                            Planning
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-4 font-medium text-slate-900">Shopping Center Renovation</td>
                        <td className="p-4 text-slate-600">$1.8M</td>
                        <td className="p-4 text-slate-600">$1.9M</td>
                        <td className="p-4 font-semibold text-orange-600">12.1%</td>
                        <td className="p-4">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium">
                            Over Budget
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-4">ROI Scenarios</h4>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-emerald-800">Bull Case</span>
                      <span className="text-2xl font-bold text-emerald-600">25.2%</span>
                    </div>
                    <div className="w-full bg-emerald-200 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-emerald-700 text-sm mt-2">Best case scenario</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-blue-800">Base Case</span>
                      <span className="text-2xl font-bold text-blue-600">18.5%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <p className="text-blue-700 text-sm mt-2">Expected outcome</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-orange-800">Bear Case</span>
                      <span className="text-2xl font-bold text-orange-600">12.8%</span>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-orange-700 text-sm mt-2">Conservative estimate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}