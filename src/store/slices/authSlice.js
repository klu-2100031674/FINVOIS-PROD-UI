import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getAuthToken, setAuthToken } from '../../api/api';

/**
 * Auth Slice - User authentication state management
 */

// Load user from localStorage on init
const loadUserFromStorage = () => {
  try {
    const token = getAuthToken();
    const userKey = import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data';
    const user = localStorage.getItem(userKey);
    if (token && user) {
      return { token, user: JSON.parse(user) };
    }
  } catch (error) {
    console.error('Error loading user from storage:', error);
  }
  return { token: null, user: null };
};

const { token: storedToken, user: storedUser } = loadUserFromStorage();

const initialState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
};

// Helper to extract a useful error message from various error shapes
const extractErrorMessage = (err) => {
  if (!err) return 'An error occurred';
  if (typeof err === 'string') return err;
  // If API threw response.data directly, that may contain message or error
  if (err.message && typeof err.message === 'string') return err.message;
  if (err.error && typeof err.error === 'string') return err.error;
  if (err.msg && typeof err.msg === 'string') return err.msg;
  if (err.message && typeof err.message !== 'string') return JSON.stringify(err.message);
  if (err.data) {
    const d = err.data;
    if (d.message) return d.message;
    if (d.error) return d.error;
    return JSON.stringify(d);
  }
  if (err.response && err.response.data) {
    const d = err.response.data;
    if (d.message) return d.message;
    if (d.error) return d.error;
    return JSON.stringify(d);
  }
  return 'An error occurred';
};

// ============================================================================
// Async Thunks
// ============================================================================

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.auth.register(userData);
      return response;
    } catch (error) {
      const message = extractErrorMessage(error) || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.auth.login(credentials);
      
      // Store in localStorage (token is already set by the API)
      const userKey = import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data';
      if (response.data && response.data.user) {
        localStorage.setItem(userKey, JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      const message = extractErrorMessage(error) || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.auth.getProfile();
      return response;
    } catch (error) {
      const message = extractErrorMessage(error) || 'Failed to get profile';
      return rejectWithValue(message);
    }
  }
);

// ============================================================================
// Slice
// ============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      // Use the centralized logout function
      api.auth.logout();
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      const userKey = import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data';
      localStorage.setItem(userKey, JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data) {
          // Registration successful - user needs to verify email before authentication
          // Don't set isAuthenticated=true here - that should only happen after login
          state.user = null; // Clear any partial user data
          state.token = null; // Clear any token
          state.isAuthenticated = false; // Keep user unauthenticated until email verification and login
        }
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('🔑 Login fulfilled - payload:', action.payload);
        state.loading = false;
        if (action.payload.success && action.payload.data) {
          // Map phone to mobile for consistency
          const userData = {
            ...action.payload.data.user,
            mobile: action.payload.data.user.phone || action.payload.data.user.mobile
          };
          state.user = userData;
          state.token = action.payload.data.token;
          state.isAuthenticated = true;
          console.log('✅ Auth state updated - isAuthenticated:', true, 'user:', userData);
        } else {
          console.warn('⚠️ Login response structure unexpected:', action.payload);
        }
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      });

    // Get Profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.success && action.payload.data) {
          // Map phone to mobile for consistency
          const userData = {
            ...action.payload.data,
            mobile: action.payload.data.phone || action.payload.data.mobile
          };
          state.user = userData;
          
          // Update localStorage to keep it in sync
          const userKey = import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data';
          localStorage.setItem(userKey, JSON.stringify(userData));
        }
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to get profile';
      });
  },
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
