import apiClient from './client'
import type { Department } from '../types'

export async function getDepartments(): Promise<Department[]> {
  const response = await apiClient.get('/departments')
  return response.data?.data ?? response.data
}
