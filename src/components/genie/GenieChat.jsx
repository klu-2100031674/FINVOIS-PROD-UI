import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Lightbulb, RotateCcw, SendHorizontal, Sparkles, User } from 'lucide-react';
import SchemeAiChatMarkdown from '../schemeFinder/SchemeAiChatMarkdown';

/**
 * Presentational chat used by Finvois Genie and the scheme AI chat pages.
 *
 * messages: [{ id, role: 'user'|'assistant', content, isError?, retryable? }]
 * suggestions: [{ key, topic?, heading, prompt }]
 * onSend(text, suggestion|null) — parent calls the API and appends messages.
 */
export default function GenieChat({
  schemeName,
  messages,
  loading,
  suggestions = [],
  onSend,
  onRetry,
  maxLength = 1000,
  notice = null,
  emptyTitle,
  emptySubtitle,
}) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTopic, setActiveTopic] = useState(null);
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  const hasConversation = messages.some((m) => m.role === 'user');

  const topics = useMemo(() => {
    const names = [];
    suggestions.forEach((s) => {
      const topic = s.topic || 'Suggested';
      if (!names.includes(topic)) names.push(topic);
    });
    return names;
  }, [suggestions]);
  const currentTopic = activeTopic && topics.includes(activeTopic) ? activeTopic : topics[0];
  const visibleSuggestions = suggestions.filter((s) => (s.topic || 'Suggested') === currentTopic);

  const isStreaming = messages.some((m) => m.streaming);

  useEffect(() => {
    // Smooth scrolling on every streamed word would lag behind, so jump while text streams.
    endRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth', block: 'end' });
  }, [messages, loading, isStreaming]);

  // Grow the textarea with its content (up to ~6 lines)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const send = (text, suggestion = null) => {
    const value = String(text || '').trim();
    if (!value || loading) return;
    setInput('');
    setShowSuggestions(false);
    onSend(value, suggestion);
  };

  const copy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const suggestionPanel = suggestions.length > 0 && (
    <div className="space-y-3">
      {topics.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {topics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setActiveTopic(topic)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                topic === currentTopic
                  ? 'bg-purple-700 text-white'
                  : 'bg-white text-purple-800 ring-1 ring-purple-200 hover:bg-purple-50'
              }`}
            >
              {topic.toLowerCase()}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visibleSuggestions.map((s) => (
          <button
            key={s.key}
            type="button"
            disabled={loading}
            onClick={() => send(s.prompt, s)}
            className="group flex items-start gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2.5 text-left text-sm text-gray-800 shadow-sm transition hover:border-purple-300 hover:bg-purple-50 disabled:opacity-60"
          >
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-purple-500 group-hover:text-purple-700" />
            <span className="line-clamp-2">{s.heading}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {notice}

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {!hasConversation && (
            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-700 text-white shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-['Manrope'] text-base font-bold text-gray-900">
                    {emptyTitle || `Ask me anything about ${schemeName}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {emptySubtitle || 'Eligibility, subsidy, documents, how to apply. Pick a question or type your own.'}
                  </p>
                </div>
              </div>
              {suggestionPanel && <div className="mt-4">{suggestionPanel}</div>}
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div key={message.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isUser ? 'bg-gray-200 text-gray-700' : 'bg-purple-700 text-white'
                  }`}
                  aria-hidden
                >
                  {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </span>
                <div className={`flex min-w-0 max-w-[85%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isUser
                        ? 'rounded-tr-sm bg-purple-700 text-white'
                        : message.isError
                          ? 'rounded-tl-sm border border-red-200 bg-red-50 text-red-800'
                          : 'rounded-tl-sm border border-gray-200 bg-white'
                    }`}
                  >
                    {message.isError ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      <SchemeAiChatMarkdown text={message.content} isUser={isUser} />
                    )}
                    {message.streaming && (
                      <span
                        className="mt-1 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-purple-500 align-middle"
                        aria-hidden
                      />
                    )}
                    {message.interrupted && <p className="mt-2 text-xs italic text-gray-400">Answer cut off.</p>}
                  </div>
                  {!isUser && !message.isError && !message.streaming && message.id !== 'welcome' && (
                    <button
                      type="button"
                      onClick={() => copy(message.id, message.content)}
                      className="mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      {copiedId === message.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === message.id ? 'Copied' : 'Copy'}
                    </button>
                  )}
                  {message.isError && message.retryable && onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(message)}
                      disabled={loading}
                      className="mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Try again
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && !isStreaming && (
            <div className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <span className="flex items-center gap-1.5" aria-label="Genie is typing">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                  <span className="ml-2 text-xs text-gray-500">Reading the scheme documents…</span>
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {hasConversation && suggestions.length > 0 && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setShowSuggestions((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900"
                aria-expanded={showSuggestions}
              >
                <Lightbulb className="h-3.5 w-3.5" /> Suggested questions
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
              </button>
              {showSuggestions && <div className="mt-2 max-h-64 overflow-y-auto">{suggestionPanel}</div>}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              maxLength={maxLength}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={`Ask about ${schemeName}…`}
              className="max-h-40 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-700 text-white transition hover:bg-purple-800 disabled:bg-purple-200"
              aria-label="Send"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-1.5 flex justify-between px-1 text-[11px] text-gray-400">
            <span>Enter to send · Shift+Enter for a new line · Genie can make mistakes, check important details.</span>
            <span className={input.length > maxLength * 0.9 ? 'text-amber-600' : ''}>
              {input.length}/{maxLength}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
