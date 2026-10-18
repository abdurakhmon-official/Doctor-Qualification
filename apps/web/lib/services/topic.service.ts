import type { CreateTopicInput, TopicOutput, UpdateTopicInput } from '@repo/contracts';
import { BaseService } from '@/lib/services/base.service';

export class TopicService extends BaseService<TopicOutput, CreateTopicInput, UpdateTopicInput> {
  protected BASE_PATH = 'topics';

  async list(specialtyId?: string): Promise<TopicOutput[]> {
    return this.sendGet<TopicOutput[]>('', { specialtyId });
  }

  async adminList(specialtyId?: string): Promise<TopicOutput[]> {
    return this.sendGet<TopicOutput[]>('/admin', { specialtyId });
  }
}

export const topicService = new TopicService();
