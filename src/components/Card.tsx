import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass' | 'bordered' | 'glow';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  clickable?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'lg',
  hover = false,
  glow = false,
  clickable = false,
  ...props
}) => {
  const baseClasses = 'rounded-lg transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-card border border-border',
    gradient: 'bg-gradient-to-br from-background to-muted/50 border border-border',
    glass: 'bg-background/95 border border-border/50 backdrop-blur-sm',
    bordered: 'bg-card border-2 border-primary/20 hover:border-primary/40',
    glow: 'bg-card border border-primary/30 shadow-lg shadow-primary/10',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6', 
    lg: 'p-6',
    xl: 'p-8',
  };

  const hoverClasses = hover ? 'hover:shadow-md hover:border-primary/20' : '';
  const clickableClasses = clickable ? 'cursor-pointer' : '';
  const glowClasses = glow ? 'hover:shadow-lg hover:shadow-primary/20' : '';

  const motionProps = hover 
    ? { whileHover: { y: -2 }, transition: { duration: 0.2 } }
    : {};

  return (
    <motion.div
      {...props}
      {...motionProps}
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClasses} ${clickableClasses} ${glowClasses} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default Card;
