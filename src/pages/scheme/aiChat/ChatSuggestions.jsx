import { Sparkles } from 'lucide-react';

/**
 * Quick-pick preset prompts.
 * Clicking a chip dispatches the long `prompt` to the AI but the chat history
 * only shows the short `heading`.
 *
 * @param {Array<{ heading: string, prompt: string }>} prompts
 */
const ChatSuggestions = ({ prompts = [], onPick, disabled }) => {
  if (!prompts.length) return null;
  return (
    <div className="border-b border-gray-200 bg-gradient-to-b from-purple-50/60 to-white">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-700">
            Suggested questions
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p.heading}
              type="button"
              onClick={() => onPick?.(p)}
              disabled={disabled}
              title={p.prompt}
              className="text-left text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {p.heading}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatSuggestions;
