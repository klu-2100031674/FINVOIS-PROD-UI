import {
  GraduationCap,
  Megaphone,
  Package,
  BookOpen,
  Users,
  Monitor,
  FileText,
  Rocket,
  Headphones,
  Wrench,
} from 'lucide-react';
import { SUPPORT_OPTIONS } from '@/constants/franchiseConstants';
import { isFranchiseNew } from '@/constants/franchiseFilterConstants';

const SUPPORT_ICON_MAP = {
  'Training Support': GraduationCap,
  'Marketing Support': Megaphone,
  'Store Setup Assistance': Wrench,
  'Inventory Support': Package,
  'Staff Training': Users,
  'Technology / Software Support': Monitor,
  'Operations Manual': BookOpen,
  'Launch Support': Rocket,
  'Ongoing Business Support': Headphones,
};

export function SupportIcons({ supportProvided = [], size = 'sm' }) {
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const items = (supportProvided || []).filter((s) => SUPPORT_OPTIONS.includes(s));

  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((label) => {
        const Icon = SUPPORT_ICON_MAP[label] || Headphones;
        return (
          <span
            key={label}
            title={label}
            className="inline-flex items-center justify-center p-1.5 rounded-lg bg-purple-50 text-[#7e22ce]"
          >
            <Icon className={iconSize} />
          </span>
        );
      })}
    </div>
  );
}

export function FranchiseBadges({ franchise, className = '' }) {
  const showFeatured = franchise?.isFeatured;
  const showNew = isFranchiseNew(franchise?.createdAt);
  if (!showFeatured && !showNew) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {showFeatured && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
          Featured
        </span>
      )}
      {showNew && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          New
        </span>
      )}
    </div>
  );
}

export function FranchiseLogo({ franchise, className = 'h-14 w-14', loading = 'lazy' }) {
  const name = franchise?.franchiseName || '?';
  if (franchise?.logoUrl) {
    return (
      <img
        src={franchise.logoUrl}
        alt={name}
        loading={loading}
        width={64}
        height={64}
        className={`${className} object-contain rounded-lg border bg-white`}
      />
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center rounded-lg bg-purple-100 text-[#7e22ce] font-bold text-xl border`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
