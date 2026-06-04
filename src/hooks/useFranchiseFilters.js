import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_FRANCHISE_FILTERS,
  filtersToApiParams,
  filtersToSearchParams,
  parseFiltersFromSearchParams,
  countActiveFilters,
} from '@/constants/franchiseFilterConstants';

export function useFranchiseFilters({ includeInactive = false } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => parseFiltersFromSearchParams(searchParams),
    [searchParams],
  );

  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const apiParams = useMemo(
    () => filtersToApiParams(filters, { includeInactive }),
    [filters, includeInactive],
  );

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const updateFilters = useCallback(
    (patch, { resetPage = true } = {}) => {
      const next = {
        ...filters,
        ...patch,
        ...(resetPage && !('page' in patch) ? { page: 1 } : {}),
      };
      setSearchParams(filtersToSearchParams(next), { replace: true });
    },
    [filters, setSearchParams],
  );

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const applySearch = useCallback(() => {
    updateFilters({ search: searchInput });
  }, [searchInput, updateFilters]);

  return {
    filters,
    searchInput,
    setSearchInput,
    applySearch,
    updateFilters,
    clearAllFilters,
    apiParams,
    activeFilterCount,
  };
}

export { DEFAULT_FRANCHISE_FILTERS };
