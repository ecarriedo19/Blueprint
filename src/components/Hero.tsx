import React from 'react';
import { ArrowRight, Play } from 'lucide-react';

interface HeroProps {
  onAuthClick: () => void;
}

export default function Hero({ onAuthClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
      
      {/* Added pt-16 (padding-top) to this container to make space for the logo */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 pt-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                AI-powered FP&A for{' '}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Construction Companies
                </span>
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl">
                Know your costs, ROI, and profitability before breaking ground.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={onAuthClick}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border border-slate-600 hover:border-slate-400 text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition-all duration-300 hover:bg-slate-800/50">
                <Play className="w-5 h-5" />
                View Demo
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-slate-700/50">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Project Dashboard</h3>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-lg p-4">
                    <p className="text-emerald-400 text-sm">Total Budget</p>
                    <p className="text-2xl font-bold text-white">$2.4M</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-blue-400 text-sm">Projected ROI</p>
                    <p className="text-2xl font-bold text-white">18.5%</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                    <p className="text-purple-400 text-sm">Completion</p>
                    <p className="text-2xl font-bold text-white">67%</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Recent AI Insights</h4>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <p className="text-slate-300 text-sm">
                      🤖 Vendor A saves 12% vs Vendor B for concrete supplies. 
                      <span className="text-emerald-400 font-medium"> Recommended: Switch to Vendor A</span>
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <p className="text-slate-300 text-sm">
                      📊 Labor costs trending 8% above budget. 
                      <span className="text-yellow-400 font-medium"> Review contractor allocation</span>
                    </p>
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