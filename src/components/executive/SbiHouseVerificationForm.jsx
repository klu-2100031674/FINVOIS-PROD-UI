import React, { useCallback, useState } from 'react';
import { FlaskConical } from 'lucide-react';
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

function emptyForm(user) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return {
    receipt_date: formatDdMmYyyy(yesterday),
    report_date: formatDdMmYyyy(today),
    rlms_number: '',
    reference_number: '',
    applicant_name: '',
    co_applicant_name: '',
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
    field_executive_intro: '',
    field_executive_comment_items: [],
    house_type: '',
    flat_ownership: '',
    duration_of_stay: '',
    total_family_members: '',
    dependents_applicant: '',
    dependents_co_applicant: '',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
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
    if (f.house_type) {
      items.push(`BOTH APPLICANT'S HOUSE TYPE : ${f.house_type}`);
    }
    if (f.flat_ownership) {
      items.push(`BOTH APPLICANT'S GIVEN FLAT OWNERSHIP: ${f.flat_ownership}`);
    }
    if (f.duration_of_stay) {
      items.push(`BOTH APPLICANT'S DURATION OF STAY AT GIVEN ADDRESS : ${f.duration_of_stay}`);
    }
    if (f.total_family_members) {
      items.push(`BOTH APPLICANT'S TOTAL FAMILY MEMBERS : ${f.total_family_members}`);
    }
    if (f.dependents_applicant || f.dependents_co_applicant) {
      items.push(`NUMBER OF DEPENDENTS : APPLICANT : ${f.dependents_applicant || ''}`);
      items.push(`CO-APPLICANT : ${f.dependents_co_applicant || ''}`);
    }
    if (f.document_status) {
      items.push(f.document_status);
    }
    if (f.residence_confirmation || f.residence_note) {
      let combined = '';
      if (f.residence_confirmation) {
        combined += `RESIDENCE CONFIRMATION: ${f.residence_confirmation}`;
      }
      if (f.residence_note) {
        if (combined) combined += ', ';
        combined += `NOTE: ${f.residence_note}`;
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
      flat_ownership: 'RENTED (6,500 PER MONTH)',
      duration_of_stay: '7 YEARS',
      total_family_members: '04',
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
        flat_ownership: 'RENTED (6,500 PER MONTH)',
        duration_of_stay: '7 YEARS',
        total_family_members: '04',
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
        flat_ownership: 'RENTED (6,500 PER MONTH)',
        duration_of_stay: '7 YEARS',
        total_family_members: '04',
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
    setForm((prev) => ({ ...prev, field_executive_intro: introOptimizedPreview }));
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
    setGenerating(true);
    try {
      const formToSend = {
        ...form,
        field_executive_comment_items: isBusinessTemplate ? form.field_executive_comment_items : getCommentItems(form)
      };
      const res = await executiveAPI.generateExecutiveReport(templateId, formToSend, photos);
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
                  label="Reference number"
                  name="reference_number"
                  value={form.reference_number}
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
                <Input
                  label="Co-applicant mobile"
                  name="co_applicant_mobile"
                  value={form.co_applicant_mobile}
                  onChange={handleChange}
                  className="mb-0"
                  inputClassName={EXECUTIVE_INPUT_CLASS}
                />
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
                  <Input
                    label="House Type"
                    name="house_type"
                    value={form.house_type}
                    onChange={handleChange}
                    placeholder="e.g. RESIDENTIAL HOUSE"
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                  <Input
                    label="Flat Ownership"
                    name="flat_ownership"
                    value={form.flat_ownership}
                    onChange={handleChange}
                    placeholder="e.g. RENTED (6,500 PER MONTH)"
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                  <Input
                    label="Duration of Stay"
                    name="duration_of_stay"
                    value={form.duration_of_stay}
                    onChange={handleChange}
                    placeholder="e.g. 7 YEARS"
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                  <Input
                    label="Total Family Members"
                    name="total_family_members"
                    value={form.total_family_members}
                    onChange={handleChange}
                    placeholder="e.g. 04"
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                  <Input
                    label="Dependents: Applicant"
                    name="dependents_applicant"
                    value={form.dependents_applicant}
                    onChange={handleChange}
                    placeholder="e.g. 2"
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
                  <Input
                    label="Dependents: Co-Applicant"
                    name="dependents_co_applicant"
                    value={form.dependents_co_applicant}
                    onChange={handleChange}
                    placeholder="e.g. 0"
                    className="mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                  />
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

          <SitePhotosSection
            photos={photos}
            onPhotosChange={handlePhotos}
            onRemovePhoto={(idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
          />

          <StickyFormActions
            generating={generating}
            lastGenerated={lastGenerated}
            onDownload={handleDownload}
            onSaveDraft={() => saveDraft({
              ...form,
              field_executive_comment_items: isBusinessTemplate ? form.field_executive_comment_items : getCommentItems(form)
            }, photos.length)}
            savingDraft={savingDraft}
            loadingDraft={loadingDraft}
          />
        </ExecutiveFormBody>
      </ExecutiveFormCard>
    </ExecutiveFormShell>
  );
};

export default SbiHouseVerificationForm;
