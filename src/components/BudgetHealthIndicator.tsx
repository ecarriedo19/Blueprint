import React from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import type { BudgetSummary } from '../utils/queries';

interface BudgetHealthIndicatorProps {
  summary: BudgetSummary;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const BudgetHealthIndicator: React.FC<BudgetHealthIndicatorProps> = ({ 
  summary, 
  size = 'md',
  showDetails = true
}) => {
  const {
    totalBudget,
    totalActual,
    totalVariance,
    variancePercent,
    budgetHealth
  } = summary;

  // Calculate percentage spent
  const percentageSpent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  // Determine colors based on budget health
  const getHealthColor = () => {
    switch (budgetHealth) {
      case 'healthy':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500',
          text: 'text-green-400',
          ring: 'stroke-green-500',
          icon: TrendingUp
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500',
          text: 'text-yellow-400',
          ring: 'stroke-yellow-500',
          icon: Activity
        };
      case 'critical':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500',
          text: 'text-red-400',
          ring: 'stroke-red-500',
          icon: AlertTriangle
        };
      default:
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500',
          text: 'text-blue-400',
          ring: 'stroke-blue-500',
          icon: Activity
        };
    }
  };

  const colors = getHealthColor();
  const Icon = colors.icon;

  // Size configurations
  const sizeConfig = {
    sm: {
      circle: 80,
      strokeWidth: 8,
      textSize: 'text-lg',
      iconSize: 'w-4 h-4',
      padding: 'p-3'
    },
    md: {
      circle: 120,
      strokeWidth: 10,
      textSize: 'text-2xl',
      iconSize: 'w-5 h-5',
      padding: 'p-4'
    },
    lg: {
      circle: 160,
      strokeWidth: 12,
      textSize: 'text-3xl',
      iconSize: 'w-6 h-6',
      padding: 'p-6'
    }
  };

  const config = sizeConfig[size];
  const radius = (config.circle - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(percentageSpent, 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`flex flex-col items-center ${config.padding}`}>
      {/* Circular Progress Indicator */}
      <div className="relative">
        <svg width={config.circle} height={config.circle} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={radius}
            className="stroke-slate-700/30"
            strokeWidth={config.strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={radius}
            className={colors.ring}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out'
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`${config.iconSize} ${colors.text} mb-1`} />
          <div className={`${config.textSize} font-bold ${colors.text}`}>
            {percentageSpent.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-400">Spent</div>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="mt-4 w-full space-y-2">
          {/* Budget Status Badge */}
          <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${colors.bg} border ${colors.border}`}>
            <span className={`text-sm font-semibold ${colors.text} capitalize`}>
              {budgetHealth === 'healthy' && 'Under Budget'}
              {budgetHealth === 'warning' && 'Budget Warning'}
              {budgetHealth === 'critical' && 'Over Budget'}
            </span>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Budget:</span>
              <span className="font-semibold">
                ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Actual:</span>
              <span className="font-semibold">
                ${totalActual.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className={`flex justify-between font-semibold pt-1 border-t border-slate-700/50 ${colors.text}`}>
              <span>Variance:</span>
              <span className="flex items-center gap-1">
                {totalVariance >= 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                ${Math.abs(totalVariance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs">({variancePercent.toFixed(1)}%)</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetHealthIndicator;

