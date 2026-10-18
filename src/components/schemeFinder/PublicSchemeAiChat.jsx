import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, RotateCcw, Sparkles } from 'lucide-react';
import PublicPmepgChrome from './PublicPmepgChrome';
import GenieChat from '../genie/GenieChat';
import { resolveSchemeFormData } from '../../utils/schemeFormSession';
import { getApiBaseUrl } from '../../utils/env';

// Must match the API's MAX_QUESTION_LENGTH (RAG QueryRequest.question max_length).
const MAX_QUESTION_LENGTH = 1000;
// A little above the API's RAG timeout (120s) so the API's own timeout error reaches the user first.
const CHAT_REQUEST_TIMEOUT_MS = 130000;
const API_UNREACHABLE_MSG =
  'Could not reach the server. Please check your connection and try again.';

function formatClientError(error, data = {}, status = null) {
  if (typeof data.error === 'string' && data.error.trim()) return data.error;
  if (Array.isArray(data.details)) return data.details.join('; ');
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (status === 422) {
    return 'Your question is too long for the AI service. Please ask a shorter question.';
  }
  if (status === 503) {
    return 'The AI service is temporarily unavailable. Please try again in a moment.';
  }
  if (error instanceof Error && error.message && error.message !== '[object Object]') {
    return error.message;
  }
  return 'Failed to get an answer. Please try again.';
}

/** Accepts flat [{ heading, prompt, ids }] or grouped [{ topic, questions: [...] }] suggestion configs. */
function normalizeSuggestions(suggestions) {
  return suggestions.flatMap((item, groupIndex) => {
    if (Array.isArray(item.questions)) {
      return item.questions.map((q, i) => ({ ...q, topic: item.topic, key: `${groupIndex}-${i}` }));
    }
    return [{ ...item, key: String(groupIndex) }];
  });
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** AI chat for the PMEGP / CMEP / AP-IDP form flows (same UI as Finvois Genie). */
export default function PublicSchemeAiChat({
  schemeName,
  schemeKey,
  suggestions = [],
  hasAiButton = true,
  formSessionKey = null,
}) {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(null);
  const requestRef = useRef(null);

  const chatSuggestions = useMemo(
    () => (hasAiButton ? normalizeSuggestions(suggestions) : []),
    [hasAiButton, suggestions]
  );

  useEffect(() => {
    if (!formSessionKey) return;
    setFormData(resolveSchemeFormData(formSessionKey, location.state));
  }, [formSessionKey, location.state]);

  // Cancel an in-flight request when the chat unmounts
  useEffect(() => () => requestRef.current?.abort(), []);

  const ask = async ({ prompt, questionIds, history }) => {
    const controller = new AbortController();
    requestRef.current = controller;
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CHAT_REQUEST_TIMEOUT_MS);

    setLoading(true);
    try {
      const resolvedFormData = resolveSchemeFormData(formSessionKey, location.state);
      if (resolvedFormData !== formData) setFormData(resolvedFormData);

      const body = {
        action: 'chat',
        message: prompt,
        // Real prompts (not chip headings), no error bubbles
        history: history
          .filter((m) => !m.isError)
          .map((m) => ({ sender: m.role === 'user' ? 'user' : 'ai', text: m.role === 'user' ? m.prompt || m.content : m.content })),
        formData: resolvedFormData,
      };
      if (Array.isArray(questionIds)) body.questionIds = questionIds;

      const apiBase = getApiBaseUrl().replace(/\/$/, '');
      const response = await fetch(`${apiBase}/schemes/${schemeKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Public scheme chat is cross-origin in deploy — omit cookies to avoid strict CORS.
        credentials: 'omit',
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const rawText = await response.text();
      let data = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(response.ok ? 'Server returned an invalid response. Please try again.' : API_UNREACHABLE_MSG);
        }
      } else if (!response.ok) {
        throw new Error(API_UNREACHABLE_MSG);
      }
      if (!response.ok) throw new Error(formatClientError(null, data, response.status));

      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', content: data.response || '' }]);
    } catch (error) {
      if (error?.name === 'AbortError' && !timedOut) return; // unmounted mid-request
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          isError: true,
          retryable: true,
          retry: { prompt, questionIds },
          content: timedOut ? 'The AI service took too long to answer. Please try again.' : formatClientError(error),
        },
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      if (requestRef.current === controller) requestRef.current = null;
      if (!controller.signal.aborted || timedOut) setLoading(false);
    }
  };

  const handleSend = (text, suggestion) => {
    const userMessage = { id: newId(), role: 'user', content: suggestion ? suggestion.heading : text, prompt: text };
    const history = messages;
    setMessages((prev) => [...prev, userMessage]);
    ask({ prompt: text, questionIds: Array.isArray(suggestion?.ids) ? suggestion.ids : null, history });
  };

  const handleRetry = (errorMessage) => {
    const remaining = messages.filter((m) => m.id !== errorMessage.id);
    setMessages(remaining);
    const lastUser = [...remaining].reverse().find((m) => m.role === 'user');
    ask({ ...errorMessage.retry, history: lastUser ? remaining.slice(0, remaining.indexOf(lastUser)) : remaining });
  };

  const formPath = location.pathname.replace(/\/ai-chat\/?$/, '');

  return (
    <PublicPmepgChrome contentClassName="pt-20 pb-4 px-0 sm:px-6">
      <div className="mx-auto flex h-[calc(100vh-100px)] max-w-5xl flex-col overflow-hidden bg-white sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-['Manrope'] text-base font-bold leading-tight text-gray-900">{schemeName} AI Advisor</h2>
              <p className="text-xs text-gray-500">Finvois Genie · answers from official scheme documents</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                requestRef.current?.abort();
                setLoading(false);
                setMessages([]);
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              <RotateCcw className="h-3.5 w-3.5" /> New chat
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1">
          <GenieChat
            schemeName={schemeName}
            messages={messages}
            loading={loading}
            suggestions={chatSuggestions}
            onSend={handleSend}
            onRetry={handleRetry}
            maxLength={MAX_QUESTION_LENGTH}
            emptySubtitle={
              formData
                ? 'I have your form answers, so I can work out eligibility and subsidy for you. Pick a question or type your own.'
                : undefined
            }
            notice={
              formSessionKey && !formData ? (
                <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                  <span>Fill the {schemeName} form first for personalised answers. You can still ask general questions.</span>
                  <Link to={formPath} className="inline-flex shrink-0 items-center gap-1 font-semibold underline">
                    <ClipboardList className="h-3.5 w-3.5" /> Open form
                  </Link>
                </div>
              ) : null
            }
          />
        </div>
      </div>
    </PublicPmepgChrome>
  );
}
