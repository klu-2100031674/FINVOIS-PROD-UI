import React, { useState } from 'react';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { reportHelpAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { ReportHelpCard, ReportHelpTextarea, useReportHelpAccent } from './ReportHelpUi';

/**
 * Lightweight non-realtime discussion thread for report help requests.
 */
export default function ReportHelpUpdatesThread({
  requestId,
  updates = [],
  onPosted,
  accent = 'purple',
  partnerLabel = 'partner',
}) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const a = useReportHelpAccent(accent);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      await reportHelpAPI.postUpdate(requestId, text);
      setMessage('');
      toast.success('Update posted');
      onPosted?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to post update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReportHelpCard className="space-y-5">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.iconBg}`}>
          <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity & updates</h3>
          <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
            Short notes when something changes — not a live chat. Both you and your {partnerLabel} can post here.
          </p>
        </div>
      </div>

      <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {updates.length === 0 && (
          <li className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
            No updates yet. Post when you upload new files or have a question.
          </li>
        )}
        {updates.map((u) => {
          const isHandler = u.author_role === 'agent' || u.author_role === 'admin';
          const handlerTitle =
            u.author_role === 'admin' ? 'Finvois support' : 'Channel partner';
          return (
            <li
              key={u._id}
              className={`rounded-xl border px-4 py-3.5 ${
                isHandler
                  ? accent === 'green'
                    ? 'border-emerald-100 bg-emerald-50/50'
                    : 'border-purple-100 bg-purple-50/60'
                  : 'border-gray-100 bg-gray-50/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-800">
                  {isHandler ? handlerTitle : 'Client'}
                  {u.author_name ? (
                    <span className="font-normal text-gray-500"> · {u.author_name}</span>
                  ) : null}
                </span>
                <time className="text-xs text-gray-400 whitespace-nowrap">
                  {u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}
                </time>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{u.message}</p>
            </li>
          );
        })}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-gray-100">
        <ReportHelpTextarea
          accent={accent}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="e.g. Uploaded updated GST copy — please review."
        />
        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors ${a.btn}`}
        >
          <PaperAirplaneIcon className="w-4 h-4" aria-hidden />
          {submitting ? 'Posting…' : 'Post update'}
        </button>
      </form>
    </ReportHelpCard>
  );
}
