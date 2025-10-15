import React from 'react';

interface SkeletonCardProps {
  className?: string;
  variant?: 'card' | 'stat' | 'chart' | 'text';
  rows?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ 
  className = '', 
  variant = 'card',
  rows = 3
}) => {
  const renderContent = () => {
    switch (variant) {
      case 'stat':
        return (
          <>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20 mb-3"></div>
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
          </>
        );
      
      case 'chart':
        return (
          <>
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32 mb-4"></div>
            <div className="flex items-end gap-2 h-40">
              {[60, 80, 50, 90, 70, 85].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-t"
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
          </>
        );
      
      case 'text':
        return (
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
                {i < rows - 1 && <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/5"></div>}
              </div>
            ))}
          </div>
        );
      
      default: // card
        return (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-5/6"></div>
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-4/6"></div>
            </div>
          </>
        );
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 ${className}`}>
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-slate-600/10 to-transparent"></div>
      
      {/* Content skeleton */}
      <div className="relative animate-pulse">
        {renderContent()}
      </div>
    </div>
  );
};

export default SkeletonCard;

