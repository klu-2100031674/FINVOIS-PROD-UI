export const FRANCHISE_NEW_DAYS = 90;

export const INVESTMENT_RANGE_PRESETS = [
  { id: 'under_10l', label: 'Under ₹10L', min: 0, max: 1000000 },
  { id: '10l_25l', label: '₹10L – ₹25L', min: 1000000, max: 2500000 },
  { id: '25l_50l', label: '₹25L – ₹50L', min: 2500000, max: 5000000 },
  { id: '50l_1cr', label: '₹50L – ₹1Cr', min: 5000000, max: 10000000 },
  { id: 'above_1cr', label: 'Above ₹1Cr', min: 10000000, max: null },
];

export const AREA_RANGE_PRESETS = [
  { id: 'under_500', label: 'Under 500 sq ft', min: 0, max: 500 },
  { id: '500_1000', label: '500 – 1000 sq ft', min: 500, max: 1000 },
  { id: '1000_2000', label: '1000 – 2000 sq ft', min: 1000, max: 2000 },
  { id: 'above_2000', label: '2000+ sq ft', min: 2000, max: null },
];

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured first' },
  { value: 'newest', label: 'Newest' },
  { value: 'investment_asc', label: 'Investment: Low to High' },
  { value: 'investment_desc', label: 'Investment: High to Low' },
  { value: 'name', label: 'Name A–Z' },
];

export const DEFAULT_FRANCHISE_FILTERS = {
  search: '',
  category: '',
  investmentPreset: '',
  city: '',
  state: '',
  areaPreset: '',
  featured: false,
  newOnly: false,
  sort: 'featured',
  page: 1,
};

export function filtersToApiParams(filters, { includeInactive = false } = {}) {
  const params = {
    page: filters.page || 1,
    limit: 24,
    sort: filters.sort || 'featured',
  };
  if (includeInactive) params.includeInactive = 'true';
  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.category) params.category = filters.category;
  if (filters.city?.trim()) params.city = filters.city.trim();
  if (filters.state?.trim()) params.state = filters.state.trim();
  if (filters.featured) params.featured = 'true';
  if (filters.newOnly) params.new = 'true';

  const inv = INVESTMENT_RANGE_PRESETS.find((p) => p.id === filters.investmentPreset);
  if (inv) {
    if (inv.min != null) params.investmentMin = inv.min;
    if (inv.max != null) params.investmentMax = inv.max;
  }

  const area = AREA_RANGE_PRESETS.find((p) => p.id === filters.areaPreset);
  if (area) {
    if (area.min != null) params.areaMin = area.min;
    if (area.max != null) params.areaMax = area.max;
  }

  return params;
}

export function parseFiltersFromSearchParams(searchParams) {
  return {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    investmentPreset: searchParams.get('investment') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    areaPreset: searchParams.get('area') || '',
    featured: searchParams.get('featured') === 'true',
    newOnly: searchParams.get('new') === 'true',
    sort: searchParams.get('sort') || 'featured',
    page: Math.max(1, parseInt(searchParams.get('page'), 10) || 1),
  };
}

export function filtersToSearchParams(filters) {
  const p = new URLSearchParams();
  if (filters.search?.trim()) p.set('search', filters.search.trim());
  if (filters.category) p.set('category', filters.category);
  if (filters.investmentPreset) p.set('investment', filters.investmentPreset);
  if (filters.city?.trim()) p.set('city', filters.city.trim());
  if (filters.state?.trim()) p.set('state', filters.state.trim());
  if (filters.areaPreset) p.set('area', filters.areaPreset);
  if (filters.featured) p.set('featured', 'true');
  if (filters.newOnly) p.set('new', 'true');
  if (filters.sort && filters.sort !== 'featured') p.set('sort', filters.sort);
  if (filters.page > 1) p.set('page', String(filters.page));
  return p;
}

export function countActiveFilters(filters) {
  let n = 0;
  if (filters.category) n += 1;
  if (filters.investmentPreset) n += 1;
  if (filters.city?.trim()) n += 1;
  if (filters.state?.trim()) n += 1;
  if (filters.areaPreset) n += 1;
  if (filters.featured) n += 1;
  if (filters.newOnly) n += 1;
  return n;
}

export function isFranchiseNew(createdAt) {
  if (!createdAt) return false;
  const d = new Date(createdAt);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FRANCHISE_NEW_DAYS);
  return d >= cutoff;
}
