import type { ApiResponse, MyRatingOutput, RatingListItem, RatingQuery, RatingSettingsOutput, UpdateRatingSettingsInput } from '@repo/contracts';
import { BaseService, type Paged } from '@/lib/services/base.service';
import api from '@/lib/axios';

export class RatingService extends BaseService<never, never, never> {
  protected BASE_PATH = 'ratings';

  async list(query: Partial<RatingQuery>): Promise<Paged<RatingListItem>> {
    return this.sendGetPaged<RatingListItem>('', query);
  }

  async myRating(specialtyId: string): Promise<MyRatingOutput> {
    const { data } = await api.get<ApiResponse<MyRatingOutput>>(`/${this.BASE_PATH}/me`, { params: { specialtyId } });
    return data.data;
  }

  async getSettings(): Promise<RatingSettingsOutput> {
    const { data } = await api.get<ApiResponse<RatingSettingsOutput>>(`/${this.BASE_PATH}/settings`);
    return data.data;
  }

  async updateSettings(input: UpdateRatingSettingsInput): Promise<RatingSettingsOutput> {
    const { data } = await api.put<ApiResponse<RatingSettingsOutput>>(`/${this.BASE_PATH}/settings`, input);
    return data.data;
  }
}

export const ratingService = new RatingService();
