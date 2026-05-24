import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/api/apiClient';

/**
 * Form Slice - Service form submissions state management
 */

export const submitServiceForm = createAsyncThunk(
  'form/submitServiceForm',
  async ({ serviceId, formData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/form-submissions/services/${serviceId}/submit-form`, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const formSlice = createSlice({
  name: 'form',
  initialState: {
    submitting: false,
    submitSuccess: false,
    error: null,
  },
  reducers: {
    resetFormState: (state) => {
      state.submitting = false;
      state.submitSuccess = false;
      state.error = null;
    },
    clearFormSuccess: (state) => {
      state.submitSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitServiceForm.pending, (state) => {
        state.submitting = true;
        state.submitSuccess = false;
        state.error = null;
      })
      .addCase(submitServiceForm.fulfilled, (state) => {
        state.submitting = false;
        state.submitSuccess = true;
      })
      .addCase(submitServiceForm.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload || 'Failed to submit form';
      });
  },
});

export const { resetFormState, clearFormSuccess } = formSlice.actions;
export default formSlice.reducer;

// Selectors
export const selectFormSubmitting = (state) => state.form.submitting;
export const selectFormSubmitSuccess = (state) => state.form.submitSuccess;
export const selectFormError = (state) => state.form.error;
