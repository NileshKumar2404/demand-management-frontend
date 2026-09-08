import { api } from './axiosClient'
import type { ApiResponse, Department } from '../types'

export async function getDepartments(): Promise<Department[]> {
  const response = await api.get<ApiResponse<Department[]>>('/departments')
  return response.data.data
}

export async function seedDepartments(): Promise<Department[]> {
  const response = await api.post<ApiResponse<Department[]>>('/admin/seed-departments')
  return response.data.data
}
