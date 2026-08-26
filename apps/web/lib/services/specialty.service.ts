import type { CreateSpecialtyInput, SpecialtyOutput, UpdateSpecialtyInput } from '@repo/contracts';
import { BaseService } from '@/lib/services/base.service';
import api from '@/lib/axios';
import type { ApiResponse } from '@repo/contracts';

export class SpecialtyService extends BaseService<SpecialtyOutput, CreateSpecialtyInput, UpdateSpecialtyInput> {
  protected BASE_PATH = 'specialties';

  async list(): Promise<SpecialtyOutput[]> {
    const { data } = await api.get<ApiResponse<SpecialtyOutput[]>>(`/${this.BASE_PATH}`);
    return data.data;
  }

  async adminList(): Promise<SpecialtyOutput[]> {
    const { data } = await api.get<ApiResponse<SpecialtyOutput[]>>(`/${this.BASE_PATH}/admin`);
    return data.data;
  }
}

export const specialtyService = new SpecialtyService();
