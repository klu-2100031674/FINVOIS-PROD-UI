import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';

/**
 * Floating "Finvois Genie" button for the landing page. Shows a short intro bubble once
 * the visitor has scrolled a little; the bubble can be dismissed.
 */
export default function GenieLauncher() {
  const navigate = useNavigate();
  const [showBubble, setShowBubble] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowBubble(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const open = () => navigate('/genie');

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      {showBubble && !dismissed && (
        <div className="relative max-w-[16rem] rounded-2xl border border-purple-100 bg-white p-4 pr-8 shadow-xl">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="text-sm font-bold text-gray-900">Discover the best business incentive for your MSME</p>
          <p className="mt-1 text-xs text-gray-600">
            Ask Finvois Genie about eligibility, subsidy and documents, in simple and easy language.
          </p>
          <button type="button" onClick={open} className="mt-2 text-xs font-semibold text-purple-700 hover:text-purple-900">
            Start now →
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={open}
        className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 py-3 pl-4 pr-5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300"
        aria-label="Open Finvois Genie"
      >
        <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
          <Sparkles className="h-4 w-4 transition group-hover:rotate-12" />
          <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
        </span>
        Finvois Genie
      </button>
    </div>
  );
}
