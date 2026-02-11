import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import {
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  login,
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

  const handleRegister = async (userData) => {
    return dispatch(register(userData)).unwrap();
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleGetProfile = async () => {
    return dispatch(getProfile()).unwrap();
  };

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
    register: handleRegister,
    logout: handleLogout,
    getProfile: handleGetProfile,
    refreshUser: handleGetProfile, // Alias for getProfile
    updateUser: handleUpdateUser,
    clearError: handleClearError,
  };
};

export default useAuth;
