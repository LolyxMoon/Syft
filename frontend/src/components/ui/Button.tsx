import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'shimmer';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'font-medium rounded-md transition-all duration-200 inline-flex items-center justify-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-black border-transparent font-semibold [&>*]:text-black',
    secondary: 'bg-neutral-800 hover:bg-neutral-700 text-neutral-50 border-neutral-700',
    outline: 'bg-transparent hover:bg-neutral-900 text-neutral-50 border-default hover:border-hover',
    ghost: 'bg-transparent hover:bg-neutral-900 text-neutral-300 hover:text-neutral-50 border-transparent',
    gradient: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-black border-transparent font-semibold [&>*]:text-black',
    shimmer: '', // Special handling below
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-2.5 text-base',
    xl: 'px-6 py-3 text-lg',
  };
  
  const MotionButton = motion.button as any;
  
  // Special rendering for shimmer variant
  if (variant === 'shimmer') {
    return (
      <MotionButton
        whileHover={{ scale: disabled || isLoading ? 1 : 1.05 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={clsx(
          'group isolate inline-flex cursor-pointer overflow-hidden transition-all duration-300 rounded-full relative',
          'hover:shadow-[0_0_40px_8px_rgba(220,232,93,0.35)] shadow-[0_8px_40px_rgba(220,232,93,0.25)]',
          disabled && 'opacity-50 cursor-not-allowed',
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Outer rotating gradient border layer */}
        <div className="absolute inset-0">
          <div 
            className="absolute w-[400%] h-[400%] animate-spin-slow"
            style={{
              inset: '-200%',
            }}
          >
            <div 
              className="absolute inset-0"
              style={{
                background: 'conic-gradient(from calc(270deg - 45deg), transparent 0, rgba(255,255,255,0.6) 90deg, transparent 90deg)'
              }}
            />
          </div>
        </div>
        
        {/* Middle background layer */}
        <div 
          className="absolute rounded-full backdrop-blur"
          style={{
            background: 'rgba(220, 232, 93, 0.1)',
            inset: '1px'
          }}
        />
        
        {/* Content container */}
        <div className={clsx(
          'z-10 flex gap-3 overflow-hidden text-base font-medium text-white w-full relative items-center rounded-full',
          sizes[size]
        )}>
          {/* Inner rotating shimmer effect */}
          <div 
            className="absolute pointer-events-none"
            style={{
              content: ' ',
              display: 'block',
              width: '200%',
              height: '200%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), transparent)',
              animation: 'rotate-gradient 4s infinite linear',
              top: '50%',
              left: '50%',
            }}
          />
          
          {/* Dark background overlay */}
          <div 
            className="absolute rounded-full"
            style={{
              inset: '1px',
              background: 'rgba(10, 11, 20, 0.8)',
              backdropFilter: 'blur(8px)'
            }}
          />
          
          {/* Button content */}
          {isLoading ? (
            <span className="relative z-10"><LoadingSpinner size="sm" /></span>
          ) : (
            <>
              {leftIcon && <span className="relative z-10">{leftIcon}</span>}
              <span className="whitespace-nowrap relative z-10">{children}</span>
              {rightIcon && (
                <span className="inline-flex items-center justify-center z-10 bg-white/10 w-7 h-7 rounded-full ml-1 relative">
                  {rightIcon}
                </span>
              )}
            </>
          )}
        </div>
      </MotionButton>
    );
  }
  
  return (
    <MotionButton
      whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.99 }}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </MotionButton>
  );
};

const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'h-3 w-12',
    md: 'h-4 w-16',
    lg: 'h-5 w-20',
  };
  
  return (
    <div className={clsx('bg-gray-300/30 rounded animate-pulse', sizes[size])} />
  );
};
