'use client';

import { pdf } from '@react-pdf/renderer';
import { FileDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AttemptSubmitted, Locale, PracticeSubmitted } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { ResultReportDocument, type ResultReportProps } from '@/components/report/ResultReportDocument';
import { pickLocalized } from '@/lib/localized';
import { useSession } from '@/hooks/use-auth';

type ReportAttempt = AttemptSubmitted | PracticeSubmitted;

const isExam = (attempt: ReportAttempt): attempt is AttemptSubmitted => 'examTitle' in attempt;

const formatDuration = (totalSeconds: number) => `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;

/** Builds the result report client-side (like the certificate PDF) and downloads it. */
export function DownloadReportButton({ attempt, className }: { attempt: ReportAttempt; className?: string }) {
  const t = useTranslations('report');
  const tLevel = useTranslations('attempts.result.level');
  const tDifficulty = useTranslations('admin.exams.questions.difficultyLevel');
  const locale = useLocale() as Locale;
  const { user } = useSession();
  const [busy, setBusy] = useState(false);

  const buildProps = (): ResultReportProps => {
    const exam = isExam(attempt);
    const submittedAt = new Date(attempt.submittedAt);
    const meta = [
      { label: t('meta.doctor'), value: user?.fullName ?? '—' },
      { label: t('meta.date'), value: submittedAt.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) },
      { label: t('meta.questions'), value: String(attempt.questionCount) },
      { label: t('meta.correct'), value: String(attempt.correctCount) },
      { label: t('meta.timeSpent'), value: formatDuration(attempt.timeSpentSeconds) },
      ...(exam ? [{ label: t('meta.minScore'), value: `${attempt.minCertificateScore}%` }] : []),
    ];

    return {
      brand: t('brand'),
      title: exam ? t('examTitle') : t('practiceTitle'),
      subtitle: pickLocalized(exam ? attempt.examTitle : attempt.specialtyName, locale),
      scoreLabel: `${attempt.score}%`,
      levelLabel: tLevel(attempt.level),
      meta,
      statusLine: exam
        ? attempt.certificateIssued
          ? t('certificateIssued')
          : t('certificateNotIssued', { minScore: attempt.minCertificateScore })
        : t('practiceNote'),
      topicsTitle: t('byTopic'),
      topicHeaders: { topic: t('table.topic'), correct: t('table.correct'), percent: t('table.percent') },
      topics: attempt.topics.map((topic) => ({
        name: topic.topicName ? pickLocalized(topic.topicName, locale) : t('noTopic'),
        correct: topic.correct,
        total: topic.total,
      })),
      reviewTitle: t('toReview'),
      reviewEmpty: t('toReviewEmpty'),
      review: attempt.questions.flatMap((question, index) => {
        if (question.isCorrect) return [];
        const selected = question.selectedIndex === null ? undefined : question.options[question.selectedIndex];
        const answer =
          question.selectedIndex === null || !selected
            ? t('notAnswered')
            : `${String.fromCharCode(65 + question.selectedIndex)}) ${pickLocalized(selected, locale)}`;

        return [
          {
            number: index + 1,
            text: pickLocalized(question.text, locale),
            answer: `${t('yourAnswer')}: ${answer}`,
            tags: `${question.topicName ? pickLocalized(question.topicName, locale) : t('noTopic')} · ${tDifficulty(question.difficulty)}`,
          },
        ];
      }),
      footerNote: t('disclaimer'),
      generatedLabel: t('generatedAt', { date: new Date().toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) }),
      pageLabel: (page, total) => t('page', { page, total }),
    };
  };

  const onDownload = async () => {
    setBusy(true);
    try {
      const blob = await pdf(<ResultReportDocument {...buildProps()} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${isExam(attempt) ? 'exam' : 'practice'}-report-${attempt.submittedAt.slice(0, 10)}-${attempt.id.slice(0, 8)}.pdf`;
      link.click();
      // revoke on the next tick: some browsers start the download asynchronously
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      toast.error(t('downloadFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" variant="outline" className={className} disabled={busy} onClick={onDownload}>
      <FileDown className="size-4" />
      {busy ? t('preparing') : t('download')}
    </Button>
  );
}
