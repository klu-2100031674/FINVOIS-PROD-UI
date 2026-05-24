import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';

/**
 * @typedef {{ heading: string, prompt: string }} PresetPrompt
 * @typedef {{ topic: string, prompts: PresetPrompt[] }} PromptTopic
 */

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {React.RefObject<HTMLElement | null>} props.anchorRef
 * @param {{ mode: 'flat', prompts: PresetPrompt[] } | { mode: 'topics', topics: PromptTopic[] }} props.spec
 * @param {(preset: PresetPrompt) => void} props.onPick
 * @param {boolean} props.disabled
 */
export default function ChatSuggestionPicker({ open, onClose, anchorRef, spec, onPick, disabled }) {
  const panelRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState({});

  /** @type {['topics' | 'prompts', number]} */
  const [pickerStep, setPickerStep] = useState('topics');
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);

  const layout = useCallback(() => {
    const anchor = anchorRef?.current;
    if (!open || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const w = Math.min(420, Math.max(280, window.innerWidth - 32));
    const left = Math.max(16, Math.min(r.right - w, window.innerWidth - w - 16));
    const maxH = Math.max(160, r.top - 24);
    const bottom = window.innerHeight - r.top + 8;
    setPanelStyle({
      position: 'fixed',
      left,
      width: w,
      bottom,
      maxHeight: maxH,
    });
  }, [open, anchorRef]);

  useLayoutEffect(() => {
    layout();
  }, [layout, open, spec]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => layout();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, layout]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const t = e.target;
      if (anchorRef?.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      onClose?.();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open, onClose, anchorRef]);

  useEffect(() => {
    if (!open) return;
    setPickerStep(spec?.mode === 'topics' ? 'topics' : 'prompts');
    setActiveTopicIndex(0);
  }, [open, spec]);

  if (!open || !spec || disabled) return null;

  const isTopics = spec.mode === 'topics';
  const currentTopic = isTopics && pickerStep === 'prompts' ? spec.topics[activeTopicIndex] : null;
  const flatList =
    spec.mode === 'flat' ? spec.prompts : pickerStep === 'prompts' && currentTopic ? currentTopic.prompts : [];

  const showTopicList = isTopics && pickerStep === 'topics';

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-black/20 sm:bg-transparent" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Suggested prompts"
        className="z-[80] flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 overflow-hidden"
        style={panelStyle}
      >
        <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-gradient-to-r from-purple-50/80 to-white">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700">Suggested prompts</p>
            {showTopicList ? (
              <p className="text-xs text-gray-600">Pick a topic, then a question</p>
            ) : isTopics && currentTopic ? (
              <p className="text-xs text-gray-600 truncate">{currentTopic.topic}</p>
            ) : (
              <p className="text-xs text-gray-600">Choose a question — only the title is shown in chat</p>
            )}
          </div>
          {isTopics && pickerStep === 'prompts' ? (
            <button
              type="button"
              onClick={() => setPickerStep('topics')}
              className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 px-2 py-1 rounded-lg hover:bg-purple-100/80 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Topics
            </button>
          ) : null}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2">
          {showTopicList ? (
            <ul className="space-y-1">
              {spec.topics.map((t, i) => (
                <li key={`topic-${i}-${t.topic}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTopicIndex(i);
                      setPickerStep('prompts');
                    }}
                    className="w-full text-left rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-purple-50 border border-transparent hover:border-purple-200/60 transition"
                  >
                    {t.topic}
                    <span className="block text-[11px] font-normal text-gray-500 mt-0.5">
                      {t.prompts?.length || 0} questions
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-1">
              {flatList.map((p, i) => (
                <li key={`p-${i}-${p.heading.slice(0, 48)}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick?.(p);
                      onClose?.();
                    }}
                    className="w-full text-left rounded-xl px-3 py-2 text-xs font-medium text-gray-800 hover:bg-purple-50 border border-transparent hover:border-purple-200/60 leading-snug transition"
                  >
                    {p.heading}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
