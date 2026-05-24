import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import api, { REPORT_HEAVY_TIMEOUT } from '../../../api/apiClient';
import { postSchemeAiChatStream } from '../../../api/schemeAiChatStream';
import {
  isSchemeFormSessionKey,
  loadSchemeFormSession,
  saveSchemeFormSession,
} from '../../../utils/schemeFormSession';
import { formatSchemeChatError } from '../../../utils/schemeChatErrors';
import ChatComposer from './ChatComposer';
import ChatThread from './ChatThread';
import ChatEmptyState from './ChatEmptyState';

/** apiClient rejects with a plain string (see response interceptor), not an AxiosError. */
function apiErrorMessage(err, fallback = 'Failed to get AI response') {
  return formatSchemeChatError(err, fallback);
}

/**
 * Shared scheme AI chat UI (wrapped by ClientLayout or public chrome).
 *
 * @param {object} props
 * @param {string} props.generatePath   "Back to form" target.
 * @param {object} props.config         Scheme-specific config (see *AiChatConfig.js).
 *   - headerTitle, headerDescription, composerPlaceholder
 *   - apiPath: chat endpoint (POST)
 *   - formStateKey: key on react-router `location.state` carrying the form payload
 *   - formPayloadKey: body key when posting (defaults to formStateKey)
 *   - presetPrompts: flat list { heading, prompt } for composer picker (no topic step)
 *   - presetPromptTopics: grouped { topic, prompts[] } — user picks topic then heading; full prompt is sent
 *   - emptyState: copy passed to ChatEmptyState
 */
const SchemeAiChatView = ({ generatePath, config }) => {
  const {
    headerTitle,
    headerDescription,
    composerPlaceholder,
    apiPath,
    formStateKey,
    formPayloadKey = formStateKey,
    presetPrompts = [],
    presetPromptTopics = [],
    emptyState,
  } = config;

  const location = useLocation();
  const routeFormPayload = location.state?.[formStateKey] || null;

  const [persistedForm, setPersistedForm] = useState(() => {
    if (routeFormPayload) return routeFormPayload;
    if (isSchemeFormSessionKey(formStateKey)) {
      return loadSchemeFormSession(formStateKey);
    }
    return null;
  });

  const formPayload = routeFormPayload || persistedForm;

  useEffect(() => {
    if (!routeFormPayload || !isSchemeFormSessionKey(formStateKey)) return;
    saveSchemeFormSession(formStateKey, routeFormPayload);
    setPersistedForm(routeFormPayload);
  }, [routeFormPayload, formStateKey]);

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  /** Fixed scroll-to-top: same vertical line as composer row, flush right of viewport; hidden at page top */
  const [showScrollTopFab, setShowScrollTopFab] = useState(false);
  const [scrollTopFabBottom, setScrollTopFabBottom] = useState(16);

  const composerRowRef = useRef(null);
  const abortRef = useRef(null);

  const missingForm = !formPayload;

  const SCROLL_TOP_THRESHOLD_PX = 48;
  const updateScrollTopFabPosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.scrollY <= SCROLL_TOP_THRESHOLD_PX) {
      setShowScrollTopFab(false);
      return;
    }
    const row = composerRowRef.current;
    if (!row) {
      setScrollTopFabBottom(16);
      setShowScrollTopFab(true);
      return;
    }
    const r = row.getBoundingClientRect();
    const margin = 8;
    const bottom = Math.max(margin, window.innerHeight - r.bottom);
    setScrollTopFabBottom(bottom);
    setShowScrollTopFab(true);
  }, []);

  useEffect(() => {
    updateScrollTopFabPosition();
    window.addEventListener('scroll', updateScrollTopFabPosition, { passive: true });
    window.addEventListener('resize', updateScrollTopFabPosition);
    return () => {
      window.removeEventListener('scroll', updateScrollTopFabPosition);
      window.removeEventListener('resize', updateScrollTopFabPosition);
    };
  }, [updateScrollTopFabPosition]);

  useEffect(() => {
    const row = composerRowRef.current;
    if (!row || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => updateScrollTopFabPosition());
    ro.observe(row);
    return () => ro.disconnect();
  }, [updateScrollTopFabPosition, messages.length, missingForm]);

  const suggestionsSpec = useMemo(() => {
    if (presetPromptTopics?.length) {
      return { mode: 'topics', topics: presetPromptTopics };
    }
    if (presetPrompts?.length) {
      return { mode: 'flat', prompts: presetPrompts };
    }
    return null;
  }, [presetPromptTopics, presetPrompts]);

  const canSend = useMemo(() => {
    return !missingForm && !isLoading && !!String(draft || '').trim();
  }, [missingForm, isLoading, draft]);

  const send = async (override) => {
    const isPreset = !!(override && override.questionText);
    const question = isPreset
      ? String(override.questionText || '').trim()
      : String(draft || '').trim();
    const display = isPreset
      ? String(override.displayText || override.questionText || '').trim()
      : question;

    if (!question) return;
    if (missingForm || isLoading) return;
    if (!isPreset && !canSend) return;

    if (!isPreset) setDraft('');
    setLastError(null);

    const userMsg = { id: `u_${Date.now()}`, role: 'user', content: display };
    const aiMsgId = `a_${Date.now()}`;
    setMessages((m) => [
      ...m,
      userMsg,
      { id: aiMsgId, role: 'assistant', content: '' },
    ]);
    setIsLoading(true);

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const requestBody = {
      question,
      [formPayloadKey]: formPayload,
      ...(override?.standaloneDocument ? { standaloneDocument: true } : {}),
      ...(override?.promptType ? { promptType: override.promptType } : {}),
      ...(override?.includeComputation === false ? { includeComputation: false } : {}),
    };

    const appendToken = (token) => {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === aiMsgId ? { ...msg, content: `${msg.content || ''}${token}` } : msg,
        ),
      );
    };

    try {
      await postSchemeAiChatStream({
        apiPath,
        body: requestBody,
        signal: controller.signal,
        onToken: appendToken,
        onDone: (payload) => {
          // Keep streamed text — backend post-processing must not swap the visible answer.
          if (payload?.preserveStreamContent) return;
          const cleaned = String(payload?.answer || '').trim();
          if (!cleaned) return;
          setMessages((m) =>
            m.map((msg) => (msg.id === aiMsgId ? { ...msg, content: cleaned } : msg)),
          );
        },
      });
      setMessages((m) => {
        const ai = m.find((msg) => msg.id === aiMsgId);
        if (ai && String(ai.content || '').trim()) return m;
        return m.map((msg) =>
          msg.id === aiMsgId ? { ...msg, content: 'No answer returned.' } : msg,
        );
      });
    } catch (err) {
      if (err?.name === 'AbortError') return;

      let msg = apiErrorMessage(err);
      let usedFallback = false;

      try {
        const res = await api.post(apiPath, requestBody, {
          timeout: REPORT_HEAVY_TIMEOUT,
          signal: controller.signal,
        });
        const answer = res?.data?.answer || res?.data?.data?.answer || res?.data?.message;
        const text = String(answer || 'No answer returned.');
        setMessages((m) => m.map((item) => (item.id === aiMsgId ? { ...item, content: text } : item)));
        setLastError(null);
        usedFallback = true;
      } catch (fallbackErr) {
        if (fallbackErr?.name === 'AbortError') return;
        msg = apiErrorMessage(fallbackErr, msg);
      }

      if (!usedFallback) {
        setLastError(msg);
        if (!isPreset) setDraft(question);
        setMessages((m) =>
          m.map((item) =>
            item.id === aiMsgId ? { ...item, content: `Error: ${msg}` } : item,
          ),
        );
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const handlePickPreset = (preset) => {
    if (!preset) return;
    if (preset.composerOnly) {
      composerRowRef.current?.querySelector('textarea')?.focus();
      return;
    }
    send({
      questionText: preset.prompt,
      displayText: preset.heading,
      standaloneDocument: Boolean(preset.standaloneDocument),
      promptType: preset.promptType,
      includeComputation: preset.includeComputation,
    });
  };

  const clear = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setMessages([]);
    setLastError(null);
    setDraft('');
    setIsLoading(false);
  };

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="bg-white flex-1 min-h-0 flex flex-col w-full max-w-5xl mx-auto rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">{headerTitle}</h1>
          <p className="text-xs text-gray-600">{headerDescription}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={generatePath}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
          >
            Back to form
          </Link>
          <button
            type="button"
            onClick={clear}
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {!messages.length ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ChatEmptyState
            missingForm={missingForm}
            formPath={generatePath}
            copy={emptyState}
          />
        </div>
      ) : (
        <ChatThread messages={messages} isLoading={isLoading} />
      )}

      {lastError && (
        <div className="px-4 sm:px-6 py-2 text-xs text-red-700 bg-red-50 border-t border-red-100">
          {lastError}
        </div>
      )}

      <ChatComposer
        ref={composerRowRef}
        value={draft}
        onChange={setDraft}
        onSend={send}
        disabled={missingForm || isLoading}
        placeholder={composerPlaceholder}
        suggestionsSpec={suggestionsSpec}
        onPickSuggestion={handlePickPreset}
        compact
      />

      {showScrollTopFab
        ? createPortal(
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed z-[60] right-4 h-11 w-11 rounded-full border border-gray-200 bg-white shadow-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200"
              style={{ bottom: scrollTopFabBottom }}
              aria-label="Scroll to top"
              title="Scroll to top"
            >
              <ArrowUp className="w-5 h-5" />
            </button>,
            document.body,
          )
        : null}
    </div>
  );
};

export default SchemeAiChatView;
