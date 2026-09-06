import React, { createContext, useContext, useState, useEffect } from 'react';
import authAPI from '../api/auth';
import { getToken, getStoredUser } from '../api/client';
import { ROLES } from '../constants/navigation';

const RoleContext = createContext();

export const normalizeRole = (r) => {
  if (!r) return ROLES.ADMIN;
  const lower = String(r).toLowerCase();
  if (lower === 'stock manager' || lower === 'stock_manager' || lower.includes('manager')) {
    return ROLES.STOCK_MANAGER;
  }
  return ROLES.ADMIN;
};

export const RoleProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(true);

  // Initialize and check current user session
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const currentUser = await authAPI.getMe();
          setUser(currentUser);
        } catch (err) {
          // Token expired or invalid
          authAPI.logout();
          setUser(null);
          setTokenState(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const tokenRes = await authAPI.login(username, password);
    setTokenState(tokenRes.access_token);
    const currentUser = await authAPI.getMe();
    setUser(currentUser);
    return currentUser;
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setTokenState(null);
  };

  const rawRole = user?.role || user?.role_name || (token ? 'admin' : null);
  const activeRole = normalizeRole(rawRole);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    activeRole,
    isAdmin: activeRole === ROLES.ADMIN,
    isStockManager: activeRole === ROLES.STOCK_MANAGER,
    isAuthenticated: !!token,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    return {
      user: null,
      token: null,
      loading: false,
      login: async () => {},
      logout: () => {},
      activeRole: ROLES.ADMIN,
      isAdmin: true,
      isStockManager: false,
      isAuthenticated: false,
    };
  }
  return context;
};

// Backwards-compatible export
export const useAuth = useRole;

// Empty stub for legacy DevRoleSwitcher to prevent import breakage
export const DevRoleSwitcher = () => null;

export default RoleContext;
