import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, Loading } from '../components/common';
import ClientLayout from '../components/layouts/ClientLayout';
import AdminLayout from '../components/layouts/AdminLayout';
import AgentLayout from '../components/layouts/AgentLayout';
import {
  Trash2,
  Pencil,
  CheckCircle2,
  Clock3,
  FileStack,
  Filter,
  Plus,
  User,
  CalendarClock,
  FolderOpen,
  AlertTriangle,
} from 'lucide-react';
import {
  deleteDraftV2,
  fetchDrafts,
  selectDrafts,
  selectDraftsLoading,
} from '../store/slices/draftSlice';
import { setFormData } from '../store/slices/reportSlice';
import { useAuth } from '../hooks';
import { generateHubLandingPath } from '../utils/routePaths';
import { effectiveUserRole } from '../utils/normalizeUserRole';

const AUTHORISED_PERSON_FIELD_BY_FORM = {
  frcc1: 'i6',
  frcc2: 'i5',
  frcc3: 'i6',
  frcc4: 'i5',
  frcc5: 'i5',
  frcc6: 'i5',
  frcc7: 'i5',
};

function layoutForDraftsRole(userObj) {
  const r = effectiveUserRole(userObj);
  if (r === 'admin' || r === 'company_admin') return AdminLayout;
  if (r === 'agent') return AgentLayout;
  return ClientLayout;
}

const DraftsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const Layout = layoutForDraftsRole(user);
  const drafts = useSelector(selectDrafts);
  const loading = useSelector(selectDraftsLoading);

  const [formTypeFilter, setFormTypeFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const KNOWN_FORM_TYPES = useMemo(() => ([
    'frcc1',
    'frcc2',
    'frcc3',
    'frcc4',
    'frcc5',
    'frcc6',
    'frcc7',
    'TERM_LOAN_SERVICE_WITHOUT_STOCK',
    'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK',
    'TERM_LOAN_CC',
    'TERM_LOAN_EV_VEHICLE',
    'TERM_LOAN_OTHER_THAN_EV_VEHICLE',
    'TERM_LOAN_JCB_VEHICLE',
    'TERM_LOAN_DRONE_VEHICLE',
  ]), []);

  const formatFormTypeLabel = (formType) => {
    if (!formType) return '';
    const ft = String(formType);

    const explicit = {
      frcc1: 'Format CC1',
      frcc2: 'Format CC2',
      frcc3: 'Format CC3',
      frcc4: 'Format CC4',
      frcc5: 'Format CC5',
      frcc6: 'Format CC6',
      frcc7: 'Format CC7',
      TERM_LOAN_SERVICE_WITHOUT_STOCK: 'Term Loan (Service, Without Stock)',
      TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK: 'Term Loan (Manufacturing/Service, With Stock)',
      TERM_LOAN_CC: 'Term Loan + CC',
      TERM_LOAN_EV_VEHICLE: 'EV Commercial Vehicle',
      TERM_LOAN_OTHER_THAN_EV_VEHICLE: 'Other Than EV Commercial Vehicle',
      TERM_LOAN_JCB_VEHICLE: 'JCB Vehicle',
      TERM_LOAN_DRONE_VEHICLE: 'Drone Vehicle',
    };

    if (explicit[ft]) return explicit[ft];

    return ft
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getAuthorisedPersonName = (formData, formType) => {
    const general = formData?.['General Information'] || formData?.formData?.['General Information'];
    const formKey = String(formType || '').toLowerCase();
    const primaryField = AUTHORISED_PERSON_FIELD_BY_FORM[formKey];

    const candidates = [
      primaryField ? general?.[primaryField] : null,
      general?.i5,
      general?.i6,
      general?.['Name of Authorised Person'],
      general?.R5C2,
      formData?.authorisedPerson,
      formData?.authorizedPerson,
    ];

    const name = candidates.find((value) => value != null && String(value).trim().length > 0);
    return name ? String(name).trim() : null;
  };

  useEffect(() => {
    dispatch(fetchDrafts({ status: 'draft' }));
  }, [dispatch]);

  const formTypes = useMemo(() => {
    const present = (drafts || []).map((d) => d.formType).filter(Boolean);
    const set = new Set([...KNOWN_FORM_TYPES, ...present]);
    return Array.from(set).sort((a, b) => formatFormTypeLabel(a).localeCompare(formatFormTypeLabel(b)));
  }, [drafts]);

  const visibleDrafts = useMemo(() => {
    if (!formTypeFilter) return drafts || [];
    return (drafts || []).filter((d) => d.formType === formTypeFilter);
  }, [drafts, formTypeFilter]);

  const totalCount = (drafts || []).length;
  const visibleCount = visibleDrafts.length;

  const handleEdit = (draft) => {
    if (!draft?.formType) return;
    dispatch(setFormData(draft.formData || {}));
    navigate(`/generate?templateId=${encodeURIComponent(draft.formType)}&draftId=${draft._id}`);
  };

  const handleDelete = async (draftId) => {
    try {
      await dispatch(deleteDraftV2(draftId)).unwrap();
      toast.success('Draft deleted');
    } catch (e) {
      toast.error(e || 'Failed to delete draft');
    }
  };

  const paymentBadgeClass = (status) => {
    if (status === 'success') {
      return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
    }
    if (status === 'failed') {
      return 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
    }
    return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80';
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 py-24">
          <Loading text="Loading your drafts…" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] bg-gradient-to-b from-[#f8f7ff] via-white to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* Page header */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-purple-700 shadow-sm ring-1 ring-purple-100">
                <FileStack className="h-3.5 w-3.5" aria-hidden />
                {totalCount === 1 ? '1 draft saved' : `${totalCount} drafts saved`}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                Drafts
              </h1>
              <p className="text-base text-gray-600 max-w-xl leading-relaxed">
                Continue where you left off. Edit a draft to finish your report, or start a new one from the dashboard.
              </p>
            </div>
            <Button
              variant="primary"
              className="shrink-0 !bg-purple-600 hover:!bg-purple-700 focus:!ring-purple-500 shadow-md shadow-purple-500/20 sm:min-w-[160px] rounded-xl"
              onClick={() => {
                toast.success('Select a template to start a new draft.');
                navigate(generateHubLandingPath(user));
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Create new
              </span>
            </Button>
          </div>

          {/* Filter */}
          <div className="mb-8 rounded-2xl border border-gray-200/80 bg-white/90 p-4 sm:p-5 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                  <Filter className="h-4 w-4" aria-hidden />
                </span>
                Filter by form type
              </div>
              <div className="w-full sm:max-w-md">
                <label htmlFor="draft-form-filter" className="sr-only">
                  Filter drafts by form type
                </label>
                <select
                  id="draft-form-filter"
                  value={formTypeFilter}
                  onChange={(e) => setFormTypeFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-900 shadow-sm transition focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
                >
                  <option value="">All form types</option>
                  {formTypes.map((t) => (
                    <option key={t} value={t}>{formatFormTypeLabel(t)}</option>
                  ))}
                </select>
              </div>
            </div>
            {formTypeFilter ? (
              <p className="mt-3 text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-800">{visibleCount}</span> of {totalCount} draft{totalCount === 1 ? '' : 's'}
              </p>
            ) : null}
          </div>

          {visibleDrafts.length === 0 ? (
            <Card className="overflow-hidden border border-dashed border-gray-200 bg-white/80 shadow-none">
              <div className="flex flex-col items-center justify-center px-6 py-16 sm:py-20 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-50 text-purple-600 shadow-inner ring-1 ring-purple-100">
                  <FolderOpen className="h-8 w-8" strokeWidth={1.5} aria-hidden />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {formTypeFilter ? 'No drafts for this filter' : 'No drafts yet'}
                </h2>
                <p className="mt-2 max-w-md text-sm text-gray-600 leading-relaxed">
                  {formTypeFilter
                    ? 'Try another form type or clear the filter to see all drafts.'
                    : 'When you save progress on a report, it will appear here so you can pick up anytime.'}
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {formTypeFilter ? (
                    <button
                      type="button"
                      onClick={() => setFormTypeFilter('')}
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                    >
                      Clear filter
                    </button>
                  ) : null}
                  <Button
                    variant="primary"
                    className="!bg-purple-600 hover:!bg-purple-700 focus:!ring-purple-500 rounded-xl"
                    onClick={() => {
                      toast.success('Select a template to start a new draft.');
                      navigate('/dashboard');
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                      Create new draft
                    </span>
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {visibleDrafts.map((d) => {
                const title = formatFormTypeLabel(d.formType);
                const pay = d.paymentStatus || 'pending';
                return (
                  <li key={d._id}>
                    <article
                      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm transition duration-200 hover:border-purple-200/80 hover:shadow-md hover:shadow-purple-500/5"
                    >
                      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-purple-500 to-indigo-500 opacity-90" aria-hidden />
                      <div className="flex flex-1 flex-col pl-5 pr-4 py-5 sm:pl-6 sm:pr-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-lg font-semibold leading-snug text-gray-900 group-hover:text-purple-900 transition-colors">
                                {title}
                              </h2>
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${paymentBadgeClass(d.paymentStatus)}`}
                              >
                                {pay === 'success' ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                ) : (
                                  <Clock3 className="h-3.5 w-3.5 opacity-80" aria-hidden />
                                )}
                                {pay}
                              </span>
                            </div>
                            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-1">
                              <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-100">
                                <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Authorised person</dt>
                                  <dd className="mt-0.5 font-medium text-gray-900">
                                    {getAuthorisedPersonName(d.formData, d.formType) || (
                                      <span className="font-normal text-slate-400">Not filled</span>
                                    )}
                                  </dd>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-100">
                                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                                <div>
                                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Last updated</dt>
                                  <dd className="mt-0.5 font-medium tabular-nums text-gray-900">
                                    {new Date(d.updatedAt).toLocaleString(undefined, {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    })}
                                  </dd>
                                </div>
                              </div>
                            </dl>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() => handleEdit(d)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:flex-initial sm:min-w-[112px]"
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(d)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/30 sm:flex-initial sm:min-w-[112px]"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={() => setDeleteTarget(null)}
            aria-label="Close delete dialog"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-draft-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200"
          >
            <div className="border-b border-gray-100 bg-gradient-to-r from-red-50/80 to-white px-6 py-5">
              <div className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                  <AlertTriangle className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 id="delete-draft-title" className="text-lg font-semibold text-gray-900">
                    Delete this draft?
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-900">{formatFormTypeLabel(deleteTarget.formType)}</span>
                    {' '}will be removed permanently. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteTarget._id;
                  setDeleteTarget(null);
                  await handleDelete(id);
                }}
                className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
              >
                Delete draft
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DraftsPage;
