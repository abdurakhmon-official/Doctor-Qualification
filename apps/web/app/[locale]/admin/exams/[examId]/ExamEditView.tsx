'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAdminExam } from '@/hooks/use-exams';
import { ExamInfoCard } from './ExamInfoCard';
import { QuestionsSection } from './QuestionsSection';

export function ExamEditView({ examId }: { examId: string }) {
  const t = useTranslations('admin.exams');
  const { data: exam } = useAdminExam(examId);

  if (!exam) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link href="/admin/exams" className="text-sm text-muted-foreground hover:underline">
        ← {t('backToList')}
      </Link>

      <ExamInfoCard exam={exam} />
      <QuestionsSection examId={examId} specialtyId={exam.specialtyId} questions={exam.questions} />
    </div>
  );
}
