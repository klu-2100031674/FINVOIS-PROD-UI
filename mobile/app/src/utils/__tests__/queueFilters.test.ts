import type { AgentRequest } from '~/api/agentRequests';
import {
  EMPTY_FILTERS,
  activeFilterCount,
  caState,
  filterRequests,
  inProgressKind,
  matchesSearch,
  paymentState,
  uniqueDepartments,
} from '../queueFilters';

const req = (over: Partial<AgentRequest>): AgentRequest => ({
  _id: 'r',
  status: 'claimed',
  createdAt: '2026-10-01T00:00:00Z',
  ...over,
});
const report = (validation_status: string, payment: object = {}) => ({ reportId: { _id: 'x', validation_status, payment } });

describe('matchesSearch', () => {
  const contact = { name: 'Ravi Traders', phone: '+91 98000 00011', email: 'ravi@example.com' };

  it.each([
    ['', true],
    ['ravi', true],
    ['EXAMPLE.COM', true],
    ['98000', true],
    ['9800 0000', true],
    ['nobody', false],
    ['99999', false],
  ])('term %j gives %s', (term, expected) => {
    expect(matchesSearch(contact, term)).toBe(expected);
  });

  it('does not compare a word with digits to the phone number', () => {
    expect(matchesSearch(contact, 'Applicant 2')).toBe(false);
  });
});

describe('payment and CA state', () => {
  it('has no payment state without a report', () => {
    expect(paymentState(req({}))).toBe('none');
  });

  it('counts free credit reports as paid, as the server does', () => {
    expect(paymentState(req(report('approved', { status: 'pending', is_free_credit: true })))).toBe('paid');
    expect(paymentState(req(report('approved', { status: 'pending' })))).toBe('unpaid');
  });

  it.each([
    ['pending_validation', 'pending'],
    ['under_review', 'under_review'],
    ['approved', 'approved'],
    ['rejected', 'rejected'],
    ['draft', 'none'],
    ['pending_payment', 'none'],
  ])('reads %s as %s', (status, expected) => {
    expect(caState(req(report(status)))).toBe(expected);
  });
});

describe('inProgressKind matches awaitingActionKind on the server', () => {
  it.each([
    ['rejected', {}, 'rejected'],
    ['pending_validation', {}, 'ca'],
    ['under_review', {}, 'ca'],
    ['pending_payment', {}, 'payment'],
    ['draft', {}, 'payment'],
    ['approved', { status: 'pending' }, 'payment'],
  ])('%s with %j is %s', (status, payment, expected) => {
    expect(inProgressKind(req(report(status, payment)))).toBe(expected);
  });

  it('is preparation once generation started and there is no report yet', () => {
    expect(inProgressKind(req({ generationStartedAt: '2026-10-02T00:00:00Z' }))).toBe('preparation');
  });

  it('is nothing for a request where no work started', () => {
    expect(inProgressKind(req({}))).toBeNull();
  });
});

describe('filterRequests', () => {
  const rows = [
    req({ _id: 'a', departmentId: { _id: 'd1', name: 'AP MSME' }, customerId: { _id: 'c', name: 'Ravi' }, ...report('approved', { status: 'completed' }) }),
    req({ _id: 'b', departmentId: { _id: 'd2', name: 'MEPMA' }, customerId: { _id: 'c', name: 'Sita' }, ...report('rejected') }),
    req({ _id: 'c', departmentId: { _id: 'd1', name: 'AP MSME' }, customerId: { _id: 'c', name: 'Asha' } }),
  ];
  const ids = (f: Partial<typeof EMPTY_FILTERS>) => filterRequests(rows, { ...EMPTY_FILTERS, ...f }).map((r) => r._id);

  it('returns everything with no filters', () => {
    expect(ids({})).toEqual(['a', 'b', 'c']);
  });

  it('filters by department, payment, CA status and search together', () => {
    expect(ids({ department: 'd1' })).toEqual(['a', 'c']);
    expect(ids({ payment: 'paid' })).toEqual(['a']);
    expect(ids({ payment: 'unpaid' })).toEqual(['b']);
    expect(ids({ ca: 'none' })).toEqual(['c']);
    expect(ids({ department: 'd1', search: 'asha' })).toEqual(['c']);
  });

  it('counts only the panel filters as active, not the search', () => {
    expect(activeFilterCount({ ...EMPTY_FILTERS, search: 'x' })).toBe(0);
    expect(activeFilterCount({ ...EMPTY_FILTERS, department: 'd1', ca: 'pending' })).toBe(2);
  });

  it('lists each named department once, sorted', () => {
    expect(uniqueDepartments(rows)).toEqual([
      { value: 'd1', label: 'AP MSME' },
      { value: 'd2', label: 'MEPMA' },
    ]);
  });
});
