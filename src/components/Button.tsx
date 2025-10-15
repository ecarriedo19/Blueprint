import React, { useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { hoverScale } from '../utils/animations';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  onClick,
  ...props 
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ripple = { x, y, id: Date.now() };
    setRipples((prev) => [...prev, ripple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 600);

    onClick?.(e);
  };

  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md focus:ring-2 focus:ring-ring focus:ring-offset-2',
    secondary: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border shadow-sm hover:shadow-md focus:ring-2 focus:ring-ring focus:ring-offset-2',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-background focus:ring-2 focus:ring-ring focus:ring-offset-2',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted focus:ring-2 focus:ring-ring focus:ring-offset-2',
    destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm hover:shadow-md focus:ring-2 focus:ring-ring focus:ring-offset-2',
    success: 'bg-success hover:bg-success/90 text-success-foreground shadow-sm hover:shadow-md focus:ring-2 focus:ring-ring focus:ring-offset-2',
    gradient: 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-sm hover:shadow-md focus:ring-2 focus:ring-ring focus:ring-offset-2',
  };

  const sizeClasses = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
    xl: 'px-10 py-4 text-xl',
  };

  const widthClasses = fullWidth ? 'w-full' : '';
  const isDisabled = disabled || loading;

  return (
    <motion.button
      {...props}
      {...hoverScale}
      disabled={isDisabled}
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`}
    >
      {/* Ripple effect */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '20px',
            height: '20px',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Content */}
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <motion.span
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <motion.span
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.span>
          )}
        </>
      )}
    </motion.button>
  );
};

export default Button;
