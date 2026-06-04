import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FileText,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  FolderOpen,
  Plus,
  CalendarClock
} from 'lucide-react';
import ClientLayout from '../../components/layouts/ClientLayout';
import { Button } from '../../components/common';
import { draftAPI } from '../../api/api';
import {
  getExecutiveDraftLabel,
  getExecutiveTemplatePath,
  getTemplateIdFromDraftFormType,
  getDraftDisplayTitle,
  isExecutiveDraftFormType
} from '../../utils/executiveDraftConfig';
import { EXECUTIVE_TEMPLATES } from '../../utils/executiveTemplates';

const ExecutiveDraftsPage = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templateFilter, setTemplateFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadDrafts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await draftAPI.listDrafts({ status: 'draft' });
      const rows = Array.isArray(res?.data) ? res.data : [];
      setDrafts(rows.filter((d) => isExecutiveDraftFormType(d.formType || d.templateId)));
    } catch {
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const templateOptions = useMemo(() => {
    const types = new Set(drafts.map((d) => d.formType || d.templateId).filter(Boolean));
    return Array.from(types).sort((a, b) =>
      getExecutiveDraftLabel(a).localeCompare(getExecutiveDraftLabel(b))
    );
  }, [drafts]);

  const visibleDrafts = useMemo(() => {
    if (!templateFilter) return drafts;
    return drafts.filter((d) => (d.formType || d.templateId) === templateFilter);
  }, [drafts, templateFilter]);

  const handleEdit = (draft) => {
    const formType = draft.formType || draft.templateId;
    const templateId =
      getTemplateIdFromDraftFormType(formType) ||
      draft.formData?.templateId ||
      draft.form_data?.templateId;
    if (!templateId) {
      toast.error('Unknown template for this draft');
      return;
    }
    const path = getExecutiveTemplatePath(templateId);
    navigate(`${path}?draftId=${draft._id}`);
  };

  const handleDelete = async (id) => {
    try {
      await draftAPI.deleteDraftById(id);
      toast.success('Draft deleted');
      setDeleteTarget(null);
      loadDrafts();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete draft');
    }
  };

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drafts</h1>
            <p className="text-sm text-gray-600 mt-1">
              Saved verification forms you have not submitted yet. Resume editing or delete drafts you no longer need.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadDrafts}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              to="/executive/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              New report
            </Link>
          </div>
        </div>

        {templateOptions.length > 1 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Template</label>
            <select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              className="w-full sm:max-w-xs text-sm px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All templates</option>
              {templateOptions.map((t) => (
                <option key={t} value={t}>
                  {getExecutiveDraftLabel(t)}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : visibleDrafts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl bg-white">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No drafts saved</p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Use &quot;Save draft&quot; on any verification form to continue later.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {EXECUTIVE_TEMPLATES.map((t) => (
                <Link
                  key={t.id}
                  to={t.path}
                  className="text-sm text-purple-700 hover:underline px-2"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleDrafts.map((draft) => {
              const formType = draft.formType || draft.templateId;
              const title = getDraftDisplayTitle(draft);
              return (
                <div
                  key={draft._id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{title}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {getExecutiveDraftLabel(formType)}
                      </span>
                    </div>
                    <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Updated {new Date(draft.updatedAt || draft.last_saved_at).toLocaleString()}
                  </p>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Button type="button" variant="primary" size="sm" onClick={() => handleEdit(draft)}>
                      <Pencil className="w-3.5 h-3.5 mr-1 inline" />
                      Continue
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(draft._id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1 inline" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900">Delete draft?</h2>
            <p className="text-sm text-gray-600 mt-2">This cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="!bg-red-600 hover:!bg-red-700"
                onClick={() => handleDelete(deleteTarget)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
};

export default ExecutiveDraftsPage;
