import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getAuthToken, setAuthToken } from '../../api/api';
import { normalizeRoleFromUser } from '../../utils/normalizeUserRole';
import {
  resolveSignupApprovalStatus,
  canAccessApplication
} from '../../utils/signupApproval';

/**
 * Auth Slice - User authentication state management
 */

// The backend has collapsed the legacy `super_admin` role into `admin`.
// This helper guards against older cached user blobs (e.g. localStorage
// from before the refactor) still carrying `role: 'super_admin'`.
const normalizeStoredRole = (user) => {
  if (!user || typeof user !== 'object') return user;
  return { ...user, role: normalizeRoleFromUser(user) };
};

// Load user from localStorage on init
const loadUserFromStorage = () => {
  try {
    const token = getAuthToken();
    const userKey = import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data';
    const user = localStorage.getItem(userKey);
    if (token && user) {
      const parsed = normalizeStoredRole(JSON.parse(user));
      if (!canAccessApplication(parsed)) {
        localStorage.removeItem(userKey);
        localStorage.removeItem('ca_auth_token');
        return { token: null, user: null };
      }
      return { token, user: parsed };
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
      const userKey = import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data';
      const user = response?.data?.user;

      if (user) {
        const normalizedUser = normalizeStoredRole(user);
        const approvalStatus = resolveSignupApprovalStatus(normalizedUser);
        if (approvalStatus !== 'approved') {
          setAuthToken(null);
          localStorage.removeItem(userKey);
          if (approvalStatus === 'rejected') {
            return rejectWithValue(
              'Your registration was not approved. Please contact support.'
            );
          }
          return rejectWithValue('Your account is pending admin approval.');
        }
        response.data.user = normalizedUser;
        localStorage.setItem(userKey, JSON.stringify(normalizedUser));
      }

      return response;
    } catch (error) {
      const message = extractErrorMessage(error) || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (idToken, { rejectWithValue }) => {
    try {
      const response = await api.auth.googleAuth(idToken);
      const userKey = import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data';
      const user = response?.data?.user;

      if (user) {
        const normalizedUser = normalizeStoredRole(user);
        const approvalStatus = resolveSignupApprovalStatus(normalizedUser);
        if (approvalStatus !== 'approved') {
          setAuthToken(null);
          localStorage.removeItem(userKey);
          if (approvalStatus === 'rejected') {
            return rejectWithValue(
              'Your registration was not approved. Please contact support.'
            );
          }
          return rejectWithValue('Your account is pending admin approval.');
        }
        response.data.user = normalizedUser;
        localStorage.setItem(userKey, JSON.stringify(normalizedUser));
      }

      return response;
    } catch (error) {
      const message = extractErrorMessage(error) || 'Google login failed';
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
          const userData = normalizeStoredRole({
            ...action.payload.data.user,
            mobile: action.payload.data.user.phone || action.payload.data.user.mobile
          });

          const approvalStatus = resolveSignupApprovalStatus(userData);

          if (userData.email_verified === false) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = 'Please verify your email address before logging in.';
            localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');
            localStorage.removeItem('ca_auth_token');
          } else if (approvalStatus === 'pending') {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = 'Your account is pending admin approval.';
            localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');
            localStorage.removeItem('ca_auth_token');
          } else if (approvalStatus === 'rejected') {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = 'Your registration was not approved. Please contact support.';
            localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');
            localStorage.removeItem('ca_auth_token');
          } else if (userData.is_active === false) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = 'Your account is disabled. Please contact support.';
            localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');
            localStorage.removeItem('ca_auth_token');
          } else {
            state.user = userData;
            state.token = action.payload.data.token;
            state.isAuthenticated = true;
            state.error = null;
          }
        } else {
          console.warn('Login response structure unexpected:', action.payload);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      });

    // Google Login
    builder
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        console.log('🔑 Google Login fulfilled - payload:', action.payload);
        state.loading = false;
        if (action.payload.success && action.payload.data) {
          const userData = normalizeStoredRole({
            ...action.payload.data.user,
            mobile: action.payload.data.user.phone || action.payload.data.user.mobile
          });

          const approvalStatus = resolveSignupApprovalStatus(userData);

          if (userData.email_verified === false) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = 'Please verify your email address before logging in.';
            localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');
            localStorage.removeItem('ca_auth_token');
          } else if (approvalStatus === 'pending') {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = 'Your account is pending admin approval.';
            localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');
            localStorage.removeItem('ca_auth_token');
          } else if (approvalStatus === 'rejected') {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = 'Your registration was not approved. Please contact support.';
            localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');
            localStorage.removeItem('ca_auth_token');
          } else if (userData.is_active === false) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = 'Your account is disabled. Please contact support.';
            localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data');
            localStorage.removeItem('ca_auth_token');
          } else {
            state.user = userData;
            state.token = action.payload.data.token;
            state.isAuthenticated = true;
            state.error = null;
          }
        }
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Google login failed';
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
          const userData = normalizeStoredRole({
            ...action.payload.data,
            mobile: action.payload.data.phone || action.payload.data.mobile
          });
          if (!canAccessApplication(userData)) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            const userKey = import.meta.env.VITE_USER_STORAGE_KEY || 'ca_user_data';
            localStorage.removeItem(userKey);
            localStorage.removeItem(import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ca_auth_token');
            setAuthToken(null);
            return;
          }
          state.user = userData;
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
