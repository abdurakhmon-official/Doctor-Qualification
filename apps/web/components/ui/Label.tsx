import { cn } from '@/lib/utils';

// interfaces

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('text-sm font-medium leading-none', className)} {...props} />;
}
