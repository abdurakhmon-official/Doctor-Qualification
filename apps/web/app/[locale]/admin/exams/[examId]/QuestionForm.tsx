'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { CreateQuestionInputSchema, type CreateQuestionInput, type Locale, type QuestionOutput } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Select } from '@/components/ui/Select';
import { LocalizedFields } from '@/components/admin/LocalizedFields';
import { pickLocalized } from '@/lib/localized';
import { cn } from '@/lib/utils';
import { useCreateQuestion } from '@/hooks/use-exams';
import { useUpdateQuestion } from '@/hooks/use-questions';
import { useAdminTopics } from '@/hooks/use-topics';

const OPTION_LABELS = ['optionA', 'optionB', 'optionC', 'optionD'] as const;
const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

const EMPTY_OPTION = { uz: '', ru: '', en: '' };

interface QuestionFormProps {
  examId: string;
  specialtyId: string;
  question?: QuestionOutput;
  onDone: () => void;
}

export function QuestionForm({ examId, specialtyId, question, onDone }: QuestionFormProps) {
  const t = useTranslations('admin.exams.questions');
  const locale = useLocale() as Locale;
  const { data: topics } = useAdminTopics(specialtyId);
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion(examId);
  const isPending = createQuestion.isPending || updateQuestion.isPending;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateQuestionInput>({
    resolver: zodResolver(CreateQuestionInputSchema),
    defaultValues: question
      ? {
          text: question.text,
          options: question.options,
          correctIndex: question.correctIndex,
          difficulty: question.difficulty,
          topicId: question.topicId,
        }
      : { options: [EMPTY_OPTION, EMPTY_OPTION, EMPTY_OPTION, EMPTY_OPTION], correctIndex: 0, difficulty: 'BEGINNER', topicId: null },
  });

  const correctIndex = watch('correctIndex');
  const difficulty = watch('difficulty');
  const topicId = watch('topicId');

  // inactive topics are hidden from new picks but kept when a question is already filed under one
  const topicOptions = topics?.filter((topic) => topic.isActive || topic.id === question?.topicId) ?? [];

  const onSubmit = handleSubmit(async (data) => {
    if (question) {
      await updateQuestion.mutateAsync({ questionId: question.id, input: data });
    } else {
      await createQuestion.mutateAsync({ examId, input: data });
    }

    onDone();
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <LocalizedFields name="text" label={t('text')} register={register} multiline />

          <FormField label={t('difficulty')} htmlFor="difficulty">
            <Select id="difficulty" value={difficulty} onChange={(event) => setValue('difficulty', event.target.value as CreateQuestionInput['difficulty'])}>
              {DIFFICULTIES.map((level) => (
                <option key={level} value={level}>
                  {t(`difficultyLevel.${level}`)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label={t('topic')} htmlFor="topicId">
            <Select id="topicId" value={topicId ?? ''} onChange={(event) => setValue('topicId', event.target.value || null)}>
              <option value="">{t('noTopic')}</option>
              {topicOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {pickLocalized(topic.name, locale)}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex flex-col gap-3">
            {OPTION_LABELS.map((key, index) => (
              <div key={key} className={cn('flex items-start gap-2 rounded-lg border p-3', correctIndex === index ? 'border-primary' : 'border-border')}>
                <input
                  type="radio"
                  name="correctIndex"
                  checked={correctIndex === index}
                  onChange={() => setValue('correctIndex', index)}
                  className="mt-3 size-4 shrink-0 accent-primary"
                  aria-label={t('correctAnswer')}
                />
                <div className="flex-1">
                  <LocalizedFields name={`options.${index}`} label={t(key)} register={register} />
                </div>
              </div>
            ))}
          </div>

          {errors.options && <p className="text-sm text-destructive">{errors.options.message}</p>}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {t('save')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onDone}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
