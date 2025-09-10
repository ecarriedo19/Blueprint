import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  gradient?: boolean;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  size = 'lg',
  gradient = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: {
      title: 'text-2xl',
      subtitle: 'text-base',
      spacing: 'mb-4'
    },
    md: {
      title: 'text-3xl',
      subtitle: 'text-lg',
      spacing: 'mb-6'
    },
    lg: {
      title: 'text-4xl lg:text-5xl',
      subtitle: 'text-xl',
      spacing: 'mb-8'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`${currentSize.spacing} ${className}`}>
      <h1 className={`${currentSize.title} font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent mb-3 leading-tight`}>
        {title}
      </h1>
      {subtitle && (
        <p className={`${currentSize.subtitle} text-gray-600 dark:text-slate-300 mb-4 max-w-2xl`}>
          {subtitle}
        </p>
      )}
      {gradient && (
        <div className="relative">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-80"></div>
          <div className="absolute -top-0.5 left-0 h-2 w-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-sm opacity-60"></div>
        </div>
      )}
    </div>
  );
};

export default PageHeader;
