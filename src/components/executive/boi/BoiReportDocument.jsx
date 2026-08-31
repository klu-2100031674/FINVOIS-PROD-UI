import { useMemo } from 'react';
import {
  FINAL_FEEDBACK_ITEMS,
  isModuleApplicable,
  labelApplicants,
} from '../../../utils/boi/verificationSchema';
import './boiReport.css';

export const AGENCY = {
  name: 'PARVEZ AND NARAYANA',
  subtitle: 'CHARTERED ACCOUNTANTS',
  address: [
    'Door No: 59A-21-5/3, Plot No: 103',
    'Road No: 3, Zainab Manzil',
    'Vivekananda Colony',
    'Vijayawada – 520007',
  ],
  phones: ['09014221011', '0866-2541011'],
  email: 'parvezandnarayana@gmail.com',
  caName: 'PARVEZ MOHAMMED',
};

const REPORT_MODULES = [
  { key: 'general', label: 'GENERAL DETAILS' },
  { key: 'residence', label: 'RESIDENCE VERIFICATION' },
  { key: 'employment', label: 'Business / Employment Verification' },
  { key: 'pan', label: '4.Pan Card Verification' },
  { key: 'salary', label: 'Salary Verification' },
  { key: 'property', label: 'PROPERTY DETAILS' },
  { key: 'documents', label: 'Details in the documents Tallied/Not Tallied' },
  { key: 'business', label: 'OTHER OBSERVATIONS' },
];

const EVIDENCE_GROUPS = [
  { key: 'applicantPhotos', label: 'Applicant Photos' },
  { key: 'coApplicantPhotos', label: 'Co-Applicant Photos' },
  { key: 'residencePhotos', label: 'Residence Photos' },
  { key: 'employmentPhotos', label: 'Office / Business Photos' },
  { key: 'identityDocs', label: 'Government ID Proofs (PAN / Aadhaar)' },
  { key: 'incomeDocs', label: 'Salary Slips / Income Documents' },
  { key: 'additionalDocs', label: 'Other Documents' },
];

function formatINR(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 'N/A';
  return `₹ ${new Intl.NumberFormat('en-IN').format(n)}`;
}

function dash(v) {
  if (v === null || v === undefined) return 'N/A';
  const s = String(v).trim();
  return s.length ? s : 'N/A';
}

function titleCase(v) {
  if (!v) return 'N/A';
  return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function moduleVerdict(mod, key) {
  if (!mod) return 'na';
  if (mod.status === 'not_started') return 'na';
  switch (key) {
    case 'residence': {
      const d = mod.residence ?? {};
      if (d.addressTallied === 'yes' && d.stayConfirmed === 'yes') return 'positive';
      if (d.addressTallied === 'no' || d.stayConfirmed === 'no') return 'negative';
      return mod.status === 'completed' ? 'positive' : 'na';
    }
    case 'employment': {
      const d = mod.employment ?? {};
      if (d.nameBoardSighted === 'yes') return 'positive';
      if (d.nameBoardSighted === 'no') return 'negative';
      return mod.status === 'completed' ? 'positive' : 'na';
    }
    case 'pan': {
      const d = mod.pan ?? {};
      if (d.finalStatus === 'confirmed') return 'positive';
      if (d.finalStatus === 'not_confirmed') return 'negative';
      return mod.status === 'completed' ? 'positive' : 'na';
    }
    case 'salary': {
      const d = mod.salary ?? {};
      if (d.serviceConfirmed === 'yes') return 'positive';
      if (d.serviceConfirmed === 'no') return 'negative';
      return mod.status === 'completed' ? 'positive' : 'na';
    }
    case 'documents': {
      const d = mod.documents ?? {};
      const vals = [
        d.sealOfOrganization,
        d.signatureOfAuthority,
        d.salarySlipDateAmount,
        d.officeAddressCorrect,
      ];
      if (vals.some((v) => v === 'not_tallied')) return 'negative';
      if (vals.some((v) => v === 'tallied')) return 'positive';
      return 'na';
    }
    case 'business': {
      const d = mod.business ?? {};
      if (d.businessActivitySeen === 'yes') return 'positive';
      if (d.businessActivitySeen === 'no') return 'negative';
      return mod.status === 'completed' ? 'positive' : 'na';
    }
    case 'general':
    default:
      return mod.status === 'completed' ? 'positive' : 'na';
  }
}

function overallOpinion(c) {
  let pos = 0;
  let neg = 0;
  let touched = 0;
  for (const a of c.applicants) {
    const mods = c.modules[a.id];
    for (const m of REPORT_MODULES) {
      if (!isModuleApplicable(mods, m.key, c.loanType)) continue;
      const v = moduleVerdict(mods?.[m.key], m.key);
      if (v === 'positive') {
        pos += 1;
        touched += 1;
      } else if (v === 'negative') {
        neg += 1;
        touched += 1;
      }
    }
  }
  if (neg > 0 && neg >= pos) return { label: 'NOT SATISFACTORY', tone: 'bg-rose-600' };
  if (neg > 0) return { label: 'NEGATIVE', tone: 'bg-amber-600' };
  if (pos > 0 && touched > 0) return { label: 'POSITIVE', tone: 'bg-emerald-600' };
  return { label: 'PENDING', tone: 'bg-slate-500' };
}

function overallAssessment(caseData, applicants) {
  const op = overallOpinion(caseData);
  return `Based on the field investigation conducted across ${applicants.length} applicant(s) and the documentary evidence submitted in support of loan application ${caseData.id} (${dash(caseData.loanType)}, ${formatINR(caseData.loanAmount)}, ${dash(caseData.branchName)} branch), the overall outcome of the due diligence exercise is assessed as ${op.label}. Particulars supporting this opinion are detailed in the per-applicant verification sections that follow.`;
}

function feedbackOverallOpinion(persons, guarantorOpinion) {
  let pos = 0;
  let neg = 0;
  let recorded = 0;
  for (const p of persons) {
    for (const it of FINAL_FEEDBACK_ITEMS) {
      const v = p.items[it.key];
      if (v === 'positive') {
        pos += 1;
        recorded += 1;
      } else if (v === 'negative') {
        neg += 1;
        recorded += 1;
      } else if (v === 'na') {
        recorded += 1;
      }
    }
  }
  if (guarantorOpinion === 'positive') {
    pos += 1;
    recorded += 1;
  } else if (guarantorOpinion === 'negative') {
    neg += 1;
    recorded += 1;
  }
  if (recorded === 0) return { label: 'PENDING', tone: 'bg-slate-500' };
  if (neg > 0 && neg >= pos) return { label: 'NOT SATISFACTORY', tone: 'bg-rose-600' };
  if (neg > 0) return { label: 'NEGATIVE', tone: 'bg-amber-600' };
  if (pos > 0) return { label: 'POSITIVE', tone: 'bg-emerald-600' };
  return { label: 'PENDING', tone: 'bg-slate-500' };
}

function r(label, value) {
  return [label, dash(value)];
}

function generalRows(d) {
  d = d ?? {};
  return [
    r('Borrower Name', d.borrowerName),
    r('Father / Husband Name', d.fatherHusbandName),
    r('Gender', titleCase(String(d.gender ?? ''))),
    r('Resident Status', titleCase(String(d.residentStatus ?? ''))),
    r('PAN Number', d.panNumber),
    r('Aadhaar Number', d.aadhaarNumber),
    r('Date of Birth', d.dateOfBirth),
    r('Qualification', d.qualification),
    r('Marital Status', titleCase(String(d.maritalStatus ?? ''))),
    r('Employment Type', d.employmentType),
  ];
}

function residenceRows(d) {
  d = d ?? {};
  return [
    r('Given Address', d.givenAddress),
    r('Present Address', d.presentAddress),
    r('Address Tallied', titleCase(String(d.addressTallied ?? ''))),
    r('Stay Confirmed', titleCase(String(d.stayConfirmed ?? ''))),
    r('Staying Since (years)', d.stayingSince),
    r('Name-plate Sighted', titleCase(String(d.namePlateSeen ?? ''))),
    r('Name-plate Match', titleCase(String(d.namePlateMatches ?? ''))),
    r('Nature of Residence', d.tenureStatus),
    r('Type of Residence', d.houseType),
    r('Type of Locality', d.localityType),
    r('Living Standard', d.livingStandard),
    r('Number of Dependents', d.numberOfDependents),
    r('Contact Person', d.contactPersonName),
    r('Contact Person Relation', d.contactPersonRelation),
    r('Mobile Number', d.mobileNumber),
    r('Visit Date / Time', d.visitDateTime),
    r('Verifier Remarks', d.resVerifierRemarks || d.residenceConfirmation),
    r('Supervisor Remarks', d.resSupervisorRemarks || d.supervisorRemarks),
  ];
}

function employmentRows(d) {
  d = d ?? {};
  const proofs = Array.isArray(d.proofsReceived) ? d.proofsReceived.join(', ') : (d.proofsReceived ?? '');
  return [
    r('Employment Category', titleCase(String(d.employmentCategory ?? ''))),
    r('Business / Employer', d.companyName),
    r('Address', d.companyAddress),
    r('Address Confirmed By', d.addressConfirmedBy),
    r('Landmark', d.landmark),
    r('Office Ownership', d.officeOwnership),
    r('Name-board Sighted', titleCase(String(d.nameBoardSighted ?? ''))),
    r('Name-board Comments', d.detailsOfSighting),
    r('Proofs Received', proofs),
    r('Designation', d.designation),
    r('Year of Establishment', d.yearOfEstablishment),
    r('Type of Firm', d.typeOfFirm),
    r('Nature of Business', d.natureOfBusiness),
    r('Website / Email', [d.companyWebsite, d.officialEmailId].filter(Boolean).join(' / ')),
    r('Since When', d.yearsOfService),
    r('Likelihood of Change', d.changeLikelihood),
    r('Line of Business', d.lineOfBusiness),
    r('Telephone', d.workContact),
    r('Terms of Employment', d.termsOfEmployment),
    r('Supervisor Details', d.supervisorDetails),
    r('Visiting Card Details', d.visitingCardDetails),
    r('Verifier Remarks', d.employeeNotes),
    r('Supervisor Remarks', d.supervisorRemarks),
  ];
}

function panRows(d) {
  d = d ?? {};
  return [
    r('PAN Number', d.panNumber),
    r('Name Matching', titleCase(String(d.portalTally ?? ''))),
    r('Gender Matching', titleCase(String(d.genderMatching ?? ''))),
    r('PAN Verified (Official Utility)', titleCase(String(d.statusOnPortal ?? ''))),
    r('Final Status', titleCase(String(d.finalStatus ?? ''))),
    r('Verifier Remarks', d.portalMatchRemarks),
    r('Supervisor Remarks', d.supervisorRemarks),
  ];
}

function salaryRows(d) {
  d = d ?? {};
  return [
    r('Company Name', d.companyName),
    r('Designation', d.designation),
    r('Years of Service', d.yearsOfService),
    r('Service Confirmed', titleCase(String(d.serviceConfirmed ?? ''))),
    r('Gross Monthly Income', formatINR(String(d.grossMonthlyIncome ?? ''))),
    r('Total Income (SS / SC / PS / F-16)', titleCase(String(d.totalIncome ?? ''))),
    r('Income (Salary Head) Verified', titleCase(String(d.payslipsAvailable ?? ''))),
    r('Tax Calculation Verified', titleCase(String(d.bankStatementsAvailable ?? ''))),
    r('Form-16 Tax Payable Correct', titleCase(String(d.form16Issued ?? ''))),
    r('Remarks', d.taxPaidRemarks || d.remarks),
  ];
}

function documentRows(d) {
  d = d ?? {};
  return [
    r('Seal of Organization', titleCase(String(d.sealOfOrganization ?? ''))),
    r('Signature of Authority', titleCase(String(d.signatureOfAuthority ?? ''))),
    r('Salary Slip Date & Amount', titleCase(String(d.salarySlipDateAmount ?? ''))),
    r('Office Address Correct', titleCase(String(d.officeAddressCorrect ?? ''))),
  ];
}

function businessRows(d) {
  d = d ?? {};
  return [
    r('1. Business Activity seen', d.businessActivitySeen),
    r('2. Number of Employee seen', d.totalEmployees),
    r('3. Equipment/Stock seen', d.rawMaterialsSeen),
    r('4. Business premises ambience', d.businessAmbience),
    r('5. Level of Business activity (if self employed)', d.businessActivityLevel),
    r('6. Name of Verifier & Remarks', d.verifierRemarks),
    r('7. Name of Supervisor & Remarks', d.supervisorRemarks),
    r('8. Remarks in Detail, if Negative', d.businessRemarks),
  ];
}

function propertyRows(d) {
  d = d ?? {};
  const flatUnderConst = String(d.constructionStatus || '').toLowerCase().includes('under') || String(d.constructionStatus || '').toLowerCase().includes('flat');
  const rows = [
    r('Address of the Property', d.addressOfProperty),
    r('Whether the address of the property is as given in the application', titleCase(String(d.addressMatchesApplication ?? ''))),
    r('Name of Owner', d.ownerName),
    r('Type of the property', d.propertyType),
    r('Locality of the property', d.propertyLocality),
    r('Ownership', d.ownershipType),
    r('Type of construction', d.constructionStatus),
    r('Stage of construction (if property is under construction)', d.stageOfConstruction),
    r('Whether the property has independent access', d.independentAccess),
    r('Type of independent access (Applicable if Yes)', d.independentAccessType),
    r('Type of building/usage or construction activity found', d.buildingUsage),
  ];
  if (flatUnderConst || d.builderName) {
    rows.push(
      r('Name of the Builder', d.builderName),
      r('Reputation of the Builder', d.builderReputation),
      r('Source of the above Application', d.builderSource),
      r('Stage of construction', d.constructionStageDetail),
      r('Whether work is in progress in full swing', d.workInFullSwing),
      r('Likely date of completion', d.likelyCompletionDate)
    );
  }
  rows.push(r('Date of site visit', d.visitDateTime));
  return rows;
}

export const MODULE_ROW_BUILDERS = {
  general: {
    title: 'GENERAL DETAILS',
    rows: (m) => generalRows(m?.general?.general),
  },
  residence: {
    title: 'RESIDENCE VERIFICATION',
    rows: (m) => residenceRows(m?.residence?.residence),
  },
  employment: {
    title: 'Business / Employment Verification',
    rows: (m) => employmentRows(m?.employment?.employment),
  },
  pan: {
    title: '4.Pan Card Verification',
    rows: (m) => panRows(m?.pan?.pan),
  },
  salary: {
    title: 'Salary / Form-16 Verification',
    rows: (m) => salaryRows(m?.salary?.salary),
  },
  property: {
    title: 'PROPERTY DETAILS',
    rows: (m) => propertyRows(m?.property?.property),
  },
  business: {
    title: 'OTHER OBSERVATIONS',
    rows: (m) => businessRows(m?.business?.business),
  },
  documents: {
    title: 'Details in the documents Tallied/Not Tallied',
    rows: (m) => documentRows(m?.documents?.documents),
  },
  evidence: { title: '', rows: () => [] },
  feedback: { title: '', rows: () => [] },
};

const ID_LABEL_PATTERNS = [
  /pan\s*number/i,
  /aadhaar/i,
  /udin/i,
  /mobile/i,
  /telephone/i,
  /account\s*number/i,
  /ifsc/i,
  /gst/i,
  /registration\s*number/i,
  /verification\s*number/i,
  /\bcin\b/i,
  /\btan\b/i,
];

function isIdLikeLabel(label) {
  return ID_LABEL_PATTERNS.some((re) => re.test(label));
}

function PageHeader({ title, caseId }) {
  return (
    <header className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
          {AGENCY.name} · {AGENCY.subtitle}
        </p>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {caseId ? (
        <div className="text-right text-[11px] text-slate-600">
          <p className="font-semibold">Verification No.</p>
          <p className="font-mono">{caseId}</p>
        </div>
      ) : null}
    </header>
  );
}

function CoverRow({ label, value, mono }) {
  return (
    <tr className="border-b border-slate-300 last:border-b-0">
      <td className="bg-slate-100 px-3 py-2 w-1/3 font-semibold text-slate-700">{label}</td>
      <td className={`px-3 py-2 ${mono ? 'font-mono' : ''}`}>{value}</td>
    </tr>
  );
}

function FeedbackBadge({ value }) {
  if (value === 'positive') return <span className="font-bold text-emerald-700">✓ Positive</span>;
  if (value === 'negative') return <span className="font-bold text-rose-700">✕ Negative</span>;
  if (value === 'na') return <span className="font-semibold text-slate-500">○ N/A</span>;
  return <span className="text-slate-400 italic">Not recorded</span>;
}

function FeedbackSummaryTable({ chunk }) {
  return (
    <table className="w-full text-[12px] border-collapse bg-white">
      <thead>
        <tr className="bg-slate-900 text-white">
          <th className="border border-slate-300 px-3 py-2 text-left w-10">#</th>
          <th className="border border-slate-300 px-3 py-2 text-left">Verification Item</th>
          {chunk.map((p) => (
            <th key={p.id} className="border border-slate-300 px-3 py-2 text-center">
              <div className="font-bold uppercase">{p.label}</div>
              {p.name && p.name !== 'N/A' && (
                <div className="text-[10px] font-normal opacity-90 mt-0.5 normal-case">{p.name}</div>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {FINAL_FEEDBACK_ITEMS.map((it, i) => (
          <tr key={it.key} className={i % 2 === 0 ? 'bg-slate-50' : ''}>
            <td className="border border-slate-300 px-3 py-1.5 text-center font-semibold text-slate-600">
              {i + 1}.
            </td>
            <td className="border border-slate-300 px-3 py-1.5 font-semibold text-slate-700">{it.label}</td>
            {chunk.map((p) => (
              <td key={p.id} className="border border-slate-300 px-3 py-1.5 text-center">
                <FeedbackBadge value={p.items[it.key] ?? ''} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GuarantorOpinionTable({
  guarantorPresent,
  guarantorName,
  guarantorOpinion,
  visitDateTime,
  opinion,
}) {
  const guarantorLabel = !guarantorPresent
    ? 'N/A'
    : guarantorOpinion === 'positive'
      ? 'POSITIVE'
      : guarantorOpinion === 'negative'
        ? 'NEGATIVE'
        : 'Not Recorded';
  const guarantorCellCls = !guarantorPresent
    ? 'bg-slate-100 text-slate-700'
    : guarantorOpinion === 'positive'
      ? 'bg-emerald-600 text-white'
      : guarantorOpinion === 'negative'
        ? 'bg-rose-600 text-white'
        : 'bg-slate-100 text-slate-700';
  const opinionCellCls = `${opinion.tone} text-white`;
  const guarantorHeader =
    guarantorPresent && guarantorName !== 'N/A' ? `GUARANTOR — ${guarantorName}` : 'GUARANTOR';

  return (
    <table className="w-full text-[12px] border-collapse bg-white">
      <thead>
        <tr className="bg-slate-900 text-white">
          <th className="border border-slate-300 px-3 py-1.5 text-center w-2/5">{guarantorHeader}</th>
          <th className="border border-slate-300 px-3 py-1.5 text-center w-1/4">DATE &amp; TIME OF VISIT</th>
          <th className="border border-slate-300 px-3 py-1.5 text-center">OVERALL OPINION</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td
            className={`border border-slate-300 px-3 py-2 text-center font-extrabold tracking-widest ${guarantorCellCls}`}
          >
            {guarantorLabel}
          </td>
          <td className="border border-slate-300 px-3 py-2 text-center font-semibold text-slate-800">
            {visitDateTime}
          </td>
          <td
            className={`border border-slate-300 px-3 py-2 text-center font-extrabold tracking-widest ${opinionCellCls}`}
          >
            {opinion.label}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function SignatureBlock({ signatureDataUrl, caName, udin }) {
  return (
    <div className="w-72 text-center signature-block">
      <p className="text-[11px] uppercase tracking-[0.25em] mb-2">Digitally Signed By</p>
      <div className="h-20 flex items-end justify-center signature-art">
        {signatureDataUrl ? (
          <img src={signatureDataUrl} alt="CA Signature" className="max-h-20 max-w-full object-contain" />
        ) : (
          <div className="w-full border-b border-slate-400" />
        )}
      </div>
      <div className="mt-3 border-t border-slate-300 pt-2 signature-meta">
        <p className="text-sm font-bold">{caName}</p>
        <p className="text-xs">Chartered Accountant</p>
        <p className="text-[11px] mt-1">
          UDIN: <span className="report-id-value">{udin}</span>
        </p>
      </div>
    </div>
  );
}

function NumberedDetailTable({ rows }) {
  return (
    <table className="w-full text-[12px] border-collapse">
      <tbody>
        {rows.map(([k, v], i) => {
          const idLike = isIdLikeLabel(k) && v && v !== 'N/A';
          return (
            <tr key={k} className={i % 2 === 0 ? 'bg-slate-50' : ''}>
              <td className="border border-slate-300 px-2 py-1.5 w-10 text-center font-semibold text-slate-600 align-top">
                {i + 1}.
              </td>
              <td className="border border-slate-300 px-3 py-1.5 w-1/3 font-semibold text-slate-700 align-top">
                {k}
              </td>
              <td
                className={
                  'border border-slate-300 px-3 py-1.5 align-top whitespace-pre-wrap' +
                  (idLike ? ' report-id-value' : '')
                }
              >
                {idLike ? v.toUpperCase() : v}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CoverPage({
  caseData,
  reportInfo,
  primaryName,
  coApplicants,
  primaryId,
  signatureDataUrl,
}) {
  const primaryFeedback = caseData.modules[primaryId]?.feedback?.feedback ?? {};
  const persons = [];
  if (primaryId) {
    persons.push({
      id: primaryId,
      label: 'Applicant',
      name: primaryName,
      items: primaryFeedback.items ?? {},
    });
  }
  coApplicants.forEach((c) => {
    const fb = caseData.modules[c.id]?.feedback?.feedback ?? {};
    persons.push({ id: c.id, label: c.label, name: c.name, items: fb.items ?? {} });
  });

  const personChunks = [];
  for (let i = 0; i < persons.length; i += 2) personChunks.push(persons.slice(i, i + 2));
  const firstChunk = personChunks[0];
  const extraChunks = personChunks.slice(1);
  const hasExtras = extraChunks.length > 0;
  const generatedDateTime = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const guarantorPresent = primaryFeedback.guarantorPresent === 'yes';
  const guarantorOpinion = primaryFeedback.guarantorOpinion ?? '';
  const guarantorName = dash(primaryFeedback.guarantorName);
  const fbOpinion = feedbackOverallOpinion(persons, guarantorPresent ? guarantorOpinion : null);

  const allNames = [primaryName, ...coApplicants.map((c) => c.name)].filter((n) => n && n !== 'N/A');
  const introNames = allNames.length ? allNames.join(', ') : 'the applicant';
  const bankName = caseData.bankName?.trim() || 'Bank of India';

  return (
    <>
      <section className="report-page">
        <header className="text-center pb-3 border-b border-slate-900 page-one-letterhead">
          <h1
            className="text-[22px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: '#0b1f4d' }}
          >
            {AGENCY.name}
          </h1>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.4em]" style={{ color: '#0b1f4d' }}>
            {AGENCY.subtitle}
          </p>
          <div className="mx-auto mt-2 h-[1px] w-20" style={{ background: '#0b1f4d' }} />
          <div className="mt-2 grid grid-cols-3 gap-3 text-[10px] leading-[1.35]" style={{ color: '#111827' }}>
            <div className="text-left">
              <div className="font-semibold uppercase tracking-wider text-[9px]" style={{ color: '#0b1f4d' }}>
                Address
              </div>
              {AGENCY.address.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
            <div className="text-center">
              <div className="font-semibold uppercase tracking-wider text-[9px]" style={{ color: '#0b1f4d' }}>
                Phone
              </div>
              {AGENCY.phones.map((p) => (
                <div key={p} className="report-id-value">
                  {p}
                </div>
              ))}
            </div>
            <div className="text-right">
              <div className="font-semibold uppercase tracking-wider text-[9px]" style={{ color: '#0b1f4d' }}>
                Email
              </div>
              <div>{AGENCY.email}</div>
            </div>
          </div>
        </header>

        <div className="mt-3 text-center">
          <p className="text-[10px] tracking-[0.35em] text-slate-500">CONFIDENTIAL</p>
          <h2 className="mt-0.5 text-[16px] font-bold text-slate-900">DUE DILIGENCE VERIFICATION REPORT</h2>
          <div className="mx-auto mt-1.5 h-[2px] w-16 bg-slate-900" />
        </div>

        <div className="report-no-break mt-3 text-[12px] leading-[1.45] text-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p>To,</p>
              <p className="font-semibold">The Branch Manager</p>
              <p className="font-semibold">{bankName}</p>
              <p className="font-semibold">{dash(caseData.branchName)}</p>
            </div>
            <div className="text-right shrink-0">
              <p>
                <span className="font-semibold">Date:</span> {reportInfo.dateOfReportSubmission}
              </p>
            </div>
          </div>

          <p className="mt-2">Sir,</p>

          <p className="mt-2">
            <span className="font-semibold">Sub:</span> Due Diligence Verification Report of{' '}
            <span className="font-extrabold uppercase text-slate-900">{primaryName}</span>
            {coApplicants.length > 0 &&
              coApplicants.map((c) => (
                <span key={c.id}>
                  <span className="font-semibold"> AND </span>
                  <span className="font-extrabold uppercase text-slate-900">{c.name}</span>
                </span>
              ))}{' '}
            <span className="font-semibold">({String(caseData.loanType || '').toUpperCase()}) – Reg.</span>
          </p>

          <p className="mt-2 text-justify">
            With reference to our appointment as Due Diligence auditors and with the available sources and physical
            documents provided to us, we are herewith submitting the Due Diligence Verification Report of{' '}
            <span className="font-semibold">{introNames}</span> pertaining to the{' '}
            <span className="font-semibold">{dash(caseData.loanType)}</span> proposal.
          </p>
        </div>

        <div className="report-page-one-block">
          {firstChunk ? (
            <div className="report-no-break mt-3">
              <h3 className="text-[10px] tracking-[0.3em] mb-1.5">VERIFICATION SUMMARY</h3>
              <FeedbackSummaryTable chunk={firstChunk} />
            </div>
          ) : (
            <div className="report-no-break mt-3 rounded-md border border-dashed border-slate-400 p-3 text-center text-[11px] italic">
              Final Feedback has not been recorded for this case. Complete the Final Feedback module to populate the
              verification summary.
            </div>
          )}

          {!hasExtras && (
            <div className="report-no-break mt-3">
              <GuarantorOpinionTable
                guarantorPresent={guarantorPresent}
                guarantorName={guarantorName}
                guarantorOpinion={guarantorOpinion}
                visitDateTime={generatedDateTime}
                opinion={fbOpinion}
              />
            </div>
          )}

          {!hasExtras && (
            <div className="report-no-break mt-4 flex justify-end">
              <SignatureBlock
                signatureDataUrl={signatureDataUrl}
                caName={reportInfo.caName}
                udin={reportInfo.udinNumber}
              />
            </div>
          )}
        </div>
      </section>

      {extraChunks.map((chunk, idx) => {
        const isLast = idx === extraChunks.length - 1;
        return (
          <section key={`extra-summary-${idx}`} className="report-page">
            <PageHeader title={`Verification Summary — Continued (${idx + 2})`} caseId={caseData.id} />
            <div className="report-no-break mt-4">
              <FeedbackSummaryTable chunk={chunk} />
            </div>
            {isLast && (
              <>
                <div className="report-no-break mt-4">
                  <GuarantorOpinionTable
                    guarantorPresent={guarantorPresent}
                    guarantorName={guarantorName}
                    guarantorOpinion={guarantorOpinion}
                    visitDateTime={generatedDateTime}
                    opinion={fbOpinion}
                  />
                </div>
                <div className="report-no-break mt-4 flex justify-end">
                  <SignatureBlock
                    signatureDataUrl={signatureDataUrl}
                    caName={reportInfo.caName}
                    udin={reportInfo.udinNumber}
                  />
                </div>
              </>
            )}
          </section>
        );
      })}
    </>
  );
}

function ExecutiveSummaryPage({ caseData, applicants }) {
  const residenceEntries = applicants
    .map((ap) => {
      const m = caseData.modules[ap.id];
      const saved = m?.residence?.residence?.notes?.trim();
      const name = dash(m?.general?.general?.borrowerName);
      return { id: ap.id, label: ap.label, name, text: saved ?? '' };
    })
    .filter((e) => e.text.length > 0);

  const employmentEntries = applicants
    .filter((ap) => isModuleApplicable(caseData.modules[ap.id], 'employment'))
    .map((ap) => {
      const m = caseData.modules[ap.id];
      const saved = m?.employment?.employment?.notes?.trim();
      const name = dash(m?.general?.general?.borrowerName);
      return { id: ap.id, label: ap.label, name, text: saved ?? '' };
    })
    .filter((e) => e.text.length > 0);

  const hasAnyContent = residenceEntries.length > 0 || employmentEntries.length > 0;

  return (
    <section className="report-page">
      <PageHeader title="Executive Summary" caseId={caseData.id} />
      <div className="mt-5 space-y-5 text-[13px] leading-6 text-slate-800">
        {residenceEntries.length > 0 && (
          <div className="report-no-break" data-section-start="">
            <h4 className="text-sm font-bold text-slate-900 border-l-4 border-slate-900 pl-2 mb-2 uppercase tracking-wide">
              Applicant and Co-Applicant Residence Verification
            </h4>
            <div className="space-y-3">
              {residenceEntries.map((e) => (
                <div key={e.id} className="report-no-break" data-section-start="">
                  {residenceEntries.length > 1 && (
                    <p className="text-[12px] font-semibold text-slate-700 mb-1">
                      {e.label}
                      {e.name && e.name !== 'N/A' ? ` — ${e.name}` : ''}
                    </p>
                  )}
                  <p className="text-justify whitespace-pre-line">{e.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {employmentEntries.map((e) => (
          <div key={`emp-${e.id}`} className="report-no-break" data-section-start="">
            <h4 className="text-sm font-bold text-slate-900 border-l-4 border-slate-900 pl-2 mb-2 uppercase tracking-wide">
              {e.label} Business / Employment Verification
              {e.name && e.name !== 'N/A' ? ` — ${e.name}` : ''}
            </h4>
            <p className="text-justify whitespace-pre-line">{e.text}</p>
          </div>
        ))}

        <div className="report-no-break mt-2 rounded-md border border-slate-300 bg-slate-50 p-4" data-section-start="">
          <h4 className="text-sm font-bold text-slate-900 mb-1.5">Overall Assessment</h4>
          <p className="text-justify">{overallAssessment(caseData, applicants)}</p>
        </div>

        {!hasAnyContent && (
          <p className="text-[12px] italic text-slate-500">
            No residence or employment notes have been recorded by the verifier for this case.
          </p>
        )}
      </div>
    </section>
  );
}

function ModuleGroupedSections({ caseData, applicants }) {
  return (
    <>
      {REPORT_MODULES.map((mod) => {
        const anyApplicable = applicants.some((ap) =>
          isModuleApplicable(caseData.modules[ap.id], mod.key, caseData.loanType),
        );
        if (!anyApplicable) return null;

        const builder = MODULE_ROW_BUILDERS[mod.key];
        return (
          <section key={mod.key} className="report-page">
            <PageHeader title={builder.title} caseId={caseData.id} />

            {applicants.map((ap, idx) => {
              const modules = caseData.modules[ap.id];
              const applicable = isModuleApplicable(modules, mod.key, caseData.loanType);
              const heading = (
                <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide border-l-4 border-slate-900 pl-2 mb-2">
                  {ap.label}
                  {ap.name && ap.name !== 'N/A' ? ` — ${ap.name}` : ''}
                </h3>
              );

              const wrapperClass = idx === 0 ? 'report-no-break mt-5' : 'report-no-break mt-6';
              const sectionStart = idx > 0 ? { 'data-section-start': '' } : {};

              if (!applicable) {
                return (
                  <div key={ap.id} className={wrapperClass} {...sectionStart}>
                    {heading}
                    <p className="text-[12px] text-slate-600 italic px-1 py-2">
                      N/A — this module is not applicable for {ap.label}.
                    </p>
                  </div>
                );
              }

              return (
                <div key={ap.id} className={wrapperClass} {...sectionStart}>
                  {heading}
                  <NumberedDetailTable rows={builder.rows(modules)} />
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}

function CertificatePage({ caseData, reportInfo, signatureDataUrl }) {
  return (
    <section className="report-page">
      <PageHeader title="Final Certificate" caseId={caseData.id} />

      <div className="mt-8 text-[13px] leading-7 text-slate-800 text-justify">
        <p>
          This is to certify that we, <strong>{AGENCY.name}</strong>, Chartered Accountants, have carried out the due
          diligence and field verification in respect of loan application bearing Verification Number{' '}
          <strong className="font-mono">{reportInfo.verificationNumber}</strong>, for the{' '}
          <strong>{dash(caseData.loanType)}</strong> facility of
          <strong> {formatINR(caseData.loanAmount)}</strong> at{' '}
          <strong>{caseData.bankName?.trim() || 'Bank of India'}</strong>,{' '}
          <strong>{dash(caseData.branchName)}</strong> branch.
        </p>
        <p className="mt-3">
          The verification has been performed on the basis of physical visits, documentary evidence submitted, and
          discreet third-party enquiries. The observations recorded in this report are based on the information
          available on the date of verification and to the best of our knowledge and belief.
        </p>
      </div>

      <div className="report-no-break mt-8 rounded-md border-2 border-slate-900 p-5 text-sm">
        <table className="w-full">
          <tbody>
            <CoverRow label="Place" value="Vijayawada" />
            <CoverRow label="Date of Verification" value={reportInfo.dateOfVerification} />
            <CoverRow label="Date of Report Submission" value={reportInfo.dateOfReportSubmission} />
            <CoverRow label="Verification Number" value={reportInfo.verificationNumber} mono />
            <CoverRow label="UDIN Number" value={reportInfo.udinNumber} mono />
            <CoverRow label="Chartered Accountant" value={reportInfo.caName} />
          </tbody>
        </table>
      </div>

      <div className="mt-12 flex justify-end report-no-break">
        <SignatureBlock signatureDataUrl={signatureDataUrl} caName={reportInfo.caName} udin={reportInfo.udinNumber} />
      </div>
    </section>
  );
}

function BranchConfirmationPage({ caseData }) {
  return (
    <section className="report-page">
      <PageHeader title="Confirmation by Branch Head" caseId={caseData.id} />

      <div className="mt-6 text-[13px] leading-7 text-slate-800 text-justify">
        The Branch Head is requested to record acceptance of the field-verification report below for record and onward
        credit-appraisal processing.
      </div>

      <div className="report-no-break mt-8 border-2 border-slate-900 rounded-md">
        <div className="grid grid-cols-2">
          <div className="p-4 border-r-2 border-slate-900">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Decision</p>
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2">
                <span className="inline-block h-5 w-5 border-2 border-slate-900" />
                <span className="font-semibold">Accepted</span>
              </label>
              <label className="flex items-center gap-2">
                <span className="inline-block h-5 w-5 border-2 border-slate-900" />
                <span className="font-semibold">Not Accepted</span>
              </label>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Date</p>
            <div className="h-7 border-b border-slate-400" />
          </div>
        </div>
        <div className="p-4 border-t-2 border-slate-900">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Remarks</p>
          <div className="space-y-4">
            <div className="h-6 border-b border-slate-300" />
            <div className="h-6 border-b border-slate-300" />
            <div className="h-6 border-b border-slate-300" />
          </div>
        </div>
        <div className="p-6 border-t-2 border-slate-900">
          <div className="ml-auto w-72 text-center">
            <div className="h-16 border-b-2 border-slate-900" />
            <p className="mt-2 text-sm font-semibold">Branch Manager</p>
            <p className="text-xs text-slate-600">Signature & Seal</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SupportingDocumentsPages({ caseData, applicants }) {
  const groups = EVIDENCE_GROUPS.map((g) => {
    const items = applicants.flatMap((ap) => {
      const ev = caseData.modules[ap.id]?.evidence?.evidence;
      const list = ev?.[g.key] ?? [];
      return list.map((f) => ({ ...f, owner: ap.label }));
    });
    return { ...g, items };
  }).filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <section className="report-page">
        <PageHeader title="Supporting Documents & Evidence" caseId={caseData.id} />
        <div className="mt-10 text-center text-sm text-slate-500 italic">
          No supporting evidence has been uploaded for this case.
        </div>
      </section>
    );
  }

  return (
    <>
      {groups.map((g) => (
        <section key={g.key} className="report-page">
          <PageHeader title={`Supporting Documents — ${g.label}`} caseId={caseData.id} />
          <div className="mt-5">
            <h4 className="text-sm font-bold text-white bg-slate-900 px-3 py-1.5 mb-3 report-keep-with-next">
              {g.label} <span className="font-normal opacity-80">· {g.items.length} file(s)</span>
            </h4>
            <div className="grid grid-cols-1 gap-5">
              {g.items.map((f) => {
                const isImg = f.type.startsWith('image/');
                return (
                  <figure
                    key={f.id}
                    data-section-start=""
                    className="report-no-break rounded-md border border-slate-300 overflow-hidden bg-white flex flex-col"
                  >
                    <div className="report-image-frame bg-slate-50 flex items-start justify-center overflow-hidden">
                      {isImg ? (
                        <img src={f.dataUrl} alt={f.name} className="report-image" loading="eager" />
                      ) : (
                        <div className="text-xs text-slate-500 px-3 py-6 text-center">
                          <p className="font-semibold">{f.type || 'Document'}</p>
                          <p className="mt-1 break-all">{f.name}</p>
                        </div>
                      )}
                    </div>
                    <figcaption className="px-3 py-2 text-[11px] text-slate-600 border-t border-slate-200 flex items-center justify-between gap-2">
                      <span className="truncate font-medium" title={f.name}>
                        {f.name}
                      </span>
                      <span className="shrink-0 text-slate-500">{f.owner}</span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

export default function BoiReportDocument({ caseData }) {
  const labeledApplicants = useMemo(
    () => (caseData ? labelApplicants(caseData.applicants) : []),
    [caseData],
  );

  if (!caseData) return null;

  const fallbackDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const primary = labeledApplicants.find((a) => a.isPrimary);
  const coApplicants = labeledApplicants.filter((a) => !a.isPrimary);
  const primaryGeneral = caseData.modules[primary?.id ?? '']?.general?.general ?? {};

  const formatLocal = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : fallbackDate;

  const reportInfo = {
    verificationNumber: caseData.id,
    udinNumber: dash(primaryGeneral.udinNumber),
    caName: primaryGeneral.caName?.trim() ? primaryGeneral.caName : AGENCY.caName,
    dateOfVerification: formatLocal(primaryGeneral.dateOfVerification),
    dateOfReportSubmission: formatLocal(primaryGeneral.dateOfReportSubmission),
  };

  return (
    <>
      <CoverPage
        caseData={caseData}
        reportInfo={reportInfo}
        primaryName={dash(primaryGeneral.borrowerName)}
        coApplicants={coApplicants.map((c) => ({
          id: c.id,
          label: c.label,
          name: dash(caseData.modules[c.id]?.general?.general?.borrowerName),
        }))}
        primaryId={primary?.id ?? ''}
        signatureDataUrl={primaryGeneral.caSignatureDataUrl ?? ''}
      />

      <ExecutiveSummaryPage
        caseData={caseData}
        applicants={labeledApplicants.map((a) => ({
          id: a.id,
          label: a.label,
          general: caseData.modules[a.id]?.general?.general ?? {},
        }))}
      />

      <ModuleGroupedSections
        caseData={caseData}
        applicants={labeledApplicants.map((a) => ({
          id: a.id,
          label: a.label,
          name: dash(caseData.modules[a.id]?.general?.general?.borrowerName),
        }))}
      />

      <CertificatePage
        caseData={caseData}
        reportInfo={reportInfo}
        signatureDataUrl={primaryGeneral.caSignatureDataUrl ?? ''}
      />

      <BranchConfirmationPage caseData={caseData} />

      <SupportingDocumentsPages caseData={caseData} applicants={labeledApplicants} />
    </>
  );
}
