import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ClientLayout from '../../components/layouts/ClientLayout';
import useAuth from '../../hooks/useAuth';
import { reportHelpAPI } from '../../api/endpoints';
import {
  REPORT_TYPE_OPTIONS,
  URGENCY_OPTIONS,
  ACCEPTED_FILE_HINT,
} from '../../utils/reportHelpConstants';
import {
  ReportHelpBackLink,
  ReportHelpCard,
  ReportHelpInput,
  ReportHelpLabel,
  ReportHelpPageHero,
  ReportHelpPageShell,
  ReportHelpPrimaryButton,
  ReportHelpSecondaryButton,
  ReportHelpSection,
  ReportHelpSelect,
  ReportHelpTextarea,
} from '../../components/reportHelp/ReportHelpUi';

const MAX_FILES_DEFAULT = 10;
const MAX_SIZE_MB_DEFAULT = 10;

export default function ReportHelpNewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [limits, setLimits] = useState({ maxFiles: MAX_FILES_DEFAULT, maxFileSizeMb: MAX_SIZE_MB_DEFAULT });
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState({
    contact_name: '',
    contact_phone: '',
    report_type: 'cma',
    business_name: '',
    loan_amount: '',
    industry: '',
    urgency_level: 'normal',
    notes: '',
  });

  useEffect(() => {
    reportHelpAPI.getOptions().then((res) => {
      if (res?.data) setLimits(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm((p) => ({
      ...p,
      contact_name: p.contact_name || user.name || '',
      contact_phone: p.contact_phone || user.phone || '',
    }));
  }, [user]);

  const onField = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const addFiles = useCallback((picked) => {
    if (!picked.length) return;
    const max = limits.maxFiles || MAX_FILES_DEFAULT;
    const maxBytes = (limits.maxFileSizeMb || MAX_SIZE_MB_DEFAULT) * 1024 * 1024;

    setFiles((prev) => {
      if (prev.length >= max) {
        toast.error(`Maximum ${max} files allowed`);
        return prev;
      }
      const combined = [...prev, ...picked].slice(0, max);
      const oversized = combined.find((f) => f.size > maxBytes);
      if (oversized) {
        toast.error(`Each file must be under ${limits.maxFileSizeMb || MAX_SIZE_MB_DEFAULT} MB`);
        return prev;
      }
      if (prev.length + picked.length > max) {
        toast.error(`Maximum ${max} files allowed`);
      }
      return combined;
    });
  }, [limits.maxFiles, limits.maxFileSizeMb]);

  const onFilesChange = (e) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (files.length < (limits.maxFiles || MAX_FILES_DEFAULT)) {
      setDragActive(true);
    }
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragActive(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (files.length >= (limits.maxFiles || MAX_FILES_DEFAULT)) return;
    addFiles(Array.from(e.dataTransfer.files || []));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_name.trim()) {
      toast.error('Please enter your contact name');
      return;
    }
    if (!form.contact_phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!form.business_name.trim() || !form.loan_amount.trim() || !form.industry.trim()) {
      toast.error('Please fill in business name, loan amount, and industry');
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach((f) => fd.append('files', f));

    setSubmitting(true);
    try {
      const res = await reportHelpAPI.create(fd);
      const id = res?.data?._id || res?.data?.id;
      toast.success('Request sent to your channel partner');
      navigate(id ? `/report-help/${id}` : '/report-help');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ClientLayout shellStyle={{ backgroundColor: '#F8F8FF' }}>
      <ReportHelpPageShell>
        <ReportHelpBackLink to="/dashboard">Back to dashboard</ReportHelpBackLink>

        <ReportHelpPageHero
          compact
          title="New partner request"
          subtitle="Share details and supporting documents. Your channel partner will review and guide next steps."
        />

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <ReportHelpCard className="space-y-10">
            <ReportHelpSection
              step={1}
              title="Contact information"
              description="How your channel partner can reach you about this request."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <ReportHelpLabel htmlFor="contact_name" required>Name</ReportHelpLabel>
                  <ReportHelpInput
                    id="contact_name"
                    name="contact_name"
                    value={form.contact_name}
                    onChange={onField}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div>
                  <ReportHelpLabel htmlFor="contact_phone" required>Phone number</ReportHelpLabel>
                  <ReportHelpInput
                    id="contact_phone"
                    name="contact_phone"
                    type="tel"
                    value={form.contact_phone}
                    onChange={onField}
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
              </div>
            </ReportHelpSection>

            <ReportHelpSection
              step={2}
              title="Request details"
              description="Tell your partner what report you need and the business context."
            >
              <div className="space-y-4">
                <div>
                  <ReportHelpLabel htmlFor="report_type" required>Report type</ReportHelpLabel>
                  <ReportHelpSelect
                    id="report_type"
                    name="report_type"
                    value={form.report_type}
                    onChange={onField}
                    required
                  >
                    {REPORT_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </ReportHelpSelect>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <ReportHelpLabel htmlFor="business_name" required>Business name</ReportHelpLabel>
                    <ReportHelpInput
                      id="business_name"
                      name="business_name"
                      value={form.business_name}
                      onChange={onField}
                      placeholder="e.g. ABC Engineering Works"
                      required
                    />
                  </div>
                  <div>
                    <ReportHelpLabel htmlFor="loan_amount" required>Loan amount</ReportHelpLabel>
                    <ReportHelpInput
                      id="loan_amount"
                      name="loan_amount"
                      value={form.loan_amount}
                      onChange={onField}
                      placeholder="e.g. 25 lakhs"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <ReportHelpLabel htmlFor="industry" required>Industry</ReportHelpLabel>
                    <ReportHelpInput
                      id="industry"
                      name="industry"
                      value={form.industry}
                      onChange={onField}
                      placeholder="e.g. Manufacturing — machinery"
                      required
                    />
                  </div>
                  <div>
                    <ReportHelpLabel htmlFor="urgency_level">Urgency</ReportHelpLabel>
                    <ReportHelpSelect
                      id="urgency_level"
                      name="urgency_level"
                      value={form.urgency_level}
                      onChange={onField}
                    >
                      {URGENCY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </ReportHelpSelect>
                  </div>
                </div>

                <div>
                  <ReportHelpLabel htmlFor="notes">Notes / instructions</ReportHelpLabel>
                  <ReportHelpTextarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={onField}
                    rows={5}
                    placeholder={`Example:\nNeed CMA report for machinery loan.\nLoan amount: 25 lakhs.\nNeed within 3 days.`}
                  />
                </div>
              </div>
            </ReportHelpSection>

            <ReportHelpSection
              step={3}
              title="Supporting documents"
              description={`${ACCEPTED_FILE_HINT} Up to ${limits.maxFiles} files, ${limits.maxFileSizeMb} MB each.`}
            >
              <label
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all group ${
                  dragActive
                    ? 'border-[#7e22ce] bg-purple-100/60 scale-[1.01]'
                    : 'border-gray-200 bg-gray-50/50 hover:border-[#7e22ce] hover:bg-purple-50/40'
                } ${files.length >= (limits.maxFiles || MAX_FILES_DEFAULT) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-3 transition-transform ${
                  dragActive ? 'bg-[#7e22ce] text-white scale-110' : 'bg-purple-100 text-[#7e22ce] group-hover:scale-105'
                }`}>
                  <CloudArrowUpIcon className="w-7 h-7" aria-hidden />
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {dragActive ? 'Release to upload' : 'Drag & drop files here or click to browse'}
                </span>
                <span className="text-xs text-gray-500 mt-1">PDF, images, Excel, CSV</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv,image/*,application/pdf"
                  className="hidden"
                  onChange={onFilesChange}
                  disabled={files.length >= (limits.maxFiles || MAX_FILES_DEFAULT)}
                />
              </label>

              {files.length > 0 && (
                <ul className="space-y-2 mt-4">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between gap-3 text-sm bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <DocumentIcon className="w-5 h-5 text-gray-400 shrink-0" aria-hidden />
                        <span className="truncate font-medium text-gray-800">
                          {f.name}
                          <span className="text-gray-400 font-normal ml-1">
                            ({(f.size / 1024).toFixed(0)} KB)
                          </span>
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="shrink-0 text-red-600 hover:text-red-800 text-xs font-semibold inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        <XMarkIcon className="w-4 h-4" aria-hidden />
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ReportHelpSection>
          </ReportHelpCard>

          <div className="flex flex-wrap gap-3">
            <ReportHelpPrimaryButton type="submit" disabled={submitting} className="min-w-[160px]">
              {submitting ? 'Submitting…' : 'Submit request'}
            </ReportHelpPrimaryButton>
            <Link to="/dashboard">
              <ReportHelpSecondaryButton type="button">Cancel</ReportHelpSecondaryButton>
            </Link>
          </div>
        </form>
      </ReportHelpPageShell>
    </ClientLayout>
  );
}
