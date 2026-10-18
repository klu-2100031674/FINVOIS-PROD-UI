import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, FlaskConical, Sparkles } from 'lucide-react';
import { buildSteps, buildTestAnswers, isAnswered, isExclusiveOption, visibleQuestionKeys } from './genieQuestionLogic';

const CARD_OPTION_LIMIT = 6; // more options than this render as a dropdown
const GROUP_TYPES = new Set(['yesno', 'multiselect']);

const isGroup = (question) =>
  GROUP_TYPES.has(question.type) || (question.type === 'select' && question.options.length <= CARD_OPTION_LIMIT);

const fieldClass = (invalid, extra = '') =>
  `w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
    invalid ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
  } ${extra}`;

function QuestionField({ question, value, onChange, invalid }) {
  const id = `genie-q-${question.key}`;
  const describedBy = [question.helpText ? `${id}-help` : '', invalid ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;

  if (question.type === 'yesno') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:max-w-xs" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy}>
        {['Yes', 'No'].map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
              value === option
                ? 'border-purple-600 bg-purple-50 text-purple-800'
                : `${invalid ? 'border-red-200' : 'border-gray-200'} bg-white text-gray-700 hover:border-purple-300`
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === 'select' && question.options.length <= CARD_OPTION_LIMIT) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy}>
        {question.options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option)}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
                active
                  ? 'border-purple-600 bg-purple-50 text-purple-900'
                  : `${invalid ? 'border-red-200' : 'border-gray-200'} bg-white text-gray-800 hover:border-purple-300`
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                }`}
              >
                {active && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'select') {
    return (
      <select
        id={id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={fieldClass(invalid)}
      >
        <option value="">Choose one…</option>
        {question.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (question.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (option) => {
      if (selected.includes(option)) onChange(selected.filter((v) => v !== option));
      else if (isExclusiveOption(option)) onChange([option]);
      else onChange([...selected.filter((v) => !isExclusiveOption(v)), option]);
    };
    return (
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy}>
        {question.options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
                active
                  ? 'border-purple-600 bg-purple-600 text-white'
                  : `${invalid ? 'border-red-200' : 'border-gray-200'} bg-white text-gray-800 hover:border-purple-300`
              }`}
            >
              {active && <Check className="h-4 w-4 shrink-0" />}
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  const common = {
    id,
    value: value ?? '',
    onChange: (e) => onChange(e.target.value),
    placeholder: question.placeholder,
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedBy,
  };

  if (question.type === 'textarea') {
    return <textarea rows={4} {...common} className={fieldClass(invalid)} />;
  }

  if (question.type === 'date') {
    return <input type="date" {...common} className={fieldClass(invalid, 'sm:max-w-xs')} />;
  }

  if (question.type === 'amount') {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-medium text-gray-500">₹</span>
        <input type="number" inputMode="decimal" min={0} {...common} placeholder={question.placeholder || '0'} className={fieldClass(invalid, 'pl-8')} />
      </div>
    );
  }

  return (
    <input
      type={question.type === 'number' ? 'number' : 'text'}
      inputMode={question.type === 'number' ? 'decimal' : undefined}
      {...common}
      className={fieldClass(invalid)}
    />
  );
}

/** Splits a step's questions into runs so consecutive amount questions can sit two to a row. */
function groupAmountRuns(questions) {
  const runs = [];
  questions.forEach((question) => {
    const last = runs[runs.length - 1];
    if (question.type === 'amount' && last?.amount) last.items.push(question);
    else runs.push({ amount: question.type === 'amount', items: [question] });
  });
  return runs;
}

/**
 * Step-by-step intake for a Genie scheme. Questions with a show-if rule appear only when the
 * earlier answer matches. Answers are reported on every change (so the parent can keep them
 * across reloads) and confirmed with onComplete on the last step.
 */
export default function GenieIntakeForm({ scheme, answers, onAnswersChange, onComplete, onBack }) {
  const questions = useMemo(() => scheme.intakeQuestions || [], [scheme.intakeQuestions]);
  const allSteps = useMemo(() => buildSteps(questions), [questions]);
  const visible = visibleQuestionKeys(questions, answers);
  const steps = allSteps
    .map((s) => ({ ...s, questions: s.questions.filter((q) => visible.has(q.key)) }))
    .filter((s) => s.questions.length > 0);

  const [currentStep, setStepIndex] = useState(0);
  const [showErrors, setShowErrors] = useState(false);

  // Answers can hide whole steps (e.g. a branch for another project type), so clamp.
  const stepIndex = Math.min(currentStep, Math.max(steps.length - 1, 0));
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const missing = step ? step.questions.filter((q) => q.required && !isAnswered(q, answers[q.key])) : [];
  const visibleQuestions = questions.filter((q) => visible.has(q.key));
  const answeredCount = visibleQuestions.filter((q) => isAnswered(q, answers[q.key])).length;
  const progress = Math.round(((stepIndex + (missing.length ? 0 : 1)) / Math.max(steps.length, 1)) * 100);

  const setAnswer = (key, value) => onAnswersChange({ ...answers, [key]: value });

  const fillTestData = () => {
    setShowErrors(false);
    onAnswersChange(buildTestAnswers(questions));
  };

  const next = () => {
    if (missing.length) {
      setShowErrors(true);
      const el = document.getElementById(`genie-q-${missing[0].key}-label`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById(`genie-q-${missing[0].key}`)?.focus({ preventScroll: true });
      return;
    }
    setShowErrors(false);
    if (isLast) {
      onComplete(answers);
    } else {
      setStepIndex(stepIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const back = () => {
    setShowErrors(false);
    if (stepIndex === 0) onBack();
    else {
      setStepIndex(stepIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!step) return null;

  const renderQuestion = (question) => {
    const invalid = showErrors && question.required && !isAnswered(question, answers[question.key]);
    const id = `genie-q-${question.key}`;
    const isFollowUp = !!question.showIf?.key && step.keys.has(question.showIf.key);
    const LabelTag = isGroup(question) ? 'p' : 'label';
    return (
      <div key={question.key} className={isFollowUp ? 'border-l-4 border-purple-200 pl-4' : ''}>
        <LabelTag
          id={`${id}-label`}
          {...(LabelTag === 'label' ? { htmlFor: id } : {})}
          className="block text-sm font-semibold text-gray-900"
        >
          {question.label}
          {question.required && <span className="ml-0.5 text-purple-700">*</span>}
        </LabelTag>
        {question.helpText && (
          <p id={`${id}-help`} className="mt-0.5 text-xs text-gray-500">
            {question.helpText}
          </p>
        )}
        <div className="mt-2.5">
          <QuestionField
            question={question}
            value={answers[question.key]}
            onChange={(value) => setAnswer(question.key, value)}
            invalid={invalid}
          />
        </div>
        {invalid && (
          <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600">
            Please answer this question.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-purple-800">
          <span>
            Step {stepIndex + 1} of {steps.length} · {step.section}
          </span>
          <span className="flex items-center gap-3">
            <button
              type="button"
              onClick={fillTestData}
              className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-50"
            >
              <FlaskConical className="h-3.5 w-3.5" /> Fill test data
            </button>
            <span className="text-gray-500">
              {answeredCount}/{visibleQuestions.length} answered
            </span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-purple-100">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all" style={{ width: `${Math.max(progress, 4)}%` }} />
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-['Manrope'] text-xl font-bold text-gray-900">{step.section}</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your answers help Genie check eligibility and work out figures for you. Fields marked * are required; leave
          anything you don&apos;t know blank.
        </p>

        <div className="mt-6 space-y-7">
          {groupAmountRuns(step.questions).map((run) =>
            run.amount && run.items.length > 1 ? (
              <div key={run.items[0].key} className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
                {run.items.map(renderQuestion)}
              </div>
            ) : (
              run.items.map(renderQuestion)
            )
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="button"
          onClick={next}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-800"
        >
          {isLast ? (
            <>
              <Sparkles className="h-4 w-4" /> Start chat with Genie
            </>
          ) : (
            <>
              Continue <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
