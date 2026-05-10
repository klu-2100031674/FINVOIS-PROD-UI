/**
 * Clears stale report/session state and loads templates — shared by dashboards that host AIAssistant → generate flows.
 */
import { useEffect } from 'react';
import { fetchTemplates } from '../store/slices/templateSlice';
import { clearGeneratedExcel, clearFormData } from '../store/slices/reportSlice';

export default function useGenerateHubPrep(dispatch) {
  useEffect(() => {
    dispatch(clearGeneratedExcel());
    dispatch(clearFormData());
    dispatch(fetchTemplates());
  }, [dispatch]);
}
