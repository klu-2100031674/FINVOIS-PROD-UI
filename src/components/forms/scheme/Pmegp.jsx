import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SPECIAL_CATEGORIES = [
  'SC',
  'ST',
  'OBC',
  'Minority',
  'Woman',
  'Ex-Serviceman',
  'Transgender',
  'Differently-abled',
  'NER / Aspirational District / Hill / Border Area',
];

const EDUCATION_OPTIONS = [
  'Below Class 8',
  'Class 8 or above',
  'Graduate / Post-graduate / Diploma / ITI etc.',
];

const BUSINESS_UNIT_OPTIONS = ['Manufacturing', 'Service', 'Trading'];
const PROJECT_STAGE_OPTIONS = [
  'Completely new',
  'Already started and under upgradation / expansion stage',
];
const PREMISES_OPTIONS = [
  'Own / Purchased / Inherited',
  'Leased',
  'APIIC allotted',
  'Government allotted',
  'Others',
];

const SPECIAL_ZONE_OPTIONS = [
  'NER / Hill / Border Area',
  'Aspirational District (as notified by NITI Aayog)',
  'Left-Wing Extremism affected district / A&N Islands',
];

const toNumber0 = (v) => {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const initialState = {
  fullName: '',
  businessLegalName: '',
  ageYears: '',
  mobileNumber: '',
  email: '',
  aadhaarNumber: '',
  pan: '',
  district: '',
  state: '',
  above18: '',
  maritalStatus: '',
  ownHouse: '',
  educationQualification: '',
  specialCategoryYesNo: '',
  specialCategories: [],

  // Section B
  proposedBusinessActivity: '',
  hasRelevantWorkExperience: '',
  businessUnitType: '',
  projectStage: '',
  alreadyStartedAvailedLoan: '',
  loanAvailedMonth: '',
  loanAvailedYear: '',
  premisesOwnership: '',
  premisesOtherText: '',
  leaseAgreementType: '',

  // Section C (Costs)
  assetPlantMachinery: '',
  assetServiceEquipment: '',
  assetShedConstructionCivil: '',
  assetLandPurchase: '',
  assetElectricalPlumbing: '',
  assetElectronicItems: '',
  assetFurnitureFittings: '',
  assetVehicles: '',
  assetOtherAssetsNonDepreciable: '',
  workingCapitalRequirement: '',

  // Section D: Training & Experience
  trainingCompleted: '', // Not yet | Yes
  trainingNameAndYear: '',

  // Section C: Location & Rural / Urban Status
  proposedUnitFullAddress: '',
  unitDistrict: '',
  unitMandal: '',
  unitVillageOrCity: '',
  ruralUrbanStatus: '', // Urban | Rural
  specialZones: [],

  // Section E: Financial Readiness
  identifiedBank: '', // Yes | No
  identifiedBankName: '',
  identifiedBankBranch: '',
  existingBankerBankName: '',
  existingBankerBranch: '',
  previousGovtSubsidyLoan: '', // Yes | No
  cibilScore: '',
  netWorth: '',
  filingIncomeTaxReturns: '', // Yes | No

  // Section F: Upgradation (Only if already running a unit)
  isUpgradation: '', // Yes | No
  originalUnitSetupYear: '',
  originalLoanFullyRepaid: '', // Yes | No
  unitProfitAndGoodTurnover: '', // Yes | No
  proposedUpgradationProjectCost: '',
};

const FieldLabel = ({ children, required }) => (
  <label className="block text-sm font-semibold text-gray-800">
    {children} {required ? <span className="text-red-500">*</span> : null}
  </label>
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
        peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900 peer-focus-visible:ring-offset-2
        peer-checked:border-purple-300 peer-checked:bg-purple-50 peer-checked:text-purple-800"
    >
      <span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-300 bg-white text-[12px] font-bold text-transparent
          peer-checked:border-purple-400 peer-checked:bg-purple-600 peer-checked:text-white"
      >
        ✓
      </span>
      <span className="leading-snug">{label}</span>
    </label>
  </div>
);

const makeDomId = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const radioToneFromValue = (v) => {
  const s = String(v || '').toLowerCase();
  if (s === 'yes') return 'yes';
  if (s === 'no') return 'no';
  return 'neutral';
};

const RadioGroup = ({ name, value, onChange, options }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const id = `pmegp-radio-${makeDomId(name)}-${makeDomId(opt.value)}`;
      const checked = value === opt.value;
      const tone = opt.tone || radioToneFromValue(opt.value);

      const checkedBorder =
        tone === 'yes'
          ? 'peer-checked:border-emerald-300 peer-checked:bg-emerald-50 peer-checked:text-emerald-800'
          : tone === 'no'
            ? 'peer-checked:border-rose-300 peer-checked:bg-rose-50 peer-checked:text-rose-800'
            : 'peer-checked:border-purple-300 peer-checked:bg-purple-50 peer-checked:text-purple-800';

      const dotChecked =
        tone === 'yes'
          ? 'peer-checked:border-emerald-500 peer-checked:bg-emerald-600'
          : tone === 'no'
            ? 'peer-checked:border-rose-500 peer-checked:bg-rose-600'
            : 'peer-checked:border-purple-500 peer-checked:bg-purple-600';

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
            className={`inline-flex items-center gap-2 cursor-pointer select-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition
              hover:border-gray-300 hover:bg-gray-50
              peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900 peer-focus-visible:ring-offset-2
              ${checkedBorder}`}
          >
            <span
              aria-hidden
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white ${dotChecked}`}
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

const TwoQuestionRow = ({ left, right }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div className="space-y-1.5">
      {left}
    </div>
    <div className="space-y-1.5">
      {right}
    </div>
  </div>
);

/**
 * Section A: Personal & Basic Eligibility Details (PMEGP)
 *
 * Props:
 * - initialData?: partial state
 * - onSubmit?: (data) => void
 */
const PmegpSectionAForm = ({ initialData = null, onSubmit = null }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(() => ({ ...initialState, ...(initialData || {}) }));

  const specialCategoryEnabled = data.specialCategoryYesNo === 'Yes';
  const isAlreadyStarted = data.projectStage === 'Already started and under upgradation / expansion stage';
  const loanAvailedEnabled = isAlreadyStarted && data.alreadyStartedAvailedLoan === 'Yes';
  const leasedEnabled = data.premisesOwnership === 'Leased';
  const selectedSet = useMemo(() => new Set(data.specialCategories || []), [data.specialCategories]);
  const specialZoneSet = useMemo(() => new Set(data.specialZones || []), [data.specialZones]);

  const toggleSpecialZone = (zone) => {
    setData((p) => {
      const next = new Set(p.specialZones || []);
      if (next.has(zone)) next.delete(zone);
      else next.add(zone);
      return { ...p, specialZones: Array.from(next) };
    });
  };

  const update = (key, value) => setData((p) => ({ ...p, [key]: value }));

  const totalFixedAssets = useMemo(() => {
    return (
      toNumber0(data.assetPlantMachinery) +
      toNumber0(data.assetServiceEquipment) +
      toNumber0(data.assetShedConstructionCivil) +
      toNumber0(data.assetLandPurchase) +
      toNumber0(data.assetElectricalPlumbing) +
      toNumber0(data.assetElectronicItems) +
      toNumber0(data.assetFurnitureFittings) +
      toNumber0(data.assetVehicles) +
      toNumber0(data.assetOtherAssetsNonDepreciable)
    );
  }, [
    data.assetPlantMachinery,
    data.assetServiceEquipment,
    data.assetShedConstructionCivil,
    data.assetLandPurchase,
    data.assetElectricalPlumbing,
    data.assetElectronicItems,
    data.assetFurnitureFittings,
    data.assetVehicles,
    data.assetOtherAssetsNonDepreciable,
  ]);

  const estimatedTotalProjectCost = useMemo(() => {
    return totalFixedAssets + toNumber0(data.workingCapitalRequirement);
  }, [totalFixedAssets, data.workingCapitalRequirement]);

  const toggleSpecialCategory = (cat) => {
    setData((p) => {
      const next = new Set(p.specialCategories || []);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return { ...p, specialCategories: Array.from(next) };
    });
  };

  const fillTestData = () => {
    setData({
      ...initialState,

      // Section A
      fullName: 'Ravi Kumar',
      businessLegalName: 'RK TRADERS',
      ageYears: 29,
      mobileNumber: '9876543210',
      email: 'ravikumar@example.com',
      aadhaarNumber: '1234 5678 9012',
      pan: 'ABCDE1234F',
      district: 'Krishna',
      state: 'Andhra Pradesh',
      above18: 'Yes',
      maritalStatus: 'Married',
      ownHouse: 'Yes',
      educationQualification: 'Graduate / Post-graduate / Diploma / ITI etc.',
      specialCategoryYesNo: 'Yes',
      specialCategories: ['OBC', 'Minority'],

      // Section B
      proposedBusinessActivity:
        'Proposed to start a small trading and distribution unit for FMCG items with last-mile delivery in nearby mandals. Focus on kirana stores and small retailers. Will maintain basic inventory and use digital billing.',
      hasRelevantWorkExperience: 'Yes',
      businessUnitType: 'Trading',
      projectStage: 'Already started and under upgradation / expansion stage',
      alreadyStartedAvailedLoan: 'Yes',
      loanAvailedMonth: 'March',
      loanAvailedYear: 2024,
      premisesOwnership: 'Leased',
      premisesOtherText: '',
      leaseAgreementType: 'Registered',

      // Costs / Assets
      assetPlantMachinery: 250000,
      assetServiceEquipment: 50000,
      assetShedConstructionCivil: 0,
      assetLandPurchase: 0,
      assetElectricalPlumbing: 25000,
      assetElectronicItems: 40000,
      assetFurnitureFittings: 30000,
      assetVehicles: 150000,
      assetOtherAssetsNonDepreciable: 20000,
      workingCapitalRequirement: 300000,

      // Location (Section C)
      proposedUnitFullAddress:
        'D.No. 12-34, Near Main Road, Ward-5, Vijayawada, Krishna District, Andhra Pradesh - 520010',
      unitDistrict: 'Krishna',
      unitMandal: 'Vijayawada (Rural)',
      unitVillageOrCity: 'Vijayawada',
      ruralUrbanStatus: 'Urban',
      specialZones: ['Aspirational District (as notified by NITI Aayog)'],

      // Training (Section D)
      trainingCompleted: 'Yes',
      trainingNameAndYear: 'EDP Training (10 days) - 2025',

      // Financial Readiness (Section E)
      identifiedBank: 'No',
      identifiedBankName: '',
      identifiedBankBranch: '',
      existingBankerBankName: 'State Bank of India',
      existingBankerBranch: 'Vijayawada Main Branch',
      previousGovtSubsidyLoan: 'No',
      cibilScore: 745,
      netWorth: 650000,
      filingIncomeTaxReturns: 'Yes',

      // Upgradation (Section F)
      isUpgradation: 'Yes',
      originalUnitSetupYear: 2022,
      originalLoanFullyRepaid: 'No',
      unitProfitAndGoodTurnover: 'Yes',
      proposedUpgradationProjectCost: 450000,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...data,
      ageYears: data.ageYears === '' ? '' : Number(data.ageYears),
    };
    onSubmit?.(payload);
    navigate('/generate/pmegp/scheme-mail', { state: { pmegpForm: payload } });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900">Section A: Personal &amp; Basic Eligibility Details</h2>
        <button
          type="button"
          onClick={fillTestData}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm font-semibold"
        >
          Fill Test Data
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <FieldLabel required>1. Full Name</FieldLabel>
          <TextInput value={data.fullName} onChange={(v) => update('fullName', v)} placeholder="Full Name" />
        </div>

        <TwoQuestionRow
          left={
            <>
              <FieldLabel>2. Business Legal Name (as per GST/Udyam)</FieldLabel>
              <TextInput
                value={data.businessLegalName}
                onChange={(v) => update('businessLegalName', v)}
                placeholder="Business Legal Name"
              />
            </>
          }
          right={
            <>
              <FieldLabel>3. Age (in years)</FieldLabel>
              <TextInput value={data.ageYears} onChange={(v) => update('ageYears', v)} placeholder="Age" type="number" />
            </>
          }
        />

        <TwoQuestionRow
          left={
            <>
              <FieldLabel>4. Mobile Number</FieldLabel>
              <TextInput value={data.mobileNumber} onChange={(v) => update('mobileNumber', v)} placeholder="Mobile Number" />
            </>
          }
          right={
            <>
              <FieldLabel>5. Email</FieldLabel>
              <TextInput value={data.email} onChange={(v) => update('email', v)} placeholder="Email" type="email" />
            </>
          }
        />

        <TwoQuestionRow
          left={
            <>
              <FieldLabel>6. Aadhaar Number</FieldLabel>
              <TextInput value={data.aadhaarNumber} onChange={(v) => update('aadhaarNumber', v)} placeholder="Aadhaar Number" />
            </>
          }
          right={
            <>
              <FieldLabel>7. PAN</FieldLabel>
              <TextInput value={data.pan} onChange={(v) => update('pan', v)} placeholder="PAN" />
            </>
          }
        />

        <TwoQuestionRow
          left={
            <>
              <FieldLabel>8. District</FieldLabel>
              <TextInput value={data.district} onChange={(v) => update('district', v)} placeholder="District" />
            </>
          }
          right={
            <>
              <FieldLabel>9. State</FieldLabel>
              <TextInput value={data.state} onChange={(v) => update('state', v)} placeholder="State" />
            </>
          }
        />

        <div className="space-y-1.5">
          <FieldLabel>10. Are you above 18 years of age?</FieldLabel>
          <RadioGroup
            name="above18"
            value={data.above18}
            onChange={(v) => update('above18', v)}
            options={[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>11. Marital status</FieldLabel>
          <RadioGroup
            name="maritalStatus"
            value={data.maritalStatus}
            onChange={(v) => update('maritalStatus', v)}
            options={[
              { label: 'Married', value: 'Married' },
              { label: 'Not yet Married', value: 'Not yet Married' },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>12. Do you own house?</FieldLabel>
          <RadioGroup
            name="ownHouse"
            value={data.ownHouse}
            onChange={(v) => update('ownHouse', v)}
            options={[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>13. Educational Qualification</FieldLabel>
          <RadioGroup
            name="educationQualification"
            value={data.educationQualification}
            onChange={(v) => update('educationQualification', v)}
            options={EDUCATION_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>14. Do you belong to any special category?</FieldLabel>
          <RadioGroup
            name="specialCategoryYesNo"
            value={data.specialCategoryYesNo}
            onChange={(v) => {
              if (v !== 'Yes') {
                update('specialCategories', []);
              }
              update('specialCategoryYesNo', v);
            }}
            options={[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
            ]}
          />
        </div>

        {specialCategoryEnabled && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-800">14(a). If Yes, select all that apply</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SPECIAL_CATEGORIES.map((cat) => (
                <CheckboxPill
                  key={cat}
                  id={`pmegp-special-cat-${cat}`}
                  checked={selectedSet.has(cat)}
                  onChange={() => toggleSpecialCategory(cat)}
                  label={cat}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section B */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section B: Business Idea &amp; Project Details</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>15. What is the proposed business/activity? (Explain in detail)</FieldLabel>
            <TextArea
              value={data.proposedBusinessActivity}
              onChange={(v) => update('proposedBusinessActivity', v)}
              placeholder="Describe the proposed business/activity..."
              rows={5}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>16. Do you have relevant work experience in the proposed business?</FieldLabel>
            <RadioGroup
              name="hasRelevantWorkExperience"
              value={data.hasRelevantWorkExperience}
              onChange={(v) => update('hasRelevantWorkExperience', v)}
              options={[
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>17. Is it a Manufacturing or Service or Trading unit?</FieldLabel>
            <RadioGroup
              name="businessUnitType"
              value={data.businessUnitType}
              onChange={(v) => update('businessUnitType', v)}
              options={BUSINESS_UNIT_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>18. Have you already started this business or is it a new project?</FieldLabel>
            <RadioGroup
              name="projectStage"
              value={data.projectStage}
              onChange={(v) => {
                update('projectStage', v);
                if (v !== 'Already started and under upgradation / expansion stage') {
                  update('alreadyStartedAvailedLoan', '');
                  update('loanAvailedMonth', '');
                  update('loanAvailedYear', '');
                }
              }}
              options={PROJECT_STAGE_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          </div>

          {isAlreadyStarted && (
            <div className="space-y-1.5">
              <FieldLabel>19. If already started, did you avail loan as on date?</FieldLabel>
              <RadioGroup
                name="alreadyStartedAvailedLoan"
                value={data.alreadyStartedAvailedLoan}
                onChange={(v) => {
                  update('alreadyStartedAvailedLoan', v);
                  if (v !== 'Yes') {
                    update('loanAvailedMonth', '');
                    update('loanAvailedYear', '');
                  }
                }}
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' },
                ]}
              />
            </div>
          )}

          {loanAvailedEnabled && (
            <TwoQuestionRow
              left={
                <>
                  <FieldLabel>19(a). Month</FieldLabel>
                  <TextInput
                    value={data.loanAvailedMonth}
                    onChange={(v) => update('loanAvailedMonth', v)}
                    placeholder="Month (e.g., March)"
                  />
                </>
              }
              right={
                <>
                  <FieldLabel>19(b). Year</FieldLabel>
                  <TextInput
                    value={data.loanAvailedYear}
                    onChange={(v) => update('loanAvailedYear', v)}
                    placeholder="Year (e.g., 2026)"
                    type="number"
                  />
                </>
              }
            />
          )}

          <div className="space-y-1.5">
            <FieldLabel>20. Business premises or Land Ownership / Acquisition Details</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PREMISES_OPTIONS.map((opt) => (
                <label key={opt} className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="premisesOwnership"
                    value={opt}
                    checked={data.premisesOwnership === opt}
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

          {leasedEnabled && (
            <div className="space-y-1.5">
              <FieldLabel>21. If leased, lease agreement is</FieldLabel>
              <RadioGroup
                name="leaseAgreementType"
                value={data.leaseAgreementType}
                onChange={(v) => update('leaseAgreementType', v)}
                options={[
                  { label: 'Registered', value: 'Registered' },
                  { label: 'Unregistered', value: 'Unregistered' },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Section C */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Estimated Total Project Cost (₹)</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200">
            <div className="col-span-8 px-4 py-3 text-sm font-semibold text-gray-800">ASSETS: Particulars</div>
            <div className="col-span-4 px-4 py-3 text-sm font-semibold text-gray-800 text-right">Amount (₹)</div>
          </div>

          <div className="divide-y divide-gray-200">
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 px-4 py-3 text-sm text-gray-800">Plant and Machinery</div>
              <div className="col-span-4 px-4 py-2">
                <TextInput
                  type="number"
                  value={data.assetPlantMachinery}
                  onChange={(v) => update('assetPlantMachinery', v)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 px-4 py-3 text-sm text-gray-800">Service Equipment</div>
              <div className="col-span-4 px-4 py-2">
                <TextInput
                  type="number"
                  value={data.assetServiceEquipment}
                  onChange={(v) => update('assetServiceEquipment', v)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 px-4 py-3 text-sm text-gray-800">Shed Construction and Civil works</div>
              <div className="col-span-4 px-4 py-2">
                <TextInput
                  type="number"
                  value={data.assetShedConstructionCivil}
                  onChange={(v) => update('assetShedConstructionCivil', v)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 px-4 py-3 text-sm text-gray-800">Land purchase</div>
              <div className="col-span-4 px-4 py-2">
                <TextInput
                  type="number"
                  value={data.assetLandPurchase}
                  onChange={(v) => update('assetLandPurchase', v)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 px-4 py-3 text-sm text-gray-800">Electrical and Plumbing Items</div>
              <div className="col-span-4 px-4 py-2">
                <TextInput
                  type="number"
                  value={data.assetElectricalPlumbing}
                  onChange={(v) => update('assetElectricalPlumbing', v)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 px-4 py-3 text-sm text-gray-800">Electronic Items</div>
              <div className="col-span-4 px-4 py-2">
                <TextInput
                  type="number"
                  value={data.assetElectronicItems}
                  onChange={(v) => update('assetElectronicItems', v)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 px-4 py-3 text-sm text-gray-800">Furniture and Fittings</div>
              <div className="col-span-4 px-4 py-2">
                <TextInput
                  type="number"
                  value={data.assetFurnitureFittings}
                  onChange={(v) => update('assetFurnitureFittings', v)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 px-4 py-3 text-sm text-gray-800">Vehicles</div>
              <div className="col-span-4 px-4 py-2">
                <TextInput
                  type="number"
                  value={data.assetVehicles}
                  onChange={(v) => update('assetVehicles', v)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 px-4 py-3 text-sm text-gray-800">Other Assets (Non-Depreciable assets)</div>
              <div className="col-span-4 px-4 py-2">
                <TextInput
                  type="number"
                  value={data.assetOtherAssetsNonDepreciable}
                  onChange={(v) => update('assetOtherAssetsNonDepreciable', v)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center bg-gray-50">
              <div className="col-span-8 px-4 py-3 text-sm font-semibold text-gray-900">TOTAL FIXED ASSETS</div>
              <div className="col-span-4 px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                ₹{totalFixedAssets.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="grid grid-cols-12 items-center">
              <div className="col-span-8 px-4 py-3 text-sm text-gray-800">Working Capital Requirement</div>
              <div className="col-span-4 px-4 py-2">
                <TextInput
                  type="number"
                  value={data.workingCapitalRequirement}
                  onChange={(v) => update('workingCapitalRequirement', v)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 items-center bg-gray-50">
              <div className="col-span-8 px-4 py-3 text-sm font-semibold text-gray-900">Estimated Total project cost (₹)</div>
              <div className="col-span-4 px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                ₹{estimatedTotalProjectCost.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section C: Location & Rural / Urban Status */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section C: Location &amp; Rural / Urban Status</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>22. Full address of the proposed unit</FieldLabel>
            <TextArea
              value={data.proposedUnitFullAddress}
              onChange={(v) => update('proposedUnitFullAddress', v)}
              placeholder="Full address of the proposed unit..."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>23. Location of the Unit</FieldLabel>
            <TwoQuestionRow
              left={
                <>
                  <FieldLabel>District</FieldLabel>
                  <TextInput value={data.unitDistrict} onChange={(v) => update('unitDistrict', v)} placeholder="District" />
                </>
              }
              right={
                <>
                  <FieldLabel>Mandal</FieldLabel>
                  <TextInput value={data.unitMandal} onChange={(v) => update('unitMandal', v)} placeholder="Mandal" />
                </>
              }
            />
            <div className="mt-3">
              <FieldLabel>Village/City</FieldLabel>
              <TextInput
                value={data.unitVillageOrCity}
                onChange={(v) => update('unitVillageOrCity', v)}
                placeholder="Village/City"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>24. Rural / Urban status</FieldLabel>
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

          <div className="space-y-1.5">
            <FieldLabel>25. Does the area fall under any special zone?</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SPECIAL_ZONE_OPTIONS.map((z) => (
                <CheckboxPill
                  key={z}
                  id={`pmegp-special-zone-${z}`}
                  checked={specialZoneSet.has(z)}
                  onChange={() => toggleSpecialZone(z)}
                  label={z}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section D: Training & Experience */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section D: Training &amp; Experience</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>26. Have you completed any Entrepreneurship / Skill Development training?</FieldLabel>
            <RadioGroup
              name="trainingCompleted"
              value={data.trainingCompleted}
              onChange={(v) => {
                update('trainingCompleted', v);
                if (v !== 'Yes') update('trainingNameAndYear', '');
              }}
              options={[
                { label: 'Not yet', value: 'Not yet' },
                { label: 'Yes (EDP / SDP / ESDP / VT of minimum 10 days or 60 hours online)', value: 'Yes' },
              ]}
            />
          </div>

          {data.trainingCompleted === 'Yes' && (
            <div className="space-y-1.5">
              <FieldLabel>26(a). If yes, please mention name of the training and year</FieldLabel>
              <TextInput
                value={data.trainingNameAndYear}
                onChange={(v) => update('trainingNameAndYear', v)}
                placeholder="Training name and year"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section E: Financial Readiness */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section E: Financial Readiness</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>27. Have you identified a bank for the loan?</FieldLabel>
            <RadioGroup
              name="identifiedBank"
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
          </div>

          {data.identifiedBank === 'Yes' && (
            <div className="space-y-1.5">
            <FieldLabel>27(a). Loan Banker Details</FieldLabel>
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
            <div className="space-y-1.5">
              <FieldLabel>27(a). Existing Banker Details</FieldLabel>
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

          <div className="space-y-1.5">
            <FieldLabel>28. Have you availed any previous government subsidy / loan under PMEGP / PMFME / MUDRA / any other scheme?</FieldLabel>
            <RadioGroup
              name="previousGovtSubsidyLoan"
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
                <FieldLabel>29. What is your CIBIL score (For Bank loan purpose)</FieldLabel>
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
                <FieldLabel>30. What is your Net worth as on date (For Bank loan purpose)</FieldLabel>
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
            <FieldLabel>31. Are you filing Income Tax returns?</FieldLabel>
            <RadioGroup
              name="filingIncomeTaxReturns"
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

      {/* Section F: Upgradation (Only if already running a unit) */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section F: Upgradation (Only if already running a unit)</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>32. Is this an upgradation / expansion of an existing unit?</FieldLabel>
            <RadioGroup
              name="isUpgradation"
              value={data.isUpgradation}
              onChange={(v) => {
                update('isUpgradation', v);
                if (v !== 'Yes') {
                  update('originalUnitSetupYear', '');
                  update('originalLoanFullyRepaid', '');
                  update('unitProfitAndGoodTurnover', '');
                  update('proposedUpgradationProjectCost', '');
                }
              }}
              options={[
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ]}
            />
          </div>

          {data.isUpgradation === 'Yes' && (
            <>
              <div className="space-y-1.5">
                <FieldLabel>32(a). Year when original unit was set up</FieldLabel>
                <TextInput
                  type="number"
                  value={data.originalUnitSetupYear}
                  onChange={(v) => update('originalUnitSetupYear', v)}
                  placeholder="Year"
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>32(b). Is the original loan fully repaid?</FieldLabel>
                <RadioGroup
                  name="originalLoanFullyRepaid"
                  value={data.originalLoanFullyRepaid}
                  onChange={(v) => update('originalLoanFullyRepaid', v)}
                  options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>32(c). Is the unit making profit and having good turnover?</FieldLabel>
                <RadioGroup
                  name="unitProfitAndGoodTurnover"
                  value={data.unitProfitAndGoodTurnover}
                  onChange={(v) => update('unitProfitAndGoodTurnover', v)}
                  options={[
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                  ]}
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel>32(d). Proposed upgradation project cost (₹)</FieldLabel>
                <TextInput
                  type="number"
                  value={data.proposedUpgradationProjectCost}
                  onChange={(v) => update('proposedUpgradationProjectCost', v)}
                  placeholder="0"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
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

export default PmegpSectionAForm;

