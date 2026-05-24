import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient, { setAuthToken } from '@/api/api';

/**
 * Lead Auth Slice - Lead authentication state
 */

const LEAD_TOKEN_KEY = 'lead_token';
const LEAD_USER_KEY = 'lead_user';

// Get stored token
const getStoredToken = () => localStorage.getItem(LEAD_TOKEN_KEY);
const getStoredUser = () => {
  const user = localStorage.getItem(LEAD_USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const loginLead = createAsyncThunk(
  'leadAuth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/leads/login', { email, password });
      const { token, lead } = response.data;

      if (token) {
        localStorage.setItem(LEAD_TOKEN_KEY, token);
        localStorage.setItem(LEAD_USER_KEY, JSON.stringify(lead));
      }

      return { token, lead };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const resetLeadPassword = createAsyncThunk(
  'leadAuth/resetPassword',
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/users/reset-password', { resetToken: token, newPassword });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Reset failed');
    }
  }
);

export const forgotLeadPassword = createAsyncThunk(
  'leadAuth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/users/forgot-password', { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Request failed');
    }
  }
);

export const fetchLeadProfile = createAsyncThunk(
  'leadAuth/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = getState().leadAuth.token;
      const response = await apiClient.get('/leads/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data; // { id, uuid, name, email, ... }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch profile');
    }
  }
);

const leadAuthSlice = createSlice({
  name: 'leadAuth',
  initialState: {
    user: getStoredUser(),
    token: getStoredToken(),
    loading: false,
    error: null,
    isAuthenticated: !!getStoredToken()
  },
  reducers: {
    setLeadAuth: (state, action) => {
      const { token, lead } = action.payload;
      state.user = lead;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem(LEAD_TOKEN_KEY, token);
      localStorage.setItem(LEAD_USER_KEY, JSON.stringify(lead));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem(LEAD_TOKEN_KEY);
      localStorage.removeItem(LEAD_USER_KEY);
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginLead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginLead.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.lead;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginLead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(resetLeadPassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(resetLeadPassword.fulfilled, (state) => {
        state.loading = false;
        if (state.user) {
          state.user = { ...state.user, passwordResetRequired: false };
          localStorage.setItem(LEAD_USER_KEY, JSON.stringify(state.user));
        }
      })
      .addCase(resetLeadPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchLeadProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem(LEAD_USER_KEY, JSON.stringify(action.payload));
      })
      .addCase(fetchLeadProfile.rejected, (state) => {
        // If profile fetch fails (token expired etc.), clear auth
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem(LEAD_TOKEN_KEY);
        localStorage.removeItem(LEAD_USER_KEY);
      });
  }
});

export const { setLeadAuth, logout, clearError } = leadAuthSlice.actions;
export const logoutLead = logout;
export default leadAuthSlice.reducer;

// Selectors
export const selectLeadUser = (state) => state.leadAuth.user;
export const selectLeadToken = (state) => state.leadAuth.token;
export const selectIsLeadAuthenticated = (state) => state.leadAuth.isAuthenticated;
export const selectLeadLoading = (state) => state.leadAuth.loading;
