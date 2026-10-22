import React, { useCallback, useState } from 'react';
import { FlaskConical, Upload, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks';
import { useExecutiveDraft } from '../../hooks/useExecutiveDraft';
import { Input, Button } from '../common';
import { executiveAPI } from '../../api/executiveAPI';
import { getSbiHouseTestData, getSbiBussinessTestData } from '../../utils/sbiHouseTestData';
import {
  LOCALITY_OPTIONS,
  ACCESSIBILITY_OPTIONS,
  ACCOMMODATION_OPTIONS,
  ACCOMMODATION_OTHER_VALUE,
  APPEARANCE_OPTIONS,
  ENTRY_PERMITTED_OPTIONS,
  YES_NO_OPTIONS
} from '../../utils/sbiHouseFormOptions';
import {
  formatDdMmYyyy,
  convertToYyyyMmDd,
  convertToDdMmYyyy,
  ExecutiveFormShell,
  ExecutiveFormCard,
  ExecutiveFormBody,
  FormSection,
  FormFieldGrid,
  FormTextarea,
  SelectGroup,
  FormLogosHeader,
  SitePhotosSection,
  StickyFormActions,
  DraftStatusBanner,
  useExecutiveFormBootstrap,
  EXECUTIVE_INPUT_CLASS,
  mergeSitePhotoFiles
} from './executiveFormShared';

const NEIGHBOUR_OPTIONS = [
  { value: 'Positive', label: 'Positive' },
  { value: 'Negative', label: 'Negative' },
  { value: 'Neutral', label: 'Neutral' }
];

const FLAT_OWNERSHIP_OPTIONS = [
  { value: 'Owned', label: 'Owned' },
  { value: 'Rented', label: 'Rented' }
];

const DURATION_OF_STAY_OPTIONS = Array.from({ length: 50 }, (_, i) => {
  const years = i + 1;
  const label = years === 1 ? '1 year' : `${years} years`;
  return { value: label, label };
});

const FAMILY_MEMBERS_OPTIONS = Array.from({ length: 26 }, (_, i) => ({
  value: String(i),
  label: String(i)
}));

const DEPENDENTS_OPTIONS = Array.from({ length: 16 }, (_, i) => ({
  value: String(i),
  label: String(i)
}));

const HOUSE_TYPE_OPTIONS = [
  { value: 'Joint Property', label: 'Joint Property' },
  { value: 'Applicant Own Property', label: 'Applicant Own Property' },
  { value: 'Co-Applicant Own Property', label: 'Co-Applicant Own Property' },
  { value: 'Relatives Property', label: 'Relatives Property' },
  { value: 'Brother Property', label: 'Brother Property' },
  { value: 'Sister Property', label: 'Sister Property' }
];

function emptyForm(user) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    num_applicants: '2',
    receipt_date: formatDdMmYyyy(yesterday),
    report_date: formatDdMmYyyy(today),
    rlms_number: '',
    report_id: '',
    branch_name: '',
    applicant_name: '',
    co_applicant_name: '',
    co_applicant_2_name: '',
    address: '',
    locality_surrounding: '',
    accessibility: '',
    entrance_motorable: 'yes',
    address_confirmed: 'yes',
    pin_code: '',
    landmark: '',
    accommodation_type: '',
    accommodation_type_other: '',
    supervised_by: user?.supervised_by || 'MD.Khaja',
    verified_by: user?.verified_by || 'M.Suresh Babu',
    firm_contact: user?.firm_contact || '9014221011, 9491349091, 0866-6551011, 6464786',
    floors: 'Ground + 1 Floors',
    watchman: 'no',
    lift: 'no',
    name_outside: 'no',
    appearance: '',
    entry_permitted: 'yes',
    person_contacted: '',
    relationship: '',
    neighbour_verification: 'Positive',
    neighbour_comments: '',
    applicant_mobile: '',
    co_applicant_mobile: '',
    co_applicant_2_mobile: '',
    field_executive_intro: '',
    field_executive_comment_items: [],
    house_type: '',
    flat_ownership: '',
    duration_of_stay: '',
    total_family_members: '',
    dependents_applicant: '',
    dependents_co_applicant: '',
    dependents_co_applicant_2: '',
    document_status: 'GIVEN DOCUMENTS WERE CHECKED, STANDARD OF LIVING IS SATISFACTORY,',
    residence_confirmation: ' APPLICANT STAY CONFIRMED BY         (APPLICANT NEIGHBOUR)',
    residence_note: '',
    status_positive: true,
    executive_name: user?.name || '',
    executive_mobile: user?.phone || ''
  };
}

function emptyBusinessForm(user) {
  const today = new Date();
  return {
    report_date: formatDdMmYyyy(today),
    rlms_number: '',
    applicant_name: '',
    applicant_phone: '',
    address: '',
    premises_name: '',
    building_description: '',
    premises_owned_rented: '',
    observed_staff_seen: '',
    total_staff: '',
    field_executive_intro: 'VISITED THE GIVEN ADDRESS AND MET THE APPLICANT,',
    business_name: '',
    applicant_designation: '',
    nature_of_business: '',
    nature_of_business_detail: '',
    business_experience: '',
    business_activities_seen: 'YES',
    business_name_board_seen: 'YES',
    turnover_declared: '',
    business_transaction_account: '',
    activity_confirmed_by: '',
    activity_confirmed_relationship: '',
    business_note: '',
    supervised_by: user?.supervised_by || 'MD.Khaja',
    verified_by: user?.verified_by || 'M.Suresh Babu',
    firm_contact: user?.firm_contact || '9014221011, 9491349091, 0866-6551011, 6464786',
    status_positive: true,
    executive_name: user?.name || '',
    executive_mobile: user?.phone || ''
  };
}

const SbiHouseVerificationForm = ({ templateId = 'sbi-house' }) => {
  const isBusinessTemplate = templateId === 'sbi-bussiness';
  const skipObservationSections = isBusinessTemplate;
  const { user, getProfile } = useAuth();
  const [form, setForm] = useState(() =>
    isBusinessTemplate ? emptyBusinessForm(user) : emptyForm(user)
  );
  const [photos, setPhotos] = useState([]);
  const [sectionPhotos, setSectionPhotos] = useState({
    status: [],
    gas_bill: [],
    aadhar_card: [],
    electricity_bill: [],
    landline_bill: [],
    internet_bill: [],
    license: [],
    bank_statements: [],
    ration_card: []
  });

  const handleSectionPhotos = (sectionKey, maxCount) => (e) => {
    const selected = Array.from(e.target.files || []);
    let oversized = 0;
    const valid = selected.filter(file => {
      if (file.size > 4 * 1024 * 1024) {
        oversized++;
        return false;
      }
      return true;
    });
    
    if (oversized > 0) {
      toast.error(`Each image must be 4MB or less (${oversized} file(s) skipped)`);
    }

    setSectionPhotos((prev) => {
      const existing = prev[sectionKey] || [];
      const combined = [...existing, ...valid].slice(0, maxCount);
      return {
        ...prev,
        [sectionKey]: combined
      };
    });
    e.target.value = '';
  };

  const handleRemoveSectionPhoto = (sectionKey, idx) => {
    setSectionPhotos((prev) => {
      const existing = prev[sectionKey] || [];
      return {
        ...prev,
        [sectionKey]: existing.filter((_, i) => i !== idx)
      };
    });
  };

  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [optimizingIntro, setOptimizingIntro] = useState(false);
  const [introOptimizedPreview, setIntroOptimizedPreview] = useState('');
  const [showIntroPreview, setShowIntroPreview] = useState(false);
  const [optimizingNote, setOptimizingNote] = useState(false);
  const [noteOptimizedPreview, setNoteOptimizedPreview] = useState('');
  const [showNotePreview, setShowNotePreview] = useState(false);

  const { caLogoUrl, sbiLogoUrl } = useExecutiveFormBootstrap({
    getProfile,
    setForm,
    executiveAPI
  });

  const onRestoreDraft = useCallback(({ form: saved }) => {
    if (saved && typeof saved === 'object') {
      setForm((prev) => ({ ...prev, ...saved }));
    }
  }, []);

  const { draftId, savingDraft, loadingDraft, saveDraft } = useExecutiveDraft(templateId, {
    onRestore: onRestoreDraft
  });

  const currentHouseType = form.house_type || '';
  const displayHouseTypeOptions = HOUSE_TYPE_OPTIONS.slice();
  if (currentHouseType && !HOUSE_TYPE_OPTIONS.some(opt => opt.value.toLowerCase() === currentHouseType.toLowerCase())) {
    displayHouseTypeOptions.unshift({ value: currentHouseType, label: currentHouseType });
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'field_executive_intro') {
      const sanitized = value.replace(/\r?\n|\r/g, '');
      setForm((prev) => ({ ...prev, [name]: sanitized }));
      return;
    }
    if (name === 'residence_note') {
      const sanitized = value.replace(/\r?\n|\r/g, '');
      setForm((prev) => ({ ...prev, [name]: sanitized }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const formatted = convertToDdMmYyyy(value);
    setForm((prev) => ({ ...prev, [name]: formatted }));
  };

  const handlePhotos = (e) => {
    const selected = Array.from(e.target.files || []);
    let oversized = 0;
    setPhotos((prev) => {
      const result = mergeSitePhotoFiles(prev, selected);
      oversized = result.oversized;
      return result.photos;
    });
    if (oversized > 0) {
      toast.error(`Each image must be 4MB or less (${oversized} file(s) skipped)`);
    }
    e.target.value = '';
  };

  const getCommentItems = (f) => {
    const items = [];
    const numApps = f.num_applicants || '2';
    
    const replaceBoth = (str) => {
      if (numApps === '1') {
        return str
          .replace(/BOTH APPLICANT'S/g, "APPLICANT'S")
          .replace(/BOTH APPLICANTS'/g, "APPLICANT'S")
          .replace(/BOTH APPLICANTS/g, "APPLICANT")
          .replace(/BOTH APPLICANT/g, "APPLICANT");
      } else if (numApps === '3') {
        return str
          .replace(/BOTH APPLICANT'S/g, "THREE APPLICANTS'")
          .replace(/BOTH APPLICANTS'/g, "THREE APPLICANTS'")
          .replace(/BOTH APPLICANTS/g, "THREE APPLICANTS")
          .replace(/BOTH APPLICANT/g, "THREE APPLICANTS");
      }
      return str;
    };

    if (f.house_type) {
      items.push(replaceBoth(`BOTH APPLICANT'S HOUSE TYPE : ${f.house_type}`));
    }
    if (f.flat_ownership) {
      items.push(replaceBoth(`BOTH APPLICANT'S GIVEN FLAT OWNERSHIP: ${f.flat_ownership}`));
    }
    if (f.duration_of_stay) {
      items.push(replaceBoth(`BOTH APPLICANT'S DURATION OF STAY AT GIVEN ADDRESS : ${f.duration_of_stay}`));
    }
    if (f.total_family_members) {
      items.push(replaceBoth(`BOTH APPLICANT'S TOTAL FAMILY MEMBERS : ${f.total_family_members}`));
    }
    if (numApps === '1') {
      if (f.dependents_applicant) {
        items.push(`NUMBER OF DEPENDENTS : APPLICANT : ${f.dependents_applicant || ''}`);
      }
    } else if (numApps === '3') {
      if (f.dependents_applicant || f.dependents_co_applicant || f.dependents_co_applicant_2) {
        items.push(`NUMBER OF DEPENDENTS : APPLICANT : ${f.dependents_applicant || ''}`);
        items.push(`CO-APPLICANT 1 : ${f.dependents_co_applicant || ''}`);
        items.push(`CO-APPLICANT 2 : ${f.dependents_co_applicant_2 || ''}`);
      }
    } else { // '2'
      if (f.dependents_applicant || f.dependents_co_applicant) {
        items.push(`NUMBER OF DEPENDENTS : APPLICANT : ${f.dependents_applicant || ''}`);
        items.push(`CO-APPLICANT : ${f.dependents_co_applicant || ''}`);
      }
    }
    if (f.document_status) {
      items.push(replaceBoth(f.document_status));
    }
    if (f.residence_confirmation || f.residence_note) {
      let combined = '';
      if (f.residence_confirmation) {
        combined += `RESIDENCE CONFIRMATION: ${replaceBoth(f.residence_confirmation)}`;
      }
      if (f.residence_note) {
        if (combined) combined += ', ';
        combined += `NOTE: ${replaceBoth(f.residence_note)}`;
      }
      items.push(combined);
    }
    return items;
  };

  const fillTestData = () => {
    const base = isBusinessTemplate ? getSbiBussinessTestData(user) : getSbiHouseTestData(user);
    setForm({
      ...base,
      house_type: 'RESIDENTIAL HOUSE',
      flat_ownership: 'Rented',
      duration_of_stay: '7 years',
      total_family_members: '4',
      dependents_applicant: '2',
      dependents_co_applicant: '0',
      document_status: 'GIVEN DOCUMENTS WERE CHECKED, STANDARD OF LIVING IS SATISFACTORY,',
      residence_confirmation: "BOTH APPLICANT'S STAY CONFIRMED BY RAMANA (BOTH APPLICANT'S-NEIGHBOUR)",
      residence_note: "WE TOOK BOTH APPLICANT'S AADHAAR CARDS AS A SUPPORTING DOCUMENT FOR BOTH APPLICANT'S GIVEN RESIDENTIAL ADDRESS CONFIRMATION,AND SAME ARE ATTACHED.",
      verified_by: user?.verified_by || 'M.Suresh Babu',
      firm_contact: user?.firm_contact || '9014221011, 9491349091, 0866-6551011, 6464786',
      executive_name: user?.name || 'M.Suresh Babu',
      executive_mobile: user?.phone || '9703960940'
    });
    toast.success('Test data filled');
  };
 
  const handleLoadPredefined = (val) => {
    if (val === 'opt1') {
      setForm((prev) => ({
        ...prev,
        field_executive_intro: 'VISITED THE GIVEN ADDRESS AND MET ',
        house_type: 'RESIDENTIAL HOUSE',
        flat_ownership: 'Rented',
        duration_of_stay: '7 years',
        total_family_members: '4',
        dependents_applicant: '2',
        dependents_co_applicant: '0',
        document_status: 'GIVEN DOCUMENTS WERE CHECKED, STANDARD OF LIVING IS SATISFACTORY,',
        residence_confirmation: '',
        residence_note: 'WE TOOK  APPLICANT GAS BILL AS A SUPPORTING DOCUMENT FOR  APPLICANT GIVEN RESIDENTIAL ADDRESS CONFIRMATION, AND WE TOOK APPLICANT AADHAAR CARD, SAME ARE ATTACHED. AADHAAR       '
      }));
      toast.success('Loaded Predefined Wording 1 (Met Others)');
    } else if (val === 'opt2') {
      setForm((prev) => ({
        ...prev,
        field_executive_intro: 'VISITED THE GIVEN ADDRESS, AND MET MRS.DURGA (APPLICANT-SISTER IN LAW), AND WE ASKED BOTH APPLICANT’S STAY CONFIRMATION AT GIVEN ADDRESS, SHE SAID THAT THE GIVEN RESIDENTIAL HOUSE WAS THE JOINT PROPERTY OF BOTH APPLICANTS, AND DUE TO THE HOUSE BEING UNDER RENOVATION, BOTH APPLICANTS ARE CURRENTLY STAYING AT ANOTHER ADDRESS, AND WE CONTACTED THE APPLICANT AND ASKED FOR BOTH APPLICANTS’ CURRENT RESIDENTIAL ADDRESS. HE PROVIDED THE CURRENT ADDRESS, AND WE VISITED THAT ADDRESS AND MET THE CO-APPLICANT.',
        person_contacted: 'MRS.DURGA',
        relationship: 'APPLICANT-SISTER IN LAW',
        house_type: 'RESIDENTIAL HOUSE',
        flat_ownership: 'Rented',
        duration_of_stay: '7 years',
        total_family_members: '4',
        dependents_applicant: '2',
        dependents_co_applicant: '0',
        document_status: 'GIVEN DOCUMENTS WERE CHECKED, STANDARD OF LIVING IS SATISFACTORY,',
        residence_confirmation: '',
        residence_note: 'DUE TO NON-AVAILABILITY OF BOTH APPLICANTS’ CURRENT RESIDENTIAL ADDRESS PROOF, WE OBTAINED THE ELECTRICITY BILL, WHICH IS IN THE NAME OF TIRUPATHI RAO (CO-APPLICANT’S FATHER), WHO IS THE OWNER OF THE GIVEN RESIDENTIAL HOUSE, AS A SUPPORTING DOCUMENT FOR CONFIRMATION OF BOTH  APPLICANTS’ CURRENT RESIDENTIAL ADDRESS. WE ALSO OBTAINED BOTH APPLICANTS’ AADHAAR CARDS, AND THE SAME ARE ATTACHED.'
      }));
      toast.success('Loaded Predefined Wording 2 (Address Change)');
    }
  };

  const handleOptimizeIntro = async () => {
    const raw = form.field_executive_intro || '';
    if (!raw.trim()) {
      toast.error('Opening line is required');
      return;
    }

    setOptimizingIntro(true);
    try {
      const res = await executiveAPI.optimizeText({ text: raw });
      const optimizedText = res?.optimizedText || '';
      if (!optimizedText.trim()) {
        toast.error('Optimization returned empty result');
        return;
      }
      setIntroOptimizedPreview(optimizedText);
      setShowIntroPreview(true);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to optimize text');
    } finally {
      setOptimizingIntro(false);
    }
  };

  const handleApplyOptimizedIntro = () => {
    const sanitized = (introOptimizedPreview || '').replace(/\r?\n|\r/g, '');
    setForm((prev) => ({ ...prev, field_executive_intro: sanitized }));
    setShowIntroPreview(false);
    setIntroOptimizedPreview('');
  };

  const handleCancelOptimizedIntro = () => {
    setShowIntroPreview(false);
    setIntroOptimizedPreview('');
  };

  const handleOptimizeNote = async () => {
    const raw = form.residence_note || '';
    if (!raw.trim()) {
      toast.error('Note is required');
      return;
    }

    setOptimizingNote(true);
    try {
      const res = await executiveAPI.optimizeText({ text: raw });
      const optimizedText = res?.optimizedText || '';
      if (!optimizedText.trim()) {
        toast.error('Optimization returned empty result');
        return;
      }
      setNoteOptimizedPreview(optimizedText);
      setShowNotePreview(true);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to optimize text');
    } finally {
      setOptimizingNote(false);
    }
  };

  const handleApplyOptimizedNote = () => {
    setForm((prev) => ({ ...prev, residence_note: noteOptimizedPreview }));
    setShowNotePreview(false);
    setNoteOptimizedPreview('');
  };

  const handleCancelOptimizedNote = () => {
    setShowNotePreview(false);
    setNoteOptimizedPreview('');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.applicant_name?.trim()) {
      toast.error('Applicant name is required');
      return;
    }
    if (
      form.accommodation_type === ACCOMMODATION_OTHER_VALUE &&
      !form.accommodation_type_other?.trim()
    ) {
      toast.error('Please specify the accommodation type');
      return;
    }
    if (/\r?\n/.test(form.field_executive_intro || '')) {
      toast.error('Opening line must not contain newlines');
      return;
    }
    if (/\r?\n/.test(form.residence_note || '')) {
      toast.error('Note must not contain newlines');
      return;
    }
    setGenerating(true);
    try {
      let finalPhotos = photos;
      let formToSend = {
        ...form,
        field_executive_comment_items: isBusinessTemplate ? form.field_executive_comment_items : getCommentItems(form)
      };

      if (templateId === 'sbi-house') {
        finalPhotos = [
          ...sectionPhotos.status,
          ...sectionPhotos.gas_bill,
          ...sectionPhotos.aadhar_card,
          ...sectionPhotos.electricity_bill,
          ...sectionPhotos.landline_bill,
          ...sectionPhotos.internet_bill,
          ...sectionPhotos.license,
          ...sectionPhotos.bank_statements,
          ...sectionPhotos.ration_card
        ];

        formToSend = {
          ...formToSend,
          status_photo_count: sectionPhotos.status.length,
          gas_bill_photo_count: sectionPhotos.gas_bill.length,
          aadhar_card_photo_count: sectionPhotos.aadhar_card.length,
          electricity_bill_photo_count: sectionPhotos.electricity_bill.length,
          landline_bill_photo_count: sectionPhotos.landline_bill.length,
          internet_bill_photo_count: sectionPhotos.internet_bill.length,
          license_photo_count: sectionPhotos.license.length,
          bank_statements_photo_count: sectionPhotos.bank_statements.length,
          ration_card_photo_count: sectionPhotos.ration_card.length
        };
      }

      const res = await executiveAPI.generateExecutiveReport(templateId, formToSend, finalPhotos);
      setLastGenerated(res?.data);
      toast.success('Report submitted for admin approval');
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report) => {
    try {
      await executiveAPI.downloadReport(report.id, report.fileName);
    } catch {
      toast.error('Download failed');
    }
  };

  const templateTitles = {
    'sbi-house': 'SBI House Verification',
    'sbi-office': 'SBI Office Verification',
    'sbi-bussiness': 'SBI Business Verification'
  };
  const titleText = templateTitles[templateId] || 'SBI Verification';

  return (
    <ExecutiveFormShell
      title={titleText}
      subtitle="Fill in the details below to generate a field verification report PDF."
      testDataButton={
        <Button type="button" variant="outline" onClick={fillTestData}>
          <FlaskConical className="w-4 h-4 mr-2 inline" />
          Fill test data
        </Button>
      }
    >
      <ExecutiveFormCard onSubmit={handleGenerate}>
        <FormLogosHeader caLogoUrl={caLogoUrl} sbiLogoUrl={sbiLogoUrl} />
        <DraftStatusBanner draftId={draftId} loadingDraft={loadingDraft} />

        {!isBusinessTemplate && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-purple-900 font-medium">
              ⚡ Quick Fill: Load most used house verification wordings:
            </div>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val) handleLoadPredefined(val);
                e.target.value = '';
              }}
              className="px-3 py-2 border border-purple-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent text-purple-900 font-medium cursor-pointer"
              aria-label="Load Predefined Wording"
            >
              <option value="">-- Select Wording Option --</option>
              <option value="opt1">1. Met Others</option>
              <option value="opt2">2. Address Change</option>
            </select>
          </div>
        )}

        <ExecutiveFormBody>
          {!isBusinessTemplate && (
            <FormSection title="Report Reference">
              <FormFieldGrid>
                {templateId === 'sbi-house' && (
                  <div className="md:col-span-2 mb-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                    <label className="block text-sm font-semibold text-purple-900 mb-2">
                      Number of Applicants
                    </label>
                    <div className="flex gap-6">
                      {['1', '2', '3'].map((num) => (
                        <label key={num} className="inline-flex items-center cursor-pointer select-none">
                          <input
                            type="radio"
                            name="num_applicants"
                            value={num}
                            checked={(form.num_applicants || '2') === num}
                            onChange={handleChange}
                            className="form-radio text-[#7e22ce] focus:ring-[#7e22ce] h-4 w-4 border-gray-300 transition-all cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-700 font-medium">
                            {num} {num === '1' ? 'Applicant' : 'Applicants'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <Input
                  type="date"
                  label="Date of receipt"
                  name="receipt_date"
                  value={convertToYyyyMmDd(form.receipt_date)}
                  onChange={handleDateChange}
                  required
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  type="date"
                  label="Date of report"
                  name="report_date"
                  value={convertToYyyyMmDd(form.report_date)}
                  onChange={handleDateChange}
                  required
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="RLMS number"
                  name="rlms_number"
                  value={form.rlms_number}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Report ID"
                  name="report_id"
                  value={form.report_id}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Branch Name"
                  name="branch_name"
                  value={form.branch_name}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
              </FormFieldGrid>
            </FormSection>
          )}

          {isBusinessTemplate && (
            <FormSection title="Report Reference">
              <FormFieldGrid>
                <Input
                  type="date"
                  label="Date of report"
                  name="report_date"
                  value={convertToYyyyMmDd(form.report_date)}
                  onChange={handleDateChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="RLMS number"
                  name="rlms_number"
                  value={form.rlms_number}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
              </FormFieldGrid>
            </FormSection>
          )}

          <FormSection title="Applicant Details">
            <Input
              label="Applicant name"
              name="applicant_name"
              value={form.applicant_name}
              onChange={handleChange}
              required
              className="mb-0"
              inputClassName={EXECUTIVE_INPUT_CLASS}
            />
            {isBusinessTemplate ? (
              <Input
                label="Ph no"
                name="applicant_phone"
                value={form.applicant_phone}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
            ) : (
              <>
                {(form.num_applicants === '2' || !form.num_applicants) && (
                  <FormFieldGrid cols={1}>
                    <Input
                      label="Co-applicant name"
                      name="co_applicant_name"
                      value={form.co_applicant_name}
                      onChange={handleChange}
                      className="mb-0"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                  </FormFieldGrid>
                )}
                {form.num_applicants === '3' && (
                  <FormFieldGrid cols={2}>
                    <Input
                      label="Co-applicant 1 name"
                      name="co_applicant_name"
                      value={form.co_applicant_name}
                      onChange={handleChange}
                      className="mb-0"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                    <Input
                      label="Co-applicant 2 name"
                      name="co_applicant_2_name"
                      value={form.co_applicant_2_name}
                      onChange={handleChange}
                      className="mb-0"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                  </FormFieldGrid>
                )}
              </>
            )}
            <FormTextarea label="Address" name="address" value={form.address} onChange={handleChange} rows={2} className="mb-0" />
          </FormSection>

          {isBusinessTemplate && (
            <FormSection title="Verifier's Observation">
              <Input
                label="Name of the premises"
                name="premises_name"
                value={form.premises_name}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <FormFieldGrid>
                <Input
                  label="Describe the building"
                  name="building_description"
                  value={form.building_description}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Premises owned / rented"
                  name="premises_owned_rented"
                  value={form.premises_owned_rented}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Observed staff seen"
                  name="observed_staff_seen"
                  value={form.observed_staff_seen}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Total staff"
                  name="total_staff"
                  value={form.total_staff}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
              </FormFieldGrid>
            </FormSection>
          )}

          {!skipObservationSections && (
            <>
              <FormSection title="Verifier's Observation">
                <FormFieldGrid>
                  <SelectGroup
                    label="Locality / surrounding"
                    name="locality_surrounding"
                    options={LOCALITY_OPTIONS}
                    value={form.locality_surrounding}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Accessibility"
                    name="accessibility"
                    options={ACCESSIBILITY_OPTIONS}
                    value={form.accessibility}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Is the entrance motorable?"
                    name="entrance_motorable"
                    options={YES_NO_OPTIONS}
                    value={form.entrance_motorable}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Is the address confirmed?"
                    name="address_confirmed"
                    options={YES_NO_OPTIONS}
                    value={form.address_confirmed}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Type of accommodation"
                    name="accommodation_type"
                    options={ACCOMMODATION_OPTIONS}
                    value={form.accommodation_type}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  {form.accommodation_type === ACCOMMODATION_OTHER_VALUE && (
                    <Input
                      label="Specify accommodation type"
                      name="accommodation_type_other"
                      value={form.accommodation_type_other}
                      onChange={handleChange}
                      required
                      placeholder="Enter accommodation type"
                      className="mb-0 md:col-span-2"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Pin code"
                      name="pin_code"
                      value={form.pin_code}
                      onChange={handleChange}
                      className="mb-0"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                    <Input
                      label="Landmark"
                      name="landmark"
                      value={form.landmark}
                      onChange={handleChange}
                      className="mb-0"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                  </div>
                </FormFieldGrid>
              </FormSection>

              <FormSection title="Firm Footer (PDF)">
                <FormFieldGrid>
                  <Input
                    label="Supervised by"
                    name="supervised_by"
                    value={form.supervised_by}
                    onChange={handleChange}
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                  <Input
                    label="Verified by"
                    name="verified_by"
                    value={form.verified_by}
                    onChange={handleChange}
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                  <Input
                    label="Contact numbers"
                    name="firm_contact"
                    value={form.firm_contact}
                    onChange={handleChange}
                    className="mb-0 md:col-span-2"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                </FormFieldGrid>
              </FormSection>

              <FormSection title="Residence">
                <FormFieldGrid>
                  <Input
                    label="No of stairs / floors"
                    name="floors"
                    value={form.floors}
                    onChange={handleChange}
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                  <SelectGroup
                    label="Watchman"
                    name="watchman"
                    options={YES_NO_OPTIONS}
                    value={form.watchman}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Lift"
                    name="lift"
                    options={YES_NO_OPTIONS}
                    value={form.lift}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Applicant name outside door/gate"
                    name="name_outside"
                    options={YES_NO_OPTIONS}
                    value={form.name_outside}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  <SelectGroup
                    label="External appearance of building"
                    name="appearance"
                    options={APPEARANCE_OPTIONS}
                    value={form.appearance}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Entry into residence permitted"
                    name="entry_permitted"
                    options={ENTRY_PERMITTED_OPTIONS}
                    value={form.entry_permitted}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  <Input
                    label="Person contacted"
                    name="person_contacted"
                    value={form.person_contacted}
                    onChange={handleChange}
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                  <Input
                    label="Relationship"
                    name="relationship"
                    value={form.relationship}
                    onChange={handleChange}
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                </FormFieldGrid>
              </FormSection>

              <FormSection title="Neighbourhood Check">
                <FormFieldGrid>
                  <SelectGroup
                    label="Neighbors verification"
                    name="neighbour_verification"
                    options={NEIGHBOUR_OPTIONS}
                    value={form.neighbour_verification}
                    onChange={handleChange}
                    required
                    className="mb-0"
                  />
                  <div className="flex items-center min-h-[44px]">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.status_positive}
                        onChange={(e) => setForm((prev) => ({ ...prev, status_positive: e.target.checked }))}
                        className="rounded text-[#7e22ce] focus:ring-[#7e22ce] w-5 h-5 border-gray-300"
                      />
                      <span className="text-sm font-semibold text-gray-700">Tick mark</span>
                    </label>
                  </div>
                </FormFieldGrid>
                <FormTextarea
                  label="Comments"
                  name="neighbour_comments"
                  value={form.neighbour_comments}
                  onChange={handleChange}
                  rows={2}
                  className="mb-0"
                />
              </FormSection>
            </>
          )}

          {skipObservationSections && (
            <FormSection title="Verification status">
              <div className="flex items-center min-h-[44px]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.status_positive}
                    onChange={(e) => setForm((prev) => ({ ...prev, status_positive: e.target.checked }))}
                    className="rounded text-[#7e22ce] focus:ring-[#7e22ce] w-5 h-5 border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">Tick mark</span>
                </label>
              </div>
            </FormSection>
          )}

          {!isBusinessTemplate && (
            <FormSection title="Personal Details">
              <FormFieldGrid>
                <Input
                  label="Applicant mobile"
                  name="applicant_mobile"
                  value={form.applicant_mobile}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                {(form.num_applicants === '2' || !form.num_applicants) && (
                  <Input
                    label="Co-applicant mobile"
                    name="co_applicant_mobile"
                    value={form.co_applicant_mobile}
                    onChange={handleChange}
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                )}
                {form.num_applicants === '3' && (
                  <>
                    <Input
                      label="Co-applicant 1 mobile"
                      name="co_applicant_mobile"
                      value={form.co_applicant_mobile}
                      onChange={handleChange}
                      className="mb-0"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                    <Input
                      label="Co-applicant 2 mobile"
                      name="co_applicant_2_mobile"
                      value={form.co_applicant_2_mobile}
                      onChange={handleChange}
                      className="mb-0"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                  </>
                )}
              </FormFieldGrid>
            </FormSection>
          )}

          <FormSection title="Field Executive Comments">
            <FormTextarea
              label="Opening line"
              name="field_executive_intro"
              value={form.field_executive_intro}
              onChange={handleChange}
              rows={2}
              className="mb-0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
            <div className="mt-3 flex items-center gap-3">
              <Button type="button" variant="outline" disabled={optimizingIntro} onClick={handleOptimizeIntro}>
                {optimizingIntro ? 'Optimizing…' : 'Optimize'}
              </Button>
            </div>

            {showIntroPreview && (
              <div className="mt-4">
                <FormTextarea
                  label="Optimized preview"
                  name="intro_preview"
                  value={introOptimizedPreview}
                  readOnly
                  rows={3}
                  className="mb-0"
                />
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <Button type="button" variant="secondary" onClick={handleApplyOptimizedIntro}>
                    Apply
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelOptimizedIntro}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isBusinessTemplate ? (
              <FormFieldGrid>
                <Input
                  label="Applicant business name"
                  name="business_name"
                  value={form.business_name}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Applicant designation"
                  name="applicant_designation"
                  value={form.applicant_designation}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Nature of business"
                  name="nature_of_business"
                  value={form.nature_of_business}
                  onChange={handleChange}
                  className="mb-0 md:col-span-2"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Nature of business (detail)"
                    name="nature_of_business_detail"
                    value={form.nature_of_business_detail}
                    onChange={handleChange}
                    rows={3}
                    className="mb-0"
                  />
                </div>
                <Input
                  label="Business experience"
                  name="business_experience"
                  value={form.business_experience}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Business activities seen"
                  name="business_activities_seen"
                  value={form.business_activities_seen}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Business name board seen"
                  name="business_name_board_seen"
                  value={form.business_name_board_seen}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Turnover declared"
                  name="turnover_declared"
                  value={form.turnover_declared}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Business transaction account"
                  name="business_transaction_account"
                  value={form.business_transaction_account}
                  onChange={handleChange}
                  className="mb-0 md:col-span-2"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Activity confirmed by"
                  name="activity_confirmed_by"
                  value={form.activity_confirmed_by}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <Input
                  label="Relationship"
                  name="activity_confirmed_relationship"
                  value={form.activity_confirmed_relationship}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Note (GST / supporting documents)"
                    name="business_note"
                    value={form.business_note}
                    onChange={handleChange}
                    rows={4}
                    className="mb-0"
                  />
                </div>
              </FormFieldGrid>
            ) : (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-4">House &amp; Household Comments</h4>
                <FormFieldGrid>
                  <SelectGroup
                    label="House Type"
                    name="house_type"
                    options={displayHouseTypeOptions}
                    value={form.house_type}
                    onChange={handleChange}
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Flat Ownership"
                    name="flat_ownership"
                    options={FLAT_OWNERSHIP_OPTIONS}
                    value={form.flat_ownership}
                    onChange={handleChange}
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Duration of Stay"
                    name="duration_of_stay"
                    options={DURATION_OF_STAY_OPTIONS}
                    value={form.duration_of_stay}
                    onChange={handleChange}
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Total Family Members"
                    name="total_family_members"
                    options={FAMILY_MEMBERS_OPTIONS}
                    value={form.total_family_members}
                    onChange={handleChange}
                    className="mb-0"
                  />
                  <SelectGroup
                    label="Dependents: Applicant"
                    name="dependents_applicant"
                    options={DEPENDENTS_OPTIONS}
                    value={form.dependents_applicant}
                    onChange={handleChange}
                    className="mb-0"
                  />
                  {(form.num_applicants === '2' || !form.num_applicants) && (
                    <SelectGroup
                      label="Dependents: Co-Applicant"
                      name="dependents_co_applicant"
                      options={DEPENDENTS_OPTIONS}
                      value={form.dependents_co_applicant}
                      onChange={handleChange}
                      className="mb-0"
                    />
                  )}
                  {form.num_applicants === '3' && (
                    <>
                      <SelectGroup
                        label="Dependents: Co-Applicant 1"
                        name="dependents_co_applicant"
                        options={DEPENDENTS_OPTIONS}
                        value={form.dependents_co_applicant}
                        onChange={handleChange}
                        className="mb-0"
                      />
                      <SelectGroup
                        label="Dependents: Co-Applicant 2"
                        name="dependents_co_applicant_2"
                        options={DEPENDENTS_OPTIONS}
                        value={form.dependents_co_applicant_2}
                        onChange={handleChange}
                        className="mb-0"
                      />
                    </>
                  )}
                  <div className="md:col-span-2">
                    <Input
                      label="Document Status"
                      name="document_status"
                      value={form.document_status}
                      onChange={handleChange}
                      placeholder="e.g. GIVEN DOCUMENTS WERE CHECKED, STANDARD OF LIVING IS SATISFACTORY,"
                      className="mb-0"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FormTextarea
                      label="Residence Confirmation"
                      name="residence_confirmation"
                      value={form.residence_confirmation}
                      onChange={handleChange}
                      placeholder="e.g. BOTH APPLICANT'S STAY CONFIRMED BY RAMANA (BOTH APPLICANT'S-NEIGHBOUR)"
                      rows={2}
                      className="mb-0"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FormTextarea
                      label="Note"
                      name="residence_note"
                      value={form.residence_note}
                      onChange={handleChange}
                      placeholder="e.g. WE TOOK BOTH APPLICANT'S AADHAAR CARDS AS A SUPPORTING DOCUMENT..."
                      rows={2}
                      className="mb-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                        }
                      }}
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <Button type="button" variant="outline" disabled={optimizingNote} onClick={handleOptimizeNote}>
                        {optimizingNote ? 'Optimizing…' : 'Optimize'}
                      </Button>
                    </div>

                    {showNotePreview && (
                      <div className="mt-4">
                        <FormTextarea
                          label="Optimized preview"
                          name="note_preview"
                          value={noteOptimizedPreview}
                          readOnly
                          rows={3}
                          className="mb-0"
                        />
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <Button type="button" variant="secondary" onClick={handleApplyOptimizedNote}>
                            Apply
                          </Button>
                          <Button type="button" variant="outline" onClick={handleCancelOptimizedNote}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </FormFieldGrid>
              </div>
            )}
          </FormSection>

          <FormSection title="Field Executive Details">
            <FormFieldGrid>
              <Input
                label="Field executive name"
                name="executive_name"
                value={form.executive_name}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="Field executive mobile"
                name="executive_mobile"
                value={form.executive_mobile}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
            </FormFieldGrid>
          </FormSection>

          {templateId === 'sbi-house' ? (
            <FormSection title="Document Attachments">
              <div className="flex flex-col gap-4">
                <ImageSectionUpload
                  title="Status Images"
                  maxPhotos={2}
                  photos={sectionPhotos.status}
                  onPhotosChange={handleSectionPhotos('status', 2)}
                  onRemovePhoto={(idx) => handleRemoveSectionPhoto('status', idx)}
                />
                <ImageSectionUpload
                  title="Gas Bill"
                  maxPhotos={3}
                  photos={sectionPhotos.gas_bill}
                  onPhotosChange={handleSectionPhotos('gas_bill', 3)}
                  onRemovePhoto={(idx) => handleRemoveSectionPhoto('gas_bill', idx)}
                />
                <ImageSectionUpload
                  title="Aadhar Card"
                  maxPhotos={3}
                  photos={sectionPhotos.aadhar_card}
                  onPhotosChange={handleSectionPhotos('aadhar_card', 3)}
                  onRemovePhoto={(idx) => handleRemoveSectionPhoto('aadhar_card', idx)}
                />
                <ImageSectionUpload
                  title="Electricity Bill"
                  maxPhotos={3}
                  photos={sectionPhotos.electricity_bill}
                  onPhotosChange={handleSectionPhotos('electricity_bill', 3)}
                  onRemovePhoto={(idx) => handleRemoveSectionPhoto('electricity_bill', idx)}
                />
                <ImageSectionUpload
                  title="Landline Bill"
                  maxPhotos={3}
                  photos={sectionPhotos.landline_bill}
                  onPhotosChange={handleSectionPhotos('landline_bill', 3)}
                  onRemovePhoto={(idx) => handleRemoveSectionPhoto('landline_bill', idx)}
                />
                <ImageSectionUpload
                  title="Internet Bill"
                  maxPhotos={3}
                  photos={sectionPhotos.internet_bill}
                  onPhotosChange={handleSectionPhotos('internet_bill', 3)}
                  onRemovePhoto={(idx) => handleRemoveSectionPhoto('internet_bill', idx)}
                />
                <ImageSectionUpload
                  title="License"
                  maxPhotos={3}
                  photos={sectionPhotos.license}
                  onPhotosChange={handleSectionPhotos('license', 3)}
                  onRemovePhoto={(idx) => handleRemoveSectionPhoto('license', idx)}
                />
                <ImageSectionUpload
                  title="Bank Statements"
                  maxPhotos={3}
                  photos={sectionPhotos.bank_statements}
                  onPhotosChange={handleSectionPhotos('bank_statements', 3)}
                  onRemovePhoto={(idx) => handleRemoveSectionPhoto('bank_statements', idx)}
                />
                <ImageSectionUpload
                  title="Ration Card"
                  maxPhotos={3}
                  photos={sectionPhotos.ration_card}
                  onPhotosChange={handleSectionPhotos('ration_card', 3)}
                  onRemovePhoto={(idx) => handleRemoveSectionPhoto('ration_card', idx)}
                />
              </div>
            </FormSection>
          ) : (
            <SitePhotosSection
              photos={photos}
              onPhotosChange={handlePhotos}
              onRemovePhoto={(idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
            />
          )}

          <StickyFormActions
            generating={generating}
            lastGenerated={lastGenerated}
            onDownload={handleDownload}
            onSaveDraft={() => {
              let totalPhotoCount = photos.length;
              let formToSend = {
                ...form,
                field_executive_comment_items: isBusinessTemplate ? form.field_executive_comment_items : getCommentItems(form)
              };

              if (templateId === 'sbi-house') {
                totalPhotoCount = Object.values(sectionPhotos).reduce((acc, curr) => acc + curr.length, 0);
                formToSend = {
                  ...formToSend,
                  status_photo_count: sectionPhotos.status.length,
                  gas_bill_photo_count: sectionPhotos.gas_bill.length,
                  aadhar_card_photo_count: sectionPhotos.aadhar_card.length,
                  electricity_bill_photo_count: sectionPhotos.electricity_bill.length,
                  landline_bill_photo_count: sectionPhotos.landline_bill.length,
                  internet_bill_photo_count: sectionPhotos.internet_bill.length,
                  license_photo_count: sectionPhotos.license.length,
                  bank_statements_photo_count: sectionPhotos.bank_statements.length,
                  ration_card_photo_count: sectionPhotos.ration_card.length
                };
              }

              saveDraft(formToSend, totalPhotoCount);
            }}
            savingDraft={savingDraft}
            loadingDraft={loadingDraft}
          />
        </ExecutiveFormBody>
      </ExecutiveFormCard>
    </ExecutiveFormShell>
  );
};

function ImageSectionUpload({ title, maxPhotos, photos, onPhotosChange, onRemovePhoto }) {
  return (
    <div className="border border-purple-100 rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h4 className="text-sm font-bold text-purple-900">{title}</h4>
        <p className="text-[11px] text-gray-500 font-medium">Up to {maxPhotos} images allowed</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <label className="flex flex-col items-center justify-center min-h-[90px] w-full sm:w-48 border border-dashed border-purple-200 rounded-xl cursor-pointer bg-purple-50/10 hover:bg-purple-50/30 transition-all select-none">
          <Upload className="w-5 h-5 text-purple-500 mb-1" />
          <span className="text-[12px] font-semibold text-purple-800">
            {photos.length ? `${photos.length} selected` : 'Select photos'}
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple={maxPhotos > 1}
            className="hidden"
            onChange={onPhotosChange}
          />
        </label>
        
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 flex-1 justify-start w-full">
            {photos.map((file, idx) => (
              <div
                key={idx}
                className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-50 shrink-0"
              >
                <img src={URL.createObjectURL(file)} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(idx)}
                  className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SbiHouseVerificationForm;
