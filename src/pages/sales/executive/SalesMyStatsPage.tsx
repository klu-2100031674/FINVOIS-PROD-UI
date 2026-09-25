import { useState, useEffect } from 'react';
import {
  UserCheck,
  TrendingUp,
  XCircle,
  CalendarClock,
  Activity,
  Loader2,
  PhoneCall,
  AtSign,
  Video,
  FileText,
  MessageCircle,
  MessageSquare,
} from 'lucide-react';
import { salesStatsAPI } from '../../../services/salesService';
import type { ExecutiveStats, SalesActivity, ActivityType } from '../../../types/sales.types';
import { format } from '../../../utils/salesUtils';
import toast from 'react-hot-toast';

function activityIcon(type: ActivityType): React.ReactNode {
  const map: Record<ActivityType, React.ReactNode> = {
    call: <PhoneCall className="w-4 h-4" />,
    email: <AtSign className="w-4 h-4" />,
    meeting: <Video className="w-4 h-4" />,
    demo: <Video className="w-4 h-4" />,
    follow_up: <CalendarClock className="w-4 h-4" />,
    note: <FileText className="w-4 h-4" />,
    whatsapp: <MessageCircle className="w-4 h-4" />,
    sms: <MessageSquare className="w-4 h-4" />,
  };
  return map[type] ?? <Activity className="w-4 h-4" />;
}

function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function SalesMyStatsPage() {
  const [stats, setStats] = useState<ExecutiveStats | null>(null);
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([salesStatsAPI.mine(), salesStatsAPI.myActivity(20)])
      .then(([statsRes, actRes]) => {
        setStats(statsRes.data);
        setActivities(actRes.data);
      })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-2xl font-bold text-white">My Stats</h1>
        <p className="text-gray-400 text-sm mt-0.5">Your performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Total Assigned"
          value={stats?.totalAssigned ?? 0}
          icon={<UserCheck className="w-5 h-5 text-violet-300" />}
          accent="bg-violet-500/20"
        />
        <StatCard
          label="Converted"
          value={stats?.converted ?? 0}
          icon={<TrendingUp className="w-5 h-5 text-emerald-300" />}
          accent="bg-emerald-500/20"
        />
        <StatCard
          label="Conversion Rate"
          value={`${(stats?.conversionRate ?? 0).toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5 text-blue-300" />}
          accent="bg-blue-500/20"
        />
        <StatCard
          label="Rejected"
          value={stats?.rejected ?? 0}
          icon={<XCircle className="w-5 h-5 text-red-300" />}
          accent="bg-red-500/20"
        />
        <StatCard
          label="Overdue Follow-Ups"
          value={stats?.overdueFollowUps ?? 0}
          icon={<CalendarClock className="w-5 h-5 text-yellow-300" />}
          accent="bg-yellow-500/20"
          sub={`${stats?.todayActivities ?? 0} activities today`}
        />
      </div>

      {/* Activity feed */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-violet-400" />
          <h2 className="text-white font-semibold text-sm">Recent Activity</h2>
          <span className="text-gray-500 text-xs ml-auto">{activities.length} entries</span>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-10 text-gray-600">No recent activities</div>
        ) : (
          <div className="space-y-3">
            {activities.map((act, idx) => (
              <div key={act.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    {activityIcon(act.type)}
                  </div>
                  {idx < activities.length - 1 && (
                    <div className="w-px flex-1 bg-white/5 mt-1.5" />
                  )}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded text-xs font-medium capitalize">
                      {act.type}
                    </span>
                    <span className="text-gray-600 text-xs ml-auto">{format.dateTime(act.createdAt)}</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{act.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
