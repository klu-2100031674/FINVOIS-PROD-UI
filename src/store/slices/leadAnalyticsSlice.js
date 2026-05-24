import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/api/apiClient';

/**
 * Lead Analytics Slice - Lead dashboard analytics state
 */

const LEAD_TOKEN_KEY = 'lead_token';

const getLeadAuthHeader = () => {
  const token = localStorage.getItem(LEAD_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchLeadAnalytics = createAsyncThunk(
  'leadAnalytics/summary',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/analytics/leads/${leadId}`, {
        headers: getLeadAuthHeader()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchMonthlyLeads = createAsyncThunk(
  'leadAnalytics/monthly',
  async ({ leadId, year }, { rejectWithValue }) => {
    try {
      const params = year ? `?year=${year}` : '';
      const response = await apiClient.get(`/analytics/leads/${leadId}/monthly${params}`, {
        headers: getLeadAuthHeader()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchServiceWiseLeads = createAsyncThunk(
  'leadAnalytics/serviceWise',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/analytics/leads/${leadId}/service-wise`, {
        headers: getLeadAuthHeader()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchTrendComparison = createAsyncThunk(
  'leadAnalytics/trend',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/analytics/leads/${leadId}/trend`, {
        headers: getLeadAuthHeader()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchSourceWise = createAsyncThunk(
  'leadAnalytics/sourceWise',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/analytics/leads/${leadId}/source-wise`, {
        headers: getLeadAuthHeader()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  'leadAnalytics/recentActivity',
  async (leadId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/analytics/leads/${leadId}/recent`, {
        headers: getLeadAuthHeader()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchSubmissions = createAsyncThunk(
  'leadAnalytics/submissions',
  async ({ leadId, page = 1, limit = 20, source = '', search = '' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit });
      if (source) params.set('source', source);
      if (search) params.set('search', search);
      const response = await apiClient.get(`/analytics/leads/${leadId}/submissions?${params}`, {
        headers: getLeadAuthHeader()
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const leadAnalyticsSlice = createSlice({
  name: 'leadAnalytics',
  initialState: {
    summary: null,
    monthlyData: null,
    serviceWiseData: null,
    trendData: null,
    sourceWiseData: null,
    recentActivity: [],
    submissions: { items: [], total: 0, page: 1, limit: 20, loading: false },
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeadAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLeadAnalytics.fulfilled, (state, action) => {
        state.summary = action.payload;
        state.loading = false;
      })
      .addCase(fetchLeadAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMonthlyLeads.fulfilled, (state, action) => {
        state.monthlyData = {
          labels: action.payload.labels || [],
          datasets: [{
            label: 'Leads',
            data: action.payload.data || [],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          }]
        };
      })
      .addCase(fetchServiceWiseLeads.fulfilled, (state, action) => {
        state.serviceWiseData = {
          labels: action.payload.labels || [],
          datasets: [{
            data: action.payload.data || [],
            backgroundColor: [
              'rgba(59, 130, 246, 0.7)',
              'rgba(16, 185, 129, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(139, 92, 246, 0.7)'
            ],
            borderWidth: 1
          }]
        };
      })
      .addCase(fetchSourceWise.fulfilled, (state, action) => {
        const { form_submission = 0, dpr_generation = 0 } = action.payload;
        state.sourceWiseData = {
          labels: ['Form Submissions', 'DPR Generation'],
          datasets: [{
            data: [form_submission, dpr_generation],
            backgroundColor: ['rgba(139, 92, 246, 0.75)', 'rgba(16, 185, 129, 0.75)'],
            borderColor: ['rgb(139, 92, 246)', 'rgb(16, 185, 129)'],
            borderWidth: 2
          }]
        };
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.recentActivity = action.payload;
      })
      .addCase(fetchSubmissions.pending, (state) => {
        state.submissions.loading = true;
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.submissions.loading = false;
        state.submissions.items = action.payload.items;
        state.submissions.total = action.payload.total;
        state.submissions.page = action.payload.page;
        state.submissions.limit = action.payload.limit;
      })
      .addCase(fetchSubmissions.rejected, (state) => {
        state.submissions.loading = false;
      })
      .addCase(fetchTrendComparison.fulfilled, (state, action) => {
        const data = action.payload;
        if (data?.thisMonth && data?.lastMonth) {
          state.trendData = {
            labels: data.thisMonth.data?.map(d => `Day ${d.day}`) || [],
            datasets: [
              {
                label: data.thisMonth.label || 'This Month',
                data: data.thisMonth.data?.map(d => d.count) || [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3
              },
              {
                label: data.lastMonth.label || 'Last Month',
                data: data.lastMonth.data?.map(d => d.count) || [],
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.3
              }
            ]
          };
        }
      });
  }
});

export default leadAnalyticsSlice.reducer;

// Selectors
export const selectLeadSummary = (state) => state.leadAnalytics.summary;
export const selectMonthlyData = (state) => state.leadAnalytics.monthlyData;
export const selectServiceWiseData = (state) => state.leadAnalytics.serviceWiseData;
export const selectTrendData = (state) => state.leadAnalytics.trendData;
export const selectSourceWiseData = (state) => state.leadAnalytics.sourceWiseData;
export const selectRecentActivity = (state) => state.leadAnalytics.recentActivity;
export const selectSubmissions = (state) => state.leadAnalytics.submissions;
export const selectAnalyticsLoading = (state) => state.leadAnalytics.loading;
