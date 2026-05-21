/**
 * Core TypeScript Types for Nesh Property Management System Backend
 * Mirrors frontend types for API consistency
 */

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  AGENT = "AGENT",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  managedById?: string;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken?: string;
  };
}

// ============================================================================
// BUYER TYPES
// ============================================================================

export enum BuyerStatus {
  NEW = "NEW",
  ACTIVE = "ACTIVE",
  CONVERTED = "CONVERTED",
  LOST = "LOST",
  INACTIVE = "INACTIVE",
}

export interface Buyer {
  id: string;
  agentId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  location?: string;
  propertyOfInterest?: string;
  leadSource?: string;
  followUpDate?: string;
  status: BuyerStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateBuyerDTO {
  name: string;
  phoneNumber: string;
  email?: string;
  location?: string;
  propertyOfInterest?: string;
  leadSource?: string;
  followUpDate?: string;
  status?: BuyerStatus;
  notes?: string;
}

export interface UpdateBuyerDTO extends Partial<CreateBuyerDTO> {}

// ============================================================================
// SELLER TYPES
// ============================================================================

export enum SellerStatus {
  NEW = "NEW",
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  LOST = "LOST",
  INACTIVE = "INACTIVE",
}

export interface Seller {
  id: string;
  agentId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  location?: string;
  propertyDetails?: string;
  leadSource?: string;
  followUpDate?: string;
  status: SellerStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateSellerDTO {
  name: string;
  phoneNumber: string;
  email?: string;
  location?: string;
  propertyDetails?: string;
  leadSource?: string;
  followUpDate?: string;
  status?: SellerStatus;
  notes?: string;
}

export interface UpdateSellerDTO extends Partial<CreateSellerDTO> {}

// ============================================================================
// RENTER TYPES
// ============================================================================

export enum RenterStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  EVICTED = "EVICTED",
  MOVED_OUT = "MOVED_OUT",
}

export interface Renter {
  id: string;
  agentId: string;
  tenantName: string;
  propertyAddress: string;
  monthlyRent?: number;
  rentDueDate?: string;
  tenantContact?: string;
  status: RenterStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateRenterDTO {
  tenantName: string;
  propertyAddress: string;
  monthlyRent?: number;
  rentDueDate?: string;
  tenantContact?: string;
  status?: RenterStatus;
  notes?: string;
}

export interface UpdateRenterDTO extends Partial<CreateRenterDTO> {}

// ============================================================================
// LOAN CLIENT TYPES
// ============================================================================

export enum LoanStatus {
  NEW = "NEW",
  PROCESSING = "PROCESSING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CLOSED = "CLOSED",
}

export interface LoanClient {
  id: string;
  agentId: string;
  clientName: string;
  income?: number;
  loanType?: string;
  loanAmount?: number;
  bankName?: string;
  bankerName?: string;
  status: LoanStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateLoanClientDTO {
  clientName: string;
  income?: number;
  loanType?: string;
  loanAmount?: number;
  bankName?: string;
  bankerName?: string;
  status?: LoanStatus;
  notes?: string;
}

export interface UpdateLoanClientDTO extends Partial<CreateLoanClientDTO> {}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

export interface FileUpload {
  id: string;
  uploadedById: string;
  entityType: "buyer" | "seller" | "renter" | "loan_client";
  entityId: string;
  fileName: string;
  filePath: string;
  fileSizeBytes?: number;
  mimeType?: string;
  createdAt: string;
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  status: "success" | "error";
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    page?: number;
    total?: number;
    limit?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// REQUEST CONTEXT (used in middleware)
// ============================================================================

export interface RequestContext {
  userId: string;
  userRole: UserRole;
  userEmail: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
