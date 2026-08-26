'use client';

import { cn } from '@/lib/utils';

// interfaces

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

export function Switch({ checked, onChange, label, id }: SwitchProps) {
  return (
    <label htmlFor={id} className="flex w-fit cursor-pointer items-center gap-2">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-accent')}
      >
        <span
          className={cn(
            'absolute start-0.5 top-0.5 size-5 rounded-full bg-white transition-transform',
            checked && 'translate-x-5 rtl:-translate-x-5',
          )}
        />
      </button>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}
