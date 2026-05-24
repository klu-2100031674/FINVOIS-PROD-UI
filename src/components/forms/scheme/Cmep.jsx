import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CMEP_SCHEME_MAIL_PATH } from './cmepSchemeMailConstants';
import { saveSchemeFormSession } from '../../../utils/schemeFormSession';

const SPECIAL_CATEGORIES = [
  'Woman',
  'SC',
  'ST',
  'OBC',
  'Minority',
  'Person with Disability (PwD)',
  'Ex-Servicemen',
  'None (General Category)',
];

const EDUCATION_OPTIONS = [
  'Below 8th',
  '8th Pass',
  '10th',
  'Intermediate',
  'Graduate',
  'Post Graduate',
  'Others',
];

const PRIOR_EXPERIENCE_OPTIONS = [
  'No experience',
  'Less than 1 year',
  '1–3 years',
  'More than 3 years',
];

const PROJECT_SECTOR_OPTIONS = [
  'Manufacturing Sector',
  'Knowledge Economy Sector (Software, App, FinTech, AI, Digital Healthcare, etc.)',
];

const PROJECT_TYPE_OPTIONS = ['New Enterprise', 'Expansion', 'Diversification'];

const PLANNED_EMPLOYMENT_OPTIONS = ['Only Self', '2–5', 'Above 5'];

const PREMISES_OPTIONS = [
  'Owned / Inherited Land',
  'Rented',
  'Not yet arranged',
  'In Industrial Park',
];

const DOCUMENT_OPTIONS = [
  'Aadhaar Card',
  'Educational Certificate',
  'Andhra Pradesh Domicile / Residence Certificate',
  'Age Proof',
  'Caste / Disability Certificate (if applicable)',
  'Bank Passbook / Cancelled Cheque',
  'PAN Card',
  'Detailed Project Report (DPR)',
  'Lease Agreement , if rented / Property Documents , if owned',
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
  familyOwnsHouse: '',
  addressDuration: '',
  numberOfDependents: '',
  apResident: '',

  specialCategoryYesNo: '',
  specialCategories: [],
  validCasteCertificate: '',
  pwdTypePercentage: '',
  pwdDisabilityCertificate: '',
  exServicemenCertificate: '',

  educationQualification: '',
  technicalTrainingYes: '',
  technicalTrainingDetail: '',
  priorBusinessExperience: '',
  edpTrainingLast2Years: '',
  edpTrainingInstitute: '',

  priorCmepOrSubsidy: '',
  familyMemberApplying: '',

  projectSector: '',
  projectType: '',
  businessDescription: '',
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
  plannedEmployment: '',

  proposedUnitFullAddress: '',
  unitDistrict: '',
  unitMandal: '',
  unitVillageOrCity: '',
  ruralUrbanStatus: '',
  premisesOwnership: '',
  leaseAgreementType: '',
  leaseTermPeriod: '',
  leaseMonthlyRent: '',
  expectedMonthlySales: '',

  identifiedBank: '',
  identifiedBankName: '',
  identifiedBankBranch: '',
  existingBankerBankName: '',
  existingBankerBranch: '',
  bankRelationshipAge: '',
  previousGovtSubsidyLoan: '',
  cibilScore: '',
  netWorth: '',
  filingIncomeTaxReturns: '',
  otherIncomeYes: '',
  otherIncomeDetail: '',
  lifeInsuranceYes: '',
  lifeInsuranceDetail: '',

  documentsReady: [],
  additionalInfo: '',
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

const makeDomId = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const RadioGroup = ({ name, value, onChange, options }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const id = `cmep-radio-${makeDomId(name)}-${makeDomId(opt.value)}`;
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
 * CMEP — Questionnaire for Client Screening & Consultancy
 */
const CmepSectionAForm = ({
  initialData = null,
  onSubmit = null,
  schemeMailPath = CMEP_SCHEME_MAIL_PATH,
}) => {
  const navigate = useNavigate();
  const [data, setData] = useState(() => ({ ...initialState, ...(initialData || {}) }));

  const specialCategoryEnabled = data.specialCategoryYesNo === 'Yes';
  const hasPwd = (data.specialCategories || []).includes('Person with Disability (PwD)');
  const hasExServicemen = (data.specialCategories || []).includes('Ex-Servicemen');
  const leasedEnabled = data.premisesOwnership === 'Rented';
  const selectedSet = useMemo(() => new Set(data.specialCategories || []), [data.specialCategories]);
  const documentsSet = useMemo(() => new Set(data.documentsReady || []), [data.documentsReady]);

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

  const toggleDocument = (doc) => {
    setData((p) => {
      const next = new Set(p.documentsReady || []);
      if (next.has(doc)) next.delete(doc);
      else next.add(doc);
      return { ...p, documentsReady: Array.from(next) };
    });
  };

  const fillTestData = () => {
    setData({
      ...initialState,
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
      familyOwnsHouse: 'Yes',
      addressDuration: 'More than 5 years',
      numberOfDependents: 2,
      apResident: 'Yes',
      specialCategoryYesNo: 'Yes',
      specialCategories: ['OBC', 'Woman'],
      validCasteCertificate: 'Yes',
      educationQualification: 'Graduate',
      technicalTrainingYes: 'No',
      priorBusinessExperience: '1–3 years',
      edpTrainingLast2Years: 'No',
      priorCmepOrSubsidy: 'No',
      familyMemberApplying: 'No',
      projectSector: 'Manufacturing Sector',
      projectType: 'New Enterprise',
      businessDescription: 'Paper manufacturing unit for eco-friendly packaging',
      assetPlantMachinery: 5000000,
      workingCapitalRequirement: 3000000,
      plannedEmployment: '2–5',
      proposedUnitFullAddress: 'Ward-5, Vijayawada, Krishna District, AP',
      unitDistrict: 'Krishna',
      unitMandal: 'Vijayawada',
      unitVillageOrCity: 'Vijayawada',
      ruralUrbanStatus: 'Urban',
      premisesOwnership: 'Rented',
      leaseAgreementType: 'Registered',
      expectedMonthlySales: 500000,
      identifiedBank: 'No',
      existingBankerBankName: 'State Bank of India',
      existingBankerBranch: 'Vijayawada Main Branch',
      bankRelationshipAge: 'Above 3 years',
      previousGovtSubsidyLoan: 'No',
      cibilScore: 745,
      netWorth: 6500000,
      filingIncomeTaxReturns: 'Yes',
      otherIncomeYes: 'No',
      lifeInsuranceYes: 'No',
      documentsReady: ['Aadhaar Card', 'PAN Card'],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...data,
      ageYears: data.ageYears === '' ? '' : Number(data.ageYears),
      numberOfDependents:
        data.numberOfDependents === '' ? '' : Number(data.numberOfDependents),
    };
    onSubmit?.(payload);
    saveSchemeFormSession('cmepForm', payload);
    navigate(schemeMailPath, { state: { cmepForm: payload } });
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
          <FieldLabel>12. Do you / your family own a house (or parental house)?</FieldLabel>
          <RadioGroup
            name="familyOwnsHouse"
            value={data.familyOwnsHouse}
            onChange={(v) => update('familyOwnsHouse', v)}
            options={[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>13. How long have you been living at your current address?</FieldLabel>
          <RadioGroup
            name="addressDuration"
            value={data.addressDuration}
            onChange={(v) => update('addressDuration', v)}
            options={[
              { label: 'Less than 2 years', value: 'Less than 2 years' },
              { label: '2–5 years', value: '2–5 years' },
              { label: 'More than 5 years', value: 'More than 5 years' },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>14. Number of dependents (spouse, children, parents)</FieldLabel>
          <TextInput
            type="number"
            value={data.numberOfDependents}
            onChange={(v) => update('numberOfDependents', v)}
            placeholder="Number of dependents"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>15. Are you a resident of Andhra Pradesh?</FieldLabel>
          <RadioGroup
            name="apResident"
            value={data.apResident}
            onChange={(v) => update('apResident', v)}
            options={[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
            ]}
          />
        </div>
      </div>

      {/* Section B: Social Category */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section B: Social Category (For Special Benefits)</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <FieldLabel>16. Do you belong to any special category?</FieldLabel>
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
            <div className="text-sm font-semibold text-gray-800">If Yes, select all that apply</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SPECIAL_CATEGORIES.map((cat) => (
                <CheckboxPill
                  key={cat}
                  id={`cmep-special-cat-${makeDomId(cat)}`}
                  checked={selectedSet.has(cat)}
                  onChange={() => toggleSpecialCategory(cat)}
                  label={cat}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <FieldLabel>17. Do you have a valid Caste certificate?</FieldLabel>
          <RadioGroup
            name="validCasteCertificate"
            value={data.validCasteCertificate}
            onChange={(v) => update('validCasteCertificate', v)}
            options={[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
              { label: 'Not Applicable', value: 'Not Applicable' },
            ]}
          />
        </div>

        {hasPwd && (
          <>
            <div className="space-y-1.5">
              <FieldLabel>18. If PwD, please mention type and percentage of disability</FieldLabel>
              <TextInput
                value={data.pwdTypePercentage}
                onChange={(v) => update('pwdTypePercentage', v)}
                placeholder="Type and percentage"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>19. If PwD, do you have a Disability Certificate?</FieldLabel>
              <RadioGroup
                name="pwdDisabilityCertificate"
                value={data.pwdDisabilityCertificate}
                onChange={(v) => update('pwdDisabilityCertificate', v)}
                options={[
                  { label: 'Yes', value: 'Yes' },
                  { label: 'No', value: 'No' },
                ]}
              />
            </div>
          </>
        )}

        {hasExServicemen && (
          <div className="space-y-1.5">
            <FieldLabel>20. If Ex-Servicemen, do you have an Ex-Servicemen Certificate?</FieldLabel>
            <RadioGroup
              name="exServicemenCertificate"
              value={data.exServicemenCertificate}
              onChange={(v) => update('exServicemenCertificate', v)}
              options={[
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ]}
            />
          </div>
        )}
        </div>
      </div>

      {/* Section C: Education & Experience */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section C: Education &amp; Experience</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>21. Educational Qualification</FieldLabel>
            <RadioGroup
              name="educationQualification"
              value={data.educationQualification}
              onChange={(v) => update('educationQualification', v)}
              options={EDUCATION_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>22. Do you have any technical / skill training? (ITI, Polytechnic, RSETI, NSDC, etc.)</FieldLabel>
            <RadioGroup
              name="technicalTrainingYes"
              value={data.technicalTrainingYes}
              onChange={(v) => {
                update('technicalTrainingYes', v);
                if (v !== 'Yes') update('technicalTrainingDetail', '');
              }}
              options={[
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ]}
            />
          </div>
          {data.technicalTrainingYes === 'Yes' && (
            <div className="space-y-1.5">
              <FieldLabel>If Yes, please mention</FieldLabel>
              <TextInput
                value={data.technicalTrainingDetail}
                onChange={(v) => update('technicalTrainingDetail', v)}
                placeholder="Training details"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <FieldLabel>23. Do you have any prior experience in the proposed business?</FieldLabel>
            <RadioGroup
              name="priorBusinessExperience"
              value={data.priorBusinessExperience}
              onChange={(v) => update('priorBusinessExperience', v)}
              options={PRIOR_EXPERIENCE_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>24. Have you completed any EDP / Entrepreneurship Training in the last 2 years?</FieldLabel>
            <RadioGroup
              name="edpTrainingLast2Years"
              value={data.edpTrainingLast2Years}
              onChange={(v) => {
                update('edpTrainingLast2Years', v);
                if (v !== 'Yes') update('edpTrainingInstitute', '');
              }}
              options={[
                { label: 'No', value: 'No' },
                { label: 'Yes', value: 'Yes' },
              ]}
            />
          </div>
          {data.edpTrainingLast2Years === 'Yes' && (
            <div className="space-y-1.5">
              <FieldLabel>If Yes, from which institute?</FieldLabel>
              <TextInput
                value={data.edpTrainingInstitute}
                onChange={(v) => update('edpTrainingInstitute', v)}
                placeholder="Institute name"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section D: Family Status */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section D: Family Status</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>
              25. Have you or your spouse already applied or availed benefit under CMEP or any other government
              subsidy scheme (PMEGP, etc.)?
            </FieldLabel>
            <RadioGroup
              name="priorCmepOrSubsidy"
              value={data.priorCmepOrSubsidy}
              onChange={(v) => update('priorCmepOrSubsidy', v)}
              options={[
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>
              26. Will any other family member (especially spouse) be applying for this scheme?
            </FieldLabel>
            <RadioGroup
              name="familyMemberApplying"
              value={data.familyMemberApplying}
              onChange={(v) => update('familyMemberApplying', v)}
              options={[
                { label: 'Yes', value: 'Yes' },
                { label: 'No', value: 'No' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Section E: Proposed Business */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section E: Proposed Business Idea &amp; Project Details</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>27. Type of Project</FieldLabel>
            <RadioGroup
              name="projectSector"
              value={data.projectSector}
              onChange={(v) => update('projectSector', v)}
              options={PROJECT_SECTOR_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>28. Project Type (select one)</FieldLabel>
            <RadioGroup
              name="projectType"
              value={data.projectType}
              onChange={(v) => update('projectType', v)}
              options={PROJECT_TYPE_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>29. Detailed Description of your business (What will you manufacture / provide?)</FieldLabel>
            <TextArea
              value={data.businessDescription}
              onChange={(v) => update('businessDescription', v)}
              placeholder="Describe your business..."
              rows={5}
            />
          </div>
        </div>
      </div>

      {/* Section E (continued): Project cost */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">30. Estimated Total Project Cost (₹)</h2>
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
              <div className="col-span-8 px-4 py-3 text-sm font-semibold text-gray-900">TOTAL PROJECT COST (A+B)</div>
              <div className="col-span-4 px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                ₹{estimatedTotalProjectCost.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <FieldLabel>31. How many people do you plan to employ (including yourself)?</FieldLabel>
          <RadioGroup
            name="plannedEmployment"
            value={data.plannedEmployment}
            onChange={(v) => update('plannedEmployment', v)}
            options={PLANNED_EMPLOYMENT_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
          />
        </div>
      </div>

      {/* Section F: Location & Rural / Urban Status */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section F: Location &amp; Rural / Urban Status</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>32. Full address of the proposed unit</FieldLabel>
            <TextArea
              value={data.proposedUnitFullAddress}
              onChange={(v) => update('proposedUnitFullAddress', v)}
              placeholder="Full address of the proposed unit..."
              rows={4}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>33. Location of the Unit</FieldLabel>
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
            <FieldLabel>Rural / Urban status</FieldLabel>
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
            <FieldLabel>34. Business premises or Land Ownership / Acquisition Details</FieldLabel>
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
                      if (v !== 'Rented') {
                        update('leaseAgreementType', '');
                        update('leaseTermPeriod', '');
                        update('leaseMonthlyRent', '');
                      }
                    }}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {leasedEnabled && (
            <>
              <div className="space-y-1.5">
                <FieldLabel>35. If Leased, lease agreement is</FieldLabel>
                <RadioGroup
                  name="leaseAgreementType"
                  value={data.leaseAgreementType}
                  onChange={(v) => update('leaseAgreementType', v)}
                  options={[
                    { label: 'Un Registered', value: 'Un Registered' },
                    { label: 'Registered', value: 'Registered' },
                  ]}
                />
              </div>
              <TwoQuestionRow
                left={
                  <>
                    <FieldLabel>Term period</FieldLabel>
                    <TextInput
                      value={data.leaseTermPeriod}
                      onChange={(v) => update('leaseTermPeriod', v)}
                      placeholder="Lease term"
                    />
                  </>
                }
                right={
                  <>
                    <FieldLabel>Monthly Rent (₹)</FieldLabel>
                    <TextInput
                      type="number"
                      value={data.leaseMonthlyRent}
                      onChange={(v) => update('leaseMonthlyRent', v)}
                      placeholder="Monthly rent"
                    />
                  </>
                }
              />
            </>
          )}

          <div className="space-y-1.5">
            <FieldLabel>36. Expected monthly sales / turnover after 1 year? (Rough estimate ₹)</FieldLabel>
            <TextInput
              type="number"
              value={data.expectedMonthlySales}
              onChange={(v) => update('expectedMonthlySales', v)}
              placeholder="Expected monthly sales"
            />
          </div>
        </div>
      </div>

      {/* Section G: Financial & Banking */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section G: Financial &amp; Banking Information</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <FieldLabel>37. Have you identified a bank for the loan?</FieldLabel>
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
            <FieldLabel>Name of bank &amp; branch</FieldLabel>
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

          <div className="space-y-1.5">
            <FieldLabel>
              38. In case of relation with existing banker, how old is your relationship with this bank?
            </FieldLabel>
            <RadioGroup
              name="bankRelationshipAge"
              value={data.bankRelationshipAge}
              onChange={(v) => update('bankRelationshipAge', v)}
              options={[
                { label: 'New', value: 'New' },
                { label: 'Less than 1 year', value: 'Less than 1 year' },
                { label: '1–3 years', value: '1–3 years' },
                { label: 'Above 3 years', value: 'Above 3 years' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>
              39. Have you availed any previous government subsidy / loan under PMEGP / PMFME / MUDRA / any other scheme?
            </FieldLabel>
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
                <FieldLabel>40. What is your CIBIL score (For Bank loan purpose)</FieldLabel>
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
                <FieldLabel>41. What is your Net worth as on date (For Bank loan purpose)</FieldLabel>
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
            <FieldLabel>42. Are you filing Income Tax returns?</FieldLabel>
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

          <div className="space-y-1.5">
            <FieldLabel>43. Do you have any other source of income (spouse job, agriculture, etc.)?</FieldLabel>
            <RadioGroup
              name="otherIncomeYes"
              value={data.otherIncomeYes}
              onChange={(v) => {
                update('otherIncomeYes', v);
                if (v !== 'Yes') update('otherIncomeDetail', '');
              }}
              options={[
                { label: 'No', value: 'No' },
                { label: 'Yes', value: 'Yes' },
              ]}
            />
          </div>
          {data.otherIncomeYes === 'Yes' && (
            <div className="space-y-1.5">
              <FieldLabel>If yes, details</FieldLabel>
              <TextArea
                value={data.otherIncomeDetail}
                onChange={(v) => update('otherIncomeDetail', v)}
                placeholder="Other income details"
                rows={3}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <FieldLabel>
              44. Do you have any Life Insurance policy? (PMJJBY, PMSBY, APY, or any other)
            </FieldLabel>
            <RadioGroup
              name="lifeInsuranceYes"
              value={data.lifeInsuranceYes}
              onChange={(v) => {
                update('lifeInsuranceYes', v);
                if (v !== 'Yes') update('lifeInsuranceDetail', '');
              }}
              options={[
                { label: 'No', value: 'No' },
                { label: 'Yes', value: 'Yes' },
              ]}
            />
          </div>
          {data.lifeInsuranceYes === 'Yes' && (
            <div className="space-y-1.5">
              <FieldLabel>If yes, details</FieldLabel>
              <TextArea
                value={data.lifeInsuranceDetail}
                onChange={(v) => update('lifeInsuranceDetail', v)}
                placeholder="Life insurance details"
                rows={3}
              />
            </div>
          )}
        </div>
      </div>

      {/* Section H: Document Readiness */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Section H: Document Readiness</h2>
          <p className="text-sm text-gray-600 mt-1">Please tick which documents you already have:</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DOCUMENT_OPTIONS.map((doc) => (
            <CheckboxPill
              key={doc}
              id={`cmep-doc-${makeDomId(doc)}`}
              checked={documentsSet.has(doc)}
              onChange={() => toggleDocument(doc)}
              label={doc}
            />
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Additional Information</h2>
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Any other information you would like to share</FieldLabel>
          <TextArea
            value={data.additionalInfo}
            onChange={(v) => update('additionalInfo', v)}
            placeholder="Additional information..."
            rows={5}
          />
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

export default CmepSectionAForm;

