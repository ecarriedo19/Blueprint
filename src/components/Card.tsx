import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glass';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'glass',
  padding = 'lg',
  hover = true
}) => {
  const baseClasses = 'rounded-2xl border transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-slate-700/50 border-slate-600/50 backdrop-blur-sm shadow-xl',
    gradient: 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm shadow-2xl',
    glass: 'bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl hover:bg-white/10 hover:border-white/20'
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6', 
    lg: 'p-8'
  };

  const hoverClasses = hover ? 'hover:scale-[1.02] hover:shadow-3xl' : '';

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
