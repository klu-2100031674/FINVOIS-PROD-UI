import { ArrowDown, ArrowUp, Eye, ListPlus, Plus, Trash2 } from 'lucide-react';
import { GENIE_QUESTION_TYPES } from '../../../api/genieAPI';
import SampleSetLoader from './SampleSetLoader';

/** Same rule as the API: "Total project cost (₹)" → "total_project_cost". */
const questionKeyFromLabel = (label) =>
  String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200';

const hasOptions = (type) => type === 'select' || type === 'multiselect';
const canControlOthers = (question) => !!question.key && (hasOptions(question.type) || question.type === 'yesno');
const answersOf = (question) => (question.type === 'yesno' ? ['Yes', 'No'] : (question.options || []).filter(Boolean));
const NOT_ANSWERED = '';

/** "Show only when <earlier question> is <answers>" editor for one question. */
function ShowIfEditor({ question, index, questions, onChange }) {
  const parents = questions.slice(0, index).filter(canControlOthers);
  const rule = question.showIf;
  const parent = rule ? questions.find((q) => q.key === rule.key) : null;

  if (!rule) {
    return (
      <button
        type="button"
        onClick={() => parents.length && onChange({ key: parents[parents.length - 1].key, values: [] })}
        disabled={!parents.length}
        title={parents.length ? '' : 'Add a choice or Yes / No question above this one first'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        <Eye className="h-3.5 w-3.5" /> Show only when another answer matches…
      </button>
    );
  }

  const values = rule.values || [];
  const toggleValue = (value) =>
    onChange({ ...rule, values: values.includes(value) ? values.filter((v) => v !== value) : [...values, value] });

  return (
    <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-700">
        <Eye className="h-3.5 w-3.5 text-purple-600" /> Show only when
        <select
          value={rule.key}
          onChange={(e) => onChange({ key: e.target.value, values: [] })}
          className="max-w-xs rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-normal focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
        >
          {!parent && <option value={rule.key}>(missing question)</option>}
          {parents.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label || p.key}
            </option>
          ))}
        </select>
        is
        <button type="button" onClick={() => onChange(null)} className="ml-auto text-xs font-semibold text-gray-500 hover:text-red-600">
          Always show
        </button>
      </div>
      {parent && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[...answersOf(parent), NOT_ANSWERED].map((value) => {
            const active = values.includes(value);
            return (
              <button
                key={value || '__blank'}
                type="button"
                aria-pressed={active}
                onClick={() => toggleValue(value)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  active ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                } ${value === NOT_ANSWERED ? 'italic' : ''}`}
              >
                {value === NOT_ANSWERED ? 'Not answered / hidden' : value}
              </button>
            );
          })}
        </div>
      )}
      {parent && values.length === 0 && <p className="mt-1.5 text-xs text-red-600">Pick at least one answer.</p>}
    </div>
  );
}

/** Gives a new question a key that no other question uses. */
function uniqueKey(base, questions, selfIndex) {
  const taken = new Set(questions.filter((_, i) => i !== selfIndex).map((q) => q.key));
  let key = base || `q_${selfIndex + 1}`;
  let n = 2;
  while (taken.has(key)) key = `${base || 'q'}_${n++}`;
  return key;
}

/**
 * Edits the questions Genie asks after a user picks this scheme. Answers are sent with
 * every chat message so Genie can personalise eligibility, subsidy and documents advice.
 */
export default function QuestionBuilder({ questions, onChange }) {
  const update = (index, patch) => onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  const move = (index, delta) => {
    const next = [...questions];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };
  // Removing a question also drops show-if rules that pointed at it.
  const remove = (index) => {
    const removedKey = questions[index].key;
    onChange(
      questions
        .filter((_, i) => i !== index)
        .map((q) => (removedKey && q.showIf?.key === removedKey ? { ...q, showIf: null } : q))
    );
  };
  const add = () =>
    onChange([
      ...questions,
      {
        key: '',
        label: '',
        type: 'text',
        options: [],
        required: false,
        helpText: '',
        placeholder: '',
        section: questions[questions.length - 1]?.section || '',
        showIf: null,
      },
    ]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-sm text-purple-900">
        Users answer these after choosing the scheme in Genie, a few at a time grouped by <strong>section</strong>.
        Ask what changes the answer: category, location, project cost, business type, prior benefits. Use{' '}
        <strong>Show only when…</strong> for follow-up questions, and <strong>Amount (₹)</strong> for money. In a
        multiple-choice question, an option starting with &ldquo;None&rdquo; or &ldquo;Not&rdquo; clears the others.
      </div>

      <SampleSetLoader kind="questions" current={questions} onChange={onChange} />

      {questions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
          No questions yet. Without questions, Genie starts chatting straight away and gives general answers.
        </div>
      )}

      {questions.map((question, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-purple-100 px-2 text-xs font-bold text-purple-800">
              {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                aria-label="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === questions.length - 1}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                aria-label="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Delete question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="text-xs font-semibold text-gray-700">Question</span>
              <input
                value={question.label}
                onChange={(e) => update(index, { label: e.target.value })}
                onBlur={() => {
                  if (!question.key && question.label.trim()) {
                    update(index, { key: uniqueKey(questionKeyFromLabel(question.label), questions, index) });
                  }
                }}
                placeholder="e.g. Which social category do you belong to?"
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label>
              <span className="text-xs font-semibold text-gray-700">Answer type</span>
              <select
                value={question.type}
                onChange={(e) => update(index, { type: e.target.value })}
                className={`mt-1 ${inputClass}`}
              >
                {GENIE_QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            {hasOptions(question.type) && (
              <label className="md:col-span-3">
                <span className="text-xs font-semibold text-gray-700">Options</span>
                <span className="ml-1 text-xs text-gray-500">(one per line, at least 2)</span>
                <textarea
                  rows={3}
                  value={(question.options || []).join('\n')}
                  onChange={(e) => update(index, { options: e.target.value.split('\n') })}
                  onBlur={() => update(index, { options: (question.options || []).map((o) => o.trim()).filter(Boolean) })}
                  placeholder={'General\nOBC\nSC\nST'}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
            )}

            <label>
              <span className="text-xs font-semibold text-gray-700">Section</span>
              <input
                value={question.section}
                onChange={(e) => update(index, { section: e.target.value })}
                placeholder="e.g. About you"
                className={`mt-1 ${inputClass}`}
              />
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold text-gray-700">Help text</span>
              <input
                value={question.helpText}
                onChange={(e) => update(index, { helpText: e.target.value })}
                placeholder="Short hint shown under the question"
                className={`mt-1 ${inputClass}`}
              />
            </label>
            {!hasOptions(question.type) && question.type !== 'yesno' && question.type !== 'date' && (
              <label className="md:col-span-2">
                <span className="text-xs font-semibold text-gray-700">Placeholder</span>
                <input
                  value={question.placeholder}
                  onChange={(e) => update(index, { placeholder: e.target.value })}
                  placeholder="Example answer shown in the empty box"
                  className={`mt-1 ${inputClass}`}
                />
              </label>
            )}
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={!!question.required}
                onChange={(e) => update(index, { required: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-purple-700 focus:ring-purple-300"
              />
              Required
            </label>
          </div>
          <div className="mt-3">
            <ShowIfEditor
              question={question}
              index={index}
              questions={questions}
              onChange={(showIf) => update(index, { showIf })}
            />
          </div>
          {question.key && <p className="mt-2 text-[11px] text-gray-400">ID: {question.key}</p>}
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 py-3 text-sm font-semibold text-purple-700 hover:border-purple-400 hover:bg-purple-50"
      >
        {questions.length ? <Plus className="h-4 w-4" /> : <ListPlus className="h-4 w-4" />} Add question
      </button>
    </div>
  );
}
