import * as React from 'react';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'vertical' | 'horizontal' | 'both';
}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className, orientation = 'vertical' }, ref) => {
    const orientationClasses = {
      vertical: 'overflow-y-auto',
      horizontal: 'overflow-x-auto',
      both: 'overflow-auto',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent',
          orientationClasses[orientation],
          className
        )}
      >
        {children}
      </div>
    );
  }
);
ScrollArea.displayName = 'ScrollArea';
