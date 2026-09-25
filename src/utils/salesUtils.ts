import type { ClientStage } from '../types/sales.types';

export const stageBadge: Record<ClientStage, { bg: string; text: string }> = {
  Available:    { bg: 'bg-gray-500/20',    text: 'text-gray-300' },
  Assigned:     { bg: 'bg-blue-500/20',    text: 'text-blue-300' },
  Contacted:    { bg: 'bg-cyan-500/20',    text: 'text-cyan-300' },
  Interested:   { bg: 'bg-green-500/20',   text: 'text-green-300' },
  'Follow-Up':  { bg: 'bg-yellow-500/20',  text: 'text-yellow-300' },
  Negotiation:  { bg: 'bg-orange-500/20',  text: 'text-orange-300' },
  Converted:    { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  Rejected:     { bg: 'bg-red-500/20',     text: 'text-red-300' },
};

export function getStageBadgeClass(stage: ClientStage): string {
  const b = stageBadge[stage];
  return `${b.bg} ${b.text} px-2 py-0.5 rounded-full text-xs font-medium`;
}

export const format = {
  date: (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  time: (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  dateTime: (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
};
