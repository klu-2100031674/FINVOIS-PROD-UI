import type { AgentRequest } from '~/api/agentRequests';
import { buildRequestForm } from '../requestForm';

const request = (over: Partial<AgentRequest>): AgentRequest => ({
  _id: 'r',
  status: 'claimed',
  createdAt: '2026-10-01T00:00:00Z',
  ...over,
});
const row = (form: ReturnType<typeof buildRequestForm>, id: string) => form.rows.find((r) => r.id === id);

describe('buildRequestForm', () => {
  it('lists a plain form field by field, with no MSME sections', () => {
    const form = buildRequestForm(
      request({
        formId: { name: 'Plain', customRoute: 'plain', fields: [{ id: 'city', label: 'City', type: 'text' }, { id: 'ok', label: 'Agreed', type: 'checkbox' }] },
        submittedData: { city: 'Vizag', ok: true },
      })
    );
    expect(form.highlights).toEqual([]);
    expect(form.assets).toBeNull();
    expect(form.rows).toEqual([
      { id: 'city', label: 'City', value: 'Vizag' },
      { id: 'ok', label: 'Agreed', value: 'Yes' },
    ]);
  });

  it('hides the CA stamp question from staff', () => {
    const form = buildRequestForm(
      request({ formId: { fields: [{ id: 'need_ca_stamp', label: 'Need CA stamp' }] }, submittedData: { need_ca_stamp: 'Yes' } })
    );
    expect(form.rows).toEqual([]);
  });

  it('shows the file name of an uploaded file, not its contents', () => {
    const form = buildRequestForm(
      request({
        formId: { fields: [{ id: 'doc', label: 'Proof', type: 'file' }, { id: 'none', label: 'Other', type: 'file' }] },
        submittedData: { doc: { base64: 'data:application/pdf;base64,AAAA', fileName: 'proof.pdf' } },
      })
    );
    expect(row(form, 'doc')?.value).toContain('proof.pdf');
    expect(row(form, 'doc')?.value).not.toContain('AAAA');
    expect(row(form, 'none')?.value).toBe('No document uploaded');
  });

  it('highlights loan type, sector and template on an MSME form, using the MSME field names', () => {
    const form = buildRequestForm(
      request({
        formId: { customRoute: 'msme-dpr', fields: [] },
        submittedData: {
          msme_loan_type: 'Dropline OD',
          msme_sector: 'Manufacturing',
          panNumber: 'ABCDE1234F',
          dprAssets: [{ assetModel: 'Lathe', assetCategory: 'Machine', amount: '50000', loanPercentage: '75' }],
        },
      })
    );
    expect(form.highlights.map((h) => [h.id, h.value])).toEqual([
      ['loanType', 'Term Loan'],
      ['sector', 'Manufacturing'],
      ['suggestedTemplateId', '—'],
    ]);
    expect(row(form, 'panNumber')?.value).toBe('ABCDE1234F');
    expect(form.assets).toEqual([{ model: 'Lathe', category: 'Machine', amount: '50000', loanPercentage: '75' }]);
    // Highlighted fields are not repeated below, and an optional blank field stays hidden.
    expect(row(form, 'loanType')).toBeUndefined();
    expect(row(form, 'district')).toBeUndefined();
    // A field the web always shows appears with a dash when it is blank.
    expect(row(form, 'aadharNumber')?.value).toBe('—');
  });

  it('reads MEPMA forms from the MEPMA field names', () => {
    const form = buildRequestForm(request({ formId: { customRoute: 'mepma-dpr' }, submittedData: { mepma_sector: 'Service' } }));
    expect(form.highlights.find((h) => h.id === 'sector')?.value).toBe('Service');
  });

  it('merges the processing fee row for a working capital or OD loan', () => {
    const form = buildRequestForm(
      request({
        formId: { customRoute: 'dpr-request' },
        submittedData: { dpr_request_loan_type: 'Working capital or OD Loan', workingCapitalMargin: '2', processingFee: '2' },
      })
    );
    expect(row(form, 'processingFee')).toBeUndefined();
    expect(row(form, 'workingCapitalMargin')).toEqual({ id: 'workingCapitalMargin', label: 'Processing fee (%)', value: '2' });
  });

  it.each([
    [{ hasWorkingCapitalLimitPresent: 'Yes', alsoNewTermLoanForAsset: 'Yes', wcLimitTopup: 'Yes' }, 'Cash Credit Form 7'],
    [{ hasWorkingCapitalLimitPresent: 'Yes', alsoNewTermLoanForAsset: 'No', wcLimitTopup: 'No' }, 'Cash Credit Form 4'],
    [{ hasWorkingCapitalLimitPresent: 'No', hasAuditedLastFy: 'Yes', hasProvisionalCurrentFy: 'Yes' }, 'Cash Credit Form 2'],
    [{ hasWorkingCapitalLimitPresent: 'No', hasAuditedLastFy: 'No', hasProvisionalCurrentFy: 'No' }, 'Cash Credit Form 1'],
    [{ hasWorkingCapitalLimitPresent: 'Yes' }, '—'],
    [{ suggestedTemplateId: 'FRCC5' }, 'Cash Credit Form 5'],
  ])('resolves the suggested template from %j as %s', (wcOdTypeChart, expected) => {
    const form = buildRequestForm(request({ formId: { customRoute: 'msme-dpr' }, submittedData: { wcOdTypeChart } }));
    expect(form.highlights.find((h) => h.id === 'suggestedTemplateId')?.value).toBe(expected);
  });

  it('copes with a request that has no form or data', () => {
    expect(buildRequestForm(request({}))).toEqual({ highlights: [], rows: [], assets: null });
  });
});
