'use client';

import { Download, Upload } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { QUESTION_IMPORT_MAX_ROWS, type Locale } from '@repo/contracts';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { errorFrom } from '@/lib/errors';
import { pickLocalized } from '@/lib/localized';
import { buildQuestionCsvTemplate, parseQuestionCsv, type QuestionCsvResult } from '@/lib/question-csv';
import { useImportQuestions } from '@/hooks/use-exams';
import { useAdminTopics } from '@/hooks/use-topics';

const MAX_SHOWN_ERRORS = 20;

interface ImportQuestionsModalProps {
  examId: string;
  specialtyId: string;
  open: boolean;
  onClose: () => void;
}

export function ImportQuestionsModal({ examId, specialtyId, open, onClose }: ImportQuestionsModalProps) {
  const t = useTranslations('admin.exams.questions.import');
  const locale = useLocale() as Locale;
  const { data: topics } = useAdminTopics(specialtyId);
  const importQuestions = useImportQuestions();
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<QuestionCsvResult | null>(null);
  const [serverError, setServerError] = useState('');

  const activeTopics = topics?.filter((topic) => topic.isActive) ?? [];

  const reset = () => {
    setFileName('');
    setResult(null);
    setServerError('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const exampleTopic = activeTopics[0] ? pickLocalized(activeTopics[0].name, locale) : '';
    const blob = new Blob([buildQuestionCsvTemplate(exampleTopic)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File | undefined) => {
    reset();
    if (!file) return;

    setFileName(file.name);
    setResult(parseQuestionCsv(await file.text(), activeTopics));
  };

  const onImport = async () => {
    if (!result?.questions.length) return;
    setServerError('');

    try {
      const { imported } = await importQuestions.mutateAsync({ examId, input: { questions: result.questions } });
      toast.success(t('done', { count: imported }));
      close();
    } catch (error) {
      const detail = errorFrom(error);
      setServerError([detail.message, ...Object.entries(detail.fields).map(([field, message]) => `${field}: ${message}`)].join(' · '));
    }
  };

  // import is all-or-nothing: any bad row blocks it so the exam never ends up half-imported
  const canImport = Boolean(result && result.questions.length > 0 && result.errors.length === 0);

  return (
    <Modal open={open} onClose={close} title={t('title')}>
      <div className="flex flex-col gap-4 text-sm">
        <p className="text-muted-foreground">{t('description', { max: QUESTION_IMPORT_MAX_ROWS })}</p>

        <Button type="button" variant="outline" size="sm" className="self-start" onClick={downloadTemplate}>
          <Download className="size-4" />
          {t('template')}
        </Button>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center hover:bg-accent/50">
          <Upload className="size-5 text-muted-foreground" />
          <span className="font-medium">{fileName || t('choose')}</span>
          <span className="text-xs text-muted-foreground">{t('encoding')}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              void onFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>

        {result && (
          <div className="flex flex-col gap-2">
            {result.questions.length > 0 && (
              <p className="text-emerald-600 dark:text-emerald-400">{t('ready', { count: result.questions.length })}</p>
            )}

            {result.errors.length > 0 && (
              <div className="flex flex-col gap-1 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive">
                <p className="font-medium">{t('errorsTitle', { count: result.errors.length })}</p>
                <ul className="flex flex-col gap-0.5">
                  {result.errors.slice(0, MAX_SHOWN_ERRORS).map((error, index) => (
                    <li key={index}>
                      {error.line > 0 && `${t('line', { line: error.line })}: `}
                      {t(`errors.${error.code}`, { detail: error.detail ?? '' })}
                    </li>
                  ))}
                </ul>
                {result.errors.length > MAX_SHOWN_ERRORS && <p>{t('moreErrors', { count: result.errors.length - MAX_SHOWN_ERRORS })}</p>}
              </div>
            )}
          </div>
        )}

        {serverError && <p className="text-destructive">{serverError}</p>}

        <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={close}>
            {t('cancel')}
          </Button>
          <Button type="button" size="sm" disabled={!canImport || importQuestions.isPending} onClick={onImport}>
            {importQuestions.isPending ? t('importing') : t('submit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
