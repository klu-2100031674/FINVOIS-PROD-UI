import { X } from 'lucide-react';
import { FranchiseCategoryFilterSelect } from '@/components/franchise/FranchiseCategorySelect';
import {
  INVESTMENT_RANGE_PRESETS,
  AREA_RANGE_PRESETS,
  SORT_OPTIONS,
} from '@/constants/franchiseFilterConstants';

const chipBase =
  'px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer';
const chipActive = 'bg-[#7e22ce] text-white border-[#7e22ce]';
const chipInactive = 'bg-white text-gray-700 border-gray-200 hover:border-purple-300';

function FilterSection({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</h3>
      {children}
    </div>
  );
}

export function FranchiseFilterPanelContent({ filters, updateFilters, onClose }) {
  return (
    <div className="space-y-1">
      {onClose && (
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <FilterSection title="Category">
        <FranchiseCategoryFilterSelect
          value={filters.category}
          onChange={(category) => updateFilters({ category })}
        />
      </FilterSection>

      <FilterSection title="Investment">
        <div className="flex flex-wrap gap-2">
          {INVESTMENT_RANGE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                updateFilters({
                  investmentPreset: filters.investmentPreset === preset.id ? '' : preset.id,
                })
              }
              className={`${chipBase} ${filters.investmentPreset === preset.id ? chipActive : chipInactive}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Location">
        <div className="space-y-2">
          <input
            type="text"
            placeholder="City"
            value={filters.city}
            onChange={(e) => updateFilters({ city: e.target.value }, { resetPage: false })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce]"
          />
          <input
            type="text"
            placeholder="State"
            value={filters.state}
            onChange={(e) => updateFilters({ state: e.target.value }, { resetPage: false })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce]"
          />
        </div>
      </FilterSection>

      <FilterSection title="Area required">
        <div className="flex flex-wrap gap-2">
          {AREA_RANGE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                updateFilters({
                  areaPreset: filters.areaPreset === preset.id ? '' : preset.id,
                })
              }
              className={`${chipBase} ${filters.areaPreset === preset.id ? chipActive : chipInactive}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Highlights">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.featured}
              onChange={(e) => updateFilters({ featured: e.target.checked })}
              className="rounded border-gray-300 text-[#7e22ce] focus:ring-[#7e22ce]"
            />
            Featured only
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={filters.newOnly}
              onChange={(e) => updateFilters({ newOnly: e.target.checked })}
              className="rounded border-gray-300 text-[#7e22ce] focus:ring-[#7e22ce]"
            />
            New listings (90 days)
          </label>
        </div>
      </FilterSection>

      <FilterSection title="Sort by">
        <select
          value={filters.sort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#7e22ce]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FilterSection>
    </div>
  );
}

export function FranchiseFilterSidebar(props) {
  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-24 bg-white border rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <FranchiseFilterPanelContent {...props} />
      </div>
    </aside>
  );
}

export function FranchiseFilterDrawer({ open, onClose, onApply, children }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} aria-hidden />
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-50 shadow-xl flex flex-col lg:hidden">
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        <div className="p-4 border-t flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 px-4 py-2 bg-[#7e22ce] text-white rounded-lg hover:bg-[#6b21a8]"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
