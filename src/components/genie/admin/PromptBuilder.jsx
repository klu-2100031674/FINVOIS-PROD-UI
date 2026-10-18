import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { GENIE_QUESTION_MAX_LENGTH } from '../../../api/genieAPI';
import SampleSetLoader from './SampleSetLoader';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200';

/**
 * Edits the suggested prompts shown as chips in the Genie chat. The heading is what users see;
 * the prompt is what Genie is asked. Linked questions limit which answers go with the prompt.
 */
export default function PromptBuilder({ prompts, questions, onChange }) {
  const update = (index, patch) => onChange(prompts.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const move = (index, delta) => {
    const next = [...prompts];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };
  const remove = (index) => onChange(prompts.filter((_, i) => i !== index));
  const add = () =>
    onChange([
      ...prompts,
      { topic: prompts[prompts.length - 1]?.topic || '', heading: '', prompt: '', questionIds: [] },
    ]);
  const toggleQuestion = (index, key) => {
    const current = new Set(prompts[index].questionIds || []);
    if (current.has(key)) current.delete(key);
    else current.add(key);
    update(index, { questionIds: [...current] });
  };

  const linkable = questions.filter((q) => q.key);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-sm text-purple-900">
        Suggested prompts appear as one-tap chips in the chat, grouped by <strong>topic</strong>. Keep the heading
        short and write the prompt the way you want Genie to answer (e.g. "…explain in simple language").
      </div>

      <SampleSetLoader kind="prompts" current={prompts} onChange={onChange} />

      {prompts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500">
          No suggested prompts yet.
        </div>
      )}

      {prompts.map((item, index) => {
        const tooLong = item.prompt.length > GENIE_QUESTION_MAX_LENGTH;
        return (
          <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-purple-100 px-2 text-xs font-bold text-purple-800">
                {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Move up">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === prompts.length - 1} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30" aria-label="Move down">
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => remove(index)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete prompt">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label>
                <span className="text-xs font-semibold text-gray-700">Topic</span>
                <input
                  value={item.topic}
                  onChange={(e) => update(index, { topic: e.target.value })}
                  placeholder="e.g. Subsidy"
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="md:col-span-2">
                <span className="text-xs font-semibold text-gray-700">Heading (what users tap)</span>
                <input
                  value={item.heading}
                  onChange={(e) => update(index, { heading: e.target.value })}
                  maxLength={200}
                  placeholder="e.g. How much subsidy can I get?"
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="md:col-span-3">
                <span className="text-xs font-semibold text-gray-700">Prompt sent to Genie</span>
                <textarea
                  rows={3}
                  value={item.prompt}
                  onChange={(e) => update(index, { prompt: e.target.value })}
                  placeholder="e.g. Based on my category and location, how much subsidy is applicable? Show the calculation in simple language."
                  className={`mt-1 ${inputClass} ${tooLong ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`}
                />
                <span className={`mt-1 block text-right text-xs ${tooLong ? 'text-red-600' : 'text-gray-400'}`}>
                  {item.prompt.length}/{GENIE_QUESTION_MAX_LENGTH}
                </span>
              </label>
            </div>

            {linkable.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-700">
                  Answers to send{' '}
                  <span className="font-normal text-gray-500">
                    ({item.questionIds?.length ? 'only the selected ones' : 'none selected = all answers'})
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {linkable.map((q) => {
                    const active = item.questionIds?.includes(q.key);
                    return (
                      <button
                        key={q.key}
                        type="button"
                        onClick={() => toggleQuestion(index, q.key)}
                        className={`max-w-xs truncate rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                          active
                            ? 'bg-purple-700 text-white ring-purple-700'
                            : 'bg-white text-gray-700 ring-gray-300 hover:ring-purple-400'
                        }`}
                        title={q.label}
                      >
                        {q.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-purple-200 py-3 text-sm font-semibold text-purple-700 hover:border-purple-400 hover:bg-purple-50"
      >
        <Plus className="h-4 w-4" /> Add suggested prompt
      </button>
    </div>
  );
}
