import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFranchiseCategories } from '@/store/slices/franchiseSlice';
import { FRANCHISE_CATEGORIES } from '@/constants/franchiseConstants';

export function useFranchiseCategories() {
  const dispatch = useDispatch();
  const { categories, categoriesLoading } = useSelector((state) => state.franchise);

  useEffect(() => {
    if (!categories.length && !categoriesLoading) {
      dispatch(fetchFranchiseCategories());
    }
  }, [dispatch, categories.length, categoriesLoading]);

  const list =
    categories.length > 0
      ? categories
      : FRANCHISE_CATEGORIES.filter((c) => c !== 'Other');

  return {
    categories: list,
    loading: categoriesLoading,
    refresh: () => dispatch(fetchFranchiseCategories()),
  };
}
