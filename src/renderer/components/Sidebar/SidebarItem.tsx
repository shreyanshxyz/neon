import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export default function SidebarItem({ icon, label, active, onClick }: SidebarItemProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left justify-start',
        active 
          ? 'bg-accent-primary/20 text-text-primary' 
          : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}
