import { topicBreakdown } from './topic-breakdown.utils';

const ecg = { uz: 'EKG', ru: 'ЭКГ', en: 'ECG' };
const questions = [
  { id: 'q1', correctIndex: 0, topicId: 't1', topic: { name: ecg } },
  { id: 'q2', correctIndex: 1, topicId: 't1', topic: { name: ecg } },
  { id: 'q3', correctIndex: 2, topicId: null, topic: null },
  { id: 'q4', correctIndex: 3, topicId: null, topic: null },
];

describe('topicBreakdown', () => {
  it('counts unanswered as wrong and sorts weakest first', () => {
    expect(topicBreakdown(questions, { q1: 0, q2: 1, q3: 0 })).toEqual([
      { topicId: null, topicName: null, correct: 0, total: 2 },
      { topicId: 't1', topicName: ecg, correct: 2, total: 2 },
    ]);
  });

  it('is empty for no questions', () => {
    expect(topicBreakdown([], {})).toEqual([]);
  });
});
