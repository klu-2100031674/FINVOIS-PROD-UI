import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layouts';
import { companyAPI } from '../../api/endpoints';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Mail,
  Phone,
  User as UserIcon,
  Upload,
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  X,
  ImagePlus
} from 'lucide-react';

const initialFormState = {
  companyName: '',
  companyAddress: '',
  contactPersonName: '',
  contactEmail: '',
  contactPhone: ''
};

const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp';
const MAX_LOGO_FILE_SIZE_BYTES = 1024 * 1024;

/** Dedicated page for /admin/company/create — Logo 1 + Logo 2 are optional. */
const LogoDropzone = ({
  title,
  description,
  badgeColor = 'purple',
  file,
  preview,
  onFile,
  onRemove,
  inputId
}) => {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      const dropped = event.dataTransfer?.files?.[0];
      if (dropped) onFile(dropped);
    },
    [onFile]
  );

  const handleDrag = useCallback((event, active) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(active);
  }, []);

  const accentRing = badgeColor === 'purple' ? 'ring-purple-500' : 'ring-[#7e22ce]';
  const accentBg = badgeColor === 'purple' ? 'bg-purple-50 text-purple-700' : 'bg-purple-50 text-purple-700';
  const accentBorder = badgeColor === 'purple' ? 'border-purple-300' : 'border-purple-300';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex h-6 px-2 items-center justify-center rounded-md text-[11px] font-bold ${accentBg}`}
            >
              {title}
            </span>
            <span className="text-gray-500 text-xs font-medium">Optional</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        {file && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1"
          >
            <X size={12} /> Remove
          </button>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={(event) => handleDrag(event, true)}
        onDragOver={(event) => handleDrag(event, true)}
        onDragLeave={(event) => handleDrag(event, false)}
        onDrop={handleDrop}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center text-center p-5 min-h-[200px] outline-none focus:ring-2 ${accentRing} ${
          dragActive
            ? `${accentBorder} bg-purple-50/60`
            : preview
            ? 'border-gray-200 bg-white hover:border-gray-300'
            : 'border-gray-300 bg-gray-50/70 hover:bg-gray-50 hover:border-gray-400'
        }`}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={`${title} preview`}
              className="max-h-36 w-auto object-contain rounded-md"
            />
            <p className="mt-3 text-xs text-gray-500 inline-flex items-center gap-1">
              <ImagePlus size={12} /> Click or drop to replace
            </p>
            {file?.name && (
              <p className="mt-1 text-[11px] text-gray-400 truncate max-w-full">
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </p>
            )}
          </>
        ) : (
          <>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${accentBg}`}>
              <UploadCloud size={24} />
            </div>
            <p className="mt-3 text-sm font-semibold text-gray-800">Add {title} (optional)</p>
            <p className="text-xs text-gray-500 mt-1">Click or drag — skip if you prefer to add logos later</p>
            <p className="text-[11px] text-gray-400 mt-2">PNG, JPG or WEBP</p>
          </>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={(event) => {
            const picked = event.target.files?.[0];
            if (picked) onFile(picked);
            event.target.value = '';
          }}
          className="hidden"
        />
      </div>
    </div>
  );
};

const AdminCompanyCreatePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [apLogoFile, setApLogoFile] = useState(null);
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [apLogoPreview, setApLogoPreview] = useState('');
  const [companyLogoPreview, setCompanyLogoPreview] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateLogoSize = (file, label) => {
    if (!file) return false;
    if (file.size > MAX_LOGO_FILE_SIZE_BYTES) {
      toast.error(`${label} must be less than 1MB`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error('Company name is required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const hasLogoFiles = Boolean(apLogoFile || companyLogoFile);
      if (hasLogoFiles) {
        const payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') payload.append(key, value);
        });
        if (apLogoFile) payload.append('apLogoUrl', apLogoFile);
        if (companyLogoFile) payload.append('companyLogoUrl', companyLogoFile);
        await companyAPI.createCompany(payload);
      } else {
        await companyAPI.createCompany({
          companyName: formData.companyName.trim(),
          companyAddress: formData.companyAddress || undefined,
          contactPersonName: formData.contactPersonName || undefined,
          contactEmail: formData.contactEmail || undefined,
          contactPhone: formData.contactPhone || undefined
        });
      }
      navigate('/admin/companies', {
        state: { successMessage: 'Company created successfully.' }
      });
    } catch (error) {
      toast.error(error || 'Failed to create company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(formData.companyName.trim());

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/companies')}
            className="mt-1 inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            title="Back to companies"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Company</h1>
            <p className="text-sm text-gray-500 mt-1">
              Add a new company record. Only the company name is required.{' '}
              <span className="font-semibold text-gray-800">Logo 1</span> and{' '}
              <span className="font-semibold text-gray-800">Logo 2</span> are optional and can be added later on the
              company page.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Company details</h2>

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-600">*</span>
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                required
                autoComplete="organization"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
              />
            </div>

            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Company Address
              </label>
              <textarea
                id="companyAddress"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
              />
            </div>

            <div>
              <label htmlFor="contactPersonName" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person Name
              </label>
              <div className="relative">
                <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="contactPersonName"
                  name="contactPersonName"
                  type="text"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  autoComplete="name"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    autoComplete="email"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="text"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    autoComplete="tel"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7e22ce] focus:border-[#7e22ce]"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-gray-100 pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ImageIcon size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Company logos (optional)</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Not required to create the company. PNG, JPG, or WEBP (max 1MB each).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LogoDropzone
                title="Logo 1"
                description="Primary / authority emblem (apLogo)"
                badgeColor="purple"
                file={apLogoFile}
                preview={apLogoPreview}
                inputId="createApLogoUrl"
                onFile={(picked) => {
                  if (!validateLogoSize(picked, 'Logo 1')) return;
                  setApLogoFile(picked);
                  setApLogoPreview(URL.createObjectURL(picked));
                }}
                onRemove={() => {
                  setApLogoFile(null);
                  setApLogoPreview('');
                }}
              />
              <LogoDropzone
                title="Logo 2"
                description="Company branding (companyLogo)"
                badgeColor="blue"
                file={companyLogoFile}
                preview={companyLogoPreview}
                inputId="createCompanyLogoUrl"
                onFile={(picked) => {
                  if (!validateLogoSize(picked, 'Logo 2')) return;
                  setCompanyLogoFile(picked);
                  setCompanyLogoPreview(URL.createObjectURL(picked));
                }}
                onRemove={() => {
                  setCompanyLogoFile(null);
                  setCompanyLogoPreview('');
                }}
              />
            </div>
          </section>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {canSubmit ? (
                <span className="text-green-700 inline-flex items-center gap-1 font-medium">
                  <CheckCircle2 size={14} /> Ready to submit.
                </span>
              ) : (
                'Company name is required.'
              )}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => navigate('/admin/companies')}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-[#7e22ce] text-white hover:bg-[#6b21a8] disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Upload size={16} /> Create Company
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdminCompanyCreatePage;
