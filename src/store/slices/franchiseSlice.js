import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/api/api';

function appendFile(formData, fieldName, file, filename) {
  if (!file) return;
  const name = filename || file.name || `${fieldName}.bin`;
  formData.append(fieldName, file, name);
}

function buildFranchiseFormData(data, files = {}) {
  const formData = new FormData();
  formData.append('data', JSON.stringify(data));

  appendFile(formData, 'logo', files.logo);
  appendFile(formData, 'banner', files.banner);
  appendFile(formData, 'brochure', files.brochure);
  appendFile(formData, 'presentation', files.presentation);
  if (files.gallery?.length) {
    files.gallery.forEach((file, index) => {
      appendFile(formData, 'gallery', file, `gallery-${index}`);
    });
  }

  return formData;
}

export const fetchFranchiseCategories = createAsyncThunk(
  'franchise/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/franchises/categories');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  },
);

export const fetchFranchises = createAsyncThunk(
  'franchise/fetchAll',
  async (arg = {}, { rejectWithValue }) => {
    try {
      const opts = typeof arg === 'boolean' ? { includeInactive: arg } : arg;
      const params = { ...opts };
      if (params.includeInactive === true) {
        params.includeInactive = 'true';
      } else if (params.includeInactive === false) {
        delete params.includeInactive;
      }
      const response = await apiClient.get('/franchises', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  },
);

export const fetchFranchiseById = createAsyncThunk(
  'franchise/fetchById',
  async ({ id, includeInactive = false } = {}, { rejectWithValue }) => {
    try {
      const franchiseId = typeof id === 'object' ? id?.id : id;
      const params = includeInactive ? { includeInactive: 'true' } : {};
      const response = await apiClient.get(`/franchises/${franchiseId}`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  },
);

export const createFranchise = createAsyncThunk(
  'franchise/create',
  async ({ data, files }, { rejectWithValue }) => {
    try {
      const formData = buildFranchiseFormData(data, files);
      const response = await apiClient.post('/franchises', formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  },
);

export const updateFranchise = createAsyncThunk(
  'franchise/update',
  async ({ id, data, files }, { rejectWithValue }) => {
    try {
      const formData = buildFranchiseFormData(data, files);
      const response = await apiClient.put(`/franchises/${id}`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  },
);

export const deleteFranchise = createAsyncThunk(
  'franchise/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/franchises/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  },
);

export const fetchApplications = createAsyncThunk(
  'franchise/fetchApplications',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/franchises/applications', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  },
);

export const submitApplication = createAsyncThunk(
  'franchise/submitApplication',
  async ({ franchiseId, data, resume }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      if (resume) {
        formData.append('resume', resume, resume.name || 'resume.pdf');
      }
      const response = await apiClient.post(`/franchises/${franchiseId}/apply`, formData);
      return response.data;
    } catch (error) {
      const data = error.response?.data;
      return rejectWithValue({
        message: data?.error || error.message,
        code: data?.code,
        status: error.response?.status,
      });
    }
  },
);

export const updateApplicationStatus = createAsyncThunk(
  'franchise/updateApplicationStatus',
  async ({ id, status, adminNotes }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/franchises/applications/${id}`, {
        status,
        adminNotes,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  },
);

const franchiseSlice = createSlice({
  name: 'franchise',
  initialState: {
    franchises: [],
    currentFranchise: null,
    applications: [],
    categories: [],
    categoriesLoading: false,
    pagination: { page: 1, limit: 24, total: 0, totalPages: 1 },
    loading: false,
    saving: false,
    error: null,
    submitError: null,
    submitSuccess: false,
  },
  reducers: {
    clearCurrentFranchise: (state) => {
      state.currentFranchise = null;
    },
    resetSubmitState: (state) => {
      state.submitSuccess = false;
      state.submitError = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFranchiseCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(fetchFranchiseCategories.fulfilled, (state, action) => {
        state.categories = action.payload?.data || [];
        state.categoriesLoading = false;
      })
      .addCase(fetchFranchiseCategories.rejected, (state) => {
        state.categoriesLoading = false;
      })
      .addCase(fetchFranchises.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFranchises.fulfilled, (state, action) => {
        state.franchises = action.payload?.data || [];
        state.pagination = action.payload?.pagination || state.pagination;
        state.loading = false;
      })
      .addCase(fetchFranchises.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFranchiseById.pending, (state) => {
        state.loading = true;
        state.currentFranchise = null;
        state.error = null;
      })
      .addCase(fetchFranchiseById.fulfilled, (state, action) => {
        state.currentFranchise = action.payload?.data || null;
        state.loading = false;
      })
      .addCase(fetchFranchiseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createFranchise.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createFranchise.fulfilled, (state, action) => {
        state.saving = false;
        const created = action.payload?.data;
        if (created) {
          state.franchises.push(created);
          if (created.category && !state.categories.includes(created.category)) {
            state.categories = [...state.categories, created.category].sort((a, b) =>
              a.localeCompare(b),
            );
          }
        }
      })
      .addCase(createFranchise.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(updateFranchise.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateFranchise.fulfilled, (state, action) => {
        state.saving = false;
        const updated = action.payload?.data;
        if (updated) {
          state.currentFranchise = updated;
          state.franchises = state.franchises.map((f) =>
            (f._id === updated._id || f.uuid === updated.uuid) ? updated : f,
          );
        }
      })
      .addCase(updateFranchise.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(deleteFranchise.fulfilled, (state, action) => {
        state.franchises = state.franchises.filter(
          (f) => f._id !== action.payload && f.uuid !== action.payload,
        );
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.applications = action.payload?.data || [];
      })
      .addCase(submitApplication.pending, (state) => {
        state.saving = true;
        state.submitSuccess = false;
        state.submitError = null;
      })
      .addCase(submitApplication.fulfilled, (state) => {
        state.saving = false;
        state.submitSuccess = true;
      })
      .addCase(submitApplication.rejected, (state, action) => {
        state.saving = false;
        state.submitError = action.payload;
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (updated) {
          state.applications = state.applications.map((a) =>
            a._id === updated._id ? updated : a,
          );
        }
      });
  },
});

export const { clearCurrentFranchise, resetSubmitState } = franchiseSlice.actions;
export default franchiseSlice.reducer;
