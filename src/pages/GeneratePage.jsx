/**
 * Generate Page
 * Form submission and Excel generation
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks';
import finvoisLogo from '../assets/finvois.png';
import {
  fetchTemplateById,
  selectSelectedTemplate,
  selectTemplateLoading,
} from '../store/slices/templateSlice';
import {
  applyFormData,
  createReport,
  selectGeneratedExcel,
  selectReportLoading,
  clearGeneratedExcel,
  setFormData,
  setRelatedDocuments,
  clearFormData,
  clearRelatedDocuments,
  selectFormData,
} from '../store/slices/reportSlice';
import { Button, Card, Loading } from '../components/common';
import FRCC1Form from '../components/forms/FRCC1Form';
import FRCC2Form from '../components/forms/FRCC2Form';
import FRCC3Form from '../components/forms/FRCC3Form';
import FRCC4Form from '../components/forms/FRCC4Form';
import FRCC5Form from '../components/forms/FRCC5Form';
import FRCC6Form from '../components/forms/FRCC6Form';
import FRTermLoanForm from '../components/forms/FRTermLoanForm';
import FRTermLoanWithStockForm from '../components/forms/FRTermLoanWithStockForm';
import FRTermLoanCCForm from '../components/forms/FRTermLoanCCForm';
import ReportSectionSelector from '../components/forms/ReportSectionSelector';
import { reportAPI } from '../api/endpoints';
import { downloadFile } from '../utils';
import toast from 'react-hot-toast';
import { DocumentTextIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import AIAssistant from '../components/dashboard/AIAssistant';

// Templates that don't have AI generation — skip report section selection
const NON_AI_TEMPLATES = [
  'frcc1', 'Format CC1',
  'frcc2', 'Format CC2',
  'frcc3', 'Format CC3',
  'frcc4', 'Format CC4',
  'frcc5', 'Format CC5',
  'frcc6', 'Format CC6',
];

const GeneratePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  console.log('🎯 GeneratePage - user info:', user);

  const templateId = searchParams.get('templateId');
  const template = useSelector(selectSelectedTemplate);
  const generatedExcel = useSelector(selectGeneratedExcel);
  const loading = useSelector(selectTemplateLoading);
  const reportLoading = useSelector(selectReportLoading);
  const reduxFormData = useSelector(selectFormData);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSectionSelector, setShowSectionSelector] = useState(false);
  const [tempFormData, setTempFormData] = useState(null);
  const [tempSubmittedData, setTempSubmittedData] = useState(null);
  const hasMounted = useRef(false);
  const generationRequestedRef = useRef(false);

  // Initialize tempFormData from Redux if it exists on mount
  useEffect(() => {
    if (reduxFormData && Object.keys(reduxFormData).length > 0) {
      setTempFormData(reduxFormData);
    }
  }, [reduxFormData]);

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
  }, [templateId, dispatch]);

  const handleExcelGenerated = useCallback(async () => {
    try {
      console.log('🎯 [handleExcelGenerated] Starting background report creation process', user);

      if (!user || (!user.id && !user._id)) {
        console.error('❌ [handleExcelGenerated] User not available for report creation');
        console.log('🔍 [handleExcelGenerated] User object:', user);
        return;
      }

      let bankName, branchName;
      if (reduxFormData?.formData?.additionalData) {
        bankName = reduxFormData.formData.additionalData.bank_name;
        branchName = reduxFormData.formData.additionalData.branch_name;
      } else if (reduxFormData?.formData?.formData?.["General Information"]) {
        bankName = reduxFormData.formData.formData["General Information"].bank_name;
        branchName = reduxFormData.formData.formData["General Information"].branch_name;
      }

      const reportData = {
        title: template?.name || 'Generated Report',
        templateId: templateId,
        user_id: user.id || user._id,
        status: 'completed',
        bank_name: bankName,
        branch_name: branchName
      };

      console.log('📝 [handleExcelGenerated] Creating report with data (background):', reportData);
      const createdReport = await dispatch(createReport(reportData)).unwrap();
      console.log('✅ [handleExcelGenerated] Report created successfully in background, ID:', createdReport._id);

    } catch (error) {
      console.error('❌ [handleExcelGenerated] Background report creation error:', error);
      console.log('❌ [handleExcelGenerated] Error message:', error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [templateId, template, user, dispatch]);

  useEffect(() => {
    if (
      generationRequestedRef.current &&
      generatedExcel &&
      generatedExcel.data &&
      generatedExcel.data.htmlContent &&
      hasMounted.current
    ) {
      console.log('📢 [GeneratePage.useEffect] generatedExcel updated in Redux');
      console.log('📢 [GeneratePage.useEffect] generatedExcel object:', {
        success: generatedExcel?.success,
        message: generatedExcel?.message,
        hasData: !!generatedExcel?.data,
        fileName: generatedExcel?.data?.fileName,
        htmlContentLength: generatedExcel?.data?.htmlContent?.length
      });

      console.log('🚀 [GeneratePage.useEffect] Scheduling navigation in 100ms to ensure Redux state is stable');
      setTimeout(() => {
        console.log('🚀 [GeneratePage.useEffect] Navigating to Stage1 with Excel data');
        toast.success('Excel generated successfully!');
        // Pass admin flag to Stage1 if present
        const adminParam = searchParams.get('admin') === 'true' ? '&admin=true' : '';
        navigate(`/stage1?templateId=${templateId}${adminParam}`);
        generationRequestedRef.current = false;
        setIsProcessing(false);
      }, 100);
    }
  }, [generatedExcel, handleExcelGenerated, navigate, templateId, searchParams]);

  // Check if admin mode (no credits required)
  const isAdminMode = searchParams.get('admin') === 'true' && (user?.role === 'admin' || user?.role === 'super_admin');

  const handleFormSubmit = (formData) => {
    // Stage 1: Capture Excel Form Data
    console.log('📝 [GeneratePage] Stage 1 Form Submit, saving to Redux:', formData);
    const hasRawFormData = reduxFormData && Object.keys(reduxFormData).length > 0;
    const rawFormData = hasRawFormData ? reduxFormData : formData;

    // Keep raw form values for "Back to Form" and section prefill
    setTempFormData(rawFormData);
    dispatch(setFormData(rawFormData));

    // Keep submitted/transformed payload for backend generation
    setTempSubmittedData(formData);

    if (NON_AI_TEMPLATES.includes(templateId)) {
      // Non-AI templates (CC4, CC5, CC6): skip section selector, directly generate Excel
      console.log('⚡ [GeneratePage] Non-AI template detected, skipping ReportSectionSelector');
      setIsProcessing(true);
      generationRequestedRef.current = true;
      dispatch(applyFormData({ templateId, formData })).unwrap()
        .catch((error) => {
          generationRequestedRef.current = false;
          toast.error(error || 'Failed to generate Excel');
          setIsProcessing(false);
        });
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
      await dispatch(applyFormData({ templateId, formData: finalFormData })).unwrap();
    } catch (error) {
      generationRequestedRef.current = false;
      toast.error(error || 'Failed to generate Excel');
      setIsProcessing(false);
    }
  };

  const handleFormDataChange = (rawFormData) => {
    console.log('💾 [GeneratePage] Saving raw form data to Redux:', rawFormData);
    dispatch(setFormData(rawFormData));
  };

  const handleBackToDashboard = () => {
    // Navigate back to appropriate dashboard based on user role
    if (isAdminMode) {
      navigate('/admin/generate');
    } else if (user?.role === 'agent') {
      navigate('/agent/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleMyReports = () => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      navigate('/admin/reports');
    } else if (user?.role === 'agent') {
      navigate('/agent/reports');
    } else {
      navigate('/reports');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (!templateId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F8FF' }}>
        <Card className="text-center max-w-md">
          <div className="text-4xl text-red-400 mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Template Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            Please select a template from the dashboard first.
          </p>
          <Button onClick={() => user?.role === 'agent' ? navigate('/agent/dashboard') : navigate('/dashboard')} variant="primary">
            <ArrowLeftIcon className="w-4 h-4 inline mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <Loading fullScreen text="Loading template..." />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F8FF' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Manrope', sans-serif;
        }
        
        body, input, select, textarea, button {
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="text-center max-w-sm">
            <Loading text="Processing your request..." />
            <p className="text-gray-600 mt-2 text-sm">Generating Excel report...</p>
          </Card>
        </div>
      )}

      {/* Header - Matching Screenshot */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40" style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
        <div className="max-w-full px-6">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <img
                src={finvoisLogo}
                alt="Finvois Logo"
                className="h-10 w-auto"
              />

            </button>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* My Reports Button */}
              <button
                onClick={handleMyReports}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#9333EA] text-white rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <ChartBarIcon className="w-4 h-4" />
                <span>My Reports</span>
              </button>

              {/* User Profile */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {user?.name?.charAt(0) || 'R'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {user?.name || 'Ramesh'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors px-3"
              >
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
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
                Fill in the form below to generate your professional Excel report
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
            {(templateId === 'TERM_LOAN_SERVICE_WITHOUT_STOCK') && (
              <FRTermLoanForm
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
              />
            )}
            {(templateId === 'TERM_LOAN_MANUFACTURING_SERVICE_WITH_STOCK') && (
              <FRTermLoanWithStockForm
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
              />
            )}
            {(templateId === 'TERM_LOAN_CC') && (
              <FRTermLoanCCForm
                onSubmit={handleFormSubmit}
                templateId={templateId}
                onFormDataChange={handleFormDataChange}
                isProcessing={isProcessing}
                initialData={tempFormData}
              />
            )}
            {templateId &&
              templateId !== 'frcc1' && templateId !== 'Format CC1' &&
              templateId !== 'frcc2' && templateId !== 'Format CC2' &&
              templateId !== 'frcc3' && templateId !== 'Format CC3' &&
              templateId !== 'frcc4' && templateId !== 'Format CC4' &&
              templateId !== 'frcc5' && templateId !== 'Format CC5' &&
              templateId !== 'frcc6' && templateId !== 'Format CC6' &&
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
                    <p className="text-sm text-gray-500">Please select Format CC1 through CC6.</p>
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
                  <Button onClick={() => user?.role === 'agent' ? navigate('/agent/generate') : navigate('/dashboard')} variant="primary">
                    <ArrowLeftIcon className="w-4 h-4 inline mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default GeneratePage;
