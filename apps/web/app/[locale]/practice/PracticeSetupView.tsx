'use client';

import { Dumbbell, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { PRACTICE_QUESTION_COUNTS, type Locale, type PracticeDifficulty } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { Link, useRouter } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { cn } from '@/lib/utils';
import { useMyPractice, usePracticeAvailability, useStartPractice } from '@/hooks/use-practice';
import { useSpecialties } from '@/hooks/use-specialties';
import { useTopics } from '@/hooks/use-topics';

const DIFFICULTIES: PracticeDifficulty[] = ['AUTO', 'MIXED', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

interface PracticeSetupViewProps {
  initialSpecialtyId?: string;
  initialTopicId?: string;
}

export function PracticeSetupView({ initialSpecialtyId, initialTopicId }: PracticeSetupViewProps) {
  const t = useTranslations('practice');
  const tLevel = useTranslations('admin.exams.questions.difficultyLevel');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { data: specialties } = useSpecialties();
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(initialSpecialtyId ?? '');
  const [topicIds, setTopicIds] = useState<string[]>(initialSpecialtyId && initialTopicId ? [initialTopicId] : []);
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('AUTO');
  const [questionCount, setQuestionCount] = useState<number>(PRACTICE_QUESTION_COUNTS[0]);
  const startPractice = useStartPractice();

  // a stale or foreign id from the URL falls back to the first specialty instead of an empty form
  const specialtyId =
    (specialties?.some((specialty) => specialty.id === selectedSpecialtyId) ? selectedSpecialtyId : specialties?.[0]?.id) ?? '';
  const { data: topics } = useTopics(specialtyId, { enabled: Boolean(specialtyId) });
  // only ids of this specialty's active topics reach the API (a URL may carry a stale or foreign one)
  const activeTopicIds = topicIds.filter((id) => topics?.some((topic) => topic.id === id));
  const { data: availability } = usePracticeAvailability(
    specialtyId && topics ? { specialtyId, topicIds: activeTopicIds, difficulty } : null,
  );

  const available = availability?.available ?? 0;
  const willGet = Math.min(available, questionCount);

  const toggleTopic = (topicId: string) => {
    setTopicIds((current) => (current.includes(topicId) ? current.filter((id) => id !== topicId) : [...current, topicId]));
  };

  const onStart = async () => {
    try {
      const attempt = await startPractice.mutateAsync({ specialtyId, topicIds: activeTopicIds, difficulty, questionCount });
      router.push({ pathname: '/practice/[attemptId]', params: { attemptId: attempt.id } });
    } catch {
      // the axios interceptor already shows the server message as a toast
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 py-6">
          <FormField label={t('specialty')} htmlFor="practice-specialty">
            <Select
              id="practice-specialty"
              value={specialtyId}
              onChange={(event) => {
                setSelectedSpecialtyId(event.target.value);
                // topics belong to one specialty
                setTopicIds([]);
              }}
            >
              {specialties?.map((specialty) => (
                <option key={specialty.id} value={specialty.id}>
                  {pickLocalized(specialty.name, locale)}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t('topics')}</span>
            <div className="flex flex-wrap gap-2">
              <TopicChip active={activeTopicIds.length === 0} onClick={() => setTopicIds([])}>
                {t('allTopics')}
              </TopicChip>
              {topics?.map((topic) => (
                <TopicChip key={topic.id} active={activeTopicIds.includes(topic.id)} onClick={() => toggleTopic(topic.id)}>
                  {pickLocalized(topic.name, locale)}
                </TopicChip>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t('difficulty')} htmlFor="practice-difficulty">
              <Select id="practice-difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as PracticeDifficulty)}>
                {DIFFICULTIES.map((level) => (
                  <option key={level} value={level}>
                    {level === 'AUTO' ? t('difficultyAuto') : level === 'MIXED' ? t('difficultyMixed') : tLevel(level)}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label={t('questionCount')} htmlFor="practice-count">
              <Select id="practice-count" value={String(questionCount)} onChange={(event) => setQuestionCount(Number(event.target.value))}>
                {PRACTICE_QUESTION_COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {difficulty === 'AUTO' && availability?.autoLevels && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              {t('autoLevels', { levels: availability.autoLevels.map((level) => tLevel(level)).join(', ') })}
            </p>
          )}

          {availability && (
            <p className={cn('text-sm', available === 0 ? 'text-destructive' : 'text-muted-foreground')}>
              {available === 0
                ? t('noneAvailable')
                : willGet < questionCount
                  ? t('fewerAvailable', { count: willGet })
                  : t('available', { count: available })}
            </p>
          )}

          <Button size="lg" disabled={!availability || available === 0 || startPractice.isPending} onClick={onStart}>
            <Dumbbell className="size-4" />
            {startPractice.isPending ? t('starting') : t('start')}
          </Button>
        </CardContent>
      </Card>

      <PracticeHistory />
    </div>
  );
}

function TopicChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent',
      )}
    >
      {children}
    </button>
  );
}

function PracticeHistory() {
  const t = useTranslations('practice');
  const tLevel = useTranslations('admin.exams.questions.difficultyLevel');
  const locale = useLocale() as Locale;
  const { data: history } = useMyPractice();

  if (!history?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('history')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {history.map((item) => (
          <Link
            key={item.id}
            href={{ pathname: '/practice/[attemptId]', params: { attemptId: item.id } }}
            className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-accent"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{pickLocalized(item.specialtyName, locale)}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.startedAt).toLocaleDateString(locale)} ·{' '}
                {item.difficulty === 'AUTO' ? t('difficultyAuto') : item.difficulty === 'MIXED' ? t('difficultyMixed') : tLevel(item.difficulty)} ·{' '}
                {t('questionsShort', { count: item.questionCount })}
              </p>
            </div>
            {item.score === null ? <Badge variant="warning">{t('inProgress')}</Badge> : <span className="font-semibold">{item.score}%</span>}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
