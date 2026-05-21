import { supabaseAdmin, supabaseAuth } from "./supabase-service";
import { config } from "../utils/env-config";
import jwt from "jsonwebtoken";
import { User, UserRole, ApiError } from "../types";

/**
 * Authentication service - handles login, signup, and token management
 */
export const authService = {
  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<{
    user: User;
    tokens: { accessToken: string };
  }> {
    // Authenticate with Supabase Auth (use separate client to avoid polluting the admin DB client's session)
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new ApiError("INVALID_CREDENTIALS", 401, "Invalid email or password");
    }

    // Get user profile from users table (uses service-role client, bypasses RLS)
    const userProfile = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (userProfile.error || !userProfile.data) {
      throw new ApiError("PROFILE_NOT_FOUND", 404, "User profile not found. Please contact your administrator.");
    }

    const profile = userProfile.data;

    // Generate JWT token
    const accessToken = jwt.sign(
      {
        sub: data.user.id,
        email: data.user.email,
        role: profile.role,
      },
      config.supabaseJwtSecret,
      { expiresIn: config.jwtTokenExpiry as any }
    );

    const user: User = {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      phoneNumber: profile.phone_number,
      role: profile.role as UserRole,
      status: profile.status,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      lastLogin: profile.last_login,
    };

    // Update last login
    await supabaseAdmin
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.user.id);

    return {
      user,
      tokens: { accessToken },
    };
  },

  /**
   * Register new user (admin only)
   */
  async signUp(
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string,
    role: UserRole = UserRole.AGENT
  ): Promise<User> {
    // Create auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new Error("Failed to create user");
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          id: data.user.id,
          email,
          full_name: fullName,
          phone_number: phoneNumber,
          role,
          status: "ACTIVE",
        },
      ])
      .select()
      .single();

    if (profileError) {
      throw new Error("Failed to create user profile");
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      phoneNumber: profile.phone_number,
      role: profile.role,
      status: profile.status,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  },

  /**
   * Verify JWT token and extract user info
   */
  verifyToken(token: string): {
    userId: string;
    email: string;
    role: UserRole;
  } {
    const decoded = jwt.verify(token, config.supabaseJwtSecret) as any;
    return {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role || UserRole.AGENT,
    };
  },

  /**
   * Refresh JWT token
   */
  refreshToken(token: string): string {
    const decoded = this.verifyToken(token);
    return jwt.sign(
      {
        sub: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
      config.supabaseJwtSecret,
      { expiresIn: config.jwtTokenExpiry as any }
    );
  },

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      throw new Error("User not found");
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      phoneNumber: data.phone_number,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastLogin: data.last_login,
    };
  },

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    updates: { fullName?: string; phoneNumber?: string }
  ): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        full_name: updates.fullName,
        phone_number: updates.phoneNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error("Failed to update profile");
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      phoneNumber: data.phone_number,
      role: data.role,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastLogin: data.last_login,
    };
  },

  /**
   * Change user password
   */
  async changePassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw new Error("Failed to change password");
    }
  },
};
