import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  login,
  googleLogin,
  register,
  logout,
  getProfile,
  clearError,
  updateUser,
} from '../store/slices/authSlice';

/**
 * Custom hook for authentication
 * Provides auth state and actions
 */
const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector(selectAuth);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Actions
  const handleLogin = async (credentials) => {
    return dispatch(login(credentials)).unwrap();
  };

  const handleGoogleLogin = async (idToken) => {
    return dispatch(googleLogin(idToken)).unwrap();
  };

  const handleRegister = async (userData) => {
    return dispatch(register(userData)).unwrap();
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleGetProfile = useCallback(async () => {
    return dispatch(getProfile()).unwrap();
  }, [dispatch]);

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleUpdateUser = (userData) => {
    dispatch(updateUser(userData));
  };

  return {
    user,
    isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    login: handleLogin,
    googleLogin: handleGoogleLogin,
    register: handleRegister,
    logout: handleLogout,
    getProfile: handleGetProfile,
    refreshUser: handleGetProfile, // Alias for getProfile
    updateUser: handleUpdateUser,
    clearError: handleClearError,
  };
};

export default useAuth;
