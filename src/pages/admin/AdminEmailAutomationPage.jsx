/**
 * Admin Email Automation Page
 * Upload Excel -> validate -> review -> pick/create template -> schedule -> track.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Mail, Upload, FileText, RefreshCw, Trash2, Eye, X, Save, Send, Clock, CheckCircle2,
  AlertTriangle, Plus, Pencil, Ban, RotateCcw, Play, Copy, Folder,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layouts';
import { apiErrorMessage } from '../../api/apiClient';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  fetchEmailRequests, fetchEmailQuota, saveEmailLimit, fetchEmailRequest,
  scheduleEmailRequest, cancelEmailRequest, deleteEmailRequest, deleteEmailRecipient, retryFailedEmails,
  fetchEmailTemplates, saveEmailTemplate, deleteEmailTemplate, cloneEmailRequest,
  fetchEmailFolders, createEmailFolder, deleteEmailFolder, uploadFolderExcel, fetchFolderContacts,
  deleteFolderContact, scheduleFolders, fetchSelectedFolderEmails,
} from '../../api/emailAutomationAPI';

const SENT_TAB = 'Recently Sent';
const SCHEDULE_TAB = 'Schedule New Emails';
const DATA_TAB = 'Email Data';
const TABS = [SENT_TAB, SCHEDULE_TAB, DATA_TAB, 'Templates'];
const SENT_STATUSES = ['completed', 'failed'];

/* ---------------- Send-date helpers (all sends go out at 10:00 IST) ---------------- */
const SEND_HOUR_IST = 10;
const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
// first date whose 10:00 IST is still ahead
const firstSendDate = () => {
  const ist = new Date(Date.now() + 5.5 * 3600 * 1000);
  const today = ist.toISOString().slice(0, 10);
  return ist.getUTCHours() < SEND_HOUR_IST ? today : addDays(today, 1);
};
const dateRange = (from, to) => {
  const out = [];
  for (let d = from; d <= to && out.length < 120; d = addDays(d, 1)) out.push(d);
  return out;
};
const toSendTime = (ymd) => new Date(`${ymd}T${String(SEND_HOUR_IST).padStart(2, '0')}:00:00+05:30`).toISOString();
const SCHEDULE_MODES = [
  ['single', 'Single date'],
  ['range', 'Every day (from – to)'],
  ['week', '1 week'],
  ['month', '1 month'],
  ['quarter', '3 months'],
  ['pick', 'Pick dates'],
];
const PRESET_DAYS = { week: 7, month: 30, quarter: 90 };
const PLACEHOLDERS = ['{{bank}}', '{{bankAddress}}', '{{office}}', '{{email}}'];
const emptyTemplate = { name: '', subject: '', body: '' };

// Excel column names the admin wants read; remembered between uploads
const MAPPING_FIELDS = [
  ['email', 'Email column (required)', 'e.g. Email'],
  ['bank', 'Bank name column (blank = use file name)', 'e.g. Bank name'],
  ['region', 'Region / Branch column', 'e.g. Region Name (type it exactly as in Excel)'],
  ['extra', 'Other columns to use in the email', 'e.g. Branch  (every column you want in the email or table)'],
];
const MAPPING_KEY = 'emailAutomationMapping';
const loadMapping = () => {
  try {
    return { email: 'Email', bank: 'Bank name', region: 'Region', extra: '', ...JSON.parse(localStorage.getItem(MAPPING_KEY) || '{}') };
  } catch {
    return { email: 'Email', bank: 'Bank name', region: 'Region', extra: '' };
  }
};

// inline-style alignment so it survives in email clients (no Quill CSS there)
Quill.register(Quill.import('attributors/style/align'), true);
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link', 'clean'],
  ],
};
const QUILL_FORMATS = ['header', 'bold', 'italic', 'underline', 'strike', 'color', 'background', 'list', 'align', 'link'];
const isRich = (s) => /<\/?[a-z][\s\S]*?>/i.test(String(s || ''));
const plainText = (s) => (isRich(s) ? String(s).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : String(s || ''));

const BADGE = {
  valid: 'bg-green-50 text-green-700',
  invalid: 'bg-red-50 text-red-700',
  duplicate: 'bg-amber-50 text-amber-700',
  incomplete: 'bg-orange-50 text-orange-700',
  none: 'bg-gray-100 text-gray-500',
  pending: 'bg-gray-100 text-gray-600',
  scheduled: 'bg-blue-50 text-blue-700',
  processing: 'bg-purple-50 text-purple-700',
  sent: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  draft: 'bg-gray-100 text-gray-600',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const Badge = ({ value }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BADGE[value] || BADGE.none}`}>
    {value === 'none' ? 'not queued' : value}
  </span>
);

const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

const Stat = ({ icon: Icon, label, value, tone }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
    <div className={`p-2 rounded-lg ${tone}`}><Icon className="w-5 h-5" /></div>
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value ?? 0}</p>
    </div>
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
    <RefreshCw className="w-5 h-5 animate-spin" /><span className="text-sm">Loading...</span>
  </div>
);

/* ---------------- Recipients table (shared by detail + new request) ---------------- */
const RecipientsPanel = ({ requestId, onData, onRemoved }) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [removingId, setRemovingId] = useState(null);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    fetchEmailRequest(requestId, { page, limit: 25, validation: filter || undefined })
      .then((d) => { if (alive) { setData(d); onData?.(d.request); } })
      .catch((e) => toast.error(apiErrorMessage(e, 'Failed to load recipients')));
    return () => { alive = false; };
  }, [requestId, filter, page, reloadKey]);

  if (!data) return <Spinner />;
  const { request, recipients, pagination } = data;
  const editable = ['draft', 'scheduled'].includes(request.status);
  // columns the admin asked for at upload (email is already its own column)
  const dynCols = (request.columns || []).filter((c) => c.key !== 'email');
  const hasCols = (request.columns || []).length > 0; // false only for requests uploaded before column setup

  const remove = async (r) => {
    if (!window.confirm(`Remove ${r.email || `row ${r.row_number}`} from this request?`)) return;
    setRemovingId(r._id);
    try {
      await deleteEmailRecipient(requestId, r._id);
      toast.success('Record removed');
      setReloadKey((k) => k + 1);
      onRemoved?.();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Failed to remove record'));
    } finally {
      setRemovingId(null);
    }
  };
  const c = request.counts;
  const pages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  const chips = [['', `All (${c.total})`], ['valid', `Valid (${c.valid})`], ['invalid', `Invalid (${c.invalid})`],
    ['duplicate', `Duplicate (${c.duplicate})`], ['incomplete', `Incomplete (${c.incomplete})`]];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {chips.map(([key, label]) => (
          <button
            key={key || 'all'}
            onClick={() => { setFilter(key); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              filter === key ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto border border-gray-100 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left text-gray-600">
              {['Row', 'Email', 'Bank', ...(hasCols ? dynCols.map((c) => c.label) : ['Bank Address', 'Office']), 'Validation', 'Status', ''].map((h, i) => (
                <th key={h || i} className="py-2 px-3 font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recipients.length === 0 && (
              <tr><td colSpan={6 + dynCols.length} className="py-6 text-center text-gray-400">No records</td></tr>
            )}
            {recipients.map((r) => (
              <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50 align-top">
                <td className="py-2 px-3 text-gray-400 whitespace-nowrap">{r.row_number}{r.source && <p className="text-xs">{r.source}</p>}</td>
                <td className="py-2 px-3 text-gray-800">{r.email || '—'}</td>
                <td className="py-2 px-3">{r.bank || '—'}</td>
                {hasCols
                  ? dynCols.map((c) => <td key={c.key} className="py-2 px-3 max-w-[220px] truncate" title={r.data?.[c.key]}>{r.data?.[c.key] || '—'}</td>)
                  : (
                    <>
                      <td className="py-2 px-3 max-w-[220px] truncate" title={r.bank_address}>{r.bank_address || '—'}</td>
                      <td className="py-2 px-3">{r.office || r.region || '—'}</td>
                    </>
                  )}
                <td className="py-2 px-3">
                  <Badge value={r.validation} />
                  {r.validation_errors?.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">{r.validation_errors.join(', ')}</p>
                  )}
                </td>
                <td className="py-2 px-3">
                  <Badge value={r.status} />
                  {r.error && <p className="text-xs text-red-500 mt-1 max-w-[220px]">{r.error}</p>}
                  {r.sent_at && <p className="text-xs text-gray-400 mt-1">{fmt(r.sent_at)}</p>}
                </td>
                <td className="py-2 px-3">
                  {editable && ['none', 'pending', 'scheduled'].includes(r.status) && (
                    <button
                      title="Remove record"
                      disabled={removingId === r._id}
                      onClick={() => remove(r)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      {removingId === r._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{pagination.total} record(s)</span>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border rounded disabled:opacity-40">Prev</button>
          <span>{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-2 py-1 border rounded disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Template form ---------------- */
const TemplateForm = ({ initial, onSaved, onCancel, columns }) => {
  const [form, setForm] = useState(initial || emptyTemplate);
  const [saving, setSaving] = useState(false);
  const quillRef = useRef(null);
  const subjectRef = useRef(null);
  const lastFocus = useRef('body');
  // Excel columns of the request when known, else the built-in fields
  const chips = columns?.length ? columns : PLACEHOLDERS.map((p) => ({ key: p, label: p.slice(2, -2) }));

  const insert = (text) => {
    if (lastFocus.current === 'subject' && subjectRef.current) {
      const el = subjectRef.current;
      const at = el.selectionStart ?? form.subject.length;
      setForm((f) => ({ ...f, subject: f.subject.slice(0, at) + text + f.subject.slice(at) }));
      return;
    }
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const at = editor.getSelection(true)?.index ?? editor.getLength() - 1;
    editor.insertText(at, text, 'user');
    editor.setSelection(at + text.length, 0);
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.name.trim() && form.subject.trim() && plainText(form.body);

  const submit = async () => {
    setSaving(true);
    try {
      const saved = await saveEmailTemplate(form);
      toast.success('Template saved');
      onSaved(saved);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Failed to save template'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
      <input value={form.name} onChange={set('name')} placeholder="Template name" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
      <input ref={subjectRef} onFocus={() => { lastFocus.current = 'subject'; }} value={form.subject} onChange={set('subject')} placeholder="Email subject" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
      <div className="bg-white rounded-lg">
        <ReactQuill ref={quillRef} onFocus={() => { lastFocus.current = 'body'; }} theme="snow" value={form.body} onChange={(v) => setForm((f) => ({ ...f, body: v }))} modules={QUILL_MODULES} formats={QUILL_FORMATS} placeholder="Email body" />
      </div>
      <div className="space-y-1">
        <p className="text-xs text-gray-500">
          {columns?.length
            ? 'Click an Excel column to insert it at the cursor (subject or body):'
            : 'Placeholders (subject and body). Upload an Excel in New Request to pick from its exact columns:'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(`{{${c.label}}}`)}
              className="px-2 py-0.5 text-xs bg-white border border-purple-200 text-purple-700 rounded-full hover:bg-purple-50"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg">Cancel</button>}
        <button
          disabled={!valid || saving}
          onClick={submit}
          className="px-3 py-1.5 text-sm text-white bg-purple-600 rounded-lg disabled:opacity-50 flex items-center gap-1"
        >
          <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  );
};

/* ---------------- Tabs ---------------- */
const TemplatesTab = ({ templates, reload }) => {
  const [editing, setEditing] = useState(null); // null | template | emptyTemplate

  const remove = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    try { await deleteEmailTemplate(t._id); toast.success('Template deleted'); reload(); }
    catch (e) { toast.error(apiErrorMessage(e, 'Failed to delete template')); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!editing && (
          <button onClick={() => setEditing(emptyTemplate)} className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg flex items-center gap-1">
            <Plus className="w-4 h-4" />New Template
          </button>
        )}
      </div>
      {editing && <TemplateForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      <div className="grid gap-3 md:grid-cols-2">
        {templates.length === 0 && <p className="text-sm text-gray-400">No templates yet.</p>}
        {templates.map((t) => (
          <div key={t._id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{t.name}</p>
                <p className="text-sm text-gray-500 truncate">{t.subject}</p>
              </div>
              <div className="flex gap-1">
                <button title="Edit" onClick={() => setEditing(t)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button title="Delete" onClick={() => remove(t)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 line-clamp-3">{plainText(t.body)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------- Schedule picker: presets fill the date list, admin can remove/add any date ---------------- */
const SchedulePicker = ({ dates, setDates }) => {
  const min = firstSendDate();
  const [mode, setMode] = useState('single');
  const [from, setFrom] = useState(min);
  const [to, setTo] = useState(addDays(min, 6));
  const [pick, setPick] = useState('');

  // presets regenerate the list whenever mode/start/end changes
  useEffect(() => {
    if (mode === 'single') setDates(from ? [from] : []);
    else if (mode === 'range') setDates(from && to >= from ? dateRange(from, to) : []);
    else if (PRESET_DAYS[mode]) setDates(dateRange(from, addDays(from, PRESET_DAYS[mode] - 1)));
  }, [mode, from, to, setDates]);

  const switchMode = (m) => { setMode(m); if (m === 'pick') setDates([]); };
  const add = () => { if (pick && pick >= min) setDates((d) => [...new Set([...d, pick])].sort()); setPick(''); };
  const remove = (d) => setDates((list) => list.filter((x) => x !== d));
  const input = 'px-3 py-2 border border-gray-200 rounded-lg text-sm';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SCHEDULE_MODES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchMode(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              mode === key ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode !== 'pick' ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-gray-600">{mode === 'single' ? 'Date' : 'From'}
            <input type="date" value={from} min={min} onChange={(e) => setFrom(e.target.value)} className={`block mt-0.5 ${input}`} />
          </label>
          {mode === 'range' && (
            <label className="text-xs text-gray-600">To
              <input type="date" value={to} min={from || min} onChange={(e) => setTo(e.target.value)} className={`block mt-0.5 ${input}`} />
            </label>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input type="date" value={pick} min={min} onChange={(e) => setPick(e.target.value)} className={input} />
          <button type="button" disabled={!pick} onClick={add} className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-1 disabled:opacity-50">
            <Plus className="w-4 h-4" />Add date
          </button>
        </div>
      )}
      {dates.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">{dates.length} send date(s) — click × to skip a date:</p>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {dates.map((d) => (
              <span key={d} className="flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded-full">
                {new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                <button type="button" title="Skip this date" onClick={() => remove(d)} className="hover:text-red-600"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- Email Data: folders of emails built from Excel uploads ---------------- */
const FolderPanel = ({ folder, onChanged }) => {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [removingId, setRemovingId] = useState(null);
  const [file, setFile] = useState(null);
  const [mapping, setMapping] = useState(loadMapping);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let alive = true;
    fetchFolderContacts(folder._id, { page, limit: 25, search: query || undefined })
      .then((d) => { if (alive) setData(d); })
      .catch((e) => toast.error(apiErrorMessage(e, 'Failed to load emails')));
    return () => { alive = false; };
  }, [folder._id, page, query, reloadKey]);

  const upload = async () => {
    setUploading(true);
    try {
      try { localStorage.setItem(MAPPING_KEY, JSON.stringify(mapping)); } catch { /* ignore */ }
      const s = await uploadFolderExcel(folder._id, file, mapping);
      setSummary(s);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.success(`${s.added} added, ${s.updated} updated`);
      setReloadKey((k) => k + 1);
      onChanged();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Remove ${c.email} from ${folder.name}?`)) return;
    setRemovingId(c._id);
    try {
      await deleteFolderContact(folder._id, c._id);
      toast.success('Email removed');
      setReloadKey((k) => k + 1);
      onChanged();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Failed to remove email'));
    } finally {
      setRemovingId(null);
    }
  };

  const dynCols = (folder.columns || []).filter((c) => c.key !== 'email');
  const pages = data ? Math.max(1, Math.ceil(data.pagination.total / data.pagination.limit)) : 1;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-800">Add Excel to “{folder.name}”</h3>
        <p className="text-sm text-gray-500">Upload as many files as you like. Only valid emails are added; an email already in this folder is updated with the newer row.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {MAPPING_FIELDS.map(([key, label, hint]) => (
            <label key={key} className="block">
              <span className="text-xs font-medium text-gray-600">{label}</span>
              <input
                value={mapping[key]}
                onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                placeholder={hint}
                className="w-full mt-0.5 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex-1 min-w-[220px] flex items-center gap-3 px-3 py-2.5 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600 truncate">{file ? file.name : 'Choose Excel file'}</span>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <button disabled={!file || !mapping.email.trim() || uploading} onClick={upload} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2">
            {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Processing...' : 'Add to folder'}
          </button>
        </div>
        {summary && (
          <p className="text-sm bg-green-50 text-green-800 rounded-lg px-3 py-2">
            {summary.file_name}: <b>{summary.added}</b> added · <b>{summary.updated}</b> updated · <b>{summary.skipped}</b> skipped (invalid, incomplete or repeated in file)
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-800">Emails in this folder</h3>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email, bank, region..." className="w-64 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
        </div>
        {!data ? <Spinner /> : (
          <>
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left text-gray-600">
                    {['Email', ...dynCols.map((c) => c.label), 'Source', ''].map((h, i) => (
                      <th key={`${h}-${i}`} className="py-2 px-3 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.contacts.length === 0 && (
                    <tr><td colSpan={3 + dynCols.length} className="py-6 text-center text-gray-400">{query ? 'No matching emails' : 'No emails yet — upload an Excel above'}</td></tr>
                  )}
                  {data.contacts.map((c) => (
                    <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-800">{c.email}</td>
                      {dynCols.map((col) => (
                        <td key={col.key} className="py-2 px-3 max-w-[220px] truncate" title={c.data?.[col.key]}>{c.data?.[col.key] || '—'}</td>
                      ))}
                      <td className="py-2 px-3 text-xs text-gray-400">{c.source}</td>
                      <td className="py-2 px-3">
                        <button title="Remove email" disabled={removingId === c._id} onClick={() => remove(c)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg disabled:opacity-50">
                          {removingId === c._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{data.pagination.total} email(s)</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border rounded disabled:opacity-40">Prev</button>
                <span>{page} / {pages}</span>
                <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-2 py-1 border rounded disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const EmailDataTab = ({ folders, reload }) => {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState(null);
  const open = folders.find((f) => f._id === openId);

  const create = async () => {
    setCreating(true);
    try {
      const f = await createEmailFolder(name.trim());
      setName('');
      await reload();
      setOpenId(f._id);
      toast.success('Folder created');
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Failed to create folder'));
    } finally {
      setCreating(false);
    }
  };

  const remove = async (f) => {
    if (!window.confirm(`Delete folder “${f.name}” and its ${f.count} email(s)?`)) return;
    try {
      await deleteEmailFolder(f._id);
      if (openId === f._id) setOpenId(null);
      toast.success('Folder deleted');
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Failed to delete folder'));
    }
  };

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-5 items-start">
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="space-y-2 pb-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Create a folder</h3>
          <label className="block">
            <span className="text-xs font-medium text-gray-600">Folder name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && !creating && create()}
              placeholder="e.g. Andhra Bank"
              className="w-full mt-0.5 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </label>
          <button
            disabled={!name.trim() || creating}
            onClick={create}
            className="w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creating ? 'Creating...' : 'Create Folder'}
          </button>
        </div>
        <h3 className="font-semibold text-gray-800">Your folders</h3>
        {folders.length === 0 && <p className="text-sm text-gray-400 py-2 text-center">No folders yet. Create your first one above.</p>}
        <div className="space-y-1">
          {folders.map((f) => (
            <div
              key={f._id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${openId === f._id ? 'bg-purple-50 text-purple-800' : 'hover:bg-gray-50 text-gray-700'}`}
              onClick={() => setOpenId(f._id)}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate text-sm font-medium">{f.name}</span>
              <span className="text-xs text-gray-400">{f.count}</span>
              <button title="Delete folder" onClick={(e) => { e.stopPropagation(); remove(f); }} className="p-1 text-red-400 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      {open
        ? <FolderPanel key={open._id} folder={open} onChanged={reload} />
        : (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-sm text-gray-500 space-y-3">
            <p className="font-semibold text-gray-700">How to add email data</p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Type a folder name on the left, for example the bank name, and click <b>Create Folder</b>.</li>
              <li>Click the folder to open it.</li>
              <li>Upload your Excel file inside the folder. Its emails are listed here.</li>
              <li>Go to <b>Schedule New Emails</b> and pick one or more folders to send to.</li>
            </ol>
          </div>
        )}
    </div>
  );
};

/* ---------------- Unique emails across the selected folders (what a send would go to) ---------------- */
const SelectedEmails = ({ folderIds, folders, columns, onTotal }) => {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const key = folderIds.join(',');

  useEffect(() => {
    const id = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);
  useEffect(() => { setPage(1); }, [key]);

  useEffect(() => {
    let alive = true;
    fetchSelectedFolderEmails(folderIds, { page, limit: 10, search: query || undefined })
      .then((d) => { if (alive) { setData(d); if (!query) onTotal(d.pagination.total); } })
      .catch((e) => toast.error(apiErrorMessage(e, 'Failed to load selected emails')));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page, query]);

  const names = Object.fromEntries(folders.map((f) => [f._id, f.name]));
  const dynCols = columns.filter((c) => c.key !== 'email');
  const pages = data ? Math.max(1, Math.ceil(data.pagination.total / data.pagination.limit)) : 1;

  return (
    <div className="space-y-2 border-t border-gray-100 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-700">Selected emails</p>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email, bank, region..." className="w-56 px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
      </div>
      {!data ? <Spinner /> : (
        <>
          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left text-gray-600">
                  {['Email', ...dynCols.map((c) => c.label), 'Folder(s)'].map((h, i) => (
                    <th key={`${h}-${i}`} className="py-2 px-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.contacts.length === 0 && (
                  <tr><td colSpan={2 + dynCols.length} className="py-4 text-center text-gray-400">{query ? 'No matching emails' : 'No emails'}</td></tr>
                )}
                {data.contacts.map((c) => (
                  <tr key={c.email} className="border-b border-gray-50">
                    <td className="py-2 px-3 text-gray-800">{c.email}</td>
                    {dynCols.map((col) => (
                      <td key={col.key} className="py-2 px-3 max-w-[200px] truncate" title={c.data?.[col.key]}>{c.data?.[col.key] || '—'}</td>
                    ))}
                    <td className="py-2 px-3 text-xs text-gray-500">{(c.folders || []).map((id) => names[id]).filter(Boolean).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{data.pagination.total} unique email(s){query ? ' matching' : ''}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-2 py-1 border rounded disabled:opacity-40">Prev</button>
              <span>{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-2 py-1 border rounded disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ---------------- Schedule: folders + template + dates ---------------- */
const FolderScheduleForm = ({ folders, templates, reloadTemplates, onDone }) => {
  const [selected, setSelected] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [creating, setCreating] = useState(false);
  const [dates, setDates] = useState([]);
  const [scheduling, setScheduling] = useState(false);

  const [uniqueTotal, setUniqueTotal] = useState(null);
  const chosen = folders.filter((f) => selected.includes(f._id));
  // unique count once loaded; folder sum until then
  const total = chosen.length ? (uniqueTotal ?? chosen.reduce((n, f) => n + f.count, 0)) : 0;
  const seenCols = new Set();
  const columns = chosen.flatMap((f) => f.columns || []).filter((c) => !seenCols.has(c.key) && seenCols.add(c.key));
  const selectedTemplate = templates.find((t) => t._id === templateId);
  const canSchedule = total > 0 && templateId;
  const toggle = (id) => { setUniqueTotal(null); setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])); };

  const schedule = async (sendNow) => {
    setScheduling(true);
    try {
      await scheduleFolders(sendNow
        ? { folderIds: selected, templateId, scheduledAt: new Date().toISOString() }
        : { folderIds: selected, templateId, scheduledDates: dates.map(toSendTime) });
      toast.success(sendNow ? 'Sending started' : `Scheduled for ${dates.length} date(s)`);
      onDone();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Failed to schedule'));
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3 max-w-2xl">
        <h3 className="font-semibold text-gray-800">1. Email folders</h3>
        {folders.length === 0
          ? <p className="text-sm text-gray-500">No folders yet. Create one in the <b>Email Data</b> tab and add Excel files to it.</p>
          : (
            <div className="grid sm:grid-cols-2 gap-2">
              {folders.map((f) => (
                <label key={f._id} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer ${selected.includes(f._id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'} ${f.count ? '' : 'opacity-50'}`}>
                  <input type="checkbox" disabled={!f.count} checked={selected.includes(f._id)} onChange={() => toggle(f._id)} className="accent-purple-600" />
                  <Folder className="w-4 h-4 text-purple-600" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400">{f.count} email(s)</span>
                </label>
              ))}
            </div>
          )}
        {chosen.length > 0 && (
          <p className="text-xs text-gray-500">
            {chosen.length} folder(s), {total} unique email(s){chosen.length > 1 ? ' — an email in more than one folder is sent once' : ''}. Each send date uses the folders as they are on that day, so emails you add later are included.
          </p>
        )}
        {chosen.length > 0 && <SelectedEmails folderIds={selected} folders={folders} columns={columns} onTotal={setUniqueTotal} />}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-800">2. Template</h3>
        <div className="flex gap-2">
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Select a template</option>
            {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <button onClick={() => setCreating(!creating)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-1">
            <Plus className="w-4 h-4" />New
          </button>
        </div>
        {selectedTemplate && !creating && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-2">
            <p className="text-sm"><span className="text-gray-500">Subject: </span><span className="font-medium text-gray-800">{selectedTemplate.subject}</span></p>
            {isRich(selectedTemplate.body)
              ? <div className="text-sm text-gray-700 border-t border-gray-100 pt-2 [&_a]:text-purple-600 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: selectedTemplate.body }} />
              : <p className="text-sm text-gray-700 whitespace-pre-line border-t border-gray-100 pt-2">{selectedTemplate.body}</p>}
          </div>
        )}
        {creating && (
          <TemplateForm
            columns={columns}
            onCancel={() => setCreating(false)}
            onSaved={(t) => { setCreating(false); reloadTemplates(); setTemplateId(t._id); }}
          />
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3 max-w-xl">
        <h3 className="font-semibold text-gray-800">3. Schedule</h3>
        <p className="text-sm text-gray-500">Emails go out at 10:00 AM IST on every selected date.</p>
        <SchedulePicker dates={dates} setDates={setDates} />
        <div className="flex flex-wrap gap-2">
          <button disabled={!canSchedule || !dates.length || scheduling} onClick={() => schedule(false)} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2">
            <Clock className="w-4 h-4" />{scheduling ? 'Scheduling...' : 'Schedule'}
          </button>
          <button disabled={!canSchedule || scheduling} onClick={() => window.confirm(`Send to ${total} email(s) now?`) && schedule(true)} title="Starts sending within ~30 seconds" className="px-4 py-2 border border-purple-600 text-purple-700 text-sm rounded-lg disabled:opacity-50 flex items-center gap-2">
            <Send className="w-4 h-4" />Send Now
          </button>
        </div>
        {(!canSchedule || !dates.length) && <p className="text-xs text-gray-400">Needs at least one folder with emails, a template and a date.</p>}
      </div>
    </div>
  );
};

const NewRequestTab = ({ templates, reloadTemplates, folders, onDone, resume, children }) => {
  const [request, setRequest] = useState(resume || null);
  const [templateId, setTemplateId] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingTpl, setEditingTpl] = useState(false);
  const [dates, setDates] = useState([]);
  const [scheduling, setScheduling] = useState(false);

  const schedule = async (sendNow) => {
    setScheduling(true);
    try {
      if (sendNow) await scheduleEmailRequest(request._id, templateId, new Date().toISOString());
      else await scheduleEmailRequest(request._id, templateId, undefined, dates.map(toSendTime));
      toast.success(sendNow ? 'Sending started' : `Scheduled for ${dates.length} date(s)`);
      onDone();
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Failed to schedule'));
    } finally {
      setScheduling(false);
    }
  };

  const discard = async () => {
    try { await deleteEmailRequest(request._id); } catch { /* draft left for Requests tab */ }
    setRequest(null); setTemplateId('');
  };

  if (!request) {
    return (
      <div className="space-y-5">
        <FolderScheduleForm folders={folders} templates={templates} reloadTemplates={reloadTemplates} onDone={onDone} />
        {children}
      </div>
    );
  }

  const c = request.counts;
  const blocked = c.total - c.valid;
  const selectedTemplate = templates.find((t) => t._id === templateId);
  const canSchedule = c.valid > 0 && templateId;

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">2. Review — {request.name}</h3>
          <button onClick={discard} className="text-sm text-red-500 hover:underline">Discard</button>
        </div>
        {blocked > 0 && (
          <div className="flex items-start gap-2 text-sm bg-amber-50 text-amber-800 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {blocked} record(s) are invalid, duplicate or incomplete and will NOT be sent. Only {c.valid} valid record(s) will be emailed.
          </div>
        )}
        <RecipientsPanel
          requestId={request._id}
          onData={(r) => setRequest((prev) => (prev ? { ...prev, counts: r.counts } : prev))}
        />
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-800">3. Template</h3>
        <div className="flex gap-2">
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Select a template</option>
            {templates.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <button onClick={() => { setEditingTpl(false); setCreating(!creating); }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-1">
            <Plus className="w-4 h-4" />New
          </button>
        </div>
        {selectedTemplate && !creating && !editingTpl && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selected template preview</p>
              <button onClick={() => setEditingTpl(true)} className="flex items-center gap-1 text-xs text-purple-600 hover:underline">
                <Pencil className="w-3.5 h-3.5" />Edit template
              </button>
            </div>
            <p className="text-sm"><span className="text-gray-500">Subject: </span><span className="font-medium text-gray-800">{selectedTemplate.subject}</span></p>
            {isRich(selectedTemplate.body)
              ? <div className="text-sm text-gray-700 border-t border-gray-100 pt-2 [&_a]:text-purple-600 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:pl-5 [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: selectedTemplate.body }} />
              : <p className="text-sm text-gray-700 whitespace-pre-line border-t border-gray-100 pt-2">{selectedTemplate.body}</p>}
            <p className="text-xs text-gray-400">Placeholders like {'{{bank}}'} and {'{{region}}'} are filled per recipient when sent.</p>
          </div>
        )}
        {(creating || (editingTpl && selectedTemplate)) && (
          <TemplateForm
            key={editingTpl ? selectedTemplate._id : 'new'}
            columns={request.columns}
            initial={editingTpl ? selectedTemplate : undefined}
            onCancel={() => { setCreating(false); setEditingTpl(false); }}
            onSaved={(t) => { setCreating(false); setEditingTpl(false); reloadTemplates(); setTemplateId(t._id); }}
          />
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-3 max-w-xl">
        <h3 className="font-semibold text-gray-800">4. Schedule</h3>
        {request.cloned_from && <p className="text-xs text-purple-600">Reusing recipients from a sent request — pick a template and new dates.</p>}
        <p className="text-sm text-gray-500">Emails go out at 10:00 AM IST on every selected date, to the same recipients each time.</p>
        <SchedulePicker dates={dates} setDates={setDates} />
        <div className="flex flex-wrap gap-2">
          <button disabled={!canSchedule || !dates.length || scheduling} onClick={() => schedule(false)} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2">
            <Clock className="w-4 h-4" />{scheduling ? 'Scheduling...' : 'Create Email Request'}
          </button>
          <button disabled={!canSchedule || scheduling} onClick={() => window.confirm('Send these emails now?') && schedule(true)} title="Starts sending within ~30 seconds" className="px-4 py-2 border border-purple-600 text-purple-700 text-sm rounded-lg disabled:opacity-50 flex items-center gap-2">
            <Send className="w-4 h-4" />Send Now
          </button>
        </div>
        {(!canSchedule || !dates.length) && <p className="text-xs text-gray-400">Needs ≥1 valid record, a template and at least one date.</p>}
      </div>
    </div>
  );
};

// "run 3 of 30" for multi-date schedules, "30 runs" once finished
const runInfo = (r) => {
  const total = r.send_dates?.length || 0;
  const done = r.run_history?.length || 0;
  if (total <= 1 && done <= 1) return null;
  return ['scheduled', 'processing'].includes(r.status) ? `run ${Math.min(done + 1, total)} of ${total}` : `${done} run(s)`;
};

const RequestsTab = ({ requests, loading, reload, onContinue, onReuse, title, emptyText = 'No email requests yet' }) => {
  const [reusingId, setReusingId] = useState(null);
  const reuse = async (r) => {
    setReusingId(r._id);
    try { onReuse(await cloneEmailRequest(r._id)); toast.success('Recipients copied — pick a template and schedule'); }
    catch (e) { toast.error(apiErrorMessage(e, 'Failed to reuse request')); }
    finally { setReusingId(null); }
  };
  const [viewId, setViewId] = useState(null);

  const act = async (fn, msg) => {
    try { await fn(); toast.success(msg); reload(); }
    catch (e) { toast.error(apiErrorMessage(e, 'Action failed')); }
  };

  if (loading) return <Spinner />;
  return (
    <>
      {title && <h3 className="font-semibold text-gray-800">{title}</h3>}
      <div className="overflow-x-auto bg-white border border-gray-100 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left text-gray-600">
              {['Request', 'Template', 'Total', 'Sent', 'Pending', 'Failed', 'Scheduled For', 'Status', ''].map((h) => (
                <th key={h} className="py-3 px-4 font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-gray-400">{emptyText}</td></tr>}
            {requests.map((r) => (
              <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">{r.name}<p className="text-xs text-gray-400 font-normal">{r.folders?.length ? `Folders: ${r.folders.map((f) => f.name).join(', ')}` : r.file_name}</p></td>
                <td className="py-3 px-4">{r.template?.name || '—'}</td>
                <td className="py-3 px-4">{r.stats.total}</td>
                <td className="py-3 px-4 text-green-700">{r.stats.sent}</td>
                <td className="py-3 px-4">{r.stats.pending + r.stats.scheduled + r.stats.processing}</td>
                <td className="py-3 px-4 text-red-600">{r.stats.failed}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {fmt(r.status === 'completed' ? r.completed_at : r.scheduled_at)}
                  {runInfo(r) && <p className="text-xs text-purple-600">{runInfo(r)}</p>}
                </td>
                <td className="py-3 px-4"><Badge value={r.status} /></td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 justify-end">
                    <button title="View" onClick={() => setViewId(r._id)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Eye className="w-4 h-4" /></button>
                    {r.status === 'scheduled' && (
                      <button title="Cancel schedule" onClick={() => act(() => cancelEmailRequest(r._id), 'Schedule cancelled')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"><Ban className="w-4 h-4" /></button>
                    )}
                    {r.status === 'draft' && r.counts?.valid > 0 && (
                      <button title="Continue: pick template and schedule" onClick={() => onContinue(r)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg"><Play className="w-4 h-4" /></button>
                    )}
                    {onReuse && SENT_STATUSES.includes(r.status) && (
                      <button title="Reuse: same recipients, new template & schedule" disabled={reusingId === r._id} onClick={() => reuse(r)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-50">
                        {reusingId === r._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                    {['completed', 'failed'].includes(r.status) && (r.stats.failed > 0 || r.status === 'failed') && (
                      <button title="Retry failed / resume" onClick={() => act(() => retryFailedEmails(r._id), 'Retry queued')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><RotateCcw className="w-4 h-4" /></button>
                    )}
                    {['draft', 'completed', 'failed', 'cancelled'].includes(r.status) && (
                      <button
                        title="Delete"
                        onClick={() => window.confirm('Delete this request and its records?') && act(() => deleteEmailRequest(r._id), 'Request deleted')}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"
                      ><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-5xl p-5 mt-8 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Request details</h3>
              <button onClick={() => setViewId(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <RecipientsPanel requestId={viewId} onRemoved={reload} />
          </div>
        </div>
      )}
    </>
  );
};

/* ---------------- Sender limit editor ---------------- */
const LimitEditor = ({ limit, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(limit);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      onSaved(await saveEmailLimit(value));
      toast.success('Daily limit updated');
      setEditing(false);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Failed to update limit'));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button onClick={() => { setValue(limit); setEditing(true); }} className="text-xs text-purple-600 hover:underline">
        Change daily limit
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
      <button disabled={saving} onClick={save} className="px-2 py-1 text-xs text-white bg-purple-600 rounded-lg disabled:opacity-50">Save</button>
      <button onClick={() => setEditing(false)} className="px-2 py-1 text-xs text-gray-600 border border-gray-200 rounded-lg">Cancel</button>
    </div>
  );
};

/* ---------------- Page ---------------- */
const AdminEmailAutomationPage = () => {
  const [tab, setTab] = useState(TABS[0]);
  const [resume, setResume] = useState(null);
  const [quota, setQuota] = useState(null);
  const [requests, setRequests] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      const [r, q] = await Promise.all([fetchEmailRequests(), fetchEmailQuota()]);
      setQuota(q);
      setRequests(r);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Failed to load email requests'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try { setTemplates(await fetchEmailTemplates()); }
    catch (e) { toast.error(apiErrorMessage(e, 'Failed to load templates')); }
  }, []);

  const loadFolders = useCallback(async () => {
    try { setFolders(await fetchEmailFolders()); }
    catch (e) { toast.error(apiErrorMessage(e, 'Failed to load email folders')); }
  }, []);

  useEffect(() => { loadRequests(); loadTemplates(); loadFolders(); }, [loadRequests, loadTemplates, loadFolders]);

  // dashboard totals derived from the request list (one query instead of two)
  const stats = useMemo(() => requests.reduce((t, r) => ({
    total: t.total + r.stats.total,
    sent: t.sent + r.stats.sent,
    pending: t.pending + r.stats.pending,
    failed: t.failed + r.stats.failed,
    scheduled: t.scheduled + r.stats.scheduled + r.stats.processing,
    completedRequests: t.completedRequests + (r.status === 'completed' ? 1 : 0),
  }), { total: 0, sent: 0, pending: 0, failed: 0, scheduled: 0, completedRequests: 0 }), [requests]);

  const sentRequests = useMemo(() => requests.filter((r) => SENT_STATUSES.includes(r.status)), [requests]);
  const upcomingRequests = useMemo(() => requests.filter((r) => !SENT_STATUSES.includes(r.status)), [requests]);

  // auto-refresh while something is queued or sending
  const active = useMemo(() => requests.some((r) => ['scheduled', 'processing'].includes(r.status)), [requests]);
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(loadRequests, 15000);
    return () => clearInterval(id);
  }, [active, loadRequests]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Mail className="w-6 h-6 text-purple-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 font-['Manrope']">Email Automation</h1>
              <p className="text-gray-500 text-sm">Upload Excel, validate, schedule and track bulk emails</p>
            </div>
          </div>
          <button onClick={loadRequests} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Stat icon={Mail} label="Total Emails" value={stats?.total} tone="bg-purple-50 text-purple-600" />
          <Stat icon={Send} label="Currently Sent" value={stats?.sent} tone="bg-green-50 text-green-600" />
          <Stat icon={Clock} label="Pending" value={stats?.pending} tone="bg-gray-100 text-gray-600" />
          <Stat icon={AlertTriangle} label="Failed" value={stats?.failed} tone="bg-red-50 text-red-600" />
          <Stat icon={Clock} label="Scheduled" value={stats?.scheduled} tone="bg-blue-50 text-blue-600" />
          <Stat icon={CheckCircle2} label="Completed Requests" value={stats?.completedRequests} tone="bg-green-50 text-green-600" />
        </div>

        {quota && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-gray-800">Sender daily limit (last 24 hours)</span>
              <span className="text-gray-600">
                <b>{quota.sentLast24h}</b> / {quota.limit} sent · <b className={quota.remaining === 0 ? 'text-red-600' : 'text-green-700'}>{quota.remaining}</b> remaining
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${quota.sentLast24h / quota.limit >= 0.9 ? 'bg-red-500' : 'bg-purple-600'}`}
                style={{ width: `${Math.min(100, (quota.sentLast24h / quota.limit) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              Counts only emails sent by Email Automation. If a request exceeds the remaining quota, the rest continues automatically at the next 10:00 AM IST.
            </p>
            <LimitEditor limit={quota.limit} onSaved={setQuota} />
          </div>
        )}

        <div className="flex gap-1 border-b border-gray-100">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setResume(null); setTab(t); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === SENT_TAB && <RequestsTab
            requests={sentRequests}
            loading={loading}
            reload={loadRequests}
            onReuse={(r) => { loadRequests(); setResume(r); setTab(SCHEDULE_TAB); }}
            emptyText="No emails sent yet"
          />}
        {tab === SCHEDULE_TAB && (
          <NewRequestTab
            key={resume?._id || 'new'}
            templates={templates}
            reloadTemplates={loadTemplates}
            folders={folders}
            resume={resume}
            onDone={() => { setResume(null); loadRequests(); setTab(SENT_TAB); }}
          >
            <RequestsTab
              title="Scheduled & drafts"
              requests={upcomingRequests}
              loading={loading}
              reload={loadRequests}
              onContinue={(r) => setResume(r)}
              emptyText="Nothing scheduled"
            />
          </NewRequestTab>
        )}
        {tab === DATA_TAB && <EmailDataTab folders={folders} reload={loadFolders} />}
        {tab === 'Templates' && <TemplatesTab templates={templates} reload={loadTemplates} />}
      </div>
    </AdminLayout>
  );
};

export default AdminEmailAutomationPage;
