import { makeRequest, makeListRequest } from "../utils/api-client";
import type {
  Buyer,
  Seller,
  Renter,
  LoanClient,
  CreateBuyerDTO,
  CreateSellerDTO,
  CreateRenterDTO,
  CreateLoanClientDTO,
} from "../types";

const dateParams = (dateFrom?: string, dateTo?: string) =>
  `${dateFrom ? `&dateFrom=${dateFrom}` : ""}${dateTo ? `&dateTo=${dateTo}` : ""}`

export const buyerService = {
  getAll: (page = 1, limit = 50, status?: string, dateFrom?: string, dateTo?: string) =>
    makeListRequest<Buyer>(`/buyers?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}${dateParams(dateFrom, dateTo)}`),

  getById: (id: string) =>
    makeRequest<Buyer>("get", `/buyers/${id}`),

  create: (data: CreateBuyerDTO) =>
    makeRequest<Buyer>("post", "/buyers", data),

  update: (id: string, data: Partial<CreateBuyerDTO>) =>
    makeRequest<Buyer>("put", `/buyers/${id}`, data),

  delete: (id: string) =>
    makeRequest("delete", `/buyers/${id}`),

  search: (query: string, limit = 20) =>
    makeRequest<Buyer[]>("get", `/buyers/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};

export const sellerService = {
  getAll: (page = 1, limit = 50, status?: string, dateFrom?: string, dateTo?: string) =>
    makeListRequest<Seller>(`/sellers?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}${dateParams(dateFrom, dateTo)}`),

  getById: (id: string) =>
    makeRequest<Seller>("get", `/sellers/${id}`),

  create: (data: CreateSellerDTO) =>
    makeRequest<Seller>("post", "/sellers", data),

  update: (id: string, data: Partial<CreateSellerDTO>) =>
    makeRequest<Seller>("put", `/sellers/${id}`, data),

  delete: (id: string) =>
    makeRequest("delete", `/sellers/${id}`),

  search: (query: string, limit = 20) =>
    makeRequest<Seller[]>("get", `/sellers/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};

export const renterService = {
  getAll: (page = 1, limit = 50, status?: string, dateFrom?: string, dateTo?: string) =>
    makeListRequest<Renter>(`/renters?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}${dateParams(dateFrom, dateTo)}`),

  getById: (id: string) =>
    makeRequest<Renter>("get", `/renters/${id}`),

  create: (data: CreateRenterDTO) =>
    makeRequest<Renter>("post", "/renters", data),

  update: (id: string, data: Partial<CreateRenterDTO>) =>
    makeRequest<Renter>("put", `/renters/${id}`, data),

  delete: (id: string) =>
    makeRequest("delete", `/renters/${id}`),

  search: (query: string, limit = 20) =>
    makeRequest<Renter[]>("get", `/renters/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};

export const loanClientService = {
  getAll: (page = 1, limit = 50, status?: string, dateFrom?: string, dateTo?: string) =>
    makeListRequest<LoanClient>(`/loan-clients?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}${dateParams(dateFrom, dateTo)}`),

  getById: (id: string) =>
    makeRequest<LoanClient>("get", `/loan-clients/${id}`),

  create: (data: CreateLoanClientDTO) =>
    makeRequest<LoanClient>("post", "/loan-clients", data),

  update: (id: string, data: Partial<CreateLoanClientDTO>) =>
    makeRequest<LoanClient>("put", `/loan-clients/${id}`, data),

  delete: (id: string) =>
    makeRequest("delete", `/loan-clients/${id}`),

  search: (query: string, limit = 20) =>
    makeRequest<LoanClient[]>("get", `/loan-clients/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};
