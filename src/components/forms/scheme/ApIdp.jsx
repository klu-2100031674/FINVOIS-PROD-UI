import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AP_IDP_SCHEME_MAIL_PATH } from './apIdpSchemeMailConstants';
import { saveSchemeFormSession } from '../../../utils/schemeFormSession';

const LEGAL_STRUCTURE_OPTIONS = [
  'Sole Proprietorship',
  'Partnership',
  'Private Ltd.',
  'Public Ltd.',
  'LLP',
  'FPO',
  'SHG',
  'Cooperative',
  'Society',
  'Others',
];

const GENDER_OPTIONS = ['Male', 'Female', 'Transgender'];

const SOLE_PROP_CATEGORIES = [
  'Woman',
  'BC',
  'SC',
  'ST',
  'Minority',
  'Specially Abled',
  'Transgender',
  'General',
];

const PARTNER_GENDER_OPTIONS = ['Male', 'Female', 'Others'];

const PARTNER_CASTE_OPTIONS = ['General', 'BC', 'SC', 'ST', 'Minority', 'Others'];

const MAIN_SECTOR_OPTIONS = ['Manufacturing Sector', 'Service Sector'];

const PROJECT_TYPE_OPTIONS = ['New Enterprise', 'Expansion', 'Diversification'];

const MSME_CLASSIFICATION_OPTIONS = [
  'Micro (Investment ≤ ₹2.5 Cr & Turnover ≤ ₹10 Cr)',
  'Small (Investment ≤ ₹25 Cr & Turnover ≤ ₹100 Cr)',
  'Medium (Investment ≤ ₹125 Cr & Turnover ≤ ₹500 Cr)',
];

const PREMISES_OPTIONS = [
  'Own / Purchased / Inherited',
  'Leased',
  'APIIC allotted',
  'Government allotted',
  'Others',
];

const LEASE_AGREEMENT_OPTIONS = ['Registered', 'Unregistered'];

const UNIT_SETUP_OPTIONS_WITH_NOT_YET = [
  'Own Funds / Self-Financed (Term Loan <40% of Project cost)',
  'Bank Loan',
  'Not yet',
];

const DECARB_INVESTMENT_OPTIONS = [
  'Common Effluent Treatment Plant (serving ≥5 enterprises)',
  'Common Sewage/Wastewater Treatment Plant (serving ≥10 enterprises)',
  'Water Treatment / Desalination Plant (serving ≥10 enterprises)',
  'Solid Waste Treatment (serving ≥10 enterprises)',
  'Hazardous Waste Treatment / Incineration (serving ≥5 enterprises)',
  'Other',
  'Not investing in any of the above',
];

const STAMP_DUTY_OPTIONS = [
  'Land purchase',
  'Lease of land/shed/building',
  'Mortgage / Hypothecation for term loan',
  'Not Paid',
];

const QUALITY_CERTIFICATION_OPTIONS = [
  'ZED',
  'HACCP',
  'GMP',
  'ISO 9000',
  'ISO 22000',
  'Others',
];

const DOCUMENTS_OPTIONS = [
  'Udyam Registration Certificate',
  'Professional tax Registration Certificate',
  'GST Returns (GSTR-3B & GSTR-2A last 3 years)',
  'Income Tax Returns (last 3 years)',
  'Chartered Accountant / Bank certified Fixed capital Investment (FCI) & machinery bills',
  'Date of Commercial Production certificate / CFE approval',
  'Form-A (for SGST)',
  'Chartered Engineer certificate (for decarbonization)',
  'Annexure 10 (for transport / construction / road projects)',
  'GST ITC statements (for local procurement)',
  'Training records & appointment letters (for skill upgradation)',
  'Audit reports & equipment invoices (for energy/water audit)',
  'Quality certification & GoI subsidy details',
];

/** Fixed Capital Investment particulars used by both Branch A (single column) and Branch B (Before / After columns). */
const FCI_ASSET_ROWS = [
  { key: 'plantMachinery', label: 'Plant and Machinery' },
  { key: 'serviceEquipment', label: 'Service Equipment' },
  { key: 'shedCivil', label: 'Shed Construction and Civil works' },
  { key: 'landPurchase', label: 'Land purchase' },
  { key: 'electricalPlumbing', label: 'Electrical and Plumbing Items' },
  { key: 'electronicItems', label: 'Electronic Items' },
  { key: 'furnitureFittings', label: 'Furniture and Fittings' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'otherAssets', label: 'Other Assets (Non-Depreciable assets)' },
];

const toNumber0 = (v) => {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const makeEmptyPartner = () => ({
  name: '',
  gender: '',
  age: '',
  shareholding: '',
  mobile: '',
  email: '',
  caste: '',
});

const makeEmptyTurnoverRows = () => [
  { year: '2024-25', domestic: '', exportTurnover: '', total: '', exportPct: '' },
  { year: '2025-26', domestic: '', exportTurnover: '', total: '', exportPct: '' },
  { year: '2026-27 (Projected)', domestic: '', exportTurnover: '', total: '', exportPct: '' },
];

const initialState = {
  // Section 1 — Business & Owner Profile
  businessLegalName: '',
  tradeName: '',
  legalStructure: '',
  legalStructureOtherText: '',
  gstin: '',
  udyamRegistrationNumber: '',
  panEnterpriseOrOwner: '',

  // Owner / Promoter Details
  ownerFullName: '',
  ownerGender: '',
  ownerAge: '',
  ownerMobile: '',
  ownerEmail: '',

  // 8. Category (only when Sole Proprietorship)
  solePropCategory: '',

  // 8. Partner / Director details (in cases OTHER than Sole Proprietorship)
  partners: [],

  // Section 2 — Location & Project Details
  domicileAndhraPradesh: '', // Yes / No
  unitDistrict: '',
  unitMandal: '',
  unitVillageOrCity: '',
  ruralUrbanStatus: '', // Urban / Rural
  mainSector: '', // Manufacturing Sector / Service Sector
  businessActivityDetails: '',
  projectType: '', // New Enterprise / Expansion / Diversification

  // Shared across Branch A (New Enterprise) & Branch B (Expansion / Diversification)
  msmeClassification: '',

  // Date fields — Branch A allows a "Not yet ..." toggle; Branch B requires actual dates.
  dateOfIncorporation: '',
  dateOfIncorporationNotYet: false,
  cfeDate: '',
  cfeNotYetObtained: false,
  dcpDate: '',
  dcpNotYetStarted: false,
  firstInvoiceDate: '',
  firstInvoiceNotYetGenerated: false,

  // FCI breakdown (Branch A uses single column; Branch B uses Before / After columns).
  fci_plantMachinery: '',
  fci_serviceEquipment: '',
  fci_shedCivil: '',
  fci_landPurchase: '',
  fci_electricalPlumbing: '',
  fci_electronicItems: '',
  fci_furnitureFittings: '',
  fci_vehicles: '',
  fci_otherAssets: '',
  fci_workingCapital: '',
  fci_after_plantMachinery: '',
  fci_after_serviceEquipment: '',
  fci_after_shedCivil: '',
  fci_after_landPurchase: '',
  fci_after_electricalPlumbing: '',
  fci_after_electronicItems: '',
  fci_after_furnitureFittings: '',
  fci_after_vehicles: '',
  fci_after_otherAssets: '',
  fci_after_workingCapital: '',

  // Plant & Machinery investment breakdown (shared)
  pm_newIndigenous: '',
  pm_importedNew: '',
  pm_secondHand: '',
  pm_selfFabricated: '',

  // Premises / lease (shared)
  premisesOwnership: '',
  premisesOtherText: '',
  leaseAgreementType: '',

  // Branch B Section 2 — turnover table
  turnoverRows: makeEmptyTurnoverRows(),

  // Section 3 — Financial Readiness (shared)
  trainingCompleted: '', // 'Not yet' / 'Yes'
  trainingNameAndYear: '',
  unitSetupFunding: '', // 'Own Funds / Self-Financed ...' / 'Bank Loan' / 'Not yet'
  identifiedBank: '', // Yes / No
  identifiedBankName: '',
  identifiedBankBranch: '',
  existingBankerBankName: '',
  existingBankerBranch: '',
  previousGovtSubsidyLoan: '', // Yes / No
  cibilScore: '',
  netWorth: '',
  filingIncomeTaxReturns: '', // Yes / No

  // Section 4 — Decarbonisation (Branch A simple; reused in Branch B Section 4-I).
  decarbInvestments: [],
  decarbOtherText: '',
  decarbEstimatedCost: '',

  // Branch A Q32 — challenges
  neChallenges: '',

  // Branch B Section 4 — Incentive-Specific Questions
  // A. Investment Subsidy
  invSubsidy_dcpAchievedInPeriod: '', // Yes / No
  invSubsidy_caCertifiedBills: '', // Yes / No
  invSubsidy_capacityUtilization: '',
  // B. Stamp Duty
  stampDuty_paidOn: [],
  stampDuty_amount: '',
  // C. Power Cost Subsidy
  power_inEnterpriseName: '', // Yes / No
  power_avgAnnualConsumption: '',
  power_baseConsumptionCertified: '', // Yes / No
  // D. Net SGST Reimbursement
  sgst_separateGstRegistration: '', // Yes / No
  sgst_netSGSTPaidLastFY: '',
  sgst_hasFormA: '', // Yes / No
  // E. Local Procurement Subsidy
  localProc_exportTurnoverGte80: '', // Yes / No
  localProc_localProcurementGte60: '', // Yes / No
  localProc_hasItcStatements: '', // Yes / No
  // F. Skill Upgradation
  skill_conductedTraining: '', // Yes / No
  skill_numberOfTrained: '',
  skill_hasAppointmentLetters: '', // Yes / No
  // G. Energy & Water Audit
  audit_conducted: '', // Yes / No / Not Yet
  audit_costIncurred: '',
  audit_equipmentCost: '',
  // H. Quality Certification
  quality_certifications: [],
  quality_otherCertText: '',
  quality_totalCertCost: '',
  quality_goiSubsidyReceived: '',
  // I. Decarbonization Subsidy (Branch B detailed)
  decarbB_claimStatus: '', // Yes / No / Not sure
  decarbB_chartEngCertificate: '', // Yes / No / Not Yet

  // Branch B — Documents Checklist + final challenges
  documentsAvailable: [],
  edChallenges: '',
};

const FieldLabel = ({ children, required }) => (
  <label className="block text-sm font-semibold text-gray-800">
    {children} {required ? <span className="text-red-500">*</span> : null}
  </label>
);

const makeDomId = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const RadioGroup = ({ name, value, onChange, options }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const id = `ap-idp-radio-${makeDomId(name)}-${makeDomId(opt.value)}`;
      const checked = value === opt.value;
      return (
        <div key={opt.value} className="relative">
          <input
            id={id}
            type="radio"
            name={name}
            value={opt.value}
            checked={checked}
            onChange={(e) => onChange(e.target.value)}
            className="peer sr-only"
          />
          <label
            htmlFor={id}
            className="inline-flex items-center gap-2 cursor-pointer select-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition
              hover:border-gray-300 hover:bg-gray-50
              peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-2
              peer-checked:border-emerald-300 peer-checked:bg-emerald-50 peer-checked:text-emerald-900"
          >
            <span
              aria-hidden
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white peer-checked:border-emerald-500 peer-checked:bg-emerald-600"
            >
              <span className="h-2 w-2 rounded-full bg-transparent peer-checked:bg-white" aria-hidden />
            </span>
            <span className="leading-snug">{opt.label}</span>
          </label>
        </div>
      );
    })}
  </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-white"
  />
);

const TextArea = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-white resize-none"
  />
);

const DateInput = ({ value, onChange, disabled = false }) => (
  <input
    type="date"
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 bg-white disabled:bg-gray-100 disabled:text-gray-400"
  />
);

const CheckboxPill = ({ id, checked, onChange, label }) => (
  <div className="relative">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="peer sr-only"
    />
    <label
      htmlFor={id}
      className="flex items-center gap-2 w-full cursor-pointer select-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition
        hover:border-gray-300 hover:bg-gray-50
        peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-2
        peer-checked:border-emerald-300 peer-checked:bg-emerald-50 peer-checked:text-emerald-900"
    >
      <span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white text-[12px] font-bold text-transparent
          peer-checked:border-emerald-500 peer-checked:bg-emerald-600 peer-checked:text-white"
      >
        ✓
      </span>
      <span className="leading-snug">{label}</span>
    </label>
  </div>
);

/**
 * Date input paired with a "Not yet ..." checkbox.
 * Used by Branch A (New Enterprise) for incorporation / CFE / DCP / first invoice dates.
 */
const NotYetOrDate = ({
  dateValue,
  onDateChange,
  notYetValue,
  onNotYetChange,
  notYetLabel,
}) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="min-w-[200px]">
      <DateInput
        value={notYetValue ? '' : dateValue}
        onChange={(v) => {
          if (notYetValue) onNotYetChange(false);
          onDateChange(v);
        }}
        disabled={notYetValue}
      />
    </div>
    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={!!notYetValue}
        onChange={(e) => {
          onNotYetChange(e.target.checked);
          if (e.target.checked) onDateChange('');
        }}
        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span>{notYetLabel}</span>
    </label>
  </div>
);

const TwoQuestionRow = ({ left, right }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="space-y-1.5">{left}</div>
    <div className="space-y-1.5">{right}</div>
  </div>
);


const ApIdpSectionAForm = ({
  initialData = null,
  onSubmit = null,
  schemeMailPath = AP_IDP_SCHEME_MAIL_PATH,
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState(() => ({ ...initialState, ...(initialData || {}) }));

  const isSoleProprietorship = data.legalStructure === 'Sole Proprietorship';
  const isOtherStructure = data.legalStructure === 'Others';
  const needsPartners = !!data.legalStructure && !isSoleProprietorship;

  const update = (key, value) => setData((p) => ({ ...p, [key]: value }));

  const updatePartner = (idx, key, value) => {
    setData((p) => {
      const next = [...(p.partners || [])];
      next[idx] = { ...next[idx], [key]: value };
      return { ...p, partners: next };
    });
  };

  const addPartner = () => {
    setData((p) => ({ ...p, partners: [...(p.partners || []), makeEmptyPartner()] }));
  };

  const removePartner = (idx) => {
    setData((p) => {
      const next = (p.partners || []).filter((_, i) => i !== idx);
      return { ...p, partners: next };
    });
  };

  /** Toggle a string value in a list-typed state field. */
  const toggleList = (key, value) => {
    setData((p) => {
      const set = new Set(p[key] || []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...p, [key]: Array.from(set) };
    });
  };

  /** Update one cell of the Branch B turnover table; auto-compute total and export %. */
  const updateTurnoverCell = (idx, key, value) => {
    setData((p) => {
      const rows = [...(p.turnoverRows || makeEmptyTurnoverRows())];
      const next = { ...rows[idx], [key]: value };
      if (key === 'domestic' || key === 'exportTurnover') {
        const total = toNumber0(next.domestic) + toNumber0(next.exportTurnover);
        next.total = total ? total : '';
        const exportN = toNumber0(next.exportTurnover);
        next.exportPct = total ? Number(((exportN / total) * 100).toFixed(2)) : '';
      }
      rows[idx] = next;
      return { ...p, turnoverRows: rows };
    });
  };

  const isNewEnterprise = data.projectType === 'New Enterprise';
  const isExpansionOrDiv =
    data.projectType === 'Expansion' || data.projectType === 'Diversification';

  const totalFixedAssetsBefore = useMemo(
    () => FCI_ASSET_ROWS.reduce((sum, r) => sum + toNumber0(data[`fci_${r.key}`]), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    FCI_ASSET_ROWS.map((r) => data[`fci_${r.key}`]),
  );

  const totalFixedAssetsAfter = useMemo(
    () => FCI_ASSET_ROWS.reduce((sum, r) => sum + toNumber0(data[`fci_after_${r.key}`]), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    FCI_ASSET_ROWS.map((r) => data[`fci_after_${r.key}`]),
  );

  const estimatedProjectCost = useMemo(
    () => totalFixedAssetsBefore + toNumber0(data.fci_workingCapital),
    [totalFixedAssetsBefore, data.fci_workingCapital],
  );

  const estimatedProjectCostAfter = useMemo(
    () => totalFixedAssetsAfter + toNumber0(data.fci_after_workingCapital),
    [totalFixedAssetsAfter, data.fci_after_workingCapital],
  );

  const legalStructureOptions = useMemo(
    () => LEGAL_STRUCTURE_OPTIONS.map((opt) => ({ label: opt, value: opt })),
    [],
  );

  const fillTestData = () => {
    // Toggle between Sole Proprietorship and Partnership test fixtures so QA can exercise both
    // branches of question 8 (category radios vs partners table) without code changes.
    setData((prev) => {
      const usePartnership = prev.legalStructure === 'Sole Proprietorship';
      if (usePartnership) {
        return {
          ...initialState,
          businessLegalName: 'RK Industries LLP',
          tradeName: 'RK Bites',
          legalStructure: 'Partnership',
          legalStructureOtherText: '',
          gstin: '37ABCDE1234F1Z5',
          udyamRegistrationNumber: 'UDYAM-AP-12-0000456',
          panEnterpriseOrOwner: 'ABCDE5678G',
          ownerFullName: 'Ravi Kumar',
          ownerGender: 'Male',
          ownerAge: 32,
          ownerMobile: '9876543210',
          ownerEmail: 'ravikumar@example.com',
          solePropCategory: '',
          partners: [
            {
              name: 'Ravi Kumar',
              gender: 'Male',
              age: 32,
              shareholding: 60,
              mobile: '9876543210',
              email: 'ravikumar@example.com',
              caste: 'BC',
            },
            {
              name: 'Sita Devi',
              gender: 'Female',
              age: 30,
              shareholding: 40,
              mobile: '9876500000',
              email: 'sita@example.com',
              caste: 'General',
            },
          ],
          domicileAndhraPradesh: 'Yes',
          unitDistrict: 'Krishna',
          unitMandal: 'Vijayawada (Rural)',
          unitVillageOrCity: 'Vijayawada',
          ruralUrbanStatus: 'Urban',
          mainSector: 'Manufacturing Sector',
          businessActivityDetails:
            'Setting up a small-scale snack manufacturing unit producing namkeen, savouries and ready-to-cook items for the local AP retail market with last-mile distribution to kirana stores.',
          projectType: 'Expansion',
          // Branch B Section 2
          msmeClassification: 'Small (Investment ≤ ₹25 Cr & Turnover ≤ ₹100 Cr)',
          dateOfIncorporation: '2022-04-01',
          cfeDate: '2022-05-15',
          dcpDate: '2022-08-01',
          firstInvoiceDate: '2022-08-20',
          fci_plantMachinery: 1500000,
          fci_serviceEquipment: 250000,
          fci_shedCivil: 400000,
          fci_landPurchase: 0,
          fci_electricalPlumbing: 150000,
          fci_electronicItems: 100000,
          fci_furnitureFittings: 80000,
          fci_vehicles: 350000,
          fci_otherAssets: 50000,
          fci_workingCapital: 600000,
          fci_after_plantMachinery: 2500000,
          fci_after_serviceEquipment: 350000,
          fci_after_shedCivil: 600000,
          fci_after_landPurchase: 0,
          fci_after_electricalPlumbing: 200000,
          fci_after_electronicItems: 150000,
          fci_after_furnitureFittings: 100000,
          fci_after_vehicles: 500000,
          fci_after_otherAssets: 75000,
          fci_after_workingCapital: 900000,
          pm_newIndigenous: 1800000,
          pm_importedNew: 500000,
          pm_secondHand: 100000,
          pm_selfFabricated: 100000,
          premisesOwnership: 'Leased',
          premisesOtherText: '',
          leaseAgreementType: 'Registered',
          turnoverRows: [
            { year: '2024-25', domestic: 4200000, exportTurnover: 800000, total: 5000000, exportPct: 16 },
            { year: '2025-26', domestic: 5500000, exportTurnover: 1500000, total: 7000000, exportPct: 21.43 },
            { year: '2026-27 (Projected)', domestic: 7000000, exportTurnover: 3000000, total: 10000000, exportPct: 30 },
          ],
          // Section 3
          trainingCompleted: 'Yes',
          trainingNameAndYear: 'EDP Training (10 days) - 2023',
          unitSetupFunding: 'Bank Loan',
          identifiedBank: 'Yes',
          identifiedBankName: 'State Bank of India',
          identifiedBankBranch: 'Vijayawada Main Branch',
          existingBankerBankName: '',
          existingBankerBranch: '',
          previousGovtSubsidyLoan: 'No',
          cibilScore: 762,
          netWorth: 1500000,
          filingIncomeTaxReturns: 'Yes',
          // Section 4 — Incentive-Specific
          invSubsidy_dcpAchievedInPeriod: 'Yes',
          invSubsidy_caCertifiedBills: 'Yes',
          invSubsidy_capacityUtilization: 72,
          stampDuty_paidOn: ['Land purchase', 'Mortgage / Hypothecation for term loan'],
          stampDuty_amount: 125000,
          power_inEnterpriseName: 'Yes',
          power_avgAnnualConsumption: '85,000 KVAH',
          power_baseConsumptionCertified: 'Yes',
          sgst_separateGstRegistration: 'Yes',
          sgst_netSGSTPaidLastFY: 240000,
          sgst_hasFormA: 'Yes',
          localProc_exportTurnoverGte80: 'No',
          localProc_localProcurementGte60: 'Yes',
          localProc_hasItcStatements: 'Yes',
          skill_conductedTraining: 'Yes',
          skill_numberOfTrained: 12,
          skill_hasAppointmentLetters: 'Yes',
          audit_conducted: 'Yes',
          audit_costIncurred: 75000,
          audit_equipmentCost: 250000,
          quality_certifications: ['ISO 9000', 'HACCP'],
          quality_otherCertText: '',
          quality_totalCertCost: 180000,
          quality_goiSubsidyReceived: 50000,
          decarbB_claimStatus: 'Yes',
          decarbInvestments: ['Common Effluent Treatment Plant (serving ≥5 enterprises)'],
          decarbOtherText: '',
          decarbEstimatedCost: 350000,
          decarbB_chartEngCertificate: 'Not Yet',
          documentsAvailable: [
            'Udyam Registration Certificate',
            'GST Returns (GSTR-3B & GSTR-2A last 3 years)',
            'Income Tax Returns (last 3 years)',
            'Chartered Accountant / Bank certified Fixed capital Investment (FCI) & machinery bills',
          ],
          edChallenges:
            'Some second-hand machinery procured for non-core processes; need clarity on whether it qualifies. Also exploring stamp duty refund on registered lease.',
        };
      }
      return {
        ...initialState,
        businessLegalName: 'RK Foods Pvt Ltd',
        tradeName: 'RK Bites',
        legalStructure: 'Sole Proprietorship',
        legalStructureOtherText: '',
        gstin: '37ABCDE1234F1Z5',
        udyamRegistrationNumber: 'UDYAM-AP-12-0000123',
        panEnterpriseOrOwner: 'ABCDE1234F',
        ownerFullName: 'Ravi Kumar',
        ownerGender: 'Male',
        ownerAge: 32,
        ownerMobile: '9876543210',
        ownerEmail: 'ravikumar@example.com',
        solePropCategory: 'BC',
        partners: [],
        domicileAndhraPradesh: 'Yes',
        unitDistrict: 'Krishna',
        unitMandal: 'Vijayawada (Rural)',
        unitVillageOrCity: 'Vijayawada',
        ruralUrbanStatus: 'Urban',
        mainSector: 'Service Sector',
        businessActivityDetails:
          'Proposed FMCG trading and distribution unit with last-mile delivery in nearby mandals, focused on kirana stores and small retailers. Will maintain basic inventory and use digital billing.',
        projectType: 'New Enterprise',
        // Branch A — Section 2
        msmeClassification: 'Micro (Investment ≤ ₹2.5 Cr & Turnover ≤ ₹10 Cr)',
        dateOfIncorporation: '',
        dateOfIncorporationNotYet: true,
        cfeDate: '',
        cfeNotYetObtained: true,
        dcpDate: '',
        dcpNotYetStarted: true,
        firstInvoiceDate: '',
        firstInvoiceNotYetGenerated: true,
        fci_plantMachinery: 600000,
        fci_serviceEquipment: 150000,
        fci_shedCivil: 200000,
        fci_landPurchase: 0,
        fci_electricalPlumbing: 80000,
        fci_electronicItems: 60000,
        fci_furnitureFittings: 50000,
        fci_vehicles: 250000,
        fci_otherAssets: 30000,
        fci_workingCapital: 400000,
        pm_newIndigenous: 700000,
        pm_importedNew: 0,
        pm_secondHand: 0,
        pm_selfFabricated: 50000,
        premisesOwnership: 'Leased',
        premisesOtherText: '',
        leaseAgreementType: 'Registered',
        // Branch A — Section 3
        trainingCompleted: 'Yes',
        trainingNameAndYear: 'EDP Training (10 days) - 2025',
        unitSetupFunding: 'Bank Loan',
        identifiedBank: 'No',
        identifiedBankName: '',
        identifiedBankBranch: '',
        existingBankerBankName: 'State Bank of India',
        existingBankerBranch: 'Vijayawada Main Branch',
        previousGovtSubsidyLoan: 'No',
        cibilScore: 745,
        netWorth: 650000,
        filingIncomeTaxReturns: 'Yes',
        // Branch A — Section 4
        decarbInvestments: [],
        decarbOtherText: '',
        decarbEstimatedCost: '',
        neChallenges:
          'Looking for guidance on initial CFE process and whether second-hand packaging machinery would be allowed under AP IDP 4.0.',
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...data,
      ownerAge: data.ownerAge === '' ? '' : Number(data.ownerAge),
      partners: (data.partners || []).map((p) => ({
        ...p,
        age: p.age === '' || p.age === null || p.age === undefined ? '' : Number(p.age),
        shareholding:
          p.shareholding === '' || p.shareholding === null || p.shareholding === undefined
            ? ''
            : Number(p.shareholding),
      })),
    };
    onSubmit?.(payload);
    saveSchemeFormSession('apIdpForm', payload);
    navigate(schemeMailPath, { state: { apIdpForm: payload } });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        
        <button
          type="button"
          onClick={fillTestData}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-semibold shrink-0"
        >
          Fill Test Data
        </button>
      </div>

      {/* Section 1: Business & Owner Profile */}
      <div className="mt-2 pt-2">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">
            Section 1: Business &amp; Owner Profile
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <TwoQuestionRow
            left={
              <>
                <FieldLabel required>1. Business Legal Name (as per GST/Udyam)</FieldLabel>
                <TextInput
                  value={data.businessLegalName}
                  onChange={(v) => update('businessLegalName', v)}
                  placeholder="Business Legal Name"
                />
              </>
            }
            right={
              <>
                <FieldLabel>2. Trade Name / Brand Name (if different)</FieldLabel>
                <TextInput
                  value={data.tradeName}
                  onChange={(v) => update('tradeName', v)}
                  placeholder="Trade Name / Brand Name"
                />
              </>
            }
          />

          <div className="space-y-1.5">
            <FieldLabel required>3. Legal Structure</FieldLabel>
            <RadioGroup
              name="legalStructure"
              value={data.legalStructure}
              onChange={(v) => {
                setData((p) => {
                  const becomesSoleProp = v === 'Sole Proprietorship';
                  const wasSoleProp = p.legalStructure === 'Sole Proprietorship';
                  return {
                    ...p,
                    legalStructure: v,
                    legalStructureOtherText: v === 'Others' ? p.legalStructureOtherText : '',
                    solePropCategory: becomesSoleProp ? p.solePropCategory : '',
                    partners: becomesSoleProp
                      ? []
                      : !v
                        ? []
                        : (p.partners || []).length === 0 || wasSoleProp
                          ? [makeEmptyPartner()]
                          : p.partners,
                  };
                });
              }}
              options={legalStructureOptions}
            />
            {isOtherStructure && (
              <div className="mt-2">
                <TextInput
                  value={data.legalStructureOtherText}
                  onChange={(v) => update('legalStructureOtherText', v)}
                  placeholder="Please specify..."
                />
              </div>
            )}
          </div>

          <TwoQuestionRow
            left={
              <>
                <FieldLabel>4. GSTIN</FieldLabel>
                <TextInput
                  value={data.gstin}
                  onChange={(v) => update('gstin', v)}
                  placeholder="GSTIN"
                />
              </>
            }
            right={
              <>
                <FieldLabel>5. Udyam Registration Number</FieldLabel>
                <TextInput
                  value={data.udyamRegistrationNumber}
                  onChange={(v) => update('udyamRegistrationNumber', v)}
                  placeholder="Udyam Registration Number"
                />
              </>
            }
          />

          <div className="space-y-1.5">
            <FieldLabel>6. PAN of the Enterprise / Owner</FieldLabel>
            <TextInput
              value={data.panEnterpriseOrOwner}
              onChange={(v) => update('panEnterpriseOrOwner', v)}
              placeholder="PAN"
            />
          </div>

          {/* 7. Owner / Promoter Details */}
          <div className="space-y-2">
            <FieldLabel>7. Owner / Promoter Details</FieldLabel>
            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-4">
              <TwoQuestionRow
                left={
                  <>
                    <FieldLabel>Full Name</FieldLabel>
                    <TextInput
                      value={data.ownerFullName}
                      onChange={(v) => update('ownerFullName', v)}
                      placeholder="Full Name"
                    />
                  </>
                }
                right={
                  <>
                    <FieldLabel>Gender</FieldLabel>
                    <RadioGroup
                      name="ownerGender"
                      value={data.ownerGender}
                      onChange={(v) => update('ownerGender', v)}
                      options={GENDER_OPTIONS.map((g) => ({ label: g, value: g }))}
                    />
                  </>
                }
              />
              <TwoQuestionRow
                left={
                  <>
                    <FieldLabel>Age</FieldLabel>
                    <TextInput
                      value={data.ownerAge}
                      onChange={(v) => update('ownerAge', v)}
                      placeholder="Age"
                      type="number"
                    />
                  </>
                }
                right={
                  <>
                    <FieldLabel>Mobile</FieldLabel>
                    <TextInput
                      value={data.ownerMobile}
                      onChange={(v) => update('ownerMobile', v)}
                      placeholder="Mobile Number"
                    />
                  </>
                }
              />
              <div className="space-y-1.5">
                <FieldLabel>Email</FieldLabel>
                <TextInput
                  value={data.ownerEmail}
                  onChange={(v) => update('ownerEmail', v)}
                  placeholder="Email"
                  type="email"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel>8. Category / Partner Details</FieldLabel>
            <p className="text-xs text-gray-500">
              If you selected <span className="font-semibold">Sole Proprietorship</span> in question 3,
              choose your category below. For any other legal structure, fill the partner /
              director table.
            </p>

            {!data.legalStructure && (
              <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Please select a Legal Structure in question 3 first to continue with question 8.
              </div>
            )}

            {isSoleProprietorship && (
              <div className="space-y-1.5 pt-1">
                <p className="text-sm font-semibold text-gray-800">
                  Category (Sole Proprietorship)
                </p>
                <RadioGroup
                  name="solePropCategory"
                  value={data.solePropCategory}
                  onChange={(v) => update('solePropCategory', v)}
                  options={SOLE_PROP_CATEGORIES.map((c) => ({ label: c, value: c }))}
                />
              </div>
            )}
          </div>

          {needsPartners && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-800">
                Partner / Director Details (
                {data.legalStructure === 'Others' && data.legalStructureOtherText
                  ? data.legalStructureOtherText
                  : data.legalStructure}
                )
              </p>
              <p className="text-xs text-gray-500">
                Add one row per partner / director. Use “Add partner” for additional members.
              </p>

              <div className="rounded-lg border border-gray-200 bg-gray-50/60 overflow-hidden">
                {/* Desktop / tablet table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-600 bg-gray-100/80 border-b border-gray-200">
                        <th className="px-3 py-2 font-semibold">Name of Partner</th>
                        <th className="px-3 py-2 font-semibold">Gender</th>
                        <th className="px-3 py-2 font-semibold">Age</th>
                        <th className="px-3 py-2 font-semibold">Shareholding (%)</th>
                        <th className="px-3 py-2 font-semibold">Mobile</th>
                        <th className="px-3 py-2 font-semibold">Email</th>
                        <th className="px-3 py-2 font-semibold">Caste</th>
                        <th className="px-3 py-2 font-semibold w-10" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {(data.partners || []).map((p, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-0 align-top">
                          <td className="px-2 py-2 min-w-[160px]">
                            <TextInput
                              value={p.name}
                              onChange={(v) => updatePartner(idx, 'name', v)}
                              placeholder="Full name"
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <select
                              value={p.gender}
                              onChange={(e) => updatePartner(idx, 'gender', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              {PARTNER_GENDER_OPTIONS.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2 w-24">
                            <TextInput
                              value={p.age}
                              onChange={(v) => updatePartner(idx, 'age', v)}
                              placeholder="Age"
                              type="number"
                            />
                          </td>
                          <td className="px-2 py-2 w-32">
                            <TextInput
                              value={p.shareholding}
                              onChange={(v) => updatePartner(idx, 'shareholding', v)}
                              placeholder="%"
                              type="number"
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <TextInput
                              value={p.mobile}
                              onChange={(v) => updatePartner(idx, 'mobile', v)}
                              placeholder="Mobile"
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[180px]">
                            <TextInput
                              value={p.email}
                              onChange={(v) => updatePartner(idx, 'email', v)}
                              placeholder="Email"
                              type="email"
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <select
                              value={p.caste}
                              onChange={(e) => updatePartner(idx, 'caste', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            >
                              <option value="">Select</option>
                              {PARTNER_CASTE_OPTIONS.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2 text-right w-10">
                            <button
                              type="button"
                              onClick={() => removePartner(idx)}
                              disabled={(data.partners || []).length <= 1}
                              className="text-xs font-semibold text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                              title={(data.partners || []).length <= 1 ? 'At least one row required' : 'Remove partner'}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile stacked cards */}
                <div className="md:hidden p-3 space-y-3">
                  {(data.partners || []).map((p, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 bg-white p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-700">
                          Partner #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePartner(idx)}
                          disabled={(data.partners || []).length <= 1}
                          className="text-xs font-semibold text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>Name of Partner</FieldLabel>
                        <TextInput
                          value={p.name}
                          onChange={(v) => updatePartner(idx, 'name', v)}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>Gender</FieldLabel>
                        <select
                          value={p.gender}
                          onChange={(e) => updatePartner(idx, 'gender', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        >
                          <option value="">Select</option>
                          {PARTNER_GENDER_OPTIONS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                      <TwoQuestionRow
                        left={
                          <>
                            <FieldLabel>Age</FieldLabel>
                            <TextInput
                              value={p.age}
                              onChange={(v) => updatePartner(idx, 'age', v)}
                              placeholder="Age"
                              type="number"
                            />
                          </>
                        }
                        right={
                          <>
                            <FieldLabel>Shareholding (%)</FieldLabel>
                            <TextInput
                              value={p.shareholding}
                              onChange={(v) => updatePartner(idx, 'shareholding', v)}
                              placeholder="%"
                              type="number"
                            />
                          </>
                        }
                      />
                      <TwoQuestionRow
                        left={
                          <>
                            <FieldLabel>Mobile</FieldLabel>
                            <TextInput
                              value={p.mobile}
                              onChange={(v) => updatePartner(idx, 'mobile', v)}
                              placeholder="Mobile"
                            />
                          </>
                        }
                        right={
                          <>
                            <FieldLabel>Email</FieldLabel>
                            <TextInput
                              value={p.email}
                              onChange={(v) => updatePartner(idx, 'email', v)}
                              placeholder="Email"
                              type="email"
                            />
                          </>
                        }
                      />
                      <div className="space-y-1.5">
                        <FieldLabel>Caste</FieldLabel>
                        <select
                          value={p.caste}
                          onChange={(e) => updatePartner(idx, 'caste', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        >
                          <option value="">Select</option>
                          {PARTNER_CASTE_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end p-3 border-t border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={addPartner}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    + Add partner
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Location & Project Details */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h3 className="text-base font-bold text-gray-900">
            Section 2: Location &amp; Project Details
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>9. Domicile in Andhra Pradesh?</FieldLabel>
            <RadioGroup
              name="domicileAndhraPradesh"
              value={data.domicileAndhraPradesh}
              onChange={(v) => update('domicileAndhraPradesh', v)}
              options={[
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>10. Location of the Unit</FieldLabel>
            <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-4">
              <TwoQuestionRow
                left={
                  <>
                    <FieldLabel>District</FieldLabel>
                    <TextInput
                      value={data.unitDistrict}
                      onChange={(v) => update('unitDistrict', v)}
                      placeholder="District"
                    />
                  </>
                }
                right={
                  <>
                    <FieldLabel>Mandal</FieldLabel>
                    <TextInput
                      value={data.unitMandal}
                      onChange={(v) => update('unitMandal', v)}
                      placeholder="Mandal"
                    />
                  </>
                }
              />
              <div className="space-y-1.5">
                <FieldLabel>Village / City</FieldLabel>
                <TextInput
                  value={data.unitVillageOrCity}
                  onChange={(v) => update('unitVillageOrCity', v)}
                  placeholder="Village / City"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Rural / Urban Status</FieldLabel>
                <RadioGroup
                  name="ruralUrbanStatus"
                  value={data.ruralUrbanStatus}
                  onChange={(v) => update('ruralUrbanStatus', v)}
                  options={[
                    { label: 'Urban (Other than Panchayat)', value: 'Urban' },
                    { label: 'Rural (Panchayat)', value: 'Rural' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>11. Main Sector</FieldLabel>
            <RadioGroup
              name="mainSector"
              value={data.mainSector}
              onChange={(v) => update('mainSector', v)}
              options={MAIN_SECTOR_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>12. What is the Business activity? (In detail)</FieldLabel>
            <TextArea
              value={data.businessActivityDetails}
              onChange={(v) => update('businessActivityDetails', v)}
              placeholder="Describe the proposed business activity in detail (products / services, target customers, scale, etc.)"
              rows={5}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>13. Project Type</FieldLabel>
            <RadioGroup
              name="projectType"
              value={data.projectType}
              onChange={(v) => update('projectType', v)}
              options={PROJECT_TYPE_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* Branch A: New Enterprise → Sections 2 / 3 / 4                  */}
      {/* ============================================================== */}
      {isNewEnterprise && (
        <>
          {/* Section 2 (NE) — Project & Investment Details */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-900">
                Section 2: Project &amp; Investment Details
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>14. MSME Classification (based on Udyam)</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {MSME_CLASSIFICATION_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-start gap-2 cursor-pointer select-none rounded-lg border p-3 transition text-sm
                        ${data.msmeClassification === opt ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      <input
                        type="radio"
                        name="ne-msme"
                        value={opt}
                        checked={data.msmeClassification === opt}
                        onChange={(e) => update('msmeClassification', e.target.value)}
                        className="mt-0.5 h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="leading-snug">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>15. Date of Incorporation</FieldLabel>
                <NotYetOrDate
                  dateValue={data.dateOfIncorporation}
                  onDateChange={(v) => update('dateOfIncorporation', v)}
                  notYetValue={data.dateOfIncorporationNotYet}
                  onNotYetChange={(v) => update('dateOfIncorporationNotYet', v)}
                  notYetLabel="Not yet established"
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>16. Consent for Establishment (CFE) Status</FieldLabel>
                <NotYetOrDate
                  dateValue={data.cfeDate}
                  onDateChange={(v) => update('cfeDate', v)}
                  notYetValue={data.cfeNotYetObtained}
                  onNotYetChange={(v) => update('cfeNotYetObtained', v)}
                  notYetLabel="Not yet obtained"
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>17. Date of Commencement of Commercial Production</FieldLabel>
                <NotYetOrDate
                  dateValue={data.dcpDate}
                  onDateChange={(v) => update('dcpDate', v)}
                  notYetValue={data.dcpNotYetStarted}
                  onNotYetChange={(v) => update('dcpNotYetStarted', v)}
                  notYetLabel="Not yet started"
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>18. Date of First Sale Invoice Generated</FieldLabel>
                <NotYetOrDate
                  dateValue={data.firstInvoiceDate}
                  onDateChange={(v) => update('firstInvoiceDate', v)}
                  notYetValue={data.firstInvoiceNotYetGenerated}
                  onNotYetChange={(v) => update('firstInvoiceNotYetGenerated', v)}
                  notYetLabel="Not yet generated"
                />
              </div>

              {/* 19. FCI Breakdown — single column */}
              <div className="space-y-2">
                <FieldLabel>
                  19. Total Proposed Fixed Capital Investment (FCI) — as per DPR
                </FieldLabel>
                <p className="text-xs text-gray-500">
                  Approximate break-up below. The total is computed automatically.
                </p>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200">
                    <div className="col-span-8 px-4 py-3 text-sm font-semibold text-gray-800">
                      ASSETS: Particulars
                    </div>
                    <div className="col-span-4 px-4 py-3 text-sm font-semibold text-gray-800 text-right">
                      Amount (₹)
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {FCI_ASSET_ROWS.map((r) => (
                      <div key={r.key} className="grid grid-cols-12 items-center">
                        <div className="col-span-8 px-4 py-3 text-sm text-gray-800">{r.label}</div>
                        <div className="col-span-4 px-4 py-2">
                          <TextInput
                            type="number"
                            value={data[`fci_${r.key}`]}
                            onChange={(v) => update(`fci_${r.key}`, v)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-12 items-center bg-gray-50">
                      <div className="col-span-8 px-4 py-3 text-sm font-semibold text-gray-900">
                        TOTAL FIXED ASSETS
                      </div>
                      <div className="col-span-4 px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatINR(totalFixedAssetsBefore)}
                      </div>
                    </div>
                    <div className="grid grid-cols-12 items-center">
                      <div className="col-span-8 px-4 py-3 text-sm text-gray-800">
                        Working Capital Requirement
                      </div>
                      <div className="col-span-4 px-4 py-2">
                        <TextInput
                          type="number"
                          value={data.fci_workingCapital}
                          onChange={(v) => update('fci_workingCapital', v)}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-12 items-center bg-gray-50">
                      <div className="col-span-8 px-4 py-3 text-sm font-semibold text-gray-900">
                        Estimated Total Project Cost
                      </div>
                      <div className="col-span-4 px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatINR(estimatedProjectCost)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 20. P&M Investment Breakdown */}
              <div className="space-y-2">
                <FieldLabel>20. Total Investment in Plant &amp; Machinery / Equipment</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel>a. New Indigenous (Indian) Machinery (₹)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.pm_newIndigenous}
                      onChange={(v) => update('pm_newIndigenous', v)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>b. Imported Machinery (New) (₹)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.pm_importedNew}
                      onChange={(v) => update('pm_importedNew', v)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>c. Second Hand / Refurbished Machinery (₹)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.pm_secondHand}
                      onChange={(v) => update('pm_secondHand', v)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>d. Self-Fabricated Machinery (₹)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.pm_selfFabricated}
                      onChange={(v) => update('pm_selfFabricated', v)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* 21. Premises ownership */}
              <div className="space-y-1.5">
                <FieldLabel>21. Business Premises or Land Ownership / Acquisition Details</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PREMISES_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="ne-premisesOwnership"
                        value={opt}
                        checked={data.premisesOwnership === opt}
                        className="h-4 w-4 shrink-0 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        onChange={(e) => {
                          const v = e.target.value;
                          update('premisesOwnership', v);
                          if (v !== 'Others') update('premisesOtherText', '');
                          if (v !== 'Leased') update('leaseAgreementType', '');
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {data.premisesOwnership === 'Others' && (
                  <div className="mt-2">
                    <TextInput
                      value={data.premisesOtherText}
                      onChange={(v) => update('premisesOtherText', v)}
                      placeholder="Please specify..."
                    />
                  </div>
                )}
              </div>

              {data.premisesOwnership === 'Leased' && (
                <div className="space-y-1.5">
                  <FieldLabel>22. If Leased, lease agreement is</FieldLabel>
                  <RadioGroup
                    name="ne-leaseAgreementType"
                    value={data.leaseAgreementType}
                    onChange={(v) => update('leaseAgreementType', v)}
                    options={LEASE_AGREEMENT_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 3 (NE) — Financial Readiness */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-900">Section 3: Financial Readiness</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>
                  23. Have you completed any Entrepreneurship / Skill Development training?
                </FieldLabel>
                <RadioGroup
                  name="ne-trainingCompleted"
                  value={data.trainingCompleted}
                  onChange={(v) => {
                    update('trainingCompleted', v);
                    if (v !== 'Yes') update('trainingNameAndYear', '');
                  }}
                  options={[
                    { label: 'Not yet', value: 'Not yet' },
                    { label: 'Yes (EDP / SDP / ESDP / VT)', value: 'Yes' },
                  ]}
                />
                {data.trainingCompleted === 'Yes' && (
                  <div className="mt-2 space-y-1.5">
                    <FieldLabel>If yes, please mention name of the training and year</FieldLabel>
                    <TextInput
                      value={data.trainingNameAndYear}
                      onChange={(v) => update('trainingNameAndYear', v)}
                      placeholder="Training name and year"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <FieldLabel>24. Unit Setup with</FieldLabel>
                <RadioGroup
                  name="ne-unitSetupFunding"
                  value={data.unitSetupFunding}
                  onChange={(v) => update('unitSetupFunding', v)}
                  options={UNIT_SETUP_OPTIONS_WITH_NOT_YET.map((opt) => ({ label: opt, value: opt }))}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>25. Have you identified a bank for the loan?</FieldLabel>
                <RadioGroup
                  name="ne-identifiedBank"
                  value={data.identifiedBank}
                  onChange={(v) => {
                    update('identifiedBank', v);
                    if (v !== 'Yes') {
                      update('identifiedBankName', '');
                      update('identifiedBankBranch', '');
                    } else {
                      update('existingBankerBankName', '');
                      update('existingBankerBranch', '');
                    }
                  }}
                  options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                  ]}
                />
                {data.identifiedBank === 'Yes' && (
                  <div className="mt-2">
                    <TwoQuestionRow
                      left={
                        <>
                          <FieldLabel>Name of bank</FieldLabel>
                          <TextInput
                            value={data.identifiedBankName}
                            onChange={(v) => update('identifiedBankName', v)}
                            placeholder="Bank name"
                          />
                        </>
                      }
                      right={
                        <>
                          <FieldLabel>Bank Branch</FieldLabel>
                          <TextInput
                            value={data.identifiedBankBranch}
                            onChange={(v) => update('identifiedBankBranch', v)}
                            placeholder="Branch"
                          />
                        </>
                      }
                    />
                  </div>
                )}
                {data.identifiedBank === 'No' && (
                  <div className="mt-2">
                    <FieldLabel>Existing Banker Details</FieldLabel>
                    <TwoQuestionRow
                      left={
                        <>
                          <FieldLabel>Bank Name</FieldLabel>
                          <TextInput
                            value={data.existingBankerBankName}
                            onChange={(v) => update('existingBankerBankName', v)}
                            placeholder="Bank name"
                          />
                        </>
                      }
                      right={
                        <>
                          <FieldLabel>Branch</FieldLabel>
                          <TextInput
                            value={data.existingBankerBranch}
                            onChange={(v) => update('existingBankerBranch', v)}
                            placeholder="Branch"
                          />
                        </>
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <FieldLabel>
                  26. Have you availed any previous government subsidy / loan under PMEGP / PMFME /
                  MUDRA / AP IDP / any other scheme?
                </FieldLabel>
                <RadioGroup
                  name="ne-previousGovtSubsidyLoan"
                  value={data.previousGovtSubsidyLoan}
                  onChange={(v) => update('previousGovtSubsidyLoan', v)}
                  options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                  ]}
                />
              </div>

              <TwoQuestionRow
                left={
                  <>
                    <FieldLabel>27. CIBIL Score (for bank loan)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.cibilScore}
                      onChange={(v) => update('cibilScore', v)}
                      placeholder="CIBIL score"
                    />
                  </>
                }
                right={
                  <>
                    <FieldLabel>28. Net Worth as on date (for bank loan)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.netWorth}
                      onChange={(v) => update('netWorth', v)}
                      placeholder="Net worth (₹)"
                    />
                  </>
                }
              />

              <div className="space-y-1.5">
                <FieldLabel>29. Are you filing Income Tax returns?</FieldLabel>
                <RadioGroup
                  name="ne-filingIncomeTaxReturns"
                  value={data.filingIncomeTaxReturns}
                  onChange={(v) => update('filingIncomeTaxReturns', v)}
                  options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Section 4 (NE) — Decarbonisation Subsidy */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-900">
                Section 4: Decarbonisation Subsidy
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <FieldLabel>30. Are you investing in any of the following?</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DECARB_INVESTMENT_OPTIONS.map((opt) => (
                    <CheckboxPill
                      key={opt}
                      id={`ne-decarb-${makeDomId(opt)}`}
                      checked={(data.decarbInvestments || []).includes(opt)}
                      onChange={() => toggleList('decarbInvestments', opt)}
                      label={opt}
                    />
                  ))}
                </div>
                {(data.decarbInvestments || []).includes('Other') && (
                  <div className="mt-2 space-y-1.5">
                    <FieldLabel>Other (please specify)</FieldLabel>
                    <TextInput
                      value={data.decarbOtherText}
                      onChange={(v) => update('decarbOtherText', v)}
                      placeholder="Specify other investment..."
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <FieldLabel>31. Estimated decarbonisation project cost (₹)</FieldLabel>
                <TextInput
                  type="number"
                  value={data.decarbEstimatedCost}
                  onChange={(v) => update('decarbEstimatedCost', v)}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500">
                  Should not exceed 6% of total FCI (
                  {formatINR(Math.round(totalFixedAssetsBefore * 0.06))} for your current FCI).
                </p>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>
                  32. Any Challenges or Special Requests (e.g., DCP delay, second-hand machinery,
                  composite activity, budget constraints)
                </FieldLabel>
                <TextArea
                  value={data.neChallenges}
                  onChange={(v) => update('neChallenges', v)}
                  placeholder="Describe any challenges or special requests..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* Branch B: Expansion / Diversification → Sections 2 / 3 / 4     */}
      {/* ============================================================== */}
      {isExpansionOrDiv && (
        <>
          {/* Section 2 (ED) — Project Details & Financials */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-900">
                Section 2: Project Details &amp; Financials
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>14. Current MSME Classification (based on Udyam)</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {MSME_CLASSIFICATION_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-start gap-2 cursor-pointer select-none rounded-lg border p-3 transition text-sm
                        ${data.msmeClassification === opt ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      <input
                        type="radio"
                        name="ed-msme"
                        value={opt}
                        checked={data.msmeClassification === opt}
                        onChange={(e) => update('msmeClassification', e.target.value)}
                        className="mt-0.5 h-4 w-4 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="leading-snug">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <TwoQuestionRow
                left={
                  <>
                    <FieldLabel>15. Date of Incorporation</FieldLabel>
                    <DateInput
                      value={data.dateOfIncorporation}
                      onChange={(v) => update('dateOfIncorporation', v)}
                    />
                  </>
                }
                right={
                  <>
                    <FieldLabel>16. Actual Date of Consent for Establishment (CFE)</FieldLabel>
                    <DateInput value={data.cfeDate} onChange={(v) => update('cfeDate', v)} />
                  </>
                }
              />

              <TwoQuestionRow
                left={
                  <>
                    <FieldLabel>
                      17. Actual Date of Commencement of Commercial Production (DCP)
                    </FieldLabel>
                    <DateInput value={data.dcpDate} onChange={(v) => update('dcpDate', v)} />
                  </>
                }
                right={
                  <>
                    <FieldLabel>18. Actual Date of First Sale Invoice Generated</FieldLabel>
                    <DateInput
                      value={data.firstInvoiceDate}
                      onChange={(v) => update('firstInvoiceDate', v)}
                    />
                  </>
                }
              />

              {/* 19. Turnover Details */}
              <div className="space-y-2">
                <FieldLabel>19. Turnover Details (last 3 years + Projection)</FieldLabel>
                <p className="text-xs text-gray-500">
                  Total Turnover and Export % are auto-calculated as you type.
                </p>
                <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-600">
                        <th className="px-3 py-2 font-semibold">Financial Year</th>
                        <th className="px-3 py-2 font-semibold">Domestic Turnover (₹)</th>
                        <th className="px-3 py-2 font-semibold">Export Turnover (₹)</th>
                        <th className="px-3 py-2 font-semibold">Total Turnover (₹)</th>
                        <th className="px-3 py-2 font-semibold">Export % of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.turnoverRows || makeEmptyTurnoverRows()).map((row, idx) => (
                        <tr key={row.year} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-2 text-gray-800 font-medium">{row.year}</td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <TextInput
                              type="number"
                              value={row.domestic}
                              onChange={(v) => updateTurnoverCell(idx, 'domestic', v)}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <TextInput
                              type="number"
                              value={row.exportTurnover}
                              onChange={(v) => updateTurnoverCell(idx, 'exportTurnover', v)}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-800 font-semibold whitespace-nowrap">
                            {row.total === '' ? '—' : formatINR(row.total)}
                          </td>
                          <td className="px-3 py-2 text-gray-800 font-semibold whitespace-nowrap">
                            {row.exportPct === '' ? '—' : `${row.exportPct}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 20. Approved FCI breakdown Before / After */}
              <div className="space-y-2">
                <FieldLabel>
                  20. Total Approved Fixed Capital Investment (FCI) — as per DPR approved by Banker
                </FieldLabel>
                <p className="text-xs text-gray-500">
                  Investments made <span className="font-semibold">prior to</span> vs{' '}
                  <span className="font-semibold">after</span> Expansion / Diversification.
                </p>
                <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-600">
                        <th className="px-3 py-2 font-semibold w-1/2">Particulars</th>
                        <th className="px-3 py-2 font-semibold">Before (₹)</th>
                        <th className="px-3 py-2 font-semibold">After (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {FCI_ASSET_ROWS.map((r) => (
                        <tr key={r.key}>
                          <td className="px-3 py-2 text-gray-800">{r.label}</td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <TextInput
                              type="number"
                              value={data[`fci_${r.key}`]}
                              onChange={(v) => update(`fci_${r.key}`, v)}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <TextInput
                              type="number"
                              value={data[`fci_after_${r.key}`]}
                              onChange={(v) => update(`fci_after_${r.key}`, v)}
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 text-gray-900 font-semibold">TOTAL FIXED ASSETS</td>
                        <td className="px-3 py-2 text-gray-900 font-semibold">
                          {formatINR(totalFixedAssetsBefore)}
                        </td>
                        <td className="px-3 py-2 text-gray-900 font-semibold">
                          {formatINR(totalFixedAssetsAfter)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-800">Working Capital Requirement</td>
                        <td className="px-2 py-2">
                          <TextInput
                            type="number"
                            value={data.fci_workingCapital}
                            onChange={(v) => update('fci_workingCapital', v)}
                            placeholder="0"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <TextInput
                            type="number"
                            value={data.fci_after_workingCapital}
                            onChange={(v) => update('fci_after_workingCapital', v)}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 text-gray-900 font-semibold">
                          Estimated Total Project Cost
                        </td>
                        <td className="px-3 py-2 text-gray-900 font-semibold">
                          {formatINR(estimatedProjectCost)}
                        </td>
                        <td className="px-3 py-2 text-gray-900 font-semibold">
                          {formatINR(estimatedProjectCostAfter)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 21. P&M Investment Breakdown */}
              <div className="space-y-2">
                <FieldLabel>21. Total Investment in Plant &amp; Machinery / Equipment</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <FieldLabel>a. New Indigenous (Indian) Machinery (₹)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.pm_newIndigenous}
                      onChange={(v) => update('pm_newIndigenous', v)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>b. Imported Machinery (New) (₹)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.pm_importedNew}
                      onChange={(v) => update('pm_importedNew', v)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>c. Second Hand / Refurbished Machinery (₹)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.pm_secondHand}
                      onChange={(v) => update('pm_secondHand', v)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel>d. Self-Fabricated Machinery (₹)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.pm_selfFabricated}
                      onChange={(v) => update('pm_selfFabricated', v)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* 22. Premises ownership */}
              <div className="space-y-1.5">
                <FieldLabel>22. Business Premises or Land Ownership / Acquisition Details</FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PREMISES_OPTIONS.map((opt) => (
                    <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="ed-premisesOwnership"
                        value={opt}
                        checked={data.premisesOwnership === opt}
                        className="h-4 w-4 shrink-0 border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        onChange={(e) => {
                          const v = e.target.value;
                          update('premisesOwnership', v);
                          if (v !== 'Others') update('premisesOtherText', '');
                          if (v !== 'Leased') update('leaseAgreementType', '');
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
                {data.premisesOwnership === 'Others' && (
                  <div className="mt-2">
                    <TextInput
                      value={data.premisesOtherText}
                      onChange={(v) => update('premisesOtherText', v)}
                      placeholder="Please specify..."
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3 (ED) — Financial Readiness */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-900">Section 3: Financial Readiness</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>
                  23. Have you completed any Entrepreneurship / Skill Development training?
                </FieldLabel>
                <RadioGroup
                  name="ed-trainingCompleted"
                  value={data.trainingCompleted}
                  onChange={(v) => {
                    update('trainingCompleted', v);
                    if (v !== 'Yes') update('trainingNameAndYear', '');
                  }}
                  options={[
                    { label: 'Not yet', value: 'Not yet' },
                    { label: 'Yes (EDP / SDP / ESDP / VT)', value: 'Yes' },
                  ]}
                />
                {data.trainingCompleted === 'Yes' && (
                  <div className="mt-2 space-y-1.5">
                    <FieldLabel>If yes, please mention name of the training and year</FieldLabel>
                    <TextInput
                      value={data.trainingNameAndYear}
                      onChange={(v) => update('trainingNameAndYear', v)}
                      placeholder="Training name and year"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <FieldLabel>24. Unit Setup with</FieldLabel>
                <RadioGroup
                  name="ed-unitSetupFunding"
                  value={data.unitSetupFunding}
                  onChange={(v) => update('unitSetupFunding', v)}
                  options={UNIT_SETUP_OPTIONS_WITH_NOT_YET.map((opt) => ({ label: opt, value: opt }))}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>25. Have you identified a bank for the loan?</FieldLabel>
                <RadioGroup
                  name="ed-identifiedBank"
                  value={data.identifiedBank}
                  onChange={(v) => {
                    update('identifiedBank', v);
                    if (v !== 'Yes') {
                      update('identifiedBankName', '');
                      update('identifiedBankBranch', '');
                    } else {
                      update('existingBankerBankName', '');
                      update('existingBankerBranch', '');
                    }
                  }}
                  options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                  ]}
                />
                {data.identifiedBank === 'Yes' && (
                  <div className="mt-2">
                    <TwoQuestionRow
                      left={
                        <>
                          <FieldLabel>Name of bank</FieldLabel>
                          <TextInput
                            value={data.identifiedBankName}
                            onChange={(v) => update('identifiedBankName', v)}
                            placeholder="Bank name"
                          />
                        </>
                      }
                      right={
                        <>
                          <FieldLabel>Bank Branch</FieldLabel>
                          <TextInput
                            value={data.identifiedBankBranch}
                            onChange={(v) => update('identifiedBankBranch', v)}
                            placeholder="Branch"
                          />
                        </>
                      }
                    />
                  </div>
                )}
                {data.identifiedBank === 'No' && (
                  <div className="mt-2">
                    <FieldLabel>Existing Banker Details</FieldLabel>
                    <TwoQuestionRow
                      left={
                        <>
                          <FieldLabel>Bank Name</FieldLabel>
                          <TextInput
                            value={data.existingBankerBankName}
                            onChange={(v) => update('existingBankerBankName', v)}
                            placeholder="Bank name"
                          />
                        </>
                      }
                      right={
                        <>
                          <FieldLabel>Branch</FieldLabel>
                          <TextInput
                            value={data.existingBankerBranch}
                            onChange={(v) => update('existingBankerBranch', v)}
                            placeholder="Branch"
                          />
                        </>
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <FieldLabel>
                  26. Have you availed any previous government subsidy / loan under PMEGP / PMFME /
                  MUDRA / AP IDP / any other scheme?
                </FieldLabel>
                <RadioGroup
                  name="ed-previousGovtSubsidyLoan"
                  value={data.previousGovtSubsidyLoan}
                  onChange={(v) => update('previousGovtSubsidyLoan', v)}
                  options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                  ]}
                />
              </div>

              <TwoQuestionRow
                left={
                  <>
                    <FieldLabel>27. CIBIL Score (for bank loan)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.cibilScore}
                      onChange={(v) => update('cibilScore', v)}
                      placeholder="CIBIL score"
                    />
                  </>
                }
                right={
                  <>
                    <FieldLabel>28. Net Worth as on date (for bank loan)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.netWorth}
                      onChange={(v) => update('netWorth', v)}
                      placeholder="Net worth (₹)"
                    />
                  </>
                }
              />

              <div className="space-y-1.5">
                <FieldLabel>29. Are you filing Income Tax returns?</FieldLabel>
                <RadioGroup
                  name="ed-filingIncomeTaxReturns"
                  value={data.filingIncomeTaxReturns}
                  onChange={(v) => update('filingIncomeTaxReturns', v)}
                  options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Section 4 (ED) — Incentive-Specific Questions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-900">
                Section 4: Incentive-Specific Questions
              </h3>
            </div>

            <div className="space-y-8">
              {/* A. Investment Subsidy */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-900">A. Investment Subsidy (Section B.3)</p>
                <div className="space-y-1.5">
                  <FieldLabel>
                    30. Achieved DCP within standard investment period?
                  </FieldLabel>
                  <RadioGroup
                    name="invSubsidy-dcpAchievedInPeriod"
                    value={data.invSubsidy_dcpAchievedInPeriod}
                    onChange={(v) => update('invSubsidy_dcpAchievedInPeriod', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>
                    31. Bank / CA-certified bills for new plant &amp; machinery?
                  </FieldLabel>
                  <RadioGroup
                    name="invSubsidy-caCertifiedBills"
                    value={data.invSubsidy_caCertifiedBills}
                    onChange={(v) => update('invSubsidy_caCertifiedBills', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>32. Plant capacity utilisation at DCP (%)</FieldLabel>
                  <TextInput
                    type="number"
                    value={data.invSubsidy_capacityUtilization}
                    onChange={(v) => update('invSubsidy_capacityUtilization', v)}
                    placeholder="e.g., 65"
                  />
                  <p className="text-xs text-gray-500">
                    50–100% required for full subsidy in many cases.
                  </p>
                </div>
              </div>

              {/* B. Stamp Duty */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900">
                  B. Stamp Duty &amp; Transfer Duty Reimbursement (Sections B.8 &amp; B.15)
                </p>
                <div className="space-y-2">
                  <FieldLabel>33. Have you paid stamp duty / transfer duty on:</FieldLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {STAMP_DUTY_OPTIONS.map((opt) => (
                      <CheckboxPill
                        key={opt}
                        id={`ed-stamp-${makeDomId(opt)}`}
                        checked={(data.stampDuty_paidOn || []).includes(opt)}
                        onChange={() => toggleList('stampDuty_paidOn', opt)}
                        label={opt}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Amount paid (₹)</FieldLabel>
                  <TextInput
                    type="number"
                    value={data.stampDuty_amount}
                    onChange={(v) => update('stampDuty_amount', v)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* C. Power Cost Subsidy */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900">C. Power Cost Subsidy (Section B.9)</p>
                <div className="space-y-1.5">
                  <FieldLabel>
                    34. Power connection in the name of the enterprise from DISCOM / REC?
                  </FieldLabel>
                  <RadioGroup
                    name="power-inEnterpriseName"
                    value={data.power_inEnterpriseName}
                    onChange={(v) => update('power_inEnterpriseName', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>
                    35. Average (actual / estimated) annual power consumption (KVAH / units)
                  </FieldLabel>
                  <TextInput
                    value={data.power_avgAnnualConsumption}
                    onChange={(v) => update('power_avgAnnualConsumption', v)}
                    placeholder="Annual consumption"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>
                    36. For expansion / diversification: Base consumption certified by CA?
                  </FieldLabel>
                  <RadioGroup
                    name="power-baseConsumptionCertified"
                    value={data.power_baseConsumptionCertified}
                    onChange={(v) => update('power_baseConsumptionCertified', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
              </div>

              {/* D. Net SGST Reimbursement */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900">
                  D. Net SGST Reimbursement (Section B.10)
                </p>
                <div className="space-y-1.5">
                  <FieldLabel>
                    37. Separate GST registration only for manufacturing eligible products?
                  </FieldLabel>
                  <RadioGroup
                    name="sgst-separateGstRegistration"
                    value={data.sgst_separateGstRegistration}
                    onChange={(v) => update('sgst_separateGstRegistration', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>
                    38. Last FY net SGST paid through cash ledger (from GSTR-3B) (₹)
                  </FieldLabel>
                  <TextInput
                    type="number"
                    value={data.sgst_netSGSTPaidLastFY}
                    onChange={(v) => update('sgst_netSGSTPaidLastFY', v)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>39. Form-A from Commercial Tax Department?</FieldLabel>
                  <RadioGroup
                    name="sgst-hasFormA"
                    value={data.sgst_hasFormA}
                    onChange={(v) => update('sgst_hasFormA', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
              </div>

              {/* E. Local Procurement */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900">
                  E. Local Procurement Subsidy (Section B.13)
                </p>
                <div className="space-y-1.5">
                  <FieldLabel>40. Export turnover ≥ 80% of total turnover?</FieldLabel>
                  <RadioGroup
                    name="localProc-exportTurnoverGte80"
                    value={data.localProc_exportTurnoverGte80}
                    onChange={(v) => update('localProc_exportTurnoverGte80', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>41. Local (Andhra Pradesh) raw material procurement ≥ 60%?</FieldLabel>
                  <RadioGroup
                    name="localProc-localProcurementGte60"
                    value={data.localProc_localProcurementGte60}
                    onChange={(v) => update('localProc_localProcurementGte60', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>
                    42. Input Tax Credit (ITC) statements proving local procurement?
                  </FieldLabel>
                  <RadioGroup
                    name="localProc-hasItcStatements"
                    value={data.localProc_hasItcStatements}
                    onChange={(v) => update('localProc_hasItcStatements', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
              </div>

              {/* F. Skill Upgradation */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900">
                  F. Skill Upgradation Cost (Section B.11)
                </p>
                <div className="space-y-1.5">
                  <FieldLabel>43. Conducted practical skill training for local manpower?</FieldLabel>
                  <RadioGroup
                    name="skill-conductedTraining"
                    value={data.skill_conductedTraining}
                    onChange={(v) => update('skill_conductedTraining', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>44. Number of employees trained</FieldLabel>
                  <TextInput
                    type="number"
                    value={data.skill_numberOfTrained}
                    onChange={(v) => update('skill_numberOfTrained', v)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>
                    45. Appointment letters and promoter certification for trained employees?
                  </FieldLabel>
                  <RadioGroup
                    name="skill-hasAppointmentLetters"
                    value={data.skill_hasAppointmentLetters}
                    onChange={(v) => update('skill_hasAppointmentLetters', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                    ]}
                  />
                </div>
              </div>

              {/* G. Energy & Water Audit */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900">
                  G. Energy &amp; Water Audit + Equipment Cost (Section B.12)
                </p>
                <div className="space-y-1.5">
                  <FieldLabel>46. Conducted Energy / Water Audit?</FieldLabel>
                  <RadioGroup
                    name="audit-conducted"
                    value={data.audit_conducted}
                    onChange={(v) => update('audit_conducted', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                      { label: 'Not Yet', value: 'Not Yet' },
                    ]}
                  />
                </div>
                <TwoQuestionRow
                  left={
                    <>
                      <FieldLabel>47. Audit cost incurred (₹)</FieldLabel>
                      <TextInput
                        type="number"
                        value={data.audit_costIncurred}
                        onChange={(v) => update('audit_costIncurred', v)}
                        placeholder="0"
                      />
                    </>
                  }
                  right={
                    <>
                      <FieldLabel>48. Equipment cost to implement audit recommendations (₹)</FieldLabel>
                      <TextInput
                        type="number"
                        value={data.audit_equipmentCost}
                        onChange={(v) => update('audit_equipmentCost', v)}
                        placeholder="0"
                      />
                    </>
                  }
                />
              </div>

              {/* H. Quality Certification */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900">
                  H. Quality Certification Cost Top-up (Section B.14)
                </p>
                <div className="space-y-2">
                  <FieldLabel>49. Quality certifications obtained</FieldLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {QUALITY_CERTIFICATION_OPTIONS.map((opt) => (
                      <CheckboxPill
                        key={opt}
                        id={`ed-quality-${makeDomId(opt)}`}
                        checked={(data.quality_certifications || []).includes(opt)}
                        onChange={() => toggleList('quality_certifications', opt)}
                        label={opt}
                      />
                    ))}
                  </div>
                  {(data.quality_certifications || []).includes('Others') && (
                    <div className="mt-2 space-y-1.5">
                      <FieldLabel>Specify other certification(s)</FieldLabel>
                      <TextInput
                        value={data.quality_otherCertText}
                        onChange={(v) => update('quality_otherCertText', v)}
                        placeholder="e.g., BIS, FSSAI, etc."
                      />
                    </div>
                  )}
                </div>
                <TwoQuestionRow
                  left={
                    <>
                      <FieldLabel>50. Total certification cost (₹)</FieldLabel>
                      <TextInput
                        type="number"
                        value={data.quality_totalCertCost}
                        onChange={(v) => update('quality_totalCertCost', v)}
                        placeholder="0"
                      />
                    </>
                  }
                  right={
                    <>
                      <FieldLabel>51. GoI subsidy received for the same (₹)</FieldLabel>
                      <TextInput
                        type="number"
                        value={data.quality_goiSubsidyReceived}
                        onChange={(v) => update('quality_goiSubsidyReceived', v)}
                        placeholder="0"
                      />
                    </>
                  }
                />
              </div>

              {/* I. Decarbonization Subsidy */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-900">
                  I. Decarbonization Subsidy (Section B.7 + Annexure 3B)
                </p>
                <div className="space-y-1.5">
                  <FieldLabel>
                    52. Have you claimed / planning to claim Decarbonisation Subsidy?
                  </FieldLabel>
                  <RadioGroup
                    name="decarbB-claimStatus"
                    value={data.decarbB_claimStatus}
                    onChange={(v) => update('decarbB_claimStatus', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                      { label: 'Not sure', value: 'Not sure' },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel>53. Are you investing in any of the following?</FieldLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DECARB_INVESTMENT_OPTIONS.map((opt) => (
                      <CheckboxPill
                        key={opt}
                        id={`ed-decarb-${makeDomId(opt)}`}
                        checked={(data.decarbInvestments || []).includes(opt)}
                        onChange={() => toggleList('decarbInvestments', opt)}
                        label={opt}
                      />
                    ))}
                  </div>
                  {(data.decarbInvestments || []).includes('Other') && (
                    <div className="mt-2 space-y-1.5">
                      <FieldLabel>Other (please specify)</FieldLabel>
                      <TextInput
                        value={data.decarbOtherText}
                        onChange={(v) => update('decarbOtherText', v)}
                        placeholder="Specify other investment..."
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>54. Estimated decarbonisation project cost (₹)</FieldLabel>
                  <TextInput
                    type="number"
                    value={data.decarbEstimatedCost}
                    onChange={(v) => update('decarbEstimatedCost', v)}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500">
                    Should not exceed 6% of total FCI (
                    {formatINR(Math.round((totalFixedAssetsBefore + totalFixedAssetsAfter) * 0.06))}{' '}
                    for the combined FCI shown above).
                  </p>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>
                    55. Chartered Engineer certificate showing emission / water / energy savings?
                  </FieldLabel>
                  <RadioGroup
                    name="decarbB-chartEngCertificate"
                    value={data.decarbB_chartEngCertificate}
                    onChange={(v) => update('decarbB_chartEngCertificate', v)}
                    options={[
                      { label: 'Yes', value: 'Yes' },
                      { label: 'No', value: 'No' },
                      { label: 'Not Yet', value: 'Not Yet' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5 (ED) — Documents Checklist & Additional Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="mb-5">
              <h3 className="text-base font-bold text-gray-900">
                Section 5: Documents Checklist &amp; Additional Information
              </h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <FieldLabel>
                  56. Documents available (tick what you can provide immediately)
                </FieldLabel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DOCUMENTS_OPTIONS.map((opt) => (
                    <CheckboxPill
                      key={opt}
                      id={`ed-doc-${makeDomId(opt)}`}
                      checked={(data.documentsAvailable || []).includes(opt)}
                      onChange={() => toggleList('documentsAvailable', opt)}
                      label={opt}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>
                  57. Any Challenges or Special Requests (e.g., DCP delay, second-hand machinery,
                  composite activity, budget constraints)
                </FieldLabel>
                <TextArea
                  value={data.edChallenges}
                  onChange={(v) => update('edChallenges', v)}
                  placeholder="Describe any challenges or special requests..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-8 flex items-center justify-end gap-3">
        <button
          type="submit"
          className="px-5 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-semibold"
        >
          Next
        </button>
      </div>
    </form>
  );
};

export default ApIdpSectionAForm;
