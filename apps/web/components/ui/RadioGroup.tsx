import { cn } from '@/lib/utils';

// interfaces

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  value: string | undefined;
  options: RadioOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function RadioGroup({ name, value, options, onChange, className }: RadioGroupProps) {
  return (
    <div role="radiogroup" className={cn('flex flex-col gap-2', className)}>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-accent',
            value === option.value && 'border-primary bg-accent',
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4 w-4 accent-primary"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
