/**
 * Card-style MSME "My Customers" dashboard for non-admin profiles.
 * Intentionally separate from MsmeDprDashboard (admin table UI) — do not merge.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ClipboardList, Loader2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMsmeDprLeads } from '@/api/msmeDprLeadsAPI';
import {
  WORKFLOW_KEYS,
  workflowFromLead,
  staffHandlerName,
} from '@/utils/dprWorkflowStatus';
import { displayMsmeLoanType } from '@/utils/msmeLoanTypeDisplay';

const PAGE_LIMIT = 100;

/** Only MSME-relevant filters (sales CRM stages Contacted / Interested / Follow-Up / Negotiation removed). */
const STAGE_TABS = ['All', 'Assigned', 'Converted', 'Rejected'];

const STAGE_COLORS = {
  Assigned: 'bg-blue-50 text-blue-700 border-blue-200',
  Converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-600 border-red-200',
};

/** Map MSME DPR workflow → filter/badge stage. */
function stageFromWorkflow(workflowKey) {
  switch (workflowKey) {
    case WORKFLOW_KEYS.generated:
      return 'Converted';
    case WORKFLOW_KEYS.rejected:
      return 'Rejected';
    default:
      return 'Assigned';
  }
}

const TEMPLATES_LIST = [
  { id: 'frcc1', name: 'Cash Credit Form 1' },
  { id: 'frcc2', name: 'Cash Credit Form 2' },
  { id: 'frcc3', name: 'Cash Credit Form 3' },
  { id: 'frcc4', name: 'Cash Credit Form 4' },
  { id: 'frcc5', name: 'Cash Credit Form 5' },
  { id: 'frcc6', name: 'Cash Credit Form 6' },
  { id: 'frcc7', name: 'Cash Credit Form 7' },
  { id: 'TERM_LOAN_SERVICE_WITHOUT_STOCK', name: 'Term Loan Form' },
  { id: 'TERM_LOAN_CC', name: 'Term Loan Cash Credit Form' },
  { id: 'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK', name: 'Term Loan With Stock Form' },
  { id: 'TERM_LOAN_EV_VEHICLE', name: 'EV Commercial Vehicle' },
  { id: 'TERM_LOAN_OTHER_THAN_EV_VEHICLE', name: 'Other Than EV Commercial Vehicle' },
  { id: 'TERM_LOAN_JCB_VEHICLE', name: 'JCB Vehicle' },
  { id: 'TERM_LOAN_DRONE_VEHICLE', name: 'Drone Vehicle' },
  { id: 'GOLD_LOAN', name: 'Gold Loan' },
];

function Badge({ label, className }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
        className || 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      {label}
    </span>
  );
}

function locationLabel(lead) {
  return [lead.villageCity, lead.district].filter(Boolean).join(', ') || lead.mandal || '';
}

function industryLabel(lead) {
  return lead.sector || lead.natureOfBusiness || '';
}

function DetailDrawer({ lead, showGenerateReport, onClose }) {
  const navigate = useNavigate();
  const [templateId, setTemplateId] = useState('frcc1');
  const workflow = workflowFromLead(lead);
  const stage = stageFromWorkflow(workflow.key);
  const docs = Array.isArray(lead?.documents) ? lead.documents : [];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/30" aria-label="Close" onClick={onClose} />
      <aside className="relative z-10 w-full max-w-md h-full bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{lead.applicantName}</h2>
            <p className="text-sm text-gray-500 font-mono mt-0.5">{lead.mobileNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge label={stage} className={STAGE_COLORS[stage]} />
            {staffHandlerName(lead) ? (
              <Badge
                label={`Generating: ${staffHandlerName(lead)}`}
                className="bg-purple-50 text-purple-700 border-purple-200"
              />
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50/70">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block mb-1">
                Loan Type
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {displayMsmeLoanType(lead.loanType) || '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block mb-1">
                Sector
              </span>
              <span className="text-sm font-semibold text-gray-900">{lead.sector || '—'}</span>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            {[
              ['Nature of business', lead.natureOfBusiness],
              ['Scheme', lead.schemeAppliedUnder === 'CMEGP' ? 'CMEP' : lead.schemeAppliedUnder],
              ['Location', locationLabel(lead)],
              ['Category', lead.ruralUrbanCategory],
              ['Enterprise', lead.enterpriseType],
              ['Gender', lead.gender],
              ['Aadhaar', lead.aadharNumber],
              ['PAN', lead.panNumber],
              ['Loan amount', lead.loanAmount],
              ['Working capital', lead.workingCapital],
              ['Loan term (years)', lead.loanTermPeriod],
              ['Rate of interest', lead.rateOfInterest],
              ['Processing fee', lead.processingFee],
              ['Moratorium (months)', lead.moratoriumPeriod],
              ['Need CA stamp', lead.needCaStamp],
            ]
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-gray-50 pb-2">
                  <dt className="text-gray-400 shrink-0">{label}</dt>
                  <dd className="text-gray-800 text-right">{value}</dd>
                </div>
              ))}
          </dl>

          {lead.description && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.description}</p>
            </div>
          )}

          {docs.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">Documents</p>
              <ul className="space-y-1.5">
                {docs.map((doc, idx) => (
                  <li key={`${doc.fileName}-${idx}`}>
                    {doc.storageUrl ? (
                      <a
                        href={doc.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-700 hover:underline"
                      >
                        {doc.fileName}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-600">{doc.fileName}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showGenerateReport && (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-400">Generate report</p>
              <div className="flex items-center gap-2">
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-2 bg-white focus:ring-1 focus:ring-purple-400 focus:outline-none"
                >
                  {TEMPLATES_LIST.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams({
                      templateId,
                      newDraft: '1',
                      msmeLeadId: lead._id,
                    });
                    const requestId =
                      lead.departmentRequestId?._id ||
                      lead.departmentRequestId ||
                      lead.departmentRequest?._id ||
                      '';
                    if (requestId) params.set('requestId', String(requestId));
                    navigate(`/generate?${params.toString()}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Go
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

const MsmeDprCustomersCardDashboard = ({ showGenerateReport = false, title = 'My Customers' }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stageTab, setStageTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMsmeDprLeads({
        page: 1,
        limit: PAGE_LIMIT,
        timeframe: '1year',
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setLeads(data.submissions || []);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to load customers';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (stageTab === 'All') return leads;
    return leads.filter((lead) => stageFromWorkflow(workflowFromLead(lead).key) === stageTab);
  }, [leads, stageTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {filtered.length} customer{filtered.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
        />
      </div>

      <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1 overflow-x-auto">
        {STAGE_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStageTab(s)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              stageTab === s
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-purple-600" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No customers in this stage</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead) => {
            const stage = stageFromWorkflow(workflowFromLead(lead).key);
            const industry = industryLabel(lead);
            const location = locationLabel(lead);
            return (
              <button
                key={lead._id}
                type="button"
                onClick={() => setSelectedLead(lead)}
                className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-gray-300 hover:bg-gray-50 transition shadow-sm"
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h3 className="font-semibold text-gray-900 truncate flex-1">
                    {lead.applicantName || '—'}
                  </h3>
                  <Badge label={stage} className={STAGE_COLORS[stage]} />
                </div>
                <div className="space-y-1.5 text-sm text-gray-500">
                  <p className="font-mono text-gray-600">{lead.mobileNumber}</p>
                  {location ? <p>{location}</p> : null}
                  {industry ? <p className="truncate text-xs">{industry}</p> : null}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-purple-700 truncate pr-2">
                    {staffHandlerName(lead) ? `CS: ${staffHandlerName(lead)}` : ''}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedLead && (
        <DetailDrawer
          lead={selectedLead}
          showGenerateReport={showGenerateReport}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
};

export default MsmeDprCustomersCardDashboard;
