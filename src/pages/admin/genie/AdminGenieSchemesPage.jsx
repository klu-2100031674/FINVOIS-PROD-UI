import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  FlaskConical,
  Loader2,
  Mail,
  MessageSquareText,
  Plus,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../../components/layouts';
import SchemeBanner from '../../../components/genie/SchemeBanner';
import { SchemeGridSkeleton } from '../../../components/genie/GenieSkeletons';
import { adminGenieAPI } from '../../../api/genieAPI';

const StatusBadge = ({ status }) =>
  status === 'published' ? (
    <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">
      Published
    </span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
      Draft
    </span>
  );

function NewSchemeDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setShortDescription('');
    }
  }, [open]);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const scheme = await adminGenieAPI.create({ name, shortDescription });
      toast.success('Scheme created. Add a banner, documents and questions next.');
      onCreated(scheme);
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-['Manrope'] text-lg font-bold text-gray-900">New scheme</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="text-sm font-semibold text-gray-800">Scheme name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="e.g. Stand-Up India"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-800">One-line description</span>
            <span className="ml-1 text-xs text-gray-500">(shown on scheme cards)</span>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Who it is for and what it offers"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </label>
          <p className="text-xs text-gray-500">New schemes start as Draft, hidden from the website until you publish them.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create scheme
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminGenieSchemesPage() {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSchemes(await adminGenieAPI.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-700">
              <Sparkles className="h-3.5 w-3.5" /> Finvois Genie
            </p>
            <h1 className="font-['Manrope'] text-2xl font-bold text-gray-900">Schemes</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Each scheme has a banner, the documents Genie answers from, the questions it asks users, and suggested
              prompts. Published schemes appear in the website header and in Genie.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/client-screening/emails"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Mail className="h-4 w-4" /> Support emails
            </Link>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800"
            >
              <Plus className="h-4 w-4" /> New scheme
            </button>
          </div>
        </div>

        {loading ? (
          <SchemeGridSkeleton className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" />
        ) : error ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {error}
            </span>
            <button type="button" onClick={load} className="inline-flex items-center gap-1 font-semibold hover:underline">
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {schemes.map((scheme) => (
              <button
                key={scheme.id}
                type="button"
                onClick={() => navigate(`/admin/genie-schemes/${scheme.id}`)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
              >
                <SchemeBanner bannerUrl={scheme.bannerUrl} name={scheme.name} rounded="rounded-none" />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-['Manrope'] text-base font-bold text-gray-900 group-hover:text-purple-800">
                      {scheme.name}
                    </h2>
                    <StatusBadge status={scheme.status} />
                  </div>
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {scheme.shortDescription || 'No description yet.'}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-gray-500">
                    <span>{scheme.intakeQuestions.length} questions</span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquareText className="h-3.5 w-3.5" /> {scheme.suggestedPrompts.length} prompts
                    </span>
                    {scheme.processingCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-purple-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {scheme.processingCount} processing
                      </span>
                    )}
                    {scheme.failedCount > 0 && (
                      <span className="font-semibold text-red-600">{scheme.failedCount} failed</span>
                    )}
                    {scheme.legacyKey && <span className="text-purple-700">Built-in</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <NewSchemeDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(scheme) => navigate(`/admin/genie-schemes/${scheme.id}`)}
      />
    </AdminLayout>
  );
}
