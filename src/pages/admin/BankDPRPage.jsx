/**
 * BankDPRPage — Service Manager selects a DPR and sends it to chosen banks via email
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDPRList, sendDPRToBanks, fetchDPRBankHistory, deleteHistoryEntry,
} from '@/store/slices/bankSlice';
import { fetchAllBanks } from '@/store/slices/bankSlice';
import {
  FileText, Search, Send, ChevronLeft, ChevronRight,
  Building2, Clock, CheckCircle, X, RefreshCw, History, AlertCircle, Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layouts';

const PAGE_SIZE = 15;

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtFull = (d) => d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : '—';

// ── Send to Banks Modal ────────────────────────────────────────────────────
const SendBanksModal = ({ dpr, banks, onClose, onSent }) => {
  const dispatch = useDispatch();
  const { sending, dprHistory } = useSelector(s => s.bank);

  const [selectedBanks, setSelectedBanks] = useState([]);
  const [bankSearch, setBankSearch]       = useState('');
  const [showHistory, setShowHistory]     = useState(false);

  const history = dprHistory[dpr._id] || [];

  useEffect(() => {
    dispatch(fetchDPRBankHistory(dpr._id));
  }, [dpr._id]);

  // Only treat successfully sent records as "already sent" — failed ones can be retried
  const alreadySentIds = new Set(history.filter(h => h.status === 'sent').map(h => h.bank?._id));

  const filteredBanks = banks.filter(b =>
    !bankSearch ||
    b.name?.toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.email?.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const toggle = (id) => setSelectedBanks(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const handleSend = async () => {
    if (selectedBanks.length === 0) { toast.error('Select at least one bank'); return; }

    // client-side guard: warn if all selected are already sent
    const allAlreadySent = selectedBanks.every(id => alreadySentIds.has(id));
    if (allAlreadySent) {
      toast.error('All selected banks have already received this DPR. Select different banks.');
      return;
    }

    try {
      const result = await dispatch(sendDPRToBanks({ dprId: dpr._id, bankIds: selectedBanks })).unwrap();
      const { sentCount, skippedAlready } = result.data || {};
      let msg = result.message || `DPR sent to ${sentCount} bank(s)`;
      if (skippedAlready > 0) msg += ` (${skippedAlready} already sent — skipped)`;
      toast.success(msg);
      dispatch(fetchDPRBankHistory(dpr._id));
      onSent();
      onClose();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : (err?.message || 'Failed to send DPR'), { duration: 6000 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">Send DPR to Banks</h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {dpr.clientName} · {fmt(dpr.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${showHistory ? 'bg-gray-100 border-gray-300' : 'hover:bg-gray-50'}`}
            >
              <History className="h-3.5 w-3.5" /> History ({history.length})
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {showHistory ? (
          /* ── History tab ── */
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Clock className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>This DPR has not been sent to any bank yet</p>
              </div>
            ) : history.map((h, i) => (
              <div key={h._id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                <div>
                  <p className="font-medium text-sm">{h.bank?.name || '—'}</p>
                  <p className="text-xs text-gray-400">{h.bank?.email || '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {h.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{fmtFull(h.sentAt)}</p>
                  </div>
                  {/* Allow removing failed entries so the bank can be re-selected */}
                  {h.status === 'failed' && (
                    <button
                      title="Remove failed entry to retry"
                      onClick={() => dispatch(deleteHistoryEntry({ historyId: h._id, dprId: dpr._id }))}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Select banks tab ── */
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* DPR info */}
            <div className="bg-purple-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-xs text-gray-500 uppercase">Client</span><p className="font-medium mt-0.5">{dpr.clientName}</p></div>
              <div><span className="text-xs text-gray-500 uppercase">Loan Amount</span><p className="font-medium mt-0.5">{dpr.loanAmount}</p></div>
              <div><span className="text-xs text-gray-500 uppercase">Business</span><p className="font-medium mt-0.5">{dpr.nature}</p></div>
              <div><span className="text-xs text-gray-500 uppercase">Type</span><p className="font-medium mt-0.5">{dpr.reportType}</p></div>
            </div>

            {/* Already sent notice */}
            {alreadySentIds.size > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{alreadySentIds.size} bank(s) already received this DPR — you can re-send if needed</span>
              </div>
            )}

            {/* Bank search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search banks…"
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Bank checkboxes */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredBanks.length === 0 ? (
                <p className="text-center text-gray-400 py-4 text-sm">No banks found</p>
              ) : filteredBanks.map(bank => {
                const checked  = selectedBanks.includes(bank._id);
                const sentBefore = alreadySentIds.has(bank._id);
                return (
                  <button
                    key={bank._id}
                    type="button"
                    onClick={() => !sentBefore && toggle(bank._id)}
                    disabled={sentBefore}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      sentBefore
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : checked
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                      sentBefore ? 'bg-green-500 border-green-500'
                        : checked ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                    }`}>
                      {sentBefore
                        ? <CheckCircle className="h-3.5 w-3.5 text-white" />
                        : checked && <CheckCircle className="h-3.5 w-3.5 text-white" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{bank.name}</p>
                      <p className="text-xs text-gray-400 truncate">{bank.email || 'No email'} {bank.branchName ? `· ${bank.branchName}` : ''}</p>
                    </div>
                    {sentBefore && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">Already sent</span>
                    )}
                    {!bank.email && !sentBefore && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0">No email</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        {!showHistory && (
          <div className="px-6 py-4 border-t flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500">
              {selectedBanks.length} bank{selectedBanks.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || selectedBanks.length === 0}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send to {selectedBanks.length || ''} Bank{selectedBanks.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
const BankDPRPage = () => {
  const dispatch = useDispatch();
  const { dprList, dprTotal, banks, loading } = useSelector(s => s.bank);

  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [selectedDPR, setSelectedDPR] = useState(null);

  const totalPages = Math.max(1, Math.ceil(dprTotal / PAGE_SIZE));

  const load = () => {
    dispatch(fetchDPRList({ page, limit: PAGE_SIZE, search }));
  };

  useEffect(() => { dispatch(fetchAllBanks()); }, []);
  useEffect(() => { load(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    dispatch(fetchDPRList({ page: 1, limit: PAGE_SIZE, search }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Send DPR to Banks</h1>
            <p className="text-gray-500 mt-1">Select a DPR and choose which banks should receive it</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by client name or DPR title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 text-sm">
            Search
          </button>
        </form>

        {/* DPR Table */}
        <div className="bg-white rounded-xl border">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold">All DPRs</h2>
            <span className="text-xs text-gray-400 ml-1">({dprTotal} total)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Client Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nature of Business</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Loan Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Generated On</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Banks Sent</th>
                  <th className="py-3 px-4 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto" />
                  </td></tr>
                ) : dprList.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">
                    {search ? `No DPRs match "${search}"` : 'No DPRs found'}
                  </td></tr>
                ) : dprList.map((dpr, idx) => (
                  <tr key={dpr._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="py-3 px-4 font-medium">{dpr.clientName}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-40 truncate">{dpr.nature}</td>
                    <td className="py-3 px-4 text-gray-700">{dpr.loanAmount}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {dpr.reportType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{fmt(dpr.createdAt)}</td>
                    <td className="py-3 px-4">
                      {dpr.banksSent > 0 ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <Building2 className="h-3.5 w-3.5" /> {dpr.banksSent} bank{dpr.banksSent !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Not sent yet</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedDPR(dpr)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" /> Send to Banks
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
              <span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, dprTotal)} of {dprTotal}</span>
              <div className="flex items-center gap-1 flex-wrap">
                {/* Prev */}
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* First page */}
                {page > 3 && <>
                  <button onClick={() => setPage(1)} className="w-8 h-8 rounded text-xs font-medium hover:bg-gray-100 text-gray-600">1</button>
                  {page > 4 && <span className="text-gray-400 px-1">…</span>}
                </>}

                {/* Sliding window: current-2 to current+2 */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(pg => pg >= page - 2 && pg <= page + 2)
                  .map(pg => (
                    <button key={pg} onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded text-xs font-medium transition-colors ${pg === page ? 'bg-purple-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                      {pg}
                    </button>
                  ))
                }

                {/* Last page */}
                {page < totalPages - 2 && <>
                  {page < totalPages - 3 && <span className="text-gray-400 px-1">…</span>}
                  <button onClick={() => setPage(totalPages)} className="w-8 h-8 rounded text-xs font-medium hover:bg-gray-100 text-gray-600">{totalPages}</button>
                </>}

                {/* Next */}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send to Banks Modal */}
      {selectedDPR && (
        <SendBanksModal
          dpr={selectedDPR}
          banks={banks}
          onClose={() => setSelectedDPR(null)}
          onSent={load}
        />
      )}
    </AdminLayout>
  );
};

export default BankDPRPage;
