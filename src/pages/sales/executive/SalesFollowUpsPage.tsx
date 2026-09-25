import { useState, useEffect } from 'react';
import { CalendarClock, CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react';
import { salesFollowUpsAPI } from '../../../services/salesService';
import type { SalesFollowUp } from '../../../types/sales.types';
import { getStageBadgeClass, format } from '../../../utils/salesUtils';
import toast from 'react-hot-toast';

interface Section {
  id: 'overdue' | 'today' | 'upcoming';
  label: string;
  icon: React.ReactNode;
  headerColor: string;
  emptyText: string;
  items: SalesFollowUp[];
}

function categorize(items: SalesFollowUp[]): { overdue: SalesFollowUp[]; today: SalesFollowUp[]; upcoming: SalesFollowUp[] } {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  return {
    overdue: items.filter((f) => f.status === 'overdue' || (f.status === 'pending' && new Date(f.scheduledAt) < todayStart)),
    today: items.filter((f) => f.status === 'pending' && new Date(f.scheduledAt) >= todayStart && new Date(f.scheduledAt) < todayEnd),
    upcoming: items.filter((f) => f.status === 'pending' && new Date(f.scheduledAt) >= todayEnd),
  };
}

export default function SalesFollowUpsPage() {
  const [items, setItems] = useState<SalesFollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    salesFollowUpsAPI
      .mine({ status: 'pending' })
      .then((r) => setItems(r.data.data))
      .catch(() => toast.error('Failed to load follow-ups'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function markDone(id: string) {
    setMarkingId(id);
    try {
      await salesFollowUpsAPI.markDone(id);
      setItems((prev) => prev.filter((f) => f.id !== id));
      toast.success('Follow-up marked as done');
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Failed to mark done');
    } finally {
      setMarkingId(null);
    }
  }

  const { overdue, today, upcoming } = categorize(items);

  const sections: Section[] = [
    {
      id: 'overdue',
      label: 'Overdue',
      icon: <AlertCircle className="w-4 h-4 text-red-400" />,
      headerColor: 'text-red-400 border-red-500/20',
      emptyText: 'No overdue follow-ups',
      items: overdue,
    },
    {
      id: 'today',
      label: 'Today',
      icon: <Clock className="w-4 h-4 text-orange-400" />,
      headerColor: 'text-orange-400 border-orange-500/20',
      emptyText: 'No follow-ups scheduled for today',
      items: today,
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: <CalendarClock className="w-4 h-4 text-green-400" />,
      headerColor: 'text-green-400 border-green-500/20',
      emptyText: 'No upcoming follow-ups',
      items: upcoming,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Follow-Ups</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {overdue.length > 0 && <span className="text-red-400">{overdue.length} overdue · </span>}
          {today.length} today · {upcoming.length} upcoming
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <CalendarClock className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">You have no pending follow-ups</p>
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.id}>
            {/* Section header */}
            <div className={`flex items-center gap-2 pb-2 mb-3 border-b ${section.headerColor}`}>
              {section.icon}
              <h2 className={`font-semibold text-sm ${section.headerColor.split(' ')[0]}`}>
                {section.label}
              </h2>
              {section.items.length > 0 && (
                <span className="text-xs text-gray-500">({section.items.length})</span>
              )}
            </div>

            {section.items.length === 0 ? (
              <p className="text-gray-600 text-sm py-4 pl-2">{section.emptyText}</p>
            ) : (
              <div className="space-y-3">
                {section.items.map((fu) => {
                  const borderColor =
                    section.id === 'overdue' ? 'border-red-500/20 hover:border-red-500/40' :
                    section.id === 'today' ? 'border-orange-500/20 hover:border-orange-500/40' :
                    'border-emerald-500/20 hover:border-emerald-500/40';

                  return (
                    <div
                      key={fu.id}
                      className={`bg-white/5 backdrop-blur-md border rounded-xl p-4 transition-all ${borderColor}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white font-medium text-sm">{fu.client.name}</p>
                            <span className={getStageBadgeClass(fu.client.stage)}>{fu.client.stage}</span>
                          </div>
                          <p className="text-gray-400 text-xs mt-1">{fu.client.phone}</p>
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                            <CalendarClock className="w-3.5 h-3.5" />
                            {format.dateTime(fu.scheduledAt)}
                          </div>
                          {fu.note && (
                            <p className="text-gray-400 text-xs mt-1.5 bg-white/3 rounded-lg px-2.5 py-1.5">{fu.note}</p>
                          )}
                        </div>
                        <button
                          onClick={() => markDone(fu.id)}
                          disabled={markingId === fu.id}
                          className="shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
                        >
                          {markingId === fu.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Done
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
