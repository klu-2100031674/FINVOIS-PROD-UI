/**
 * Service Content Editor — Shopify-style Visual / Inline Editor
 * Professional SaaS theme: white + #9333EA (purple)
 * Includes Edit mode (inline editing) and Preview mode (exact public render)
 */

import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  ChevronUp,
  ChevronDown,
  Type,
  AlignLeft,
  Minus,
  Image,
  LayoutPanelLeft,
  Grid2x2,
  List,
  Quote,
  X,
  Eye,
  Pencil,
  Monitor,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────
   THEME TOKENS  (purple #9333EA + white)
───────────────────────────────────────────────────────────────────── */
const P = {
  ring:        'focus:ring-2 focus:ring-[#9333EA]/40 focus:border-[#9333EA]',
  border:      'border-[#9333EA]',
  bg:          'bg-[#9333EA]',
  bgHover:     'hover:bg-[#7e22ce]',
  bgLight:     'bg-[#f5f0ff]',
  text:        'text-[#9333EA]',
  textHover:   'hover:text-[#7e22ce]',
  outline:     'border-[#9333EA]/30 hover:border-[#9333EA]',
  badge:       'bg-[#f5f0ff] text-[#9333EA] border border-[#e9d5ff]',
};

/* ─── Section type definitions ──────────────────────────────────────── */
const SECTION_TYPES = [
  { type: 'heading',   icon: Type,            label: 'Heading' },
  { type: 'paragraph', icon: AlignLeft,       label: 'Paragraph' },
  { type: 'span',      icon: Minus,           label: 'Span' },
  { type: 'image',     icon: Image,           label: 'Image' },
  { type: 'imageText', icon: LayoutPanelLeft, label: 'Image + Text' },
  { type: 'portfolio', icon: Grid2x2,         label: 'Portfolio' },
  { type: 'list',      icon: List,            label: 'List' },
  { type: 'quote',     icon: Quote,           label: 'Quote' },
];

const blankSection = (type) => ({
  type,
  content:  '',
  level:    type === 'heading'   ? 2      : undefined,
  url:      type === 'image'     ? ''     : undefined,
  imageUrl: type === 'imageText' ? ''     : undefined,
  text:     type === 'imageText' ? ''     : undefined,
  position: 'left',
  align:    ['heading', 'paragraph', 'span'].includes(type) ? 'left' : undefined,
  items:    (type === 'portfolio' || type === 'list') ? [] : undefined,
});

/* ─── Add-section picker popup ──────────────────────────────────────── */
function AddSectionPicker({ onAdd, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-72"
    >
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Add section</p>
      <div className="grid grid-cols-2 gap-1.5">
        {SECTION_TYPES.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => { onAdd(type); onClose(); }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#f5f0ff] hover:text-[#9333EA] text-sm text-gray-600 text-left transition-colors font-medium`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Between-section add strip ─────────────────────────────────────── */
function AddStrip({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-center h-8 group">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-100 group-hover:bg-[#e9d5ff] transition-colors" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`relative z-10 w-7 h-7 rounded-full bg-white border-2 border-gray-200 group-hover:border-[#9333EA] group-hover:text-[#9333EA] flex items-center justify-center transition-all shadow-sm`}
      >
        {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      </button>
      {open && <AddSectionPicker onAdd={onAdd} onClose={() => setOpen(false)} />}
    </div>
  );
}

/* ─── Heading level badge selector ──────────────────────────────────── */
const HEADING_CLASSES = {
  1: 'text-4xl font-bold',
  2: 'text-3xl font-semibold',
  3: 'text-2xl font-semibold',
  4: 'text-xl font-medium',
  5: 'text-lg font-medium',
};

/* shared input class */
const inputCls = `w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#9333EA]/30 focus:border-[#9333EA] transition-colors placeholder:text-gray-300`;
const textareaCls = `w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#9333EA]/30 focus:border-[#9333EA] transition-colors resize-none placeholder:text-gray-300`;

/* ─── Section toolbar (up / down / delete) — inline row ─────────────── */
function SectionToolbar({ onUp, onDown, onDelete, disableUp, disableDown }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onUp}     disabled={disableUp}    className="w-7 h-7 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:border-[#9333EA] hover:text-[#9333EA] disabled:opacity-25 transition-colors"><ChevronUp   className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={onDown}   disabled={disableDown}  className="w-7 h-7 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:border-[#9333EA] hover:text-[#9333EA] disabled:opacity-25 transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={onDelete}                         className="w-7 h-7 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors"><Trash2     className="h-3.5 w-3.5" /></button>
    </div>
  );
}

/* ─── Individual inline-editable section renderers ──────────────────── */
function SectionEditor({ section, index, total, onChange, onUp, onDown, onDelete }) {
  const u = (patch) => onChange(index, patch);
  const typeLabel = SECTION_TYPES.find(t => t.type === section.type)?.label || section.type;

  return (
    <div>
      {/* Section header row: type badge + toolbar */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f5f0ff] text-[#9333EA] border border-[#e9d5ff]">
          {typeLabel}
        </span>
        <SectionToolbar
          onUp={onUp} onDown={onDown} onDelete={onDelete}
          disableUp={index === 0} disableDown={index === total - 1}
        />
      </div>

      {/* ── HEADING ── */}
      {section.type === 'heading' && (
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <select
              value={section.level || 2}
              onChange={(e) => u({ level: parseInt(e.target.value) })}
              className="mt-1 text-xs border rounded px-1.5 py-1 bg-gray-50 flex-shrink-0"
            >
              {[1,2,3,4,5].map(n => <option key={n} value={n}>H{n}</option>)}
            </select>
            <input
              type="text"
              value={section.content}
              onChange={(e) => u({ content: e.target.value })}
              placeholder="Heading text…"
              className={`w-full bg-transparent border-b-2 border-transparent focus:border-[#9333EA] outline-none py-1 ${HEADING_CLASSES[section.level || 2]}`}
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <label className="text-xs font-medium text-gray-400">Align:</label>
            <div className="flex gap-1">
              {['left','center','right'].map(a => (
                <button key={a} type="button" onClick={() => u({ align: a })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors capitalize ${
                    (section.align || 'left') === a ? 'bg-[#9333EA] text-white border-[#9333EA]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#9333EA] hover:text-[#9333EA]'
                  }`}>{a}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PARAGRAPH ── */}
      {section.type === 'paragraph' && (
        <div className="space-y-2">
          <textarea
            value={section.content}
            onChange={(e) => u({ content: e.target.value })}
            placeholder="Start typing your paragraph…"
            rows={3}
            className="w-full bg-transparent border-b-2 border-transparent focus:border-[#9333EA] outline-none text-base leading-relaxed resize-none"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-400">Align:</label>
            <div className="flex gap-1">
              {['left','center','right'].map(a => (
                <button key={a} type="button" onClick={() => u({ align: a })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors capitalize ${
                    (section.align || 'left') === a ? 'bg-[#9333EA] text-white border-[#9333EA]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#9333EA] hover:text-[#9333EA]'
                  }`}>{a}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SPAN ── */}
      {section.type === 'span' && (
        <div className="space-y-2">
          <input
            type="text"
            value={section.content}
            onChange={(e) => u({ content: e.target.value })}
            placeholder="Small inline text…"
            className="w-full bg-transparent border-b-2 border-transparent focus:border-[#9333EA] outline-none text-sm text-gray-500"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-400">Align:</label>
            <div className="flex gap-1">
              {['left','center','right'].map(a => (
                <button key={a} type="button" onClick={() => u({ align: a })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors capitalize ${
                    (section.align || 'left') === a ? 'bg-[#9333EA] text-white border-[#9333EA]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#9333EA] hover:text-[#9333EA]'
                  }`}>{a}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE ── */}
      {section.type === 'image' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-400">Image URL</label>
            <input
              type="text"
              value={section.url || ''}
              onChange={(e) => u({ url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-400">Position:</label>
            <div className="flex gap-1">
              {['left','center','right'].map(pos => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => u({ position: pos })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors capitalize ${
                    (section.position || 'center') === pos
                      ? 'bg-[#9333EA] text-white border-[#9333EA]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#9333EA] hover:text-[#9333EA]'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          {section.url ? (
            <div className={`flex ${section.position === 'center' ? 'justify-center' : section.position === 'right' ? 'justify-end' : 'justify-start'}`}>
              <img src={section.url} alt="preview" className="max-w-full max-h-52 rounded-xl shadow-sm object-contain border border-gray-100" />
            </div>
          ) : (
            <div className="h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 gap-2">
              <Image className="h-7 w-7" />
              <span className="text-xs">Image preview</span>
            </div>
          )}
        </div>
      )}

      {/* ── IMAGE + TEXT ── */}
      {section.type === 'imageText' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-400">Image URL</label>
            <input
              type="text"
              value={section.imageUrl || ''}
              onChange={(e) => u({ imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-400">Image side:</label>
            <div className="flex gap-1">
              {[{v:'left',l:'Image Left'},{v:'right',l:'Image Right'}].map(({v,l}) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => u({ position: v })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    (section.position || 'left') === v
                      ? 'bg-[#9333EA] text-white border-[#9333EA]'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-[#9333EA] hover:text-[#9333EA]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className={`flex flex-col md:flex-row items-start gap-4 ${section.position === 'right' ? 'md:flex-row-reverse' : ''}`}>
            {section.imageUrl ? (
              <img src={section.imageUrl} alt="preview" className="w-full md:w-1/2 max-h-52 rounded-xl shadow-sm object-cover border border-gray-100" />
            ) : (
              <div className="w-full md:w-1/2 h-36 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 gap-2">
                <Image className="h-7 w-7" />
                <span className="text-xs">Image preview</span>
              </div>
            )}
            <textarea
              value={section.text || ''}
              onChange={(e) => u({ text: e.target.value })}
              placeholder="Text alongside the image…"
              rows={4}
              className="flex-1 bg-transparent border-b-2 border-transparent focus:border-[#9333EA] outline-none resize-none w-full text-base leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ── PORTFOLIO ── */}
      {section.type === 'portfolio' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(section.items || []).map((item, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2 relative group/card">
                <button
                  type="button"
                  onClick={() => {
                    const items = (section.items || []).filter((_, idx) => idx !== i);
                    u({ items });
                  }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-red-400 opacity-0 group-hover/card:opacity-100 transition-opacity hover:border-red-300"
                >
                  <X className="h-3 w-3" />
                </button>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="w-full h-28 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-28 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                    <Image className="h-6 w-6" />
                  </div>
                )}
                <input
                  type="text"
                  value={item.imageUrl || ''}
                  onChange={(e) => {
                    const items = [...(section.items || [])];
                    items[i] = { ...items[i], imageUrl: e.target.value };
                    u({ items });
                  }}
                  placeholder="Image URL…"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={item.title || ''}
                  onChange={(e) => {
                    const items = [...(section.items || [])];
                    items[i] = { ...items[i], title: e.target.value };
                    u({ items });
                  }}
                  placeholder="Title"
                  className="w-full text-sm font-semibold bg-transparent border-b border-gray-200 focus:border-[#9333EA] outline-none py-1"
                />
                <textarea
                  value={item.description || ''}
                  onChange={(e) => {
                    const items = [...(section.items || [])];
                    items[i] = { ...items[i], description: e.target.value };
                    u({ items });
                  }}
                  placeholder="Short description…"
                  rows={2}
                  className="w-full text-xs text-gray-500 bg-transparent outline-none resize-none"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => u({ items: [...(section.items || []), { title: '', description: '', imageUrl: '' }] })}
              className="min-h-32 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#9333EA] hover:text-[#9333EA] transition-colors"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Add item</span>
            </button>
          </div>
        </div>
      )}

      {/* ── LIST ── */}
      {section.type === 'list' && (
        <div className="space-y-1.5 pl-2">
          {(section.items || []).map((item, i) => (
            <div key={i} className="flex items-center gap-2 group/li">
              <span className="text-[#9333EA] font-bold text-lg leading-none flex-shrink-0">•</span>
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const items = [...(section.items || [])];
                  items[i] = e.target.value;
                  u({ items });
                }}
                placeholder="List item…"
                className="flex-1 bg-transparent border-b border-transparent focus:border-[#9333EA] outline-none text-base py-0.5"
              />
              <button
                type="button"
                onClick={() => u({ items: (section.items || []).filter((_, idx) => idx !== i) })}
                className="opacity-0 group-hover/li:opacity-100 text-red-400 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => u({ items: [...(section.items || []), ''] })}
            className="flex items-center gap-1.5 text-sm text-[#9333EA] hover:text-[#7e22ce] mt-1 font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        </div>
      )}

      {/* ── QUOTE ── */}
      {section.type === 'quote' && (
        <blockquote className="border-l-4 border-[#9333EA] pl-4">
          <textarea
            value={section.content}
            onChange={(e) => u({ content: e.target.value })}
            placeholder="Quote text…"
            rows={2}
            className="w-full bg-transparent italic text-gray-500 text-base outline-none resize-none border-b-2 border-transparent focus:border-[#9333EA]"
          />
        </blockquote>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   PREVIEW RENDERER — modern SaaS style
───────────────────────────────────────────────────────────────────── */
function ContentPreview({ sections }) {
  if (!sections || sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f5f0ff] to-[#ede9fe] flex items-center justify-center shadow-sm">
          <Monitor className="h-7 w-7 text-[#9333EA]" />
        </div>
        <p className="text-sm font-medium text-gray-400">Nothing to preview yet</p>
        <p className="text-xs text-gray-300">Switch to Edit mode and add your first section</p>
      </div>
    );
  }

  const headingStyles = {
    1: 'text-4xl font-extrabold tracking-tight text-gray-900 mb-5 leading-tight',
    2: 'text-3xl font-bold tracking-tight text-gray-900 mb-4 leading-snug',
    3: 'text-2xl font-semibold text-gray-800 mb-3',
    4: 'text-xl font-semibold text-gray-800 mb-2',
    5: 'text-lg font-medium text-gray-700 mb-2',
  };

  return (
    <div className="space-y-8 max-w-none">
      {sections.map((section, i) => {
        const key = `prev-${i}`;

        switch (section.type) {
          case 'heading': {
            const Tag = `h${section.level || 1}`;
            const isH1 = (section.level || 1) === 1;
            const align = section.align || 'left';
            return (
              <div key={key} className={`text-${align}`}>
                {isH1 && <div className={`w-10 h-1 rounded-full bg-[#9333EA] mb-3 ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : ''}`} />}
                <Tag className={headingStyles[section.level || 1]}>
                  {section.content || <span className="text-gray-200">Empty heading</span>}
                </Tag>
              </div>
            );
          }

          case 'paragraph':
            return (
              <p key={key} className={`text-gray-600 text-[1.05rem] leading-8 text-${section.align || 'left'}`}>
                {section.content || <span className="text-gray-200 italic">Empty paragraph</span>}
              </p>
            );

          case 'span':
            return (
              <p key={key} className={`text-${section.align || 'left'}`}>
                <span className="inline-block px-3 py-1 bg-[#f5f0ff] text-[#9333EA] text-sm font-medium rounded-full">
                  {section.content || <span className="text-[#c4b5fd] italic">Empty span</span>}
                </span>
              </p>
            );

          case 'image':
            return section.url ? (
              <div key={key} className={`flex ${section.position === 'center' ? 'justify-center' : section.position === 'right' ? 'justify-end' : 'justify-start'}`}>
                <img
                  src={section.url}
                  alt=""
                  className="max-w-full rounded-2xl shadow-lg ring-1 ring-black/5 object-cover"
                />
              </div>
            ) : (
              <div key={key} className="h-40 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 gap-2">
                <Image className="h-7 w-7" />
                <span className="text-xs">No image URL set</span>
              </div>
            );

          case 'imageText': {
            const isLeft = section.position !== 'right';
            return (
              <div key={key} className={`flex flex-col md:flex-row items-center gap-8 ${isLeft ? '' : 'md:flex-row-reverse'}`}>
                <div className="w-full md:w-1/2 flex-shrink-0">
                  {section.imageUrl
                    ? <img src={section.imageUrl} alt="" className="w-full rounded-2xl shadow-lg ring-1 ring-black/5 object-cover" />
                    : <div className="w-full h-48 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300"><Image className="h-8 w-8" /></div>
                  }
                </div>
                <p className="flex-1 text-gray-600 text-[1.05rem] leading-8">
                  {section.text || <span className="text-gray-200 italic">No text added</span>}
                </p>
              </div>
            );
          }

          case 'portfolio':
            return (
              <div key={key} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(section.items || []).length === 0 && (
                  <div className="col-span-3 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-sm">No portfolio items yet</div>
                )}
                {(section.items || []).map((item, idx) => (
                  <div key={idx} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt={item.title} className="w-full h-44 object-cover" />
                      : <div className="w-full h-44 bg-gradient-to-br from-[#f5f0ff] to-[#ede9fe] flex items-center justify-center"><Image className="h-8 w-8 text-[#c4b5fd]" /></div>
                    }
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title || <span className="text-gray-300">Untitled</span>}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            );

          case 'list':
            return (
              <ul key={key} className="space-y-2.5">
                {(section.items || []).length === 0 && <li className="text-gray-200 italic text-sm">No items yet</li>}
                {(section.items || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-[#9333EA] flex-shrink-0" />
                    <span className="text-gray-600 text-[1.05rem] leading-7">{item}</span>
                  </li>
                ))}
              </ul>
            );

          case 'quote':
            return (
              <div key={key} className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-[#9333EA] to-[#c084fc]" />
                <p className="text-gray-500 text-lg italic leading-8 font-light">
                  {section.content || <span className="text-gray-200">Empty quote</span>}
                </p>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN EDITOR COMPONENT
───────────────────────────────────────────────────────────────────── */
const ServiceContentEditor = ({ initialSections = [], onSave }) => {
  const [sections, setSections] = useState(initialSections);
  const [mode, setMode] = useState('edit'); // 'edit' | 'preview'

  const insertAt = (insertIndex, type) => {
    const s = blankSection(type);
    setSections((prev) => {
      const next = [...prev];
      next.splice(insertIndex, 0, s);
      return next;
    });
  };

  const updateSection = (index, patch) =>
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const removeSection = (index) =>
    setSections((prev) => prev.filter((_, i) => i !== index));

  const moveUp = (index) => {
    if (index === 0) return;
    setSections((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index) => {
    setSections((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  return (
    <div className="min-h-[500px] flex flex-col">

      {/* ─── TOP BAR ─── */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'edit'
                ? 'bg-white text-[#9333EA] shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === 'preview'
                ? 'bg-white text-[#9333EA] shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
        </div>

        {/* Section count badge */}
        <span className="text-xs text-gray-400 font-medium">
          {sections.length} section{sections.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ─── EDIT MODE ─── */}
      {mode === 'edit' && (
        <div className="flex-1">
          <AddStrip onAdd={(type) => insertAt(0, type)} />

          {sections.length === 0 && (
            <div className="text-center py-20 select-none">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f5f0ff] flex items-center justify-center">
                <Plus className="h-7 w-7 text-[#9333EA]" />
              </div>
              <p className="text-sm font-medium text-gray-400">Click the + button to add your first section</p>
              <p className="text-xs text-gray-300 mt-1">Headings, paragraphs, images, portfolios and more</p>
            </div>
          )}

          {sections.map((section, index) => (
            <div key={index}>
              <div className="py-3 px-4 rounded-xl border border-transparent hover:border-[#e9d5ff] hover:bg-[#faf5ff]/40 transition-colors">
                <SectionEditor
                  section={section}
                  index={index}
                  total={sections.length}
                  onChange={updateSection}
                  onUp={() => moveUp(index)}
                  onDown={() => moveDown(index)}
                  onDelete={() => removeSection(index)}
                />
              </div>
              <AddStrip onAdd={(type) => insertAt(index + 1, type)} />
            </div>
          ))}
        </div>
      )}

      {/* ─── PREVIEW MODE ─── */}
      {mode === 'preview' && (
        <div className="flex-1">
          {/* browser chrome bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-b-0 border-gray-200 rounded-t-2xl">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-1 flex items-center gap-2 max-w-sm mx-auto">
                <div className="w-2 h-2 rounded-full bg-[#9333EA]/40" />
                <span className="text-xs text-gray-400 font-mono truncate">yoursite.com/services/...</span>
              </div>
            </div>
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <Eye className="h-3 w-3" /> Live Preview
            </span>
          </div>
          {/* page body */}
          <div className="border border-gray-200 rounded-b-2xl bg-white overflow-hidden">
            <div className="px-8 py-10 md:px-14 md:py-12">
              <ContentPreview sections={sections} />
            </div>
          </div>
        </div>
      )}

      {/* ─── SAVE BAR ─── */}
      <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
        <p className="text-xs text-gray-400">Changes are not saved until you click Save Content.</p>
        <button
          type="button"
          onClick={() => onSave(sections)}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#9333EA] text-white rounded-xl hover:bg-[#7e22ce] font-medium shadow-sm transition-colors text-sm"
        >
          <Save className="h-4 w-4" /> Save Content
        </button>
      </div>
    </div>
  );
};

export default ServiceContentEditor;

