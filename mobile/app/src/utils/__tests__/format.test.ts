import { formatCount, formatDate, maskPhone } from '../format';
import { WORKFLOW_STATUS, REPORT_STATUS } from '../status';

describe('format helpers', () => {
  it('formats counts with Indian grouping', () => {
    expect(formatCount(1234567)).toBe('12,34,567');
    expect(formatCount(undefined)).toBe('');
  });

  it('formats dates and ignores bad input', () => {
    expect(formatDate('2026-05-02T10:00:00Z')).toMatch(/2 May 2026/);
    expect(formatDate('not a date')).toBe('');
    expect(formatDate(null)).toBe('');
  });

  it('masks phone numbers', () => {
    expect(maskPhone('9800000012')).toBe('98xxxxxx12');
    expect(maskPhone('123')).toBe('');
  });
});

describe('status vocabularies stay separate', () => {
  it('has no shared keys that could be mixed up except rejected', () => {
    const shared = Object.keys(REPORT_STATUS).filter((k) => k in WORKFLOW_STATUS);
    expect(shared).toEqual(['rejected']);
  });
});
