import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  FileText,
  MessageCircle,
  PencilLine,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import finvoisLogo from '../../assets/finvois.png';
import SchemeBanner from '../../components/genie/SchemeBanner';
import { SchemeGridSkeleton, SchemeIntroSkeleton } from '../../components/genie/GenieSkeletons';
import GenieChat from '../../components/genie/GenieChat';
import GenieIntakeForm from '../../components/genie/GenieIntakeForm';
import { visibleAnswers, visibleQuestionKeys } from '../../components/genie/genieQuestionLogic';
import {
  adminGenieAPI,
  GENIE_QUESTION_MAX_LENGTH,
  getGenieScheme,
  listGenieSchemes,
  streamAdminGenieMessage,
  streamGenieMessage,
} from '../../api/genieAPI';
import { saveSchemeFormProgress } from '../../api/schemeFormsAPI';
import {
  ensureFreshSchemeSessionOnFormEntry,
  saveSchemeFormSession,
  withSchemeSessionId,
} from '../../utils/schemeFormSession';

const SESSION_PREFIX = 'finvois_genie_v1_';
// A little above the API's RAG timeout (120s) so its own timeout message arrives first
const CHAT_TIMEOUT_MS = 130000;

const loadSession = (slug) => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_PREFIX + slug) || 'null');
  } catch {
    return null;
  }
};
const saveSession = (slug, value) => {
  try {
    sessionStorage.setItem(SESSION_PREFIX + slug, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the session just won't survive a reload */
  }
};
const clearSession = (slug) => {
  try {
    sessionStorage.removeItem(SESSION_PREFIX + slug);
  } catch {
    /* ignore */
  }
};

/**
 * PMEGP / CMEP / AP IDP answers are also stored like the old application forms did: in the
 * scheme-form session (read by the expert-support page) and as form progress for the admin.
 */
const LEGACY_FORM_SESSION_KEYS = { pmegp: 'pmegpForm', cmep: 'cmepForm', 'ap-idp': 'apIdpForm' };

async function saveLegacyFormAnswers(scheme, answers) {
  const sessionKey = LEGACY_FORM_SESSION_KEYS[scheme.legacyKey];
  if (!sessionKey) return;
  ensureFreshSchemeSessionOnFormEntry(sessionKey);
  const payload = withSchemeSessionId(sessionKey, visibleAnswers(scheme.intakeQuestions, answers));
  saveSchemeFormSession(sessionKey, payload);
  try {
    await saveSchemeFormProgress(scheme.legacyKey, payload);
  } catch (err) {
    console.warn(`[Genie] Could not save ${scheme.legacyKey} answers to the server`, err);
  }
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatAnswer = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  return value === undefined || value === null || value === '' ? '—' : String(value);
};

/** `fitScreen`: exactly the window height (chat), so only the panels inside scroll, not the page. */
function GenieShell({ children, wide = false, fitScreen = false, testBar = null }) {
  return (
    <div
      className={`flex flex-col bg-gradient-to-b from-purple-50/70 via-white to-white font-inter ${
        fitScreen ? 'h-dvh overflow-hidden' : 'min-h-screen'
      }`}
    >
      <header className="sticky top-0 z-40 shrink-0 border-b border-purple-100 bg-white/85 backdrop-blur-lg">
        <div className={`mx-auto flex items-center justify-between px-4 py-3 sm:px-6 ${wide ? 'max-w-7xl' : 'max-w-6xl'}`}>
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img src={finvoisLogo} alt="Finvois" className="h-8 w-auto" />
            </Link>
            <span className="hidden h-6 w-px bg-gray-200 sm:block" />
            <Link to="/genie" className="inline-flex items-center gap-1.5 font-['Manrope'] text-sm font-bold text-purple-800">
              <Sparkles className="h-4 w-4" /> Finvois Genie
            </Link>
          </div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </header>
      {testBar}
      {children}
    </div>
  );
}

function ErrorState({ message, onRetry, exitPath = '/genie', exitLabel = 'All schemes' }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
      <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
      <p className="mt-3 text-sm text-gray-700">{message}</p>
      <div className="mt-4 flex justify-center gap-2">
        {onRetry && (
          <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        )}
        <Link to={exitPath} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          {exitLabel}
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1: which scheme?                                               */
/* ------------------------------------------------------------------ */

function SchemePicker() {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setError('');
    setSchemes(null);
    try {
      setSchemes(await listGenieSchemes());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !schemes) return schemes || [];
    return schemes.filter((s) => `${s.name} ${s.shortDescription}`.toLowerCase().includes(q));
  }, [schemes, query]);

  return (
    <GenieShell>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
            <Sparkles className="h-3.5 w-3.5" /> Your MSME scheme assistant
          </span>
          <h1 className="mt-4 font-['Manrope'] text-3xl font-bold text-gray-900 sm:text-4xl">
            Hi, I&apos;m Finvois Genie!{' '}
            <span role="img" aria-label="waving hand">
              👋
            </span>
          </h1>
          <p className="mt-3 font-['Manrope'] text-lg font-semibold text-purple-700 sm:text-xl">
            Your smart assistant for discovering MSME government schemes.
          </p>
          <p className="mt-3 text-gray-600">
            Choose a scheme or tell me about your business. I&apos;ll guide you through eligibility, subsidies, benefits,
            and required documents based on official guidelines.
          </p>
        </div>

        {schemes && schemes.length > 6 && (
          <div className="relative mx-auto mt-8 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search schemes"
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        )}

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !schemes ? (
          <SchemeGridSkeleton />
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-sm text-gray-500">
            {schemes.length === 0 ? 'No schemes are available yet. Please check back soon.' : 'No scheme matches your search.'}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((scheme) => (
              <button
                key={scheme.slug}
                type="button"
                onClick={() => navigate(`/genie/${scheme.slug}`)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                <SchemeBanner bannerUrl={scheme.bannerUrl} name={scheme.name} rounded="rounded-none" />
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-['Manrope'] text-lg font-bold text-gray-900 group-hover:text-purple-800">{scheme.name}</h2>
                  <p className="mt-1 line-clamp-3 flex-1 text-sm text-gray-600">{scheme.shortDescription}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700">
                    Ask Genie <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </GenieShell>
  );
}

/* ------------------------------------------------------------------ */
/* Steps 2–4: intro → questions → chat                                 */
/* ------------------------------------------------------------------ */

/**
 * `previewId`: admin test mode. Loads the scheme by id even while it is a draft, chats through the
 * admin API and does not save answers as scheme-form progress.
 */
function SchemeSession({ slug, previewId = null }) {
  const navigate = useNavigate();
  const preview = !!previewId;
  const sessionKey = preview ? `preview_${previewId}` : slug;
  const exitPath = preview ? `/admin/genie-schemes/${previewId}` : '/genie';
  const exitLabel = preview ? 'Back to editor' : 'All schemes';
  const testBar = preview ? (
    <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
      <span className="font-semibold">Test mode</span> · only admins can open this, published or draft. Genie uses the
      last saved questions, prompts and documents.{' '}
      <Link to={exitPath} className="font-semibold underline">
        Back to editor
      </Link>
    </div>
  ) : null;
  const [scheme, setScheme] = useState(null);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('intro');
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const requestRef = useRef(null);

  const load = useCallback(async () => {
    setError('');
    setScheme(null);
    try {
      const data = preview ? await adminGenieAPI.preview(previewId) : await getGenieScheme(slug);
      const saved = loadSession(sessionKey);
      setScheme(data);
      setAnswers(saved?.answers || {});
      setMessages(saved?.messages || []);
      setStage(saved?.stage || 'intro');
    } catch (err) {
      setError(err.status === 404 ? 'This scheme is not available.' : err.message);
    }
  }, [slug, preview, previewId, sessionKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (scheme) {
      const settled = messages.filter((m) => !m.isError && !m.streaming && !m.interrupted);
      saveSession(sessionKey, { stage, answers, messages: settled });
    }
  }, [sessionKey, scheme, stage, answers, messages]);

  const hasQuestions = (scheme?.intakeQuestions?.length || 0) > 0;
  const suggestions = useMemo(
    () => (scheme?.suggestedPrompts || []).map((p) => ({ ...p, key: `p-${p.index}` })),
    [scheme]
  );

  const ask = async ({ prompt, display, promptIndex = null, history }) => {
    const controller = new AbortController();
    requestRef.current = controller;
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CHAT_TIMEOUT_MS);

    const assistantId = newId();
    let started = false;
    setLoading(true);
    try {
      const response = await (preview ? streamAdminGenieMessage : streamGenieMessage)(
        preview ? previewId : slug,
        {
          message: prompt,
          answers,
          promptIndex,
          history: history
            .filter((m) => !m.isError && !m.interrupted)
            .map((m) => ({ role: m.role, content: m.role === 'user' ? m.prompt || m.content : m.content })),
        },
        {
          signal: controller.signal,
          // The answer bubble appears with the first words and grows as Genie writes.
          onDelta: (text) => {
            if (!started) {
              started = true;
              setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: text, streaming: true }]);
            } else {
              setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m)));
            }
          },
        }
      );
      if (started) {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)));
      } else {
        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: response || 'I could not find an answer to that.' }]);
      }
    } catch (err) {
      if (err?.name === 'AbortError' && !timedOut) return; // left the page or started a new chat
      setMessages((prev) => [
        // keep what was already written, marked as cut off; Try again replaces it
        ...prev.map((m) => (m.id === assistantId ? { ...m, streaming: false, interrupted: true } : m)),
        {
          id: newId(),
          role: 'assistant',
          isError: true,
          retryable: true,
          retry: { prompt, display, promptIndex },
          content: timedOut ? 'Genie took too long to answer. Please try again.' : err.message,
        },
      ]);
    } finally {
      window.clearTimeout(timer);
      if (!controller.signal.aborted || timedOut) setLoading(false);
    }
  };

  const handleSend = (text, suggestion) => {
    const userMessage = {
      id: newId(),
      role: 'user',
      content: suggestion ? suggestion.heading : text,
      prompt: text,
    };
    const history = messages;
    setMessages((prev) => [...prev, userMessage]);
    ask({ prompt: text, display: userMessage.content, promptIndex: suggestion ? suggestion.index : null, history });
  };

  const handleRetry = (errorMessage) => {
    const remaining = messages.filter((m) => m.id !== errorMessage.id && !m.interrupted);
    setMessages(remaining);
    // history = everything before the user turn being retried
    const lastUser = [...remaining].reverse().find((m) => m.role === 'user');
    const history = lastUser ? remaining.slice(0, remaining.indexOf(lastUser)) : remaining;
    ask({ ...errorMessage.retry, history });
  };

  const startChat = () => setStage('chat');

  const completeQuestions = (finalAnswers) => {
    if (!preview) saveLegacyFormAnswers(scheme, finalAnswers);
    startChat();
  };

  const newChat = () => {
    if (messages.length && !window.confirm('Start a new chat? Your answers are kept; this conversation is cleared.')) return;
    requestRef.current?.abort();
    setLoading(false);
    setMessages([]);
  };

  const resetAll = () => {
    clearSession(sessionKey);
    navigate(exitPath);
  };

  if (error) {
    return (
      <GenieShell testBar={testBar}>
        <ErrorState message={error} onRetry={load} exitPath={exitPath} exitLabel={exitLabel} />
      </GenieShell>
    );
  }

  if (!scheme) {
    return (
      <GenieShell testBar={testBar}>
        <SchemeIntroSkeleton />
      </GenieShell>
    );
  }

  /* ---------------- Intro ---------------- */
  if (stage === 'intro') {
    const minutes = Math.max(1, Math.round((scheme.intakeQuestions.length * 15) / 60));
    return (
      <GenieShell testBar={testBar}>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8 sm:px-6">
          <button type="button" onClick={() => navigate(exitPath)} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> {preview ? 'Back to editor' : 'Choose a different scheme'}
          </button>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SchemeBanner bannerUrl={scheme.bannerUrl} name={scheme.name} rounded="rounded-3xl" className="shadow-md" />
              <h1 className="mt-6 font-['Manrope'] text-3xl font-bold text-gray-900">{scheme.name}</h1>
              <p className="mt-3 whitespace-pre-line text-gray-700">{scheme.description || scheme.shortDescription}</p>
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
                <p className="font-['Manrope'] text-lg font-bold text-gray-900">How Genie helps</p>
                <ol className="mt-4 space-y-4">
                  {hasQuestions && (
                    <li className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-800">
                        <ClipboardList className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Answer {scheme.intakeQuestions.length} quick questions</p>
                        <p className="text-xs text-gray-500">About {minutes} min · about you and your business</p>
                      </div>
                    </li>
                  )}
                  <li className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-800">
                      <MessageCircle className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Ask Genie anything</p>
                      <p className="text-xs text-gray-500">Eligibility, subsidy, documents and how to apply</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-800">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Answers from official documents</p>
                      <p className="text-xs text-gray-500">Genie cites the guideline and page it used</p>
                    </div>
                  </li>
                </ol>
                <button
                  type="button"
                  onClick={() => setStage(hasQuestions ? 'questions' : 'chat')}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-800"
                >
                  <Sparkles className="h-4 w-4" />
                  {hasQuestions ? (Object.keys(answers).length ? 'Continue your answers' : 'Fill form. Get started') : 'Start chatting'}
                </button>
                {hasQuestions && (
                  <button type="button" onClick={startChat} className="mt-2 w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-purple-700 hover:bg-purple-50">
                    Skip form, just ask
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </GenieShell>
    );
  }

  /* ---------------- Questions ---------------- */
  if (stage === 'questions') {
    return (
      <GenieShell testBar={testBar}>
        <main className="w-full flex-1 px-4 pb-16 pt-8 sm:px-6">
          <div className="mx-auto mb-6 flex max-w-2xl items-center gap-3">
            <SchemeBanner bannerUrl={scheme.bannerUrl} name={scheme.name} compact className="w-24 shrink-0" rounded="rounded-lg" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">A few questions first</p>
              <p className="font-['Manrope'] text-lg font-bold text-gray-900">{scheme.name}</p>
            </div>
          </div>
          <GenieIntakeForm
            scheme={scheme}
            answers={answers}
            onAnswersChange={setAnswers}
            onBack={() => setStage(messages.length ? 'chat' : 'intro')}
            onComplete={completeQuestions}
          />
        </main>
      </GenieShell>
    );
  }

  /* ---------------- Chat ---------------- */
  const shownKeys = visibleQuestionKeys(scheme.intakeQuestions, answers);
  const answeredQuestions = scheme.intakeQuestions.filter(
    (q) => shownKeys.has(q.key) && formatAnswer(answers[q.key]) !== '—'
  );
  const detailsPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-bold text-gray-900">Your details</p>
        <button type="button" onClick={() => setDetailsOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {answeredQuestions.length === 0 ? (
          <p className="text-sm text-gray-500">No answers yet. Add them for personalised advice.</p>
        ) : (
          <dl className="space-y-3">
            {answeredQuestions.map((q) => (
              <div key={q.key}>
                <dt className="text-xs text-gray-500">{q.label}</dt>
                <dd className="text-sm font-medium text-gray-900">{formatAnswer(answers[q.key])}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={() => {
            setDetailsOpen(false);
            setStage('questions');
          }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-purple-200 px-3 py-2 text-sm font-semibold text-purple-800 hover:bg-purple-50"
        >
          <PencilLine className="h-4 w-4" /> {answeredQuestions.length ? 'Edit answers' : 'Add answers'}
        </button>
      </div>
    </div>
  );

  return (
    <GenieShell wide fitScreen testBar={testBar}>
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-4 px-0 sm:px-4 sm:py-4">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <SchemeBanner bannerUrl={scheme.bannerUrl} name={scheme.name} compact className="hidden w-16 shrink-0 sm:block" rounded="rounded-md" />
              <div className="min-w-0">
                <p className="truncate font-['Manrope'] text-base font-bold text-gray-900">{scheme.name}</p>
                <p className="text-xs text-gray-500">Finvois Genie · answers from official scheme documents</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {hasQuestions && (
                <button type="button" onClick={() => setDetailsOpen(true)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-purple-800 hover:bg-purple-50 lg:hidden">
                  Your details
                </button>
              )}
              <button
                type="button"
                onClick={newChat}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                <RotateCcw className="h-3.5 w-3.5" /> New chat
              </button>
              <button type="button" onClick={resetAll} className="hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 sm:block">
                {preview ? 'Back to editor' : 'Change scheme'}
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <GenieChat
              schemeName={scheme.name}
              messages={messages}
              loading={loading}
              suggestions={suggestions}
              onSend={handleSend}
              onRetry={handleRetry}
              maxLength={GENIE_QUESTION_MAX_LENGTH}
              notice={
                LEGACY_FORM_SESSION_KEYS[scheme.legacyKey] ? (
                  <div className="flex items-center justify-between gap-3 border-b border-purple-100 bg-purple-50/70 px-4 py-2 text-xs text-purple-900">
                    <span>Want a Finvois expert to help you apply?</span>
                    <Link to={`/schemes/${scheme.legacyKey}/support`} className="shrink-0 font-semibold underline">
                      Request support
                    </Link>
                  </div>
                ) : null
              }
            />
          </div>
        </section>

        {hasQuestions && (
          <aside className="hidden min-h-0 w-72 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:block">
            {detailsPanel}
          </aside>
        )}
      </div>

      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40 lg:hidden" onClick={() => setDetailsOpen(false)}>
          <div className="h-full w-80 max-w-[85vw] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            {detailsPanel}
          </div>
        </div>
      )}
    </GenieShell>
  );
}

/** /genie → pick a scheme; /genie/:slug → intro, questions and chat for that scheme. */
export default function GeniePage() {
  const { slug } = useParams();
  return slug ? <SchemeSession key={slug} slug={slug} /> : <SchemePicker />;
}

/** /admin/genie-schemes/:id/test → the same Genie flow for one scheme, drafts included (admins only). */
export function GenieTestPage() {
  const { id } = useParams();
  return <SchemeSession key={id} previewId={id} />;
}
