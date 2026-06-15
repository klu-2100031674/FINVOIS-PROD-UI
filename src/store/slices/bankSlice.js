import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/api/api';

export const fetchAllBanks = createAsyncThunk(
  'bank/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/banks');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createBank = createAsyncThunk(
  'bank/create',
  async (bankData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/banks', bankData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateBank = createAsyncThunk(
  'bank/update',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/banks/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteBank = createAsyncThunk(
  'bank/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/banks/${id}`);
      return { ...response.data, id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchDPRList = createAsyncThunk(
  'bank/fetchDPRList',
  async ({ page = 1, limit = 20, search = '' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit, ...(search ? { search } : {}) });
      const res = await apiClient.get(`/banks/dpr-list?${params}`);
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data?.error || e.message); }
  }
);

export const sendDPRToBanks = createAsyncThunk(
  'bank/sendDPR',
  async ({ dprId, bankIds }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post('/banks/send-dpr', { dprId, bankIds });
      return res.data;
    } catch (e) { return rejectWithValue(e.response?.data?.error || e.message); }
  }
);

export const fetchDPRBankHistory = createAsyncThunk(
  'bank/dprHistory',
  async (dprId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/banks/history/${dprId}`);
      return { dprId, history: res.data.data };
    } catch (e) { return rejectWithValue(e.response?.data?.error || e.message); }
  }
);

export const deleteHistoryEntry = createAsyncThunk(
  'bank/deleteHistoryEntry',
  async ({ historyId, dprId }, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/banks/history-entry/${historyId}`);
      return { historyId, dprId };
    } catch (e) { return rejectWithValue(e.response?.data?.error || e.message); }
  }
);

const bankSlice = createSlice({
  name: 'bank',
  initialState: {
    banks:      [],
    dprList:    [],
    dprTotal:   0,
    dprHistory: {},      // keyed by dprId
    loading:    false,
    sending:    false,
    error:      null,
    success:    false,
  },
  reducers: {
    clearBankError: (state) => { state.error = null; },
    clearBankSuccess: (state) => { state.success = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllBanks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAllBanks.fulfilled, (state, action) => {
        state.loading = false;
        state.banks = action.payload?.data || [];
      })
      .addCase(fetchAllBanks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch banks';
      })
      .addCase(createBank.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(createBank.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        if (action.payload?.data) state.banks.unshift(action.payload.data);
      })
      .addCase(createBank.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create bank';
      })
      .addCase(updateBank.fulfilled, (state, action) => {
        if (action.payload?.data) {
          const idx = state.banks.findIndex(b => b._id === action.payload.data._id);
          if (idx !== -1) state.banks[idx] = action.payload.data;
        }
      })
      .addCase(updateBank.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update bank';
      })
      .addCase(deleteBank.fulfilled, (state, action) => {
        state.banks = state.banks.filter(b => b._id !== action.payload?.id);
      })
      .addCase(deleteBank.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete bank';
      })
      // DPR list
      .addCase(fetchDPRList.pending,    (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDPRList.fulfilled,  (state, { payload }) => {
        state.loading  = false;
        state.dprList  = payload.data || [];
        state.dprTotal = payload.pagination?.total || 0;
      })
      .addCase(fetchDPRList.rejected,   (state, { payload }) => { state.loading = false; state.error = payload; })
      // Send DPR to banks
      .addCase(sendDPRToBanks.pending,    (state) => { state.sending = true; state.error = null; })
      .addCase(sendDPRToBanks.fulfilled,  (state) => { state.sending = false; state.success = true; })
      .addCase(sendDPRToBanks.rejected,   (state, { payload }) => { state.sending = false; state.error = payload; })
      // History
      .addCase(fetchDPRBankHistory.fulfilled, (state, { payload }) => {
        state.dprHistory[payload.dprId] = payload.history;
      })
      // Delete failed history entry
      .addCase(deleteHistoryEntry.fulfilled, (state, { payload }) => {
        const list = state.dprHistory[payload.dprId];
        if (list) {
          state.dprHistory[payload.dprId] = list.filter(h => h._id !== payload.historyId);
        }
      });
  },
});

export const { clearBankError, clearBankSuccess } = bankSlice.actions;
export default bankSlice.reducer;
