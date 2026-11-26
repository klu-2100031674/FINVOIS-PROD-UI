// Send dates for Email automation, ported from the web page. Sends go out at a chosen India time, 10:00 AM to 11:59 PM.
// The phone's own time zone must not change which day or hour is sent, so every date here is a "YYYY-MM-DD" string
// worked out in IST, and only toSendTime turns one into an instant.
const IST_OFFSET_MS = 5.5 * 3600 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MAX_SEND_DATES = 120; // the server's limit
export const DEFAULT_SEND_TIME = '10:00';

// Every 30 minutes from 10:00 to 23:30, then 23:59 as the last slot before midnight.
export const SEND_TIMES: string[] = [
  ...Array.from({ length: 28 }, (_, i) => `${String(10 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`),
  '23:59',
];

export type ScheduleMode = 'single' | 'range' | 'week' | 'month' | 'quarter' | 'pick';

export const SCHEDULE_MODES: { value: ScheduleMode; label: string }[] = [
  { value: 'single', label: 'Single date' },
  { value: 'range', label: 'Every day' },
  { value: 'week', label: '1 week' },
  { value: 'month', label: '1 month' },
  { value: 'quarter', label: '3 months' },
  { value: 'pick', label: 'Pick dates' },
];

const PRESET_DAYS: Partial<Record<ScheduleMode, number>> = { week: 7, month: 30, quarter: 90 };

export function timeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** The instant a date and India time refer to, as the ISO string the server expects. */
export function toSendTime(ymd: string, time: string = DEFAULT_SEND_TIME): string {
  return new Date(Date.parse(`${ymd}T${time}:00Z`) - IST_OFFSET_MS).toISOString();
}

export function todayIst(now: number = Date.now()): string {
  return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** The first date whose chosen India time is still ahead. */
export function firstSendDate(time: string = DEFAULT_SEND_TIME, now: number = Date.now()): string {
  const today = todayIst(now);
  return Date.parse(toSendTime(today, time)) > now ? today : addDays(today, 1);
}

export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < MAX_SEND_DATES; d = addDays(d, 1)) out.push(d);
  return out;
}

/** The dates a preset mode covers. Pick mode has no preset: its dates are chosen one at a time. */
export function datesForMode(mode: ScheduleMode, from: string, to: string): string[] {
  if (mode === 'single') return from ? [from] : [];
  if (mode === 'range') return from && to >= from ? dateRange(from, to) : [];
  const days = PRESET_DAYS[mode];
  return days ? dateRange(from, addDays(from, days - 1)) : [];
}

/** "4 Nov 2026". Read from the string itself so the phone's time zone can't shift the day. */
export function dateLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** One month as calendar cells, Sunday first. Null cells pad the first week so each date sits under its weekday. */
export function monthCells(ym: string): (string | null)[] {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: first.getUTCDay() }, () => null);
  for (let d = 1; d <= count; d += 1) cells.push(`${ym}-${String(d).padStart(2, '0')}`);
  return cells;
}
