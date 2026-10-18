'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LocalizedTextSchema, type Locale, type TopicOutput } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { LocalizedFields } from '@/components/admin/LocalizedFields';
import { pickLocalized } from '@/lib/localized';
import { useAdminSpecialties } from '@/hooks/use-specialties';
import { useAdminTopics, useCreateTopic, useUpdateTopic } from '@/hooks/use-topics';

const TopicFormSchema = z.object({ name: LocalizedTextSchema });
type TopicFormValues = z.infer<typeof TopicFormSchema>;

export function AdminTopicListView() {
  const t = useTranslations('admin.topics');
  const locale = useLocale() as Locale;
  const { data: specialties } = useAdminSpecialties();
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicOutput | null>(null);
  const updateTopic = useUpdateTopic();

  // topics only make sense per specialty, so fall back to the first one until the admin picks
  const specialtyId = selectedSpecialtyId || specialties?.[0]?.id || '';
  const { data: topics } = useAdminTopics(specialtyId, { enabled: Boolean(specialtyId) });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => setAdding(true)} disabled={!specialtyId}>
          {t('add')}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{t('description')}</p>

      <Select value={specialtyId} onChange={(event) => setSelectedSpecialtyId(event.target.value)} className="max-w-64">
        {specialties?.map((specialty) => (
          <option key={specialty.id} value={specialty.id}>
            {pickLocalized(specialty.name, locale)}
          </option>
        ))}
      </Select>

      {!topics?.length ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Card key={topic.id}>
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate font-medium">{pickLocalized(topic.name, locale)}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={topic.isActive ? 'success' : 'danger'}>{topic.isActive ? t('active') : t('inactive')}</Badge>
                    <span className="text-xs text-muted-foreground">{t('questionCount', { count: topic.questionCount })}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingTopic(topic)}>
                    {t('edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateTopic.isPending}
                    onClick={() => updateTopic.mutate({ topicId: topic.id, input: { isActive: !topic.isActive } })}
                  >
                    {topic.isActive ? t('deactivate') : t('activate')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title={t('add')}>
        <TopicForm specialtyId={specialtyId} onDone={() => setAdding(false)} />
      </Modal>

      <Modal open={!!editingTopic} onClose={() => setEditingTopic(null)} title={t('edit')}>
        {editingTopic && <TopicForm specialtyId={editingTopic.specialtyId} topic={editingTopic} onDone={() => setEditingTopic(null)} />}
      </Modal>
    </div>
  );
}

function TopicForm({ specialtyId, topic, onDone }: { specialtyId: string; topic?: TopicOutput; onDone: () => void }) {
  const t = useTranslations('admin.topics');
  const createTopic = useCreateTopic();
  const updateTopic = useUpdateTopic();
  const isPending = createTopic.isPending || updateTopic.isPending;

  const { register, handleSubmit } = useForm<TopicFormValues>({
    resolver: zodResolver(TopicFormSchema),
    defaultValues: topic ? { name: topic.name } : undefined,
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    if (topic) {
      await updateTopic.mutateAsync({ topicId: topic.id, input: { name } });
    } else {
      await createTopic.mutateAsync({ specialtyId, name });
    }

    onDone();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <LocalizedFields name="name" label={t('name')} register={register} />

      <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t('cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
