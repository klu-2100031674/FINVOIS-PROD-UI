import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import walletReducer from './slices/walletSlice';
import reportReducer from './slices/reportSlice';
import templateReducer from './slices/templateSlice';
import userReducer from './slices/userSlice';

/**
 * Redux Store Configuration
 * Combines all slices and configures middleware
 */

const store = configureStore({
  reducer: {
    auth: authReducer,
    wallet: walletReducer,
    report: reportReducer,
    template: templateReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // For handling dates and complex objects
    }),
  devTools: import.meta.env.DEV, // Enable Redux DevTools in development only
});

export default store;
