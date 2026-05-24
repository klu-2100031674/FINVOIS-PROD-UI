import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/api/api';

/**
 * Service Slice - Service management state
 */

export const fetchServices = createAsyncThunk(
  'services/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/services');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchTopServices = createAsyncThunk(
  'services/fetchTop',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/services/top');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchLinkedServices = createAsyncThunk(
  'services/fetchLinked',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/services/linked');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const fetchServiceById = createAsyncThunk(
  'services/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const serviceSlice = createSlice({
  name: 'services',
  initialState: {
    services: [],
    topServices: [],
    linkedServices: [],
    currentService: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentService: (state) => {
      state.currentService = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all services
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.services = action.payload?.data || action.payload || [];
        state.loading = false;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch services';
      })
      // Fetch top services
      .addCase(fetchTopServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopServices.fulfilled, (state, action) => {
        state.topServices = action.payload?.data || action.payload || [];
        state.loading = false;
      })
      .addCase(fetchTopServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch top services';
      })
      // Fetch linked services
      .addCase(fetchLinkedServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLinkedServices.fulfilled, (state, action) => {
        state.linkedServices = action.payload?.data || action.payload || [];
        state.loading = false;
      })
      .addCase(fetchLinkedServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch linked services';
      })
      // Fetch service by ID
      .addCase(fetchServiceById.pending, (state) => {
        state.loading = true;
        state.currentService = null;
        state.error = null;
      })
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        state.currentService = action.payload?.data || action.payload;
        state.loading = false;
      })
      .addCase(fetchServiceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch service';
      });
  },
});

export const { clearCurrentService } = serviceSlice.actions;
export default serviceSlice.reducer;

// Selectors
export const selectServices = (state) => state.services.services;
export const selectTopServices = (state) => state.services.topServices;
export const selectLinkedServices = (state) => state.services.linkedServices;
export const selectCurrentService = (state) => state.services.currentService;
export const selectServicesLoading = (state) => state.services.loading;
export const selectServicesError = (state) => state.services.error;
