import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import api, { apiErrorMessage } from '../../api/apiClient';
import toast from 'react-hot-toast';

const UNLOCKED = new Set(['claimed', 'assigned', 'completed']);
const POLL_MS = 12000;

/**
 * @param {{
 *   requestId: string,
 *   apiBase: string,
 *   status: string,
 *   currentUserId?: string,
 *   readOnly?: boolean,
 *   compact?: boolean,
 * }} props
 */
export default function RequestChatPanel({
  requestId,
  apiBase,
  status,
  currentUserId,
  readOnly = false,
  compact = false,
}) {
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState({ collaborationUnlocked: false, canMutate: false });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const bottomRef = useRef(null);

  const unlocked = UNLOCKED.has(String(status || ''));
  const canPost = !readOnly && Boolean(meta.canMutate);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!requestId || !apiBase) return;
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`${apiBase}/messages`);
      setMessages(res.data?.data || []);
      setMeta(res.data?.meta || {});
    } catch (err) {
      if (!silent) toast.error(apiErrorMessage(err, 'Failed to load chat'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [apiBase, requestId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => load({ silent: true }), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    // Scroll only inside the message list so long threads do not jump the page.
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    const body = draft.trim();
    if (!body) return;
    if (!canPost) {
      toast.error('Chat unlocks after a customer-service agent claims or is assigned to this request.');
      return;
    }
    try {
      setSending(true);
      const res = await api.post(`${apiBase}/messages`, { body });
      const created = res.data?.data;
      if (created) {
        setMessages((prev) => [...prev, created]);
      } else {
        await load({ silent: true });
      }
      setDraft('');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  const shellClass = compact
    ? 'bg-white rounded-xl border border-gray-200 p-3 flex flex-col min-h-0'
    : 'bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col min-h-[320px]';

  const listMaxClass = compact ? 'max-h-[40vh]' : 'max-h-80';

  return (
    <div className={shellClass}>
      <div className={`${compact ? 'mb-2 pb-1' : 'mb-4 pb-2'} border-b`}>
        <h2 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-gray-800 flex items-center gap-2`}>
          <MessageSquare size={compact ? 14 : 18} className="text-purple-700" />
          Chat
          {readOnly && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              View only
            </span>
          )}
        </h2>
        {!compact && (
          <p className="text-xs text-gray-500 mt-1">
            Chat continues if another agent claims this request.
          </p>
        )}
      </div>

      {!unlocked && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
          Not Claimed Yet
        </p>
      )}

      <div
        ref={listRef}
        className={`flex-1 overflow-y-auto ${listMaxClass} space-y-3 mb-3 pr-1 overscroll-contain`}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = String(m.senderId) === String(currentUserId);
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    mine
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className={`text-[10px] font-semibold mb-0.5 ${mine ? 'text-purple-100' : 'text-gray-500'}`}>
                    {m.senderName || m.senderRole}
                    {m.createdAt ? ` · ${new Date(m.createdAt).toLocaleString()}` : ''}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {!readOnly && (
        <form onSubmit={send} className="flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!canPost || sending}
            rows={2}
            maxLength={4000}
            placeholder={
              canPost
                ? 'Write a comment…'
                : 'Chat unlocks after claim or assignment'
            }
            className={`flex-1 rounded-lg border px-3 py-2 text-sm resize-none ${
              canPost
                ? 'border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          />
          <button
            type="submit"
            disabled={!canPost || sending || !draft.trim()}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
              canPost && draft.trim() && !sending
                ? 'bg-purple-700 text-white hover:bg-purple-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={14} />
            Send
          </button>
        </form>
      )}
    </div>
  );
}
