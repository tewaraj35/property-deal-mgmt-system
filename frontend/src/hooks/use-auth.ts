import { useAuthStore } from "../stores/auth-store";
import { UserRole } from "../types";

/**
 * Custom hook for accessing auth state and methods
 */
export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    setUser,
    setToken,
    setIsLoading,
    hasRole,
    hasPermission,
    logout,
  } = useAuthStore();

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const isAgent = user?.role === UserRole.AGENT;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  // Load auth state from localStorage on first load
  if (!isLoading && !user && !token) {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("authToken");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        logout();
      }
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isAdmin,
    isAgent,
    isSuperAdmin,
    setUser,
    setToken,
    setIsLoading,
    hasRole,
    hasPermission,
    logout,
  };
};
