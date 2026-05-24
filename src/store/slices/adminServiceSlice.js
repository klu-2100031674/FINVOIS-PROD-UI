import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/api/api';

export const fetchAllServices = createAsyncThunk(
  'adminServices/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/services');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchServiceById = createAsyncThunk(
  'adminServices/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/services/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateServiceContent = createAsyncThunk(
  'adminServices/updateContent',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/services/${id}/content`, content);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateServiceForm = createAsyncThunk(
  'adminServices/updateForm',
  async ({ id, formConfig }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/services/${id}/form`, formConfig);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createService = createAsyncThunk(
  'adminServices/create',
  async (serviceData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/services', serviceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateServiceSettings = createAsyncThunk(
  'adminServices/updateSettings',
  async ({ id, description, keywords }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/services/${id}/settings`, { description, keywords });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteService = createAsyncThunk(
  'adminServices/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/services/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const adminServiceSlice = createSlice({
  name: 'adminService',
  initialState: {
    services: [],
    currentService: null,
    loading: false,
    error: null,
    updateSuccess: false
  },
  reducers: {
    clearUpdateSuccess: (state) => {
      state.updateSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllServices.fulfilled, (state, action) => {
        state.services = action.payload?.data || action.payload || [];
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAllServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch services';
      })
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
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.services.push(action.payload?.data || action.payload);
        state.updateSuccess = true;
      })
      .addCase(createService.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create service';
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.services = state.services.filter(s => s._id !== action.payload);
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete service';
      })
      .addCase(updateServiceContent.fulfilled, (state) => {
        state.updateSuccess = true;
      })
      .addCase(updateServiceContent.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update content';
        state.updateSuccess = false;
      })
      .addCase(updateServiceForm.fulfilled, (state) => {
        state.updateSuccess = true;
      })
      .addCase(updateServiceForm.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update form';
        state.updateSuccess = false;
      })
      .addCase(updateServiceSettings.fulfilled, (state) => {
        state.updateSuccess = true;
      })
      .addCase(updateServiceSettings.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update settings';
        state.updateSuccess = false;
      });
  }
});

export const { clearUpdateSuccess } = adminServiceSlice.actions;
export default adminServiceSlice.reducer;
