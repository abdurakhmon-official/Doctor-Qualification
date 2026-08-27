import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const ACCENT_STYLES = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
} as const;

// interfaces

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: keyof typeof ACCENT_STYLES;
}

export function StatCard({ icon: Icon, label, value, accent = 'primary' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', ACCENT_STYLES[accent])}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-tight text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
