import React, { useCallback, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks';
import { useExecutiveDraft } from '../../hooks/useExecutiveDraft';
import { Input, Button } from '../common';
import { executiveAPI } from '../../api/executiveAPI';
import { getSbiOfficeTestData } from '../../utils/sbiOfficeTestData';
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
  YesNoSelect,
  VerificationStatusSection,
  FormLogosHeader,
  SitePhotosSection,
  StickyFormActions,
  DraftStatusBanner,
  useExecutiveFormBootstrap,
  EXECUTIVE_INPUT_CLASS,
  mergeSitePhotoFiles
} from './executiveFormShared';

const TEMPLATE_ID = 'sbi-office';

function emptyForm(user) {
  const today = new Date();
  return {
    report_date: formatDdMmYyyy(today),
    rlms_number: '',
    applicant_name: '',
    applicant_phone: '',
    address: '',
    applicant_designation: '',
    working_since: '',
    person_contacted: '',
    total_service: '',
    person_contact_is_applicant: 'yes',
    office_floor: 'Ground+1st Flr',
    field_executive_intro: 'VISITED THE GIVEN ADDRESS AND MET THE APPLICANT.',
    office_department: '',
    net_salary: '',
    salary_credited_bank: '',
    employment_confirmed_by: '',
    employment_confirmed_relationship: '',
    business_note: '',
    supervised_by: user?.supervised_by || 'MD.Khaja',
    verified_by: user?.verified_by || 'M.Suresh Babu',
    firm_contact: user?.firm_contact || '9014221011, 9491349091, 0866-6551011, 6464786',
    status_positive: true,
    verification_status: 'Positive',
    executive_name: user?.name || '',
    executive_mobile: user?.phone || ''
  };
}



const SbiOfficeVerificationForm = () => {
  const { user, getProfile } = useAuth();
  const [form, setForm] = useState(() => emptyForm(user));
  const [photos, setPhotos] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);
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

  const { draftId, savingDraft, loadingDraft, saveDraft } = useExecutiveDraft(TEMPLATE_ID, {
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

  const handleFloorDropdownChange = (e) => {
    const val = e.target.value;
    if (val === 'enter_floor') {
      setForm((prev) => ({ ...prev, office_floor: '5th Flr' }));
    } else {
      setForm((prev) => ({ ...prev, office_floor: val }));
    }
  };

  const handleCustomFloorChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, office_floor: val }));
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

  const fillTestData = () => {
    setForm({
      ...getSbiOfficeTestData(user),
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
        field_executive_intro: 'VISITED THE GIVEN ADDRESS AND MET THE APPLICANT,',
        employment_confirmed_relationship: `COLLEAGUE`,
        business_note: `WE TOOK APPLICANT EMPLOYEE ID AS A SUPPORTING DOCUMENT OF APPLICANT EMPLOYMENT CONFIRMATION IN NEXT GEN CBSE SCHOOL (RAVINDRA BHARATHIS EDUCATIONAL ACADEMY), AND SAME ARE ATTACHED.`
      }));
      toast.success('Loaded Predefined Wording 1');
    } else if (val === 'opt2') {
      setForm((prev) => ({
        ...prev,
        field_executive_intro: 'VISITED THE GIVEN ADDRESS AND MET MR. BHASKAR RAO (ACCOUNTS SECTION)',
        business_note: `.....`
      }));
      toast.success('Loaded Predefined Wording 2');
    } else if (val === 'opt3') {
      setForm((prev) => ({
        ...prev,
        field_executive_intro: 'VISITED THE GIVEN ADDRESS AND MET MR. SRINIVAS',
        business_note: `WE TOOK APPLICANT  APRIL 2026 PAYSLIP  AS A SUPPORTING DOCUMENT OF APPLICANT EMPLOYMENT CONFIRMATION IN BERGER PAINTS INDIA LIMITED,AND SAME ARE ATTACHED.`
      }));
      toast.success('Loaded Predefined Wording 3');
    }
  };

  const handleOptimizeBusinessNote = async () => {
    const raw = form.business_note || '';
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
    setForm((prev) => ({ ...prev, business_note: noteOptimizedPreview }));
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
    setGenerating(true);
    try {
      const res = await executiveAPI.generateExecutiveReport(TEMPLATE_ID, form, photos);
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

  return (
    <ExecutiveFormShell
      title="SBI Office Verification"
      subtitle="Fill in the details below to generate an office verification report PDF."
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

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-purple-900 font-medium">
            ⚡ Quick Fill: Load most used office verification wordings:
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
            <option value="opt1">1. Office Met the Applicant </option>
            <option value="opt2">2. Office Confirmed by Colleague </option>
            <option value="opt3">3. Office Confirmed by Colleague & Phone/House </option>
          </select>
        </div>

        <ExecutiveFormBody>
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
            <Input
              label="Ph no"
              name="applicant_phone"
              value={form.applicant_phone}
              onChange={handleChange}
              className="mb-0"
              inputClassName={EXECUTIVE_INPUT_CLASS}
            />
            <FormTextarea label="Address" name="address" value={form.address} onChange={handleChange} rows={2} className="mb-0" />
          </FormSection>

          <FormSection title="Verifier's Observation">
            <FormFieldGrid>
              <Input
                label="Designation"
                name="applicant_designation"
                value={form.applicant_designation}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="Working since"
                name="working_since"
                value={form.working_since}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="Person Contact"
                name="person_contacted"
                value={form.person_contacted}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="Net salary"
                name="net_salary"
                value={form.net_salary}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="Total service"
                name="total_service"
                value={form.total_service}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <YesNoSelect
                label="Person contacted is applicant"
                name="person_contact_is_applicant"
                value={form.person_contact_is_applicant}
                onChange={handleChange}
                className="mb-0"
              />
              <div className="flex flex-col mb-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Office Floor
                </label>
                <select
                  value={['gr_flr', '1st_flr', '2nd_flr'].includes(form.office_floor || '') ? form.office_floor : (form.office_floor ? 'enter_floor' : '')}
                  onChange={handleFloorDropdownChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7e22ce] focus:border-transparent text-sm bg-white text-gray-800"
                >
                  <option value="">-- Select Floor --</option>
                  <option value="gr_flr">Ground Floor</option>
                  <option value="1st_flr">1st Floor</option>
                  <option value="2nd_flr">2nd Floor</option>
                  <option value="enter_floor">Enter Floor</option>
                </select>
                {(!['gr_flr', '1st_flr', '2nd_flr'].includes(form.office_floor || '') && form.office_floor) && (
                  <Input
                    label="Specify Floor"
                    name="office_floor"
                    value={form.office_floor}
                    onChange={handleCustomFloorChange}
                    className="mt-2 mb-0"
                    inputClassName={EXECUTIVE_INPUT_CLASS}
                    placeholder="Enter floor"
                  />
                )}
              </div>
            </FormFieldGrid>
          </FormSection>

          <VerificationStatusSection
            form={form}
            onChange={handleChange}
            onStatusPositiveChange={(e) => setForm((prev) => ({ ...prev, status_positive: e.target.checked }))}
          />

          <FormSection title="Field Executive Comments">
            <FormTextarea
              label="Opening line"
              name="field_executive_intro"
              value={form.field_executive_intro}
              onChange={handleChange}
              rows={2}
              className="mb-0"
            />
            <FormFieldGrid>
              <Input
                label="Applicant designation"
                name="applicant_designation"
                value={form.applicant_designation}
                onChange={handleChange}
                className="mb-0 md:col-span-2"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <div className="md:col-span-2">
                <FormTextarea
                  label="Department / Section details"
                  name="office_department"
                  value={form.office_department}
                  onChange={handleChange}
                  rows={2}
                  className="mb-0"
                />
              </div>
              <Input
                label="Net salary"
                name="net_salary"
                value={form.net_salary}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="Salary bank"
                name="salary_credited_bank"
                value={form.salary_credited_bank}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="Employment confirmed by"
                name="employment_confirmed_by"
                value={form.employment_confirmed_by}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="Relationship"
                name="employment_confirmed_relationship"
                value={form.employment_confirmed_relationship}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <div className="md:col-span-2">
                <FormTextarea
                  label="Note"
                  name="business_note"
                  value={form.business_note}
                  onChange={handleChange}
                  rows={4}
                  className="mb-0"
                />
                <div className="mt-3 flex items-center gap-3">
                  <Button type="button" variant="outline" disabled={optimizingNote} onClick={handleOptimizeBusinessNote}>
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
                      rows={4}
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
            onSaveDraft={() => saveDraft(form, photos.length)}
            savingDraft={savingDraft}
            loadingDraft={loadingDraft}
          />
        </ExecutiveFormBody>
      </ExecutiveFormCard>
    </ExecutiveFormShell>
  );
};

export default SbiOfficeVerificationForm;
