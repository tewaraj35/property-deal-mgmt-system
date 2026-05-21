import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET || "",

  // JWT
  jwtTokenExpiry: process.env.JWT_TOKEN_EXPIRY || "7d",
  jwtRefreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || "30d",

  // URLs
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:5000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Validation
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // Validate required env vars
  validate(): void {
    const required = [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_ANON_KEY",
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
  },
};

config.validate();
