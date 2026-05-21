import axios, { type AxiosInstance, AxiosError } from "axios";
import { envConfig } from "./env-config";
import { type ApiResponse, ApiError } from "../types";

/**
 * Create and configure Axios instance for API calls
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: envConfig.apiBaseUrl,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  // Request interceptor - attach auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiResponse>) => {
      if (error.response?.status === 401) {
        // Token expired or invalid - redirect to login
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const apiClient = createApiClient();

/**
 * List request wrapper — returns { data, meta } for paginated endpoints
 */
export const makeListRequest = async <T = any>(
  endpoint: string
): Promise<{ data: T[]; meta: any }> => {
  try {
    const response = await apiClient.get<ApiResponse<T[]>>(endpoint);
    if (response.data.status === "error") {
      throw new Error(response.data.error?.message || "Unknown error");
    }
    return { data: (response.data.data as T[]) ?? [], meta: (response.data as any).meta ?? {} };
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error?.code || "REQUEST_FAILED",
        error.response?.status || 500,
        error.response?.data?.error?.message || error.message
      );
    }
    throw error;
  }
};

/**
 * Generic API request wrapper with typing
 */
export const makeRequest = async <T = any>(
  method: "get" | "post" | "put" | "delete" | "patch",
  endpoint: string,
  data?: any,
  config?: any
): Promise<T> => {
  try {
    const response = await apiClient[method]<ApiResponse<T>>(endpoint, data, config);

    if (response.data.status === "error") {
      throw new Error(response.data.error?.message || "Unknown error");
    }

    return response.data.data as T;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ApiError(
        error.response?.data?.error?.code || "REQUEST_FAILED",
        error.response?.status || 500,
        error.response?.data?.error?.message || error.message
      );
    }
    throw error;
  }
};
