import {
  CreateQuestionInputSchema,
  LOCALES,
  QUESTION_IMPORT_MAX_ROWS,
  QuestionDifficultySchema,
  type CreateQuestionInput,
  type TopicOutput,
} from '@repo/contracts';

const OPTION_KEYS = ['a', 'b', 'c', 'd'] as const;

/** Column order of the downloadable template; parsing matches by header name, so admins may reorder columns. */
export const QUESTION_CSV_COLUMNS = [
  ...LOCALES.map((locale) => `text_${locale}`),
  ...OPTION_KEYS.flatMap((key) => LOCALES.map((locale) => `${key}_${locale}`)),
  'correct',
  'difficulty',
  'topic',
] as const;

const REQUIRED_COLUMNS = QUESTION_CSV_COLUMNS.filter((column) => column !== 'topic');

// types

export type QuestionCsvErrorCode = 'empty' | 'missingColumns' | 'tooMany' | 'fields' | 'correct' | 'difficulty' | 'topic';

export interface QuestionCsvError {
  /** 1-based line in the file; 0 for file-level problems. */
  line: number;
  code: QuestionCsvErrorCode;
  detail?: string;
}

export interface QuestionCsvResult {
  questions: CreateQuestionInput[];
  errors: QuestionCsvError[];
}

/** RFC 4180 parser: quoted fields may hold the delimiter, newlines and doubled quotes. Returns rows with their starting line number. */
export const parseCsv = (input: string): { line: number; cells: string[] }[] => {
  const text = input.replace(/^﻿/, '');
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  // Excel in ru/uz locales saves CSV with ';'
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let cell = '';
  let quoted = false;
  let line = 1;
  let rowLine = 1;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        if (char === '\n') line++;
        cell += char;
      }
      continue;
    }

    if (char === '"' && cell === '') {
      quoted = true;
    } else if (char === delimiter) {
      cells.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index++;
      cells.push(cell);
      rows.push({ line: rowLine, cells });
      cells = [];
      cell = '';
      line++;
      rowLine = line;
    } else {
      cell += char;
    }
  }

  if (cell !== '' || cells.length) {
    cells.push(cell);
    rows.push({ line: rowLine, cells });
  }

  return rows.filter((row) => row.cells.some((value) => value.trim() !== ''));
};

const parseCorrect = (value: string): number | null => {
  const normalized = value.trim().toUpperCase();
  const letter = ['A', 'B', 'C', 'D'].indexOf(normalized);
  if (letter !== -1) return letter;

  const digit = ['1', '2', '3', '4'].indexOf(normalized);
  return digit === -1 ? null : digit;
};

const normalize = (value: string) => value.trim().toLocaleLowerCase();

export const parseQuestionCsv = (input: string, topics: TopicOutput[]): QuestionCsvResult => {
  const [header, ...dataRows] = parseCsv(input);
  if (!header || !dataRows.length) return { questions: [], errors: [{ line: 0, code: 'empty' }] };

  const columns = header.cells.map(normalize);
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length) return { questions: [], errors: [{ line: header.line, code: 'missingColumns', detail: missing.join(', ') }] };

  if (dataRows.length > QUESTION_IMPORT_MAX_ROWS) {
    return { questions: [], errors: [{ line: 0, code: 'tooMany', detail: String(QUESTION_IMPORT_MAX_ROWS) }] };
  }

  const topicByName = new Map<string, string>();
  for (const topic of topics) {
    for (const locale of LOCALES) topicByName.set(normalize(topic.name[locale]), topic.id);
  }

  const questions: CreateQuestionInput[] = [];
  const errors: QuestionCsvError[] = [];

  for (const row of dataRows) {
    const get = (column: string) => (row.cells[columns.indexOf(column)] ?? '').trim();
    const localized = (prefix: string) => Object.fromEntries(LOCALES.map((locale) => [locale, get(`${prefix}_${locale}`)]));

    const correctIndex = parseCorrect(get('correct'));
    if (correctIndex === null) {
      errors.push({ line: row.line, code: 'correct', detail: get('correct') });
      continue;
    }

    const difficulty = QuestionDifficultySchema.safeParse(get('difficulty').toUpperCase());
    if (!difficulty.success) {
      errors.push({ line: row.line, code: 'difficulty', detail: get('difficulty') });
      continue;
    }

    const topicName = columns.includes('topic') ? get('topic') : '';
    const topicId = topicName ? topicByName.get(normalize(topicName)) : null;
    if (topicId === undefined) {
      errors.push({ line: row.line, code: 'topic', detail: topicName });
      continue;
    }

    const parsed = CreateQuestionInputSchema.safeParse({
      text: localized('text'),
      options: OPTION_KEYS.map((key) => localized(key)),
      correctIndex,
      difficulty: difficulty.data,
      topicId,
    });

    if (!parsed.success) {
      errors.push({ line: row.line, code: 'fields', detail: [...new Set(parsed.error.issues.map((issue) => issue.path.join('.')))].join(', ') });
      continue;
    }

    questions.push(parsed.data);
  }

  return { questions, errors };
};

const escapeCell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

export const buildQuestionCsvTemplate = (exampleTopic: string): string => {
  const example: Record<string, string> = {
    text_uz: "O'tkir STEMI uchun eng xos EKG belgisi qaysi?",
    text_ru: 'Какой признак ЭКГ наиболее специфичен для острого STEMI?',
    text_en: 'Which ECG finding is most specific for acute STEMI?',
    a_uz: "Qo'shni tarmoqlarda ST ko'tarilishi",
    a_ru: 'Подъём ST в смежных отведениях',
    a_en: 'ST elevation in contiguous leads',
    b_uz: 'Alohida T-tishcha inversiyasi',
    b_ru: 'Изолированная инверсия зубца T',
    b_en: 'Isolated T-wave inversion',
    c_uz: 'Sinus taxikardiyasi',
    c_ru: 'Синусовая тахикардия',
    c_en: 'Sinus tachycardia',
    d_uz: "O'q chapga og'ishi",
    d_ru: 'Отклонение оси влево',
    d_en: 'Left axis deviation',
    correct: 'A',
    difficulty: 'INTERMEDIATE',
    topic: exampleTopic,
  };

  const lines = [QUESTION_CSV_COLUMNS.join(','), QUESTION_CSV_COLUMNS.map((column) => escapeCell(example[column] ?? '')).join(',')];

  // BOM so Excel opens the UTF-8 file with Cyrillic and o' intact
  return `﻿${lines.join('\r\n')}\r\n`;
};
