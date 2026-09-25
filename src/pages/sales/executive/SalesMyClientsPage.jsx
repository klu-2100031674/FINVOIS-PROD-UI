import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { getMyClients, STAGE_COLORS, PRIORITY_COLORS } from '../../../services/salesService';
import SalesClientDetailDrawer from '../shared/SalesClientDetailDrawer';

const STAGE_TABS = ['All', 'Assigned', 'Contacted', 'Interested', 'Follow-Up', 'Negotiation', 'Converted', 'Rejected'];

const Badge = ({ label, colorMap }) => {
  const cls = colorMap[label] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${cls}`}>
      {label}
    </span>
  );
};

const SalesMyClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stageTab, setStageTab] = useState('All');
  const [selectedClient, setSelectedClient] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = stageTab !== 'All' ? { stage: stageTab } : {};
    getMyClients(params)
      .then((res) => setClients(res.data.clients || res.data || []))
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [stageTab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Customers</h1>
        <p className="text-sm text-gray-500 mt-0.5">{clients.length} customers</p>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1 overflow-x-auto">
        {STAGE_TABS.map((s) => (
          <button
            key={s}
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
          <AlertCircle size={15} />{error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-600" size={28} /></div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No customers in this stage</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedClient(c)}
              className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-gray-300 hover:bg-gray-50 transition group shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 truncate flex-1">{c.customerName}</h3>
                <Badge label={c.stage} colorMap={STAGE_COLORS} />
              </div>
              <div className="space-y-1.5 text-sm text-gray-500">
                <p className="font-mono text-gray-600">{c.phoneNumber}</p>
                {c.city && <p>{c.city}</p>}
                {c.requirement && <p className="truncate text-xs">{c.requirement}</p>}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <Badge label={c.priority} colorMap={PRIORITY_COLORS} />
                <span className="text-[11px] text-gray-400">{new Date(c.updatedAt).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedClient && (
        <SalesClientDetailDrawer
          client={selectedClient}
          isManager={false}
          onClose={() => setSelectedClient(null)}
          onUpdate={load}
        />
      )}
    </div>
  );
};

export default SalesMyClientsPage;
