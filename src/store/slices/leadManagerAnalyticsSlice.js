import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/api/api';

export const fetchLMSummary = createAsyncThunk(
  'lmAnalytics/summary',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/analytics/lead-manager/summary');
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.error || e.message); }
  }
);

export const fetchLMMonthly = createAsyncThunk(
  'lmAnalytics/monthly',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/analytics/lead-manager/monthly');
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.error || e.message); }
  }
);

export const fetchLMSourceBreakdown = createAsyncThunk(
  'lmAnalytics/sourceBreakdown',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/analytics/lead-manager/source-breakdown');
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.error || e.message); }
  }
);

export const fetchLMProviders = createAsyncThunk(
  'lmAnalytics/providers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/analytics/lead-manager/by-service-provider');
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.error || e.message); }
  }
);

export const fetchLMRecentActivity = createAsyncThunk(
  'lmAnalytics/recentActivity',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/analytics/lead-manager/recent-activity');
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.error || e.message); }
  }
);

export const fetchLMProviderDetail = createAsyncThunk(
  'lmAnalytics/providerDetail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/analytics/lead-manager/provider/${id}`);
      return res.data.data;
    } catch (e) { return rejectWithValue(e.response?.data?.error || e.message); }
  }
);

const slice = createSlice({
  name: 'lmAnalytics',
  initialState: {
    summary:        null,
    monthly:        null,
    sourceBreakdown:null,
    providers:      [],
    recentActivity: [],
    providerDetail: null,
    detailLoading:  false,
    loading:        false,
    error:          null,
  },
  reducers: {},
  extraReducers: (builder) => {
    const pending  = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchLMSummary.pending,  pending)
      .addCase(fetchLMSummary.rejected, rejected)
      .addCase(fetchLMSummary.fulfilled, (state, { payload }) => {
        state.loading = false; state.summary = payload;
      })
      .addCase(fetchLMMonthly.fulfilled, (state, { payload }) => {
        state.monthly = payload;
      })
      .addCase(fetchLMSourceBreakdown.fulfilled, (state, { payload }) => {
        state.sourceBreakdown = payload;
      })
      .addCase(fetchLMProviders.fulfilled, (state, { payload }) => {
        state.providers = payload;
      })
      .addCase(fetchLMRecentActivity.fulfilled, (state, { payload }) => {
        state.recentActivity = payload;
      })
      .addCase(fetchLMProviderDetail.pending, (state) => { state.detailLoading = true; state.providerDetail = null; })
      .addCase(fetchLMProviderDetail.fulfilled, (state, { payload }) => { state.detailLoading = false; state.providerDetail = payload; })
      .addCase(fetchLMProviderDetail.rejected, (state, { payload }) => { state.detailLoading = false; state.error = payload; });
  },
});

export default slice.reducer;
