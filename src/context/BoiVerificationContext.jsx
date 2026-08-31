import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_BANK_NAME,
  deriveCaseStatus,
  emptyModules,
  generateCaseId,
} from '../utils/boi/boiVerificationSchema';
import { buildEmploymentNotes, buildResidenceNotes } from '../utils/boi/boiNoteHelpers';
import { getBoiTestCase } from '../utils/boi/boiTestData';
import { toast } from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

const STORAGE_KEY = 'executive_boi_cases';

function readStoredCases() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { cases: {}, caseOrder: [], activeCaseId: null };
    return JSON.parse(raw);
  } catch {
    return { cases: {}, caseOrder: [], activeCaseId: null };
  }
}

function writeStoredCases(cases, caseOrder, activeCaseId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cases, caseOrder, activeCaseId }));
  } catch {
    /* quota exceeded — ignore */
  }
}

function mergeModule(caseObj, applicantId, moduleKey, data, status) {
  const appMods = caseObj.modules[applicantId] ?? emptyModules();
  const current = appMods[moduleKey] ?? { status: 'not_started' };
  const existingPayload = current[moduleKey] ?? {};
  const merged = {
    ...current,
    status,
    [moduleKey]: { ...existingPayload, ...data },
  };
  return {
    ...caseObj,
    modules: {
      ...caseObj.modules,
      [applicantId]: { ...appMods, [moduleKey]: merged },
    },
  };
}

const BoiVerificationContext = createContext(null);

export function BoiVerificationProvider({ children, initialCaseId = null }) {
  const { user, getProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const draftIdParam = searchParams.get('draftId');

  const stored = readStoredCases();
  const [cases, setCases] = useState(stored.cases ?? {});
  const [caseOrder, setCaseOrder] = useState(stored.caseOrder ?? []);

  const [activeCaseId, setActiveCaseId] = useState(() => {
    if (initialCaseId) return initialCaseId;
    if (draftIdParam) return stored.activeCaseId ?? null;
    return null;
  });

  const caseData = activeCaseId ? cases[activeCaseId] ?? null : null;
  const applicants = caseData?.applicants ?? [];
  const activeApplicantId = caseData?.activeApplicantId ?? '';
  const loanType = caseData?.loanType ?? '';

  const isCaseDetailsComplete = useCallback((caseObj) => {
    return !!(
      caseObj &&
      caseObj.loanType &&
      String(caseObj.branchName || '').trim() &&
      caseObj.loanAmount &&
      Number(caseObj.loanAmount) > 0
    );
  }, []);

  const [currentStep, setCurrentStep] = useState(() => {
    if (initialCaseId) {
      const activeCase = stored.cases[initialCaseId];
      return activeCase && activeCase.loanType && String(activeCase.branchName || '').trim() && activeCase.loanAmount ? 'general' : 'case';
    }
    if (draftIdParam && stored.activeCaseId) {
      const activeCase = stored.cases[stored.activeCaseId];
      return activeCase && activeCase.loanType && String(activeCase.branchName || '').trim() && activeCase.loanAmount ? 'general' : 'case';
    }
    return 'case';
  });

  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [triggerSubmit, setTriggerSubmit] = useState(false);

  const persist = useCallback((nextCases, nextOrder, nextActiveId) => {
    setCases(nextCases);
    setCaseOrder(nextOrder);
    if (nextActiveId !== undefined) setActiveCaseId(nextActiveId);
    writeStoredCases(nextCases, nextOrder, nextActiveId ?? activeCaseId);
  }, [activeCaseId]);

  const updateCase = useCallback(
    (mutator) => {
      if (!activeCaseId) return;
      const current = cases[activeCaseId];
      if (!current) return;
      const updated = mutator(current);
      const withStatus = { ...updated, status: deriveCaseStatus(updated) };
      const nextCases = { ...cases, [activeCaseId]: withStatus };
      persist(nextCases, caseOrder);
      return withStatus;
    },
    [activeCaseId, cases, caseOrder, persist]
  );

  const createCase = useCallback(
    ({ loanType: lt, branchName, loanAmount, bankName }) => {
      const id = generateCaseId(cases);
      const primaryId = 'primary';
      const newCase = {
        id,
        loanType: lt,
        bankName: bankName?.trim() || DEFAULT_BANK_NAME,
        branchName,
        loanAmount,
        createdAt: new Date().toISOString(),
        status: 'draft',
        applicants: [{ id: primaryId, isPrimary: true }],
        activeApplicantId: primaryId,
        modules: { [primaryId]: emptyModules() },
      };
      const nextCases = { ...cases, [id]: newCase };
      const nextOrder = [id, ...caseOrder.filter((x) => x !== id)];
      persist(nextCases, nextOrder, id);
      setCurrentStep('general');
      return id;
    },
    [cases, caseOrder, persist]
  );

  const updateCaseDetails = useCallback(
    (details) => {
      updateCase((c) => ({
        ...c,
        loanType: details.loanType ?? c.loanType,
        bankName: details.bankName ?? c.bankName,
        branchName: details.branchName ?? c.branchName,
        loanAmount: details.loanAmount ?? c.loanAmount,
      }));
    },
    [updateCase]
  );

  const saveModule = useCallback(
    (moduleKey, data, status, applicantIdOverride) => {
      const appId = applicantIdOverride ?? activeApplicantId;
      if (!appId) return;
      updateCase((c) => mergeModule(c, appId, moduleKey, data, status));
    },
    [activeApplicantId, updateCase]
  );

  const setActiveApplicant = useCallback(
    (id) => {
      updateCase((c) => ({ ...c, activeApplicantId: id }));
    },
    [updateCase]
  );

  const addCoApplicant = useCallback(() => {
    updateCase((c) => {
      const MAX = 3;
      if (c.applicants.length >= MAX) return c;
      const n = c.applicants.filter((a) => !a.isPrimary).length + 1;
      const newId = `co_${n}`;
      return {
        ...c,
        activeApplicantId: newId,
        applicants: [...c.applicants, { id: newId, isPrimary: false }],
        modules: { ...c.modules, [newId]: emptyModules() },
      };
    });
  }, [updateCase]);

  const removeApplicant = useCallback(
    (id) => {
      updateCase((c) => {
        if (id === 'primary') return c;
        const nextApplicants = c.applicants.filter((a) => a.id !== id);
        const nextModules = { ...c.modules };
        delete nextModules[id];
        const nextActive =
          c.activeApplicantId === id ? nextApplicants[0]?.id ?? '' : c.activeApplicantId;
        return { ...c, applicants: nextApplicants, modules: nextModules, activeApplicantId: nextActive };
      });
    },
    [updateCase]
  );

  const saveDraftActiveCase = useCallback(() => {
    updateCase((c) => ({ ...c, status: 'draft' }));
  }, [updateCase]);

  const flushCase = useCallback(async () => {
    if (activeCaseId) writeStoredCases(cases, caseOrder, activeCaseId);
  }, [activeCaseId, cases, caseOrder]);

  const uploadCaSignature = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ dataUrl: String(reader.result ?? ''), storagePath: '' });
      };
      reader.onerror = () => reject(new Error('Failed to read signature file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const generateResidenceNotes = useCallback(async (input) => {
    return { notes: buildResidenceNotes(input) };
  }, []);

  const generateEmploymentNotes = useCallback(async (input) => {
    return { notes: buildEmploymentNotes(input) };
  }, []);

  const loadCaseData = useCallback(
    (caseObj) => {
      if (!caseObj) return;
      const id = caseObj.id || generateCaseId(cases);
      const normalized = {
        ...caseObj,
        id,
        status: deriveCaseStatus({ ...caseObj, id }),
      };
      const nextCases = { ...cases, [id]: normalized };
      const nextOrder = caseOrder.includes(id) ? caseOrder : [id, ...caseOrder.filter((x) => x !== id)];
      persist(nextCases, nextOrder, id);
      setCurrentStep(isCaseDetailsComplete(normalized) ? 'general' : 'case');
      return id;
    },
    [cases, caseOrder, persist, isCaseDetailsComplete]
  );

  const fillAllTestData = useCallback(async () => {
    try {
      const profile = (await getProfile?.()) || user;
      const testCase = getBoiTestCase(profile, cases);
      let targetId = activeCaseId;
      if (caseData?.id) {
        const normalized = {
          ...testCase,
          id: caseData.id,
          loanType: caseData.loanType || testCase.loanType,
          bankName: caseData.bankName || testCase.bankName,
          branchName: caseData.branchName || testCase.branchName,
          loanAmount: caseData.loanAmount || testCase.loanAmount,
          status: 'in_progress',
        };
        const nextCases = { ...cases, [caseData.id]: normalized };
        persist(nextCases, caseOrder);
      } else {
        targetId = loadCaseData(testCase);
      }
      setCurrentStep('general');
      toast.success('Test data filled — entire case populated.');
    } catch (err) {
      toast.error('Failed to populate test data.');
    }
  }, [caseData, cases, caseOrder, activeCaseId, getProfile, user, loadCaseData, persist]);

  const value = useMemo(
    () => ({
      caseData,
      cases,
      caseOrder,
      activeCaseId,
      applicants,
      activeApplicantId,
      loanType,
      currentStep,
      setCurrentStep,
      fillAllTestData,
      createCase,
      updateCaseDetails,
      saveModule,
      setActiveApplicant,
      addCoApplicant,
      removeApplicant,
      saveDraftActiveCase,
      flushCase,
      uploadCaSignature,
      generateResidenceNotes,
      generateEmploymentNotes,
      loadCaseData,
      isSubmittingReport,
      setIsSubmittingReport,
      triggerSubmit,
      setTriggerSubmit,
      loadCase: (id) => {
        if (cases[id]) {
          persist(cases, caseOrder, id);
          setCurrentStep(isCaseDetailsComplete(cases[id]) ? 'general' : 'case');
        }
      },
    }),
    [
      caseData,
      cases,
      caseOrder,
      activeCaseId,
      applicants,
      activeApplicantId,
      loanType,
      currentStep,
      fillAllTestData,
      createCase,
      updateCaseDetails,
      saveModule,
      setActiveApplicant,
      addCoApplicant,
      removeApplicant,
      saveDraftActiveCase,
      flushCase,
      uploadCaSignature,
      generateResidenceNotes,
      generateEmploymentNotes,
      loadCaseData,
      persist,
      isCaseDetailsComplete,
      isSubmittingReport,
      triggerSubmit,
    ]
  );

  return (
    <BoiVerificationContext.Provider value={value}>{children}</BoiVerificationContext.Provider>
  );
}

export function useBoiVerification() {
  const ctx = useContext(BoiVerificationContext);
  if (!ctx) {
    throw new Error('useBoiVerification must be used within BoiVerificationProvider');
  }
  return ctx;
}
