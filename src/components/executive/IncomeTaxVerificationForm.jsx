import React, { useCallback, useState } from 'react';
import { FlaskConical, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input, Button } from '../common';
import { executiveAPI } from '../../api/executiveAPI';
import { getIncomeTaxTestData } from '../../utils/incomeTaxTestData';
import { useExecutiveDraft } from '../../hooks/useExecutiveDraft';
import {
  ExecutiveFormShell,
  ExecutiveFormCard,
  ExecutiveFormBody,
  FormSection,
  FormFieldGrid,
  StickyFormActions,
  DraftStatusBanner,
  convertToYyyyMmDd,
  convertToDdMmYyyy,
  EXECUTIVE_INPUT_CLASS
} from './executiveFormShared';

const TEMPLATE_ID = 'income-tax';
const MAX_RETURN_ROWS = 10;

function emptyRow() {
  return {
    sno: '',
    type: '',
    section: '',
    fy: '',
    ay: '',
    date: '',
    ack: '',
    income: '',
    remark: ''
  };
}

function emptyForm() {
  return {
    sub: 'Confirmation of Income Tax Return Acknowledgements-Reg.',
    rlms: '',
    branch: '',
    name: '',
    pan: '',
    udin: '',
    place: '',
    date: '',
    returns: [emptyRow()]
  };
}

const IncomeTaxVerificationForm = () => {
  const [form, setForm] = useState(() => emptyForm());
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  const onRestoreDraft = useCallback(({ form: saved }) => {
    if (saved && typeof saved === 'object') {
      setForm((prev) => ({
        ...prev,
        ...saved,
        returns: Array.isArray(saved.returns) && saved.returns.length ? saved.returns : prev.returns
      }));
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

  const handleRowChange = (idx, key, value) => {
    setForm((prev) => {
      const next = [...(prev.returns || [])];
      next[idx] = { ...(next[idx] || emptyRow()), [key]: value };
      return { ...prev, returns: next };
    });
  };

  const handleRowDateChange = (idx, key, value) => {
    const formatted = convertToDdMmYyyy(value);
    handleRowChange(idx, key, formatted);
  };

  const addRow = () => {
    setForm((prev) => {
      const current = prev.returns || [];
      if (current.length >= MAX_RETURN_ROWS) return prev;
      return { ...prev, returns: [...current, emptyRow()] };
    });
    if ((form.returns || []).length >= MAX_RETURN_ROWS) {
      toast.error(`Maximum ${MAX_RETURN_ROWS} rows allowed`);
    }
  };

  const removeRow = (idx) => {
    setForm((prev) => ({
      ...prev,
      returns: (prev.returns || []).filter((_, i) => i !== idx)
    }));
  };

  const fillTestData = () => {
    const next = getIncomeTaxTestData();
    const rows = Array.isArray(next?.returns) ? next.returns.slice(0, MAX_RETURN_ROWS) : [emptyRow()];
    setForm({ ...next, returns: rows.length ? rows : [emptyRow()] });
    toast.success('Test data filled');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!form.rlms?.trim()) {
      toast.error('RLMS NO is required');
      return;
    }
    if (!form.name?.trim()) {
      toast.error('Name is required');
      return;
    }

    setGenerating(true);
    try {
      const normalizedReturns = (form.returns || []).map((row, idx) => ({
        ...(row || {}),
        sno: String(idx + 1)
      }));
      const payload = { ...form, returns: normalizedReturns };

      const res = await executiveAPI.generateExecutiveReport(TEMPLATE_ID, payload, []);
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
      title="Income Tax (ITR) Confirmation"
      subtitle="Fill the details below to generate the ITR acknowledgement confirmation letter PDF."
      testDataButton={
        <Button type="button" variant="outline" onClick={fillTestData}>
          <FlaskConical className="w-4 h-4 mr-2 inline" />
          Fill test data
        </Button>
      }
    >
      <ExecutiveFormCard onSubmit={handleGenerate}>
        <DraftStatusBanner draftId={draftId} loadingDraft={loadingDraft} />
        <ExecutiveFormBody>
          <FormSection title="Reference">
            <FormFieldGrid>
              <Input
                label="Sub"
                name="sub"
                value={form.sub}
                onChange={handleChange}
                className="mb-0 md:col-span-2"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="RLMS NO"
                name="rlms"
                value={form.rlms}
                onChange={handleChange}
                required
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="Branch"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
            </FormFieldGrid>
          </FormSection>

          <FormSection title="Applicant">
            <FormFieldGrid>
              <Input
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
              <Input
                label="PAN"
                name="pan"
                value={form.pan}
                onChange={handleChange}
                className="mb-0"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
            </FormFieldGrid>
          </FormSection>

          <FormSection title="Return details (table)">
            <div className="space-y-3">
              {(form.returns || []).map((row, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="text-sm font-semibold text-gray-800">Row {idx + 1}</div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeRow(idx)}
                      disabled={(form.returns || []).length <= 1}
                    >
                      <Trash2 className="w-4 h-4 mr-2 inline" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                      label="S.No"
                      value={String(idx + 1)}
                      readOnly
                      className="mb-0"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                    <Input label="Type" value={row.type || ''} onChange={(e) => handleRowChange(idx, 'type', e.target.value)} className="mb-0" inputClassName={EXECUTIVE_INPUT_CLASS} />
                    <Input label="Section" value={row.section || ''} onChange={(e) => handleRowChange(idx, 'section', e.target.value)} className="mb-0" inputClassName={EXECUTIVE_INPUT_CLASS} />
                    <Input label="Financial Year" value={row.fy || ''} onChange={(e) => handleRowChange(idx, 'fy', e.target.value)} className="mb-0" inputClassName={EXECUTIVE_INPUT_CLASS} />
                    <Input label="Assessment Year" value={row.ay || ''} onChange={(e) => handleRowChange(idx, 'ay', e.target.value)} className="mb-0" inputClassName={EXECUTIVE_INPUT_CLASS} />
                    <Input
                      type="date"
                      label="Filing Date"
                      value={convertToYyyyMmDd(row.date || '')}
                      onChange={(e) => handleRowDateChange(idx, 'date', e.target.value)}
                      className="mb-0"
                      inputClassName={EXECUTIVE_INPUT_CLASS}
                    />
                    <Input label="Acknowledgement Number" value={row.ack || ''} onChange={(e) => handleRowChange(idx, 'ack', e.target.value)} className="mb-0" inputClassName={EXECUTIVE_INPUT_CLASS} />
                    <Input label="Income" value={row.income || ''} onChange={(e) => handleRowChange(idx, 'income', e.target.value)} className="mb-0" inputClassName={EXECUTIVE_INPUT_CLASS} />
                    <Input label="Remarks" value={row.remark || ''} onChange={(e) => handleRowChange(idx, 'remark', e.target.value)} className="mb-0 md:col-span-2" inputClassName={EXECUTIVE_INPUT_CLASS} />
                  </div>
                </div>
              ))}

              <Button type="button" variant="secondary" onClick={addRow}>
                <Plus className="w-4 h-4 mr-2 inline" />
                Add row
              </Button>
            </div>
          </FormSection>

          <FormSection title="UDIN / Place / Date">
            <FormFieldGrid>
              <Input label="UDIN" name="udin" value={form.udin} onChange={handleChange} className="mb-0" inputClassName={EXECUTIVE_INPUT_CLASS} />
              <Input label="Place" name="place" value={form.place} onChange={handleChange} className="mb-0" inputClassName={EXECUTIVE_INPUT_CLASS} />
              <Input
                type="date"
                label="Date"
                name="date"
                value={convertToYyyyMmDd(form.date)}
                onChange={handleDateChange}
                className="mb-0 md:col-span-2"
                inputClassName={EXECUTIVE_INPUT_CLASS}
              />
            </FormFieldGrid>
          </FormSection>

          <StickyFormActions
            generating={generating}
            lastGenerated={lastGenerated}
            onDownload={handleDownload}
            onSaveDraft={() => saveDraft(form, 0)}
            savingDraft={savingDraft}
            loadingDraft={loadingDraft}
          />
        </ExecutiveFormBody>
      </ExecutiveFormCard>
    </ExecutiveFormShell>
  );
};

export default IncomeTaxVerificationForm;

