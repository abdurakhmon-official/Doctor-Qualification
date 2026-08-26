import type { LocalizedText } from '../common/localized-text';

// interfaces

export interface SpecialtyOutput {
  id: string;
  name: LocalizedText;
  imageKey: string | null;
  isActive: boolean;
  order: number;
}
