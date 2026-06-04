import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/layouts';
import { companyAPI } from '../../api/endpoints';
import { useAuth } from '../../hooks';
import toast from 'react-hot-toast';
import { normalizeUserRole } from '../../utils/normalizeUserRole';
import { formatRoleForDisplay } from '../../utils/roleDisplay';
import { isChannelPartner, isExecutive } from '../../utils/companyMembership';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  User as UserIcon,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Users,
  BarChart3,
  UserCog,
  RefreshCw,
  ExternalLink,
  Trash2
} from 'lucide-react';

const initialFormState = {
  companyName: '',
  companyAddress: '',
  contactPersonName: '',
  contactEmail: '',
  contactPhone: '',
  // When false, company reports skip the first-page white band + bottom cover logos only
  // (see API report_cover_logos). Merged top-corner stamps are unchanged.
  showTopLeftLogosInTermLoanCc: true
};

const coerceTopLeftLogoToggle = (value, fallback = true) => {
  if (value === undefined || value === null) return fallback;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  return fallback;
};

const getTopLeftLogoToggleStorageKey = (companyId) =>
  `company:${String(companyId || '')}:showTopLeftLogosInTermLoanCc`;

const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/webp';
const MAX_LOGO_FILE_SIZE_BYTES = 1024 * 1024;
const MAX_USERS_PER_ADD_OPERATION = 30;
const MAX_COMPANY_ADMINS = 5;

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
      {Icon && <Icon size={14} className="text-gray-400" />}
      {label}
    </div>
    <p className="mt-1.5 text-sm font-medium text-gray-900 break-words">{value || '—'}</p>
  </div>
);

const StatCard = ({ icon: Icon, label, value, tone = 'gray' }) => {
  const toneMap = {
    gray: 'text-gray-900 bg-gray-100 text-gray-600',
    blue: 'text-purple-700 bg-purple-50 text-[#7e22ce]',
    green: 'text-green-700 bg-green-50 text-green-600',
    yellow: 'text-yellow-700 bg-yellow-50 text-yellow-600',
    purple: 'text-purple-700 bg-purple-50 text-purple-600',
    indigo: 'text-indigo-700 bg-indigo-50 text-indigo-600'
  };
  const [textTone, bgTone, iconTone] = toneMap[tone].split(' ');
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg ${bgTone} flex items-center justify-center ${iconTone}`}>
        {Icon && <Icon size={18} />}
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${textTone}`}>{value ?? 0}</p>
      </div>
    </div>
  );
};

const LogoSlot = ({
  title,
  description,
  storedUrl,
  localPreview,
  onFileChange,
  onUpload,
  uploading,
  inputId,
  required = false,
  hasFile,
  badge,
  onDiscardLocal,
  onClearStored,
  clearingStored
}) => {
  const previewUrl = localPreview || storedUrl;
  const showDiscardLocal =
    typeof onDiscardLocal === 'function' && (Boolean(localPreview) || Boolean(hasFile));
  const showRemoveStored =
    typeof onClearStored === 'function' && Boolean(storedUrl);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon size={16} className="text-gray-500" />
            {title}
            {required && <span className="text-xs font-medium text-red-600">*</span>}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        {badge}
      </div>

      <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 min-h-[140px]">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={title}
            className="max-h-32 w-auto object-contain"
          />
        ) : (
          <div className="text-center text-xs text-gray-400">
            <ImageIcon size={28} className="mx-auto text-gray-300 mb-1" />
            No image yet
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor={inputId}
          className="flex-1 min-w-[120px] cursor-pointer text-center text-xs font-medium px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Upload size={14} />
          Choose file
        </label>
        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={onFileChange}
          className="hidden"
        />
        {onUpload && (
          <button
            type="button"
            onClick={onUpload}
            disabled={uploading || !hasFile || clearingStored}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading…' : 'Save'}
          </button>
        )}
        {showDiscardLocal && (
          <button
            type="button"
            onClick={onDiscardLocal}
            disabled={uploading || clearingStored}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Clear selection
          </button>
        )}
        {showRemoveStored && (
          <button
            type="button"
            onClick={onClearStored}
            disabled={uploading || clearingStored}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 inline-flex items-center gap-1"
          >
            {clearingStored ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Removing…
              </>
            ) : (
              <>
                <Trash2 size={12} /> Remove logo
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const AdminCreateCompanyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { companyId: urlCompanyId } = useParams();
  const normalizedRole = normalizeUserRole(user?.role);
  const isPlatformAdmin = normalizedRole === 'admin';
  const isCompanyAdmin = normalizedRole === 'company_admin';
  // Platform admin: /admin/companies/:companyId. Company admin: same path with their org id (sidebar).
  const resolvedUserCompanyId = companyAPI.normalizeCompanyId(
    user?.companyId?._id ||
      user?.companyId?.id ||
      user?.companyId?.$oid ||
      user?.company?._id ||
      user?.company?.id ||
      user?.company_id ||
      (typeof user?.companyId === 'string' || typeof user?.companyId === 'number' ? user.companyId : '')
  );
  const companyId =
    urlCompanyId ||
    (isCompanyAdmin && resolvedUserCompanyId ? resolvedUserCompanyId : undefined);
  const isDetailsPage = Boolean(companyId);
  /** Company admins may add/remove fellow company admins for their org (API-scoped to their company). */
  const canManageCompanyAdmins = isPlatformAdmin || isCompanyAdmin;

  const [formData, setFormData] = useState(initialFormState);

  const [companyDetails, setCompanyDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [apLogoFile, setApLogoFile] = useState(null);
  const [apLogoUploading, setApLogoUploading] = useState(false);
  const [apLogoLocalPreview, setApLogoLocalPreview] = useState('');

  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [companyLogoUploading, setCompanyLogoUploading] = useState(false);
  const [companyLogoLocalPreview, setCompanyLogoLocalPreview] = useState('');
  const [apLogoClearing, setApLogoClearing] = useState(false);
  const [companyLogoClearing, setCompanyLogoClearing] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [showAdminCandidatesDropdown, setShowAdminCandidatesDropdown] = useState(false);
  const [selectedNewAdminIds, setSelectedNewAdminIds] = useState([]);
  const [addingCompanyAdmins, setAddingCompanyAdmins] = useState(false);
  const [removingAdminId, setRemovingAdminId] = useState('');
  const adminCandidatesDropdownRef = useRef(null);
  const [updatingCompanyStatus, setUpdatingCompanyStatus] = useState(false);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [existingUserCandidates, setExistingUserCandidates] = useState([]);
  const [selectedExistingUserIds, setSelectedExistingUserIds] = useState([]);
  const [addingExistingUser, setAddingExistingUser] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [existingUserSearch, setExistingUserSearch] = useState('');
  const [showExistingUsersDropdown, setShowExistingUsersDropdown] = useState(false);
  const existingUsersDropdownRef = useRef(null);

  const handleApLogoFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_LOGO_FILE_SIZE_BYTES) {
      toast.error('Logo 1 must be less than 1MB');
      setApLogoFile(null);
      setApLogoLocalPreview('');
      event.target.value = '';
      return;
    }
    setApLogoFile(file);
    setApLogoLocalPreview(file ? URL.createObjectURL(file) : '');
  };

  const handleCompanyLogoFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > MAX_LOGO_FILE_SIZE_BYTES) {
      toast.error('Logo 2 must be less than 1MB');
      setCompanyLogoFile(null);
      setCompanyLogoLocalPreview('');
      event.target.value = '';
      return;
    }
    setCompanyLogoFile(file);
    setCompanyLogoLocalPreview(file ? URL.createObjectURL(file) : '');
  };

  const fetchCompanyDetails = async () => {
    if (!companyId) return;
    try {
      setIsLoadingDetails(true);
      const response = await companyAPI.getCompanyById(companyId);
      const details = response?.data || null;
      setCompanyDetails(details);
      const storageKey = getTopLeftLogoToggleStorageKey(companyId);
      setFormData((prev) => {
        const cachedToggle = localStorage.getItem(storageKey);
        const cachedToggleBool = coerceTopLeftLogoToggle(cachedToggle, true);
        const resolvedToggle = coerceTopLeftLogoToggle(
          details?.showTopLeftLogosInTermLoanCc,
          prev?.showTopLeftLogosInTermLoanCc ?? cachedToggleBool
        );
        localStorage.setItem(storageKey, resolvedToggle ? 'true' : 'false');
        return {
        companyName: details?.companyName || '',
        companyAddress: details?.companyAddress || '',
        contactPersonName: details?.contactPersonName || '',
        contactEmail: details?.contactEmail || '',
        contactPhone: details?.contactPhone || '',
        // Prefer backend value; if missing, fall back to previous UI state,
        // then local persisted value for this company.
        showTopLeftLogosInTermLoanCc: resolvedToggle
      };
      });
    } catch (error) {
      toast.error(error || 'Failed to load company details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const fetchCompanyAnalytics = async () => {
    if (!companyId) return;
    try {
      const response = await companyAPI.getCompanyAnalytics(companyId);
      setAnalytics(response?.data || null);
    } catch (error) {
      toast.error(error || 'Failed to load company analytics');
    }
  };

  const fetchAdminCandidates = async () => {
    if (!companyId) return;
    try {
      const response = await companyAPI.getCompanyAdminCandidates(companyId);
      setCandidates(response?.data || []);
    } catch (error) {
      toast.error(error || 'Failed to load company admin candidates');
    }
  };

  const fetchCompanyUsers = async () => {
    if (!companyId) return;
    try {
      setUsersLoading(true);
      const response = await companyAPI.getCompanyUsers(companyId);
      setCompanyUsers(response?.data || []);
    } catch (error) {
      toast.error(error || 'Failed to load company users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCompanyUserCandidates = async () => {
    if (!companyId) return;
    try {
      const response = await companyAPI.getCompanyUserCandidates(companyId);
      setExistingUserCandidates(response?.data || []);
    } catch (error) {
      toast.error(error || 'Failed to load existing users');
    }
  };

  // Explicit select + confirm flow for top-left logo visibility.
  const [topLeftLogosToggleSaving, setTopLeftLogosToggleSaving] = useState(false);
  const [topLeftLogoSelection, setTopLeftLogoSelection] = useState('yes');
  const handleConfirmTopLeftLogosSetting = async () => {
    if (!companyId) return;
    const nextValue = topLeftLogoSelection === 'yes';
    try {
      setTopLeftLogosToggleSaving(true);
      const response = await companyAPI.updateCompany(companyId, {
        showTopLeftLogosInTermLoanCc: nextValue
      });
      localStorage.setItem(
        getTopLeftLogoToggleStorageKey(companyId),
        nextValue ? 'true' : 'false'
      );
      const updatedDetails = response?.data;
      if (updatedDetails) {
        setCompanyDetails(updatedDetails);
      } else {
        setCompanyDetails((prev) => ({
          ...(prev || {}),
          showTopLeftLogosInTermLoanCc: nextValue
        }));
      }
      setFormData((prev) => ({
        ...prev,
        showTopLeftLogosInTermLoanCc: nextValue
      }));
      toast.success(
        nextValue
          ? 'Cover white band and bottom logos will appear on supported reports'
          : 'Cover white band and bottom logos hidden — inner-page logos unchanged'
      );
    } catch (error) {
      toast.error(error || 'Failed to update top-left logo setting');
    } finally {
      setTopLeftLogosToggleSaving(false);
    }
  };

  const handleToggleCompanyStatus = async () => {
    if (!companyId || !companyDetails?._id) return;
    const currentlyActive = companyDetails?.isActive !== false;
    const nextIsActive = !currentlyActive;
    const confirmed = window.confirm(
      `${nextIsActive ? 'Activate' : 'Deactivate'} "${companyDetails.companyName || 'this company'}"?`
    );
    if (!confirmed) return;
    try {
      setUpdatingCompanyStatus(true);
      await companyAPI.updateCompanyStatus(companyId, nextIsActive);
      toast.success(`Company ${nextIsActive ? 'activated' : 'deactivated'} successfully`);
      await fetchCompanyDetails();
      await fetchCompanyAnalytics();
    } catch (error) {
      toast.error(error || 'Failed to update company status');
    } finally {
      setUpdatingCompanyStatus(false);
    }
  };

  const handleAddCompanyAdmins = async () => {
    if (!companyId || !selectedNewAdminIds.length) {
      toast.error('Please select at least one user');
      return;
    }
    try {
      setAddingCompanyAdmins(true);
      await companyAPI.addCompanyAdmins(companyId, selectedNewAdminIds);
      toast.success('Company admin(s) added successfully');
      setSelectedNewAdminIds([]);
      setShowAdminCandidatesDropdown(false);
      await fetchCompanyDetails();
      await fetchCompanyAnalytics();
      await fetchAdminCandidates();
    } catch (error) {
      const message =
        error?.response?.data?.error || error?.message || error || 'Failed to add company admins';
      toast.error(message);
    } finally {
      setAddingCompanyAdmins(false);
    }
  };

  const handleRemoveCompanyAdminMember = async (userId) => {
    if (!companyId || !userId) return;
    try {
      setRemovingAdminId(String(userId));
      await companyAPI.removeCompanyAdmin(companyId, userId);
      toast.success('Removed from company');

      const removedUserId = String(userId);
      const currentUserId = String(user?._id || user?.id || '');
      const removedCurrentUser = Boolean(currentUserId) && removedUserId === currentUserId;

      // If current company admin removed themselves, backend demotes role to `user`.
      // Skip admin-only refresh requests to avoid false error toasts from 403 responses.
      if (removedCurrentUser) {
        navigate('/admin/companies');
        return;
      }

      try {
        await fetchCompanyDetails();
        await fetchCompanyUsers();
        await fetchCompanyAnalytics();
        await fetchAdminCandidates();
        await fetchCompanyUserCandidates();
      } catch (refreshError) {
        // Removal already succeeded; avoid showing a misleading failure toast.
        console.warn('Company admin removed, but post-remove refresh failed', refreshError);
      }
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        error ||
        'Failed to remove company admin';
      toast.error(message);
    } finally {
      setRemovingAdminId('');
    }
  };

  const handleToggleUserStatus = async (memberUser) => {
    try {
      await companyAPI.updateCompanyUser(memberUser._id, { is_active: !memberUser.is_active });
      toast.success(`User ${memberUser.is_active ? 'disabled' : 'enabled'} successfully`);
      await fetchCompanyUsers();
    } catch (error) {
      toast.error(error || 'Failed to update user status');
    }
  };

  const handleAddExistingUser = async () => {
    if (!selectedExistingUserIds.length || !companyDetails?._id) {
      toast.error('Please select at least one existing user');
      return;
    }
    if (selectedExistingUserIds.length > MAX_USERS_PER_ADD_OPERATION) {
      toast.error(`You can add up to ${MAX_USERS_PER_ADD_OPERATION} users at once`);
      return;
    }
    try {
      setAddingExistingUser(true);
      const normalizedCompanyId = companyAPI.normalizeCompanyId(companyDetails._id || companyId);
      const results = await Promise.allSettled(
        selectedExistingUserIds.map((userId) =>
          companyAPI.updateCompanyUser(userId, { companyId: normalizedCompanyId })
        )
      );
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failedCount = results.length - successCount;

      if (successCount > 0 && failedCount > 0) {
        toast.success(`${successCount} user(s) added, ${failedCount} failed`);
      } else if (successCount > 0) {
        toast.success(`${successCount} user(s) added to company`);
      } else {
        toast.error('Failed to add selected users');
      }

      setSelectedExistingUserIds([]);
      setShowExistingUsersDropdown(false);
      await fetchCompanyUsers();
      await fetchCompanyUserCandidates();
      await fetchCompanyAnalytics();
    } catch (error) {
      toast.error(error || 'Failed to add existing user');
    } finally {
      setAddingExistingUser(false);
    }
  };

  const handleRemoveUserFromCompany = async (memberUser) => {
    try {
      await companyAPI.updateCompanyUser(memberUser._id, { companyId: null });
      toast.success(
        isChannelPartner(memberUser)
          ? 'Channel partner removed from company'
          : 'User removed from company'
      );
      await fetchCompanyDetails();
      await fetchCompanyUsers();
      await fetchCompanyUserCandidates();
      await fetchAdminCandidates();
      await fetchCompanyAnalytics();
    } catch (error) {
      const message =
        error?.response?.data?.error || error?.message || error || 'Failed to remove user';
      toast.error(message);
    }
  };

  const handleToggleAgentRole = async (memberUser) => {
    const nextRole = memberUser.role === 'agent' ? 'user' : 'agent';
    try {
      await companyAPI.updateCompanyUser(memberUser._id, { role: nextRole });
      toast.success(`User role updated to ${nextRole}`);
      await fetchCompanyUsers();
      await fetchCompanyUserCandidates();
    } catch (error) {
      toast.error(error || 'Failed to update role');
    }
  };

  const uploadLogoForField = async ({ file, type, setUploading, clearLocal }) => {
    if (!file) {
      toast.error('Please select an image file');
      return;
    }
    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('companyId', companyId);
      uploadFormData.append('file', file);
      uploadFormData.append('type', type);

      await companyAPI.uploadLogo(uploadFormData);
      toast.success(`${type === 'apLogo' ? 'Logo 1' : 'Logo 2'} uploaded successfully`);
      clearLocal();
      await fetchCompanyDetails();
    } catch (error) {
      toast.error(error || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleApLogoUpload = () =>
    uploadLogoForField({
      file: apLogoFile,
      type: 'apLogo',
      setUploading: setApLogoUploading,
      clearLocal: () => {
        setApLogoFile(null);
        setApLogoLocalPreview('');
      }
    });

  const handleCompanyLogoUpload = () =>
    uploadLogoForField({
      file: companyLogoFile,
      type: 'companyLogo',
      setUploading: setCompanyLogoUploading,
      clearLocal: () => {
        setCompanyLogoFile(null);
        setCompanyLogoLocalPreview('');
      }
    });

  const discardApLogoLocal = () => {
    setApLogoFile(null);
    setApLogoLocalPreview('');
  };

  const discardCompanyLogoLocal = () => {
    setCompanyLogoFile(null);
    setCompanyLogoLocalPreview('');
  };

  const handleClearStoredApLogo = async () => {
    if (!companyId) return;
    if (
      !window.confirm('Remove Logo 1 from this company? It will no longer appear on Term Loan + CC and other branded outputs.')
    )
      return;
    try {
      setApLogoClearing(true);
      await companyAPI.clearLogo(companyId, { type: 'apLogo' });
      discardApLogoLocal();
      toast.success('Logo 1 removed');
      await fetchCompanyDetails();
    } catch (error) {
      toast.error(error || 'Failed to remove logo');
    } finally {
      setApLogoClearing(false);
    }
  };

  const handleClearStoredCompanyLogo = async () => {
    if (!companyId) return;
    if (
      !window.confirm('Remove Logo 2 from this company? It will no longer appear on Term Loan + CC and other branded outputs.')
    )
      return;
    try {
      setCompanyLogoClearing(true);
      await companyAPI.clearLogo(companyId, { type: 'companyLogo' });
      discardCompanyLogoLocal();
      toast.success('Logo 2 removed');
      await fetchCompanyDetails();
    } catch (error) {
      toast.error(error || 'Failed to remove logo');
    } finally {
      setCompanyLogoClearing(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
    fetchCompanyAnalytics();
    if (canManageCompanyAdmins) {
      fetchAdminCandidates();
    } else {
      setCandidates([]);
    }
    fetchCompanyUsers();
    fetchCompanyUserCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, canManageCompanyAdmins]);

  useEffect(() => {
    setTopLeftLogoSelection(formData.showTopLeftLogosInTermLoanCc ? 'yes' : 'no');
  }, [formData.showTopLeftLogosInTermLoanCc]);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (existingUsersDropdownRef.current && !existingUsersDropdownRef.current.contains(event.target)) {
        setShowExistingUsersDropdown(false);
      }
      if (adminCandidatesDropdownRef.current && !adminCandidatesDropdownRef.current.contains(event.target)) {
        setShowAdminCandidatesDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowExistingUsersDropdown(false);
        setShowAdminCandidatesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const filteredCompanyUsers = useMemo(() => {
    if (!userSearch.trim()) return companyUsers;
    const term = userSearch.trim().toLowerCase();
    return companyUsers.filter((u) =>
      [u.name, u.email, u.role].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
    );
  }, [companyUsers, userSearch]);

  const eligibleUserCandidates = useMemo(
    () => existingUserCandidates.filter((candidate) => !isChannelPartner(candidate) && !isExecutive(candidate)),
    [existingUserCandidates]
  );

  const filteredExistingUserCandidates = useMemo(() => {
    if (!existingUserSearch.trim()) return eligibleUserCandidates;
    const term = existingUserSearch.trim().toLowerCase();
    return eligibleUserCandidates.filter((candidate) =>
      [candidate.name, candidate.email, candidate.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [eligibleUserCandidates, existingUserSearch]);

  const currentCompanyAdmins = useMemo(() => {
    const list = companyDetails?.companyAdminIds;
    if (Array.isArray(list) && list.length) {
      return list.filter((entry) => entry && (entry._id || entry.id));
    }
    if (companyDetails?.companyAdminId?._id || companyDetails?.companyAdminId) {
      return [companyDetails.companyAdminId];
    }
    return [];
  }, [companyDetails]);

  const adminSlotsLeft = Math.max(0, MAX_COMPANY_ADMINS - currentCompanyAdmins.length);

  const eligibleAdminCandidates = useMemo(
    () => candidates.filter((candidate) => !isChannelPartner(candidate) && !isExecutive(candidate)),
    [candidates]
  );

  const filteredAdminCandidates = useMemo(() => {
    if (!adminSearch.trim()) return eligibleAdminCandidates;
    const term = adminSearch.trim().toLowerCase();
    return eligibleAdminCandidates.filter((candidate) =>
      [candidate.name, candidate.email, candidate.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [eligibleAdminCandidates, adminSearch]);

  const allFilteredAdminCandidatesSelected =
    filteredAdminCandidates.length > 0 &&
    filteredAdminCandidates.every((candidate) => selectedNewAdminIds.includes(candidate._id));

  const allFilteredExistingUsersSelected =
    filteredExistingUserCandidates.length > 0 &&
    filteredExistingUserCandidates.every((candidate) => selectedExistingUserIds.includes(candidate._id));

  const handleToggleExistingUserSelection = (userId) => {
    setSelectedExistingUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      if (prev.length >= MAX_USERS_PER_ADD_OPERATION) {
        toast.error(`You can select only ${MAX_USERS_PER_ADD_OPERATION} users at once`);
        return prev;
      }
      return [...prev, userId];
    });
  };

  const handleToggleSelectAllFilteredUsers = () => {
    if (allFilteredExistingUsersSelected) {
      const filteredIds = new Set(filteredExistingUserCandidates.map((candidate) => candidate._id));
      setSelectedExistingUserIds((prev) => prev.filter((id) => !filteredIds.has(id)));
      return;
    }
    setSelectedExistingUserIds((prev) => {
      const merged = new Set(prev);
      for (const candidate of filteredExistingUserCandidates) {
        if (merged.size >= MAX_USERS_PER_ADD_OPERATION) break;
        merged.add(candidate._id);
      }
      if (filteredExistingUserCandidates.length > MAX_USERS_PER_ADD_OPERATION || merged.size === MAX_USERS_PER_ADD_OPERATION) {
        toast.error(`Only ${MAX_USERS_PER_ADD_OPERATION} users can be selected at once`);
      }
      return Array.from(merged);
    });
  };

  const handleToggleNewAdminSelection = (userId) => {
    setSelectedNewAdminIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      if (adminSlotsLeft <= 0) {
        toast.error(`This company already has ${MAX_COMPANY_ADMINS} company admins`);
        return prev;
      }
      if (prev.length >= adminSlotsLeft) {
        toast.error(`You can select up to ${adminSlotsLeft} user(s) for this add (company admin limit is ${MAX_COMPANY_ADMINS})`);
        return prev;
      }
      return [...prev, userId];
    });
  };

  const handleToggleSelectAllFilteredAdminCandidates = () => {
    if (adminSlotsLeft <= 0) {
      toast.error(`This company already has ${MAX_COMPANY_ADMINS} company admins`);
      return;
    }
    if (allFilteredAdminCandidatesSelected) {
      const filteredIds = new Set(filteredAdminCandidates.map((candidate) => candidate._id));
      setSelectedNewAdminIds((prev) => prev.filter((id) => !filteredIds.has(id)));
      return;
    }
    setSelectedNewAdminIds((prev) => {
      const merged = new Set(prev);
      for (const candidate of filteredAdminCandidates) {
        if (merged.size >= adminSlotsLeft) break;
        merged.add(candidate._id);
      }
      if (filteredAdminCandidates.length > adminSlotsLeft || merged.size === adminSlotsLeft) {
        toast.error(`Only ${adminSlotsLeft} more company admin slot(s) available`);
      }
      return Array.from(merged);
    });
  };

  const headerTitle = companyDetails?.companyName || 'Company Details';
  const headerSubtitle = 'Manage company branding, users, and settings';

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            {isPlatformAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin/companies')}
                className="mt-1 inline-flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                title="Back to companies"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={24} className="text-purple-600" />
                {headerTitle}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{headerSubtitle}</p>
            </div>
          </div>

          {isDetailsPage && (
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  companyDetails?.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {companyDetails?.isActive ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                {companyDetails?.isActive ? 'Active' : 'Inactive'}
              </span>
              {isCompanyAdmin && (
                <Link
                  to="/company/reports"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 inline-flex items-center gap-1.5"
                >
                  <ExternalLink size={14} /> Company Reports
                </Link>
              )}
              {isPlatformAdmin && (
                <button
                  type="button"
                  onClick={handleToggleCompanyStatus}
                  disabled={updatingCompanyStatus}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50 ${
                    companyDetails?.isActive
                      ? 'border border-red-200 text-red-700 hover:bg-red-50'
                      : 'border border-green-200 text-green-700 hover:bg-green-50'
                  }`}
                >
                  {companyDetails?.isActive ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                  {updatingCompanyStatus
                    ? 'Updating…'
                    : companyDetails?.isActive
                    ? 'Deactivate Company'
                    : 'Activate Company'}
                </button>
              )}
              {/* Delete company action intentionally disabled.
              {canDeleteCompany && (
                <button
                  type="button"
                  onClick={handleToggleCompanyStatus}
                  disabled={deletingCompany}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border inline-flex items-center gap-1.5 disabled:opacity-50 ${
                    companyDetails?.isActive !== false
                      ? 'border-orange-200 text-orange-700 hover:bg-orange-50'
                      : 'border-green-200 text-green-700 hover:bg-green-50'
                  }`}
                >
                  {companyDetails?.isActive !== false ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                  {deletingCompany ? '…' : companyDetails?.isActive !== false ? 'Deactivate' : 'Activate'}
                </button>
              )}
              */}
            </div>
          )}
        </div>

        {/* Details page sections */}
        {isDetailsPage && (
          <>
            {/* Overview + Edit card */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {isLoadingDetails ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <RefreshCw size={16} className="animate-spin" /> Loading company details…
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Company Overview</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Basic information about this company (display only).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoCard icon={Building2} label="Company Name" value={companyDetails?.companyName} />
                    <InfoCard icon={UserIcon} label="Contact Person" value={companyDetails?.contactPersonName} />
                    <InfoCard icon={Mail} label="Contact Email" value={companyDetails?.contactEmail} />
                    <InfoCard icon={Phone} label="Contact Phone" value={companyDetails?.contactPhone} />
                    <div className="md:col-span-2">
                      <InfoCard icon={MapPin} label="Address" value={companyDetails?.companyAddress} />
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Logos */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon size={18} className="text-purple-600" /> Branding Logos
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Both logos are stored in Azure Blob Storage and used on report covers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LogoSlot
                  title="Logo 1"
                  description="Primary logo (e.g. government / authority emblem)"
                  storedUrl={companyDetails?.apLogoDisplayUrl || companyDetails?.apLogoUrl}
                  localPreview={apLogoLocalPreview}
                  onFileChange={handleApLogoFileChange}
                  onUpload={handleApLogoUpload}
                  uploading={apLogoUploading}
                  inputId="apLogoFile"
                  hasFile={Boolean(apLogoFile)}
                  onDiscardLocal={discardApLogoLocal}
                  onClearStored={handleClearStoredApLogo}
                  clearingStored={apLogoClearing}
                />
                <LogoSlot
                  title="Logo 2"
                  description="Company / franchise branding logo"
                  storedUrl={companyDetails?.companyLogoDisplayUrl || companyDetails?.companyLogoUrl}
                  localPreview={companyLogoLocalPreview}
                  onFileChange={handleCompanyLogoFileChange}
                  onUpload={handleCompanyLogoUpload}
                  uploading={companyLogoUploading}
                  inputId="companyLogoFile"
                  hasFile={Boolean(companyLogoFile)}
                  onDiscardLocal={discardCompanyLogoLocal}
                  onClearStored={handleClearStoredCompanyLogo}
                  clearingStored={companyLogoClearing}
                />
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                <div>
                  <p className="block text-sm font-medium text-gray-900">
                    First-page cover: white band and bottom logos
                  </p>
                  <p className="mt-0.5 block text-xs text-gray-500">
                    Term Loan + CC and other supported templates — does not affect merged
                    top-corner branding on inner pages
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <select
                    value={topLeftLogoSelection}
                    onChange={(event) => setTopLeftLogoSelection(event.target.value)}
                    disabled={topLeftLogosToggleSaving || isLoadingDetails}
                    className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value="yes">Show Logo</option>
                    <option value="no">Show Text</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleConfirmTopLeftLogosSetting}
                    disabled={
                      topLeftLogosToggleSaving ||
                      isLoadingDetails ||
                      (topLeftLogoSelection === (formData.showTopLeftLogosInTermLoanCc ? 'yes' : 'no'))
                    }
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {topLeftLogosToggleSaving ? 'Saving…' : 'Confirm'}
                  </button>
                </div>
              </div>
            </section>

            {/* Analytics */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 size={18} className="text-purple-600" /> Company Analytics
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Quick stats for users and reports.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard icon={Users} label="Total Users" value={analytics?.totalUsers} tone="blue" />
                <StatCard icon={UserCog} label="Channel partners" value={analytics?.totalAgents} tone="purple" />
                <StatCard icon={ShieldCheck} label="Company Admins" value={analytics?.totalCompanyAdmins} tone="indigo" />
                <StatCard icon={BarChart3} label="Total Reports" value={analytics?.totalReports} tone="gray" />
                <StatCard icon={RefreshCw} label="Pending" value={analytics?.pendingValidationReports} tone="yellow" />
                <StatCard icon={CheckCircle2} label="Approved" value={analytics?.approvedReports} tone="green" />
              </div>
            </section>

            {/* Company Admins (platform admin only) */}
            {canManageCompanyAdmins && (
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-purple-600" /> Company Admins
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Search existing users and add up to {MAX_COMPANY_ADMINS} company admins ({currentCompanyAdmins.length} of{' '}
                    {MAX_COMPANY_ADMINS} assigned).
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <p className="text-gray-500 text-xs uppercase tracking-wide font-medium">Current company admins</p>
                  {currentCompanyAdmins.length === 0 ? (
                    <p className="text-sm text-gray-600">None assigned yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {currentCompanyAdmins.map((admin) => {
                        const id = admin._id || admin.id;
                        const channelPartner = isChannelPartner(admin);
                        return (
                          <li
                            key={id}
                            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                              channelPartner
                                ? 'border-amber-200 bg-amber-50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <span className="text-gray-900 font-medium min-w-0">
                              {admin.name || '—'}{' '}
                              <span className="text-gray-500 font-normal">({admin.email || '—'})</span>
                              {channelPartner && (
                                <span className="ml-2 inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-100 text-amber-800">
                                  Channel partner — invalid
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCompanyAdminMember(id)}
                              disabled={removingAdminId === String(id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 shrink-0"
                            >
                              {removingAdminId === String(id)
                                ? 'Removing…'
                                : channelPartner
                                  ? 'Remove from company'
                                  : 'Remove'}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">Add from existing users</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {adminSlotsLeft > 0
                          ? `Select up to ${adminSlotsLeft} user(s) to add as company admin in one step. Channel partners cannot be company admins.`
                          : 'Remove a company admin to add a different user.'}
                      </p>
                    </div>
                    {selectedNewAdminIds.length > 0 && adminSlotsLeft > 0 && (
                      <button
                        type="button"
                        onClick={handleAddCompanyAdmins}
                        disabled={addingCompanyAdmins}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 shrink-0"
                      >
                        {addingCompanyAdmins ? 'Adding…' : 'Add selected as admins'}
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="relative" ref={adminCandidatesDropdownRef}>
                      <input
                        type="search"
                        value={adminSearch}
                        onFocus={() => setShowAdminCandidatesDropdown(true)}
                        onChange={(event) => {
                          setAdminSearch(event.target.value);
                          setShowAdminCandidatesDropdown(true);
                        }}
                        disabled={adminSlotsLeft <= 0}
                        placeholder="Search users by name, email, or role…"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm disabled:bg-gray-100 disabled:text-gray-400"
                      />

                      {showAdminCandidatesDropdown && adminSlotsLeft > 0 && (
                        <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg p-2 space-y-2">
                          <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 px-1">
                            <input
                              type="checkbox"
                              checked={allFilteredAdminCandidatesSelected}
                              onChange={handleToggleSelectAllFilteredAdminCandidates}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            Select all filtered (within available slots)
                          </label>
                          <div className="max-h-52 overflow-auto rounded-md border border-gray-200 bg-white divide-y divide-gray-100">
                            {filteredAdminCandidates.length === 0 ? (
                              <p className="px-3 py-4 text-xs text-gray-500">No matching users found.</p>
                            ) : (
                              filteredAdminCandidates.map((candidate) => (
                                <label
                                  key={candidate._id}
                                  className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                                >
                                  <span className="inline-flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={selectedNewAdminIds.includes(candidate._id)}
                                      onChange={() => handleToggleNewAdminSelection(candidate._id)}
                                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-800 truncate">
                                      {candidate.name || 'Unnamed'} ({candidate.email || 'No email'})
                                    </span>
                                  </span>
                                  <span className="text-[11px] uppercase text-gray-500">
                                  {formatRoleForDisplay(candidate.role || 'user', candidate).toUpperCase()}
                                </span>
                                </label>
                              ))
                            )}
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setShowAdminCandidatesDropdown(false)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">{selectedNewAdminIds.length} selected to add</p>
                  </div>
                </div>
              </section>
            )}

            {/* Company Users */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users size={18} className="text-purple-600" /> Company Users
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Manage users belonging to this company.
                  </p>
                </div>
                <input
                  type="search"
                  placeholder="Search users…"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Existing User</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      You can select up to {MAX_USERS_PER_ADD_OPERATION} users per add operation.
                      Channel partners are not eligible for company membership.
                    </p>
                  </div>
                  {selectedExistingUserIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddExistingUser}
                      disabled={addingExistingUser}
                      className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shrink-0"
                    >
                      {addingExistingUser ? 'Adding…' : 'Add Selected Users'}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="relative" ref={existingUsersDropdownRef}>
                    <input
                      type="search"
                      value={existingUserSearch}
                      onFocus={() => setShowExistingUsersDropdown(true)}
                      onChange={(event) => {
                        setExistingUserSearch(event.target.value);
                        setShowExistingUsersDropdown(true);
                      }}
                      placeholder="Search existing users by name, email, or role..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                    />

                    {showExistingUsersDropdown && (
                      <div className="absolute z-20 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg p-2 space-y-2">
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 px-1">
                          <input
                            type="checkbox"
                            checked={allFilteredExistingUsersSelected}
                            onChange={handleToggleSelectAllFilteredUsers}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          Select all filtered users
                        </label>
                        <div className="max-h-52 overflow-auto rounded-md border border-gray-200 bg-white divide-y divide-gray-100">
                          {filteredExistingUserCandidates.length === 0 ? (
                            <p className="px-3 py-4 text-xs text-gray-500">No matching users found.</p>
                          ) : (
                            filteredExistingUserCandidates.map((candidate) => (
                              <label
                                key={candidate._id}
                                className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50"
                              >
                                <span className="inline-flex items-center gap-2 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={selectedExistingUserIds.includes(candidate._id)}
                                    onChange={() => handleToggleExistingUserSelection(candidate._id)}
                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="text-sm text-gray-800 truncate">
                                    {candidate.name || 'Unnamed'} ({candidate.email || 'No email'})
                                  </span>
                                </span>
                                <span className="text-[11px] uppercase text-gray-500">
                                  {formatRoleForDisplay(candidate.role || 'user', candidate).toUpperCase()}
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setShowExistingUsersDropdown(false)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">{selectedExistingUserIds.length} selected</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-100">
                {usersLoading ? (
                  <div className="p-6 text-sm text-gray-500 flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin" /> Loading users…
                  </div>
                ) : filteredCompanyUsers.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">
                    {companyUsers.length === 0
                      ? 'No users belong to this company yet.'
                      : 'No users match your search.'}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredCompanyUsers.map((memberUser) => {
                        const initial = memberUser.name?.[0]?.toUpperCase() || 'U';
                        const channelPartner = isChannelPartner(memberUser);
                        return (
                          <tr
                            key={memberUser._id}
                            className={channelPartner ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-gray-50'}
                          >
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 text-white flex items-center justify-center font-semibold">
                                  {initial}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {memberUser.name || '—'}
                                    {channelPartner && (
                                      <span className="ml-2 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-100 text-amber-800">
                                        Channel partner — remove
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {memberUser.email || '—'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                                  memberUser.role === 'agent'
                                    ? 'bg-purple-50 text-purple-700'
                                    : memberUser.role === 'company_admin'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {formatRoleForDisplay(memberUser.role || 'user', memberUser)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  memberUser.is_active === false
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {memberUser.is_active === false ? 'Inactive' : 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {memberUser.company_name || companyDetails?.companyName || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(memberUser)}
                                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                                >
                                  {memberUser.is_active === false ? 'Activate' : 'Deactivate'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUserFromCompany(memberUser)}
                                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  {channelPartner ? 'Remove from company' : 'Remove'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCreateCompanyPage;
