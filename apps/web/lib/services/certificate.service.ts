import type { AdminCertificateListItem, AdminCertificateQuery, ApiResponse, CertificateOutput, MyCertificateListItem } from '@repo/contracts';
import { BaseService, type Paged } from '@/lib/services/base.service';
import api from '@/lib/axios';

export class CertificateService extends BaseService<CertificateOutput, never, never> {
  protected BASE_PATH = 'certificates';

  async myCertificates(): Promise<MyCertificateListItem[]> {
    const { data } = await api.get<ApiResponse<MyCertificateListItem[]>>(`/${this.BASE_PATH}/my`);
    return data.data;
  }

  async verify(certificateId: string): Promise<CertificateOutput> {
    const { data } = await api.get<ApiResponse<CertificateOutput>>(`/${this.BASE_PATH}/verify/${certificateId}`);
    return data.data;
  }

  async adminList(query: Partial<AdminCertificateQuery> = {}): Promise<Paged<AdminCertificateListItem>> {
    return this.sendGetPaged<AdminCertificateListItem>('/admin', query);
  }

  async revoke(certificateId: string): Promise<void> {
    await this.sendPut(`/${certificateId}/revoke`, {});
  }
}

export const certificateService = new CertificateService();
