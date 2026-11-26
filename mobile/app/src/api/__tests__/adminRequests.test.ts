import { QueryClient } from '@tanstack/react-query';
import { api } from '../client';
import {
  applicantOf,
  assignRequest,
  invalidateAfterRequestChange,
  listRequests,
  listStaff,
  releaseRequest,
  requestKeys,
  type AdminRequest,
} from '../adminRequests';
import { ADMIN_STATS_KEY } from '~/hooks/useAdminStats';
import { REPORT_KEY } from '~/hooks/useAdminReportsDetail';

jest.mock('../client', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
const get = api.get as jest.Mock;
const post = api.post as jest.Mock;

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

describe('endpoints', () => {
  it('reads the whole request list and the staff list with their counts', async () => {
    get.mockResolvedValueOnce({ data: { data: [{ _id: 'r1' }] } }).mockResolvedValueOnce({ data: { data: [{ id: 'u1', openCount: 2 }] } });
    await expect(listRequests()).resolves.toEqual([{ _id: 'r1' }]);
    await expect(listStaff()).resolves.toEqual([{ id: 'u1', openCount: 2 }]);
    expect(get.mock.calls.map((c) => c[0])).toEqual(['/govt-forms/requests', '/mobile/admin/staff']);
  });

  it('assigns with csUserId and unassigns through admin-release', async () => {
    post.mockResolvedValue({ data: {} });
    await assignRequest('r1', 'u9');
    await releaseRequest('r1');
    expect(post).toHaveBeenNthCalledWith(1, '/govt-forms/requests/r1/assign', { csUserId: 'u9' });
    expect(post).toHaveBeenNthCalledWith(2, '/govt-forms/requests/r1/admin-release');
  });
});

describe('invalidateAfterRequestChange', () => {
  it('marks the request list, detail, staff counts, dashboard stats and report context stale', async () => {
    const qc = new QueryClient();
    const keys = [
      requestKeys.list,
      requestKeys.detail('r1'),
      requestKeys.staff,
      [...ADMIN_STATS_KEY, 'all'],
      [...REPORT_KEY, 'rep1', 'context'],
    ];
    keys.forEach((k) => qc.setQueryData(k, 'x'));
    qc.setQueryData(['admin', 'report-types'], 'untouched');

    await invalidateAfterRequestChange(qc);

    keys.forEach((k) => expect(qc.getQueryState(k)?.isInvalidated).toBe(true));
    expect(qc.getQueryState(['admin', 'report-types'])?.isInvalidated).toBe(false);
    qc.clear(); // drops the cache's gc timers so jest can exit
  });
});

describe('applicantOf', () => {
  const base = { _id: 'r1', status: 'open', createdAt: '2026-10-01T00:00:00Z' } as AdminRequest;

  it('prefers what the applicant typed over the customer account', () => {
    const r = {
      ...base,
      submittedData: { govt_builtin_name: ' Ravi Traders ', govt_builtin_phone: '9800000011', scheme: 'MSME' },
      customerId: { _id: 'c1', name: 'Account name', phone: '1', email: 'acct@example.test' },
      formId: { _id: 'f1', name: 'Form name' },
    };
    expect(applicantOf(r)).toEqual({ name: 'Ravi Traders', phone: '9800000011', email: 'acct@example.test', scheme: 'MSME' });
  });

  it('falls back to the customer and form, then to a generic name', () => {
    expect(applicantOf({ ...base, customerId: { _id: 'c1', name: 'Sai Foods' }, formId: { _id: 'f1', name: 'PMEGP' } })).toMatchObject({
      name: 'Sai Foods',
      scheme: 'PMEGP',
    });
    expect(applicantOf(base)).toEqual({ name: 'Applicant', phone: '', email: '', scheme: '' });
  });

  it('hides the placeholder address given to accounts created from a phone number', () => {
    const r = { ...base, customerId: { _id: 'c1', email: '9800000011@phone.customer.finvois' } };
    expect(applicantOf(r).email).toBe('');
  });
});
