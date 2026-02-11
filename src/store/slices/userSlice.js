import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

/**
 * User Slice - User profile and admin functionality state management
 */

const initialState = {
  profile: null,
  users: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
};

// ============================================================================
// Async Thunks
// ============================================================================

export const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.user.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { dispatch, rejectWithValue }) => {
    try {
      console.log("triggred");
      const response = await api.user.updateProfile(profileData);
      
      // If update was successful, also update the auth state to keep it in sync
      if (response.data && response.data.data) {
        // Use a dynamic import to avoid circular dependency
        const authActions = await import('./authSlice');
        if (authActions && authActions.updateUser) {
          dispatch(authActions.updateUser(response.data.data));
        }
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update profile');
    }
  }
);

export const createSuperAdmin = createAsyncThunk(
  'user/createSuperAdmin',
  async (adminData, { rejectWithValue }) => {
    try {
      const response = await api.user.createSuperAdmin(adminData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create super admin');
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.user.getAllUsers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const updateUserRole = createAsyncThunk(
  'user/updateUserRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const response = await api.user.updateUserRole(userId, role);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user role');
    }
  }
);

export const updateUserCredits = createAsyncThunk(
  'user/updateUserCredits',
  async ({ userId, credits }, { rejectWithValue }) => {
    try {
      const response = await api.user.updateUserCredits(userId, credits);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user credits');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.user.deleteUser(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

// ============================================================================
// Slice
// ============================================================================

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearProfile: (state) => {
      state.profile = null;
    },
    updateProfileInState: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.data;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.data;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Super Admin
      .addCase(createSuperAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSuperAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload.data);
      })
      .addCase(createSuperAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch All Users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update User Role
      .addCase(updateUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(user => user._id === action.payload.data._id);
        if (index !== -1) {
          state.users[index] = action.payload.data;
        }
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update User Credits
      .addCase(updateUserCredits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserCredits.fulfilled, (state, action) => {
        state.loading = false;
        // Update will be reflected when users are refetched
      })
      .addCase(updateUserCredits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter(user => user._id !== action.meta.arg);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserError, clearProfile, updateProfileInState } = userSlice.actions;

// Selectors
export const selectProfile = (state) => state.user.profile;
export const selectUsers = (state) => state.user.users;
export const selectUserPagination = (state) => state.user.pagination;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;

export default userSlice.reducer;