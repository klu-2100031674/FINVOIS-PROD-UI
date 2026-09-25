import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle, Phone, Clock, MessageSquare, X } from 'lucide-react';
import { getMyFollowUps, completeFollowUp, addActivity } from '../../../services/salesService';
import toast from 'react-hot-toast';

const NoteModal = ({ followUp, onClose, onSaved }) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      const clientId = followUp.clientId?._id || followUp.clientId;
      await addActivity(clientId, { activityType: 'follow-up', note });
      toast.success('Note added');
      onSaved();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} />
      <div className="relative bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Add Note</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{followUp.clientId?.customerName || 'Client'}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition"
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened in this follow-up?"
            required
            autoFocus
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition">Cancel</button>
            <button type="submit" disabled={saving || !note.trim()} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FollowUpCard = ({ followUp, section, onComplete, onNote }) => (
  <div className={`bg-white border rounded-xl p-4 shadow-sm ${
    section === 'overdue' ? 'border-red-500/30' :
    section === 'today' ? 'border-orange-500/30' :
    'border-gray-200'
  }`}>
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{followUp.clientId?.customerName || 'Client'}</p>
        {followUp.clientId?.phoneNumber && (
          <p className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1">
            <Phone size={10} />
            {followUp.clientId.phoneNumber}
          </p>
        )}
      </div>
      <div className={`text-xs font-medium ml-3 flex-shrink-0 flex items-center gap-1 ${
        section === 'overdue' ? 'text-red-400' :
        section === 'today' ? 'text-orange-400' :
        'text-green-400'
      }`}>
        <Clock size={11} />
        {section === 'overdue' ? 'Overdue' : section === 'today' ? 'Today' : 'Upcoming'}
      </div>
    </div>
    <p className="text-sm text-gray-600 mb-2">{followUp.purpose}</p>
    <p className="text-xs text-gray-400 mb-3">{new Date(followUp.followUpDate).toLocaleString()}</p>
    <div className="flex gap-2">
      <button
        onClick={() => onComplete(followUp)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200 transition"
      >
        <CheckCircle size={12} />
        Mark Done
      </button>
      <button
        onClick={() => onNote(followUp)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-xs border border-gray-100 transition"
      >
        <MessageSquare size={12} />
        Add Note
      </button>
    </div>
  </div>
);

const SalesFollowUpsPage = () => {
  const [followUps, setFollowUps] = useState({ overdue: [], today: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteTarget, setNoteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    getMyFollowUps({ status: 'pending' })
      .then((res) => {
        const items = res.data.followUps || res.data || [];
        const now = new Date();
        const todayStr = now.toDateString();
        const categorized = { overdue: [], today: [], upcoming: [] };
        items.forEach((f) => {
          const d = new Date(f.followUpDate);
          if (d.toDateString() === todayStr) {
            categorized.today.push(f);
          } else if (d < now) {
            categorized.overdue.push(f);
          } else {
            categorized.upcoming.push(f);
          }
        });
        setFollowUps(categorized);
      })
      .catch((err) => setError(typeof err === 'string' ? err : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleComplete = async (followUp) => {
    try {
      await completeFollowUp(followUp._id);
      toast.success('Follow-up marked as done');
      load();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to complete');
    }
  };

  const Section = ({ title, items, colorClass, section }) => (
    <div>
      <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${colorClass}`}>
        <span className="w-2 h-2 rounded-full bg-current" />
        {title} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm py-4 text-center">None</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((f) => (
            <FollowUpCard
              key={f._id}
              followUp={f}
              section={section}
              onComplete={handleComplete}
              onNote={setNoteTarget}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-purple-600" size={28} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Follow-Ups</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your pending follow-up schedule</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle size={15} />{error}
        </div>
      )}

      <Section title="Overdue" items={followUps.overdue} colorClass="text-red-400" section="overdue" />
      <Section title="Today" items={followUps.today} colorClass="text-orange-400" section="today" />
      <Section title="Upcoming" items={followUps.upcoming} colorClass="text-green-400" section="upcoming" />

      {noteTarget && (
        <NoteModal
          followUp={noteTarget}
          onClose={() => setNoteTarget(null)}
          onSaved={() => { setNoteTarget(null); load(); }}
        />
      )}
    </div>
  );
};

export default SalesFollowUpsPage;
