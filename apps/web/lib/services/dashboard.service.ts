import type { AdminDashboardOutput, ApiResponse, PublicStatsOutput, UserDashboardOutput, UserProgressOutput } from '@repo/contracts';
import { BaseService } from '@/lib/services/base.service';
import api from '@/lib/axios';

export class DashboardService extends BaseService<never, never, never> {
  protected BASE_PATH = 'dashboard';

  async publicStats(): Promise<PublicStatsOutput> {
    const { data } = await api.get<ApiResponse<PublicStatsOutput>>(`/${this.BASE_PATH}/public-stats`);
    return data.data;
  }

  async myDashboard(): Promise<UserDashboardOutput> {
    const { data } = await api.get<ApiResponse<UserDashboardOutput>>(`/${this.BASE_PATH}/my`);
    return data.data;
  }

  async myProgress(tzOffset: number): Promise<UserProgressOutput> {
    const { data } = await api.get<ApiResponse<UserProgressOutput>>(`/${this.BASE_PATH}/my/progress`, { params: { tzOffset } });
    return data.data;
  }

  async adminDashboard(): Promise<AdminDashboardOutput> {
    const { data } = await api.get<ApiResponse<AdminDashboardOutput>>(`/${this.BASE_PATH}/admin`);
    return data.data;
  }
}

export const dashboardService = new DashboardService();
