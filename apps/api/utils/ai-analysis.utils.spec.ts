import type Anthropic from '@anthropic-ai/sdk';
import {
  AiInvalidOutputError,
  AiRefusedError,
  analysisSystemPrompt,
  buildAnalysisPrompt,
  requestAnalysis,
  sanitizeAnalysis,
  type AnalysisContext,
  type AnalysisOutput,
} from './ai-analysis.utils';

const context = (overrides: Partial<AnalysisContext> = {}): AnalysisContext => ({
  title: 'Clinical Cardiology Certification',
  specialty: 'Cardiologist',
  score: 33,
  locale: 'uz',
  topics: [{ id: 't-ecg', name: 'ECG' }],
  revealCorrectAnswers: false,
  questions: [
    { number: 1, text: 'STEMI sign?', options: ['ST elevation in contiguous leads', 'T inversion', 'Tachycardia', 'Axis'], selectedIndex: 0, correctIndex: 0, topicId: 't-ecg', topicName: 'ECG', difficulty: 'BEGINNER' },
    { number: 2, text: 'HFrEF first line?', options: ['Loop diuretics', 'ACE inhibitors / ARNI', 'Digoxin', 'CCB'], selectedIndex: 0, correctIndex: 1, topicId: null, topicName: null, difficulty: 'INTERMEDIATE' },
    { number: 3, text: 'Mechanical mitral INR?', options: ['1.5-2.0', '2.0-3.0', '2.5-3.5', '4.0-5.0'], selectedIndex: null, correctIndex: 2, topicId: null, topicName: null, difficulty: 'ADVANCED' },
  ],
  ...overrides,
});

const output = (overrides: Partial<AnalysisOutput> = {}): AnalysisOutput => ({
  summary: 'Pharmacology of heart failure needs work.',
  mistakes: [
    { questionNumber: 2, keyConcept: 'Mortality benefit in HFrEF', explanation: 'Loop diuretics relieve congestion but do not change survival.' },
    { questionNumber: 3, keyConcept: 'Anticoagulation targets', explanation: 'Mitral position and valve type raise the target range.' },
  ],
  studyPlan: [{ topicId: 't-ecg', topic: 'ECG', reason: 'Refresh', tips: ['Read 20 tracings'] }],
  encouragement: 'Keep going.',
  ...overrides,
});

describe('prompts', () => {
  it('forbids naming answers unless revealing is enabled', () => {
    expect(analysisSystemPrompt(false)).toContain('must not give the answers away');
    expect(analysisSystemPrompt(true)).not.toContain('must not give the answers away');
  });

  it('details only missed questions, marks chosen and keyed options, and asks for the language', () => {
    const prompt = buildAnalysisPrompt(context());

    expect(prompt).toContain('Question 2 (topic: none, difficulty: intermediate) - answered wrongly');
    expect(prompt).toContain('A) Loop diuretics [chosen]');
    expect(prompt).toContain('B) ACE inhibitors / ARNI [keyed correct]');
    expect(prompt).toContain('Question 3 (topic: none, difficulty: advanced) - not answered');
    expect(prompt).not.toContain('Question 1 (');
    expect(prompt).toContain('Questions 1 (ECG)');
    expect(prompt).toContain('- t-ecg: ECG');
    expect(prompt).toContain('Write the whole response in Uzbek (Latin script).');
  });
});

describe('requestAnalysis', () => {
  const fakeClient = (response: object) => {
    const parse = jest.fn().mockResolvedValue(response);
    return { client: { beta: { messages: { parse } } } as unknown as Anthropic, parse };
  };
  const ok = { stop_reason: 'end_turn', parsed_output: output(), model: 'claude-opus-5-5', usage: { input_tokens: 900, output_tokens: 400 } };

  it('sends the documented request shape', async () => {
    const { client, parse } = fakeClient(ok);
    const result = await requestAnalysis(client, context(), { model: 'claude-opus-5-5' });
    const params = parse.mock.calls[0][0];

    expect(params.model).toBe('claude-opus-5-5');
    expect(params.betas).toEqual(['server-side-fallback-2026-07-01']);
    expect(params.fallbacks).toBe('default');
    expect(params.output_config.effort).toBe('medium');
    expect(params.output_config.format).toBeDefined();
    expect(params.thinking).toBeUndefined();
    expect(params.messages).toHaveLength(1);
    expect(result).toMatchObject({ model: 'claude-opus-5-5', inputTokens: 900, outputTokens: 400 });
  });

  it('turns a refusal into AiRefusedError', async () => {
    const { client } = fakeClient({ ...ok, stop_reason: 'refusal', parsed_output: null, stop_details: { category: 'bio' } });
    await expect(requestAnalysis(client, context(), { model: 'm' })).rejects.toBeInstanceOf(AiRefusedError);
  });

  it('turns unparseable or truncated output into AiInvalidOutputError', async () => {
    await expect(requestAnalysis(fakeClient({ ...ok, parsed_output: null }).client, context(), { model: 'm' })).rejects.toBeInstanceOf(AiInvalidOutputError);
    await expect(requestAnalysis(fakeClient({ ...ok, stop_reason: 'max_tokens' }).client, context(), { model: 'm' })).rejects.toBeInstanceOf(AiInvalidOutputError);
  });
});

describe('sanitizeAnalysis', () => {
  it('keeps mistakes only for missed questions, once each, in order', () => {
    const result = sanitizeAnalysis(
      output({
        mistakes: [
          { questionNumber: 3, keyConcept: 'a', explanation: 'b' },
          { questionNumber: 1, keyConcept: 'answered correctly', explanation: 'x' },
          { questionNumber: 99, keyConcept: 'invented', explanation: 'x' },
          { questionNumber: 2, keyConcept: 'c', explanation: 'd' },
          { questionNumber: 2, keyConcept: 'dup', explanation: 'dup' },
        ],
      }),
      context(),
    );

    expect(result.mistakes.map((mistake) => [mistake.questionNumber, mistake.keyConcept])).toEqual([
      [2, 'c'],
      [3, 'a'],
    ]);
  });

  it('drops text that quotes a keyed answer when revealing is off', () => {
    const leaky = output({
      summary: 'You should have chosen ACE inhibitors / ARNI.',
      mistakes: [
        { questionNumber: 2, keyConcept: 'HF drugs', explanation: 'The answer is ace inhibitors /   ARNI.' },
        { questionNumber: 3, keyConcept: 'INR', explanation: 'Valve type matters.' },
      ],
      studyPlan: [{ topicId: null, topic: 'HF', reason: 'r', tips: ['Remember 2.5-3.5 for mitral', 'Review guidelines'] }],
    });

    const result = sanitizeAnalysis(leaky, context());
    expect(result.summary).toBe('');
    expect(result.mistakes.map((mistake) => mistake.questionNumber)).toEqual([3]);
    expect(result.studyPlan[0]!.tips).toEqual(['Review guidelines']);
    expect(result.redacted).toBe(3);

    expect(sanitizeAnalysis(leaky, context({ revealCorrectAnswers: true })).redacted).toBe(0);
  });

  it('catches short symbolic answers as whole tokens only, and ignores short plain words', () => {
    const short = context({
      questions: [
        { number: 1, text: 'Obesity BMI?', options: ['≥25', '≥27', '≥30', '≥35'], selectedIndex: 0, correctIndex: 2, topicId: null, topicName: null, difficulty: 'BEGINNER' },
        { number: 2, text: 'Is it benign?', options: ['Yes', 'No', 'Maybe', 'Unknown'], selectedIndex: 0, correctIndex: 1, topicId: null, topicName: null, difficulty: 'BEGINNER' },
        { number: 3, text: 'Dose?', options: ['10', '20', '30', '40'], selectedIndex: 0, correctIndex: 2, topicId: null, topicName: null, difficulty: 'BEGINNER' },
      ],
    });
    const result = sanitizeAnalysis(
      output({
        mistakes: [
          { questionNumber: 1, keyConcept: 'BMI', explanation: 'Obesity starts at ≥30.' },
          { questionNumber: 2, keyConcept: 'No single sign decides it', explanation: 'Look at margins.' },
          { questionNumber: 3, keyConcept: 'Dosing', explanation: 'Guidelines updated in 2030 changed it.' },
        ],
        studyPlan: [],
      }),
      short,
    );

    expect(result.mistakes.map((mistake) => mistake.questionNumber)).toEqual([2, 3]);
    expect(result.redacted).toBe(1);
  });

  it('does not treat a correctly answered question as a leak', () => {
    // question 1's keyed answer appears, but the user already got it right
    const result = sanitizeAnalysis(output({ summary: 'ST elevation in contiguous leads was spot on.' }), context());
    expect(result.summary).not.toBe('');
  });

  it('accepts only known topic ids and bounds the plan', () => {
    const plan = Array.from({ length: 8 }, (_, index) => ({ topicId: index === 0 ? 't-ecg' : 'made-up', topic: `T${index}`, reason: 'r', tips: ['1', '2', '3', '4', '5'] }));
    const result = sanitizeAnalysis(output({ studyPlan: plan }), context());

    expect(result.studyPlan).toHaveLength(5);
    expect(result.studyPlan[0]!.topicId).toBe('t-ecg');
    expect(result.studyPlan[1]!.topicId).toBeNull();
    expect(result.studyPlan[0]!.tips).toHaveLength(4);
  });
});
