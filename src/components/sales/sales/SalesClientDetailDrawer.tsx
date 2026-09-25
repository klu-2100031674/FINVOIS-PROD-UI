import { useState, useEffect, type FormEvent } from 'react';
import {
  X,
  Phone,
  Mail,
  Building2,
  MapPin,
  ChevronDown,
  MessageSquare,
  PhoneCall,
  AtSign,
  Video,
  Calendar,
  FileText,
  MessageCircle,
  Loader2,
  Clock,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { salesClientsAPI, salesFollowUpsAPI, salesExecutivesAPI } from '../../services/salesService';
import type {
  SalesClient,
  SalesActivity,
  ActivityType,
  ClientStage,
  RejectionReason,
  SalesUser,
} from '../../types/sales.types';
import { getStageBadgeClass, format } from '../../utils/salesUtils';
import toast from 'react-hot-toast';

const STAGES: ClientStage[] = [
  'Available', 'Assigned', 'Contacted', 'Interested',
  'Follow-Up', 'Negotiation', 'Converted', 'Rejected',
];

const REJECTION_REASONS: Array<{ value: RejectionReason; label: string }> = [
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'budget_constraint', label: 'Budget Constraint' },
  { value: 'competitor_chosen', label: 'Chose Competitor' },
  { value: 'wrong_contact', label: 'Wrong Contact' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'no_response', label: 'No Response' },
  { value: 'other', label: 'Other' },
];

const ACTIVITY_TYPES: Array<{ value: ActivityType; label: string; icon: React.ReactNode }> = [
  { value: 'call', label: 'Call', icon: <PhoneCall className="w-3.5 h-3.5" /> },
  { value: 'email', label: 'Email', icon: <AtSign className="w-3.5 h-3.5" /> },
  { value: 'meeting', label: 'Meeting', icon: <Video className="w-3.5 h-3.5" /> },
  { value: 'demo', label: 'Demo', icon: <Video className="w-3.5 h-3.5" /> },
  { value: 'follow_up', label: 'Follow-Up', icon: <Calendar className="w-3.5 h-3.5" /> },
  { value: 'note', label: 'Note', icon: <FileText className="w-3.5 h-3.5" /> },
  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-3.5 h-3.5" /> },
  { value: 'sms', label: 'SMS', icon: <MessageSquare className="w-3.5 h-3.5" /> },
];

function activityIcon(type: ActivityType) {
  const found = ACTIVITY_TYPES.find((a) => a.value === type);
  return found?.icon ?? <MessageSquare className="w-3.5 h-3.5" />;
}

interface Props {
  client: SalesClient | null;
  onClose: () => void;
  onClientUpdated: (client: SalesClient) => void;
  isManager?: boolean;
  executives?: SalesUser[];
}

export default function SalesClientDetailDrawer({
  client,
  onClose,
  onClientUpdated,
  isManager = false,
  executives = [],
}: Props) {
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Stage update state
  const [newStage, setNewStage] = useState<ClientStage | ''>('');
  const [rejReason, setRejReason] = useState<RejectionReason | ''>('');
  const [rejNote, setRejNote] = useState('');
  const [stageSaving, setStageSaving] = useState(false);

  // Activity form
  const [actType, setActType] = useState<ActivityType>('call');
  const [actNote, setActNote] = useState('');
  const [actSaving, setActSaving] = useState(false);

  // Follow-up form
  const [fuDate, setFuDate] = useState('');
  const [fuNote, setFuNote] = useState('');
  const [fuSaving, setFuSaving] = useState(false);

  // Reassign (manager only)
  const [reassignTo, setReassignTo] = useState('');
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    if (!client) return;
    setNewStage(client.stage);
    setRejReason(client.rejectionReason ?? '');
    setRejNote(client.rejectionNote ?? '');
    setActivitiesLoading(true);
    salesClientsAPI
      .activities(client.id)
      .then((r) => setActivities(r.data))
      .catch(() => null)
      .finally(() => setActivitiesLoading(false));
  }, [client?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStageUpdate(e: FormEvent) {
    e.preventDefault();
    if (!client || !newStage) return;
    setStageSaving(true);
    try {
      const res = await salesClientsAPI.updateStage(client.id, {
        stage: newStage,
        rejectionReason: newStage === 'Rejected' ? (rejReason as RejectionReason) : undefined,
        rejectionNote: newStage === 'Rejected' ? rejNote : undefined,
      });
      onClientUpdated(res.data);
      toast.success('Stage updated');
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Update failed');
    } finally {
      setStageSaving(false);
    }
  }

  async function handleAddActivity(e: FormEvent) {
    e.preventDefault();
    if (!client) return;
    setActSaving(true);
    try {
      const res = await salesClientsAPI.addActivity(client.id, { type: actType, note: actNote });
      setActivities((prev) => [res.data, ...prev]);
      setActNote('');
      toast.success('Activity added');
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Failed to add activity');
    } finally {
      setActSaving(false);
    }
  }

  async function handleScheduleFollowUp(e: FormEvent) {
    e.preventDefault();
    if (!client || !fuDate) return;
    setFuSaving(true);
    try {
      await salesFollowUpsAPI.create({ clientId: client.id, scheduledAt: fuDate, note: fuNote || undefined });
      setFuDate('');
      setFuNote('');
      toast.success('Follow-up scheduled');
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Failed to schedule');
    } finally {
      setFuSaving(false);
    }
  }

  async function handleReassign() {
    if (!client || !reassignTo) return;
    setReassigning(true);
    try {
      const res = await salesClientsAPI.reassign(client.id, reassignTo);
      onClientUpdated(res.data);
      setReassignTo('');
      toast.success('Client reassigned');
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Reassign failed');
    } finally {
      setReassigning(false);
    }
  }

  const inputCls =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all';
  const selectCls = `${inputCls} appearance-none pr-8`;

  return (
    <>
      {/* Overlay */}
      {client && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-gray-900 border-l border-white/10 z-50 flex flex-col transition-transform duration-300 ${
          client ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {client && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-white font-semibold text-base">{client.name}</h2>
                <span className={`mt-1 inline-block ${getStageBadgeClass(client.stage)}`}>
                  {client.stage}
                </span>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Contact info */}
              <section className="space-y-2">
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Contact Info</h3>
                <div className="bg-white/5 rounded-xl p-4 space-y-2.5">
                  {[
                    { icon: <Phone className="w-4 h-4" />, value: client.phone },
                    { icon: <Mail className="w-4 h-4" />, value: client.email },
                    client.company ? { icon: <Building2 className="w-4 h-4" />, value: client.company } : null,
                    (client.city || client.state) ? { icon: <MapPin className="w-4 h-4" />, value: [client.city, client.state].filter(Boolean).join(', ') } : null,
                  ].filter(Boolean).map((item, i) => item && (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="text-gray-500">{item.icon}</span>
                      <span className="text-gray-300 text-sm">{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/10 flex gap-4">
                    <div>
                      <p className="text-gray-500 text-xs">Added</p>
                      <p className="text-gray-300 text-xs mt-0.5">{format.date(client.createdAt)}</p>
                    </div>
                    {client.assignedTo && (
                      <div>
                        <p className="text-gray-500 text-xs">Assigned to</p>
                        <p className="text-gray-300 text-xs mt-0.5">{client.assignedTo.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Stage update */}
              <section>
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Update Stage</h3>
                <form onSubmit={handleStageUpdate} className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="relative">
                    <select
                      value={newStage}
                      onChange={(e) => setNewStage(e.target.value as ClientStage)}
                      className={selectCls}
                    >
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>

                  {newStage === 'Rejected' && (
                    <>
                      <div className="relative">
                        <select
                          value={rejReason}
                          onChange={(e) => setRejReason(e.target.value as RejectionReason)}
                          required
                          className={selectCls}
                        >
                          <option value="">Select reason…</option>
                          {REJECTION_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                      </div>
                      <textarea
                        value={rejNote}
                        onChange={(e) => setRejNote(e.target.value)}
                        placeholder="Rejection note (optional)"
                        rows={2}
                        className={`${inputCls} resize-none`}
                      />
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={stageSaving || newStage === client.stage}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-all"
                  >
                    {stageSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Stage
                  </button>
                </form>
              </section>

              {/* Reassign (manager only) */}
              {isManager && executives.length > 0 && (
                <section>
                  <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Reassign Client</h3>
                  <div className="bg-white/5 rounded-xl p-4 flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={reassignTo}
                        onChange={(e) => setReassignTo(e.target.value)}
                        className={selectCls}
                      >
                        <option value="">Select executive…</option>
                        {executives.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                    <button
                      onClick={handleReassign}
                      disabled={!reassignTo || reassigning}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all"
                    >
                      {reassigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      Reassign
                    </button>
                  </div>
                </section>
              )}

              {/* Add Activity */}
              <section>
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Log Activity</h3>
                <form onSubmit={handleAddActivity} className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {ACTIVITY_TYPES.map((at) => (
                      <button
                        key={at.value}
                        type="button"
                        onClick={() => setActType(at.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          actType === at.value
                            ? 'bg-violet-600 text-white'
                            : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {at.icon}
                        {at.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    required
                    value={actNote}
                    onChange={(e) => setActNote(e.target.value)}
                    placeholder="Activity notes…"
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                  <button
                    type="submit"
                    disabled={actSaving}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-all"
                  >
                    {actSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Log Activity
                  </button>
                </form>
              </section>

              {/* Schedule Follow-Up */}
              <section>
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Schedule Follow-Up</h3>
                <form onSubmit={handleScheduleFollowUp} className="bg-white/5 rounded-xl p-4 space-y-3">
                  <input
                    type="datetime-local"
                    required
                    value={fuDate}
                    onChange={(e) => setFuDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className={inputCls}
                  />
                  <input
                    value={fuNote}
                    onChange={(e) => setFuNote(e.target.value)}
                    placeholder="Note (optional)"
                    className={inputCls}
                  />
                  <button
                    type="submit"
                    disabled={fuSaving}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-all"
                  >
                    {fuSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </button>
                </form>
              </section>

              {/* Activity Timeline */}
              <section>
                <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Activity Timeline</h3>
                {activitiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 text-sm">No activities yet</div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((act, idx) => (
                      <div key={act.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                            {activityIcon(act.type)}
                          </div>
                          {idx < activities.length - 1 && (
                            <div className="w-px flex-1 bg-white/5 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded text-xs font-medium">
                              {act.type}
                            </span>
                            <span className="text-gray-500 text-xs">{act.executiveName}</span>
                            <span className="text-gray-600 text-xs ml-auto">
                              <Clock className="w-3 h-3 inline mr-0.5" />
                              {format.dateTime(act.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mt-1">{act.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}
