import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import { adminGenieAPI } from '../../../api/genieAPI';

// One request for both tabs (questions and prompts) of the editor.
let setsPromise = null;
const loadSampleSets = () => {
  if (!setsPromise) {
    setsPromise = adminGenieAPI.sampleSets().catch((err) => {
      setsPromise = null;
      throw err;
    });
  }
  return setsPromise;
};

const KINDS = {
  questions: {
    label: 'Load sample questions',
    noun: 'questions',
    pick: (set) => set.questions,
    copy: (q) => ({ ...q, options: [...(q.options || [])], showIf: q.showIf ? { ...q.showIf, values: [...q.showIf.values] } : null }),
  },
  prompts: {
    label: 'Load sample prompts',
    noun: 'suggested prompts',
    pick: (set) => set.prompts,
    copy: (p) => ({ ...p, questionIds: [...(p.questionIds || [])] }),
  },
};

/**
 * Replaces a scheme's questions or suggested prompts with a ready-made set (PMEGP, CMEP,
 * AP IDP or a short demo). Nothing is stored until the admin clicks Save.
 */
export default function SampleSetLoader({ kind, current, onChange }) {
  const config = KINDS[kind];
  const [sets, setSets] = useState(null);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadSampleSets()
      .then((result) => {
        if (!active) return;
        setSets(result);
        setSelected(result[0]?.id || '');
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, []);

  const load = () => {
    const set = sets?.find((s) => s.id === selected);
    const items = set ? config.pick(set) : [];
    if (!items.length) return;
    if (current.length && !window.confirm(`Replace the ${current.length} current ${config.noun} with the ${set.name} set?`)) {
      return;
    }
    onChange(items.map(config.copy));
    toast.success(`Loaded ${items.length} ${config.noun}. Click Save changes to keep them.`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-purple-300 bg-white px-4 py-3 text-sm">
      <span className="inline-flex items-center gap-1.5 font-semibold text-purple-800">
        <Sparkles className="h-4 w-4" /> {config.label}
      </span>
      {error ? (
        <span className="text-xs text-red-600">{error}</span>
      ) : (
        <>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={!sets}
            aria-label={`Sample ${config.noun} set`}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 sm:flex-none"
          >
            {!sets && <option>Loading…</option>}
            {(sets || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {config.pick(s).length} {config.noun}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            disabled={!sets}
            className="rounded-lg bg-purple-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50"
          >
            Load
          </button>
        </>
      )}
    </div>
  );
}
