/**
 * Frontend environment configuration utility
 */

interface EnvConfig {
  apiBaseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  appName: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

const getEnvConfig = (): EnvConfig => {
  return {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    appName: import.meta.env.VITE_APP_NAME || "Nesh Property Management",
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };
};

export const envConfig = getEnvConfig();
