import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  IdCard,
  ImageUp,
  Landmark,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '../../common';
import { executiveAPI } from '../../../api/executiveAPI';
import { useExecutiveDraft } from '../../../hooks/useExecutiveDraft';
import {
  BoiFormField,
  BoiMobileStepHeader,
  BoiStickyMobileNav,
  boiInputClass,
  boiSelectClass,
  boiTextareaClass,
  cn,
} from './boiFormShared';
import {
  emptyApplicant,
  getBoiHomeLoanEmptyState,
  getBoiHomeLoanTestData,
  makeTestEvidenceFile,
} from '../../../utils/boiHomeLoanTestData';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 12;

const SECTIONS = [
  { key: 'cover', title: 'Cover & Summary', icon: Landmark },
  { key: 'general', title: 'General Details', icon: Users },
  { key: 'residence', title: 'Residence', icon: Home },
  { key: 'employment', title: 'Employment', icon: Building2 },
  { key: 'pan', title: 'PAN', icon: IdCard },
  { key: 'salary', title: 'Salary / Form-16', icon: Wallet },
  { key: 'property', title: 'Property & Builders', icon: ClipboardList },
  { key: 'itr_bank', title: 'ITR & Bank', icon: FileText },
  { key: 'photos', title: 'Photos & Certificate', icon: ImageUp },
];

const SUMMARY_KEYS = [
  ['summary_personal', 'Personal Details'],
  ['summary_residence', 'Residence Verification'],
  ['summary_telephone', 'Telephone Verification'],
  ['summary_payslips', 'Pay Slips'],
  ['summary_form16', 'Form-16 Verification'],
  ['summary_employer', 'Employer Office'],
  ['summary_office_place', 'Place of Office / Business'],
  ['summary_bank', 'Bank Details'],
  ['summary_other', 'Other Details'],
];

const STATUS_OPTS = ['Positive', 'Negative', 'Not Applicable'];

export default function BoiHomeLoanVerificationForm({ applicantCount = 1, isGuarantor = false }) {
  const numApps = Math.min(4, Math.max(1, Number(applicantCount) || 1));
  const templateId = isGuarantor ? 'boi-home-loan-3-guarantor' : `boi-home-loan-${numApps}`;
  const user = useSelector((s) => s.auth?.user);
  const [form, setForm] = useState(() => getBoiHomeLoanEmptyState(numApps));
  const [photos, setPhotos] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeApp, setActiveApp] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { draftId, savingDraft, loadingDraft, saveDraft } = useExecutiveDraft(templateId, {
    onRestore: useCallback(({ form: restoredForm }) => {
      if (restoredForm) {
        setForm((prev) => ({ ...prev, ...restoredForm }));
      }
    }, []),
  });

  const handleSaveDraft = useCallback(() => {
    saveDraft(form, photos.length);
  }, [saveDraft, form, photos.length]);

  const applicants = (form.applicants || []).slice(0, numApps);

  React.useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setForm((prev) => {
      let changed = false;
      const update = { ...prev };
      if (!update.cert_name && user?.name) {
        update.cert_name = user.name;
        changed = true;
      }
      if (!update.cert_date) {
        update.cert_date = update.report_date || today;
        changed = true;
      }
      if (!update.cert_place) {
        update.cert_place = 'Vijayawada';
        changed = true;
      }
      if (!update.cert_auditor) {
        update.cert_auditor = 'PARVEZ AND NARAYANA, CHARTERED ACCOUNTANTS';
        changed = true;
      }
      return changed ? update : prev;
    });
  }, [user, form.report_date]);

  const updateField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateApplicant = useCallback((index, key, value) => {
    setForm((prev) => {
      const list = [...(prev.applicants || [])];
      while (list.length <= index) list.push(emptyApplicant());
      list[index] = { ...list[index], [key]: value };
      return { ...prev, applicants: list };
    });
  }, []);

  const handleFillTestData = () => {
    const data = getBoiHomeLoanTestData(user, numApps);
    setForm(data);
    setActiveApp(0);
    const captions = data.photo_captions || [];
    const names = data.photo_names || [];
    setPhotos(
      captions.map((cap, i) => {
        const file = makeTestEvidenceFile(`hl-site-${i + 1}.png`);
        return {
          file,
          preview: URL.createObjectURL(file),
          caption: cap,
          name: names[i] || data.applicants?.[0]?.borrower_name || '',
        };
      })
    );
    toast.success('Test data filled');
  };

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const next = [...photos];
    for (const file of files) {
      if (next.length >= MAX_PHOTOS) {
        toast.error(`Maximum ${MAX_PHOTOS} photographs allowed`);
        break;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: only images allowed`);
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        toast.error(`${file.name}: max 5 MB per image`);
        continue;
      }
      next.push({
        file,
        preview: URL.createObjectURL(file),
        caption: '',
        name: applicants[0]?.borrower_name || '',
      });
    }
    setPhotos(next);
  };

  const updatePhoto = (index, patch) => {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return copy;
    });
  };

  const validateStep = (stepIndex) => {
    const key = SECTIONS[stepIndex]?.key;
    if (key === 'cover') {
      if (!form.report_date?.trim()) {
        toast.error('Report date is required');
        return false;
      }
      if (!form.bank_name?.trim()) {
        toast.error('Bank name is required');
        return false;
      }
      if (!form.branch_name?.trim()) {
        toast.error('Branch name is required');
        return false;
      }
    }
    if (key === 'general') {
      if (!applicants[0]?.borrower_name?.trim()) {
        toast.error('Primary applicant name is required');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < SECTIONS.length - 1) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      setCurrentStep(0);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        is_guarantor: isGuarantor,
        num_applicants: numApps,
        applicants: applicants.slice(0, numApps),
        photo_captions: photos.map((p) => p.caption || ''),
        photo_names: photos.map((p) => p.name || ''),
        photos: photos.map((p, i) => ({
          fileName: p.file?.name || `photo-${i + 1}.jpg`,
          caption: p.caption || '',
          name: p.name || '',
        })),
        executive_name: user?.name || form.auditor_name || '',
      };
      const imageFiles = photos.map((p) => p.file).filter(Boolean);
      await executiveAPI.generateExecutiveReport(templateId, payload, imageFiles);
      toast.success('Report submitted for admin approval');
      setForm(getBoiHomeLoanEmptyState(numApps));
      setPhotos([]);
      setCurrentStep(0);
      setActiveApp(0);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to generate report');
    } finally {
      setSubmitting(false);
    }
  };

  const ApplicantTabs = () => {
    if (numApps <= 1) return null;
    return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
      {applicants.map((a, i) => {
        const label = isGuarantor && i === 2 ? 'Guarantor' : `Applicant ${i + 1}`;
        return (
          <button
            key={i}
            type="button"
            onClick={() => setActiveApp(i)}
            className={cn(
              'shrink-0 min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
              activeApp === i
                ? 'bg-purple-100 text-[#7e22ce] border-purple-300'
                : 'bg-white text-gray-600 border-gray-200'
            )}
          >
            {label}
            {a.borrower_name ? ` · ${a.borrower_name.split(' ')[0]}` : ''}
          </button>
        );
      })}
    </div>
    );
  };

  const AppField = ({ label, field, textarea, className = '' }) => (
    <BoiFormField label={label} className={className}>
      {textarea ? (
        <textarea
          rows={2}
          className={boiTextareaClass}
          value={applicants[activeApp]?.[field] || ''}
          onChange={(e) => updateApplicant(activeApp, field, e.target.value)}
        />
      ) : (
        <input
          className={boiInputClass}
          value={applicants[activeApp]?.[field] || ''}
          onChange={(e) => updateApplicant(activeApp, field, e.target.value)}
        />
      )}
    </BoiFormField>
  );

  const CaseField = ({ label, field, textarea, className = '' }) => (
    <BoiFormField label={label} className={className}>
      {textarea ? (
        <textarea
          rows={2}
          className={boiTextareaClass}
          value={form[field] || ''}
          onChange={(e) => updateField(field, e.target.value)}
        />
      ) : (
        <input
          className={boiInputClass}
          value={form[field] || ''}
          onChange={(e) => updateField(field, e.target.value)}
        />
      )}
    </BoiFormField>
  );

  const renderSection = () => {
    const key = SECTIONS[currentStep]?.key;

    if (key === 'cover') {
      return (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <CaseField label="Report Date" field="report_date" />
            <CaseField label="Bank Name" field="bank_name" />
            <CaseField label="Branch" field="branch_name" />
            <CaseField label="Type / Purpose of Loan" field="loan_type" />
            <CaseField label="Loan Amount Sought" field="loan_amount" />
            <CaseField label="Bank Reference No." field="bank_reference_no" />
            <CaseField label="DDA Reference No." field="dda_reference_no" />
            <CaseField label="Date of Receipt of File" field="date_receipt" />
            <CaseField label="Date of Submission of Report" field="date_submission" />
            <CaseField label="Proposal Pertaining to Branch" field="proposal_branch" className="sm:col-span-2" />
          </div>

          <p className="text-sm font-semibold text-gray-800">Verification Summary (per applicant)</p>
          <p className="text-xs italic text-[#214d7a]">Mark each row: Positive / Negative / Not Applicable.</p>
          <ApplicantTabs />
          <div className="grid gap-3 sm:grid-cols-2">
            {SUMMARY_KEYS.map(([f, label]) => (
              <BoiFormField key={f} label={label}>
                <select
                  className={boiSelectClass}
                  value={applicants[activeApp]?.[f] || ''}
                  onChange={(e) => updateApplicant(activeApp, f, e.target.value)}
                >
                  <option value="">Select</option>
                  {STATUS_OPTS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </BoiFormField>
            ))}
          </div>

          <p className="text-sm font-semibold text-gray-800">Overall Opinion</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <CaseField label="Date & Time of Visit" field="overall_visit_datetime" textarea className="sm:col-span-2" />
            <BoiFormField label="Positive / Negative / N.A.">
              <select
                className={boiSelectClass}
                value={form.overall_status}
                onChange={(e) => updateField('overall_status', e.target.value)}
              >
                <option value="">Select</option>
                {STATUS_OPTS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </BoiFormField>
            <CaseField label="Overall View / Opinion" field="overall_opinion" textarea className="sm:col-span-2" />
          </div>
        </div>
      );
    }

    if (key === 'general') {
      return (
        <div className="space-y-4">
          <ApplicantTabs />
          <div className="grid gap-4 sm:grid-cols-2">
            <AppField label="Name of the Borrower" field="borrower_name" className="sm:col-span-2" />
            <AppField label="Father's / Spouse's Name" field="father_spouse" />
            <AppField label="Gender" field="gender" />
            <AppField label="Resident Status" field="resident_status" />
            <AppField label="PAN No." field="pan" />
            <AppField label="Aadhaar No." field="aadhaar" />
            <AppField label="Date of Birth" field="dob" />
            <AppField label="Qualification" field="qualification" />
            <AppField label="Marital Status" field="marital_status" />
            <AppField label="Type of Employment (Salaried / Business / Others)" field="employment_type" className="sm:col-span-2" />
            <AppField label="Permanent Address" field="permanent_address" textarea className="sm:col-span-2" />
            <AppField label="Telephone Number" field="telephone" />
            <AppField label="Trade Licence" field="trade_licence" />
            <AppField label="Type of Loan" field="type_of_loan" />
          </div>
        </div>
      );
    }

    if (key === 'residence') {
      return (
        <div className="space-y-5">
          <p className="text-sm font-semibold text-gray-800">Narratives (case-level)</p>
          <div className="grid gap-4">
            {[
              ['res_narrative_visit', 'Visit and Physical Verification'],
              ['res_narrative_details', 'Residence Details'],
              ['res_narrative_family', 'Family Details'],
              ['res_narrative_living', 'Standard of Living'],
              ['res_narrative_conclusion', 'Conclusion'],
            ].map(([f, l]) => (
              <CaseField key={f} label={l} field={f} textarea />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">Detailed Particulars (per applicant)</p>
          <ApplicantTabs />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['res_address_tallied', 'Present Residence Address Tallied (Yes/No)'],
              ['res_landmark', "Applicant's Residence Landmark"],
              ['res_stay_confirmed', 'Name & Stay Confirmed? Staying Since'],
              ['res_nameplate_seen', 'Name Plate Seen (Yes/No)'],
              ['res_nameplate_tally', 'Name on Plate Tally (Yes/No)'],
              ['res_nature', 'Nature of Residence (Owned / Rental / Family Owned / Lease / Paying Guest / Company Quarters / Others)'],
              ['res_type', 'Type of Residence (Flat / Independent House / Multi-Tenanted House)'],
              ['res_person_contacted', 'Name & Address of Person Contacted'],
              ['res_relation', 'Relation with Applicant'],
              ['res_city', 'Name of City'],
              ['res_pincode', 'Pin Code'],
              ['res_phone', 'Residence Phone No.'],
              ['res_mobile', 'Mobile No.'],
              ['res_locality_type', 'Type of Locality (Commercial / Residential / Project-Security Area)'],
              ['res_locality', 'Locality / Land Mark'],
              ['res_present_address', 'Present Address'],
              ['res_family_members', 'No. of Family Members'],
              ['res_earning_members', 'No. of Earning Family Members'],
              ['res_years', 'Years of Current Residence'],
              ['res_accessibility', 'Accessibility'],
              ['res_vehicles', 'Vehicles Owned'],
            ].map(([f, l]) => (
              <AppField key={f} label={l} field={f} className={f.includes('address') ? 'sm:col-span-2' : ''} textarea={f.includes('address') || f === 'res_person_contacted'} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">If house locked / address not confirmed</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['locked_stay', 'a) Does applicant stay'],
              ['locked_age', 'b) Approx age'],
              ['locked_family', 'c) Family members'],
              ['locked_occupation', 'd) Occupation'],
              ['locked_since', 'e) Staying since'],
              ['unconfirmed_reason', 'Reason for address not confirmed (Untraceable / Mismatched)'],
              ['unconfirmed_untraceable', 'If untraceable'],
              ['unconfirmed_mismatch', 'If mismatched'],
            ].map(([f, l]) => (
              <CaseField key={f} label={l} field={f} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">Living standard & neighbourhood</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['living_standard', 'Standard of Living (Upper / Upper-Middle / Middle / Lower-Middle / Lower)'],
              ['living_colour', 'Colour of House'],
              ['living_interior', 'Interior Conditions'],
              ['living_assets', 'Assets Seen (Television / Refrigerator / AC / Music System)'],
              ['living_storeys', 'No. of Storeys'],
              ['living_watchman', 'Watchman'],
              ['living_lift', 'Lift'],
              ['living_society', 'Society Board & Name in Register of Society (Yes/No)'],
              ['living_cars', 'No of Cars Seen In and Around Residence'],
              ['living_appearance', 'External Appearance of Building / Society (Excellent / Good / Fair / Poor)'],
              ['living_parking', 'Separate Parking Slot Allotted (Yes/No)'],
              ['living_entry', 'Entry into Residence Permitted (Yes / No / Door Locked)'],
              ['living_size', 'Approximate Size of Flat / House (sq. ft. / sq. yards)'],
              ['neighbour_remarks', 'Neighbourhood Check'],
              ['res_signoff_datetime', 'Date and Time of Visit'],
              ['res_signoff_verifier', 'Verifier & Remarks'],
              ['res_signoff_supervisor', 'Supervisor & Remarks'],
              ['res_signoff_negative', 'Negative Remarks'],
              ['res_conclusion_status', 'Residence Conclusion Status'],
            ].map(([f, l]) => (
              <CaseField key={f} label={l} field={f} className={f === 'neighbour_remarks' ? 'sm:col-span-2' : ''} textarea={f === 'neighbour_remarks'} />
            ))}
          </div>
        </div>
      );
    }

    if (key === 'employment') {
      return (
        <div className="space-y-5">
          <ApplicantTabs />
          <AppField label="Business / Employment Confirmation (narrative)" field="emp_narrative" textarea className="sm:col-span-2" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['emp_name', 'Name of the Business Firm / Employer'],
              ['emp_address', 'Address of the Business Firm / Employer'],
              ['emp_confirmed_by', 'Address Confirmed By'],
              ['emp_landmark', 'Landmark / Locality'],
              ['emp_ownership', 'Ownership of Office / Shop / Factory (Owned/Rented)'],
              ['emp_nameboard', 'Whether Name Board of Firm / Office Sighted (Yes/No)'],
              ['emp_nameboard_comments', 'If No, Comments Thereof'],
              ['emp_proofs', 'Types of Proof Received (ID Card / Letter Head / Old Envelope-Bill Copy / GST-MSME-Udyam / Others)'],
              ['emp_designation', 'Designation'],
              ['emp_year_est', 'If Business, Year of Establishment'],
              ['emp_firm_type', 'Type of Employer / Business Firm (Pub. Ltd / Pvt. Ltd / Partnership / LLP / Self-Employed / Others)'],
              ['emp_nature', 'Nature of Business of Firm / Employer (Manufacturing / Trading / Servicing / Others)'],
              ['emp_website', 'Website / Email ID of the Employer'],
              ['emp_since', 'Employed Since / Business Conducted in Premises Since'],
              ['emp_change_likelihood', 'Any Information on Likelihood of Change in Employment Status'],
              ['emp_line', 'Line of Business (for Self-Employed)'],
              ['emp_phone', 'Telephone No. of Business Firm / Employer'],
              ['emp_terms', 'Terms of Employment (Full-time / Part-time / Temporary / Other)'],
              ['emp_grade', 'Grade (Employees) (Executive / Supervisory / Clerical / Subordinate / Other)'],
              ['emp_supervisor', 'Name of Supervisory Official & Designation / Mobile No.'],
              ['emp_visiting_card', 'Visiting Card of Authorised Executive Obtained (Yes/No)'],
            ].map(([f, l]) => (
              <AppField key={f} label={l} field={f} className={f === 'emp_address' ? 'sm:col-span-2' : ''} textarea={f === 'emp_address'} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">Business Premises (case-level)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['premises_type', 'Type of Office (Industrial/Factory/Workshop / Small Production Unit / Residential-cum-Commercial / Residential / Slum-Chawl / Underdeveloped Area)'],
              ['premises_locality', 'Locality of Office (Posh / Good / Average / Poor)'],
              ['premises_building', 'Describe the Building (Shop / Office / Complex)'],
              ['premises_hours', 'Working Hours'],
              ['premises_employees', 'No. of Employees'],
              ['premises_branches', 'No. of Branches'],
              ['premises_separate_area', 'If Business Conducted in Own Residence, Is There a Separate Area Earmarked (Yes/No)'],
              ['premises_status', 'Status of Premises - Reception Area / Security Guard / Cabin / Air Conditioner / Xerox / Fax / Computer (Yes/No each)'],
              ['emp_signoff_verifier', 'Verifier & Remarks'],
              ['emp_signoff_supervisor', 'Supervisor & Remarks'],
              ['emp_signoff_negative', 'Negative Remarks'],
            ].map(([f, l]) => (
              <CaseField key={f} label={l} field={f} className={f === 'premises_status' ? 'sm:col-span-2' : ''} textarea={f === 'premises_status'} />
            ))}
          </div>
        </div>
      );
    }

    if (key === 'pan') {
      return (
        <div className="space-y-4">
          <ApplicantTabs />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['pan_number', 'PAN Number'],
              ['pan_name_match', 'Name Matching (Yes/No)'],
              ['pan_gender_match', 'Gender Matching (Yes/No)'],
              ['pan_tenth_alpha', 'Tenth Digit Alphabetic'],
              ['pan_digits_numeric', 'Are the 6th, 7th, 8th & 9th Digits Numeric (Yes/No)'],
              ['pan_fourth_digit', "Is the Fourth Digit 'P' for Individual / 'H' for HUF / 'C' for Companies / 'F' for Firms (Yes/No)"],
              ['pan_fifth_match', '5th Char Matches Surname'],
              ['pan_it_verified', 'Verified with IT Website'],
              ['pan_final_status', 'Final Status'],
              ['pan_remarks', 'Remarks'],
              ['pan_verifier', 'Verifier & Remarks'],
              ['pan_supervisor', 'Supervisor & Remarks'],
              ['pan_negative', 'Negative Remarks'],
            ].map(([f, l]) => (
              <AppField key={f} label={l} field={f} className={['pan_remarks', 'pan_negative'].includes(f) ? 'sm:col-span-2' : ''} textarea={['pan_remarks', 'pan_negative'].includes(f)} />
            ))}
          </div>
        </div>
      );
    }

    if (key === 'salary') {
      return (
        <div className="space-y-4">
          <ApplicantTabs />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['sal_firm', 'Name of Firm / Company / Institution & Dept. in which Applicant is Working'],
              ['sal_designation', "Applicant's Designation"],
              ['sal_years', "Applicant's Years of Service with Organisation"],
              ['sal_confirmed', 'Services Confirmed (Yes/No)'],
              ['sal_gross', 'Gross Annual / Monthly Income of the Applicant'],
              ['sal_total_income', 'Total Income as per SS/SC/PS/Form-16'],
              ['sal_head_verified', "Income Under Head 'Salaries' Verified"],
              ['sal_tax_verified', 'Tax Calculation Verified'],
              ['sal_form16_correct', 'Form-16 Tax Payable Correct'],
              ['sal_no_remarks', 'If No, Remarks'],
              ['doc_seal', 'Seal of Organisation'],
              ['doc_signature', 'Signature of Issuing Authority'],
              ['doc_date_amount', 'Date & Amount on SS/PS/SC'],
              ['doc_office_address', "Applicant's Office Address Correct"],
            ].map(([f, l]) => (
              <AppField key={f} label={l} field={f} className={['sal_firm', 'sal_gross', 'sal_total_income', 'sal_no_remarks'].includes(f) ? 'sm:col-span-2' : ''} textarea={['sal_firm', 'sal_gross', 'sal_total_income', 'sal_no_remarks'].includes(f)} />
            ))}
          </div>
        </div>
      );
    }

    if (key === 'property') {
      return (
        <div className="space-y-5">
          <p className="text-sm font-semibold text-gray-800">6. Property Proposed to be Mortgaged</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['prop_identifier', 'a) Person who identified the property'],
              ['prop_visit_date', 'b) Date of Visit'],
              ['prop_title_verified', 'c) Title Deeds / Tax Receipts Verified'],
              ['prop_others', 'd) Others'],
              ['prop_valuation', 'e) Property Details as per Valuation'],
            ].map(([f, l]) => (
              <CaseField key={f} label={l} field={f} className="sm:col-span-2" textarea />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">7. In Case of Builders</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['builder_since', 'Established Since'],
              ['builder_projects', 'Number of Projects Executed So Far'],
              ['builder_sold', 'Number of Flats Sold'],
              ['builder_constructed', 'Number of Flats Constructed'],
              ['builder_enquiry1', 'Market Enquiries on Reputation - Enquiry Source 1'],
              ['builder_enquiry2', 'Market Enquiries on Reputation - Enquiry Source 2'],
              ['builder_quality', 'Quality of Construction (as per Market Report)'],
              ['builder_nature', 'Nature of Property (Agricultural / Non-Agricultural)'],
              ['builder_approved', 'Whether Project Approved by Zonal Office (Yes/No)'],
            ].map(([f, l]) => (
              <CaseField key={f} label={l} field={f} />
            ))}
          </div>
        </div>
      );
    }

    if (key === 'itr_bank') {
      return (
        <div className="space-y-5">
          <p className="text-sm font-semibold text-gray-800">8. Latest ITR Verification</p>
          <div className="grid gap-4">
            {[
              ['itr_latest', 'IT Returns - Latest Year'],
              ['itr_preceding', 'IT Returns - Preceding Year'],
              ['itr_second', 'IT Returns - Second Preceding Year'],
              ['itr_verified', 'Verification with Income Tax Office / e-Filing Portal (Genuine - Yes/No)'],
            ].map(([f, l]) => (
              <CaseField key={f} label={l} field={f} textarea={f !== 'itr_verified'} />
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-800">9. Bank Account Verification</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <CaseField label="Name of the Applicant" field="bank_applicant_name" />
            <CaseField label="Bank Account No." field="bank_account_no" />
            <CaseField label="Name of the Bank and Branch" field="bank_name_branch" className="sm:col-span-2" />
            <CaseField label="Observations / Remarks on Major / Regular Debits in the Account (Credit Cards, Debit Cards, EMI Charges, etc.)" field="bank_observations" textarea className="sm:col-span-2" />
          </div>
        </div>
      );
    }

    if (key === 'photos') {
      return (
        <div className="space-y-5">
          <div className="rounded-xl border border-dashed border-purple-300 bg-purple-50/40 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Annexure — Site Visit Photographs</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Up to {MAX_PHOTOS} images · max 5 MB each · name + caption per photo
                </p>
              </div>
              <label className="inline-flex">
                <span className="cursor-pointer rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700">
                  Upload images
                </span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoAdd} />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {photos.map((p, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 bg-white p-2 space-y-2">
                  <div className="aspect-video overflow-hidden rounded-md bg-gray-100">
                    <img src={p.preview} alt="" className="h-full w-full object-cover" />
                  </div>
                  <input
                    className={cn(boiInputClass, 'text-xs py-1.5')}
                    placeholder="Name (header)"
                    value={p.name}
                    onChange={(e) => updatePhoto(idx, { name: e.target.value })}
                  />
                  <textarea
                    rows={2}
                    className={cn(boiTextareaClass, 'text-xs min-h-[60px]')}
                    placeholder="Caption"
                    value={p.caption}
                    onChange={(e) => updatePhoto(idx, { caption: e.target.value })}
                  />
                  <button type="button" className="text-xs text-red-600 inline-flex items-center gap-1" onClick={() => removePhoto(idx)}>
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              ))}
            </div>
            {!photos.length && (
              <p className="text-xs text-gray-500 text-center py-4">No photographs uploaded yet (optional).</p>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800">Final Certificate</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <CaseField label="Place" field="cert_place" />
            <CaseField label="Date" field="cert_date" />
            <CaseField label="UDIN No." field="cert_udin" />
            <CaseField label="Due Diligence Audit By" field="cert_auditor" />
            <CaseField label="Name" field="cert_name" className="sm:col-span-2" />
          </div>
        </div>
      );
    }

    return null;
  };

  const section = SECTIONS[currentStep];
  const Icon = section.icon;
  const progress = Math.round(((currentStep + 1) / SECTIONS.length) * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-24 relative px-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Home className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            {isGuarantor ? 'BOI HOME LOAN-3 WITH GUARANTOR' : `BOI HOME LOAN-${numApps}`}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Due Diligence Audit Report — {isGuarantor ? '2 applicants + 1 Guarantor' : `${numApps} applicant${numApps > 1 ? 's' : ''}`} · admin approval on submit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={savingDraft || submitting}
            className="gap-1.5 h-10 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingDraft ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleFillTestData}
            className="gap-1.5 h-10 border-purple-200 bg-purple-50 text-[#7e22ce] hover:bg-purple-100"
          >
            <Sparkles className="h-4 w-4" />
            Fill Test Data
          </Button>
        </div>
      </div>

      <BoiMobileStepHeader icon={Icon} title={section.title} stepIndex={currentStep} stepCount={SECTIONS.length} />

      <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
          <span className="bg-purple-50 text-[#7e22ce] px-2.5 py-1 rounded-full text-[11px] font-bold">
            Step {currentStep + 1} of {SECTIONS.length}
          </span>
          <span className="text-gray-500 font-medium">{progress}% Complete</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="bg-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="hidden sm:block overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {SECTIONS.map((s, index) => {
            const SIcon = s.icon;
            const isCurrent = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  if (index < currentStep || validateStep(currentStep)) setCurrentStep(index);
                }}
                className={cn(
                  'px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 border',
                  isCurrent
                    ? 'bg-purple-600 text-white border-purple-600'
                    : isCompleted
                      ? 'bg-purple-50 text-[#7e22ce] border-purple-200'
                      : 'bg-white text-gray-600 border-gray-200'
                )}
              >
                <SIcon className="h-3.5 w-3.5" />
                {s.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="hidden sm:flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-gray-900">{section.title}</h2>
        </div>
        {renderSection()}
      </div>

      <div className="hidden sm:flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || submitting} className="gap-1.5 h-10">
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={savingDraft || submitting}
            className="gap-1.5 h-10 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingDraft ? 'Saving…' : 'Save Draft'}
          </Button>
          {currentStep === SECTIONS.length - 1 ? (
            <Button type="button" onClick={handleSubmit} disabled={submitting} className="gap-1.5 h-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit for Approval
            </Button>
          ) : (
            <Button type="button" onClick={handleNext} disabled={submitting} className="gap-1.5 h-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <BoiStickyMobileNav
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === SECTIONS.length - 1}
        savingDraft={savingDraft}
        busy={submitting}
      />

      {submitting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-50 text-white gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
          <p className="text-sm font-semibold">Generating PDF & submitting for admin approval...</p>
        </div>
      )}
    </div>
  );
}
