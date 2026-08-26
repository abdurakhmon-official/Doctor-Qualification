import type { FieldValues, Path, UseFormRegister } from 'react-hook-form';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

const LOCALES = [
  { code: 'fa', label: 'فارسی', dir: 'rtl' },
  { code: 'ps', label: 'پښتو', dir: 'rtl' },
  { code: 'en', label: 'EN', dir: 'ltr' },
] as const;

// interfaces

interface LocalizedFieldsProps<T extends FieldValues> {
  name: string;
  label: string;
  register: UseFormRegister<T>;
  multiline?: boolean;
}

export function LocalizedFields<T extends FieldValues>({ name, label, register, multiline }: LocalizedFieldsProps<T>) {
  const Field = multiline ? Textarea : Input;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="grid gap-3 sm:grid-cols-3">
        {LOCALES.map((locale) => (
          <FormField key={locale.code} label={locale.label} htmlFor={`${name}.${locale.code}`}>
            <Field id={`${name}.${locale.code}`} dir={locale.dir} {...register(`${name}.${locale.code}` as Path<T>)} />
          </FormField>
        ))}
      </div>
    </div>
  );
}
