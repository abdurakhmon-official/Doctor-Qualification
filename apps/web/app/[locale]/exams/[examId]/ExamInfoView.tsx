'use client';

import { BookOpen, Clock, ListChecks, Target } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { errorFrom } from '@/lib/errors';
import { pickLocalized } from '@/lib/localized';
import { useRouter } from '@/i18n/navigation';
import { usePublishedExams, useStartAttempt } from '@/hooks/use-exam-attempts';

export function ExamInfoView({ examId }: { examId: string }) {
  const t = useTranslations('exams');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { data: exams } = usePublishedExams();
  const startAttempt = useStartAttempt();

  const exam = exams?.find((item) => item.id === examId);

  const onStart = async () => {
    try {
      const attempt = await startAttempt.mutateAsync({ examId });
      router.push({ pathname: '/attempts/[attemptId]', params: { attemptId: attempt.id } });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(errorFrom(error).message);
    }
  };

  if (!exam) return null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-16">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookOpen className="size-8" />
          </div>
          <div>
            <p className="text-xl font-bold">{pickLocalized(exam.title, locale)}</p>
            <p className="text-muted-foreground">{pickLocalized(exam.specialtyName, locale)}</p>
          </div>
          {exam.description && <p className="text-sm text-muted-foreground">{pickLocalized(exam.description, locale)}</p>}

          <div className="grid w-full grid-cols-3 gap-3">
            <InfoStat icon={<ListChecks className="size-5" />} label={t('info.questions')} value={String(exam.questionCount)} />
            <InfoStat icon={<Clock className="size-5" />} label={t('info.duration')} value={t('duration', { minutes: exam.durationMinutes })} />
            <InfoStat icon={<Target className="size-5" />} label={t('info.minCertificateScore')} value={`${exam.minCertificateScore}%`} />
          </div>

          <Button size="lg" className="w-full" disabled={startAttempt.isPending} onClick={onStart}>
            {t('start')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border p-3">
      <div className="text-primary">{icon}</div>
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
