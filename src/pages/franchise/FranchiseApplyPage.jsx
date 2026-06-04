import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchFranchiseById,
  submitApplication,
  clearCurrentFranchise,
  resetSubmitState,
} from '@/store/slices/franchiseSlice';
import { FUNDING_SOURCES, initialApplicationFormState } from '@/constants/franchiseConstants';
import { getFranchiseApplicationTestData } from '@/constants/franchiseTestData';
import { FranchiseLogo } from '@/components/franchise/FranchiseCardParts';

const inputClass =
  'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

function draftKey(franchiseId) {
  return `franchise_apply_draft_${franchiseId}`;
}

const FranchiseApplyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentFranchise, loading, saving, submitSuccess, submitError } = useSelector(
    (state) => state.franchise,
  );

  const [formData, setFormData] = useState({ ...initialApplicationFormState });
  const [resume, setResume] = useState(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [hasDraftSaved, setHasDraftSaved] = useState(false);
  const draftRestoredRef = useRef(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    dispatch(resetSubmitState());
    dispatch(fetchFranchiseById({ id }));
    return () => {
      dispatch(clearCurrentFranchise());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (!currentFranchise || draftRestoredRef.current) return;
    draftRestoredRef.current = true;
    try {
      const raw = localStorage.getItem(draftKey(id));
      if (raw) {
        const parsed = JSON.parse(raw);
        setFormData((prev) => ({ ...prev, ...parsed }));
        setDraftRestored(true);
        setHasDraftSaved(true);
        toast.success('Draft restored');
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, [currentFranchise, id]);

  useEffect(() => {
    if (!currentFranchise || submitSuccess) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(id), JSON.stringify(formData));
        setHasDraftSaved(true);
      } catch {
        /* quota exceeded */
      }
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [formData, currentFranchise, id, submitSuccess]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey(id));
    setFormData({ ...initialApplicationFormState });
    setResume(null);
    setHasDraftSaved(false);
    setDraftRestored(false);
    toast.success('Draft discarded');
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Full name, email, and phone are required');
      return;
    }

    try {
      await dispatch(
        submitApplication({
          franchiseId: id,
          data: {
            ...formData,
            availableBudget: Number(formData.availableBudget) || 0,
          },
          resume,
        }),
      ).unwrap();
      localStorage.removeItem(draftKey(id));
      setHasDraftSaved(false);
      toast.success('Application submitted successfully');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const message = typeof err === 'object' ? err?.message : err;
      if (typeof err === 'object' && err?.status === 429) {
        toast.error(message || 'Too many applications. Please try again later.');
      } else if (typeof err === 'object' && err?.code === 'ALREADY_APPLIED') {
        /* inline banner handles this */
      } else {
        toast.error(message || 'Failed to submit application');
      }
    }
  };

  const handleReset = () => {
    clearDraft();
    dispatch(resetSubmitState());
  };

  const fillTestData = () => {
    setFormData(
      getFranchiseApplicationTestData({
        franchiseName: currentFranchise?.franchiseName,
      }),
    );
    toast.success('Test data filled');
  };

  const alreadyApplied =
    submitError &&
    typeof submitError === 'object' &&
    submitError.code === 'ALREADY_APPLIED';

  if (loading) {
    return (
      <div className="flex justify-center min-h-[400px] items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]" />
      </div>
    );
  }

  if (!currentFranchise) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold text-red-600 mb-2">Franchise Not Found</h2>
        <button type="button" onClick={() => navigate('/franchises')} className="text-[#7e22ce] underline">
          Back to Franchises
        </button>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-3xl text-green-600">
          ✓
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Thank You!</h2>
        <p className="text-gray-600 mb-6">
          Your application for <strong>{currentFranchise.franchiseName}</strong> has been received.
          Our team will review your profile and contact you shortly.
        </p>
        <div className="flex justify-center gap-4">
          <button type="button" onClick={() => navigate('/franchises')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Browse More Franchises
          </button>
          <button type="button" onClick={handleReset} className="px-4 py-2 text-[#7e22ce] border border-[#7e22ce] rounded-lg hover:bg-purple-50">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button type="button" onClick={() => navigate(`/franchises/${id}`)} className="mb-6 text-[#7e22ce] hover:underline">
        ← Back to Franchise Details
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 p-4 bg-purple-50 rounded-xl border border-purple-100">
        <div className="flex items-center gap-4">
          <FranchiseLogo franchise={currentFranchise} className="h-14 w-14" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Apply for Franchise</h1>
            <p className="text-gray-600">{currentFranchise.franchiseName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fillTestData}
          className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-amber-400 text-amber-800 bg-amber-50 rounded-lg hover:bg-amber-100 text-sm font-medium shrink-0"
        >
          <FlaskConical className="h-4 w-4" />
          Fill test data
        </button>
      </div>

      {hasDraftSaved && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 flex flex-wrap items-center justify-between gap-2">
          <span>
            Draft saved locally
            {draftRestored ? ' (restored)' : ''}
            {draftRestored && ' — Resume must be re-selected if you had one attached.'}
          </span>
          <button type="button" onClick={clearDraft} className="text-[#7e22ce] font-medium hover:underline">
            Discard draft
          </button>
        </div>
      )}

      {alreadyApplied && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
          <p className="font-medium mb-1">You have already applied for this franchise with this email.</p>
          <p>
            <Link to={`/franchises/${id}`} className="text-[#7e22ce] underline">
              View franchise details
            </Link>
            {' '}or use a different email address.
          </p>
        </div>
      )}

      {submitError && !alreadyApplied && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {typeof submitError === 'object' ? submitError.message : submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Full Name *</label>
              <input className={inputClass} name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input className={inputClass} type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div>
              <label className={labelClass}>Phone Number *</label>
              <input className={inputClass} name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input className={inputClass} name="location" value={formData.location} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input className={inputClass} name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input className={inputClass} name="state" value={formData.state} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Preferred Franchise Location</label>
              <input className={inputClass} name="preferredFranchiseLocation" value={formData.preferredFranchiseLocation} onChange={handleChange} />
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Investment Capability</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Available Investment Budget</label>
              <input className={inputClass} type="number" name="availableBudget" value={formData.availableBudget} onChange={handleChange} min={0} />
            </div>
            <div>
              <label className={labelClass}>Funding Source</label>
              <select className={inputClass} name="fundingSource" value={formData.fundingSource} onChange={handleChange}>
                {FUNDING_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Background</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Business Experience</label>
              <textarea className={inputClass} name="businessExperience" value={formData.businessExperience} onChange={handleChange} rows={3} />
            </div>
            <div>
              <label className={labelClass}>Current Occupation</label>
              <input className={inputClass} name="currentOccupation" value={formData.currentOccupation} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Why Interested?</label>
              <textarea className={inputClass} name="whyInterested" value={formData.whyInterested} onChange={handleChange} rows={3} />
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Business Readiness</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" name="hasSpaceAvailable" checked={formData.hasSpaceAvailable} onChange={handleChange} />
              <span className="text-sm">Have Space Available?</span>
            </label>
            <div className="md:col-span-2">
              <label className={labelClass}>Expected Start Timeline</label>
              <input className={inputClass} name="expectedStartTimeline" value={formData.expectedStartTimeline} onChange={handleChange} placeholder="e.g. Within 3 months" />
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Additional</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Resume Upload (optional)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Resume is not saved in your local draft.</p>
            </div>
            <div>
              <label className={labelClass}>Message / Questions</label>
              <textarea className={inputClass} name="message" value={formData.message} onChange={handleChange} rows={4} />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(`/franchises/${id}`)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || alreadyApplied}
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8] disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default FranchiseApplyPage;
