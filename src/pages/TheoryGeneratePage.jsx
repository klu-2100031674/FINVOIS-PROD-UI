/**
 * Theory Page generation:
 * 1) General Information
 * 2) Project Profile and Analysis (same SectionSelectors as Reports)
 * 3) Next → AI-only multi-section PDF → validation queue (no payment)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { AdminLayout } from '../components/layouts';
import ClientLayout from '../components/layouts/ClientLayout';
import { ReportGenerationModal } from '../components/common';
import TheoryGeneralInformationForm, {
  THEORY_GI_DEFAULT,
} from '../components/forms/TheoryGeneralInformationForm';
import ManufacturingSectionSelector from '../components/forms/ManufacturingSectionSelector';
import TradingSectionSelector from '../components/forms/TradingSectionSelector';
import ServiceWithStockSectionSelector from '../components/forms/ServiceWithStockSectionSelector';
import ServiceWithoutStockSectionSelector from '../components/forms/ServiceWithoutStockSectionSelector';
import {
  getTheoryPageTemplateById,
  isTheoryTemplateId,
} from '../utils/theoryPageTemplates';
import { buildSectionSelectorInitialData } from '../utils/draftPayload';
import { theoryPagesHubPath } from '../utils/routePaths';
import { effectiveUserRole } from '../utils/normalizeUserRole';
import { useAuth } from '../hooks';
import { reportAPI } from '../api/endpoints';
import { setFormData, clearFormData } from '../store/slices/reportSlice';
import { formatApiErrorMessage } from '../utils';

const CATEGORY_SELECTORS = {
  manufacturing: ManufacturingSectionSelector,
  trading: TradingSectionSelector,
  service_with_stock: ServiceWithStockSectionSelector,
  service_without_stock: ServiceWithoutStockSectionSelector,
};

const TheoryGeneratePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const role = effectiveUserRole(user);

  const templateId = searchParams.get('templateId') || '';
  const useAdminLayout = role === 'admin' || role === 'company_admin';

  const template = useMemo(() => getTheoryPageTemplateById(templateId), [templateId]);
  const category = template?.category;
  const CategorySectionSelector = category ? CATEGORY_SELECTORS[category] : null;

  const [step, setStep] = useState(1);
  const [gi, setGi] = useState({ ...THEORY_GI_DEFAULT });
  const [isGenerating, setIsGenerating] = useState(false);

  const hubPath = theoryPagesHubPath(user);

  useEffect(() => {
    dispatch(clearFormData());
    if (!template) return;
    setGi((prev) => ({
      ...prev,
      i14: template.sectorLabel || prev.i14,
    }));
  }, [dispatch, template]);

  const fillGiTestData = useCallback(() => {
    const sector = template?.sectorLabel || 'Manufacturing';
    setGi({
      i7: 'Sole Proprietorship',
      i8: 'PARVEZ ALI NARAYANA',
      i9: '9876543210',
      i10: '123456789012',
      i11: 'ABCDE1234F',
      i12: '35',
      i13: 'Male',
      i14: sector,
      i15:
        category === 'manufacturing'
          ? 'Paper Plate Manufacturing'
          : category === 'trading'
            ? 'Wholesale Trading of FMCG'
            : category === 'service_with_stock'
              ? 'Automobile Service with Spare Parts Stock'
              : 'IT Consulting Services',
      i16: '17-3-47, Thadepalli Center, Vijayawada',
      residential_address: '12-5-30, Brodipet, Guntur',
      i17: 'PARVEZ ALI NARAYANA Solutions',
      i18: 'FGHIJ5678K',
      i19: 'Graduate',
      i20: 'Other MSME',
      i21: 'OC',
      i22: 'Urban(Other than Panchayat)',
      bank_name: 'SBI',
      branch_name: 'Main Branch',
    });
    toast.success('Test data filled');
  }, [template, category]);

  const stage1Blob = useMemo(
    () => ({
      'General Information': { ...gi },
      bank_name: gi.bank_name,
      branch_name: gi.branch_name,
    }),
    [gi]
  );

  const sectionInitialData = useMemo(
    () => buildSectionSelectorInitialData(stage1Blob),
    [stage1Blob]
  );

  const validateStep1 = () => {
    if (!gi.i8?.trim()) {
      toast.error('Name of Authorised Person is required');
      return false;
    }
    if (!gi.i14?.trim()) {
      toast.error('Sector is required');
      return false;
    }
    if (!gi.i15?.trim()) {
      toast.error('Nature of Business is required');
      return false;
    }
    if (!gi.i17?.trim()) {
      toast.error('Name of firm/Company is required');
      return false;
    }
    return true;
  };

  const handleContinueToProfile = () => {
    if (!validateStep1()) return;
    setStep(2);
    window.scrollTo(0, 0);
  };

  const buildPayload = useCallback(
    (sectionData) => {
      const { related_documents, ...rest } = sectionData || {};
      return {
        'General Information': { ...gi },
        ...rest,
        content_kind: 'theory',
        theory_category: category,
        bank_name: gi.bank_name,
        branch_name: gi.branch_name,
        ...(related_documents ? { related_documents } : {}),
      };
    },
    [gi, category]
  );

  const runGenerate = async (formPayload) => {
    setIsGenerating(true);
    try {
      const result = await reportAPI.generateTheoryPage(templateId, formPayload, {
        isAdmin: true,
      });
      if (result?.success) {
        toast.success('Theory pages generated and submitted for validation');
        navigate('/report-ready', {
          state: {
            report_id: result.data?.report_id,
            validation_status: result.data?.validation_status,
            message:
              result.data?.message ||
              'Your theory pages have been submitted for validation.',
          },
        });
        return;
      }
      throw new Error(result?.error || 'Theory page generation failed');
    } catch (error) {
      toast.error(formatApiErrorMessage(error, 'Failed to generate theory pages'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleProfileSubmit = async (sectionData) => {
    const payload = buildPayload(sectionData);
    dispatch(setFormData(payload));
    await runGenerate(payload);
  };

  if (!isTheoryTemplateId(templateId) || !template || !CategorySectionSelector) {
    const missing = (
      <div className="p-6 max-w-lg mx-auto text-center">
        <p className="text-gray-600 mb-4">Invalid or missing theory page template.</p>
        <button
          type="button"
          onClick={() => navigate(hubPath)}
          className="text-teal-700 font-medium hover:underline"
        >
          Back to Theory Pages
        </button>
      </div>
    );
    return useAdminLayout ? (
      <AdminLayout>{missing}</AdminLayout>
    ) : (
      <ClientLayout>{missing}</ClientLayout>
    );
  }

  const body = (
    <div className="p-6 max-w-5xl mx-auto">
      {step === 1 && (
        <button
          type="button"
          onClick={() => navigate(hubPath)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Theory Pages
        </button>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-teal-100 rounded-lg">
          <BookOpen className="w-6 h-6 text-teal-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-['Manrope']">
            {template.title} — Theory Pages
          </h1>
          <p className="text-sm text-gray-500">
            Step {step} of 2 —{' '}
            {step === 1 ? 'General Information' : 'Project Profile and Analysis'}
          </p>
        </div>
      </div>

      {step === 1 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1 font-['Manrope']">
                General Information
              </h2>
              <p className="text-sm text-gray-500">
                Shared project context used for AI theory pages. Extra template-specific questions
                belong here.
              </p>
            </div>
            <button
              type="button"
              onClick={fillGiTestData}
              className="shrink-0 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              Fill Test Data
            </button>
          </div>
          <TheoryGeneralInformationForm
            value={gi}
            onChange={(key, v) => setGi((prev) => ({ ...prev, [key]: v }))}
            lockSector={false}
          />
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleContinueToProfile}
              className="px-5 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
            >
              Continue to Project Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <CategorySectionSelector
            key={`theory-profile-${category}-${gi.i17 || gi.i8 || 'new'}`}
            initialData={sectionInitialData}
            isVisible
            onBack={() => {
              setStep(1);
              window.scrollTo(0, 0);
            }}
            onSubmit={handleProfileSubmit}
            templateId={templateId}
          />
          {isGenerating && (
            <div className="mt-4 flex items-center gap-2 text-sm text-teal-800">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating theory pages…
            </div>
          )}
        </div>
      )}

      <ReportGenerationModal isOpen={isGenerating} />
    </div>
  );

  return useAdminLayout ? <AdminLayout>{body}</AdminLayout> : <ClientLayout>{body}</ClientLayout>;
};

export default TheoryGeneratePage;
