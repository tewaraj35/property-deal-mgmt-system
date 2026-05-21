import { create } from "zustand";
import { type User, UserRole } from "../types";

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  token: localStorage.getItem("authToken"),
  isAuthenticated: !!localStorage.getItem("authToken"),
  isLoading: false,

  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  },

  setToken: (token) => {
    set({ token, isAuthenticated: !!token });
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  },

  setIsLoading: (loading) => set({ isLoading: loading }),

  hasRole: (role: UserRole) => {
    const state = get();
    if (!state.user) return false;
    return state.user.role === role;
  },

  hasPermission: (resource: string, action: string) => {
    const state = get();
    if (!state.user) return false;

    // Super admin has all permissions
    if (state.user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Simple permission check - can be expanded later
    // For now: admin can do most things, agent has limited access
    if (state.user.role === UserRole.ADMIN) {
      return resource !== "users" || action !== "delete";
    }

    if (state.user.role === UserRole.AGENT) {
      return ["buyers", "sellers", "renters", "loan_clients"].includes(resource);
    }

    return false;
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },
}));
