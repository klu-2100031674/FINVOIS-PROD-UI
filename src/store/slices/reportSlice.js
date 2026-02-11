import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

/**
 * Report Slice - Report generation and management state
 */

const initialState = {
  reports: [],
  currentReport: null,
  generatedExcel: null, // { fileName, allSheetsData }
  loading: false,
  error: null,
  formData: null, // Store form data during wizard process
  relatedDocuments: []
};

// ============================================================================
// Async Thunks
// ============================================================================

export const applyFormData = createAsyncThunk(
  'report/applyFormData',
  async ({ templateId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.report.applyFormData(templateId, formData);
      // Return the full response instead of just response.data
      // This preserves the success, message, and data structure
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply form data');
    }
  }
);

export const createReport = createAsyncThunk(
  'report/createReport',
  async (reportData, { rejectWithValue }) => {
    try {
      const response = await api.report.createReport(reportData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create report');
    }
  }
);

export const fetchReports = createAsyncThunk(
  'report/fetchReports',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.report.getReports();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
    }
  }
);

export const fetchReportById = createAsyncThunk(
  'report/fetchReportById',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await api.report.getReportById(reportId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch report');
    }
  }
);

export const deleteReport = createAsyncThunk(
  'report/deleteReport',
  async (reportId, { rejectWithValue }) => {
    try {
      await api.report.deleteReport(reportId);
      return reportId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete report');
    }
  }
);

export const uploadReportJson = createAsyncThunk(
  'report/uploadReportJson',
  async ({ reportId, jsonData }, { rejectWithValue }) => {
    try {
      const response = await api.report.uploadReportJson(reportId, jsonData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload report JSON');
    }
  }
);

export const applyFinalEdits = createAsyncThunk(
  'report/applyFinalEdits',
  async ({ templateId, updates, recalculate = true }, { rejectWithValue }) => {
    try {
      const response = await api.report.applyFinalEdits(templateId, updates, recalculate);
      // Return the full response to preserve structure
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply final edits');
    }
  }
);

// ============================================================================
// Slice
// ============================================================================

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    clearReportError: (state) => {
      state.error = null;
    },
    setFormData: (state, action) => {
      state.formData = action.payload;
    },
    clearFormData: (state) => {
      state.formData = null;
    },
    clearGeneratedExcel: (state) => {
      state.generatedExcel = null;
    },
    setCurrentReport: (state, action) => {
      state.currentReport = action.payload;
    },
    setRelatedDocuments: (state, action) => {
      state.relatedDocuments = action.payload || [];
    },
    clearRelatedDocuments: (state) => {
      state.relatedDocuments = [];
    },
  },
  extraReducers: (builder) => {
    // Apply Form Data (Excel Generation)
    builder
      .addCase(applyFormData.pending, (state) => {
        console.log('⏳ [Redux applyFormData.pending] Excel generation started');
        state.loading = true;
        state.error = null;
      })
      .addCase(applyFormData.fulfilled, (state, action) => {
        console.log('✅ [Redux applyFormData.fulfilled] Excel generation completed');
        console.log('✅ [Redux applyFormData.fulfilled] Received payload:', {
          success: action.payload?.success,
          message: action.payload?.message,
          hasData: !!action.payload?.data,
          fileName: action.payload?.data?.fileName,
          hasHtmlContent: !!action.payload?.data?.htmlContent,
          htmlContentLength: action.payload?.data?.htmlContent?.length,
          hasHtmlJsonData: !!action.payload?.data?.htmlJsonData,
          htmlJsonDataCells: action.payload?.data?.htmlJsonData ? Object.keys(action.payload.data.htmlJsonData.data || {}).length : 0,
          pdfFileName: action.payload?.data?.pdfFileName
        });
        state.loading = false;
        state.generatedExcel = action.payload;
        console.log('✅ [Redux applyFormData.fulfilled] State updated - generatedExcel stored');
        console.log('✅ [Redux applyFormData.fulfilled] HTML Content in state:', !!state.generatedExcel?.data?.htmlContent);
        console.log('✅ [Redux applyFormData.fulfilled] HTML JSON Data in state:', !!state.generatedExcel?.data?.htmlJsonData);
        if (state.generatedExcel?.data?.htmlJsonData) {
          console.log('✅ [Redux applyFormData.fulfilled] JSON Data cells:', Object.keys(state.generatedExcel.data.htmlJsonData.data || {}).length);
        }
        state.error = null;
      })
      .addCase(applyFormData.rejected, (state, action) => {
        console.error('❌ [Redux applyFormData.rejected] Excel generation failed:', action.payload);
        state.loading = false;
        state.error = action.payload || 'Failed to generate Excel';
      });

    // Apply Final Edits
    builder
      .addCase(applyFinalEdits.pending, (state) => {
        console.log('⏳ [Redux applyFinalEdits.pending] Applying final edits');
        state.loading = true;
        state.error = null;
      })
      .addCase(applyFinalEdits.fulfilled, (state, action) => {
        console.log('✅ [Redux applyFinalEdits.fulfilled] Final edits applied successfully');
        console.log('✅ [Redux applyFinalEdits.fulfilled] Received payload:', {
          success: action.payload?.success,
          hasData: !!action.payload?.data,
          hasHtmlContent: !!action.payload?.data?.htmlContent,
          htmlContentLength: action.payload?.data?.htmlContent?.length,
          pdfFileName: action.payload?.data?.pdfFileName
        });
        console.log('✅ [Redux applyFinalEdits.fulfilled] Updating generatedExcel with new data');
        // Update the generatedExcel with the new calculated data including updated HTML
        state.generatedExcel = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(applyFinalEdits.rejected, (state, action) => {
        console.error('❌ [Redux applyFinalEdits.rejected] Final edits failed:', action.payload);
        state.loading = false;
        state.error = action.payload || 'Failed to apply final edits';
      });

    // Create Report
    builder
      .addCase(createReport.pending, (state) => {
        console.log('⏳ [Redux createReport.pending] Report creation started');
        state.loading = true;
        state.error = null;
      })
      .addCase(createReport.fulfilled, (state, action) => {
        console.log('✅ [Redux createReport.fulfilled] Report created successfully');
        console.log('✅ [Redux createReport.fulfilled] Report ID:', action.payload._id);
        console.log('✅ [Redux createReport.fulfilled] generatedExcel still in state:', !!state.generatedExcel);
        state.loading = false;
        state.currentReport = action.payload;
        state.reports.unshift(action.payload); // Add to beginning of list
        state.error = null;
      })
      .addCase(createReport.rejected, (state, action) => {
        console.error('❌ [Redux createReport.rejected] Report creation failed:', action.payload);
        state.loading = false;
        state.error = action.payload || 'Failed to create report';
      });

    // Fetch Reports
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        // Handle new API response structure
        if (action.payload.success && action.payload.data) {
          state.reports = Array.isArray(action.payload.data) ? action.payload.data : [];
        } else if (Array.isArray(action.payload)) {
          // Fallback for old format
          state.reports = action.payload;
        } else {
          state.reports = [];
        }
        state.error = null;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch reports';
      });

    // Fetch Report By ID
    builder
      .addCase(fetchReportById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentReport = action.payload;
        state.error = null;
      })
      .addCase(fetchReportById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch report';
      });

    // Delete Report
    builder
      .addCase(deleteReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = state.reports.filter(
          (report) => report._id !== action.payload
        );
        if (state.currentReport?._id === action.payload) {
          state.currentReport = null;
        }
        state.error = null;
      })
      .addCase(deleteReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete report';
      });

    // Upload Report JSON
    builder
      .addCase(uploadReportJson.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadReportJson.fulfilled, (state, action) => {
        state.loading = false;
        state.currentReport = action.payload;
        state.error = null;
      })
      .addCase(uploadReportJson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to upload report JSON';
      });
  },
});

export const {
  clearReportError,
  setFormData,
  clearFormData,
  clearGeneratedExcel,
  setCurrentReport,
  setRelatedDocuments,
  clearRelatedDocuments,
} = reportSlice.actions;

export default reportSlice.reducer;

// Selectors
export const selectReports = (state) => state.report.reports;
export const selectCurrentReport = (state) => state.report.currentReport;
export const selectGeneratedExcel = (state) => state.report.generatedExcel;
export const selectFormData = (state) => state.report.formData;
export const selectReportLoading = (state) => state.report.loading;
export const selectReportError = (state) => state.report.error;
export const selectRelatedDocuments = (state) => state.report.relatedDocuments;
