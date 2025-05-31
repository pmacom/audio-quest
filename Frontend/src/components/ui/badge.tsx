import React from 'react';

interface BadgeProps {
  variant?: 'default' | 'outline';
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors';
  const variantStyles = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    outline: 'border border-slate-700 text-slate-200 hover:bg-slate-800/50'
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
} 