import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, PhoneCall, MessageSquare, AtSign, Users, Calendar, FileText } from 'lucide-react';
import { getMyClients, getClientActivities, getSalesMe } from '../../../services/salesService';

const ACTIVITY_ICONS = {
  call: PhoneCall,
  message: MessageSquare,
  email: AtSign,
  meeting: Users,
  'follow-up': Calendar,
  note: FileText,
};

const KpiCard = ({ label, value, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
    <p className={`text-3xl font-bold mt-1.5 ${color}`}>{value ?? 0}</p>
  </div>
);

const SalesMyStatsPage = () => {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const clientRes = await getMyClients({});
        const clients = clientRes.data.clients || clientRes.data || [];

        const counts = {
          picked: clients.length,
          contacted: clients.filter((c) => ['Contacted', 'Interested', 'Follow-Up', 'Negotiation', 'Converted'].includes(c.stage)).length,
          converted: clients.filter((c) => c.stage === 'Converted').length,
          rejected: clients.filter((c) => c.stage === 'Rejected').length,
          pending: clients.filter((c) => ['Assigned', 'Contacted', 'Interested', 'Follow-Up', 'Negotiation'].includes(c.stage)).length,
        };
        setStats(counts);

        // Load activities for last 5 clients
        const recent = clients.slice(0, 5);
        const activityBatches = await Promise.allSettled(
          recent.map((c) => getClientActivities(c._id).then((r) => r.data.activities || r.data || []))
        );
        const allActivities = activityBatches
          .filter((r) => r.status === 'fulfilled')
          .flatMap((r) => r.value)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 20);
        setRecentActivities(allActivities);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-600" size={28} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Stats</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your performance overview</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={15} />{error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard label="Total Picked" value={stats.picked} color="text-purple-700" />
          <KpiCard label="Contacted" value={stats.contacted} color="text-cyan-600" />
          <KpiCard label="Converted" value={stats.converted} color="text-emerald-600" />
          <KpiCard label="Rejected" value={stats.rejected} color="text-red-500" />
          <KpiCard label="Pending" value={stats.pending} color="text-yellow-600" />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity Feed</h2>
        {recentActivities.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No activities recorded yet</p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((a) => {
              const Icon = ACTIVITY_ICONS[a.activityType] || FileText;
              return (
                <div key={a._id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={13} className="text-purple-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-800 capitalize font-medium">{a.activityType}</p>
                      <p className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{a.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesMyStatsPage;
