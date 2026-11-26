jest.mock('~/auth/sessionStore', () => ({ sessionStore: { getState: jest.fn() } }));

import { sessionStore } from '~/auth/sessionStore';
import { linking } from '../linking';

const ID = '64b7f0c2a1d3e4f5a6b7c8d9';
const AGENT = { status: 'signedIn', user: { id: 'u1', name: 'A', email: 'a@e2e.test', role: 'customer_service' } };
const ADMIN = { status: 'signedIn', user: { id: 'u2', name: 'C', email: 'c@e2e.test', role: 'admin' } };

const open = (path: string) => linking.getStateFromPath!(path, {} as never);
const as = (session: unknown) => (sessionStore.getState as jest.Mock).mockReturnValue(session);

describe('finovis:// links', () => {
  it('only claims the finovis scheme, and is on for the native app', () => {
    expect(linking.prefixes).toEqual(['finovis://']);
    expect(linking.enabled).toBe(true);
  });

  it('opens a request detail for an agent', () => {
    as(AGENT);
    expect(open(`request/${ID}`)).toEqual({
      routes: [{ name: 'Agent' }, { name: 'AgentRequestDetail', params: { requestId: ID } }],
    });
    expect(open(`/request/${ID}/?utm=x#top`)).toEqual(open(`request/${ID}`));
  });

  it('opens the pending requests for an admin', () => {
    as(ADMIN);
    expect(open('requests/pending')).toEqual({
      routes: [{ name: 'Admin', state: { routes: [{ name: 'Requests', params: { filter: 'pending' } }] } }],
    });
  });

  it('drops a link that belongs to the other role', () => {
    as(ADMIN);
    expect(open(`request/${ID}`)).toBeUndefined();
    as(AGENT);
    expect(open('requests/pending')).toBeUndefined();
  });

  it.each([
    ['signedOut', { status: 'signedOut' }],
    ['loading', { status: 'loading' }],
  ])('drops every link while %s', (_label, session) => {
    as(session);
    expect(open(`request/${ID}`)).toBeUndefined();
    expect(open('requests/pending')).toBeUndefined();
  });

  it.each([
    ['a short id', 'request/abc'],
    ['an upper-case id', `request/${ID.toUpperCase()}`],
    ['a path-like id', 'request/..%2F..%2Fadmin'],
    ['no id', 'request'],
    ['an extra segment', `request/${ID}/documents`],
    ['a screen that is not on the list', 'login'],
    ['a pdf viewer link', `pdf/${ID}`],
    ['a report detail link', `report/${ID}`],
    ['another filter', 'requests/approved'],
    ['the root', ''],
  ])('drops %s', (_label, path) => {
    for (const session of [AGENT, ADMIN]) {
      as(session);
      expect(open(path)).toBeUndefined();
    }
  });
});
