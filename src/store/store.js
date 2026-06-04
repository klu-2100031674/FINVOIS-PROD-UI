import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import walletReducer from './slices/walletSlice';
import reportReducer from './slices/reportSlice';
import templateReducer from './slices/templateSlice';
import userReducer from './slices/userSlice';
import draftsReducer from './slices/draftSlice';
import serviceReducer from './slices/serviceSlice';
import formReducer from './slices/formSlice';
import adminServiceReducer from './slices/adminServiceSlice';
import leadSliceReducer from './slices/leadSlice';
import leadAuthReducer from './slices/leadAuthSlice';
import leadAnalyticsReducer from './slices/leadAnalyticsSlice';
import franchiseReducer from './slices/franchiseSlice';

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
    drafts: draftsReducer,
    services: serviceReducer,
    form: formReducer,
    adminService: adminServiceReducer,
    lead: leadSliceReducer,
    leadAuth: leadAuthReducer,
    leadAnalytics: leadAnalyticsReducer,
    franchise: franchiseReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // For handling dates and complex objects
    }),
  devTools: import.meta.env.DEV, // Enable Redux DevTools in development only
});

export default store;
