import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchFranchises } from '@/store/slices/franchiseSlice';
import {
  INVESTMENT_RANGE_PRESETS,
  AREA_RANGE_PRESETS,
  SORT_OPTIONS,
} from '@/constants/franchiseFilterConstants';
import { useFranchiseFilters } from '@/hooks/useFranchiseFilters';
import {
  FranchiseFilterSidebar,
  FranchiseFilterDrawer,
  FranchiseFilterPanelContent,
} from '@/components/franchise/FranchiseFilterPanel';
import { FranchiseListCard } from '@/components/franchise/FranchiseListCard';

const FranchisesPage = () => {
  const dispatch = useDispatch();
  const { franchises, loading, pagination } = useSelector((state) => state.franchise);
  const {
    filters,
    searchInput,
    setSearchInput,
    applySearch,
    updateFilters,
    clearAllFilters,
    apiParams,
    activeFilterCount,
  } = useFranchiseFilters();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(fetchFranchises(apiParams));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [dispatch, apiParams]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') applySearch();
  };

  const total = pagination?.total ?? franchises?.length ?? 0;
  const page = pagination?.page ?? filters.page ?? 1;
  const totalPages = pagination?.totalPages ?? 1;

  const activePills = [];
  if (filters.category) activePills.push({ key: 'category', label: filters.category });
  if (filters.investmentPreset) {
    const inv = INVESTMENT_RANGE_PRESETS.find((p) => p.id === filters.investmentPreset);
    if (inv) activePills.push({ key: 'investment', label: inv.label });
  }
  if (filters.city?.trim()) activePills.push({ key: 'city', label: `City: ${filters.city}` });
  if (filters.state?.trim()) activePills.push({ key: 'state', label: `State: ${filters.state}` });
  if (filters.areaPreset) {
    const area = AREA_RANGE_PRESETS.find((p) => p.id === filters.areaPreset);
    if (area) activePills.push({ key: 'area', label: area.label });
  }
  if (filters.featured) activePills.push({ key: 'featured', label: 'Featured' });
  if (filters.newOnly) activePills.push({ key: 'new', label: 'New' });
  if (filters.search?.trim()) activePills.push({ key: 'search', label: `"${filters.search}"` });

  const removePill = (key) => {
    const map = {
      category: { category: '' },
      investment: { investmentPreset: '' },
      city: { city: '' },
      state: { state: '' },
      area: { areaPreset: '' },
      featured: { featured: false },
      new: { newOnly: false },
      search: { search: '' },
    };
    if (key === 'search') setSearchInput('');
    updateFilters(map[key] || {});
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-[#7e22ce] to-[#6b21a8] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Franchise Opportunities</h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto mb-8">
            Explore verified franchise brands and start your entrepreneurial journey
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search franchises..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onBlur={applySearch}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-white text-gray-800 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <FranchiseFilterSidebar filters={filters} updateFilters={updateFilters} />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-gray-600">
                Showing {(franchises || []).length} of {total} franchise{total !== 1 ? 's' : ''}
              </p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-[#7e22ce] text-white text-xs rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {(activePills.length > 0 || filters.sort !== 'featured') && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {activePills.map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => removePill(pill.key)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-[#7e22ce] text-sm border border-purple-100"
                  >
                    {pill.label}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
                {filters.sort !== 'featured' && (
                  <span className="text-xs text-gray-500">
                    Sort: {SORT_OPTIONS.find((s) => s.value === filters.sort)?.label}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setSearchInput('');
                  }}
                  className="text-sm text-[#7e22ce] hover:underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center min-h-[300px] items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e22ce]" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(franchises || []).map((franchise) => (
                    <FranchiseListCard
                      key={franchise.uuid || franchise._id}
                      franchise={franchise}
                    />
                  ))}
                </div>

                {(franchises || []).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No franchises match your filters.{' '}
                    <button type="button" onClick={clearAllFilters} className="text-[#7e22ce] underline">
                      Clear filters
                    </button>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-10">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => updateFilters({ page: page - 1 }, { resetPage: false })}
                      className="inline-flex items-center gap-1 px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => updateFilters({ page: page + 1 }, { resetPage: false })}
                      className="inline-flex items-center gap-1 px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <FranchiseFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        onApply={() => setMobileFiltersOpen(false)}
      >
        <FranchiseFilterPanelContent
          filters={filters}
          updateFilters={updateFilters}
          onClose={() => setMobileFiltersOpen(false)}
        />
      </FranchiseFilterDrawer>
    </div>
  );
};

export default FranchisesPage;
