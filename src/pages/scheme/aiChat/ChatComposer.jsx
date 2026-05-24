import { forwardRef, useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import ChatSuggestionPicker from './ChatSuggestionPicker';

const ChatComposer = forwardRef(function ChatComposer(
  {
    value,
    onChange,
    onSend,
    disabled,
    placeholder = 'Ask a question',
    /** @type {null | { mode: 'flat', prompts: Array<{heading:string,prompt:string}> } | { mode: 'topics', topics: Array<{topic:string,prompts:Array<{heading:string,prompt:string}>}> }} */
    suggestionsSpec = null,
    onPickSuggestion,
    compact = false,
  },
  forwardedRef,
) {
  const textareaRef = useRef(null);
  const suggestionsAnchorRef = useRef(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

  useEffect(() => {
    if (disabled) setSuggestionsOpen(false);
  }, [disabled]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (disabled || !String(value || '').trim()) return;
      onSend?.();
    }
  };

  const hasSuggestions = !!(suggestionsSpec && (suggestionsSpec.mode === 'flat' ? suggestionsSpec.prompts?.length : suggestionsSpec.topics?.length));

  return (
    <div
      className={
        compact
          ? 'border-t border-gray-200 bg-white px-3 py-2 sm:px-4 sm:pt-3 sm:pb-2'
          : 'border-t border-gray-200 bg-white p-3 sm:p-4'
      }
    >
      <div ref={forwardedRef} className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
          disabled={disabled}
        />
        {hasSuggestions ? (
          <button
            ref={suggestionsAnchorRef}
            type="button"
            onClick={() => setSuggestionsOpen((o) => !o)}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={suggestionsOpen}
            title="Suggested prompts"
            className="rounded-xl border border-gray-200 bg-white text-purple-700 h-[38px] w-[38px] shrink-0 inline-flex items-center justify-center hover:bg-purple-50 hover:border-purple-300 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
          >
            <Sparkles className="w-5 h-5" />
            <span className="sr-only">Open suggested prompts</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !String(value || '').trim()}
          className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-semibold shrink-0 h-[38px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition"
        >
          Send
        </button>
      </div>
      <p className={`text-[11px] text-gray-500 ${compact ? 'mt-1' : 'mt-2'}`}>
        Enter to send • Shift+Enter for a new line
      </p>
      {hasSuggestions ? (
        <ChatSuggestionPicker
          open={suggestionsOpen}
          onClose={() => setSuggestionsOpen(false)}
          anchorRef={suggestionsAnchorRef}
          spec={suggestionsSpec}
          onPick={(p) => {
            onPickSuggestion?.(p);
            setSuggestionsOpen(false);
          }}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
});

export default ChatComposer;
