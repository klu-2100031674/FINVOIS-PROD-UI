import React, { useCallback, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks';
import { useExecutiveDraft } from '../../hooks/useExecutiveDraft';
import { Input, Button } from '../common';
import { executiveAPI } from '../../api/executiveAPI';
import { getSbiBussinessTestData } from '../../utils/sbiBussinessTestData';
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
  VerificationStatusSection,
  FormLogosHeader,
  SitePhotosSection,
  StickyFormActions,
  DraftStatusBanner,
  useExecutiveFormBootstrap,
  EXECUTIVE_INPUT_CLASS,
  mergeSitePhotoFiles
} from './executiveFormShared';

const TEMPLATE_ID = 'sbi-bussiness';

function emptyForm(user) {
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
    verification_status: 'Positive',
    executive_name: user?.name || '',
    executive_mobile: user?.phone || ''
  };
}

const SbiBussinessVerificationForm = () => {
  const { user, getProfile } = useAuth();
  const [form, setForm] = useState(() => emptyForm(user));
  const [photos, setPhotos] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);
  const [optimizingDetail, setOptimizingDetail] = useState(false);
  const [detailOptimizedPreview, setDetailOptimizedPreview] = useState('');
  const [showDetailPreview, setShowDetailPreview] = useState(false);
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
    if (name === 'business_note') {
      const sanitized = value.replace(/\r?\n|\r/g, '').slice(0, 420);
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

  const fillTestData = () => {
    setForm({
      ...getSbiBussinessTestData(user),
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
        // activity_confirmed_by: 'APPLICANT',
        // activity_confirmed_relationship: 'SELF',
        business_note: 'WE SEARCHED THE GST NUMBER OF B V R JEWELLERS ON THE GST PORTAL TO CONFIRM THE CO-APPLICANT’S PROPRIETORSHIP, AS PER THE GST PORTAL RECORDS, THE CO-APPLICANT IS THE PROPRIETOR OF B V R JEWELLERS, FURTHER WE FOUND ANNUAL AGGREGATE TURNOVER OF B V R JEWELLERS UNDER THE ₹ 1.5 CRORE TO 5 CRORES SLAB AS PER THE GST PORTAL RECORDS, AND B V R JEWELLERS GST NUMBER  37AEFPC2727K1ZK IS FOUND TO BE ACTIVE, AND SAME ARE ATTACHED.'
      }));
      toast.success('Loaded Predefined Wording 1');
    } else if (val === 'opt2') {
      setForm((prev) => ({
        ...prev,
        field_executive_intro: 'VISITED THE GIVEN ADDRESS AND MET MR.MADHU SUDHAN TOSHNIWAL (CO-APPLICANT) AND WE ASKED ABOUT APPLICANT AND HIS BUSINESS DETAILS, HE SAID THAT APPLICANT IS HIS FATHER AND APPLICANT IS PROPRIETOR OF NR ENTERPRISES, AND WE ASKED APPLICANT BUSINESS DETAILS,',
        // activity_confirmed_by: 'MR.MADHU SUDHAN TOSHNIWAL',
        // activity_confirmed_relationship: 'CO-APPLICANT',
        business_note: 'WE SEARCHED THE GST NUMBER OF NR ENTERPRISES ON THE GST PORTAL TO CONFIRM THE APPLICANT’S PROPRIETORSHIP,AS PER THE GST PORTAL RECORDS, THE APPLICANT IS THE PROPRIETOR OF NR ENTERPRISES AND THE GST NUMBER 37ACAPT5209L1ZB IS FOUND TO BE ACTIVE, FURTHER WE FOUND ANNUAL AGGREGATE TURNOVER OF NR ENTERPRISES UNDER THE ₹ 5  TO ₹ 25 CRORES SLAB AS PER THE GST PORTAL RECORDS, AND SAME ARE ATTACHED.'
      }));
      toast.success('Loaded Predefined Wording 2');
    }
  };

  const handleOptimizeNatureOfBusinessDetail = async () => {
    const raw = form.nature_of_business_detail || '';
    if (!raw.trim()) {
      toast.error('Nature of business (detail) is required');
      return;
    }

    setOptimizingDetail(true);
    try {
      const res = await executiveAPI.optimizeText({ text: raw });
      const optimizedText = res?.optimizedText || '';
      if (!optimizedText.trim()) {
        toast.error('Optimization returned empty result');
        return;
      }
      setDetailOptimizedPreview(optimizedText);
      setShowDetailPreview(true);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to optimize text');
    } finally {
      setOptimizingDetail(false);
    }
  };

  const handleApplyOptimizedDetail = () => {
    setForm((prev) => ({ ...prev, nature_of_business_detail: detailOptimizedPreview }));
    setShowDetailPreview(false);
    setDetailOptimizedPreview('');
  };

  const handleCancelOptimizedDetail = () => {
    setShowDetailPreview(false);
    setDetailOptimizedPreview('');
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
    if ((form.business_note || '').length > 420) {
      toast.error('Note (GST / supporting documents) should be a maximum of 420 characters');
      return;
    }
    if (/\r?\n/.test(form.business_note || '')) {
      toast.error('Note (GST / supporting documents) must not contain newlines');
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
      title="SBI Business Verification"
      subtitle="Fill in the details below to generate a business verification report PDF."
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
            ⚡ Quick Fill: Load most used business verification wordings:
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
            <option value="opt1">1. Met the Applicant</option>
            <option value="opt2">2. Applicant Business Confirmed by Others</option>
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
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={optimizingDetail}
                    onClick={handleOptimizeNatureOfBusinessDetail}
                  >
                    {optimizingDetail ? 'Optimizing…' : 'Optimize'}
                  </Button>
                </div>

                {showDetailPreview && (
                  <div className="mt-4">
                    <FormTextarea
                      label="Optimized preview"
                      name="detail_preview"
                      value={detailOptimizedPreview}
                      readOnly
                      rows={4}
                      className="mb-0"
                    />
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <Button type="button" variant="secondary" onClick={handleApplyOptimizedDetail}>
                        Apply
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelOptimizedDetail}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
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
                <div className="mb-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-purple-900">
                    ⚡ Quick Select Note Wording:
                  </span>
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setForm((prev) => ({ ...prev, business_note: val }));
                      }
                      e.target.value = '';
                    }}
                    className="px-2 py-1 border border-purple-200 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#7e22ce] text-purple-900 font-medium cursor-pointer max-w-md"
                    aria-label="Select Note Option"
                  >
                    <option value="">-- Choose Predefined Note --</option>
                    <option value="We obtained the Form-C of Durga Furniture Works and verified the details on the Commissioner of Municipal Administration website for applicant proprietorship confirmation. As per the available records, the applicant was found to be the proprietor of Durga Furniture Works. The relevant Form-C verification records have been obtained and attached as supporting documents.">
                      Option 1: Durga Furniture Works (Form-C)
                    </option>
                    <option value="The applicant is engaged in security agency and manpower supply services, providing trained security guards and workforce to various establishments. GST verification of Sindhu Man Power Supply confirmed the applicant’s proprietorship. GST records show active GST No. 37BZMPG3801K1Z8 and annual aggregate turnover under the ₹0–40 lakh slab. Supporting records are attached.">
                      Option 2: Sindhu Man Power Supply (GST)
                    </option>
                    <option value="We verified the GST details of Verizon Associates through the GST portal for confirmation of the applicant’s status as Managing Partner. Records show that Verizon Associates is a partnership firm with annual aggregate turnover in the ₹1.5 crore to ₹5 crore slab. GST No. 37AAQFV7442R1ZZ was found active. The relevant verification records have been attached.">
                      Option 3: Verizon Associates (GST - Partner)
                    </option>
                    <option value="We visited the given address and met the co-applicant. During the visit, the address was found to be the co-applicant’s residential address. Upon enquiry regarding business activities, the co-applicant stated that the same address is used as the registered business address, while the actual business operations and related activities are carried out outside the premises.">
                      Option 4: Residential address used as business address
                    </option>
                    <option value="The co-applicant stated that the given address is his residential as well as registered business address, while business activities are conducted elsewhere. His business involves electrical motors, water pipeline works, and civil works. Work agreements were obtained as supporting documents. Form-C verification confirms that the co-applicant is the proprietor of Prakash & Sons, and records are attached.">
                      Option 5: Prakash & Sons (Form-C)
                    </option>
                  </select>
                </div>
                <FormTextarea
                  label="Note (GST / supporting documents)"
                  name="business_note"
                  value={form.business_note}
                  onChange={handleChange}
                  rows={4}
                  className="mb-0"
                  maxLength={420}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
                <p
                  className={`text-xs mt-1 ${(form.business_note || '').length > 420 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}
                >
                  Characters: {(form.business_note || '').length} / 420
                </p>
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

export default SbiBussinessVerificationForm;
