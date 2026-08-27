import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';

const MEDAL_STYLES: Record<number, string> = {
  1: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  2: 'bg-slate-200 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300',
  3: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
};

// interfaces

interface RankBadgeProps {
  rank: number;
  className?: string;
}

export function RankBadge({ rank, className }: RankBadgeProps) {
  const medal = MEDAL_STYLES[rank];

  if (medal) {
    return (
      <span className={cn('flex size-8 items-center justify-center rounded-full font-bold', medal, className)}>
        <Award className="size-4" />
      </span>
    );
  }

  return (
    <span className={cn('flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground', className)}>
      {rank}
    </span>
  );
}
