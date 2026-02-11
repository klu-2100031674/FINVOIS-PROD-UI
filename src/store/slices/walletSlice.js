import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

/**
 * Wallet Slice - User wallet/credits state management
 */

const initialState = {
  wallet: null,
  loading: false,
  error: null,
};

// ============================================================================
// Async Thunks
// ============================================================================

export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.wallet.getMyWallet();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet');
    }
  }
);

export const createWallet = createAsyncThunk(
  'wallet/createWallet',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.wallet.createWallet(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create wallet');
    }
  }
);

// ============================================================================
// Slice
// ============================================================================

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
    updateWalletBalance: (state, action) => {
      if (state.wallet) {
        state.wallet = { ...state.wallet, ...action.payload };
      }
    },
    deductReportCredit: (state) => {
      if (state.wallet && state.wallet.report_credits > 0) {
        state.wallet.report_credits -= 1;
      }
    },
    deductAICredits: (state) => {
      if (state.wallet && state.wallet.report_credits >= 100) {
        state.wallet.report_credits -= 100;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Wallet
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        // Handle new API response structure
        if (action.payload.success && action.payload.data) {
          state.wallet = action.payload.data;
        } else {
          // Fallback for old format
          state.wallet = action.payload;
        }
        state.error = null;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch wallet';
      });

    // Create Wallet
    builder
      .addCase(createWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWallet.fulfilled, (state, action) => {
        state.loading = false;
        // Handle new API response structure
        if (action.payload.success && action.payload.data) {
          state.wallet = action.payload.data;
        } else {
          // Fallback for old format
          state.wallet = action.payload;
        }
        state.error = null;
      })
      .addCase(createWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create wallet';
      });
  },
});

export const { clearWalletError, updateWalletBalance, deductReportCredit, deductAICredits } =
  walletSlice.actions;
export default walletSlice.reducer;

// Selectors
export const selectWallet = (state) => state.wallet.wallet;
export const selectReportCredits = (state) => state.wallet.wallet?.report_credits || 0;
export const selectWalletLoading = (state) => state.wallet.loading;
