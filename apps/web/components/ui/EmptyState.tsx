import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// interfaces

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 py-12 text-center', className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
