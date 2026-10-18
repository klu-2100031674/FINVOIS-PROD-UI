/*
 * Rules shared by the Genie intake form, the chat's "Your details" panel and the admin
 * question builder. Visibility follows the API (genieSchemeService.visibleQuestionKeys).
 */

export const isBlank = (value) =>
  Array.isArray(value) ? value.length === 0 : value === undefined || value === null || String(value).trim() === '';

/** '' in `values` means "not answered". Multiple-choice answers match when any value is picked. */
export function showIfMatches(values, value) {
  const wanted = (values || []).map(String);
  const given = isBlank(value) ? [] : Array.isArray(value) ? value.map(String) : [String(value).trim()];
  if (!given.length) return wanted.includes('');
  return given.some((v) => wanted.includes(v));
}

/** Keys of the questions the user can see for these answers (a hidden question counts as unanswered). */
export function visibleQuestionKeys(questions, answers) {
  const byKey = new Map(questions.map((q) => [q.key, q]));
  const memo = new Map();
  const isVisible = (question, depth) => {
    if (memo.has(question.key)) return memo.get(question.key);
    const rule = question.showIf;
    let visible = true;
    if (rule?.key && depth < 25) {
      const parent = byKey.get(rule.key);
      const value = parent && isVisible(parent, depth + 1) ? answers?.[rule.key] : undefined;
      visible = showIfMatches(rule.values, value);
    }
    memo.set(question.key, visible);
    return visible;
  };
  return new Set(questions.filter((q) => isVisible(q, 0)).map((q) => q.key));
}

/** Answers of the visible questions only (hidden follow-ups are left out). */
export function visibleAnswers(questions, answers) {
  const visible = visibleQuestionKeys(questions, answers);
  return Object.fromEntries(Object.entries(answers || {}).filter(([key]) => visible.has(key)));
}

/** "None of the above", "Not paid", "Not investing…" clear the other choices of a multiple-choice question. */
export const isExclusiveOption = (option) => /^(none|not)\b/i.test(String(option).trim());

export const isAnswered = (question, value) => {
  if (question.type === 'multiselect') return Array.isArray(value) && value.length > 0;
  if (question.type === 'yesno') return value === 'Yes' || value === 'No';
  return !isBlank(value);
};

/* ------------------------------------------------------------------ */
/* Test data                                                           */
/* ------------------------------------------------------------------ */

// Matched against "key label" of text questions, first match wins.
const SAMPLE_TEXT = [
  [/e-?mail/i, 'ravikumar@example.com'],
  [/legal ?name|business ?name/i, 'RK Traders'],
  [/mobile|phone/i, '9876543210'],
  [/aadhaar/i, '1234 5678 9012'],
  [/gstin/i, '37ABCDE1234F1Z5'],
  [/udyam/i, 'UDYAM-AP-12-0000123'],
  [/\bpan\b|pan(enterprise|owner)/i, 'ABCDE1234F'],
  [/branch/i, 'Vijayawada Main Branch'],
  [/bank/i, 'State Bank of India'],
  [/mandal/i, 'Vijayawada (Rural)'],
  [/village|city/i, 'Vijayawada'],
  [/district/i, 'Krishna'],
  [/state/i, 'Andhra Pradesh'],
  [/training|institute/i, 'EDP Training (10 days), 2024'],
  [/trade|brand/i, 'RK Bites'],
  [/name/i, 'Ravi Kumar'],
  [/month/i, 'March'],
];

const SAMPLE_NUMBER = [
  [/age/i, '32'],
  [/cibil/i, '745'],
  [/year/i, '2024'],
  [/dependent/i, '2'],
  [/percent|utili[sz]ation|%/i, '70'],
];

const pick = (rules, text, fallback) => rules.find(([re]) => re.test(text))?.[1] ?? fallback;

/** A plausible answer for one question, for quickly testing a scheme's questions. */
function sampleAnswer(question) {
  const text = `${question.key} ${question.label}`;
  const firstOption = question.options?.[0] ?? '';
  switch (question.type) {
    case 'yesno':
      return 'Yes';
    case 'select':
      return firstOption;
    case 'multiselect': {
      const choice = question.options.find((o) => !isExclusiveOption(o)) ?? firstOption;
      return choice ? [choice] : [];
    }
    case 'amount':
      return '500000';
    case 'number':
      return pick(SAMPLE_NUMBER, text, '10');
    case 'date':
      return '2025-04-01';
    case 'textarea':
      return /address/i.test(text)
        ? 'D.No. 12-34, Main Road, Ward 5, Vijayawada, Krishna District, Andhra Pradesh 520010'
        : 'Sample answer for testing: small paper plate manufacturing unit serving local retailers.';
    default:
      return pick(SAMPLE_TEXT, text, 'Sample answer');
  }
}

/** Sample answers for every question (follow-ups included). */
export const buildTestAnswers = (questions) =>
  Object.fromEntries(questions.map((question) => [question.key, sampleAnswer(question)]));

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

const MAX_STEP_WEIGHT = 8;
// Amount boxes sit two to a row, so they take half the room of other questions.
const weightOf = (question) => (question.type === 'amount' ? 0.5 : 1);

/**
 * Consecutive questions with the same section form a step; long sections are split.
 * Steps are built from all questions so they don't reshuffle while the user answers;
 * a follow-up whose parent is in the same step doesn't count towards the step's size.
 */
export function buildSteps(questions) {
  const steps = [];
  questions.forEach((question) => {
    const section = question.section || 'About you';
    const last = steps[steps.length - 1];
    const isFollowUp = !!question.showIf?.key && !!last?.keys.has(question.showIf.key);
    const weight = isFollowUp ? 0 : weightOf(question);
    if (last && last.section === section && last.weight + weight <= MAX_STEP_WEIGHT) {
      last.questions.push(question);
      last.keys.add(question.key);
      last.weight += weight;
    } else {
      steps.push({ section, questions: [question], keys: new Set([question.key]), weight: weightOf(question) });
    }
  });
  return steps;
}
