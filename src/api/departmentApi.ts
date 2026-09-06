import { api } from './axiosClient'
import type { ApiResponse, Department } from '../types'

export async function getDepartments(): Promise<Department[]> {
  const response = await api.get<ApiResponse<Department[]>>('/departments')
  return response.data.data
}
