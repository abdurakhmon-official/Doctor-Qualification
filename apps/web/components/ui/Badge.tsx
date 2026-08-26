import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'bg-accent text-accent-foreground',
      success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
      danger: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
    },
  },
  defaultVariants: { variant: 'default' },
});

// interfaces

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
