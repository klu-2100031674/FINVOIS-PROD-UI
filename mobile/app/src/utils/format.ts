const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' });

export function formatDate(value?: string | Date | null): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : dateFmt.format(d);
}

export function formatTime(value?: string | Date | null): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : timeFmt.format(d);
}

export function formatCount(n: number | undefined | null): string {
  return typeof n === 'number' ? n.toLocaleString('en-IN') : '';
}

/** 98xxxxxx10 style mask for logs and toasts. Never log full contact details. */
export function maskPhone(phone?: string | null): string {
  const d = String(phone ?? '').replace(/\D/g, '');
  return d.length >= 6 ? `${d.slice(0, 2)}xxxxxx${d.slice(-2)}` : '';
}
