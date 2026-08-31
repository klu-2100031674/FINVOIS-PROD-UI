import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  FileDown,
  Loader2,
  Sparkles,
  ClipboardList,
  Home,
  Briefcase,
  IdCard,
  Receipt,
  FolderCheck,
  Building2,
  Landmark,
  ImageUp,
  ClipboardCheck,
  CheckCircle2,
  CircleDot,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuth from '../../../hooks/useAuth';
import { useExecutiveDraft } from '../../../hooks/useExecutiveDraft';
import { useBoiVerification } from '../../../context/BoiVerificationContext';
import { executiveDashboardPath } from '../../../utils/routePaths';
import {
  MODULE_KEYS,
  isModuleApplicable,
  labelApplicants,
  validateBoiCaseForGenerate,
} from '../../../utils/boi/boiVerificationSchema';
import { getBoiTestCase } from '../../../utils/boi/boiTestData';
import { Button } from '../../common';

const STEPS = [
  { key: 'case', label: 'Case Details', icon: Landmark },
  { key: 'general', label: 'General', icon: ClipboardList },
  { key: 'residence', label: 'Residence', icon: Home },
  { key: 'employment', label: 'Employment', icon: Briefcase },
  { key: 'pan', label: 'PAN', icon: IdCard },
  { key: 'salary', label: 'Salary', icon: Receipt },
  { key: 'documents', label: 'Documents', icon: FolderCheck },
  { key: 'business', label: 'Business', icon: Building2 },
  { key: 'property', label: 'Property', icon: Landmark },
  { key: 'evidence', label: 'Evidence', icon: ImageUp },
  { key: 'feedback', label: 'Feedback', icon: ClipboardCheck },
];

function formatINR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `₹${new Intl.NumberFormat('en-IN').format(n)}`;
}

export default function BoiModuleTopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, getProfile } = useAuth();
  
  const {
    caseData,
    cases,
    loadCaseData,
    applicants,
    activeApplicantId,
    loanType,
    setActiveApplicant,
    addCoApplicant,
    removeApplicant,
    saveDraftActiveCase,
    currentStep,
    setCurrentStep,
    fillAllTestData,
    setTriggerSubmit,
  } = useBoiVerification();

  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const { saveDraft, savingDraft } = useExecutiveDraft('boi', {
    onRestore: ({ form }) => {
      const restored = form?.caseData || form;
      if (restored?.modules) loadCaseData(restored);
    },
  });

  const currentStepKey = currentStep;

  const moduleState = useMemo(() => {
    if (!caseData || !activeApplicantId) return null;
    return caseData.modules?.[activeApplicantId] || null;
  }, [caseData, activeApplicantId]);

  const overallPct = useMemo(() => {
    if (!caseData || !activeApplicantId || !moduleState) return 0;
    const applicableKeys = MODULE_KEYS.filter((k) =>
      isModuleApplicable(moduleState, k, loanType || caseData.loanType)
    );
    const completedCount = applicableKeys.filter(
      (k) => moduleState?.[k]?.status === 'completed'
    ).length;
    return applicableKeys.length
      ? Math.round((completedCount / applicableKeys.length) * 100)
      : 0;
  }, [caseData, activeApplicantId, moduleState, loanType]);

  const handleSaveDraft = useCallback(async () => {
    if (!caseData) return;
    saveDraftActiveCase?.();
    try {
      await saveDraft({ caseData });
      toast.success('Draft saved successfully!');
    } catch (err) {
      toast.error('Saved locally. Cloud save failed.');
    }
  }, [caseData, saveDraft, saveDraftActiveCase]);

  const handleFillAllTestData = useCallback(async () => {
    fillAllTestData();
  }, [fillAllTestData]);

  const confirmDelete = () => {
    if (pendingDeleteId) {
      removeApplicant(pendingDeleteId);
      setPendingDeleteId(null);
      toast.success('Co-applicant removed');
    }
  };

  if (!caseData) return null;

  const labeled = labelApplicants(applicants);

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 sm:p-5 space-y-4 ring-1 ring-purple-50/50">
      {/* Row 1: Exit and Case Details / Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center flex-wrap gap-2.5 min-w-0">
          <button
            onClick={() => navigate(executiveDashboardPath(user))}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 h-4" />
            <span>Dashboard</span>
          </button>
          <span className="text-gray-300">•</span>
          <span className="font-mono text-xs font-bold text-[#7e22ce] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
            {caseData.id}
          </span>
          <span className="text-xs text-gray-500 font-medium truncate max-w-[200px] md:max-w-none">
            {caseData.loanType || 'No Loan Type'} ({caseData.branchName || 'No Branch'}) • {formatINR(caseData.loanAmount)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleFillAllTestData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-[#7e22ce] text-xs font-semibold hover:bg-purple-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fill Test Data</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const errors = validateBoiCaseForGenerate(caseData);
              if (errors.length) {
                toast.error(errors[0], { duration: 5000 });
                return;
              }
              setTriggerSubmit(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
              overallPct === 100
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={overallPct < 100}
            title={overallPct === 100 ? 'Submit report for validation' : 'Complete all modules to enable report'}
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Submit Report ({overallPct}%)</span>
          </button>
        </div>
      </div>

      {/* Row 2: Applicant Tab Switcher (Commented out) */}
      {/*
      <div className="flex flex-wrap items-center gap-2 border-t border-b border-gray-100 py-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Applicants:</span>
        {labeled.map((a) => {
          const active = a.id === activeApplicantId;
          const mods = caseData.modules[a.id];
          const appKeys = MODULE_KEYS.filter((k) => isModuleApplicable(mods, k, loanType || caseData.loanType));
          const done = appKeys.filter((k) => mods?.[k]?.status === 'completed').length;
          const pct = appKeys.length ? Math.round((done / appKeys.length) * 100) : 0;
          return (
            <div
              key={a.id}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'bg-[#7e22ce] text-white shadow-xs'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveApplicant(a.id)}
                className="font-semibold focus:outline-none"
              >
                {a.label} ({pct}%)
              </button>
              {!a.isPrimary && (
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(a.id)}
                  className={`ml-1 rounded-sm p-0.5 hover:bg-black/10 transition-colors ${
                    active ? 'text-white' : 'text-gray-400 hover:text-red-650'
                  }`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={addCoApplicant}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 hover:border-[#7e22ce] text-xs font-medium text-gray-500 hover:text-[#7e22ce] transition-all bg-white"
        >
          <Plus className="h-3 w-3" />
          <span>Add Co-Applicant</span>
        </button>
      </div>
      */}

      {/* Row 3: Progress Stepper */}
      <div className="relative flex items-center justify-between gap-1 overflow-x-auto py-2 px-1 scrollbar-thin select-none">
        {STEPS.map((step, index) => {
          const isCurrent = currentStepKey === step.key;
          const applicable = step.key === 'case' ? true : isModuleApplicable(moduleState, step.key, loanType || caseData.loanType);
          
          const isCaseDetailsComplete = (caseObj) => {
            return !!(
              caseObj &&
              caseObj.loanType &&
              String(caseObj.branchName || '').trim() &&
              caseObj.loanAmount &&
              Number(caseObj.loanAmount) > 0
            );
          };

          const status = step.key === 'case'
            ? (isCaseDetailsComplete(caseData) ? 'completed' : 'in_progress')
            : (moduleState?.[step.key]?.status ?? 'not_started');
          
          let statusColor = 'text-gray-400 border-gray-250 bg-white';
          const Icon = step.icon;
          let badgeContent = step.key === 'case'
            ? <Icon className="h-3.5 w-3.5" />
            : <span className="text-[10px] font-bold">{index}</span>;

          if (!applicable) {
            statusColor = 'text-gray-300 border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed';
            badgeContent = <span className="text-[9px] font-bold">N/A</span>;
          } else if (status === 'completed') {
            statusColor = 'text-emerald-600 border-emerald-500 bg-emerald-50';
            badgeContent = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
          } else if (status === 'in_progress') {
            statusColor = 'text-amber-600 border-amber-500 bg-amber-50';
            badgeContent = <CircleDot className="h-4 w-4 text-amber-500 animate-pulse" />;
          } else if (isCurrent) {
            statusColor = 'text-[#7e22ce] border-[#7e22ce] bg-purple-50 ring-2 ring-purple-200';
          }

          return (
            <React.Fragment key={step.key}>
              {/* Connecting Line */}
              {index > 0 && (
                <div
                  className={`flex-1 h-0.5 min-w-[12px] mx-1 md:mx-2 rounded-full transition-colors shrink-0 ${
                    applicable && (status === 'completed' || status === 'in_progress')
                      ? 'bg-emerald-400'
                      : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Step Button */}
              <button
                type="button"
                onClick={() => applicable && setCurrentStep(step.key)}
                disabled={!applicable}
                className={`flex flex-col items-center gap-1 text-center transition-all focus:outline-none shrink-0 ${
                  applicable ? 'hover:scale-105 active:scale-95' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-medium transition-all ${statusColor}`}
                >
                  {badgeContent}
                </div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    isCurrent
                      ? 'text-[#7e22ce] font-bold scale-105'
                      : applicable
                      ? 'text-gray-700 hover:text-gray-900'
                      : 'text-gray-300'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Co-Applicant Delete Confirmation Modal */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 animate-in fade-in duration-100">
            <h3 className="text-sm font-semibold text-gray-900">Remove co-applicant?</h3>
            <p className="text-xs text-gray-500 mt-2">
              All associated verification data for this co-applicant will be permanently removed.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" className="h-9 text-xs" onClick={() => setPendingDeleteId(null)}>
                Cancel
              </Button>
              <Button className="h-9 text-xs bg-red-650 hover:bg-red-750 text-white border-transparent" onClick={confirmDelete}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
