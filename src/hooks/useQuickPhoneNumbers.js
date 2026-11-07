/**
 * Admin "quick phone numbers" (short name + phone, max 5) used to autofill
 * the WhatsApp send box on report validation pages.
 */
import { useCallback, useEffect, useState } from 'react';
import api from '../api/apiClient';

export const MAX_QUICK_PHONE_NUMBERS = 5;

export const getApiErrorMessage = (error, fallback) =>
  typeof error === 'string'
    ? error
    : error?.response?.data?.error || error?.message || fallback;

export function useQuickPhoneNumbers() {
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/quick-phone-numbers');
      const list = response?.data?.data;
      setNumbers(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to load quick phone numbers:', error);
      setNumbers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (list) => {
    const response = await api.put('/users/quick-phone-numbers', { numbers: list });
    const saved = response?.data?.data;
    setNumbers(Array.isArray(saved) ? saved : []);
    return saved;
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { numbers, loading, reload, save };
}
