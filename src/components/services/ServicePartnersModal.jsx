import { useEffect, useState } from 'react';
import { X, Mail, Phone, User, Send, ArrowLeft, Users } from 'lucide-react';
import apiClient from '@/api/apiClient';

/**
 * "View partners" popup for a FIN Connect service: lists every active partner
 * linked to the service (GET /services/:id/partners) with full name, email and
 * mobile. "Request" on a partner opens a short enquiry form that is sent to
 * that partner only (submit-form with `partnerId`).
 */
const EMPTY_REQUEST = { name: '', email: '', phone: '', requirement: '' };

const ServicePartnersModal = ({ serviceId, serviceName, onClose }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [requestFor, setRequestFor] = useState(null); // partner being requested
  const [request, setRequest] = useState(EMPTY_REQUEST);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sentTo, setSentTo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    apiClient
      .get(`/services/${serviceId}/partners`)
      .then(({ data }) => { if (!cancelled) setPartners(data?.partners || []); })
      .catch((err) => { if (!cancelled) setLoadError(err.response?.data?.error || 'Could not load partners.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [serviceId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const openRequest = (partner) => {
    setRequestFor(partner);
    setSendError(null);
    setSentTo(null);
  };

  const backToList = () => {
    setRequestFor(null);
    setSendError(null);
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (request.phone.length !== 10) {
      setSendError('Enter a valid 10-digit mobile number.');
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await apiClient.post(`/form-submissions/services/${serviceId}/submit-form`, {
        name: request.name.trim(),
        email: request.email.trim(),
        phone: request.phone,
        requirement: request.requirement.trim(),
        partnerId: requestFor.id,
      });
      setSentTo(requestFor.name);
      setRequestFor(null);
      setRequest(EMPTY_REQUEST);
    } catch (err) {
      setSendError(err.response?.data?.error || 'Could not send your request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const inputClass = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]';

  let body;
  if (loading) {
    body = (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7e22ce]" />
      </div>
    );
  } else if (loadError) {
    body = <p className="py-10 text-center text-sm text-red-600">{loadError}</p>;
  } else if (requestFor) {
    body = (
      <form onSubmit={submitRequest} className="space-y-4">
        <button type="button" onClick={backToList} className="text-sm text-[#7e22ce] hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> All business partners
        </button>
        <p className="text-sm text-gray-600">
          Send your requirement to <span className="font-semibold text-gray-900">{requestFor.name}</span>.
        </p>
        {sendError && <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">{sendError}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input required value={request.name} onChange={(e) => setRequest({ ...request, name: e.target.value })} placeholder="Your name" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input required type="email" value={request.email} onChange={(e) => setRequest({ ...request, email: e.target.value })} placeholder="your@email.com" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
          <input
            required
            type="tel"
            inputMode="numeric"
            value={request.phone}
            onChange={(e) => setRequest({ ...request, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            placeholder="10-digit mobile"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Requirement</label>
          <textarea value={request.requirement} onChange={(e) => setRequest({ ...request, requirement: e.target.value })} placeholder="What do you need?" className={`${inputClass} min-h-[90px]`} />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="w-full bg-[#7e22ce] text-white py-2 rounded-lg hover:bg-[#6b21a8] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Send className="h-4 w-4" />}
          {sending ? 'Sending...' : 'Send Request'}
        </button>
      </form>
    );
  } else if (partners.length === 0) {
    body = (
      <div className="py-12 text-center">
        <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No business partners are linked to this service yet.</p>
      </div>
    );
  } else {
    body = (
      <>
        {sentTo && (
          <div className="mb-4 p-3 rounded-md bg-green-50 text-green-700 text-sm">
            Your request was sent to {sentTo}. They will contact you soon.
          </div>
        )}
        <ul className="space-y-3">
          {partners.map((p) => (
            <li key={p.id} className="border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-[#7e22ce] shrink-0" />
                  <span className="truncate">{p.name}</span>
                </p>
                <a href={`mailto:${p.email}`} className="text-sm text-gray-600 hover:text-[#7e22ce] flex items-center gap-2 break-all">
                  <Mail className="h-4 w-4 shrink-0" />{p.email}
                </a>
                {p.phone ? (
                  <a href={`tel:${p.phone}`} className="text-sm text-gray-600 hover:text-[#7e22ce] flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />{p.phone}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400 flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" />Not provided</p>
                )}
              </div>
              <button
                onClick={() => openRequest(p)}
                className="shrink-0 px-4 py-2 bg-[#7e22ce] text-white text-sm font-medium rounded-lg hover:bg-[#6b21a8] flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" /> Request
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Partners for ${serviceName}`}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Business Partners</h2>
            <p className="text-sm text-gray-500 truncate">
              {serviceName}{!loading && !loadError ? ` · ${partners.length} available` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{body}</div>
      </div>
    </div>
  );
};

export default ServicePartnersModal;
