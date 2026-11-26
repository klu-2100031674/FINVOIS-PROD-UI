import {
  MAX_SEND_DATES,
  SEND_TIMES,
  addDays,
  addMonths,
  dateLabel,
  dateRange,
  datesForMode,
  firstSendDate,
  monthCells,
  timeLabel,
  toSendTime,
  todayIst,
} from '../emailSchedule';

describe('send times', () => {
  it('runs every 30 minutes from 10:00 AM, ending at 11:59 PM', () => {
    expect(SEND_TIMES[0]).toBe('10:00');
    expect(SEND_TIMES[1]).toBe('10:30');
    expect(SEND_TIMES.at(-2)).toBe('23:30');
    expect(SEND_TIMES.at(-1)).toBe('23:59');
    expect(SEND_TIMES).toHaveLength(29);
  });

  it.each([
    ['10:00', '10:00 AM'],
    ['12:00', '12:00 PM'],
    ['13:30', '1:30 PM'],
    ['23:59', '11:59 PM'],
  ])('%s reads %s', (hhmm, label) => expect(timeLabel(hhmm)).toBe(label));
});

describe('toSendTime', () => {
  it('reads the date and time as India time', () => {
    expect(toSendTime('2026-11-04', '10:00')).toBe('2026-11-04T04:30:00.000Z');
    expect(toSendTime('2026-11-04', '23:59')).toBe('2026-11-04T18:29:00.000Z');
  });
});

describe('firstSendDate', () => {
  const at = (iso: string) => Date.parse(iso);

  it('is today while the chosen time is still ahead in India', () => {
    expect(firstSendDate('10:00', at('2026-11-04T04:00:00Z'))).toBe('2026-11-04'); // 9:30 AM IST
  });

  it('moves to tomorrow once the time has passed', () => {
    expect(firstSendDate('10:00', at('2026-11-04T05:00:00Z'))).toBe('2026-11-05'); // 10:30 AM IST
    expect(firstSendDate('23:59', at('2026-11-04T05:00:00Z'))).toBe('2026-11-04');
  });

  it('uses the India date even when it is still yesterday in UTC', () => {
    // 19:00 UTC on the 4th is 12:30 AM on the 5th in India.
    expect(todayIst(at('2026-11-04T19:00:00Z'))).toBe('2026-11-05');
    expect(firstSendDate('10:00', at('2026-11-04T19:00:00Z'))).toBe('2026-11-05');
  });
});

describe('date lists', () => {
  it('adds days across a month and a year', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('never goes over the server limit', () => {
    expect(dateRange('2026-01-01', '2027-12-31')).toHaveLength(MAX_SEND_DATES);
  });

  it('builds each mode the way the web does', () => {
    expect(datesForMode('single', '2026-11-05', '2026-11-20')).toEqual(['2026-11-05']);
    expect(datesForMode('range', '2026-11-05', '2026-11-07')).toEqual(['2026-11-05', '2026-11-06', '2026-11-07']);
    expect(datesForMode('week', '2026-11-05', '')).toHaveLength(7);
    expect(datesForMode('month', '2026-11-05', '')).toHaveLength(30);
    expect(datesForMode('quarter', '2026-11-05', '')).toHaveLength(90);
    expect(datesForMode('pick', '2026-11-05', '')).toEqual([]);
  });

  it('gives no dates when the range ends before it starts', () => {
    expect(datesForMode('range', '2026-11-05', '2026-11-01')).toEqual([]);
  });
});

describe('calendar', () => {
  it('labels a date without going through the phone time zone', () => {
    expect(dateLabel('2026-11-04')).toBe('4 Nov 2026');
  });

  it('moves between months across a year', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2027-01', -1)).toBe('2026-12');
  });

  it('pads the first week so each date sits under its weekday', () => {
    // 1 Nov 2026 is a Sunday; 1 Dec 2026 is a Tuesday.
    expect(monthCells('2026-11')[0]).toBe('2026-11-01');
    expect(monthCells('2026-11')).toHaveLength(30);
    const dec = monthCells('2026-12');
    expect(dec.slice(0, 3)).toEqual([null, null, '2026-12-01']);
    expect(dec.at(-1)).toBe('2026-12-31');
  });
});
