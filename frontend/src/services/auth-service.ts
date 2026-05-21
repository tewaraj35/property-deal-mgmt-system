import { apiClient, makeRequest } from "../utils/api-client";
import { type User, type AuthPayload, type AuthResponse } from "../types";

/**
 * Frontend Auth Service - handles API calls for authentication
 */
export const authService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    return makeRequest<AuthResponse>(
      "post",
      "/auth/login",
      { email, password }
    );
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    await makeRequest("post", "/auth/logout");
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    return makeRequest<User>("get", "/auth/profile");
  },

  /**
   * Update current user profile
   */
  async updateProfile(data: {
    fullName?: string;
    phoneNumber?: string;
  }): Promise<User> {
    return makeRequest<User>("patch", "/auth/profile", data);
  },

  /**
   * Change password
   */
  async changePassword(newPassword: string): Promise<void> {
    await makeRequest("post", "/auth/change-password", {
      newPassword,
    });
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return makeRequest<{ accessToken: string }>(
      "post",
      "/auth/refresh-token",
      { refreshToken }
    );
  },
};
