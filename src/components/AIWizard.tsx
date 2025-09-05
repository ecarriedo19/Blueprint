import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';

export default function AIWizard() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <span className="text-purple-400 font-semibold">AI Copilot</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold">
                An AI Copilot for Project Profitability
              </h2>
              <div className="space-y-4 text-lg text-slate-300">
                <p>Use AI to estimate profitability, compare vendors, and uncover risks instantly.</p>
                <p>Ask a question, get AI-driven insights for your project in seconds.</p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-slate-700/50">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
                <MessageCircle className="w-6 h-6 text-blue-400" />
                <span className="text-white font-semibold">AI Assistant</span>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-300 text-sm mb-2">You:</p>
                  <p className="text-white">"Which vendor should I choose for concrete supplies?"</p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-blue-400 text-sm mb-2">AI Assistant:</p>
                  <div className="text-white space-y-2">
                    <p><strong>Recommendation:</strong> Choose Vendor A</p>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p>• 12% cost savings vs Vendor B ($38,400 saved)</p>
                      <p>• Better delivery timeline (2 weeks faster)</p>
                      <p>• Higher quality rating (4.8/5 vs 4.2/5)</p>
                      <p>• Lower risk profile based on past projects</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-300 text-sm mb-2">You:</p>
                  <p className="text-white">"What are the main cost risks for this project?"</p>
                </div>
                
                <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-lg p-4">
                  <p className="text-orange-400 text-sm mb-2">AI Assistant:</p>
                  <div className="text-white text-sm space-y-1">
                    <p><strong>Top 3 Risk Factors:</strong></p>
                    <p>1. Steel prices volatile (+15% risk)</p>
                    <p>2. Weather delays possible (Q4 timeline)</p>
                    <p>3. Permit approval pending (2-week buffer needed)</p>
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