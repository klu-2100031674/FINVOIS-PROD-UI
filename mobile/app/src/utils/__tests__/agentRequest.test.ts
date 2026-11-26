import { AxiosError } from 'axios';
import type { AgentRequest } from '~/api/agentRequests';
import {
  ACCESS_DENIED_MESSAGE,
  TAB_QUEUE,
  applicantOf,
  canClaim,
  canRelease,
  canSendToApplicant,
  hasApprovedReport,
  isAccessDenied,
  isAssignedByCa,
  schemeLine,
  telUrl,
  whatsappUrl,
  workflowTimeline,
} from '../agentRequest';

const req = (fields: Partial<AgentRequest>): AgentRequest => ({
  _id: 'r1',
  status: 'open',
  createdAt: '2026-10-01T00:00:00Z',
  workflow: { key: 'pending', label: 'Pending' },
  ...fields,
});

describe('tab to queue mapping', () => {
  it('maps each tab to the web queue of the same work bucket', () => {
    expect(TAB_QUEUE).toEqual({ open: 'open', mine: 'assigned', active: 'in-progress', done: 'cs-completed' });
  });
});

describe('contact links', () => {
  it('builds a tel link from the digits and a leading plus', () => {
    expect(telUrl('98000 00011')).toBe('tel:9800000011');
    expect(telUrl('+91 98000-00011')).toBe('tel:+919800000011');
    expect(telUrl('123')).toBeNull();
    expect(telUrl(undefined)).toBeNull();
  });

  it('gives 10-digit numbers the 91 country code', () => {
    expect(whatsappUrl('9800000011')).toBe('https://wa.me/919800000011');
    expect(whatsappUrl('98000 00011')).toBe('https://wa.me/919800000011');
  });

  it('keeps numbers that already carry a country code and drops trunk zeros', () => {
    expect(whatsappUrl('+91 98000 00011')).toBe('https://wa.me/919800000011');
    expect(whatsappUrl('09800000011')).toBe('https://wa.me/919800000011');
    expect(whatsappUrl('0091 9800000011')).toBe('https://wa.me/919800000011');
    expect(whatsappUrl('+1 415 555 0132')).toBe('https://wa.me/14155550132');
  });

  it('refuses numbers that cannot be a phone', () => {
    expect(whatsappUrl('12345')).toBeNull();
    expect(whatsappUrl('')).toBeNull();
    expect(whatsappUrl(null)).toBeNull();
    expect(whatsappUrl('1234567890123456789')).toBeNull();
  });
});

describe('applicant details', () => {
  it('prefers the customer account, then the submitted form', () => {
    const a = applicantOf(
      req({
        customerId: { _id: 'c', name: 'Ravi Traders', phone: '9800000011', email: 'ravi@example.com' },
        submittedData: { govt_builtin_name: 'Typed name', govt_builtin_phone: '1111111111' },
      })
    );
    expect(a).toEqual({ name: 'Ravi Traders', phone: '9800000011', email: 'ravi@example.com' });
  });

  it('falls back to the form, then to a generic name', () => {
    expect(
      applicantOf(req({ submittedData: { govt_builtin_name: 'Sai Foods', govt_builtin_phone: '9811111111', govt_builtin_email: 's@x.in' } }))
    ).toEqual({ name: 'Sai Foods', phone: '9811111111', email: 's@x.in' });
    expect(applicantOf(req({ submittedData: null })).name).toBe('Applicant');
  });

  it('hides the placeholder address of phone-only accounts', () => {
    expect(applicantOf(req({ customerId: { _id: 'c', email: '9800000011@phone.customer.finvois' } })).email).toBe('');
  });

  it('joins the form name and scheme', () => {
    expect(schemeLine(req({ formId: { name: 'AP MSME DPR' }, submittedData: { scheme: 'PMEGP' } }))).toBe('AP MSME DPR · PMEGP');
    expect(schemeLine(req({ formId: { name: 'AP MSME DPR' } }))).toBe('AP MSME DPR');
    expect(schemeLine(req({}))).toBe('Request');
  });
});

describe('which actions are offered', () => {
  const generated = req({
    status: 'completed',
    workflow: { key: 'generated', label: 'DPR Generated successfully' },
    reportId: { _id: 'rep', validation_status: 'approved' },
  });

  it('offers Send to applicant only when the workflow is generated and a report exists', () => {
    expect(canSendToApplicant(generated)).toBe(true);
    expect(canSendToApplicant({ ...generated, reportId: null })).toBe(false);
    expect(canSendToApplicant({ ...generated, reportId: 'rep' })).toBe(false); // bare id: nothing populated to send
    for (const key of ['pending', 'initiated', 'preparation', 'ca_validation', 'rejected']) {
      expect(canSendToApplicant({ ...generated, workflow: { key, label: key } })).toBe(false);
    }
  });

  it('shows the report PDF only once it is approved', () => {
    expect(hasApprovedReport(generated)).toBe(true);
    expect(hasApprovedReport({ ...generated, reportId: { _id: 'rep', validation_status: 'pending_validation' } })).toBe(false);
    expect(hasApprovedReport(req({}))).toBe(false);
  });

  it('offers Claim on open requests only', () => {
    expect(canClaim(req({ status: 'open' }))).toBe(true);
    expect(canClaim(req({ status: 'claimed' }))).toBe(false);
  });

  it('offers Release only to the claimer before generation starts', () => {
    const claimed = req({ status: 'claimed', claimedBy: { _id: 'me' }, workflow: { key: 'initiated', label: '' } });
    expect(canRelease(claimed, 'me')).toBe(true);
    expect(canRelease(claimed, 'someone-else')).toBe(false);
    expect(canRelease({ ...claimed, workflow: { key: 'preparation', label: '' } }, 'me')).toBe(false);
    // assigned by the CA: assignedTo is set, claimedBy is not, and the server refuses the release
    const assigned = req({ status: 'assigned', assignedTo: { _id: 'me' }, workflow: { key: 'initiated', label: '' } });
    expect(canRelease(assigned, 'me')).toBe(false);
    expect(isAssignedByCa(assigned, 'me')).toBe(true);
    expect(isAssignedByCa(claimed, 'me')).toBe(false);
  });
});

describe('workflow timeline', () => {
  const states = (key: string) => workflowTimeline(key).map((s) => s.state);

  it('lists Initiated, Preparing, With CA, Generated', () => {
    expect(workflowTimeline('initiated').map((s) => s.label)).toEqual(['Initiated', 'Preparing', 'With CA', 'Generated']);
  });

  it('marks progress per workflow key', () => {
    expect(states('pending')).toEqual(['todo', 'todo', 'todo', 'todo']);
    expect(states('initiated')).toEqual(['current', 'todo', 'todo', 'todo']);
    expect(states('preparation')).toEqual(['done', 'current', 'todo', 'todo']);
    expect(states('ca_validation')).toEqual(['done', 'done', 'current', 'todo']);
    expect(states('generated')).toEqual(['done', 'done', 'done', 'done']);
  });

  it('shows a rejected report as stopped at the CA step', () => {
    expect(states('rejected')).toEqual(['done', 'done', 'rejected', 'todo']);
    expect(workflowTimeline('rejected')[2].label).toBe('Rejected');
  });
});

describe('access denied', () => {
  const httpError = (status: number) =>
    new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      status,
      data: { success: false, error: 'You do not have access to this request' },
      statusText: '',
      headers: {},
      config: {} as never,
    });

  it('treats another agent request (403), a missing one (404) and a bad id (400) the same way', () => {
    for (const status of [400, 403, 404]) expect(isAccessDenied(httpError(status))).toBe(true);
    expect(ACCESS_DENIED_MESSAGE).toBe("You don't have access to this request.");
  });

  it('does not hide real failures behind the access message', () => {
    for (const status of [401, 500, 502]) expect(isAccessDenied(httpError(status))).toBe(false);
    expect(isAccessDenied(new Error('Network Error'))).toBe(false);
    expect(isAccessDenied(undefined)).toBe(false);
  });
});
