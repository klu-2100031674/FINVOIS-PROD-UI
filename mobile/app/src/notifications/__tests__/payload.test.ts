import { allowedForRole, parsePushData, PUSH_COPY, PUSH_TYPES } from '../payload';

const ID = '64b7f0c2a1d3e4f5a6b7c8d9';

describe('parsePushData', () => {
  it.each(PUSH_TYPES)('accepts %s with a 24-char hex id', (type) => {
    expect(parsePushData({ type, id: ID })).toEqual({ type, id: ID });
  });

  it('keeps only type and id, so extra fields cannot ride along', () => {
    expect(parsePushData({ type: 'dpr_assigned', id: ID, url: 'https://evil.example', name: 'x' })).toEqual({
      type: 'dpr_assigned',
      id: ID,
    });
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'dpr_assigned'],
    ['an array', [ID]],
    ['no fields', {}],
    ['no id', { type: 'dpr_assigned' }],
    ['no type', { id: ID }],
    ['an unknown type', { type: 'delete_everything', id: ID }],
    ['a type with different case', { type: 'DPR_ASSIGNED', id: ID }],
    ['a numeric id', { type: 'dpr_assigned', id: 123456789012345678901234 }],
    ['a short id', { type: 'dpr_assigned', id: ID.slice(1) }],
    ['a long id', { type: 'dpr_assigned', id: `${ID}0` }],
    ['an upper-case id', { type: 'dpr_assigned', id: ID.toUpperCase() }],
    ['a non-hex id', { type: 'dpr_assigned', id: 'g'.repeat(24) }],
    ['a path-like id', { type: 'dpr_assigned', id: `../${ID.slice(3)}` }],
    ['an id with a trailing newline', { type: 'dpr_assigned', id: `${ID}\n` }],
    ['an object id', { type: 'dpr_assigned', id: { $ne: null } }],
    ['an array type', { type: ['dpr_assigned'], id: ID }],
  ])('rejects %s', (_label, data) => {
    expect(parsePushData(data)).toBeNull();
  });
});

describe('allowedForRole', () => {
  it('lets agents have the three agent types; new DPRs and enquiries go to both roles', () => {
    expect(allowedForRole('report_submitted', 'admin')).toBe(true);
    expect(allowedForRole('report_submitted', 'customer_service')).toBe(false);
    for (const type of ['dpr_assigned', 'report_approved', 'claim_expiring', 'report_rejected'] as const) {
      expect(allowedForRole(type, 'customer_service')).toBe(true);
      expect(allowedForRole(type, 'admin')).toBe(false);
    }
    for (const type of ['dpr_submitted', 'enquiry_submitted', 'pending_digest'] as const) {
      expect(allowedForRole(type, 'admin')).toBe(true);
      expect(allowedForRole(type, 'customer_service')).toBe(true);
    }
  });
});

describe('PUSH_COPY', () => {
  it('has generic copy for every type, with no emoji or exclamation marks', () => {
    for (const type of PUSH_TYPES) {
      const { title, body } = PUSH_COPY[type];
      expect(`${title} ${body}`).not.toMatch(/!|\p{Extended_Pictographic}/u);
      expect(title.length).toBeGreaterThan(0);
    }
  });
});
