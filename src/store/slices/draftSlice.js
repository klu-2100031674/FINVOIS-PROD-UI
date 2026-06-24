import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/api';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchDrafts = createAsyncThunk(
  'drafts/fetchDrafts',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.draft.listDrafts(filters);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || error.error || 'Failed to fetch drafts');
    }
  }
);

export const fetchDraftByIdV2 = createAsyncThunk(
  'drafts/fetchDraftByIdV2',
  async (draftId, { rejectWithValue }) => {
    try {
      const response = await api.draft.getDraftById(draftId);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || error.error || 'Failed to fetch draft');
    }
  }
);

export const saveDraftV2 = createAsyncThunk(
  'drafts/saveDraftV2',
  async ({ formType, formData, draftId, currentStep }, { rejectWithValue }) => {
    try {
      const body = { formType, formData };
      if (currentStep !== undefined) body.currentStep = currentStep;

      if (draftId) {
        const response = await api.draft.updateDraft(draftId, body);
        return response.data || response;
      }
      const response = await api.draft.createDraft(body);
      return response.data || response;
    } catch (error) {
      const msg =
        typeof error === 'string'
          ? error
          : error?.message || error?.error || 'Failed to save draft';
      return rejectWithValue(msg);
    }
  }
);

export const updateDraftV2 = createAsyncThunk(
  'drafts/updateDraftV2',
  async ({ draftId, patch }, { rejectWithValue }) => {
    try {
      const response = await api.draft.updateDraft(draftId, patch);
      return response.data || response;
    } catch (error) {
      return rejectWithValue(error.message || error.error || 'Failed to update draft');
    }
  }
);

export const deleteDraftV2 = createAsyncThunk(
  'drafts/deleteDraftV2',
  async (draftId, { rejectWithValue }) => {
    try {
      await api.draft.deleteDraftById(draftId);
      return draftId;
    } catch (error) {
      return rejectWithValue(error.message || error.error || 'Failed to delete draft');
    }
  }
);

const draftSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    clearDraftsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrafts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrafts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
      })
      .addCase(fetchDrafts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch drafts';
      })
      .addCase(saveDraftV2.fulfilled, (state, action) => {
        const saved = action.payload?.data || action.payload;
        if (!saved?._id) return;
        const idx = state.items.findIndex((d) => d._id === saved._id);
        if (idx >= 0) state.items[idx] = saved;
        else state.items.unshift(saved);
      })
      .addCase(updateDraftV2.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        if (!updated?._id) return;
        const idx = state.items.findIndex((d) => d._id === updated._id);
        if (idx >= 0) state.items[idx] = updated;
      })
      .addCase(deleteDraftV2.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d._id !== action.payload);
      });
  },
});

export const { clearDraftsError } = draftSlice.actions;

export const selectDrafts = (state) => state.drafts.items;
export const selectDraftsLoading = (state) => state.drafts.loading;
export const selectDraftsError = (state) => state.drafts.error;

export default draftSlice.reducer;

