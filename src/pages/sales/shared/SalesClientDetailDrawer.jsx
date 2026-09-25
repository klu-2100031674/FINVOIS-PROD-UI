import { useState, useEffect } from 'react';
import {
  X, Phone, Mail, MapPin, Building2, Briefcase, Tag, MessageSquare,
  ChevronDown, Loader2, Clock, PhoneCall, AtSign, Calendar as CalendarIcon, Users, FileText,
} from 'lucide-react';
import {
  getClientDetail,
  getClientActivities,
  addActivity,
  updateClientStage,
  scheduleFollowUp,
  STAGE_COLORS,
  PRIORITY_COLORS,
} from '../../../services/salesService';
import toast from 'react-hot-toast';

const STAGES = ['Assigned', 'Contacted', 'Interested', 'Follow-Up', 'Negotiation', 'Converted', 'Rejected'];
const ACTIVITY_TYPES = ['call', 'message', 'email', 'meeting', 'follow-up', 'note'];
const REJECTION_REASONS = ['Not Interested', 'Wrong Number', 'Budget Issue', 'No Response', 'Competitor Selected'];

const ACTIVITY_ICONS = {
  call: PhoneCall,
  message: MessageSquare,
  email: AtSign,
  meeting: Users,
  'follow-up': CalendarIcon,
  note: FileText,
};

const InfoRow = ({ icon: Icon, label, value }) =>
  value ? (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  ) : null;

const Badge = ({ label, colorMap }) => {
  const cls = colorMap[label] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
};

const SalesClientDetailDrawer = ({ client: initialClient, isManager, executives, onClose, onReassign, onUpdate }) => {
  const [client, setClient] = useState(initialClient);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Stage update
  const [newStage, setNewStage] = useState('');
  const [rejReason, setRejReason] = useState('');
  const [updatingStage, setUpdatingStage] = useState(false);

  // Add activity
  const [actType, setActType] = useState('call');
  const [actNote, setActNote] = useState('');
  const [actStage, setActStage] = useState('');
  const [addingAct, setAddingAct] = useState(false);

  // Schedule follow-up
  const [fuDate, setFuDate] = useState('');
  const [fuPurpose, setFuPurpose] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const reloadDetail = () => {
    getClientDetail(client._id)
      .then((res) => setClient(res.data.client || res.data))
      .catch(() => {});
  };

  const reloadActivities = () => {
    setLoadingActivities(true);
    getClientActivities(client._id)
      .then((res) => setActivities(res.data.activities || res.data || []))
      .catch(() => {})
      .finally(() => setLoadingActivities(false));
  };

  useEffect(() => { reloadActivities(); }, [client._id]);

  const handleStageUpdate = async () => {
    if (!newStage) return;
    setUpdatingStage(true);
    try {
      await updateClientStage(client._id, newStage, newStage === 'Rejected' ? rejReason : undefined);
      toast.success('Stage updated');
      setNewStage('');
      setRejReason('');
      reloadDetail();
      onUpdate?.();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Update failed');
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!actNote.trim()) return;
    setAddingAct(true);
    try {
      await addActivity(client._id, { activityType: actType, note: actNote, stage: actStage || undefined });
      toast.success('Activity logged');
      setActNote('');
      setActStage('');
      reloadActivities();
      if (actStage) { reloadDetail(); onUpdate?.(); }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to add activity');
    } finally {
      setAddingAct(false);
    }
  };

  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    if (!fuDate || !fuPurpose.trim()) return;
    setScheduling(true);
    try {
      await scheduleFollowUp(client._id, { followUpDate: fuDate, purpose: fuPurpose });
      toast.success('Follow-up scheduled');
      setFuDate('');
      setFuPurpose('');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to schedule');
    } finally {
      setScheduling(false);
    }
  };

  const inputCls = 'w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition';
  const selectCls = inputCls;
  const sectionTitle = 'text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white border-l border-gray-200 w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 truncate">{client.customerName}</h2>
              <Badge label={client.stage} colorMap={STAGE_COLORS} />
              <Badge label={client.priority} colorMap={PRIORITY_COLORS} />
            </div>
            {client.companyName && <p className="text-xs text-gray-400 mt-0.5">{client.companyName}</p>}
          </div>
          <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-700 transition flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-6">
            {/* Customer Info */}
            <section>
              <p className={sectionTitle}>Customer Info</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <InfoRow icon={Phone} label="Phone" value={client.phoneNumber} />
                <InfoRow icon={Phone} label="Alternate" value={client.alternateNumber} />
                <InfoRow icon={Mail} label="Email" value={client.email} />
                <InfoRow icon={MapPin} label="Location" value={[client.city, client.state, client.country].filter(Boolean).join(', ')} />
                <InfoRow icon={Building2} label="Company" value={client.companyName} />
                <InfoRow icon={Briefcase} label="Requirement" value={client.requirement} />
                <InfoRow icon={Tag} label="Source" value={client.source} />
                <InfoRow icon={MessageSquare} label="Remarks" value={client.remarks} />
              </div>
            </section>

            {/* Manager: reassign button */}
            {isManager && onReassign && (
              <section>
                <p className={sectionTitle}>Management</p>
                <button
                  onClick={onReassign}
                  className="w-full py-2.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-sm font-medium transition"
                >
                  Reassign to Another Executive
                </button>
              </section>
            )}

            {/* Executive: stage update */}
            {!isManager && (
              <section>
                <p className={sectionTitle}>Update Stage</p>
                <div className="space-y-3">
                  <select className={selectCls} value={newStage} onChange={(e) => { setNewStage(e.target.value); setRejReason(''); }}>
                    <option value="">Select new stage...</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {newStage === 'Rejected' && (
                    <select className={selectCls} value={rejReason} onChange={(e) => setRejReason(e.target.value)} required>
                      <option value="">Select rejection reason...</option>
                      {REJECTION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  )}
                  <button
                    onClick={handleStageUpdate}
                    disabled={!newStage || updatingStage || (newStage === 'Rejected' && !rejReason)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white text-sm font-medium flex items-center justify-center gap-2 transition"
                  >
                    {updatingStage ? <Loader2 size={14} className="animate-spin" /> : null}
                    Update Stage
                  </button>
                </div>
              </section>
            )}

            {/* Executive: add activity */}
            {!isManager && (
              <section>
                <p className={sectionTitle}>Add Activity</p>
                <form onSubmit={handleAddActivity} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select className={selectCls} value={actType} onChange={(e) => setActType(e.target.value)}>
                      {ACTIVITY_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                    <select className={selectCls} value={actStage} onChange={(e) => setActStage(e.target.value)}>
                      <option value="">No stage change</option>
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    value={actNote}
                    onChange={(e) => setActNote(e.target.value)}
                    placeholder="What happened? Add a note..."
                    required
                  />
                  <button
                    type="submit"
                    disabled={addingAct || !actNote.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 text-white text-sm font-medium flex items-center justify-center gap-2 transition"
                  >
                    {addingAct ? <Loader2 size={14} className="animate-spin" /> : null}
                    Add Activity
                  </button>
                </form>
              </section>
            )}

            {/* Executive: schedule follow-up */}
            {!isManager && (
              <section>
                <p className={sectionTitle}>Schedule Follow-Up</p>
                <form onSubmit={handleScheduleFollowUp} className="space-y-3">
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={fuDate}
                    onChange={(e) => setFuDate(e.target.value)}
                    required
                  />
                  <input
                    className={inputCls}
                    value={fuPurpose}
                    onChange={(e) => setFuPurpose(e.target.value)}
                    placeholder="Purpose of follow-up..."
                    required
                  />
                  <button
                    type="submit"
                    disabled={scheduling}
                    className="w-full py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 text-sm font-medium flex items-center justify-center gap-2 transition"
                  >
                    {scheduling ? <Loader2 size={14} className="animate-spin" /> : <CalendarIcon size={14} />}
                    Schedule Follow-Up
                  </button>
                </form>
              </section>
            )}

            {/* Activity Timeline */}
            <section>
              <p className={sectionTitle}>Activity Timeline</p>
              {loadingActivities ? (
                <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-purple-600" /></div>
              ) : activities.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-sm">No activities yet</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => {
                    const Icon = ACTIVITY_ICONS[a.activityType] || FileText;
                    return (
                      <div key={a._id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon size={13} className="text-purple-700" />
                        </div>
                        <div className="flex-1 min-w-0 pb-3 border-b border-gray-100 last:border-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-gray-800 capitalize font-medium">{a.activityType}</p>
                            <span className="text-[11px] text-gray-400 flex-shrink-0">
                              <Clock size={10} className="inline mr-1" />
                              {new Date(a.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5">{a.note}</p>
                          {a.stage && (
                            <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${STAGE_COLORS[a.stage] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              → {a.stage}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesClientDetailDrawer;
