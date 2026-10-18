import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  ImagePlus,
  ListChecks,
  Loader2,
  MessageSquareText,
  Save,
  Settings2,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layouts';
import SchemeBanner from '../../../components/genie/SchemeBanner';
import BannerCropper from '../../../components/genie/BannerCropper';
import { SchemeEditorSkeleton } from '../../../components/genie/GenieSkeletons';
import DocumentManager from '../../../components/genie/admin/DocumentManager';
import QuestionBuilder from '../../../components/genie/admin/QuestionBuilder';
import PromptBuilder from '../../../components/genie/admin/PromptBuilder';
import { adminGenieAPI, GENIE_QUESTION_MAX_LENGTH } from '../../../api/genieAPI';

const TABS = [
  { key: 'details', label: 'Details', icon: Settings2 },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'questions', label: 'Questions', icon: ListChecks },
  { key: 'prompts', label: 'Suggested prompts', icon: MessageSquareText },
];

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200';

/** The editable part of a scheme (documents and banner save immediately instead). */
const toDraft = (scheme) => ({
  name: scheme.name,
  shortDescription: scheme.shortDescription || '',
  description: scheme.description || '',
  sortOrder: scheme.sortOrder ?? 100,
  intakeQuestions: scheme.intakeQuestions || [],
  suggestedPrompts: scheme.suggestedPrompts || [],
});

export default function AdminGenieSchemeEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scheme, setScheme] = useState(null);
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGenieAPI.get(id);
      setScheme(data);
      setDraft(toDraft(data));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(
    () => !!scheme && !!draft && JSON.stringify(toDraft(scheme)) !== JSON.stringify(draft),
    [scheme, draft]
  );

  // Warn before leaving the page with unsaved edits
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const setField = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const validationError = useMemo(() => {
    if (!draft) return null;
    if (!draft.name.trim()) return { tab: 'details', message: 'Scheme name is required.' };
    const qIndex = draft.intakeQuestions.findIndex((q) => !q.label.trim());
    if (qIndex >= 0) return { tab: 'questions', message: `Question ${qIndex + 1} needs a label.` };
    const optIndex = draft.intakeQuestions.findIndex(
      (q) => (q.type === 'select' || q.type === 'multiselect') && q.options.filter((o) => o.trim()).length < 2
    );
    if (optIndex >= 0) return { tab: 'questions', message: `Question ${optIndex + 1} needs at least 2 options.` };
    const pIndex = draft.suggestedPrompts.findIndex((p) => !p.heading.trim() || !p.prompt.trim());
    if (pIndex >= 0) return { tab: 'prompts', message: `Suggested prompt ${pIndex + 1} needs a heading and a prompt.` };
    const longIndex = draft.suggestedPrompts.findIndex((p) => p.prompt.length > GENIE_QUESTION_MAX_LENGTH);
    if (longIndex >= 0) {
      return { tab: 'prompts', message: `Suggested prompt ${longIndex + 1} is over ${GENIE_QUESTION_MAX_LENGTH} characters.` };
    }
    return null;
  }, [draft]);

  const save = async () => {
    if (validationError) {
      setTab(validationError.tab);
      toast.error(validationError.message);
      return;
    }
    setSaving(true);
    try {
      const updated = await adminGenieAPI.update(id, {
        ...draft,
        intakeQuestions: draft.intakeQuestions.map((q) => ({
          ...q,
          options: (q.options || []).map((o) => o.trim()).filter(Boolean),
        })),
      });
      setScheme(updated);
      setDraft(toDraft(updated));
      toast.success('Changes saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (dirty) {
      toast.error('Save your changes first.');
      return;
    }
    const next = scheme.status === 'published' ? 'draft' : 'published';
    setStatusSaving(true);
    try {
      const updated = await adminGenieAPI.update(id, { status: next });
      setScheme(updated);
      toast.success(next === 'published' ? 'Published: now visible on the website' : 'Moved to Draft: hidden from the website');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStatusSaving(false);
    }
  };

  const saveBanner = async (blob) => {
    const updated = await adminGenieAPI.uploadBanner(id, blob);
    setScheme(updated);
    setCropperOpen(false);
    toast.success('Banner updated');
  };

  const removeBanner = async () => {
    if (!window.confirm('Remove this banner? The scheme will show its default violet card.')) return;
    try {
      setScheme(await adminGenieAPI.removeBanner(id));
      toast.success('Banner removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deleteScheme = async () => {
    if (!window.confirm(`Delete "${scheme.name}" and all its documents? This cannot be undone.`)) return;
    try {
      await adminGenieAPI.remove(id);
      toast.success('Scheme deleted');
      navigate('/admin/schemes');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <SchemeEditorSkeleton />
      </AdminLayout>
    );
  }

  if (!scheme || !draft) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24 text-gray-500">
          <span>
            Scheme not found.{' '}
            <Link to="/admin/schemes" className="font-semibold text-purple-700 hover:underline">
              Back to schemes
            </Link>
          </span>
        </div>
      </AdminLayout>
    );
  }

  const published = scheme.status === 'published';

  return (
    <AdminLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div>
          <Link to="/admin/schemes" className="mb-2 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> All schemes
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="truncate font-['Manrope'] text-2xl font-bold text-gray-900">{scheme.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                    published ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-gray-100 text-gray-600 ring-gray-200'
                  }`}
                >
                  {published ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Link: /genie/{scheme.slug} · Knowledge collection: {scheme.collectionName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {published && (
                <a
                  href={`/genie/${scheme.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4" /> Open in Genie
                </a>
              )}
              <button
                type="button"
                onClick={toggleStatus}
                disabled={statusSaving}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
                  published
                    ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    : 'bg-purple-700 text-white hover:bg-purple-800'
                }`}
              >
                {statusSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {published ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 pt-1 text-sm font-semibold transition ${
                tab === key ? 'border-purple-700 text-purple-800' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === 'questions' && <span className="text-xs font-normal text-gray-400">({draft.intakeQuestions.length})</span>}
              {key === 'prompts' && <span className="text-xs font-normal text-gray-400">({draft.suggestedPrompts.length})</span>}
            </button>
          ))}
        </div>

        {tab === 'details' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <label className="block">
                <span className="text-sm font-semibold text-gray-800">Scheme name</span>
                <input value={draft.name} onChange={(e) => setField('name', e.target.value)} maxLength={120} className={`mt-1 ${inputClass}`} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-800">One-line description</span>
                <span className="ml-1 text-xs text-gray-500">(scheme cards and the header menu)</span>
                <textarea
                  rows={2}
                  value={draft.shortDescription}
                  onChange={(e) => setField('shortDescription', e.target.value)}
                  maxLength={300}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-800">About this scheme</span>
                <span className="ml-1 text-xs text-gray-500">(shown before the questions in Genie)</span>
                <textarea
                  rows={6}
                  value={draft.description}
                  onChange={(e) => setField('description', e.target.value)}
                  maxLength={5000}
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <label className="block max-w-[10rem]">
                <span className="text-sm font-semibold text-gray-800">Display order</span>
                <input
                  type="number"
                  value={draft.sortOrder}
                  onChange={(e) => setField('sortOrder', e.target.value === '' ? '' : Number(e.target.value))}
                  className={`mt-1 ${inputClass}`}
                />
                <span className="mt-1 block text-xs text-gray-500">Lower numbers show first.</span>
              </label>
              {scheme.legacyKey && (
                <div className="rounded-xl border border-purple-100 bg-purple-50/60 px-4 py-3 text-sm text-purple-900">
                  Built-in scheme: answers to its questions are also saved for the client-screening team, and Genie
                  offers users the{' '}
                  <a href={`/schemes/${scheme.legacyKey}/support`} target="_blank" rel="noreferrer" className="font-semibold underline">
                    expert support request
                  </a>
                  . Keep the question IDs when you edit them.
                </div>
              )}
            </div>

            <div className="space-y-3 lg:col-span-2">
              <p className="text-sm font-semibold text-gray-800">Banner (16:9)</p>
              <SchemeBanner bannerUrl={scheme.bannerUrl} name={draft.name || scheme.name} className="shadow-sm ring-1 ring-gray-200" />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCropperOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-800 hover:bg-purple-100"
                >
                  <ImagePlus className="h-4 w-4" /> {scheme.bannerUrl ? 'Change banner' : 'Add banner'}
                </button>
                {scheme.bannerUrl && (
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">Saved immediately. Cropped to 1280×720 so every card looks consistent.</p>

              {!scheme.legacyKey && (
                <div className="mt-8 rounded-xl border border-red-200 p-4">
                  <p className="text-sm font-semibold text-red-700">Delete scheme</p>
                  <p className="mt-1 text-xs text-gray-600">Removes the scheme, its banner and all its documents from Genie.</p>
                  <button
                    type="button"
                    onClick={deleteScheme}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" /> Delete scheme
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'documents' && <DocumentManager schemeId={id} schemeName={scheme.name} />}

        {tab === 'questions' && (
          <QuestionBuilder questions={draft.intakeQuestions} onChange={(value) => setField('intakeQuestions', value)} />
        )}

        {tab === 'prompts' && (
          <PromptBuilder
            prompts={draft.suggestedPrompts}
            questions={draft.intakeQuestions}
            onChange={(value) => setField('suggestedPrompts', value)}
          />
        )}
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-purple-200 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(76,29,149,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="text-sm text-gray-700">You have unsaved changes.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraft(toDraft(scheme))}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      <BannerCropper open={cropperOpen} onClose={() => setCropperOpen(false)} onSave={saveBanner} />
    </AdminLayout>
  );
}
