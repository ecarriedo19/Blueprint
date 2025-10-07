import { useNavigate } from 'react-router-dom';
import { Crown, ArrowRight, CheckCircle, Star, Zap } from 'lucide-react';
import Card from './Card';
import Button from './Button';

const ResubscribePage = () => {
  const navigate = useNavigate();

  const handleViewPlans = () => {
    navigate('/pricing');
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Advanced AI Document Analysis",
      description: "Instantly extract quotes and line items from any document"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Unlimited Projects & Quotes",
      description: "No limits on your project management capabilities"
    },
    {
      icon: <Crown className="w-5 h-5" />,
      title: "Priority Customer Support",
      description: "Get help when you need it with priority access to our team"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card variant="glass" className="text-center">
          <div className="mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-6">
              <div className="relative">
                <Crown className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                <div className="absolute -top-1 -right-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Welcome Back!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Thank you for being a valued Blueprint customer. Ready to unlock your Pro features again?
            </p>
          </div>

          <div className="mb-8">
            <div className="text-left space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                What you'll get back:
              </h3>
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                30-day money-back guarantee
              </span>
            </div>
          </div>

          <Button
            onClick={handleViewPlans}
            fullWidth
            variant="primary"
            size="lg"
            className="mb-6"
          >
            <Crown className="w-5 h-5" />
            View Plans & Resubscribe
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Pick up exactly where you left off. All your projects, quotes, and data are waiting for you.
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Questions about resubscribing?{' '}
            <a 
              href="mailto:support@blueprint.com" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contact our team
            </a>
          </p>
        </div>

        {/* Social Proof */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            "Blueprint transformed how we manage our construction projects"
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            - Sarah J., Project Manager
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResubscribePage;