import { makeRequest } from '../utils/api-client'
import { type User } from '../types'

export const userService = {
  getAll: (page = 1, limit = 50, role?: string) =>
    makeRequest<any>('get', `/users?page=${page}&limit=${limit}${role ? `&role=${role}` : ''}`),

  getById: (id: string) =>
    makeRequest<User>('get', `/users/${id}`),

  update: (id: string, data: Partial<Pick<User, 'status' | 'role' | 'fullName' | 'phoneNumber'>>) =>
    makeRequest<User>('put', `/users/${id}`, data),

  delete: (id: string) =>
    makeRequest('delete', `/users/${id}`),
}
