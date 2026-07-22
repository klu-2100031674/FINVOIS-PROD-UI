import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Sparkles, User, Bot, Loader2, ArrowLeft, X, Copy, Check } from 'lucide-react';
import PublicPmepgChrome from './PublicPmepgChrome';
import SchemeAiChatMarkdown from './SchemeAiChatMarkdown';
import { resolveSchemeFormData } from '../../utils/schemeFormSession';
import { getApiBaseUrl } from '../../utils/env';

const MAX_QUESTION_LENGTH = 10000;
const API_UNREACHABLE_MSG =
  'Could not reach the API server. Check that the backend is running and VITE_API_BASE_URL points to it.';

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
  return 'Failed to communicate with AI RAG model';
}

export default function PublicSchemeAiChat({
  schemeName,
  schemeKey,
  suggestions = [],
  hasAiButton = true,
  formSessionKey = null,
}) {
  const location = useLocation();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am your AI consultant for the **${schemeName}** scheme. Feel free to ask me anything about the guidelines, requirements, subsidies, or application process.`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(
    () => hasAiButton && suggestions.length > 0,
  );
  const [activeTopic, setActiveTopic] = useState(null);
  const [formData, setFormData] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  const isGrouped = suggestions.length > 0 && !!suggestions[0].topic;

  useEffect(() => {
    if (!formSessionKey) return;
    setFormData(resolveSchemeFormData(formSessionKey, location.state));
  }, [formSessionKey, location.state]);

  // Reset active topic when panel is toggled
  useEffect(() => {
    if (!showSuggestions) {
      setActiveTopic(null);
    }
  }, [showSuggestions]);

  const chatEndRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend, displayHeading = null) => {
    if (!textToSend || !textToSend.trim()) return;

    const userMessageText = displayHeading || textToSend;
    const userMsg = {
      id: String(Date.now()),
      sender: 'user',
      text: userMessageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      const resolvedFormData = resolveSchemeFormData(formSessionKey, location.state);
      if (resolvedFormData !== formData) {
        setFormData(resolvedFormData);
      }

      // Build history payload for the backend API
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      const apiBase = getApiBaseUrl().replace(/\/$/, '');
      const response = await fetch(`${apiBase}/${schemeKey}-ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          formData: resolvedFormData,
        }),
      });

      const rawText = await response.text();
      let data = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(
            response.ok
              ? 'Server returned an invalid response. Please try again.'
              : API_UNREACHABLE_MSG,
          );
        }
      } else if (!response.ok) {
        throw new Error(API_UNREACHABLE_MSG);
      }

      if (!response.ok) {
        throw new Error(formatClientError(null, data, response.status));
      }

      const aiMsg = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      const errMsg = {
        id: String(Date.now() + 2),
        sender: 'ai',
        text: `Sorry, I encountered an error while processing your request: *${formatClientError(error)}*. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion.prompt, suggestion.heading);
  };

  const handleCopyMessage = async (messageId, text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      window.setTimeout(() => {
        setCopiedMessageId((current) => (current === messageId ? null : current));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <PublicPmepgChrome contentClassName="pt-20 pb-4 px-6">
      <div className="relative max-w-5xl mx-auto flex flex-col h-[calc(100vh-100px)] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden font-['Inter']">
        {/* Chat Header */}
        <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between shadow-sm border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Bot className="w-6 h-6 text-slate-800" />
            </div>
            <div>
              <h2 className="font-bold text-[1.0125rem] leading-tight text-slate-900">{schemeName} AI Advisor</h2>
            </div>
          </div>
        </div>

        {formSessionKey && !formData && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-[0.788rem] text-amber-900">
            Complete the {schemeName} form first for personalized answers. You can still ask general scheme questions.
          </div>
        )}

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse max-w-[85%]' : 'max-w-[92%]'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`rounded-2xl shadow-sm min-w-0 relative ${
                  msg.sender === 'user'
                    ? 'px-4 py-3 bg-slate-800 text-white rounded-tr-none'
                    : 'px-5 py-4 pr-10 bg-white border border-slate-200 text-gray-800 rounded-tl-none'
                }`}
              >
                {msg.sender === 'ai' && (
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                    className="absolute top-2 right-2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title={copiedMessageId === msg.id ? 'Copied!' : 'Copy response'}
                    aria-label={copiedMessageId === msg.id ? 'Copied' : 'Copy response'}
                  >
                    {copiedMessageId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                <SchemeAiChatMarkdown text={msg.text} isUser={msg.sender === 'user'} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-gray-500 flex items-center gap-2 rounded-tl-none shadow-sm text-[0.788rem]">
                <Loader2 className="w-4 h-4 animate-spin text-slate-650" />
                <span>AI is analyzing guidelines...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggestions Popover Panel - Floating at the right bottom above the input bar */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-[84px] right-6 z-40 w-80 sm:w-[450px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-y-auto max-h-[380px] p-4 flex flex-col gap-2 font-['Inter']">
            {isGrouped ? (
              activeTopic === null ? (
                // Grouped Suggestions: Topic List View
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                    <span className="text-[0.675rem] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-slate-500" /> Select a Topic
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                      aria-label="Close suggestions"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {suggestions.map((group, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveTopic(group.topic)}
                        className="w-full text-left px-3 py-2 text-[0.788rem] bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-lg transition-colors flex justify-between items-center"
                      >
                        <span className="font-semibold truncate">{group.topic}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Grouped Suggestions: Questions Under Selected Topic
                <div>
                  <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setActiveTopic(null)}
                      className="text-[0.675rem] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-100 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Topics
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                      aria-label="Close suggestions"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {suggestions
                      .find((group) => group.topic === activeTopic)
                      ?.questions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(q)}
                          className="w-full text-left px-3 py-2 text-[0.788rem] bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-lg transition-colors whitespace-normal break-words leading-relaxed"
                          title={q.heading}
                        >
                          {q.heading}
                        </button>
                      ))}
                  </div>
                </div>
              )
            ) : (
              // Flat Suggestions View (PMEGP, CMEP)
              <div>
                <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-2">
                  <span className="text-[0.675rem] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" /> Frequent Questions
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                    aria-label="Close suggestions"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full text-left px-3 py-2 text-[0.788rem] bg-slate-50 text-slate-800 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-lg transition-colors whitespace-normal break-words leading-relaxed"
                      title={s.heading}
                    >
                      {s.heading}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="border-t border-slate-200 px-6 py-4 bg-white flex items-center gap-3 relative"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder={`Ask a question about ${schemeName}...`}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent text-[0.788rem] disabled:bg-gray-50 text-slate-800"
          />

          {hasAiButton && suggestions.length > 0 && (
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`flex-none w-11 h-11 border rounded-xl flex items-center justify-center transition-all ${
                showSuggestions
                  ? 'bg-slate-800 text-white border-slate-800 shadow-inner'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              }`}
              title="View suggested questions"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          )}

          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="flex-none bg-slate-800 text-white hover:bg-slate-900 disabled:bg-slate-300 px-5 py-3 rounded-xl transition-colors font-semibold text-[0.788rem] flex items-center gap-2 shadow-sm"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </PublicPmepgChrome>
  );
}
