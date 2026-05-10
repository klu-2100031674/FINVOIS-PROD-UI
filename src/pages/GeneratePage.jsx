/**
 * Generate Page
 * Form submission and Excel generation
 */

import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useAuth } from '../hooks';
import {
  fetchTemplateById,
  selectSelectedTemplate,
  selectTemplateLoading,
} from '../store/slices/templateSlice';
import {
  applyFormData,
  selectGeneratedExcel,
  clearGeneratedExcel,
  setFormData,
  setRelatedDocuments,
  clearFormData,
  clearRelatedDocuments,
  selectFormData,
} from '../store/slices/reportSlice';
import { fetchDraftByIdV2 } from '../store/slices/draftSlice';
import { Button, Card, Loading } from '../components/common';
import FRCC1Form from '../components/forms/FRCC1Form';
import FRCC2Form from '../components/forms/FRCC2Form';
import FRCC3Form from '../components/forms/FRCC3Form';
import FRCC4Form from '../components/forms/FRCC4Form';
import FRCC5Form from '../components/forms/FRCC5Form';
import FRCC6Form from '../components/forms/FRCC6Form';
import FRCC7Form from '../components/forms/FRCC7Form';
import FRTermLoanForm from '../components/forms/FRTermLoanForm';
import FRTermLoanWithStockForm from '../components/forms/FRTermLoanWithStockForm';
import FRTermLoanCCForm from '../components/forms/FRTermLoanCCForm';
import ReportSectionSelector from '../components/forms/ReportSectionSelector';
import { companyAPI, reportAPI } from '../api/endpoints';
import { downloadFile, formatApiErrorMessage } from '../utils';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ChartBarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { ShieldCheck } from 'lucide-react';
import NotificationBell from '../components/common/NotificationBell';
import finvoisLogo from '../assets/finvois.png';
import { normalizeUserRole } from '../utils/normalizeUserRole';
import { dashboardHomePath, generateHubLandingPath, myReportsPathForRole } from '../utils/routePaths';

/** Full-width shell for /generate — top bar only, no client sidebar */
function GenerateStandaloneLayout({ children, withFonts = false }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const normalizedRole = normalizeUserRole(user?.role);
  const resolvedDashboardPath = dashboardHomePath(user?.role);

  const handleMyReports = () => {
    navigate(myReportsPathForRole(user?.role));
  };

  return (
    <div className="min-h-screen w-full font-['Inter']" style={{ backgroundColor: '#F8F8FF' }}>
      {withFonts && (
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        h1, h2, h3, h4, h5, h6 { font-family: 'Manrope', sans-serif; }
        body, input, select, textarea, button { font-family: 'Inter', sans-serif; }
      `}</style>
      )}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 gap-3 sm:gap-4">
              <Link to={resolvedDashboardPath} className="flex items-center gap-2 text-gray-900 min-w-0">
                <img src={finvoisLogo} alt="Finvois" className="h-9 w-auto flex-shrink-0" />
              </Link>
              <Link
                to="/drafts"
                className="hidden sm:inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                <ClipboardDocumentListIcon className="w-4 h-4 mr-2" aria-hidden />
                Drafts
              </Link>
              <button
                type="button"
                onClick={handleMyReports}
                className="hidden sm:inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChartBarIcon className="w-4 h-4 mr-2" />
                My Reports
              </button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <NotificationBell />
              {normalizedRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="hidden sm:inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden min-w-0 p-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

// Excel-only templates — skip AI section selector; call apply-form directly
const NON_AI_TEMPLATES = [
  'frcc1', 'Format CC1',
  'frcc2', 'Format CC2',
  'frcc3', 'Format CC3',
  'frcc4', 'Format CC4',
  'frcc5', 'Format CC5',
  'frcc6', 'Format CC6',
  'frcc7', 'Format CC7',
];

const GeneratePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const store = useStore();
  const { user } = useAuth();
  console.log('🎯 GeneratePage - user info:', user);

  const templateId = searchParams.get('templateId');
  const presetSector = searchParams.get('presetSector');
  const lockSector =
    searchParams.get('lockSector') === '1' ||
    String(searchParams.get('lockSector') || '').toLowerCase() === 'true';
  // Resume-from-draft: Drafts page navigates here with ?draftId=... so we can
  // hydrate the form from the saved snapshot. When absent we start fresh.
  const draftId = searchParams.get('draftId');
  /** From dashboard "start this template" — always INSERT first save, never update an old draft */
  const forceNewDraft =
    searchParams.get('newDraft') === '1' || searchParams.get('newDraft') === 'true';
  const template = useSelector(selectSelectedTemplate);
  const generatedExcel = useSelector(selectGeneratedExcel);
  const loading = useSelector(selectTemplateLoading);
  const reduxFormData = useSelector(selectFormData);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [tempFormData, setTempFormData] = useState(null);
  const [tempSubmittedData, setTempSubmittedData] = useState(null);
  const [draftCheckComplete, setDraftCheckComplete] = useState(false);
  const hasMounted = useRef(false);
  const generationRequestedRef = useRef(false);
  const brandingRef = useRef(null); // cache resolved company branding

  const normalizeCompanyId = (companyId) => {
    if (!companyId) return '';
    if (typeof companyId === 'string') return companyId;
    return companyId?._id || companyId?.id || '';
  };

  const normalizeLogoToggle = (value, fallback = true) => {
    if (value === undefined || value === null) return fallback;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    return fallback;
  };

  const resolveBranding = async () => {
    // Prefer user object if already hydrated with branding fields
    const userAp = user?.apLogoDisplayUrl || user?.apLogoUrl || '';
    const userCompany = user?.companyLogoDisplayUrl || user?.companyLogoUrl || '';
    const userShowTopLeft = normalizeLogoToggle(user?.showTopLeftLogosInTermLoanCc, true);

    const cached = brandingRef.current;
    if (cached?.apLogoUrl && cached?.companyLogoUrl) {
      return cached;
    }

    // If both logos already exist on the user blob, use them without calling company API.
    if (userAp && userCompany) {
      const branding = {
        apLogoUrl: userAp,
        companyLogoUrl: userCompany,
        showTopLeftLogosInTermLoanCc: userShowTopLeft,
      };
      brandingRef.current = branding;
      return branding;
    }

    // Fallback: fetch company branding by companyId
    const companyIdValue = normalizeCompanyId(user?.companyId);
    if (!companyIdValue) {
      return {
        apLogoUrl: userAp,
        companyLogoUrl: userCompany,
        showTopLeftLogosInTermLoanCc: userShowTopLeft,
      };
    }
    try {
      const response = await companyAPI.getCompanyById(companyIdValue);
      const company = response?.data || response || {};
      const apLogoUrl = company.apLogoDisplayUrl || company.apLogoUrl || userAp || '';
      const companyLogoUrl = company.companyLogoDisplayUrl || company.companyLogoUrl || userCompany || '';
      const showTopLeftLogosInTermLoanCc = normalizeLogoToggle(
        company.showTopLeftLogosInTermLoanCc,
        userShowTopLeft
      );
      const branding = { apLogoUrl, companyLogoUrl, showTopLeftLogosInTermLoanCc };
      if (apLogoUrl && companyLogoUrl) {
        brandingRef.current = branding;
      }
      return branding;
    } catch (_) {
      return {
        apLogoUrl: userAp,
        companyLogoUrl: userCompany,
        showTopLeftLogosInTermLoanCc: userShowTopLeft,
      };
    }
  };

  const withTemplateLogos = async (payload) => {
    const incoming = payload && typeof payload === 'object' ? payload : {};
    const incomingShowTopLeft = normalizeLogoToggle(
      incoming.showTopLeftLogosInTermLoanCc,
      undefined
    );
    const resolvedBranding = await resolveBranding();
    const shouldShowTopLeft =
      incomingShowTopLeft === undefined
        ? normalizeLogoToggle(resolvedBranding.showTopLeftLogosInTermLoanCc, true)
        : incomingShowTopLeft;

    if (!shouldShowTopLeft) {
      return {
        ...incoming,
        showTopLeftLogosInTermLoanCc: false,
      };
    }

    const alreadyHasBoth =
      (incoming.apLogoUrl || incoming.apLogoDisplayUrl || incoming.logo1) &&
      (incoming.companyLogoUrl || incoming.companyLogoDisplayUrl || incoming.logo2);
    if (alreadyHasBoth) {
      return {
        ...incoming,
        showTopLeftLogosInTermLoanCc: true,
      };
    }

    const apLogoUrl =
      incoming.apLogoDisplayUrl || incoming.apLogoUrl || incoming.logo1 || resolvedBranding.apLogoUrl || '';
    const companyLogoUrl =
      incoming.companyLogoDisplayUrl ||
      incoming.companyLogoUrl ||
      incoming.logo2 ||
      resolvedBranding.companyLogoUrl ||
      '';
    // Provide multiple aliases to match backend template expectations.
    return {
      ...incoming,
      showTopLeftLogosInTermLoanCc: true,
      apLogoUrl: incoming.apLogoUrl || apLogoUrl,
      apLogoDisplayUrl: incoming.apLogoDisplayUrl || apLogoUrl,
      companyLogoUrl: incoming.companyLogoUrl || companyLogoUrl,
      companyLogoDisplayUrl: incoming.companyLogoDisplayUrl || companyLogoUrl,
      logo1: incoming.logo1 || apLogoUrl,
      logo2: incoming.logo2 || companyLogoUrl,
    };
  };

  // Initialize tempFormData from Redux if it exists on mount
  useEffect(() => {
    if (reduxFormData && Object.keys(reduxFormData).length > 0) {
      setTempFormData(reduxFormData);
    }
  }, [reduxFormData]);

  // Draft saving is EXPLICIT only (see SaveDraftButton). We intentionally do
  // NOT auto-save here: the previous debounced auto-save raced with the
  // "Generate" button and could rewrite the URL mid-pipeline. Explicit saves
  // never mutate the URL, so the generation flow is unaffected.

  useEffect(() => {
    if (templateId) {
      console.log('🎯 GeneratePage - fetching template:', templateId);
      dispatch(fetchTemplateById(templateId)).then(result => {
        console.log('📄 Template fetch result:', result);
      });
    }
    console.log('🧹 GeneratePage - clearing any existing Excel data for fresh start');
    dispatch(clearGeneratedExcel());
    // Only clear form data if it's a completely different template or No data exists
    // Actually, usually we clear it when entering from Dashboard for the first time.
    // However, if the user "comes back" to this page from elsewhere, we might want to keep it.
    // The user's specific complaint is about losing data when clicking "Back" in the generator itself.
    // So let's NOT clear form data on every mount if it exists.
    if (!reduxFormData || Object.keys(reduxFormData).length === 0) {
      dispatch(clearFormData());
    }
    dispatch(clearRelatedDocuments());
    generationRequestedRef.current = false;
    hasMounted.current = true;

    // Resume behavior: only load drafts when user comes from Drafts page with draftId.
    // Otherwise, always start fresh (no confirm prompt).
    if (!templateId || !user) {
      setDraftCheckComplete(true);
      return;
    }

    setDraftCheckComplete(false);

    if (!draftId) {
      setTempFormData(null);
      dispatch(clearFormData());
      setDraftCheckComplete(true);
      return;
    }

    dispatch(fetchDraftByIdV2(draftId))
      .unwrap()
      .then((draft) => {
        const data = draft?.formData;
        if (data && typeof data === 'object') {
          setTempFormData(data);
          dispatch(setFormData(data));
        }
      })
      .catch((err) => {
        console.log('Failed to load draft by id', err);
        toast.error('Failed to load draft. Please try again.');
      })
      .finally(() => setDraftCheckComplete(true));
  }, [templateId, draftId, dispatch, user]);

  useEffect(() => {
    if (!generationRequestedRef.current || !hasMounted.current) return;
    if (!generatedExcel?.success || !generatedExcel?.data) return;

    const htmlContent = generatedExcel.data.htmlContent;
    if (htmlContent) {
      setTimeout(() => {
        toast.success('Excel generated successfully!');
        const adminParam = searchParams.get('admin') === 'true' ? '&admin=true' : '';
        navigate(`/stage1?templateId=${templateId}${adminParam}`);
        generationRequestedRef.current = false;
        setIsProcessing(false);
      }, 100);
      return;
    }

    toast.error(
      'Report generated but preview is missing. Ensure Excel templates and the Python engine are installed on the server.'
    );
    generationRequestedRef.current = false;
    setIsProcessing(false);
  }, [generatedExcel, navigate, templateId, searchParams]);

  // Check if admin mode (no credits required)
  const isAdminMode = searchParams.get('admin') === 'true' && normalizeUserRole(user?.role) === 'admin';

  const handleFormSubmit = async (formData) => {
    // Stage 1: Capture Excel Form Data
    console.log('📝 [GeneratePage] Stage 1 Form Submit, saving to Redux:', formData);
    const { rawFormData: rawFromSubmit, ...submittedFormData } = formData || {};
    const hasRawFromSubmit =
      rawFromSubmit && typeof rawFromSubmit === 'object' && Object.keys(rawFromSubmit).length > 0;
    const latestRedux = store.getState().report.formData;
    const hasLatestRedux =
      latestRedux && typeof latestRedux === 'object' && Object.keys(latestRedux).length > 0;
    const rawFormData = hasRawFromSubmit
      ? rawFromSubmit
      : hasLatestRedux
        ? latestRedux
        : submittedFormData;

    // Keep raw form values for "Back to Form" and section prefill
    setTempFormData(rawFormData);
    dispatch(setFormData(rawFormData));

    // Keep submitted/transformed payload for backend generation
    setTempSubmittedData(submittedFormData);

    if (NON_AI_TEMPLATES.includes(templateId)) {
      // Non-AI templates (CC4, CC5, CC6): skip section selector, directly generate Excel
      console.log('⚡ [GeneratePage] Non-AI template detected, skipping ReportSectionSelector');
      setIsProcessing(true);
      generationRequestedRef.current = true;
      // #region agent log
      fetch('http://127.0.0.1:7384/ingest/fee4a383-4f25-45c3-bb64-8d6d21b935e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'92ac45'},body:JSON.stringify({sessionId:'92ac45',runId:'pre-fix',hypothesisId:'H1-H2',location:'GeneratePage.jsx:NON_AI_applyFormData',message:'Dispatch applyFormData (non-AI template)',data:{templateId:String(templateId||''),role:String(user?.role||''),hasCompanyId:!!user?.companyId,companyIdType:typeof user?.companyId,hasApLogoUrl:!!(user?.apLogoUrl||user?.apLogoDisplayUrl),hasCompanyLogoUrl:!!(user?.companyLogoUrl||user?.companyLogoDisplayUrl),payloadHasApLogoUrl:!!(submittedFormData?.apLogoUrl||submittedFormData?.apLogoDisplayUrl),payloadHasCompanyLogoUrl:!!(submittedFormData?.companyLogoUrl||submittedFormData?.companyLogoDisplayUrl)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      try {
        const finalWithLogos = await withTemplateLogos(submittedFormData);
        await dispatch(applyFormData({ templateId, formData: finalWithLogos })).unwrap();
      } catch (error) {
        generationRequestedRef.current = false;
        toast.error(formatApiErrorMessage(error, 'Failed to submit data for Excel generation.'));
        setIsProcessing(false);
      }
    } else {
      // AI templates: show section selector
      setShowSectionSelector(true);
      window.scrollTo(0, 0);
    }
  };

  const handleSectionSelectionSubmit = async (sectionData) => {
    // Stage 2: Combine all data and trigger generation
    setIsProcessing(true);
    generationRequestedRef.current = true;

    // Merge original form data with selected sections and prompts data
    // sectionData contains { selected_sections, prompts_data }
    const { related_documents, ...sectionDataWithoutDocs } = sectionData || {};
    const baseSubmissionData = tempSubmittedData || tempFormData || {};
    const finalFormData = {
      ...baseSubmissionData,
      ...sectionDataWithoutDocs
    };

    if (related_documents) {
      dispatch(setRelatedDocuments(related_documents));
    }

    // Save final merged data to Redux so it's available in Stage 1
    dispatch(setFormData(finalFormData));

    try {
      const finalWithLogos = await withTemplateLogos(finalFormData);
      // #region agent log
      fetch('http://127.0.0.1:7384/ingest/fee4a383-4f25-45c3-bb64-8d6d21b935e9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'92ac45'},body:JSON.stringify({sessionId:'92ac45',runId:'pre-fix',hypothesisId:'H1-H2',location:'GeneratePage.jsx:AI_applyFormData',message:'Dispatch applyFormData (AI template)',data:{templateId:String(templateId||''),role:String(user?.role||''),hasCompanyId:!!user?.companyId,hasApLogoUrl:!!(user?.apLogoUrl||user?.apLogoDisplayUrl),hasCompanyLogoUrl:!!(user?.companyLogoUrl||user?.companyLogoDisplayUrl),payloadHasApLogoUrl:!!(finalFormData?.apLogoUrl||finalFormData?.apLogoDisplayUrl),payloadHasCompanyLogoUrl:!!(finalFormData?.companyLogoUrl||finalFormData?.companyLogoDisplayUrl)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      await dispatch(applyFormData({ templateId, formData: finalWithLogos })).unwrap();
    } catch (error) {
      generationRequestedRef.current = false;
      toast.error(formatApiErrorMessage(error, 'Failed to submit data for Excel generation.'));
      setIsProcessing(false);
    }
  };

  const handleFormDataChange = (rawFormData) => {
    console.log('💾 [GeneratePage] Saving raw form data to Redux:', rawFormData);
    dispatch(setFormData(rawFormData));
  };

  const handleBackToDashboard = () => {
    if (isAdminMode) {
      navigate('/admin/generate');
    } else {
      navigate(generateHubLandingPath(user?.role));
    }
  };

  if (!templateId) {
    return (
      <GenerateStandaloneLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="text-center max-w-md">
            <div className="text-4xl text-red-400 mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Template Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              Please select a template from the dashboard first.
            </p>
            <Button onClick={() => navigate(generateHubLandingPath(user?.role))} variant="primary">
              <ArrowLeftIcon className="w-4 h-4 inline mr-2" />
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </GenerateStandaloneLayout>
    );
  }

  if (loading) {
    return (
      <GenerateStandaloneLayout>
        <div className="flex justify-center py-24">
          <Loading text="Loading template..." />
        </div>
      </GenerateStandaloneLayout>
    );
  }

  if (!draftCheckComplete) {
    return (
      <GenerateStandaloneLayout>
        <div className="flex justify-center py-24">
          <Loading text="Checking saved draft..." />
        </div>
      </GenerateStandaloneLayout>
    );
  }

  return (
    <GenerateStandaloneLayout withFonts>
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="text-center max-w-sm">
            <Loading text="Processing your request..." />
            <p className="text-gray-600 mt-2 text-sm">Generating report...</p>
          </Card>
        </div>
      )}

      <div className="px-0 sm:px-2 py-4">
        {/* Back Button */}
        <button
          onClick={() => showSectionSelector ? setShowSectionSelector(false) : handleBackToDashboard()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>{showSectionSelector ? 'Back to Form' : 'Back to Dashboard'}</span>
        </button>

        {showSectionSelector ? (
          <ReportSectionSelector
            onBack={() => setShowSectionSelector(false)}
            onSubmit={handleSectionSelectionSubmit}
            initialData={{ prompts_data: tempFormData }}
          />
        ) : (
          <>

            {/* Page Title */}
            <div className="mb-6">
              <h1 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-3xl font-bold text-gray-900 mb-2">
                Generate Report
              </h1>
              <p className="text-gray-600 text-sm">
                Kindly provide the required details below to facilitate Report preparation
              </p>
            </div>

            {/* Template Information */}
            {/* {template && (
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="font-semibold text-gray-800 mb-3 text-sm">
                  Template Details
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900">{template.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID:</span>
                    <span className="font-medium text-purple-600">{template.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium text-gray-900">{template.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Author:</span>
                    <span className="font-medium text-gray-900">{template.author}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="font-semibold text-gray-800 mb-3 text-sm">
                  Properties
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  {template.properties &&
                    Object.entries(template.properties).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium text-gray-900">{value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>
        )} */}

            {/* Template Forms */}
            {(templateId === 'frcc1' || templateId === 'Format CC1') && (
              <FRCC1Form
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
              />
            )}
            {(templateId === 'frcc2' || templateId === 'Format CC2') && (
              <FRCC2Form
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
              />
            )}
            {(templateId === 'frcc3' || templateId === 'Format CC3') && (
              <FRCC3Form
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
              />
            )}
            {(templateId === 'frcc4' || templateId === 'Format CC4') && (
              <FRCC4Form
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
              />
            )}
            {(templateId === 'frcc5' || templateId === 'Format CC5') && (
              <FRCC5Form
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
              />
            )}
            {(templateId === 'frcc6' || templateId === 'Format CC6') && (
              <FRCC6Form
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
              />
            )}
            {(templateId === 'frcc7' || templateId === 'Format CC7') && (
              <FRCC7Form
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
              />
            )}
            {(templateId === 'TERM_LOAN_SERVICE_WITHOUT_STOCK') && (
              <FRTermLoanForm
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
                presetSector={presetSector}
                lockSector={lockSector}
              />
            )}
            {(templateId === 'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK') && (
              <FRTermLoanWithStockForm
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
                presetSector={presetSector}
                lockSector={lockSector}
              />
            )}
            {(templateId === 'TERM_LOAN_CC') && (
              <FRTermLoanCCForm
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
                presetSector={presetSector}
                lockSector={lockSector}
              />
            )}
            {templateId &&
              templateId !== 'frcc1' && templateId !== 'Format CC1' &&
              templateId !== 'frcc2' && templateId !== 'Format CC2' &&
              templateId !== 'frcc3' && templateId !== 'Format CC3' &&
              templateId !== 'frcc4' && templateId !== 'Format CC4' &&
              templateId !== 'frcc5' && templateId !== 'Format CC5' &&
              templateId !== 'frcc6' && templateId !== 'Format CC6' &&
              templateId !== 'frcc7' && templateId !== 'Format CC7' &&
              templateId !== 'TERM_LOAN_SERVICE_WITHOUT_STOCK' &&
              templateId !== 'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK' &&
              templateId !== 'TERM_LOAN_CC' && (
                <Card className="mb-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🚧</div>
                    <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-xl font-bold text-gray-800 mb-2">
                      Form Under Development
                    </h3>
                    <p className="text-gray-600 mb-1">Form for {templateId} is under development.</p>
                    <p className="text-sm text-gray-500">Please select Format CC1 through CC7.</p>
                  </div>
                </Card>
              )}
            {!templateId && (
              <Card className="mb-6">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 style={{ fontFamily: 'Manrope, sans-serif' }} className="text-xl font-bold text-gray-800 mb-2">
                    No Template Selected
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Please select a template from the dashboard first.
                  </p>
                  <Button onClick={() => navigate(generateHubLandingPath(user?.role))} variant="primary">
                    <ArrowLeftIcon className="w-4 h-4 inline mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </GenerateStandaloneLayout>
  );
};

export default GeneratePage;
