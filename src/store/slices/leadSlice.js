import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/api/api';

// Fetch all leads
export const fetchAllLeads = createAsyncThunk(
  'lead/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 100, search } = params;
      const query = new URLSearchParams({ page, limit });
      if (search) query.set('search', search);
      const response = await apiClient.get(`/leads?${query.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Fetch single lead
export const fetchLeadById = createAsyncThunk(
  'lead/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/leads/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Create lead
export const createLead = createAsyncThunk(
  'lead/create',
  async (leadData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/leads', leadData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Update lead
export const updateLead = createAsyncThunk(
  'lead/update',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/leads/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Toggle lead active/inactive status
export const toggleLeadStatus = createAsyncThunk(
  'lead/toggleStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/leads/${id}`, { isActive });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

// Delete lead
export const deleteLead = createAsyncThunk(
  'lead/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/leads/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const resendLeadCredentials = createAsyncThunk(
  'lead/resendCredentials',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/leads/${id}/resend-credentials`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const leadSlice = createSlice({
  name: 'lead',
  initialState: {
    leads: [],
    currentLead: null,
    loading: false,
    error: null,
    success: false
  },
  reducers: {
    clearLeadError: (state) => {
      state.error = null;
    },
    clearLeadSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all leads
      .addCase(fetchAllLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = action.payload?.data || action.payload || [];
      })
      .addCase(fetchAllLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch leads';
      })
      // Fetch lead by ID
      .addCase(fetchLeadById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLead = action.payload?.data || action.payload;
      })
      .addCase(fetchLeadById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch lead';
      })
      // Create lead
      .addCase(createLead.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        if (action.payload?.data) {
          state.leads.unshift(action.payload.data);
        }
      })
      .addCase(createLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create lead';
      })
      // Update lead
      .addCase(updateLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        if (action.payload?.data) {
          const index = state.leads.findIndex(l => l._id === action.payload.data._id);
          if (index !== -1) {
            state.leads[index] = action.payload.data;
          }
        }
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update lead';
      })
      // Toggle lead status
      .addCase(toggleLeadStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleLeadStatus.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.data) {
          const index = state.leads.findIndex(l => l._id === action.payload.data._id);
          if (index !== -1) {
            state.leads[index] = action.payload.data;
          }
        }
      })
      .addCase(toggleLeadStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update lead status';
      })
      // Delete lead
      .addCase(deleteLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.loading = false;
        state.leads = state.leads.filter(l => l._id !== action.payload?.id);
      })
      .addCase(deleteLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete lead';
      })
      // Resend credentials — no loading state, handled locally in the component
      .addCase(resendLeadCredentials.rejected, (state, action) => {
        state.error = action.payload || 'Failed to resend credentials';
      });
  }
});

export const { clearLeadError, clearLeadSuccess } = leadSlice.actions;
export default leadSlice.reducer;
