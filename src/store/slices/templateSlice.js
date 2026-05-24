import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

/**
 * Template Slice - Excel template state management
 */

const initialState = {
  templates: [],
  selectedTemplate: null,
  templateForm: null,
  loading: false,
  listLoading: false,
  detailLoading: false,
  error: null,
  filters: {
    category: '',
    search: '',
  },
};

// ============================================================================
// Async Thunks
// ============================================================================

export const fetchTemplates = createAsyncThunk(
  'template/fetchTemplates',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.template.getTemplates(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchTemplateById = createAsyncThunk(
  'template/fetchTemplateById',
  async (templateId, { rejectWithValue }) => {
    try {
      const response = await api.template.getTemplateById(templateId);
      console.log('🔍 fetchTemplateById API response:', response);
      return response; // Return full response, not response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch template');
    }
  }
);

export const fetchTemplateForm = createAsyncThunk(
  'template/fetchTemplateForm',
  async (templateId, { rejectWithValue }) => {
    try {
      const response = await api.template.getTemplateForm(templateId);
      console.log('🔍 fetchTemplateForm API response:', response);
      return response; // Return full response, not response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch template form');
    }
  }
);

// ============================================================================
// Slice
// ============================================================================

const templateSlice = createSlice({
  name: 'template',
  initialState,
  reducers: {
    clearTemplateError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedTemplate: (state) => {
      state.selectedTemplate = null;
      state.templateForm = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Templates
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        console.log('📄 fetchTemplates.fulfilled - payload:', action.payload);
        state.loading = false;
        state.listLoading = false;
        // Handle API response structure - extract templates array from data
        if (action.payload.success && action.payload.data) {
          const responseData = action.payload.data;
          state.templates = Array.isArray(responseData.templates) ? responseData.templates : [];
          state.pagination = {
            total: responseData.total || 0,
            page: responseData.page || 1,
            limit: responseData.limit || 20,
            totalPages: responseData.totalPages || 1
          };
          state.availableFilters = responseData.filters || {};
        } else if (Array.isArray(action.payload)) {
          // Fallback for old format
          state.templates = action.payload;
        } else {
          console.warn('⚠️ Unexpected templates response structure:', action.payload);
          state.templates = [];
        }
        state.error = null;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.listLoading = false;
        state.error = action.payload || 'Failed to fetch templates';
      });

    // Fetch Template By ID
    builder
      .addCase(fetchTemplateById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplateById.fulfilled, (state, action) => {
        state.detailLoading = false;
        // Handle new API response structure
        if (action.payload.success && action.payload.data) {
          state.selectedTemplate = action.payload.data;
        } else {
          // Fallback for old format
          state.selectedTemplate = action.payload;
        }
        state.error = null;
      })
      .addCase(fetchTemplateById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || 'Failed to fetch template';
      });

    // Fetch Template Form
    builder
      .addCase(fetchTemplateForm.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplateForm.fulfilled, (state, action) => {
        console.log('🔧 fetchTemplateForm.fulfilled - payload:', action.payload);
        state.detailLoading = false;
        // Handle new API response structure - extract HTML from data
        if (action.payload.success && action.payload.data) {
          console.log('✅ Extracting HTML from action.payload.data.html');
          state.templateForm = action.payload.data.html;
        } else if (typeof action.payload === 'string') {
          // Fallback for old format (raw HTML)
          console.log('📝 Using payload as raw HTML');
          state.templateForm = action.payload;
        } else {
          console.warn('⚠️ Unexpected template form response structure:', action.payload);
          state.templateForm = null;
        }
        console.log('🎯 Template form set to:', state.templateForm ? 'LOADED' : 'NULL');
        state.error = null;
      })
      .addCase(fetchTemplateForm.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || 'Failed to fetch template form';
      });
  },
});

export const { clearTemplateError, setFilters, clearSelectedTemplate } =
  templateSlice.actions;
export default templateSlice.reducer;

// Selectors
export const selectTemplates = (state) => state.template.templates;
export const selectSelectedTemplate = (state) => state.template.selectedTemplate;
export const selectTemplateForm = (state) => state.template.templateForm;
/** List fetch (dashboard template picker) — not single-template detail. */
export const selectTemplateListLoading = (state) => state.template.listLoading;
export const selectTemplateDetailLoading = (state) => state.template.detailLoading;
/** @deprecated Prefer list vs detail selectors; kept for list-only screens. */
export const selectTemplateLoading = (state) => state.template.listLoading;
export const selectTemplateFilters = (state) => state.template.filters;
