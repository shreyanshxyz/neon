import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-accent-primary/20 text-accent-primary',
    secondary: 'bg-bg-tertiary text-text-secondary',
    outline: 'border border-border text-text-muted',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
