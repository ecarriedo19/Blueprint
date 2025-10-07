import React from 'react';
import { X, CheckCircle, FolderPlus, BarChart3, Settings, ArrowRight } from 'lucide-react';
import Card from './Card';
import Button from './Button';

interface SubscriptionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

const SubscriptionSuccessModal: React.FC<SubscriptionSuccessModalProps> = ({
  isOpen,
  onClose,
  sessionId
}) => {
  if (!isOpen) return null;

  const whatsNextItems = [
    {
      icon: FolderPlus,
      title: 'Create Your First Project',
      description: 'Set up a new construction project with detailed budgeting and tracking.',
      link: '/projects',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BarChart3,
      title: 'Explore Advanced Reporting',
      description: 'Access detailed insights and analytics for your business.',
      link: '/reports',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Settings,
      title: 'Set Up Team Access',
      description: 'Invite team members and configure project permissions.',
      link: '/settings?tab=team',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const handleItemClick = (link: string) => {
    window.location.href = link;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <Card 
        variant="glass" 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        hover={false}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4">
            🎉 Subscription Successful!
          </h1>
          
          <p className="text-xl text-slate-300 mb-2">
            Welcome to Blueprint Pro!
          </p>
          
          <p className="text-slate-400">
            You now have access to all premium features to help grow your construction business.
          </p>

          {sessionId && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <p className="text-sm text-slate-400">
                Transaction ID: <span className="font-mono text-slate-300">{sessionId.slice(-12)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Pro Features Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">∞</span>
            </div>
            <h3 className="font-semibold text-white mb-1">Unlimited Projects</h3>
            <p className="text-sm text-slate-400">Create as many projects as you need</p>
          </div>

          <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-1">Advanced Analytics</h3>
            <p className="text-sm text-slate-400">Detailed insights and reporting</p>
          </div>

          <div className="text-center p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-semibold text-white mb-1">Priority Support</h3>
            <p className="text-sm text-slate-400">Get help when you need it most</p>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            What's Next?
          </h2>
          
          <div className="space-y-4">
            {whatsNextItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item.link)}
                  className="w-full p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${item.color} bg-opacity-20`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-white group-hover:text-blue-200 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {item.description}
                      </p>
                    </div>
                    
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button
            onClick={onClose}
            variant="primary"
            className="w-full md:w-auto px-8"
          >
            Get Started
          </Button>
          
          <p className="text-slate-400 text-sm">
            Ready to transform your construction business? Let's build something amazing together! 🚀
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionSuccessModal;