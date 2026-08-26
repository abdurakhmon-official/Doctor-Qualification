import type { ApiResponse, PaginationMeta } from '@repo/contracts';
import api from '@/lib/axios';

export interface Paged<T> {
  data: T[];
  meta: PaginationMeta;
}

export abstract class BaseService<T, TCreateInput = unknown, TUpdateInput = unknown> {
  protected abstract BASE_PATH: string;

  async get(id: string): Promise<T> {
    return this.sendGet<T>(`/${id}`);
  }

  async create(data: TCreateInput): Promise<T> {
    return this.sendPost<T>('', data);
  }

  async update(id: string, data: TUpdateInput): Promise<T> {
    return this.sendPut<T>(`/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await this.sendDelete(`/${id}`);
  }

  protected async sendGet<R>(path: string, query: Record<string, unknown> = {}): Promise<R> {
    const { data } = await api.get<ApiResponse<R>>(`/${this.BASE_PATH}${path}`, { params: query });
    return data.data;
  }

  protected async sendGetPaged<R>(path: string, query: Record<string, unknown> = {}): Promise<Paged<R>> {
    const { data } = await api.get<ApiResponse<R[]> & { meta: PaginationMeta }>(`/${this.BASE_PATH}${path}`, {
      params: query,
    });

    return { data: data.data, meta: data.meta };
  }

  protected async sendPost<R, I = unknown>(path: string, input: I): Promise<R> {
    const { data } = await api.post<ApiResponse<R>>(`/${this.BASE_PATH}${path}`, input);
    return data.data;
  }

  protected async sendPut<R, I = unknown>(path: string, input: I): Promise<R> {
    const { data } = await api.put<ApiResponse<R>>(`/${this.BASE_PATH}${path}`, input);
    return data.data;
  }

  protected async sendDelete<R = void>(path: string): Promise<R> {
    const { data } = await api.delete<ApiResponse<R>>(`/${this.BASE_PATH}${path}`);
    return data.data;
  }
}
